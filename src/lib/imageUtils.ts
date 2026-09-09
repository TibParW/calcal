/**
 * Image Utilities for calCal
 * Resizes and compresses images client-side before sending to Gemini API
 * and creates ultra-compact thumbnails for LocalStorage persistence.
 */

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Resize and compress an image file to standard size for AI processing
 * Target max dimension 1024px, JPEG 0.80
 */
export async function compressImageForAnalysis(
  file: File,
  maxDimension = 1024,
  quality = 0.8
): Promise<{ base64: string; mimeType: string }> {
  const dataUrl = await readFileAsDataURL(file);
  return resizeImage(dataUrl, maxDimension, quality);
}

/**
 * Creates an ultra-small micro-thumbnail (max 80px, quality 0.45) ~2-3 KB
 * Ensures minimum storage footprint in LocalStorage
 */
export async function createThumbnail(
  dataUrl: string,
  maxDimension = 80,
  quality = 0.45
): Promise<string> {
  const result = await resizeImage(dataUrl, maxDimension, quality);
  return result.base64;
}

export function resizeImage(
  dataUrl: string,
  maxDimension: number,
  quality: number
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = "image/jpeg";
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      resolve({
        base64: compressedDataUrl,
        mimeType,
      });
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}
