import {useState, useEffect, useRef, useCallback} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useAuthStore} from '../store/auth';
import {Post} from '../types/social';
import {pollingService} from '../services/api/polling';
import {transformApiPost} from '../store/socialStore';

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
  resetPolling: () => void;
}

export function useFeedPolling({
  feedType,
  pollingInterval = 30000, // 30 seconds as recommended by backend docs
  enabled = true,
  onNewPosts,
}: UseFeedPollingOptions): FeedPollingResult {
  const [posts, setPosts] = useState<Post[]>([]); // New posts since last viewed
  const [newPostCount, setNewPostCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {isAuthenticated} = useAuthStore();
  const lastSignatureRef = useRef<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAppActiveRef = useRef(true);
  const accumulatedNewPostsRef = useRef<Post[]>([]); // Track accumulated new posts
  const isLoadingRef = useRef(false); // Prevent concurrent updates
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Transform raw API posts to our Post type
  const transformPosts = useCallback((rawPosts: any[]): Post[] => {
    return rawPosts.map(post => {
      // Use the socialStore's transform function for consistency
      return transformApiPost(post);
    });
  }, []);

  // Load initial feed and set reference point
  const loadInitialFeed = useCallback(async () => {
    try {
      setError(null);
      
      console.log(`[FeedPolling] Loading initial ${feedType} feed`);
      
      // Get the latest post to set our reference point
      let result;
      if (feedType === 'watchlist') {
        result = await pollingService.pollWatchlistFeed(undefined, 1);
      } else {
        result = await pollingService.pollRecentFeed(undefined, 1);
      }
      
      if (result?.data?.posts?.length > 0) {
        // Get signature from first post - this is our reference point
        const firstPost = result.data.posts[0];
        const signature = firstPost.postSignature || firstPost.signature || 
                         firstPost.transaction_hash || firstPost.transactionHash;
        lastSignatureRef.current = signature;
        console.log(`[FeedPolling] Set reference signature for ${feedType}: ${signature}`);
        
        // Clear any existing new posts
        setPosts([]);
        setNewPostCount(0);
        accumulatedNewPostsRef.current = [];
      } else {
        console.log(`[FeedPolling] No initial ${feedType} posts found`);
        setPosts([]);
        setNewPostCount(0);
        accumulatedNewPostsRef.current = [];
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load initial feed';
      console.error(`[FeedPolling] Failed to load initial ${feedType} feed:`, err);
      setError(errorMessage);
    }
  }, [feedType]);

  // Check for new posts using the updates endpoint
  const checkForUpdates = useCallback(async () => {
    if (!lastSignatureRef.current || !isAppActiveRef.current || isLoadingRef.current) {
      return;
    }

    // Check if we should throttle
    if (pollingService.shouldThrottle()) {
      const waitTime = pollingService.getWaitTime();
      console.log(`[FeedPolling] Throttling for ${waitTime}ms due to rate limits`);
      scheduleNextPoll(waitTime);
      return;
    }

    isLoadingRef.current = true;
    try {
      setError(null);
      
      console.log(`[FeedPolling] Checking for ${feedType} updates since ${lastSignatureRef.current}`);
      
      // Use the polling service with signature-based cursor
      let result;
      if (feedType === 'watchlist') {
        result = await pollingService.pollWatchlistFeed(lastSignatureRef.current, 20);
      } else {
        result = await pollingService.pollRecentFeed(lastSignatureRef.current, 20);
      }
      
      if (result?.data?.posts?.length > 0) {
        const newRawPosts = result.data.posts;
        console.log(`[FeedPolling] Found ${newRawPosts.length} new ${feedType} posts`);
        
        // Transform the raw posts
        const newPosts = transformPosts(newRawPosts);
        
        // Filter out duplicates from accumulated posts
        const existingSignatures = new Set(
          accumulatedNewPostsRef.current.map(p => 
            p.signature || p.transactionHash || p.id
          )
        );
        
        const uniqueNewPosts = newPosts.filter(post => {
          const sig = post.signature || post.transactionHash || post.id;
          return !existingSignatures.has(sig);
        });
        
        if (uniqueNewPosts.length > 0) {
          // Add to accumulated posts
          accumulatedNewPostsRef.current = [...uniqueNewPosts, ...accumulatedNewPostsRef.current];
          
          // Update state
          setPosts(accumulatedNewPostsRef.current);
          setNewPostCount(accumulatedNewPostsRef.current.length);
          
          console.log(`[FeedPolling] Accumulated ${accumulatedNewPostsRef.current.length} total new posts`);
          
          // Trigger callback if provided
          onNewPosts?.(uniqueNewPosts);
        }
      } else {
        console.log(`[FeedPolling] No new ${feedType} posts found`);
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      // Schedule next poll with normal interval
      scheduleNextPoll(pollingService.getPollingInterval());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Polling failed';
      console.error(`[FeedPolling] Failed to check ${feedType} updates:`, err);
      
      // Handle rate limiting and other errors
      if (errorMessage.includes('Rate limited')) {
        // Wait for the retry-after period
        const waitTime = pollingService.getWaitTime();
        scheduleNextPoll(waitTime);
      } else if (errorMessage.includes('Authentication required') && feedType === 'watchlist') {
        // Stop polling for watchlist if not authenticated
        setError('Authentication required for watchlist');
        stopPolling();
      } else {
        // Retry with exponential backoff
        retryCountRef.current++;
        if (retryCountRef.current < maxRetries) {
          const backoffTime = Math.min(pollingInterval * Math.pow(2, retryCountRef.current), 300000); // Max 5 minutes
          console.log(`[FeedPolling] Retrying in ${backoffTime}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          scheduleNextPoll(backoffTime);
        } else {
          console.error(`[FeedPolling] Max retries reached. Stopping polling.`);
          setError(errorMessage);
          stopPolling();
        }
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [feedType, onNewPosts, transformPosts, pollingInterval]);

  // Schedule next poll
  const scheduleNextPoll = useCallback((delayMs: number) => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    
    if (!enabled) {
      return;
    }
    
    pollingTimeoutRef.current = setTimeout(() => {
      checkForUpdates();
    }, delayMs);
  }, [enabled, checkForUpdates]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling || !enabled) {
      return;
    }

    console.log(`[FeedPolling] Starting ${feedType} polling`);
    setIsPolling(true);
    
    // Initial check
    checkForUpdates();
  }, [enabled, feedType, checkForUpdates]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      console.log(`[FeedPolling] Stopping ${feedType} polling`);
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
      setIsPolling(false);
    }
  }, [feedType]);

  // Mark new posts as viewed and update reference
  const markAsViewed = useCallback(() => {
    // Update reference to the newest post we've shown
    if (accumulatedNewPostsRef.current.length > 0) {
      const newestPost = accumulatedNewPostsRef.current[0];
      const signature = newestPost.signature || newestPost.transactionHash || 
                       newestPost.id?.toString();
      if (signature) {
        lastSignatureRef.current = signature;
        console.log(`[FeedPolling] Updated reference signature after viewing: ${signature}`);
      }
    }
    
    // Clear accumulated posts
    accumulatedNewPostsRef.current = [];
    setPosts([]);
    setNewPostCount(0);
  }, []);

  // Clear polling posts (useful after adding them to main feed)
  const clearPollingPosts = useCallback(() => {
    // Clear but don't update reference - posts weren't viewed yet
    accumulatedNewPostsRef.current = [];
    setPosts([]);
    setNewPostCount(0);
  }, []);
  
  // Reset polling state completely (for feed changes)
  const resetPolling = useCallback(() => {
    console.log(`[FeedPolling] Resetting polling state for ${feedType}`);
    stopPolling();
    lastSignatureRef.current = null;
    accumulatedNewPostsRef.current = [];
    setPosts([]);
    setNewPostCount(0);
    setError(null);
    isLoadingRef.current = false;
    retryCountRef.current = 0;
    pollingService.resetBackoff();
    
    // Re-initialize after reset
    setTimeout(() => {
      loadInitialFeed();
    }, 100);
  }, [feedType, stopPolling, loadInitialFeed]);

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
    if (lastSignatureRef.current && enabled && !isPolling) {
      // Start polling after a short delay to avoid immediate polling after load
      const startDelay = setTimeout(() => {
        startPolling();
      }, 2000);

      return () => clearTimeout(startDelay);
    }
  }, [enabled, isPolling, startPolling, feedType]);

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
    resetPolling,
  };
}