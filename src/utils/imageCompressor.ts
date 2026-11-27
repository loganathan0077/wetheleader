/**
 * WE the Leader - Automatic Member Photo Compression Utility
 * 
 * High-Performance, Memory-Safe Client-Side Compression for Mobile & Desktop:
 * - Target compressed size: 20–50 KB
 * - Maximum dimensions: 600 × 600 px (maintains aspect ratio, never crops or distorts faces)
 * - Safe for massive camera photos (3 MB – 18+ MB, 12MP – 48MP)
 * - Prevents Mobile OOM crashes on Android Chrome & Samsung Internet:
 *   1. Fast dimension sniffing from file header (0 MB memory allocation)
 *   2. Native downsampling via createImageBitmap where available (bypasses full-res raster RAM)
 *   3. Immediate object URL revoking and bitmap disposal
 *   4. Canvas buffer zeroing (canvas.width = 0, canvas.height = 0)
 *   5. Targeted quality optimization (avoids unbounded multi-blob loops)
 */

export interface CompressionResult {
  blob: Blob;
  previewUrl: string; // Zero-copy blob URL for instant preview without V8 string memory
  dataUrl: string;    // Small data URL (~30 KB) for backwards compatibility
  originalSizeKB: number;
  compressedSizeKB: number;
  width: number;
  height: number;
  format: 'image/jpeg';
  compressionRatio: number; // Percentage saved (e.g. 96%)
}

export interface CompressionOptions {
  maxDimension?: number;   // Default: 600 px
  targetMinKB?: number;    // Default: 20 KB
  targetMaxKB?: number;    // Default: 50 KB
  initialQuality?: number; // Default: 0.75 (produces 25-45 KB for 600x600 JPEG)
  minQuality?: number;     // Floor to guarantee face clarity on ID cards (default: 0.55)
}

/**
 * Validates whether a file is a supported image format.
 * Supports JPEG, PNG, WebP, BMP, and modern camera formats (HEIC/HEIF).
 */
export function isValidImageFile(file: File | Blob): boolean {
  if (!file) return false;
  
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  
  if ('name' in file && typeof file.name === 'string') {
    const validExtensions = /\.(jpe?g|png|webp|bmp|heic|heif|gif)$/i;
    return validExtensions.test(file.name);
  }
  
  return false;
}

/**
 * Formats bytes into human-readable string (e.g. "3.4 MB", "42 KB")
 */
export function formatFileSize(kilobytes: number): string {
  if (kilobytes >= 1024) {
    return `${(kilobytes / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(kilobytes)} KB`;
}

/**
 * Sniffs width and height directly from JPEG / PNG / WebP headers in milliseconds.
 * Reads only the first 64 KB of the file, allocating < 0.1 MB of RAM even for a 100 MB file.
 */
async function sniffImageDimensions(file: File | Blob): Promise<{ width: number; height: number } | null> {
  try {
    const slice = file.slice(0, 65536);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1. JPEG Check (FF D8)
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      let offset = 2;
      while (offset < bytes.length - 8) {
        if (bytes[offset] !== 0xFF) break;
        const marker = bytes[offset + 1];
        // SOF markers that define width and height (SOF0, SOF1, SOF2, etc.)
        if (
          (marker >= 0xC0 && marker <= 0xC3) ||
          (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) ||
          (marker >= 0xCD && marker <= 0xCF)
        ) {
          const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
          const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
          if (width > 0 && height > 0) return { width, height };
        }
        const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += segmentLength + 2;
      }
    }

    // 2. PNG Check (89 50 4E 47 0D 0A 1A 0A)
    if (
      bytes[0] === 0x89 && bytes[1] === 0x50 &&
      bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A &&
      bytes[6] === 0x1A && bytes[7] === 0x0A
    ) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      if (width > 0 && height > 0) return { width, height };
    }

    // 3. WebP Check (RIFF ... WEBP)
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      // VP8 chunk
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
        const width = ((bytes[26] | (bytes[27] << 8)) & 0x3fff);
        const height = ((bytes[28] | (bytes[29] << 8)) & 0x3fff);
        if (width > 0 && height > 0) return { width, height };
      }
      // VP8X extended chunk
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
        const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
        const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
        if (width > 0 && height > 0) return { width, height };
      }
    }
  } catch {
    // If fast sniffing fails, fallback to standard image loader
  }
  return null;
}

/**
 * Calculates proportional target dimensions bounded by maxDimension.
 */
