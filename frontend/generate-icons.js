const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, 'public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Create SVG content
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="300" font-weight="bold" fill="white" text-anchor="middle">H</text>
</svg>`;

async function generateIcons() {
  console.log('Generating ChatHDI icons...\n');

  // Save SVG
  fs.writeFileSync(path.join(iconDir, 'icon.svg'), svgContent);
  console.log('✓ icon.svg');

  // Generate PNG icons for each size
  for (const size of sizes) {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(path.join(iconDir, `icon-${size}x${size}.png`));
    console.log(`✓ icon-${size}x${size}.png`);
  }

  // Generate main icon.png (512x512)
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconDir, 'icon.png'));
  console.log('✓ icon.png (512x512)');

  // Generate ICO for Windows (256x256)
  await sharp(Buffer.from(svgContent))
    .resize(256, 256)
    .png()
    .toFile(path.join(iconDir, 'icon-256.png'));
  console.log('✓ icon-256.png (for Windows)');

  console.log('\n✅ All icons generated successfully!');
  console.log(`   Location: ${iconDir}`);
}

generateIcons().catch(console.error);
