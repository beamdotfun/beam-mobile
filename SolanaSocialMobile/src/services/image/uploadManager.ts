import {Platform} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  imageCompressionService,
  CompressionOptions,
  CompressionResult,
} from './imageCompressionService';
import {queueProcessor} from '../offline/queueProcessor';
import {API_CONFIG} from '../../config/api';

// Mock background upload since we don't have the package
const BackgroundUpload = {
  startUpload: async (options: any) => {
    const uploadId = Date.now().toString();

    // Simulate upload process
    setTimeout(() => {
      const listeners = (BackgroundUpload as any).listeners || {};

      // Simulate progress
      if (listeners.progress?.[uploadId]) {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 20;
          listeners.progress[uploadId]({progress});

          if (progress >= 100) {
            clearInterval(progressInterval);

            // Simulate completion
            if (listeners.completed?.[uploadId]) {
              listeners.completed[uploadId]({
                responseBody: JSON.stringify({
                  url: `https://cdn.beam.fun/images/${uploadId}.jpg`,
                  thumbnailUrl: `https://cdn.beam.fun/thumbnails/${uploadId}.jpg`,
                  size: 1024 * 1024, // 1MB
                  metadata: options.parameters,
                }),
              });
            }
          }
        }, 500);
      }
    }, 100);

    return uploadId;
  },

  addListener: (event: string, uploadId: string, callback: any) => {
    if (!(BackgroundUpload as any).listeners) {
      (BackgroundUpload as any).listeners = {};
    }
    if (!(BackgroundUpload as any).listeners[event]) {
      (BackgroundUpload as any).listeners[event] = {};
    }
    (BackgroundUpload as any).listeners[event][uploadId] = callback;
  },
};

// Mock auth service
const authService = {
  getAccessToken: async () => 'mock_access_token',
};

// Mock analytics
const analytics = () => ({
  logEvent: (eventName: string, params: any) => {
    console.log(`Analytics: ${eventName}`, params);
  },
});

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface UploadOptions {
  compress?: boolean;
  compressionOptions?: CompressionOptions;
  priority?: 'low' | 'normal' | 'high';
  generateThumbnail?: boolean;
  onProgress?: (progress: number) => void;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  size: number;
  duration: number;
  metadata?: Record<string, any>;
}

interface UploadTask {
  id: string;
  uri: string;
  options: UploadOptions;
  promise: Promise<UploadResult>;
}

class UploadManager {
  private activeUploads = new Map<string, any>();
  private uploadQueue: UploadTask[] = [];
  private maxConcurrentUploads = 3;

