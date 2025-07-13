#!/usr/bin/env node

/**
 * npm postinstall script for gsum-cli
 * Handles post-installation setup and checks
 */

const fs = require('fs');
const path = require('path');

console.log('📦 gsum-cli post-install setup...');

// Install CLI dependencies
const cliDir = path.join(__dirname, '../cli');
const cliPackageJson = path.join(cliDir, 'package.json');

if (fs.existsSync(cliPackageJson)) {
  console.log('✅ CLI dependencies ready');
} else {
  console.log('❌ CLI dependencies missing - this should not happen in npm install');
}

console.log('');
console.log('🎉 gsum-cli installed successfully!');
console.log('');
console.log('🚀 Get started:');
console.log('  gsum --help              # Show all options');
console.log('  gsum                     # Summarize current directory');
console.log('  gsum --focus frontend    # Focus on frontend files');
console.log('  gsum fingerprint         # Quick project overview');
console.log('  gsum interactive         # Guided mode');
console.log('');
console.log('📚 Documentation: https://github.com/jhurray/gsum#readme');
console.log('');