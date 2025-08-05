import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {
  CacheConfig,
  CachedItem,
  SyncQueue,
  OfflineState,
  SyncResult,
  MediaCache,
  NetworkInfo,
  OfflineCapability,
} from '@/types/offline';
import {offlineService} from '../services/offline/offlineService';
import {cacheService} from '../services/offline/cacheService';
import {syncService} from '../services/offline/syncService';

interface OfflineStore extends OfflineState {
  // Network state
  networkInfo: NetworkInfo;

  // Cache management
  cacheConfig: CacheConfig;
  mediaCache: Map<string, MediaCache>;

  // Actions
  initializeOfflineSupport: () => Promise<void>;
  updateNetworkStatus: (isOnline: boolean, networkInfo?: NetworkInfo) => void;

  // Sync operations
  addToSyncQueue: (
    item: Omit<SyncQueue, 'id' | 'timestamp' | 'retryCount' | 'status'>,
  ) => void;
  syncPendingOperations: () => Promise<SyncResult>;
  retryFailedOperations: () => Promise<SyncResult>;
  clearSyncQueue: () => void;

  // Cache operations
  getCachedData: <T>(key: string) => Promise<T | null>;
  setCachedData: <T>(key: string, data: T, ttl?: number) => Promise<void>;
  invalidateCache: (pattern?: string) => Promise<void>;
  clearCache: () => Promise<void>;
  calculateCacheSize: () => Promise<number>;
  pruneCache: () => Promise<void>;

  // Media caching
  cacheMedia: (uri: string) => Promise<string>;
  getCachedMedia: (uri: string) => string | null;
  clearMediaCache: () => Promise<void>;

  // Offline capabilities
  checkOfflineCapability: (feature: string) => boolean;
  getOfflineCapabilities: () => OfflineCapability[];

  // Utilities
  setLastSyncTimestamp: (timestamp: number) => void;
  updateCacheSize: () => Promise<void>;
}