  async uploadImage(
    uri: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const startTime = Date.now();

    // Check network quality
    const networkQuality = await this.getNetworkQuality();

    // Adjust compression based on network
    const compressionOptions = this.getAdaptiveCompressionOptions(
      networkQuality,
      options.compressionOptions,
    );

    // Compress image if requested
    let uploadUri = uri;
    let compressionResult: CompressionResult | undefined;

    if (options.compress !== false) {
      compressionResult = await imageCompressionService.compressImage(
        uri,
        compressionOptions,
      );
      uploadUri = compressionResult.uri;
    }

    // Generate thumbnail if requested
    let thumbnailResult: CompressionResult | undefined;
    if (options.generateThumbnail) {
      thumbnailResult = await imageCompressionService.generateThumbnail(uri);
    }

    // Check if we should use background upload
    const useBackgroundUpload = this.shouldUseBackgroundUpload(
      compressionResult?.size || 0,
      networkQuality,
    );

    // Perform upload
    let uploadResult: UploadResult;

    if (useBackgroundUpload) {
      uploadResult = await this.backgroundUpload(
        uploadUri,
        thumbnailResult?.uri,
        options,
      );
    } else {
      uploadResult = await this.foregroundUpload(
        uploadUri,
        thumbnailResult?.uri,
        options,
      );
    }

    // Clean up temporary files
    await this.cleanupTempFiles(
      [uploadUri, thumbnailResult?.uri].filter(Boolean),

    // Record metrics
    uploadResult.duration = Date.now() - startTime;
    this.recordUploadMetrics(uploadResult, compressionResult, networkQuality);

    return uploadResult;
  }

  async uploadBatch(
    uris: string[],
    options: UploadOptions = {},
  ): Promise<UploadResult[]> {
    // Limit concurrent uploads
    const batches: string[][] = [];
    for (let i = 0; i < uris.length; i += this.maxConcurrentUploads) {
      batches.push(uris.slice(i, i + this.maxConcurrentUploads));
    }

    const results: UploadResult[] = [];

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(uri => this.uploadImage(uri, options)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async getNetworkQuality(): Promise<'poor' | 'moderate' | 'good'> {
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      return 'poor';
    }

    // Check connection type
    if (netInfo.type === 'cellular') {
      const cellularGen = netInfo.details?.cellularGeneration;
      if (cellularGen === '2g' || cellularGen === '3g') {
        return 'poor';
      }
      if (cellularGen === '4g') {
        return 'moderate';
      }
    }

    // Perform speed test for more accurate assessment
    const speedTest = await this.performSpeedTest();

    if (speedTest.downloadSpeed < 1) {
      // Less than 1 Mbps
      return 'poor';
    } else if (speedTest.downloadSpeed < 5) {
      // Less than 5 Mbps
      return 'moderate';
    } else {
      return 'good';
    }
  }

  private getAdaptiveCompressionOptions(
    networkQuality: 'poor' | 'moderate' | 'good',
    userOptions?: CompressionOptions,
  ): CompressionOptions {
    const baseOptions = userOptions || {};

    switch (networkQuality) {
      case 'poor':
        return {
          ...baseOptions,
          maxWidth: Math.min(baseOptions.maxWidth || 1280, 1280),
          maxHeight: Math.min(baseOptions.maxHeight || 1280, 1280),
          quality: Math.min(baseOptions.quality || 70, 70),
          format: 'jpeg', // Force JPEG for better compression
        };

      case 'moderate':
        return {
          ...baseOptions,
          maxWidth: Math.min(baseOptions.maxWidth || 1600, 1600),
          maxHeight: Math.min(baseOptions.maxHeight || 1600, 1600),
          quality: Math.min(baseOptions.quality || 80, 80),
        };

      case 'good':
      default:
        return baseOptions;
    }
  }

  private shouldUseBackgroundUpload(
    fileSize: number,
    networkQuality: 'poor' | 'moderate' | 'good',
  ): boolean {
    // Use background upload for large files or poor network
    const sizeThreshold =
      networkQuality === 'good' ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB or 2MB
    return fileSize > sizeThreshold || networkQuality === 'poor';
  }

  private async backgroundUpload(
    imageUri: string,
    thumbnailUri: string | undefined,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const uploadId = Date.now().toString();

    // Configure background upload
    const uploadOptions = {
      uploadUrl: `${API_BASE_URL}/upload/image`,
      path:
        Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      method: 'POST',
      type: 'multipart',
      field: 'image',
      headers: {
        Authorization: `Bearer ${await authService.getAccessToken()}`,
      },
      parameters: {
        ...options.metadata,
        thumbnail: thumbnailUri,
      },
      notification: {
        enabled: true,
        onProgressTitle: 'Uploading Image',
        onProgressMessage: 'Uploading your image...',
        onCompleteTitle: 'Upload Complete',
        onCompleteMessage: 'Your image has been uploaded',
        onErrorTitle: 'Upload Failed',
        onErrorMessage: 'Failed to upload image',
      },
    };

    return new Promise((resolve, reject) => {
      BackgroundUpload.startUpload(uploadOptions)
        .then(uploadId => {
          this.activeUploads.set(uploadId, {resolve, reject});

          // Listen for progress
          BackgroundUpload.addListener('progress', uploadId, (data: any) => {
            options.onProgress?.(data.progress);
          });

          // Listen for completion
          BackgroundUpload.addListener('completed', uploadId, (data: any) => {
            const response = JSON.parse(data.responseBody);
            resolve({
              url: response.url,
              thumbnailUrl: response.thumbnailUrl,
              size: response.size,
              duration: 0,
              metadata: response.metadata,
            });

            this.activeUploads.delete(uploadId);
          });

          // Listen for errors
          BackgroundUpload.addListener('error', uploadId, (data: any) => {
            reject(new Error(data.error));
            this.activeUploads.delete(uploadId);
          });
        })
        .catch(reject);
    });
  }

  private async foregroundUpload(
    imageUri: string,
    thumbnailUri: string | undefined,
    options: UploadOptions,
  ): Promise<UploadResult> {
    // Use chunked upload for better reliability
    const chunkSize = 512 * 1024; // 512KB chunks
    const fileSize = await this.getFileSize(imageUri);
    const chunks = Math.ceil(fileSize / chunkSize);

    // Initialize multipart upload
    const {uploadId, uploadUrl} = await this.initializeMultipartUpload({
      filename: `image_${Date.now()}.jpg`,
      contentType: 'image/jpeg',
      metadata: options.metadata,
    });

    // Upload chunks
    const parts: any[] = [];

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileSize);

      const chunk = await this.readFileChunk(imageUri, start, end);
      const part = await this.uploadChunk(uploadUrl, uploadId, i + 1, chunk);

      parts.push(part);

      // Report progress
      const progress = ((i + 1) / chunks) * 100;
      options.onProgress?.(progress);
    }

    // Complete multipart upload
    const result = await this.completeMultipartUpload(uploadId, parts);

    // Upload thumbnail if provided
    if (thumbnailUri) {
      const thumbnailResult = await this.uploadThumbnail(
        thumbnailUri,
        result.key,
      );
      result.thumbnailUrl = thumbnailResult.url;
    }

    return result;
  }

