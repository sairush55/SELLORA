const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp 512x512 SVG of SELLORA App Icon
const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#090d16"/>
  <circle cx="360" cy="150" r="160" fill="#059669" fill-opacity="0.25"/>
  <g transform="translate(106, 106) scale(7.5)">
    <!-- Base: Inventory foundation blocks -->
    <rect x="6" y="22" width="12" height="12" rx="2.5" fill="#27272a"/>
    <rect x="22" y="22" width="12" height="12" rx="2.5" fill="#059669"/>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="#3f3f46"/>
    <!-- Intelligence Vector -->
    <path d="M18 18L32 6M32 6H24M32 6V14" stroke="#10b981" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Apex decision node -->
    <circle cx="32" cy="6" r="3.5" fill="#34d399" stroke="#090d16" stroke-width="1.5"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
console.log('Written public/icon.svg');

async function buildPngs() {
  const svgBuffer = Buffer.from(svgIcon);

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');
}

buildPngs().catch(console.error);
