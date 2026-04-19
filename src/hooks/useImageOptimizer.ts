import { useState, useEffect, useCallback } from 'react';

export interface OptimizedImage {
  file: File;
  preview: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

export interface UseImageOptimizerOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Hook для оптимизации изображений перед загрузкой
 * - Ресайз до максимальных размеров
 * - Сжатие с указанием качества
 * - Конвертация в оптимальный формат
 */
export function useImageOptimizer(options: UseImageOptimizerOptions = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'image/jpeg',
  } = options;

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeImage = useCallback(
    async (file: File): Promise<OptimizedImage | null> => {
      if (!file.type.startsWith('image/')) {
        setError('Файл не является изображением');
        return null;
      }

      setIsOptimizing(true);
      setError(null);

      try {
        const originalSize = file.size;

        // Создаем bitmap для работы с изображением
        const imageBitmap = await createImageBitmap(file);
        
        let { width, height } = imageBitmap;

        // Вычисляем новые размеры с сохранением пропорций
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Создаем canvas для ресайза
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Не удалось получить контекст canvas');
        }

        // Рисуем изображение с новым размером
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        // Конвертируем в blob с сжатием
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Не удалось создать blob'));
              }
            },
            format,
            quality
          );
        });

        // Создаем новый File из оптимизированного blob
        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
          type: format,
        });

        const compressedSize = optimizedFile.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        // Создаем preview URL
        const preview = URL.createObjectURL(optimizedFile);

        setIsOptimizing(false);

        return {
          file: optimizedFile,
          preview,
          width,
          height,
          size: compressedSize,
          originalSize,
          compressionRatio,
        };
      } catch (err) {
        console.error('Ошибка оптимизации изображения:', err);
        setError(err instanceof Error ? err.message : 'Ошибка оптимизации');
        setIsOptimizing(false);
        return null;
      }
    },
    [maxWidth, maxHeight, quality, format]
  );

  const optimizeMultipleImages = useCallback(
    async (files: File[]): Promise<OptimizedImage[]> => {
      const results: OptimizedImage[] = [];
      
      for (const file of files) {
        const result = await optimizeImage(file);
        if (result) {
          results.push(result);
        }
      }
      
      return results;
    },
    [optimizeImage]
  );

  // Очистка preview URLs при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем все созданные preview URLs
      // Это должно вызываться извне, когда preview больше не нужны
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    optimizeImage,
    optimizeMultipleImages,
    isOptimizing,
    error,
    clearError,
  };
}
