import {useState, useCallback, useEffect} from 'react';
import {
  imageCompressionService,
  uploadManager,
  imageCacheManager,
  imageFormatOptimizer, 
} from '../services/image';
import type {
  CompressionOptions,
  CompressionResult,
  UploadOptions,
  UploadResult,
  FormatOptimizationOptions,
  FormatOptimizationResult, 
} from '../services/image';

interface UseImageCompressionOptions extends CompressionOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: CompressionResult) => void;
  onError?: (error: Error) => void;
}

export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const compressImage = useCallback(
    async (uri: string, options: UseImageCompressionOptions = {}) => {
      setIsCompressing(true);
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = Math.min(prev + 10, 90);
            options.onProgress?.(newProgress);
            return newProgress;
          });
        }, 100);

        const compressionResult = await imageCompressionService.compressImage(
          uri,
          options,


        clearInterval(progressInterval);
        setProgress(100);
        setResult(compressionResult);
        options.onComplete?.(compressionResult);

      return compressionResult;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Compression failed');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsCompressing(false);
      }
    },
    [],
  );

  const compressBatch = useCallback(
    async (uris: string[], options: CompressionOptions = {}) => {
      setIsCompressing(true);
      setProgress(0);
      setError(null);

      try {
        const results = await imageCompressionService.compressBatch(
          uris,
          options,
        );
        setProgress(100);
        return results;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Batch compression failed');
        setError(error);
        throw error;
      } finally {
        setIsCompressing(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsCompressing(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    compressImage,
    compressBatch,
    isCompressing,
    progress,
    result,
    error,
    reset,
  };
}

interface UseImageUploadOptions extends UploadOptions {
  onUploadProgress?: (progress: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = useCallback(
    async (uri: string, options: UseImageUploadOptions = {}) => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      setResult(null);

      try {
        const uploadResult = await uploadManager.uploadImage(uri, {
          ...options,
          onProgress: progress => {
            setUploadProgress(progress);
            options.onUploadProgress?.(progress);
          },
        });

        setResult(uploadResult);
        options.onComplete?.(uploadResult);


      return uploadResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const uploadBatch = useCallback(
    async (uris: string[], options: UploadOptions = {}) => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const results = await uploadManager.uploadBatch(uris, options);
        setUploadProgress(100);
        return results;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Batch upload failed');
        setError(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const queueUpload = useCallback(
    async (uri: string, options: UploadOptions = {}) => {
      try {
        const queueId = await uploadManager.queueUpload(uri, options);
        return queueId;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to queue upload');
        setError(error);
        throw error;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    uploadImage,
    uploadBatch,
    queueUpload,
    isUploading,
    uploadProgress,
    result,
    error,
    reset,
  };
}

export function useImageCache() {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCacheStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const stats = await imageCacheManager.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cacheImage = useCallback(
    async (uri: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
      await imageCacheManager.cacheImage(uri, priority);
      await loadCacheStats(); // Refresh stats
    },
    [loadCacheStats],
  );

  const prefetchImages = useCallback(
    async (uris: string[], priority: 'low' | 'normal' | 'high' = 'normal') => {
      await imageCacheManager.prefetchImages(uris, priority);
      await loadCacheStats(); // Refresh stats
    },
    [loadCacheStats],
  );

  const clearCache = useCallback(async () => {
    await imageCacheManager.clearCache();
    await loadCacheStats(); // Refresh stats
  }, [loadCacheStats]);

  // Load stats on mount
  useEffect(() => {
    loadCacheStats();
  }, [loadCacheStats]);

  return {
    cacheStats,
    isLoading,
    cacheImage,
    prefetchImages,
    clearCache,
    refreshStats: loadCacheStats,
  };
}

export function useImageOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<FormatOptimizationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const optimizeImage = useCallback(
    async (uri: string, options: FormatOptimizationOptions = {}) => {
      setIsOptimizing(true);
      setError(null);
      setResult(null);

      try {
        const optimizationResult =
          await imageFormatOptimizer.optimizeForPlatform(uri, options);
        setResult(optimizationResult);
        return optimizationResult;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Optimization failed');
        setError(error);
        throw error;
      } finally {
        setIsOptimizing(false);
      }
    },
    [],
  );

  const optimizeBatch = useCallback(
    async (uris: string[], options: FormatOptimizationOptions = {}) => {
      setIsOptimizing(true);
      setError(null);

      try {
        const results = await imageFormatOptimizer.batchOptimize(uris, options);
        return results;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Batch optimization failed');
        setError(error);
        throw error;
      } finally {
        setIsOptimizing(false);
      }
    },
    [],
  );

  const estimateOptimization = useCallback(
    async (uri: string, options: FormatOptimizationOptions = {}) => {
      try {
        return await imageFormatOptimizer.estimateOptimization(uri, options);
      } catch (err) {
        console.error('Failed to estimate optimization:', err);
        return null;
      }
    },
    [],
  );

  const validateImage = useCallback(async (uri: string) => {
    try {
      return await imageFormatOptimizer.validateImage(uri);
    } catch (err) {
      console.error('Failed to validate image:', err);
      return {valid: false, error: 'Validation failed'};
    }
  }, []);

  const reset = useCallback(() => {
    setIsOptimizing(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    optimizeImage,
    optimizeBatch,
    estimateOptimization,
    validateImage,
    isOptimizing,
    result,
    error,
    reset,
  };
}

// Combined hook for complete image processing workflow
export function useImageProcessor() {
  const compression = useImageCompression();
  const upload = useImageUpload();
  const cache = useImageCache();
  const optimization = useImageOptimization();

  const processAndUpload = useCallback(
    async (
      uri: string,
      options: {
        compression?: CompressionOptions;
        upload?: UploadOptions;
        optimization?: FormatOptimizationOptions;
        skipOptimization?: boolean;
        skipCompression?: boolean;
      } = {},
    ) => {
      try {
        let processedUri = uri;

        // Step 1: Optimize format if requested
        if (!options.skipOptimization) {
          const optimizationResult = await optimization.optimizeImage(
            processedUri,
            options.optimization,
          );
          processedUri = optimizationResult.uri;
        }

        // Step 2: Compress if requested
        if (!options.skipCompression) {
          const compressionResult = await compression.compressImage(
            processedUri,
            options.compression,
          );
          processedUri = compressionResult.uri;
        }

        // Step 3: Upload
        const uploadResult = await upload.uploadImage(
          processedUri,
          options.upload,
        );

        // Step 4: Cache the uploaded image
        await cache.cacheImage(uploadResult.url, 'normal');

        return {
          uploadResult,
          compressionResult: compression.result,
          optimizationResult: optimization.result,
        };
      } catch (error) {
        console.error('Image processing workflow failed:', error);
        throw error;
      }
    },
    [compression, upload, cache, optimization],
  );

  return {
    processAndUpload,
    compression,
    upload,
    cache,
    optimization,
  };
}
