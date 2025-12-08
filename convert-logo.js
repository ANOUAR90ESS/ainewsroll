import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function convertLogo() {
  try {
    const inputPath = path.join(__dirname, 'public/android-chrome-512x512.png');
    const outputPath = path.join(__dirname, 'public/logo.webp');
    
    await sharp(inputPath)
      .webp({ quality: 75 })
      .toFile(outputPath);
    
    console.log('✓ Logo converted to WebP successfully');
    console.log(`Output: ${outputPath}`);
  } catch (err) {
    console.error('Error converting logo:', err.message);
  }
}

convertLogo();
