import {Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_CONFIG} from '../../config/api';

// Mock react-native-fast-image since we don't have it installed
const FastImage = {
  priority: {
    low: 'low',
    normal: 'normal',
    high: 'high',
  },
  preload: async (
    sources: Array<{uri: string; priority?: string; headers?: any}>,
  ) => {
    // Simulate preloading delay
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(
      'Preloaded images:',
      sources.map(s => s.uri),
    );
  },
  clearDiskCache: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Cleared FastImage disk cache');
  },
  clearMemoryCache: async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('Cleared FastImage memory cache');
  },
};

// Mock RNFS for file operations
const RNFS = {
  CachesDirectoryPath: '/mock/caches',
  mkdir: async (path: string, options?: any) => {
    console.log('Created directory:', path);
  },
  unlink: async (path: string) => {
    console.log('Deleted:', path);
  },
  readDir: async (path: string) => {
    return [
      {name: 'image1.jpg', size: 1024000, mtime: new Date()},
      {name: 'image2.jpg', size: 2048000, mtime: new Date()},
    ];
  },
  stat: async (path: string) => {
    return {
      size: Math.floor(Math.random() * 2000000) + 100000,
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false,
    };
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

interface CacheConfig {
  maxSize: number; // bytes
  maxAge: number; // milliseconds
  cleanupInterval: number; // milliseconds
  maxEntries: number; // maximum number of cached items
}

interface CacheEntry {
  uri: string;
  size: number;
  accessedAt: number;
  createdAt: number;
  hits: number;
  priority: 'low' | 'normal' | 'high';
}

interface CacheStats {
  totalSize: number;
  totalEntries: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
  diskUsage: number;
}

class ImageCacheManager {
  private config: CacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    maxEntries: 1000, // Maximum number of cached images
  };

  private cacheDir = `${RNFS.CachesDirectoryPath}/images`;
  private cacheIndex = new Map<string, CacheEntry>();
  private cleanupTimer?: NodeJS.Timeout;
  private hitCount = 0;
  private missCount = 0;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) {return;}

    try {
      // Ensure cache directory exists
      await RNFS.mkdir(this.cacheDir, {intermediateDirectories: true});

      // Load cache index
      await this.loadCacheIndex();

      // Perform initial cleanup
      await this.performCleanup();

      // Start cleanup timer
      this.startCleanupTimer();

      // Preload critical images
      await this.preloadCriticalImages();

      this.isInitialized = true;
      console.log('Image cache manager initialized');
    } catch (error) {
      console.error('Failed to initialize image cache manager:', error);
    }
  }

  async cacheImage(
    uri: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): Promise<void> {
    try {
      const priorityMap = {
        low: FastImage.priority.low,
        normal: FastImage.priority.normal,
        high: FastImage.priority.high,
      };

      // Preload image using FastImage
      await FastImage.preload([
        {
          uri,
          priority: priorityMap[priority],
          headers: await this.getAuthHeaders(),
        },
      ]);

      // Update cache index
      const size = await this.getImageSize(uri);
      const now = Date.now();

      const existingEntry = this.cacheIndex.get(uri);
      const entry: CacheEntry = {
        uri,
        size,
        accessedAt: now,
        createdAt: existingEntry?.createdAt || now,
        hits: (existingEntry?.hits || 0) + 1,
        priority,
      };

      this.cacheIndex.set(uri, entry);
      await this.saveCacheIndex();

      // Trigger cleanup if needed
      await this.checkAndCleanup();

      console.log(`Cached image: ${uri} (${this.formatBytes(size)})`);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }

  async getCachedImage(uri: string): Promise<string | null> {
    const entry = this.cacheIndex.get(uri);
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.createdAt > this.config.maxAge) {
      await this.removeFromCache(uri);
      this.missCount++;
      return null;
    }

    // Update access time and hit count
    entry.accessedAt = Date.now();
    entry.hits++;
    this.hitCount++;

    await this.saveCacheIndex();

    return uri;
  }

  async prefetchImages(
    uris: string[],
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): Promise<void> {
    const uncachedUris = uris.filter(uri => !this.cacheIndex.has(uri));

    if (uncachedUris.length === 0) {return;}

    // Cache in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < uncachedUris.length; i += batchSize) {
      const batch = uncachedUris.slice(i, i + batchSize);
      await Promise.all(batch.map(uri => this.cacheImage(uri, priority)));

      // Small delay between batches
      if (i + batchSize < uncachedUris.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Clear FastImage cache
      await FastImage.clearDiskCache();
      await FastImage.clearMemoryCache();

      // Clear our cache index
      this.cacheIndex.clear();
      await this.saveCacheIndex();

      // Clear cache directory
      await RNFS.unlink(this.cacheDir);
      await RNFS.mkdir(this.cacheDir, {intermediateDirectories: true});

      // Reset counters
      this.hitCount = 0;
      this.missCount = 0;

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const entry of this.cacheIndex.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.createdAt);
      newestEntry = Math.max(newestEntry, entry.createdAt);
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    return {
      totalSize,
      totalEntries: this.cacheIndex.size,
      hitRate,
      oldestEntry,
      newestEntry,
      diskUsage: (totalSize / this.config.maxSize) * 100,
    };
  }

  async evictLeastRecentlyUsed(targetSize: number): Promise<void> {
    // Sort entries by access time (oldest first)
    const entries = Array.from(this.cacheIndex.entries()).sort(
      (a, b) => a[1].accessedAt - b[1].accessedAt,

    let currentSize = await this.getCacheSize();

    for (const [uri, entry] of entries) {
      if (currentSize <= targetSize) {break;}

      await this.removeFromCache(uri);
      currentSize -= entry.size;
    }
  }

  async evictByPriority(): Promise<void> {
    // Remove low priority items first, then normal priority
    const priorities = ['low', 'normal', 'high'] as const;

    for (const priority of priorities) {
      if ((await this.getCacheSize()) <= this.config.maxSize * 0.8) {break;}

      const urisToRemove = Array.from(this.cacheIndex.entries())
        .filter(([_, entry]) => entry.priority === priority)
        .sort((a, b) => a[1].accessedAt - b[1].accessedAt)
        .slice(0, 10) // Remove up to 10 items at a time
        .map(([uri]) => uri);

      for (const uri of urisToRemove) {
        await this.removeFromCache(uri);
      }
    }
  }

  private async performCleanup() {
    const now = Date.now();
    const entriesToRemove: string[] = [];

    // Remove expired entries
    for (const [uri, entry] of this.cacheIndex.entries()) {
      if (now - entry.createdAt > this.config.maxAge) {
        entriesToRemove.push(uri);
      }
    }

    // Remove entries if we exceed max entries
    if (this.cacheIndex.size > this.config.maxEntries) {
      const excess = this.cacheIndex.size - this.config.maxEntries;
      const oldestEntries = Array.from(this.cacheIndex.entries())
        .sort((a, b) => a[1].accessedAt - b[1].accessedAt)
        .slice(0, excess)
        .map(([uri]) => uri);

      entriesToRemove.push(...oldestEntries);
    }

    // Remove entries if cache is too large
    const currentSize = await this.getCacheSize();
    if (currentSize > this.config.maxSize) {
      await this.evictLeastRecentlyUsed(this.config.maxSize * 0.8);
    }

    // Remove collected entries
    for (const uri of entriesToRemove) {
      await this.removeFromCache(uri);
    }

    // Save updated index
    await this.saveCacheIndex();

    // Log cleanup metrics
    const stats = await this.getCacheStats();
    analytics().logEvent('cache_cleanup', {
      removed_count: entriesToRemove.length,
      cache_size: stats.totalSize,
      total_entries: stats.totalEntries,
      hit_rate: stats.hitRate,
      disk_usage: stats.diskUsage,
    });
  }

  private async checkAndCleanup() {
    const currentSize = await this.getCacheSize();

    // Trigger cleanup if we're over 90% of max size
    if (currentSize > this.config.maxSize * 0.9) {
      await this.performCleanup();
    }
  }

  private async getCacheSize(): Promise<number> {
    let totalSize = 0;

    for (const entry of this.cacheIndex.values()) {
      totalSize += entry.size;
    }

    return totalSize;
  }

  private async removeFromCache(uri: string) {
    this.cacheIndex.delete(uri);
    // FastImage handles actual file removal automatically
  }

  private async loadCacheIndex() {
    try {
      const data = await AsyncStorage.getItem('image_cache_index');
      if (data) {
        const entries = JSON.parse(data);
        this.cacheIndex = new Map(entries);

        // Load hit/miss counters
        const counters = await AsyncStorage.getItem('image_cache_counters');
        if (counters) {
          const parsed = JSON.parse(counters);
          this.hitCount = parsed.hitCount || 0;
          this.missCount = parsed.missCount || 0;
        }
      }
    } catch (error) {
      console.error('Error loading cache index:', error);
    }
  }

  private async saveCacheIndex() {
    try {
      const entries = Array.from(this.cacheIndex.entries());
      await AsyncStorage.setItem('image_cache_index', JSON.stringify(entries));

      // Save hit/miss counters
      await AsyncStorage.setItem(
        'image_cache_counters',
        JSON.stringify({
          hitCount: this.hitCount,
          missCount: this.missCount,
        }),
      );
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  private async preloadCriticalImages() {
    try {
      // Preload app icons, common UI elements
      const criticalImages = [
        // These would be actual asset URIs in a real app
        `${API_CONFIG.BASE_URL}/static/logo.png`,
        `${API_CONFIG.BASE_URL}/static/default-avatar.png`,
        `${API_CONFIG.BASE_URL}/static/placeholder.png`,
      ];

      await FastImage.preload(
        criticalImages.map(uri => ({
          uri,
          priority: FastImage.priority.high,
        })),
      );

      // Add to cache index
      for (const uri of criticalImages) {
        const now = Date.now();
        this.cacheIndex.set(uri, {
          uri,
          size: 50 * 1024, // Estimate 50KB for UI assets
          accessedAt: now,
          createdAt: now,
          hits: 0,
          priority: 'high',
        });
      }

      await this.saveCacheIndex();
    } catch (error) {
      console.error('Error preloading critical images:', error);
    }
  }

  private async getImageSize(uri: string): Promise<number> {
    try {
      // In a real implementation, this would get actual downloaded size
      // For now, estimate based on image dimensions or use a default
      return new Promise(resolve => {
        Image.getSize(
          uri,
          (width, height) => {
            // Rough estimate: width * height * 3 bytes per pixel / compression factor
            const estimatedSize = (width * height * 3) / 10; // Assume 10:1 compression
            resolve(Math.min(estimatedSize, 5 * 1024 * 1024)); // Cap at 5MB
          },
          () => {
            resolve(500 * 1024); // Default 500KB
          },
        );
      });
    } catch (error) {
      return 500 * 1024; // Default 500KB estimate
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await authService.getAccessToken();
      return {
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      return {};
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Configuration methods
  updateConfig(newConfig: Partial<CacheConfig>) {
    this.config = {...this.config, ...newConfig};
  }

  getConfig(): CacheConfig {
    return {...this.config};
  }

  // Warm up cache with popular images
  async warmupCache(popularImageUris: string[]): Promise<void> {
    await this.prefetchImages(popularImageUris, 'normal');
  }

  // Export cache data for debugging
  async exportCacheData(): Promise<{
    config: CacheConfig;
    stats: CacheStats;
    entries: Array<[string, CacheEntry]>;
  }> {
    return {
      config: this.config,
      stats: await this.getCacheStats(),
      entries: Array.from(this.cacheIndex.entries()),
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

export const imageCacheManager = new ImageCacheManager();