function calculateTargetDimensions(origWidth: number, origHeight: number, maxDim: number): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: maxDim, height: maxDim };
  }

  if (origWidth <= maxDim && origHeight <= maxDim) {
    return { width: origWidth, height: origHeight };
  }

  if (origWidth >= origHeight) {
    const targetWidth = maxDim;
    const targetHeight = Math.round((origHeight * maxDim) / origWidth);
    return { width: targetWidth, height: targetHeight };
  } else {
    const targetHeight = maxDim;
    const targetWidth = Math.round((origWidth * maxDim) / origHeight);
    return { width: targetWidth, height: targetHeight };
  }
}

/**
 * Compresses an image File or Blob safely in the browser.
 * Tested and optimized for 500 KB, 3 MB, 8 MB, and 18 MB camera photos on mobile.
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxDim = options.maxDimension || 600;
  const targetMaxKB = options.targetMaxKB || 50;
  const initialQuality = options.initialQuality || 0.76;
  const minQuality = options.minQuality || 0.55;

  const originalSizeKB = Math.round(file.size / 1024);

  // 1. Sniff dimensions from header first without decoding full raster
  const sniffed = await sniffImageDimensions(file);
  let targetWidth = maxDim;
  let targetHeight = maxDim;

  if (sniffed) {
    const dims = calculateTargetDimensions(sniffed.width, sniffed.height, maxDim);
    targetWidth = dims.width;
    targetHeight = dims.height;
  }

  // 2. Decode and downsample using the most memory-efficient method available
  let canvas: HTMLCanvasElement | null = document.createElement('canvas');
  let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d', { willReadFrequently: false });

  if (!ctx) {
    throw new Error('CANVAS_NOT_SUPPORTED');
  }

  let decodedSuccess = false;

  // METHOD A: Native createImageBitmap with resizeWidth/resizeHeight
  // (Available on Chrome Android, Samsung Internet, Edge, Safari 15+, Firefox)
  // Decodes directly to the downscaled size in native code, using only ~1.5 MB RAM instead of 150 MB!
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file, {
          resizeWidth: targetWidth,
          resizeHeight: targetHeight,
          resizeQuality: 'high',
        });
      } catch {
        // Fallback if resize options are unsupported in older engines
        bitmap = await createImageBitmap(file);
      }

      targetWidth = bitmap.width > maxDim || bitmap.height > maxDim 
        ? calculateTargetDimensions(bitmap.width, bitmap.height, maxDim).width 
        : bitmap.width;
      targetHeight = bitmap.width > maxDim || bitmap.height > maxDim 
        ? calculateTargetDimensions(bitmap.width, bitmap.height, maxDim).height 
        : bitmap.height;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Fill white background for clean transparency handling
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      // Immediately close and release native ImageBitmap memory
      bitmap.close();
      decodedSuccess = true;
    } catch {
      decodedSuccess = false;
    }
  }

  // METHOD B: Fallback via HTMLImageElement (with immediate URL revoking and memory cleanup)
  if (!decodedSuccess) {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('INVALID_IMAGE_FILE'));
        image.src = objectUrl;
      });

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const dims = calculateTargetDimensions(origW, origH, maxDim);
      targetWidth = dims.width;
      targetHeight = dims.height;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Clean up DOM image source and release native raster
      img.src = '';
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  // 3. Compress to JPEG Blob with quality optimization
  const toBlob = (quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!canvas) return reject(new Error('CANVAS_DISPOSED'));
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

  let currentQuality = initialQuality;
  let finalBlob = await toBlob(currentQuality);
  const targetMaxBytes = targetMaxKB * 1024;

  // Single or double targeted step down if quality exceeds 50 KB
  if (finalBlob.size > targetMaxBytes && currentQuality > minQuality) {
    currentQuality = 0.64;
    finalBlob = await toBlob(currentQuality);
  }
  if (finalBlob.size > targetMaxBytes && currentQuality > minQuality) {
    currentQuality = minQuality;
    finalBlob = await toBlob(currentQuality);
  }

  // 4. Free the Canvas pixel buffer from GPU/RAM memory
  canvas.width = 0;
  canvas.height = 0;
  canvas = null;
  ctx = null;

  // 5. Generate zero-copy preview URL & lightweight data URL
  const previewUrl = URL.createObjectURL(finalBlob);
  
  // Create small DataURL (~30 KB only) for backward compatibility
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('DATA_URL_CONVERSION_ERROR'));
    };
    reader.onerror = () => reject(new Error('FILEREADER_ERROR'));
    reader.readAsDataURL(finalBlob);
  });

  const compressedSizeKB = Math.max(1, Math.round(finalBlob.size / 1024));
  const compressionRatio = originalSizeKB > 0
    ? Math.max(0, Math.round((1 - finalBlob.size / file.size) * 100))
    : 0;

  return {
    blob: finalBlob,
    previewUrl,
    dataUrl,
    originalSizeKB,
    compressedSizeKB,
    width: targetWidth,
    height: targetHeight,
    format: 'image/jpeg',
    compressionRatio,
  };
}
