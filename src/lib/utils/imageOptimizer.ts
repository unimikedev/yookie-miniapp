/**
 * Image optimization utilities for client-side compression before upload
 * 
 * Reduces image file size by:
 * - Resizing to max dimensions
 * - Compressing JPEG quality
 * - Converting to WebP when supported
 */

interface OptimizedImageResult {
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

interface ImageOptimizerOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1920) */
  maxHeight?: number;
  /** JPEG/WebP quality 0-1 (default: 0.8) */
  quality?: number;
  /** Output format: 'jpeg' | 'webp' | 'png' (default: 'jpeg') */
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: Required<ImageOptimizerOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpeg',
};

/**
 * Optimize an image file before upload
 * 
 * @param file - The image file to optimize
 * @param options - Optimization options
 * @returns Promise with optimized blob and metadata
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizerOptions = {}
): Promise<OptimizedImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Better quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create optimized image blob'));
            return;
          }
          
          resolve({
            blob,
            originalSize: file.size,
            optimizedSize: blob.size,
            compressionRatio: Math.round((1 - blob.size / file.size) * 100),
            width,
            height,
          });
        },
        opts.format === 'jpeg' ? 'image/jpeg' : opts.format === 'webp' ? 'image/webp' : 'image/png',
        opts.quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Hook for optimizing images with loading state
 */
export function useImageOptimizer() {
  const optimize = async (file: File, options?: ImageOptimizerOptions) => {
    const result = await optimizeImage(file, options);
    return result;
  };
  
  return { optimize };
}

/**
 * Create a File from optimized Blob with proper name
 */
export function blobToFile(blob: Blob, fileName: string, mimeType?: string): File {
  return new File([blob], fileName, {
    type: mimeType || blob.type,
    lastModified: Date.now(),
  });
}
