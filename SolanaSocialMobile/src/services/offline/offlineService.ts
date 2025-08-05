import AsyncStorage from '@react-native-async-storage/async-storage';
import {MediaCache} from '../../types/offline';

class OfflineService {
  private readonly MEDIA_CACHE_PREFIX = 'media_cache_';

  async downloadMedia(uri: string): Promise<string> {
    try {
      // For now, return the original URI
      // In a real implementation, this would download and store the media locally
      // using libraries like react-native-fs or react-native-blob-util

      // Simulate local path generation
      const filename = uri.split('/').pop() || 'media';
      const localPath = `file://documents/media_cache/${filename}`;

      // In a real implementation:
      // 1. Download the media file
      // 2. Store it in the app's documents directory
      // 3. Return the local file path

      // For now, we'll just return the original URI
      // This allows the system to work without external file download dependencies
      return uri;
    } catch (error) {
      console.error('Media download error:', error);
      throw error;
    }
  }

  async clearMediaCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mediaCacheKeys = keys.filter(key =>
        key.startsWith(this.MEDIA_CACHE_PREFIX),
      );

      if (mediaCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(mediaCacheKeys);
      }

      // In a real implementation, also delete physical media files
      // from the documents directory
    } catch (error) {
      console.error('Media cache clear error:', error);
    }
  }

  async getMediaCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mediaCacheKeys = keys.filter(key =>
        key.startsWith(this.MEDIA_CACHE_PREFIX),
      );

      let totalSize = 0;

      for (const key of mediaCacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const mediaInfo: MediaCache = JSON.parse(value);
          totalSize += mediaInfo.size;
        }
      }

      return totalSize / 1024 / 1024; // Convert to MB
    } catch (error) {
      console.error('Media cache size calculation error:', error);
      return 0;
    }
  }

  async pruneMediaCache(maxSizeMB: number): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mediaCacheKeys = keys.filter(key =>
        key.startsWith(this.MEDIA_CACHE_PREFIX),
      );

      const mediaItems: Array<{key: string; item: MediaCache}> = [];

      for (const key of mediaCacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const item = JSON.parse(value);
            mediaItems.push({key, item});
          } catch (e) {
            // Invalid media item, remove it
            await AsyncStorage.removeItem(key);
          }
        }
      }

      const currentSize = await this.getMediaCacheSize();
      if (currentSize > maxSizeMB) {
        // Sort by last accessed (oldest first) and remove until under limit
        const sortedItems = mediaItems.sort(
          (a, b) => a.item.lastAccessed - b.item.lastAccessed,
        );

        const keysToRemove: string[] = [];
        let sizeToRemove = currentSize - maxSizeMB;

        for (const {key, item} of sortedItems) {
          if (sizeToRemove <= 0) {
            break;
          }
          keysToRemove.push(key);
          sizeToRemove -= item.size / 1024 / 1024;
        }

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      }
    } catch (error) {
      console.error('Media cache prune error:', error);
    }
  }
}

export const offlineService = new OfflineService();