const defaultCacheConfig: CacheConfig = {
  version: 1,
  maxSize: 100, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  strategies: {
    feeds: {
      type: 'stale-while-revalidate',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxItems: 100,
      prioritize: 'recent',
    },
    profiles: {
      type: 'cache-first',
      ttl: 60 * 60 * 1000, // 1 hour
      maxItems: 50,
    },
    media: {
      type: 'cache-first',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxItems: 200,
    },
    brands: {
      type: 'network-first',
      ttl: 30 * 60 * 1000, // 30 minutes
      maxItems: 30,
    },
    auctions: {
      type: 'network-first',
      ttl: 60 * 1000, // 1 minute (real-time data)
      maxItems: 20,
    },
  },
};

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: true,
      lastSyncTimestamp: 0,
      syncQueue: [],
      cacheSize: 0,
      pendingOperations: 0,
      networkInfo: {
        type: 'unknown',
        effectiveType: 'unknown',
        isInternetReachable: true,
      },
      cacheConfig: defaultCacheConfig,
      mediaCache: new Map(),

      // Initialize offline support
      initializeOfflineSupport: async () => {
        // Set up network monitoring
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
          const networkInfo: NetworkInfo = {
            type: state.type as any,
            effectiveType: 'unknown',
            isInternetReachable: state.isInternetReachable ?? false,
            details: {
              isConnectionExpensive:
                state.details?.isConnectionExpensive ?? false,
              cellularGeneration: (state.details as any)?.cellularGeneration,
              carrier: (state.details as any)?.carrier,
            },
          };

          get().updateNetworkStatus(state.isConnected ?? false, networkInfo);
        });

        // Load cached data size
        await get().updateCacheSize();

        // Sync pending operations if online
        const netInfoState = await NetInfo.fetch();
        if (netInfoState.isConnected) {
          get().syncPendingOperations();
        }

        // Store unsubscribe function for cleanup
        (global as any).netInfoUnsubscribe = unsubscribe;
      },

      // Update network status
      updateNetworkStatus: (isOnline: boolean, networkInfo?: NetworkInfo) => {
        const wasOffline = !get().isOnline;

        set({
          isOnline,
          ...(networkInfo && {networkInfo}),
        });

        // If coming back online, sync pending operations
        if (wasOffline && isOnline) {
          get().syncPendingOperations();
        }
      },

      // Add to sync queue
      addToSyncQueue: item => {
        const queueItem: SyncQueue = {
          ...item,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };

        set(state => ({
          syncQueue: [...state.syncQueue, queueItem],
          pendingOperations: state.pendingOperations + 1,
        }));

        // Try to sync immediately if online
        if (get().isOnline) {
          get().syncPendingOperations();
        }
      },

      // Sync pending operations
      syncPendingOperations: async () => {
        const {syncQueue, isOnline} = get();
        if (!isOnline || syncQueue.length === 0) {
          return {successful: 0, failed: 0, errors: []};
        }

        const pendingItems = syncQueue.filter(
          item => item.status === 'pending',
        );
        if (pendingItems.length === 0) {
          return {successful: 0, failed: 0, errors: []};
        }

        const result = await syncService.syncItems(pendingItems);

        // Update sync queue
        set(state => {
          const updatedQueue = state.syncQueue.map(item => {
            const syncedItem = result.items.find(i => i.id === item.id);
            if (syncedItem) {
              return {
                ...item,
                status: syncedItem.success
                  ? ('completed' as const)
                  : ('failed' as const),
                error: syncedItem.error,
                retryCount: item.retryCount + 1,
              };
            }
            return item;
          });

          // Remove completed items
          const activeQueue = updatedQueue.filter(
            item => item.status !== 'completed',
          );

          return {
            syncQueue: activeQueue,
            pendingOperations: activeQueue.filter(i => i.status === 'pending')
              .length,
            lastSyncTimestamp: Date.now(),
          };
        });

        return {
          successful: result.successful,
          failed: result.failed,
          errors: result.errors,
        };
      },

      // Retry failed operations
      retryFailedOperations: async () => {
        set(state => ({
          syncQueue: state.syncQueue.map(item =>
            item.status === 'failed'
              ? {...item, status: 'pending' as const}
              : item,
          ),
        }));

        return get().syncPendingOperations();
      },

      // Clear sync queue
      clearSyncQueue: () => {
        set({
          syncQueue: [],
          pendingOperations: 0,
        });
      },

      // Get cached data
      getCachedData: async <T>(key: string): Promise<T | null> => {
        try {
          const cached = await cacheService.get<T>(key);
          if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
          }
          return null;
        } catch (error) {
          console.error('Cache read error:', error);
          return null;
        }
      },

      // Set cached data
      setCachedData: async <T>(key: string, data: T, ttl?: number) => {
        try {
          await cacheService.set(key, data, ttl);
          await get().updateCacheSize();
        } catch (error) {
          console.error('Cache write error:', error);
        }
      },

      // Invalidate cache
      invalidateCache: async (pattern?: string) => {
        try {
          await cacheService.invalidate(pattern);
          await get().updateCacheSize();
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },

      // Clear all cache
      clearCache: async () => {
        try {
          await cacheService.clear();
          set({cacheSize: 0, mediaCache: new Map()});
        } catch (error) {
          console.error('Cache clear error:', error);
        }
      },

      // Calculate cache size
      calculateCacheSize: async () => {
        try {
          const size = await cacheService.calculateSize();
          return size;
        } catch (error) {
          console.error('Cache size calculation error:', error);
          return 0;
        }
      },

      // Prune cache based on strategy
      pruneCache: async () => {
        try {
          await cacheService.prune(get().cacheConfig);
          await get().updateCacheSize();
        } catch (error) {
          console.error('Cache pruning error:', error);
        }
      },

      // Cache media file
      cacheMedia: async (uri: string): Promise<string> => {
        try {
          const cached = get().getCachedMedia(uri);
          if (cached) {
            return cached;
          }

          const localPath = await offlineService.downloadMedia(uri);
          const mediaInfo: MediaCache = {
            uri,
            localPath,
            size: 0, // Will be calculated
            contentType: 'image/jpeg', // Will be detected
            lastAccessed: Date.now(),
          };

          set(state => {
            const newCache = new Map(state.mediaCache);
            newCache.set(uri, mediaInfo);
            return {mediaCache: newCache};
          });

          return localPath;
        } catch (error) {
          console.error('Media cache error:', error);
          throw error;
        }
      },

      // Get cached media
      getCachedMedia: (uri: string): string | null => {
        const cached = get().mediaCache.get(uri);
        if (cached) {
          // Update last accessed
          cached.lastAccessed = Date.now();
          return cached.localPath;
        }
        return null;
      },

      // Clear media cache
      clearMediaCache: async () => {
        try {
          await offlineService.clearMediaCache();
          set({mediaCache: new Map()});
        } catch (error) {
          console.error('Media cache clear error:', error);
        }
      },

      // Check offline capability
      checkOfflineCapability: (feature: string): boolean => {
        const offlineFeatures = [
          'view_feed',
          'view_profile',
          'view_cached_posts',
          'draft_posts',
          'view_cached_brands',
          'view_cached_auctions',
        ];

        return offlineFeatures.includes(feature);
      },

      // Get offline capabilities
      getOfflineCapabilities: () => {
        const {isOnline} = get();

        return [
          {
            feature: 'View Feed',
            available: true,
            limitations: isOnline ? [] : ['Only cached posts visible'],
          },
          {
            feature: 'Create Posts',
            available: true,
            limitations: isOnline ? [] : ['Posts will be queued for sync'],
          },
          {
            feature: 'Vote & React',
            available: true,
            limitations: isOnline ? [] : ['Actions will be synced when online'],
          },
          {
            feature: 'Send Tips',
            available: false,
            limitations: ['Requires blockchain connection'],
          },
          {
            feature: 'View Profiles',
            available: true,
            limitations: isOnline ? [] : ['Only cached profiles available'],
          },
          {
            feature: 'Auctions',
            available: false,
            limitations: ['Real-time data required'],
          },
        ];
      },

      // Set last sync timestamp
      setLastSyncTimestamp: (timestamp: number) => {
        set({lastSyncTimestamp: timestamp});
      },

      // Update cache size
      updateCacheSize: async () => {
        const size = await get().calculateCacheSize();
        set({cacheSize: size});
      },
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        lastSyncTimestamp: state.lastSyncTimestamp,
        syncQueue: state.syncQueue,
        cacheConfig: state.cacheConfig,
      }),
    },
  ),
);
