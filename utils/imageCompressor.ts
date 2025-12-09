
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
 * Main processing function that handles Compression, Conversion, MD5, Resize, Crop, Rotate
 */
export const processImage = async (
  file: File, 
  settings: ProcessingSettings
): Promise<File> => {
  const image = await loadImage(file);
  
  // Pipeline Step 1: Determine Dimensions after Rotation
  let srcWidth = image.width;
  let srcHeight = image.height;
  
  // If rotated 90 or 270, swap dimensions for the intermediate canvas
  const isRotated90or270 = settings.tool === 'rotate' && (settings.rotateAngle === 90 || settings.rotateAngle === 270);
  let intermediateWidth = isRotated90or270 ? srcHeight : srcWidth;
  let intermediateHeight = isRotated90or270 ? srcWidth : srcHeight;

  // Pipeline Step 2: Determine Crop Logic (Center Crop)
  // This calculates the source rectangle to take from the (potentially rotated) image.
  // Note: For simplicity in batch processing, we apply rotation first then crop on the result, 
  // or we treat "Crop" tool as an independent step. 
  // If tool is 'crop', we only care about cropping logic on original image (rotation settings ignored unless tool is rotate).
  
  // To keep it clean: We will create a fresh canvas for the final output.
  // We need to calculate: Source X,Y,W,H (on image) and Dest X,Y,W,H (on canvas)
  
  // LOGIC BRANCHING
  // If 'compress', we use simple resize logic.
  // If 'resize', we use explicit resize logic.
  // If 'crop', we calculate aspect ratio crop.
  // If 'rotate', we apply canvas rotation.
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // --- 1. ROTATE / FLIP TOOL ---
  if (settings.tool === 'rotate') {
    canvas.width = intermediateWidth;
    canvas.height = intermediateHeight;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((settings.rotateAngle * Math.PI) / 180);
    
    const scaleH = settings.flipHorizontal ? -1 : 1;
    const scaleV = settings.flipVertical ? -1 : 1;
    ctx.scale(scaleH, scaleV);
    
    // Draw centered
    ctx.drawImage(image, -srcWidth / 2, -srcHeight / 2);
  }
  
  // --- 2. CROP TOOL ---
  else if (settings.tool === 'crop' && settings.cropRatio !== 'original') {
    // Calculate target aspect ratio
    let targetRatio = 1;
    const [rw, rh] = settings.cropRatio.split(':').map(Number);
    if (rw && rh) targetRatio = rw / rh;
    
    const currentRatio = srcWidth / srcHeight;
    
    let cropWidth = srcWidth;
    let cropHeight = srcHeight;
    let cropX = 0;
    let cropY = 0;
    
    if (currentRatio > targetRatio) {
      // Image is wider than target. Crop width.
      cropWidth = srcHeight * targetRatio;
      cropX = (srcWidth - cropWidth) / 2;
    } else {
      // Image is taller than target. Crop height.
      cropHeight = srcWidth / targetRatio;
      cropY = (srcHeight - cropHeight) / 2;
    }
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  }
  
  // --- 3. RESIZE TOOL ---
  else if (settings.tool === 'resize') {
    let finalWidth = srcWidth;
    let finalHeight = srcHeight;

    if (settings.resizeMode === 'percentage') {
      const p = settings.resizePercentage / 100;
      finalWidth = Math.round(srcWidth * p);
      finalHeight = Math.round(srcHeight * p);
    } else {
      // Dimension mode
      if (settings.maintainAspectRatio) {
        // If user provided both, we might respect Width and calc Height, or fit inside?
        // Let's assume Width takes precedence if set > 0, else Height.
        const ratio = srcWidth / srcHeight;
        if (settings.resizeWidth > 0) {
          finalWidth = settings.resizeWidth;
          finalHeight = Math.round(finalWidth / ratio);
        } else if (settings.resizeHeight > 0) {
           finalHeight = settings.resizeHeight;
           finalWidth = Math.round(finalHeight * ratio);
        }
      } else {
         if (settings.resizeWidth > 0) finalWidth = settings.resizeWidth;
         if (settings.resizeHeight > 0) finalHeight = settings.resizeHeight;
      }
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalWidth, finalHeight);
    ctx.drawImage(image, 0, 0, finalWidth, finalHeight);
  }
  
  // --- 4. COMPRESS / CONVERT / MD5 / DEFAULT ---
  else {
    // Standard logic (including 'compress' resize capability)
    let finalWidth = srcWidth;
    let finalHeight = srcHeight;
    
    if (settings.tool === 'compress' && settings.maxWidthOrHeight > 0 && (srcWidth > settings.maxWidthOrHeight || srcHeight > settings.maxWidthOrHeight)) {
      const ratio = srcWidth / srcHeight;
      if (ratio > 1) {
        finalWidth = settings.maxWidthOrHeight;
        finalHeight = finalWidth / ratio;
      } else {
        finalHeight = settings.maxWidthOrHeight;
        finalWidth = finalHeight * ratio;
      }
    }
    
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalWidth, finalHeight);
    ctx.drawImage(image, 0, 0, finalWidth, finalHeight);

    // MD5 Pixel Tweak
    if (settings.tool === 'md5') {
      const imageData = ctx.getImageData(0, 0, 1, 1);
      const data = imageData.data;
      if (data[0] < 255) data[0] += 1; else data[0] -= 1;
      ctx.putImageData(imageData, 0, 0);
    }
  }

  // --- EXPORT ---
  const toBlob = (q: number, type: string): Promise<Blob | null> => {
    return new Promise(resolve => canvas.toBlob(resolve, type, q));
  };

  let outputBlob: Blob | null = null;
  const targetFormat = settings.format;

  if (settings.tool === 'compress') {
     const targetBytes = settings.maxSizeKB * 1024;
     if (targetFormat === 'image/png') {
       outputBlob = await toBlob(1, targetFormat);
     } else {
       // Iterative loop
       let minQ = 0.1, maxQ = 1.0, iter = 0;
       while (iter < 10) {
         const currQ = (minQ + maxQ) / 2;
         const blob = await toBlob(currQ, targetFormat);
         if (!blob) break;
         if (blob.size <= targetBytes) {
           outputBlob = blob;
           minQ = currQ;
         } else {
           maxQ = currQ;
         }
         if (maxQ - minQ < 0.05) break;
         iter++;
       }
       if (!outputBlob) outputBlob = await toBlob(0.5, targetFormat); 
     }
  } else {
    // For Resize, Crop, Rotate, Convert, MD5 - Just high quality export
    outputBlob = await toBlob(0.92, targetFormat);
  }

  if (!outputBlob) throw new Error('Processing failed');

  let ext = 'jpg';
  if (outputBlob.type === 'image/png') ext = 'png';
  if (outputBlob.type === 'image/webp') ext = 'webp';

  const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
  const suffixMap: Record<string, string> = {
    'compress': '_min',
    'convert': '_new',
    'md5': '_safe',
    'resize': '_resized',
    'crop': '_cropped',
    'rotate': '_rotated'
  };
  const suffix = suffixMap[settings.tool] || '_new';
  
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
