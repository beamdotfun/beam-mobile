import {Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock react-native-image-resizer since we don't have it installed
const ImageResizer = {
  createResizedImage: async (
    uri: string,
    width: number,
    height: number,
    format: string,
    quality: number,
    rotation: number,
    outputPath?: string,
    keepMeta?: boolean,
    options?: any,
  ) => {
    // Simulate image resizing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock result
    return {
      uri: `${uri}_resized_${width}x${height}_q${quality}`,
      path: `${uri}_resized_${width}x${height}_q${quality}`,
      name: `resized_image_${Date.now()}.${format.toLowerCase()}`,
      size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
      width,
      height,
    };
  },
};

// Mock expo-image-manipulator since we don't have it installed
const manipulateAsync = async (uri: string, actions: any[], options: any) => {
  await new Promise(resolve => setTimeout(resolve, 150));

  return {
    uri: `${uri}_manipulated_webp`,
    width: actions[0]?.resize?.width || 1920,
    height: actions[0]?.resize?.height || 1920,
  };
};

const SaveFormat = {
  WEBP: 'webp',
  JPEG: 'jpeg',
  PNG: 'png',
};

// Mock RNFS for file operations
const RNFS = {
  stat: async (path: string) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      size: Math.floor(Math.random() * 5000000) + 500000, // Random size 500KB-5MB
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date(),
      ctime: new Date(),
    };
  },
};

// Mock analytics function
const analytics = () => ({
  logEvent: (eventName: string, params: any) => {
    console.log(`Analytics: ${eventName}`, params);
  },
});

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
  progressive?: boolean;
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size: number;
  format: string;
  compressionRatio: number;
}

