/*
// process_images.js
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash'; // This will work if thumbhash exports it directly

// Helper function to ensure directories exist
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// Main processing function
async function processScreenshots() {
  const outputBaseDir = 'output';
  const distDir = path.join(outputBaseDir, 'dist');
  const outputImagesDir = path.join(distDir, 'images');
  const outputSizesDir = path.join(distDir, 'sizes');
  const jsonOutputPath = path.join(distDir, 'images.json');

  console.log('Ensuring output directories exist...');
  await ensureDir(outputImagesDir);
  await ensureDir(outputSizesDir);

  console.log('Reading screenshots.csv...');
  const csvFilePath = 'screenshots.csv';
  let csvContent;
  try {
    csvContent = await fs.readFile(csvFilePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${csvFilePath}: ${error.message}`);
    console.error("Please ensure 'screenshots.csv' exists in the same directory as the script and contains image paths.");
    console.error("Also ensure the image files listed in the CSV exist, e.g., 'data/images/your_image.png'.");
    return;
  }

  const lines = csvContent.trim().split('\n');
  const imagesData = {};

  console.log(`Found ${lines.length} entries in CSV. Processing...`);

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

    const parts = line.split(',');
    if (parts.length < 2) {
        console.warn(`Skipping malformed line: ${line}`);
        continue;
    }
    const originalImagePath = parts[0].trim();
    const imageName = parts.slice(1).join(',').trim(); // Handle names with commas

    console.log(`\nProcessing: ${imageName} (Path: ${originalImagePath})`);

    try {
      // 1. Generate UUID
      const uuid = crypto.randomUUID();
      console.log(`  UUID: ${uuid}`);

      // 2. Copy the image file to images/<uuid>.png
      const destImageName = `${uuid}.png`;
      const destImagePath = path.join(outputImagesDir, destImageName);
      console.log(`  Copying ${originalImagePath} to ${destImagePath}`);
      await fs.copyFile(originalImagePath, destImagePath);

      // 3. Get original image dimensions
      const originalImage = sharp(originalImagePath);
      const metadata = await originalImage.metadata();
      const originalWidth = metadata.width;
      const originalHeight = metadata.height;
      console.log(`  Original dimensions: ${originalWidth}x${originalHeight}`);

      // 4. Resize the image to 100x100 and output it to sizes/<uuid>_100x100.png
      const resizedImageName = `${uuid}_100x100.png`;
      const destResizedPath = path.join(outputSizesDir, resizedImageName);
      console.log(`  Resizing to 100x100 and saving to ${destResizedPath}`);
      await originalImage
        .resize(100, 100, {
          fit: sharp.fit.fill, // Or 'contain', 'fill', etc. 'cover' is usually good.
        })
        .png() // Ensure output is PNG
        .toFile(destResizedPath);

      // 5. Generate a thumbhash of the 100x100 image
      console.log(`  Generating ThumbHash for ${destResizedPath}`);
      const { data: rgba, info } = await sharp(destResizedPath)
        .ensureAlpha() // ThumbHash expects RGBA
        .raw()
        .toBuffer({ resolveWithObject: true });

      if (info.width > 100 || info.height > 100) {
        console.warn(`  Warning: Resized image for ThumbHash is ${info.width}x${info.height}, not exactly 100x100. This might affect ThumbHash quality or cause errors if the library strictly expects <=100px dimensions.`);
      }

      // If sharp didn't produce exactly 100x100 for raw output somehow,
      // we might need to re-process 'rgba' or re-read with explicit 100x100.
      // However, sharp().resize(100,100) followed by .raw() should give 100x100 pixels.
      
      const thumbhashBytes = rgbaToThumbHash(info.width, info.height, rgba);
      const thumbhashBase64 = Buffer.from(thumbhashBytes).toString('base64');
      console.log(`  ThumbHash (Base64): ${thumbhashBase64.substring(0, 20)}...`);

      // 6. Store data for JSON
      imagesData[imageName] = {
        uuid: uuid,
        ext: ".png",
        width: originalWidth,
        height: originalHeight,
        thumbhash: thumbhashBase64,
      };
    } catch (error) {
      console.error(`  Error processing ${imageName} (${originalImagePath}): ${error.message}`);
      console.error(error.stack); // for more details
    }
  }

  console.log('\nWriting images.json...');
  await fs.writeFile(jsonOutputPath, JSON.stringify(imagesData, null, 2));
  console.log(`Processing complete. Output is in ${distDir}`);
}

// Run the script
processScreenshots().catch(err => {
  console.error("Unhandled error in processScreenshots:", err);
});
*/