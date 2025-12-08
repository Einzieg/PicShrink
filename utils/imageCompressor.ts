import { ProcessingSettings } from '../types';

/**
 * Loads an image file into an HTMLImageElement
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

/**
 * Main processing function that handles Compression, Conversion, and MD5 Modification
 */
export const processImage = async (
  file: File, 
  settings: ProcessingSettings
): Promise<File> => {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  let { width, height } = image;
  
  // 1. Resize Logic (Only for compression mode usually, or if max dims set)
  if (settings.tool === 'compress' && settings.maxWidthOrHeight > 0 && (width > settings.maxWidthOrHeight || height > settings.maxWidthOrHeight)) {
    const ratio = width / height;
    if (ratio > 1) {
      width = settings.maxWidthOrHeight;
      height = width / ratio;
    } else {
      height = settings.maxWidthOrHeight;
      width = height * ratio;
    }
  }

  canvas.width = width;
  canvas.height = height;

  // Draw image to canvas (white background for JPEGs)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  // 2. MD5 Modification Logic
  if (settings.tool === 'md5') {
    // To ensure MD5 changes, we modify a single pixel very slightly.
    // Re-encoding via canvas usually changes MD5 anyway, but this guarantees uniqueness
    // even if the re-encoding is identical.
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const data = imageData.data;
    // Tweak the red channel of the first pixel by 1 value
    // This is invisible to the human eye
    if (data[0] < 255) {
      data[0] += 1;
    } else {
      data[0] -= 1;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const toBlob = (q: number, type: string): Promise<Blob | null> => {
    return new Promise(resolve => canvas.toBlob(resolve, type, q));
  };

  let outputBlob: Blob | null = null;
  const targetFormat = settings.format; // User selected format

  // 3. Process based on Tool Type
  if (settings.tool === 'compress') {
    // --- Compression Logic ---
    const targetBytes = settings.maxSizeKB * 1024;
    
    // For PNG, quality param is ignored in standard toBlob, so we just export.
    // If user wants PNG compression, it's mostly about resizing done above.
    if (targetFormat === 'image/png') {
      outputBlob = await toBlob(1, targetFormat);
    } else {
      // Iterative JPEG/WebP compression
      let minQuality = 0.1;
      let maxQuality = 1.0;
      let iteration = 0;

      while (iteration < 10) {
        const currentQuality = (minQuality + maxQuality) / 2;
        const blob = await toBlob(currentQuality, targetFormat);

        if (!blob) break;

        if (blob.size <= targetBytes) {
          outputBlob = blob;
          minQuality = currentQuality;
        } else {
          maxQuality = currentQuality;
        }
        if (maxQuality - minQuality < 0.05) break;
        iteration++;
      }
      
      // Fallback
      if (!outputBlob) outputBlob = await toBlob(0.5, targetFormat); 
    }
  } else if (settings.tool === 'convert') {
    // --- Conversion Logic ---
    // Just export as target format with high quality
    outputBlob = await toBlob(0.92, targetFormat);
  } else if (settings.tool === 'md5') {
    // --- MD5 Logic ---
    // Export using the original format if possible, or default to JPEG if original is unknown to canvas
    // But settings.format tracks the user preference or we can infer.
    // For MD5 tool, usually we want to keep the same format or convert.
    // Let's use settings.format which defaults to 'image/jpeg' but should probably match input if possible in UI.
    // For now, use the selected format in settings.
    outputBlob = await toBlob(0.95, targetFormat);
  }

  if (!outputBlob) throw new Error('Processing failed');

  // Determine file extension
  let ext = 'jpg';
  if (outputBlob.type === 'image/png') ext = 'png';
  if (outputBlob.type === 'image/webp') ext = 'webp';

  // Construct new filename
  const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
  const suffix = settings.tool === 'md5' ? '_md5' : (settings.tool === 'compress' ? '_min' : '_new');
  
  return new File([outputBlob], `${originalName}${suffix}.${ext}`, {
    type: outputBlob.type,
    lastModified: Date.now(),
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};