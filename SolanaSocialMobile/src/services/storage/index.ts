import AsyncStorage from '@react-native-async-storage/async-storage';
// import {MMKV} from 'react-native-mmkv';

// Mock MMKV for now
const storage = {
  set: (key: string, value: string) => {
    AsyncStorage.setItem(key, value);
  },
  getString: (key: string) => {
    return null; // Simplified mock - will fall back to AsyncStorage
  },
  delete: (key: string) => {
    AsyncStorage.removeItem(key);
  },
  clearAll: () => {
    AsyncStorage.clear();
  },
};

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export class StorageService {
  // MMKV for fast synchronous storage (auth tokens, small data)
  static setSync<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  }

  static getSync<T>(key: string): T | null {
    try {
      const value = storage.getString(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  static removeSync(key: string): void {
    storage.delete(key);
  }

  static clearSync(): void {
    storage.clearAll();
  }

  // AsyncStorage for larger data and proper async handling
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
    }
  }

  // Cache with expiration
  static async setCache<T>(
    key: string,
    data: T,
    ttlMs: number = 5 * 60 * 1000, // 5 minutes default
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    await this.set(key, entry);
  }

  static async getCache<T>(key: string): Promise<T | null> {
    const entry = await this.get<CacheEntry<T>>(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.remove(key);
      return null;
    }

    return entry.data;
  }

  static async setCacheSync<T>(
    key: string,
    data: T,
    ttlMs: number = 5 * 60 * 1000,
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    this.setSync(key, entry);
  }

  static getCacheSync<T>(key: string): T | null {
    const entry = this.getSync<CacheEntry<T>>(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.removeSync(key);
      return null;
    }

    return entry.data;
  }

  // Multi-get/set operations
  static async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const results = await AsyncStorage.multiGet(keys);
      const data: Record<string, T | null> = {};

      results.forEach(([key, value]) => {
        try {
          data[key] = value ? JSON.parse(value) : null;
        } catch {
          data[key] = null;
        }
      });

      return data;
    } catch (error) {
      console.error('Failed to multi-get:', error);
      return {};
    }
  }

  static async multiSet<T>(data: Record<string, T>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(data).map(
        ([key, value]) => [key, JSON.stringify(value)],
      );
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Failed to multi-set:', error);
    }
  }

  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to multi-remove:', error);
    }
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  // API Data
  POSTS: 'cache:posts',
  USER_PROFILE: 'cache:user_profile:',
  BRANDS: 'cache:brands',
  AUCTIONS: 'cache:auctions',
  TIP_HISTORY: 'cache:tip_history:',

  // User Preferences
  THEME: 'pref:theme',
  NOTIFICATIONS: 'pref:notifications',
  LANGUAGE: 'pref:language',

  // App State
  LAST_SYNC: 'state:last_sync',
  PENDING_ACTIONS: 'state:pending_actions',
  DRAFT_POSTS: 'state:draft_posts',
} as const;

// Helper functions for specific data types
export const cacheHelpers = {
  // Posts cache with pagination support
  async cachePosts(posts: any[], page: number = 0): Promise<void> {
    const key = `${CACHE_KEYS.POSTS}:${page}`;
    await StorageService.setCache(key, posts, 2 * 60 * 1000); // 2 minutes
  },

  async getCachedPosts(page: number = 0): Promise<any[] | null> {
    const key = `${CACHE_KEYS.POSTS}:${page}`;
    return await StorageService.getCache(key);
  },

  // User profile cache
  async cacheUserProfile(wallet: string, profile: any): Promise<void> {
    const key = `${CACHE_KEYS.USER_PROFILE}${wallet}`;
    await StorageService.setCache(key, profile, 10 * 60 * 1000); // 10 minutes
  },

  async getCachedUserProfile(wallet: string): Promise<any | null> {
    const key = `${CACHE_KEYS.USER_PROFILE}${wallet}`;
    return await StorageService.getCache(key);
  },

  // Offline actions queue
  async addPendingAction(action: any): Promise<void> {
    const existing =
      (await StorageService.get<any[]>(CACHE_KEYS.PENDING_ACTIONS)) || [];
    existing.push({...action, id: Date.now(), timestamp: Date.now()});
    await StorageService.set(CACHE_KEYS.PENDING_ACTIONS, existing);
  },

  async getPendingActions(): Promise<any[]> {
    return (await StorageService.get<any[]>(CACHE_KEYS.PENDING_ACTIONS)) || [];
  },

  async removePendingAction(actionId: number): Promise<void> {
    const existing =
      (await StorageService.get<any[]>(CACHE_KEYS.PENDING_ACTIONS)) || [];
    const filtered = existing.filter(action => action.id !== actionId);
    await StorageService.set(CACHE_KEYS.PENDING_ACTIONS, filtered);
  },

  async clearPendingActions(): Promise<void> {
    await StorageService.remove(CACHE_KEYS.PENDING_ACTIONS);
  },
};
