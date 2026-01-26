#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../../black-box/dist/runtime.global.js');
const destDir = path.join(__dirname, '../public');
const destPath = path.join(destDir, 'black-box.js');

try {
  if (fs.existsSync(srcPath)) {
    // Ensure public directory exists
    fs.mkdirSync(destDir, { recursive: true });
    // Copy the file
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied black-box.js to ${destPath}`);
  } else {
    console.warn(`⚠ black-box dist not found at ${srcPath}, skipping copy`);
    console.warn('  Make sure to run: pnpm --filter @careerdriver/black-box build');
  }
} catch (error) {
  console.error('✗ Error copying black-box.js:', error.message);
  process.exit(1);
}
