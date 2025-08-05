import {QueueItem} from '../queueStorage';
import {API_CONFIG} from '../../../config/api';

interface MediaQueueData {
  fileName: string;
  fileUri: string;
  fileType: string;
  fileSize: number;
  uploadUrl?: string;
  associatedId?: string; // Post, comment, or profile ID this media belongs to
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For videos
    thumbnail?: string; // For videos
  };
}

class MediaProcessor {
  async process(item: QueueItem): Promise<any> {
    const data = item.data as MediaQueueData;

    try {
      // Validate file still exists
      await this.validateFile(data.fileUri);

      // Get upload URL if not provided
      const uploadUrl = data.uploadUrl || (await this.getUploadUrl(data));

      // Upload the file
      const uploadResult = await this.uploadFile(data, uploadUrl);

      // If this media is associated with another entity, update it
      if (data.associatedId) {
        await this.updateAssociatedEntity(data.associatedId, uploadResult.url);
      }

      console.log(`Media upload completed: ${data.fileName}`);
      return uploadResult;

    } catch (error: any) {
      console.error(`Media upload failed: ${data.fileName}`, error);

      // Check if this is a retryable error
      if (this.isRetryableError(error)) {
        throw error; // Will be retried by queue processor
      } else {
        // Mark as permanently failed
        throw new Error(`Non-retryable media error: ${error.message}`);
      }
    }
  }

  private async validateFile(fileUri: string): Promise<void> {
    // TODO: Integrate with React Native file system when available
    // For now, simulate file validation
    console.log(`Validating file: ${fileUri}`);

    // Simulate random file validation failure
    if (Math.random() < 0.1) {
      throw new Error('File no longer exists');
    }
  }

  private async getUploadUrl(data: MediaQueueData): Promise<string> {
    // TODO: Integrate with actual API when available
    // For now, return a mock upload URL
    console.log(`Getting upload URL for: ${data.fileName}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `${API_CONFIG.BASE_URL}/upload/${Date.now()}`;
  }

  private async uploadFile(
    data: MediaQueueData,
    uploadUrl: string,
  ): Promise<{url: string; size: number}> {
    console.log(`Uploading file: ${data.fileName} to ${uploadUrl}`);

    // TODO: Replace with actual file upload implementation
    // Using FormData and fetch for multipart upload

    // Simulate upload progress and delay based on file size
    const uploadTime = Math.min(data.fileSize / 1000, 10000); // Max 10 seconds
    await new Promise(resolve => setTimeout(resolve, uploadTime));

    // Simulate upload failure for large files occasionally
    if (data.fileSize > 50 * 1024 * 1024 && Math.random() < 0.2) {
      throw new Error('Upload timeout - file too large');
    }

    // Return mock result
    const resultUrl = `https://cdn.beam.fun/media/${Date.now()}_${
      data.fileName

    return {
      url: resultUrl,
      size: data.fileSize,
    };
  }

  private async updateAssociatedEntity(
    entityId: string,
    mediaUrl: string,
  ): Promise<void> {
    // TODO: Integrate with actual API when available
    console.log(`Updating entity ${entityId} with media URL: ${mediaUrl}`);

    // Simulate API call to update the associated entity
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503')
    ) {
      return true;
    }

    // Rate limiting is retryable
    if (error.message.includes('429')) {
      return true;
    }

    // Timeout errors are retryable
    if (error.message.includes('timeout')) {
      return true;
    }

    // File validation errors are not retryable
    if (error.message.includes('File no longer exists')) {
      return false;
    }

    // File too large errors are not retryable
    if (error.message.includes('file too large')) {
      return false;
    }

    // Invalid file format errors are not retryable
    if (error.message.includes('Invalid file format')) {
      return false;
    }

    // Default to retryable for unknown errors
    return true;
  }

  // Helper method to create media upload queue items
  static createQueueItem(
    fileName: string,
    fileUri: string,
    fileType: string,
    fileSize: number,
    options: Partial<
      Omit<MediaQueueData, 'fileName' | 'fileUri' | 'fileType' | 'fileSize'>
    > = {},
  ) {
    // Priority based on file size and type
    let priority = 5; // Default medium priority

    if (fileType.startsWith('image/')) {
      priority = 6; // Images get slightly higher priority
    } else if (fileType.startsWith('video/')) {
      priority = 4; // Videos get lower priority due to size
    }

    // Adjust priority based on file size
    if (fileSize < 1024 * 1024) {
      // < 1MB
      priority += 1;
    } else if (fileSize > 10 * 1024 * 1024) {
      // > 10MB
      priority -= 1;
    }

    return {
      type: 'media_upload' as const,
      priority: Math.max(1, Math.min(10, priority)),
      maxRetries: 3,
      data: {
        fileName,
        fileUri,
        fileType,
        fileSize,
        ...options,
      } as MediaQueueData,
    };
  }

  // Helper to get supported file types
  static getSupportedTypes(): {
    images: string[];
    videos: string[];
    documents: string[];
  } {
    return {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      videos: ['video/mp4', 'video/mov', 'video/avi'],
      documents: ['application/pdf', 'text/plain'],
    };
  }

  // Helper to validate file before queuing
  static validateFileForUpload(
    fileType: string,
    fileSize: number,
  ): {valid: boolean; error?: string} {
    const supportedTypes = this.getSupportedTypes();
    const allSupported = [
      ...supportedTypes.images,
      ...supportedTypes.videos,
      ...supportedTypes.documents,

    if (!allSupported.includes(fileType)) {
      return {valid: false, error: 'Unsupported file type'};
    }

    // Size limits
    const maxSize = fileType.startsWith('video/')
      ? 100 * 1024 * 1024
      : 10 * 1024 * 1024; // 100MB for video, 10MB for others

    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File too large. Max size: ${maxSize / 1024 / 1024}MB`,
      };
    }

    return {valid: true};
  }
}

export const mediaProcessor = new MediaProcessor();
