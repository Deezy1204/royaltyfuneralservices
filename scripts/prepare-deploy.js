const fs = require('fs');
const path = require('path');

const STANDALONE_DIR = path.join(__dirname, '..', '.next', 'standalone');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const STATIC_DIR = path.join(__dirname, '..', '.next', 'static');

if (!fs.existsSync(STANDALONE_DIR)) {
  console.error("❌ Standalone directory not found! Build failed or next.config.mjs 'output: standalone' is missing.");
  process.exit(1);
}

const targetPublic = path.join(STANDALONE_DIR, 'public');
const targetStatic = path.join(STANDALONE_DIR, '.next', 'static');

console.log('📦 Preparing standalone deployment folder...');

// Copy /public
if (fs.existsSync(PUBLIC_DIR)) {
  console.log('➡️ Copying public folder...');
  fs.cpSync(PUBLIC_DIR, targetPublic, { recursive: true });
}

// Copy /.next/static
if (fs.existsSync(STATIC_DIR)) {
  console.log('➡️ Copying .next/static folder...');
  fs.cpSync(STATIC_DIR, targetStatic, { recursive: true });
} else {
  console.error("❌ .next/static folder not found. Build might have failed.");
}

console.log('\n✅ Deployment folder is ready!');
console.log(`\n🚀 WHAT TO DO NEXT:`);
console.log(`1. Open the folder: .next/standalone`);
console.log(`2. Zip all the files inside this folder (or drag them directly).`);
console.log(`3. Upload these files to your Spaceship Node.js hosting app root directory.`);
console.log(`4. In Spaceship, ensure your Application Startup File is set to: server.js`);
console.log(`5. Start the Node.js application from your Spaceship dashboard.\n`);
