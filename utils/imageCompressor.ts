import { CompressionSettings } from '../types';

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
 * Smart compression algorithm that iteratively adjusts quality and dimensions
 * to fit within a target file size.
 */
export const compressImage = async (
  file: File, 
  settings: CompressionSettings
): Promise<File> => {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  let { width, height } = image;
  
  // Initial resize logic (aspect ratio preservation)
  if (settings.maxWidthOrHeight > 0 && (width > settings.maxWidthOrHeight || height > settings.maxWidthOrHeight)) {
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

  // Draw image to canvas (white background for JPEGs to avoid black transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  // Binary search implementation for Quality
  // We want the highest quality that fits under the maxSizeKB
  let minQuality = 0.1;
  let maxQuality = 1.0;
  let optimalBlob: Blob | null = null;
  let iteration = 0;
  
  // Target bytes
  const targetBytes = settings.maxSizeKB * 1024;

  const toBlob = (q: number): Promise<Blob | null> => {
    return new Promise(resolve => canvas.toBlob(resolve, settings.format, q));
  };

  // If the user wants PNG, quality parameter often ignored by browsers or works differently.
  // For this tool, we default to JPEG/WebP for compression unless strictly required, 
  // but if input is PNG and user forces PNG, size reduction comes purely from resizing.
  if (settings.format === 'image/png') {
    const blob = await toBlob(1);
    if (!blob) throw new Error('Compression failed');
    return new File([blob], file.name, { type: settings.format, lastModified: Date.now() });
  }

  // Iterative approach for JPEG/WebP
  while (iteration < 10) { // Max 10 iterations to prevent infinite loops
    const currentQuality = (minQuality + maxQuality) / 2;
    const blob = await toBlob(currentQuality);

    if (!blob) break;

    if (blob.size <= targetBytes) {
      optimalBlob = blob;
      minQuality = currentQuality; // Try for better quality
    } else {
      maxQuality = currentQuality; // Needs lower quality
    }

    // If gap is small enough, stop
    if (maxQuality - minQuality < 0.05) break;
    
    iteration++;
  }

  // Fallback: if even lowest quality is too big, we might return the lowest quality blob 
  // or (in a more advanced version) recursively resize down.
  // For this scope, we return the best found.
  if (!optimalBlob) {
    // If we couldn't find a fit, try the absolute minimum
    optimalBlob = await toBlob(0.1);
  }

  if (!optimalBlob) throw new Error('Could not compress image');

  return new File([optimalBlob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", {
    type: settings.format,
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