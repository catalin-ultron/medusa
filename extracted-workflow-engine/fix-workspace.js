const fs = require('fs');
const path = require('path');

const packages = ['deps', 'types', 'utils', 'orchestration', 'modules-sdk', 'workflows-sdk'];

for (const pkg of packages) {
  const pkgPath = path.join(__dirname, 'packages', pkg, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  
  const content = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // Convert internal @medusajs/* deps to workspace:*
  const fields = ['dependencies', 'devDependencies', 'peerDependencies'];
  for (const field of fields) {
    if (!content[field]) continue;
    for (const key of Object.keys(content[field])) {
      if (key.startsWith('@medusajs/')) {
        content[field][key] = 'workspace:*';
      }
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2) + '\n');
  console.log('Fixed', pkg);
}

// Add missing root dependencies
const rootPkgPath = path.join(__dirname, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

rootPkg.devDependencies = {
  ...rootPkg.devDependencies,
  'typescript': '^5.6.0',
  '@swc/core': '^1.7.40',
  '@swc/jest': '^0.2.36',
  'jest': '^29.7.0',
  'ts-node': '^10.9.2'
};

fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
console.log('Fixed root package.json');

// Remove stale lockfile
const lockPath = path.join(__dirname, 'pnpm-lock.yaml');
if (fs.existsSync(lockPath)) {
  fs.unlinkSync(lockPath);
  console.log('Removed stale pnpm-lock.yaml');
}

console.log('Done. Now run: pnpm install --no-frozen-lockfile && pnpm build');
