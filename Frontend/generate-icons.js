import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  const svgPath = path.join(__dirname, 'public', 'icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found!');
    process.exit(1);
  }

  // Generate 192x192
  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-192.png'));
    
  // Generate 512x512
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-512.png'));
    
  // Generate apple-touch-icon (180x180)
  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
