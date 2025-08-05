import AsyncStorage from '@react-native-async-storage/async-storage';
import {CachedItem, CacheConfig} from '../../types/offline';

class CacheService {
  private readonly CACHE_PREFIX = 'cache_';
  private readonly CACHE_VERSION = 1;

  async get<T>(key: string): Promise<CachedItem<T> | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const item: CachedItem<T> = JSON.parse(cached);

      // Check version
      if (item.version !== this.CACHE_VERSION) {
        await this.remove(key);
        return null;
      }

      return item;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const expiresAt = Date.now() + (ttl || 3600000); // Default 1 hour

      const item: CachedItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
        expiresAt,
        size: JSON.stringify(data).length,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  async invalidate(pattern?: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => {
        if (!key.startsWith(this.CACHE_PREFIX)) {
          return false;
        }
        if (!pattern) {
          return true;
        }
        return key.includes(pattern);
      });

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async calculateSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize / 1024 / 1024; // Convert to MB
    } catch (error) {
      console.error('Cache size calculation error:', error);
      return 0;
    }
  }

  async prune(config: CacheConfig): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      // Get all cache items with metadata
      const items: Array<{key: string; item: CachedItem<any>}> = [];

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const item = JSON.parse(value);
            items.push({key, item});
          } catch (e) {
            // Invalid cache item, remove it
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Remove expired items
      const now = Date.now();
      const expiredKeys = items
        .filter(({item}) => item.expiresAt < now)
        .map(({key}) => key);

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }

      // Check size limit
      const currentSize = await this.calculateSize();
      if (currentSize > config.maxSize) {
        // Sort by timestamp (oldest first) and remove until under limit
        const sortedItems = items
          .filter(({key}) => !expiredKeys.includes(key))
          .sort((a, b) => a.item.timestamp - b.item.timestamp);

        const keysToRemove: string[] = [];
        let sizeToRemove = currentSize - config.maxSize;

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
      console.error('Cache prune error:', error);
    }
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }
}

export const cacheService = new CacheService();
