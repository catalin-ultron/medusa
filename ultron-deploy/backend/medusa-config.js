import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:3001",
      authCors: process.env.AUTH_CORS || "http://localhost:3001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    { resolve: "@medusajs/product" },
    { resolve: "@medusajs/order" },
    { resolve: "@medusajs/cart" },
    { resolve: "@medusajs/customer" },
    { resolve: "@medusajs/payment" },
    { resolve: "@medusajs/fulfillment" },
    { resolve: "@medusajs/region" },
    { resolve: "@medusajs/tax" },
    { resolve: "@medusajs/currency" },
    { resolve: "@medusajs/store" },
    { resolve: "@medusajs/inventory" },
    { resolve: "@medusajs/stock-location" },
    { resolve: "@medusajs/sales-channel" },
    { resolve: "@medusajs/promotion" },
    { resolve: "@medusajs/pricing" },
    { resolve: "@medusajs/notification" },
    { resolve: "@medusajs/file" },
    { resolve: "@medusajs/api-key" },
    { resolve: "@medusajs/auth" },
    { resolve: "@medusajs/user" },
    { resolve: "@medusajs/workflow-engine-inmemory" },
  ],
})
