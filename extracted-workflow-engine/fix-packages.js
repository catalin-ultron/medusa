const fs = require('fs');
const path = require('path');

const packages = ['deps', 'types', 'utils', 'orchestration', 'modules-sdk', 'workflows-sdk'];

for (const pkg of packages) {
  const pkgPath = path.join(__dirname, 'packages', pkg, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  
  const content = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // Convert internal @medusajs/* deps to workspace reference
  if (content.dependencies) {
    for (const key of Object.keys(content.dependencies)) {
      if (key.startsWith('@medusajs/')) {
        content.dependencies[key] = '*';
      }
    }
  }
  if (content.devDependencies) {
    for (const key of Object.keys(content.devDependencies)) {
      if (key.startsWith('@medusajs/')) {
        content.devDependencies[key] = '*';
      }
    }
  }

  // Fix: remove unused awilix-manager from orchestration and workflows-sdk
  if (pkg === 'orchestration' || pkg === 'workflows-sdk') {
    if (content.dependencies && content.dependencies['awilix-manager']) {
      delete content.dependencies['awilix-manager'];
      console.log(`Removed awilix-manager from ${pkg}`);
    }
  }

  // Fix: add missing ulid to orchestration (used directly in source)
  if (pkg === 'orchestration') {
    if (!content.dependencies) content.dependencies = {};
    if (!content.dependencies['ulid']) {
      content.dependencies['ulid'] = '^2.3.0';
      console.log(`Added ulid to ${pkg}`);
    }
  }

  // Simplify scripts
  content.scripts = {
    build: 'rm -rf dist && tsc --build'
  };

  // Remove monorepo cruft
  delete content.gitHead;
  delete content.repository;

  fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2) + '\n');
  console.log('Updated', pkgPath);
}

// Fix tsconfig base: disable noUnusedLocals to avoid build errors in types
const basePath = path.join(__dirname, 'tsconfig.base.json');
const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
base.compilerOptions.noUnusedLocals = false;
fs.writeFileSync(basePath, JSON.stringify(base, null, 2) + '\n');
console.log('Updated tsconfig.base.json');

// Add includes to each tsconfig
for (const pkg of packages) {
  const tsconfigPath = path.join(__dirname, 'packages', pkg, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) continue;
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (!tsconfig.include) {
    tsconfig.include = ['src'];
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log('Added include to tsconfig for', pkg);
  }
}
