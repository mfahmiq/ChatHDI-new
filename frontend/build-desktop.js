const { execSync } = require('child_process');
const path = require('path');

console.log('\n========================================');
console.log('   ChatHDI Desktop Build Script');
console.log('========================================\n');

console.log('[1/3] Building React app...');
try {
  execSync('yarn build', { stdio: 'inherit', cwd: __dirname });
  console.log('✓ React build complete\n');
} catch (error) {
  console.error('✗ React build failed');
  process.exit(1);
}

console.log('[2/3] Packaging Electron app...');
try {
  execSync('yarn electron:build', { stdio: 'inherit', cwd: __dirname });
  console.log('✓ Electron packaging complete\n');
} catch (error) {
  console.error('✗ Electron packaging failed');
  process.exit(1);
}

console.log('========================================');
console.log('   Build Complete!');
console.log('========================================');
console.log('\nOutput files are in: /app/frontend/dist/');
console.log('- ChatHDI-Setup-1.0.0.exe (Windows Installer)');
console.log('- ChatHDI-1.0.0.dmg (macOS)');
console.log('- ChatHDI-1.0.0.AppImage (Linux)\n');