  private async performSpeedTest(): Promise<{downloadSpeed: number}> {
    const testUrl = 'https://speed.cloudflare.com/__down?bytes=1000000'; // 1MB
    const startTime = Date.now();

    try {
      const response = await fetch(testUrl);
      await response.blob();

      const duration = (Date.now() - startTime) / 1000; // seconds
      const downloadSpeed = (1 * 8) / duration; // Mbps

      return {downloadSpeed};
    } catch (error) {
      return {downloadSpeed: 0};
    }
  }

  private recordUploadMetrics(
    result: UploadResult,
    compressionResult?: CompressionResult,
    networkQuality?: string,
  ) {
    analytics().logEvent('image_uploaded', {
      size: result.size,
      duration: result.duration,
      compression_ratio: compressionResult?.compressionRatio,
      network_quality: networkQuality,
      upload_speed: (result.size / result.duration) * 1000, // bytes per second
    });
  }

  private async cleanupTempFiles(uris: string[]) {
    // Mock cleanup - in real implementation would use RNFS.unlink
    for (const uri of uris) {
      if (uri && uri.includes('tmp')) {
        console.log(`Cleaning up temp file: ${uri}`);
      }
    }
  }

  private async getFileSize(uri: string): Promise<number> {
    // Mock file size calculation
    return Math.floor(Math.random() * 5000000) + 500000; // 500KB-5MB
  }

  private async initializeMultipartUpload(params: {
    filename: string;
    contentType: string;
    metadata?: any;
  }): Promise<{uploadId: string; uploadUrl: string}> {
    // Mock multipart upload initialization
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      uploadId: `upload_${Date.now()}`,
      uploadUrl: `${API_BASE_URL}/upload/multipart`,
    };
  }

  private async readFileChunk(
    uri: string,
    start: number,
    end: number,
  ): Promise<ArrayBuffer> {
    // Mock file chunk reading
    await new Promise(resolve => setTimeout(resolve, 50));

    const size = end - start;
    return new ArrayBuffer(size);
  }

  private async uploadChunk(
    uploadUrl: string,
    uploadId: string,
    partNumber: number,
    chunk: ArrayBuffer,
  ): Promise<{partNumber: number; etag: string}> {
    // Mock chunk upload
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      partNumber,
      etag: `etag_${partNumber}_${Date.now()}`,
    };
  }

  private async completeMultipartUpload(
    uploadId: string,
    parts: any[],
  ): Promise<{url: string; key: string; size: number}> {
    // Mock multipart upload completion
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      url: `https://cdn.beam.fun/images/${uploadId}.jpg`,
      key: `images/${uploadId}.jpg`,
      size: 1024 * 1024, // 1MB
    };
  }

  private async uploadThumbnail(
    thumbnailUri: string,
    parentKey: string,
  ): Promise<{url: string}> {
    // Mock thumbnail upload
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      url: `https://cdn.beam.fun/thumbnails/${parentKey
        .replace('images/', '')
        .replace('.jpg', '_thumb.jpg')}`,
    };
  }

  // Helper methods for queue integration
  async queueUpload(uri: string, options: UploadOptions = {}): Promise<string> {
    // Add upload to offline queue for later processing
    const queueItem = {
      type: 'media_upload' as const,
      priority:
        options.priority === 'high' ? 9 : options.priority === 'low' ? 3 : 6,
      maxRetries: 3,
      data: {
        fileName: `image_${Date.now()}.jpg`,
        fileUri: uri,
        fileType: 'image/jpeg',
        fileSize: await this.getFileSize(uri),
        metadata: options.metadata,
      },
    };

    return await queueProcessor.addToQueue(queueItem);
  }

  // Get upload statistics
  getUploadStats(): {
    activeUploads: number;
    queuedUploads: number;
    completedToday: number;
    totalBandwidthUsed: number;
  } {
    return {
      activeUploads: this.activeUploads.size,
      queuedUploads: this.uploadQueue.length,
      completedToday: 0, // Would track from analytics
      totalBandwidthUsed: 0, // Would track from analytics
    };
  }

  // Cancel active upload
  async cancelUpload(uploadId: string): Promise<boolean> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      this.activeUploads.delete(uploadId);
      return true;
    }
    return false;
  }

  // Pause/resume uploads based on network conditions
  async pauseUploads(): Promise<void> {
    // Implementation would pause active uploads
    console.log('Pausing uploads due to network conditions');
  }

  async resumeUploads(): Promise<void> {
    // Implementation would resume paused uploads
    console.log('Resuming uploads - network conditions improved');
  }
}

export const uploadManager = new UploadManager();
