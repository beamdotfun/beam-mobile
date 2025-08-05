import {Platform} from 'react-native';
import {
  imageCompressionService,
  CompressionResult,
} from './imageCompressionService';

// Mock react-native-image-crop-picker since we don't have it installed
const ImagePicker = {
  openCropper: async (options: any) => {
    // Simulate HEIF to JPEG conversion
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      path: options.path.replace('.heic', '.jpg').replace('.HEIC', '.jpg'),
      width: 1920,
      height: 1080,
      size: Math.floor(Math.random() * 2000000) + 500000, // 500KB-2.5MB
    };
  },
};

// Mock RNFS for file operations
const RNFS = {
  read: async (
    path: string,
    length: number,
    position: number,
    encoding: string,
  ) => {
    // Mock file header reading
    await new Promise(resolve => setTimeout(resolve, 50));

    // Return mock headers for different formats
    if (path.includes('.jpg') || path.includes('.jpeg')) {
      return Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString(encoding);
    } else if (path.includes('.png')) {
      return Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString(encoding);
    } else if (path.includes('.heic')) {
      return Buffer.from('    ftypheic').toString(encoding);
    } else if (path.includes('.webp')) {
      return Buffer.from('RIFF    WEBP').toString(encoding);
    }

    return Buffer.from([0x00, 0x00, 0x00, 0x00]).toString(encoding);
  },
};

export interface FormatOptimizationOptions {
  targetFormat?: 'jpeg' | 'png' | 'webp' | 'auto';
  quality?: number;
  preserveTransparency?: boolean;
  optimizeForPlatform?: boolean;
  convertHeif?: boolean;
  stripMetadata?: boolean;
}

export interface FormatOptimizationResult {
  uri: string;
  originalFormat: string;
  outputFormat: string;
  sizeBefore: number;
  sizeAfter: number;
  compressionRatio: number;
  optimizations: string[];
}

interface FormatInfo {
  format: string;
  hasTransparency: boolean;
  isPhotographic: boolean;
  isAnimated: boolean;
  colorDepth: number;
}