class ImageCompressionService {
  private readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: 'jpeg',
    maintainAspectRatio: true,
    progressive: true,
  };

  private readonly PROFILE_IMAGE_OPTIONS: CompressionOptions = {
    maxWidth: 400,
    maxHeight: 400,
    quality: 90,
    format: 'jpeg',
  };

  private readonly THUMBNAIL_OPTIONS: CompressionOptions = {
    maxWidth: 150,
    maxHeight: 150,
    quality: 70,
    format: 'jpeg',
  };

  async compressImage(
    uri: string,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    const opts = {...this.DEFAULT_OPTIONS, ...options};

    // Get original image info
    const originalInfo = await this.getImageInfo(uri);
    const originalSize = await this.getFileSize(uri);

    // Calculate target dimensions
    const {width, height} = this.calculateDimensions(
      originalInfo.width,
      originalInfo.height,
      opts.maxWidth!,
      opts.maxHeight!,
      opts.maintainAspectRatio!,
    );

    // Compress image
    const compressed = await this.performCompression(uri, width, height, opts);

    // Get compressed size
    const compressedSize = await this.getFileSize(compressed.uri);

    // Create result
    const result: CompressionResult = {
      uri: compressed.uri,
      width,
      height,
      size: compressedSize,
      format: opts.format!,
      compressionRatio: originalSize / compressedSize,
    };

    // Log compression analytics
    this.logCompressionAnalytics(originalSize, result);

    return result;
  }

  async compressForProfile(uri: string): Promise<CompressionResult> {
    return this.compressImage(uri, this.PROFILE_IMAGE_OPTIONS);
  }

  async generateThumbnail(uri: string): Promise<CompressionResult> {
    return this.compressImage(uri, this.THUMBNAIL_OPTIONS);
  }

  async compressBatch(
    uris: string[],
    options: CompressionOptions = {},
  ): Promise<CompressionResult[]> {
    const results = await Promise.all(
      uris.map(uri => this.compressImage(uri, options)),
    );

    return results;
  }

  private async performCompression(
    uri: string,
    width: number,
    height: number,
    options: CompressionOptions,
  ): Promise<{uri: string}> {
    // Use different compression libraries based on platform and format
    if (options.format === 'webp') {
      return this.compressToWebP(uri, width, height, options);
    }

    // Use react-native-image-resizer for JPEG/PNG
    const result = await ImageResizer.createResizedImage(
      uri,
      width,
      height,
      options.format!.toUpperCase() as 'JPEG' | 'PNG',
      options.quality!,
      0, // rotation
      undefined, // outputPath
      false, // keepMeta
      {
        mode: 'contain',
        onlyScaleDown: true,
      },
    );

    return {uri: result.uri};
  }

  private async compressToWebP(
    uri: string,
    width: number,
    height: number,
    options: CompressionOptions,
  ): Promise<{uri: string}> {
    // Use expo-image-manipulator for WebP support
    const result = await manipulateAsync(uri, [{resize: {width, height}}], {
      compress: options.quality! / 100,
      format: SaveFormat.WEBP,
    });

    return {uri: result.uri};
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean,
  ): {width: number; height: number} {
    if (!maintainAspectRatio) {
      return {width: maxWidth, height: maxHeight};
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if needed
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {width: Math.round(width), height: Math.round(height)};
  }

  private async getImageInfo(
    uri: string,
  ): Promise<{width: number; height: number}> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({width, height}),
        error => {
          // Mock fallback for development
          console.warn('Mock image size fallback:', error);
          resolve({width: 1920, height: 1080});
        },
      );
    });
  }

  private async getFileSize(uri: string): Promise<number> {
    try {
      const stat = await RNFS.stat(uri);
      return stat.size;
    } catch (error) {
      // Mock fallback for development
      console.warn('Mock file size fallback:', error);
      return Math.floor(Math.random() * 2000000) + 500000; // 500KB-2.5MB
    }
  }

  private logCompressionAnalytics(
    originalSize: number,
    result: CompressionResult,
  ) {
    const savedBytes = originalSize - result.size;
    const savedPercentage = (savedBytes / originalSize) * 100;

    analytics().logEvent('image_compressed', {
      original_size: originalSize,
      compressed_size: result.size,
      saved_bytes: savedBytes,
      saved_percentage: savedPercentage.toFixed(1),
      compression_ratio: result.compressionRatio.toFixed(2),
      format: result.format,
      dimensions: `${result.width}x${result.height}`,
    });
  }

  // Helper method to estimate compression quality based on file size
  getRecommendedQuality(fileSize: number, targetSize: number): number {
    const ratio = targetSize / fileSize;

    if (ratio >= 0.8) {
      return 95;
    } // High quality for small reductions
    if (ratio >= 0.6) {
      return 85;
    } // Good quality for moderate reductions
    if (ratio >= 0.4) {
      return 75;
    } // Medium quality for significant reductions
    if (ratio >= 0.2) {
      return 60;
    } // Lower quality for aggressive compression
    return 50; // Minimum quality for extreme compression
  }

  // Helper method to get optimal format based on image characteristics
  getOptimalFormat(
    uri: string,
    hasTransparency: boolean = false,
  ): 'jpeg' | 'png' | 'webp' {
    if (hasTransparency) {
      return 'png'; // PNG for images with transparency
    }

    // For photos, JPEG is usually better
    // For graphics/screenshots, PNG might be better
    // WebP offers best compression but limited support
    return 'jpeg'; // Default to JPEG for photos
  }

  // Helper method to validate image before compression
  async validateImage(uri: string): Promise<{valid: boolean; error?: string}> {
    try {
      const info = await this.getImageInfo(uri);
      const size = await this.getFileSize(uri);

      // Check minimum dimensions
      if (info.width < 10 || info.height < 10) {
        return {valid: false, error: 'Image too small'};
      }

      // Check maximum dimensions
      if (info.width > 10000 || info.height > 10000) {
        return {valid: false, error: 'Image too large'};
      }

      // Check file size (50MB limit)
      if (size > 50 * 1024 * 1024) {
        return {valid: false, error: 'File size too large'};
      }

      return {valid: true};
    } catch (error) {
      return {valid: false, error: 'Invalid image file'};
    }
  }
}

export const imageCompressionService = new ImageCompressionService();
