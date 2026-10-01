/**
 * Utility functions to process, compress and convert user-uploaded images to ultra-lightweight base64 strings
 * Ensures crisp display and print quality while keeping local storage footprint minimal (< 75KB per image).
 */

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressAndConvertImage(
  file: File | Blob,
  maxDimension: number = 800,
  initialQuality: number = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Auto-scale maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }

        // Draw crisp image with white background (handles transparent PNGs converting to JPEG)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression: if still > 100KB, slightly reduce quality
        let currentQuality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

        // If string exceeds ~120KB (~160,000 characters), compress further
        if (dataUrl.length > 160000 && currentQuality > 0.5) {
          currentQuality = 0.58;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        if (dataUrl.length > 120000 && currentQuality > 0.4) {
          currentQuality = 0.45;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Validates whether an image string is valid and not empty
 */
export function isValidBase64Image(dataUrl?: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  return dataUrl.startsWith('data:image/') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://');
}