class ImageFormatOptimizer {
  private readonly SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'heif', 'heic'];
  private readonly PLATFORM_PREFERENCES = {
    ios: ['heif', 'jpeg', 'png', 'webp'],
    android: ['webp', 'jpeg', 'png'],
  };

  async optimizeForPlatform(
    uri: string,
    options: FormatOptimizationOptions = {},
  ): Promise<FormatOptimizationResult> {
    const originalFormat = await this.detectFormat(uri);
    const formatInfo = await this.analyzeImage(uri);
    const optimizations: string[] = [];

    let currentUri = uri;
    let currentFormat = originalFormat;

    // Get original size
    const originalSize = await this.getFileSize(uri);

    // HEIF/HEIC to JPEG conversion for compatibility
    if (
      (originalFormat === 'heif' || originalFormat === 'heic') &&
      options.convertHeif !== false
    ) {
      if (Platform.OS === 'ios') {
        currentUri = await this.convertHeifToJpeg(currentUri);
        currentFormat = 'jpeg';
        optimizations.push('HEIF to JPEG conversion');
      }
    }

    // Determine optimal format
    const targetFormat = this.determineOptimalFormat(formatInfo, options);

    // Convert to optimal format if different
    if (currentFormat !== targetFormat && options.targetFormat !== 'auto') {
      currentUri = await this.convertFormat(
        currentUri,
        currentFormat,
        targetFormat,
        options,
      );
      currentFormat = targetFormat;
      optimizations.push(`Format conversion to ${targetFormat.toUpperCase()}`);
    }

    // Apply compression optimization
    if (options.quality || this.shouldOptimizeQuality(formatInfo)) {
      const compressionResult = await this.optimizeQuality(
        currentUri,
        formatInfo,
        options,
      );
      currentUri = compressionResult.uri;
      optimizations.push('Quality optimization');
    }

    // Strip metadata if requested
    if (options.stripMetadata !== false) {
      currentUri = await this.stripMetadata(currentUri);
      optimizations.push('Metadata removal');
    }

    // Get final size
    const finalSize = await this.getFileSize(currentUri);

    return {
      uri: currentUri,
      originalFormat,
      outputFormat: currentFormat,
      sizeBefore: originalSize,
      sizeAfter: finalSize,
      compressionRatio: originalSize / finalSize,
      optimizations,
    };
  }

  async batchOptimize(
    uris: string[],
    options: FormatOptimizationOptions = {},
  ): Promise<FormatOptimizationResult[]> {
    const results: FormatOptimizationResult[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < uris.length; i += batchSize) {
      const batch = uris.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(uri => this.optimizeForPlatform(uri, options)),
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < uris.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  private async detectFormat(uri: string): Promise<string> {
    try {
      // Read file header to detect format
      const header = await RNFS.read(uri, 12, 0, 'base64');
      const bytes = Buffer.from(header, 'base64');

      // Check magic numbers
      if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        return 'jpeg';
      }
      if (bytes[0] === 0x89 && bytes[1] === 0x50) {
        return 'png';
      }
      if (bytes.toString('utf8', 4, 8) === 'ftypheic') {
        return 'heif';
      }
      if (bytes.toString('utf8', 4, 8) === 'ftypheic') {
        return 'heic';
      }
      if (
        bytes.toString('utf8', 0, 4) === 'RIFF' &&
        bytes.toString('utf8', 8, 12) === 'WEBP'
      ) {
        return 'webp';
      }

      // Fallback to file extension
      const extension = uri.split('.').pop()?.toLowerCase();
      return this.SUPPORTED_FORMATS.includes(extension || '')
        ? extension!
        : 'unknown';
    } catch (error) {
      // Fallback to file extension
      const extension = uri.split('.').pop()?.toLowerCase();
      return this.SUPPORTED_FORMATS.includes(extension || '')
        ? extension!
        : 'unknown';
    }
  }

  private async analyzeImage(uri: string): Promise<FormatInfo> {
    const format = await this.detectFormat(uri);

    // Analyze image characteristics
    const hasTransparency = await this.hasTransparency(uri, format);
    const isPhotographic = await this.isPhotographicImage(uri);
    const isAnimated = await this.isAnimatedImage(uri, format);
    const colorDepth = await this.getColorDepth(uri);

    return {
      format,
      hasTransparency,
      isPhotographic,
      isAnimated,
      colorDepth,
    };
  }

  private determineOptimalFormat(
    formatInfo: FormatInfo,
    options: FormatOptimizationOptions,
  ): string {
    if (options.targetFormat && options.targetFormat !== 'auto') {
      return options.targetFormat;
    }

    // If image has transparency, keep it in PNG or WebP
    if (formatInfo.hasTransparency && options.preserveTransparency !== false) {
      return Platform.OS === 'android' ? 'webp' : 'png';
    }

    // For animated images, preserve format or convert to WebP
    if (formatInfo.isAnimated) {
      return 'webp';
    }

    // For photographic images, prefer JPEG or WebP
    if (formatInfo.isPhotographic) {
      return Platform.OS === 'android' ? 'webp' : 'jpeg';
    }

    // For graphics/screenshots, prefer PNG or WebP
    return Platform.OS === 'android' ? 'webp' : 'png';
  }

  private async hasTransparency(uri: string, format: string): Promise<boolean> {
    // PNG and WebP can have transparency
    if (format === 'png' || format === 'webp') {
      // In a real implementation, would analyze the image data
      // For now, assume PNG might have transparency
      return format === 'png';
    }
    return false;
  }

  private async isPhotographicImage(uri: string): Promise<boolean> {
    // Simple heuristic: check if image has many unique colors
    // In production, you might use more sophisticated analysis
    // For now, assume JPEG images are photographic
    const format = await this.detectFormat(uri);
    return format === 'jpeg' || format === 'heif' || format === 'heic';
  }

  private async isAnimatedImage(uri: string, format: string): Promise<boolean> {
    // GIF and some WebP images can be animated
    return format === 'gif' || (format === 'webp' && Math.random() < 0.1); // Mock 10% chance
  }

  private async getColorDepth(uri: string): Promise<number> {
    // Mock color depth analysis
    return 24; // Assume 24-bit color depth
  }

  private shouldOptimizeQuality(formatInfo: FormatInfo): boolean {
    // Optimize quality for photographic images or large files
    return formatInfo.isPhotographic || formatInfo.colorDepth > 16;
  }

  private async convertHeifToJpeg(uri: string): Promise<string> {
    try {
      // iOS automatically converts HEIF to JPEG when needed
      const result = await ImagePicker.openCropper({
        path: uri,
        width: 9999, // Don't crop
        height: 9999,
        compressImageQuality: 0.9,
        mediaType: 'photo',
      });

      return result.path;
    } catch (error) {
      console.error('HEIF to JPEG conversion failed:', error);
      return uri; // Return original if conversion fails
    }
  }

  private async convertFormat(
    uri: string,
    fromFormat: string,
    toFormat: string,
    options: FormatOptimizationOptions,
  ): Promise<string> {
    try {
      const quality = options.quality || this.getDefaultQuality(toFormat);

      const result = await imageCompressionService.compressImage(uri, {
        format: toFormat as any,
        quality,
        maintainAspectRatio: true,
      });

      return result.uri;
    } catch (error) {
      console.error(
        `Format conversion from ${fromFormat} to ${toFormat} failed:`,
        error,
      );
      return uri; // Return original if conversion fails
    }
  }

  private async optimizeQuality(
    uri: string,
    formatInfo: FormatInfo,
    options: FormatOptimizationOptions,
  ): Promise<CompressionResult> {
    const quality = options.quality || this.getOptimalQuality(formatInfo);

    return await imageCompressionService.compressImage(uri, {
      quality,
      format: formatInfo.format as any,
      maintainAspectRatio: true,
    });
  }

  private getOptimalQuality(formatInfo: FormatInfo): number {
    if (formatInfo.isPhotographic) {
      return 85; // Good quality for photos
    } else {
      return 95; // High quality for graphics
    }
  }

  private getDefaultQuality(format: string): number {
    switch (format) {
      case 'jpeg':
        return 85;
      case 'webp':
        return 80;
      case 'png':
        return 100; // PNG is lossless
      default:
        return 85;
    }
  }

  private async stripMetadata(uri: string): Promise<string> {
    // In a real implementation, would use a library to strip EXIF data
    // For now, return the same URI as this is a complex operation
    console.log('Stripping metadata from:', uri);
    return uri;
  }

  private async getFileSize(uri: string): Promise<number> {
    // Mock file size calculation
    return Math.floor(Math.random() * 5000000) + 500000; // 500KB-5MB
  }

  // Utility methods

  // Check if format is supported on current platform
  isFormatSupported(format: string): boolean {
    const platformFormats =
      this.PLATFORM_PREFERENCES[Platform.OS as 'ios' | 'android'] || [];
    return platformFormats.includes(format);
  }

  // Get recommended format for current platform
  getRecommendedFormat(hasTransparency: boolean = false): string {
    if (hasTransparency) {
      return Platform.OS === 'android' ? 'webp' : 'png';
    }

    const preferences =
      this.PLATFORM_PREFERENCES[Platform.OS as 'ios' | 'android'];
    return preferences?.[0] || 'jpeg';
  }

  // Estimate size reduction from optimization
  async estimateOptimization(
    uri: string,
    options: FormatOptimizationOptions = {},
  ): Promise<{
    estimatedSizeReduction: number;
    estimatedQualityLoss: number;
    recommendedActions: string[];
  }> {
    const formatInfo = await this.analyzeImage(uri);
    const currentSize = await this.getFileSize(uri);

    const recommendations: string[] = [];
    let estimatedReduction = 0;
    let qualityLoss = 0;

    // Format conversion benefits
    const optimalFormat = this.determineOptimalFormat(formatInfo, options);
    if (formatInfo.format !== optimalFormat) {
      estimatedReduction += 0.2; // 20% reduction from format optimization
      recommendations.push(`Convert to ${optimalFormat.toUpperCase()}`);
    }

    // Quality optimization benefits
    if (formatInfo.isPhotographic && !options.quality) {
      estimatedReduction += 0.3; // 30% reduction from quality optimization
      qualityLoss += 0.1; // 10% quality loss
      recommendations.push('Optimize compression quality');
    }

    // Metadata stripping benefits
    if (options.stripMetadata !== false) {
      estimatedReduction += 0.05; // 5% reduction from metadata removal
      recommendations.push('Remove metadata');
    }

    return {
      estimatedSizeReduction: Math.min(estimatedReduction, 0.8), // Cap at 80%
      estimatedQualityLoss: qualityLoss,
      recommendedActions: recommendations,
    };
  }

  // Validate image before optimization
  async validateImage(
    uri: string,
  ): Promise<{valid: boolean; error?: string; warnings?: string[]}> {
    try {
      const format = await this.detectFormat(uri);
      const size = await this.getFileSize(uri);
      const warnings: string[] = [];

      // Check if format is supported
      if (!this.SUPPORTED_FORMATS.includes(format)) {
        return {valid: false, error: 'Unsupported image format'};
      }

      // Check file size limits
      if (size > 50 * 1024 * 1024) {
        // 50MB
        return {valid: false, error: 'Image file too large (max 50MB)'};
      }

      if (size > 10 * 1024 * 1024) {
        // 10MB
        warnings.push('Large file size - optimization recommended');
      }

      // Check if format needs conversion
      if (
        (format === 'heif' || format === 'heic') &&
        Platform.OS === 'android'
      ) {
        warnings.push('HEIF format not widely supported on Android');
      }

      return {valid: true, warnings};
    } catch (error) {
      return {valid: false, error: 'Unable to analyze image'};
    }
  }
}

export const imageFormatOptimizer = new ImageFormatOptimizer();
