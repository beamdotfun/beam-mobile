import {useState, useEffect, useRef, useCallback} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useAuthStore} from '../store/auth';
import {Post} from '../types/social';

interface FeedPollingResponse {
  success: boolean;
  data: {
    posts: Post[];
    count: number;
    since: string;
    has_more: boolean;
    server_time: number;
  };
}

interface UseFeedPollingOptions {
  feedType: 'recent' | 'watchlist';
  pollingInterval?: number; // milliseconds
  enabled?: boolean;
  onNewPosts?: (newPosts: Post[]) => void;
}

interface FeedPollingResult {
  posts: Post[];
  newPostCount: number;
  isPolling: boolean;
  error: string | null;
  markAsViewed: () => void;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  clearPollingPosts: () => void;
}

export function useFeedPolling({
  feedType,
  pollingInterval = 15000, // 15 seconds default
  enabled = true,
  onNewPosts,
}: UseFeedPollingOptions): FeedPollingResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostCount, setNewPostCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {isAuthenticated} = useAuthStore();
  const lastSignatureRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isAppActiveRef = useRef(true);

  // Load initial feed
  const loadInitialFeed = useCallback(async () => {
    try {
      setError(null);
      // Import the social API to use the same endpoints
      const {socialAPI} = await import('../services/api/social');
      
      console.log(`[FeedPolling] Loading initial ${feedType} feed`);
      
      // Use the social API which handles auth and endpoints correctly
      const result = await socialAPI.getPosts(1, 20, feedType);
      
      console.log(`[FeedPolling] API response:`, { 
        success: !!result, 
        hasData: !!result?.data,
        postCount: result?.data?.length 
      });
      
      if (result?.data?.length > 0) {
        setPosts(result.data);
        // Get signature from first post - could be in different fields
        const firstPost = result.data[0];
        const signature = firstPost.signature || firstPost.postSignature || firstPost.transaction_hash || firstPost.transactionHash;
        lastSignatureRef.current = signature;
        console.log(`[FeedPolling] Loaded ${result.data.length} initial ${feedType} posts`);
      } else {
        console.log(`[FeedPolling] No initial ${feedType} posts found`);
        setPosts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load initial feed';
      console.error(`[FeedPolling] Failed to load initial ${feedType} feed:`, err);
      setError(errorMessage);
    }
  }, [feedType]);

  // Check for new posts
  const checkForUpdates = useCallback(async () => {
    if (!lastSignatureRef.current || !isAppActiveRef.current) {
      return;
    }

    try {
      setError(null);
      // Import the social API to use the same endpoints
      const {socialAPI} = await import('../services/api/social');
      
      // Load fresh posts to check for updates
      const result = await socialAPI.getPosts(1, 20, feedType);
      
      if (result?.data?.length > 0) {
        const latestPosts = result.data;
        const latestSignature = latestPosts[0].signature || latestPosts[0].postSignature || 
                               latestPosts[0].transaction_hash || latestPosts[0].transactionHash;
        
        // Check if we have new posts by comparing signatures
        if (latestSignature !== lastSignatureRef.current) {
          // Find how many new posts we have
          const currentIndex = latestPosts.findIndex(post => {
            const sig = post.signature || post.postSignature || 
                       post.transaction_hash || post.transactionHash;
            return sig === lastSignatureRef.current;
          });
          
          const newPostsCount = currentIndex === -1 ? latestPosts.length : currentIndex;
          
          if (newPostsCount > 0) {
            const newPosts = latestPosts.slice(0, newPostsCount);
            console.log(`[FeedPolling] Found ${newPosts.length} new ${feedType} posts`);
            
            // Update new post count (don't add to existing posts yet)
            setNewPostCount(prev => prev + newPosts.length);
            
            // Update cursor to the newest post
            lastSignatureRef.current = latestSignature;
            
            // Trigger callback if provided
            onNewPosts?.(newPosts);
          }
        }
      }
    } catch (err) {
      // Don't set error for polling failures - just log them
      console.error(`[FeedPolling] Failed to check ${feedType} updates:`, err);
    }
  }, [feedType, onNewPosts]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingRef.current || !enabled) {
      return;
    }

    console.log(`[FeedPolling] Starting ${feedType} polling every ${pollingInterval}ms`);
    setIsPolling(true);
    
    pollingRef.current = setInterval(() => {
      checkForUpdates();
    }, pollingInterval);
  }, [enabled, pollingInterval, feedType, checkForUpdates]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      console.log(`[FeedPolling] Stopping ${feedType} polling`);
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setIsPolling(false);
    }
  }, [feedType]);

  // Mark new posts as viewed
  const markAsViewed = useCallback(() => {
    setNewPostCount(0);
  }, []);

  // Clear polling posts (useful after adding them to main feed)
  const clearPollingPosts = useCallback(() => {
    setPosts([]);
    setNewPostCount(0);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const wasActive = isAppActiveRef.current;
      isAppActiveRef.current = nextAppState === 'active';

      if (!wasActive && nextAppState === 'active') {
        // App came to foreground - check for updates immediately
        console.log(`[FeedPolling] App became active, checking ${feedType} updates`);
        if (enabled && lastSignatureRef.current) {
          checkForUpdates();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [enabled, checkForUpdates, feedType]);

  // Initialize feed and start polling
  useEffect(() => {
    // Only proceed if enabled and authenticated (for watchlist) or always (for recent)
    const shouldProceed = enabled && (feedType === 'recent' || isAuthenticated);
    
    if (shouldProceed) {
      loadInitialFeed();
    }

    return () => {
      stopPolling();
    };
  }, [feedType, enabled, isAuthenticated, loadInitialFeed, stopPolling]);

  // Auto-start polling after initial load
  useEffect(() => {
    if (posts.length > 0 && enabled && !isPolling) {
      // Start polling after a short delay to avoid immediate polling after load
      const startDelay = setTimeout(() => {
        startPolling();
      }, 2000);

      return () => clearTimeout(startDelay);
    }
  }, [posts.length, enabled, isPolling, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    posts,
    newPostCount,
    isPolling,
    error,
    markAsViewed,
    refresh: loadInitialFeed,
    startPolling,
    stopPolling,
    clearPollingPosts,
  };
}