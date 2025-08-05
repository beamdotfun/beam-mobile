export interface CacheConfig {
  version: number;
  maxSize: number; // MB
  maxAge: number; // milliseconds
  strategies: {
    feeds: CacheStrategy;
    profiles: CacheStrategy;
    media: CacheStrategy;
    brands: CacheStrategy;
    auctions: CacheStrategy;
  };
}

export interface CacheStrategy {
  type:
    | 'cache-first'
    | 'network-first'
    | 'network-only'
    | 'cache-only'
    | 'stale-while-revalidate';
  ttl: number; // time to live in milliseconds
  maxItems?: number;
  prioritize?: 'recent' | 'popular' | 'custom';
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
  version: number;
  expiresAt: number;
  etag?: string;
  size: number; // bytes
}

export interface SyncQueue {
  id: string;
  type: 'post' | 'comment' | 'vote' | 'tip' | 'follow' | 'brand' | 'auction';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface OfflineState {
  isOnline: boolean;
  lastSyncTimestamp: number;
  syncQueue: SyncQueue[];
  cacheSize: number;
  pendingOperations: number;
}

export interface SyncResult {
  successful: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface MediaCache {
  uri: string;
  localPath: string;
  size: number;
  contentType: string;
  lastAccessed: number;
  downloadProgress?: number;
}

export interface OfflineCapability {
  feature: string;
  available: boolean;
  limitations?: string[];
}

export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  isInternetReachable: boolean;
  details?: {
    isConnectionExpensive: boolean;
    cellularGeneration?: string;
    carrier?: string;
  };
}
