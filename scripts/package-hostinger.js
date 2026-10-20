const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Packaging Next.js Standalone for Hostinger ===');

const projectRoot = path.resolve(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const staticSrc = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(projectRoot, 'public');
const publicDest = path.join(standaloneDir, 'public');

if (!fs.existsSync(standaloneDir)) {
    console.error('Error: .next/standalone does not exist. Please run "npm run build" first.');
    process.exit(1);
}

// 1. Copy public directory
console.log('1. Copying public/ into .next/standalone/public/ ...');
fs.cpSync(publicSrc, publicDest, { recursive: true });

// 2. Copy .next/static directory
console.log('2. Copying .next/static/ into .next/standalone/.next/static/ ...');
fs.cpSync(staticSrc, staticDest, { recursive: true });

// 3. Create .env.production template in standalone (safe values)
console.log('3. Preparing environment configuration ...');
const envLocalPath = path.join(projectRoot, '.env.local');
const envDestPath = path.join(standaloneDir, '.env.production');
if (fs.existsSync(envLocalPath)) {
    fs.copyFileSync(envLocalPath, envDestPath);
    console.log('   Copied .env.local to .next/standalone/.env.production');
}

console.log('=== Packaging complete! ===');
console.log('Deployment directory is ready at: .next/standalone');
console.log('To run on Hostinger: "node server.js" with Node.js 20+');
