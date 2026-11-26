/**
 * WE the Leader - Automatic Member Photo Compression Utility
 * 
 * Compresses uploaded profile photos in the browser before saving or uploading:
 * - Target compressed size: 20–50 KB
 * - Maximum dimensions: 600 × 600 px (preserving aspect ratio without cropping/stretching)
 * - Format: JPEG (100% universal compatibility for CR80 ID cards, canvas, and printing)
 * - Preserves face clarity: Quality floor prevents aggressive compression from causing blur
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  width: number;
  height: number;
  format: 'image/jpeg';
  compressionRatio: number; // Percentage saved (e.g. 92%)
}

export interface CompressionOptions {
  maxDimension?: number;   // Default: 600 px
  targetMinKB?: number;    // Default: 20 KB
  targetMaxKB?: number;    // Default: 50 KB
  initialQuality?: number; // Default: 0.85
  minQuality?: number;     // Quality floor to protect face clarity (default: 0.55)
}

/**
 * Validates whether a file is a supported image format.
 */
export function isValidImageFile(file: File): boolean {
  if (!file) return false;
  
  // Standard MIME type check
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  
  // Extension fallback for camera captures / odd MIME reports
  const validExtensions = /\.(jpe?g|png|webp|bmp|heic|heif|gif)$/i;
  return validExtensions.test(file.name);
}

/**
 * Formats bytes into a human-readable string (e.g. "3.4 MB", "42 KB")
 */
export function formatFileSize(kilobytes: number): string {
  if (kilobytes >= 1024) {
    return `${(kilobytes / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(kilobytes)} KB`;
}

/**
 * Compresses an image File or Blob in the browser using HTML5 Canvas.
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxDim = options.maxDimension || 600;
  const targetMaxKB = options.targetMaxKB || 50;
  const initialQuality = options.initialQuality || 0.85;
  const minQuality = options.minQuality || 0.55;

  const originalSizeKB = Math.round(file.size / 1024);

  // 1. Create an Image object from the file
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('INVALID_IMAGE_FILE'));
    };

    img.src = objectUrl;
  });

  // 2. Compute proportional dimensions without stretching or cropping
  const origWidth = image.naturalWidth || image.width;
  const origHeight = image.naturalHeight || image.height;

  if (origWidth <= 0 || origHeight <= 0) {
    throw new Error('CORRUPT_IMAGE_DIMENSIONS');
  }

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (origWidth > maxDim || origHeight > maxDim) {
    if (origWidth >= origHeight) {
      targetWidth = maxDim;
      targetHeight = Math.round((origHeight * maxDim) / origWidth);
    } else {
      targetHeight = maxDim;
      targetWidth = Math.round((origWidth * maxDim) / origHeight);
    }
  }

  // 3. Render onto Canvas with white background & high-quality smoothing
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('CANVAS_NOT_SUPPORTED');
  }

  // Pre-fill pure white background for PNG transparency conversion
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  // Helper to get blob at a specific quality
  const getBlob = (quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('CANVAS_BLOB_ERROR'));
        },
        'image/jpeg',
        quality
      );
    });
  };

  // 4. Iteratively optimize quality to approach 20–50 KB range
  // Quality will not drop below minQuality (0.55) to guarantee facial features remain sharp
  let currentQuality = initialQuality;
  let blob = await getBlob(currentQuality);
  const targetMaxBytes = targetMaxKB * 1024;

  while (blob.size > targetMaxBytes && currentQuality > minQuality) {
    // Step down quality gracefully
    currentQuality = Math.max(minQuality, +(currentQuality - 0.08).toFixed(2));
    blob = await getBlob(currentQuality);
  }

  // 5. Convert optimized Blob to DataURL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('DATA_URL_CONVERSION_ERROR'));
      }
    };
    reader.onerror = () => reject(new Error('FILEREADER_ERROR'));
    reader.readAsDataURL(blob);
  });

  const compressedSizeKB = Math.max(1, Math.round(blob.size / 1024));
  const compressionRatio = originalSizeKB > 0 
    ? Math.max(0, Math.round((1 - blob.size / file.size) * 100))
    : 0;

  return {
    dataUrl,
    originalSizeKB,
    compressedSizeKB,
    width: targetWidth,
    height: targetHeight,
    format: 'image/jpeg',
    compressionRatio,
  };
}
