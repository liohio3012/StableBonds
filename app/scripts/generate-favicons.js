const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Brand logo SVG source designed specifically for Favicon (High contrast, dark background squircle)
const faviconSvg = `
<svg width="512" height="512" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Rounded squircle representing the Swiss Monolithic vault -->
  <rect x="1" y="1" width="30" height="30" rx="7.5" fill="#18181b" stroke="#27272a" stroke-width="0.8" />
  
  <!-- Continuous yield-bearing connection loop -->
  <path
    d="M10 13C10 11.3431 11.3431 10 13 10H18C20.2091 10 22 11.7909 22 14C22 16.2091 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22C10 24.2091 11.7909 26 14 26H19C20.6569 26 22 24.6569 22 23"
    stroke="#ffffff"
    stroke-width="3.2"
    stroke-linecap="round"
  />
  
  <!-- Emerald yield execution marker (precision trigger) -->
  <circle cx="19" cy="23" r="2.2" fill="#059669" />
  
  <!-- Accented neutral node -->
  <circle cx="13" cy="10" r="2.2" fill="#a3a3a3" />
</svg>
`;

// Safari Pinned Tab SVG (Must be monochrome flat vector, no colors, no fills on shape context)
const safariSvg = `
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M10 13C10 11.3431 11.3431 10 13 10H18C20.2091 10 22 11.7909 22 14C22 16.2091 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22C10 24.2091 11.7909 26 14 26H19C20.6569 26 22 24.6569 22 23"
    fill="none"
    stroke="#000000"
    stroke-width="3.2"
    stroke-linecap="round"
  />
  <circle cx="19" cy="23" r="2.2" fill="#000000" />
  <circle cx="13" cy="10" r="2.2" fill="#000000" />
</svg>
`;

// Manifest definition
const manifest = {
  name: "StableBonds Corporate Treasury",
  short_name: "StableBonds",
  icons: [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  theme_color: "#18181b",
  background_color: "#fafafa",
  display: "standalone",
  start_url: "/app"
};

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Function to pack multiple PNGs into a single ICO file (standard format)
function createIco(pngBuffers, sizes) {
  const HEADER_SIZE = 6;
  const ENTRY_SIZE = 16;
  
  const header = Buffer.alloc(HEADER_SIZE);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images
  
  const entries = [];
  const imageDatas = [];
  
  let currentOffset = HEADER_SIZE + ENTRY_SIZE * pngBuffers.length;
  
  for (let i = 0; i < pngBuffers.length; i++) {
    const buffer = pngBuffers[i];
    const size = sizes[i];
    
    const entry = Buffer.alloc(ENTRY_SIZE);
    entry.writeUInt8(size, 0); // Width
    entry.writeUInt8(size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Image offset
    
    entries.push(entry);
    imageDatas.push(buffer);
    
    currentOffset += buffer.length;
  }
  
  return Buffer.concat([header, ...entries, ...imageDatas]);
}

async function main() {
  console.log('Starting favicon suite generation...');
  const svgBuffer = Buffer.from(faviconSvg);
  
  // 1. Generate standalone PNGs
  const pngSizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon-48x48.png': 48,
    'favicon-64x64.png': 64,
    'favicon-128x128.png': 128,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512
  };
  
  const icoBuffers = [];
  const icoSizes = [16, 32, 48];
  
  for (const [filename, size] of Object.entries(pngSizes)) {
    const destPath = path.join(PUBLIC_DIR, filename);
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
      
    fs.writeFileSync(destPath, pngBuffer);
    console.log(`Generated: ${filename} (${size}x${size})`);
    
    if (icoSizes.includes(size)) {
      icoBuffers.push(pngBuffer);
    }
  }
  
  // 2. Generate multi-resolution favicon.ico
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  const icoFileBuffer = createIco(icoBuffers, icoSizes);
  fs.writeFileSync(icoPath, icoFileBuffer);
  console.log('Generated: favicon.ico (containing 16x16, 32x32, 48x48 layers)');
  
  // 3. Write Safari Pinned Tab SVG
  const safariPath = path.join(PUBLIC_DIR, 'safari-pinned-tab.svg');
  fs.writeFileSync(safariPath, safariSvg.trim());
  console.log('Generated: safari-pinned-tab.svg');
  
  // 4. Write Web Manifest
  const manifestPath = path.join(PUBLIC_DIR, 'site.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Generated: site.webmanifest');
  
  console.log('Favicon generation completed successfully!');
}

main().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
