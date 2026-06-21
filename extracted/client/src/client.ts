import { events } from "fetch-event-stream"
import { stringify } from "qs"
import {
  ClientFetch,
  Config,
  FetchArgs,
  FetchInput,
  FetchStreamResponse,
  Logger,
} from "./types.js"

// We want to explicitly retrieve the base URL instead of relying on relative paths that differ in behavior between browsers.
const getBaseUrl = (passedBaseUrl: string) => {
  if (typeof window === "undefined") {
    return passedBaseUrl
  }

  // If the passed base URL is empty or "/", we use the current origin from the browser.
  if (passedBaseUrl === "" || passedBaseUrl === "/") {
    return window.location.origin
  }

  return passedBaseUrl
}

const toBase64 = (str: string) => {
  if (typeof window !== "undefined") {
    return window.btoa(str)
  }

  return Buffer.from(str).toString("base64")
}

const sanitizeHeaders = (headers: Headers) => {
  return {
    ...Object.fromEntries(headers.entries()),
    authorization: "<REDACTED>",
  }
}

const normalizeRequest = (
  init: FetchArgs | undefined,
  headers: Headers,
  config: Config
): RequestInit | undefined => {
  let body = init?.body
  if (body && headers.get("content-type")?.includes("application/json")) {
    body = JSON.stringify(body)
  }

  // "credentials" is not supported in some environments (eg. on the backend), and it might throw an exception if the field is set.
  const isFetchCredentialsSupported = "credentials" in Request.prototype

  return {
    ...init,
    headers,
    credentials: isFetchCredentialsSupported ? "omit" : undefined,
    ...(body ? { body: body as RequestInit["body"] } : {}),
  } as RequestInit
}

const normalizeResponse = async (resp: Response, reqHeaders: Headers) => {
  if (resp.status >= 300) {
    const jsonError = (await resp.json().catch(() => ({}))) as {
      message?: string
    }
    throw new FetchError(
      jsonError.message ?? resp.statusText,
      resp.statusText,
      resp.status
    )
  }

  // If we requested JSON, we try to parse the response. Otherwise, we return the raw response.
  const isJsonRequest = reqHeaders.get("accept")?.includes("application/json")
  return isJsonRequest ? await resp.json() : resp
}

export class FetchError extends Error {
  status: number | undefined
  statusText: string | undefined

  constructor(message: string, statusText?: string, status?: number) {
    super(message)
    this.statusText = statusText
    this.status = status
  }
}

export class Client {
  public fetch_: ClientFetch
  private config: Config
  private logger: Logger

  constructor(config: Config) {
    this.config = { ...config, baseUrl: getBaseUrl(config.baseUrl) }
    const logger = config.logger || {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    }

    this.logger = {
      ...logger,
      debug: config.debug ? logger.debug : () => {},
    }

    this.fetch_ = this.initClient()
  }

  /**
   * `fetch` closely follows (and uses under the hood) the native `fetch` API. There are, however, few key differences:
   * - Non 2xx statuses throw a `FetchError` with the status code as the `status` property, rather than resolving the promise
   * - You can pass `body` and `query` as objects, and they will be encoded and stringified.
   * - The response gets parsed as JSON if the `accept` header is set to `application/json`, otherwise the raw Response object is returned
   *
   * Since the response is dynamically determined, we cannot know if it is JSON or not. Therefore, it is important to pass `Response` as the return type
   *
   * @param input: FetchInput
   * @param init: FetchArgs
   * @returns Promise<T>
   */
  fetch<T extends any>(input: FetchInput, init?: FetchArgs): Promise<T> {
    return this.fetch_(input, init) as unknown as Promise<T>
  }

  /**
   * `fetchStream` is a helper method to deal with server-sent events. It returns an object with a stream and an abort function.
   * It follows a very similar interface to `fetch`, with the return value being an async generator.
   * The stream is an async generator that yields `ServerSentEventMessage` objects, which contains the event name, stringified data, and few other properties.
   * The caller is responsible for handling `disconnect` events and aborting the stream. The caller is also responsible for parsing the data field.
   *
   * @param input: FetchInput
   * @param init: FetchArgs
   * @returns FetchStreamResponse
   */
  async fetchStream(
    input: FetchInput,
    init?: FetchArgs
  ): Promise<FetchStreamResponse> {
    const abortController = new AbortController()
    const abortFunc = abortController.abort.bind(abortController)

    let res = await this.fetch_(input, {
      ...init,
      signal: abortController.signal,
      headers: { ...init?.headers, accept: "text/event-stream" },
    })

    if (res.ok) {
      return { stream: events(res, abortController.signal), abort: abortFunc }
    }

    return { stream: null, abort: abortFunc }
  }

  protected initClient(): ClientFetch {
    const defaultHeaders = new Headers({
      "content-type": "application/json",
      accept: "application/json",
      ...this.getApiKeyHeader_(),
    })

    this.logger.debug(
      "Initiating client with default headers:\n",
      `${JSON.stringify(sanitizeHeaders(defaultHeaders), null, 2)}\n`
    )

    return async (input: FetchInput, init?: FetchArgs) => {
      const headers = new Headers(defaultHeaders)

      const customHeaders = {
        ...this.config.globalHeaders,
        ...init?.headers,
      }

      // We use `headers.set` in order to ensure headers are overwritten in a case-insensitive manner.
      Object.entries(customHeaders).forEach(([key, value]) => {
        if (value === null) {
          headers.delete(key)
        } else {
          headers.set(key, value)
        }
      })

      let normalizedInput: RequestInfo | URL = input
      if (input instanceof URL || typeof input === "string") {
        const baseUrl = new URL(this.config.baseUrl)
        const fullPath = `${baseUrl.pathname.replace(/\/$/, "")}/${input
          .toString()
          .replace(/^\//, "")}`
        normalizedInput = new URL(fullPath, baseUrl.origin)
        if (init?.query) {
          const params = Object.fromEntries(
            normalizedInput.searchParams.entries()
          )
          const stringifiedQuery = stringify(
            { ...params, ...init.query },
            { skipNulls: true }
          )
          normalizedInput.search = stringifiedQuery
        }
      }

      this.logger.debug(
        "Performing request to:\n",
        `URL: ${normalizedInput.toString()}\n`,
        `Headers: ${JSON.stringify(sanitizeHeaders(headers), null, 2)}\n`
      )

      const fetcher = this.config.fetchFn ?? fetch

      // Any non-request errors (eg. invalid JSON in the response) will be thrown as-is.
      return await fetcher(
        normalizedInput,
        normalizeRequest(init, headers, this.config)
      ).then((resp) => {
        this.logger.debug(`Received response with status ${resp.status}\n`)
        return normalizeResponse(resp, headers)
      })
    }
  }

  protected getApiKeyHeader_ = (): { Authorization: string } | {} => {
    return this.config.apiKey
      ? { Authorization: "Basic " + toBase64(this.config.apiKey + ":") }
      : {}
  }
}