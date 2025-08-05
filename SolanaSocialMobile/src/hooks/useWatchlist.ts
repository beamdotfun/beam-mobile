import { useState, useCallback, useEffect } from 'react';
import { watchlistService } from '../services/api/watchlist';

/**
 * Hook for managing watchlist (following) functionality
 */
export function useWatchlist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState(0);

  // Reset error when starting new operations
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Follow a user by wallet address
  const followUser = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Following user: ${walletAddress}`);
      const result = await watchlistService.followWallet(walletAddress);
      
      // Optimistically add to following list
      setFollowingCount(prev => prev + 1);
      
      console.log(`✅ Successfully followed user: ${walletAddress}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      console.error(`❌ Failed to follow user: ${walletAddress}`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unfollow a user by wallet address
  const unfollowUser = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Unfollowing user: ${walletAddress}`);
      const result = await watchlistService.unfollowWallet(walletAddress);
      
      // Optimistically remove from following list
      setFollowingList(prev => prev.filter(user => user.walletAddress !== walletAddress));
      setFollowingCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ Successfully unfollowed user: ${walletAddress}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user';
      console.error(`❌ Failed to unfollow user: ${walletAddress}`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle follow status
  const toggleFollow = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Toggling follow status for: ${walletAddress}`);
      const result = await watchlistService.toggleFollow(walletAddress);
      
      if (result.action === 'followed') {
        setFollowingCount(prev => prev + 1);
      } else {
        setFollowingList(prev => prev.filter(user => user.walletAddress !== walletAddress));
        setFollowingCount(prev => Math.max(0, prev - 1));
      }
      
      console.log(`✅ Successfully ${result.action} user: ${walletAddress}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update follow status';
      console.error(`❌ Failed to toggle follow for: ${walletAddress}`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if following a specific user
  const isFollowing = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      // First check local state for performance
      const localResult = followingList.some(user => user.walletAddress === walletAddress);
      if (localResult) return true;
      
      // If not found locally, check with API
      return await watchlistService.isFollowing(walletAddress);
    } catch (err) {
      console.warn('Failed to check following status:', err);
      return false;
    }
  }, [followingList]);

  // Load watchlist members
  const loadWatchlistMembers = useCallback(async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Loading watchlist members (page: ${page})`);
      const result = await watchlistService.getWatchlistMembers(page, limit);
      
      if (page === 1) {
        // First page - replace the list
        setFollowingList(result.data?.following || []);
      } else {
        // Subsequent pages - append to the list
        setFollowingList(prev => [...prev, ...(result.data?.following || [])]);
      }
      
      setFollowingCount(result.data?.pagination?.total || 0);
      
      console.log(`✅ Loaded ${result.data?.following?.length || 0} watchlist members`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load watchlist members';
      console.error('❌ Failed to load watchlist members:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh watchlist members
  const refreshWatchlist = useCallback(async () => {
    return loadWatchlistMembers(1, 50); // Load first 50 for refresh
  }, [loadWatchlistMembers]);

  return {
    // Actions
    followUser,
    unfollowUser,
    toggleFollow,
    isFollowing,
    loadWatchlistMembers,
    refreshWatchlist,
    resetError,
    
    // State
    loading,
    error,
    followingList,
    followingCount,
  };
}

/**
 * Hook for managing watchlist feed
 */
export function useWatchlistFeed() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [followedWallets, setFollowedWallets] = useState<string[]>([]);

  // Reset error when starting new operations
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Load watchlist feed
  const loadWatchlistFeed = useCallback(async (
    page: number = 1, 
    limit: number = 20, 
    includeHidden: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Loading watchlist feed (page: ${page})`);
      const result = await watchlistService.getWatchlistFeed(page, limit, includeHidden);
      
      if (page === 1) {
        // First page - replace the list
        setPosts(result.data?.posts || []);
      } else {
        // Subsequent pages - append to the list
        setPosts(prev => [...prev, ...(result.data?.posts || [])]);
      }
      
      setPagination(result.data?.pagination || null);
      setFollowedWallets(result.data?.followed_wallets || []);
      
      console.log(`✅ Loaded ${result.data?.posts?.length || 0} posts from watchlist feed`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load watchlist feed';
      console.error('❌ Failed to load watchlist feed:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh watchlist feed
  const refreshFeed = useCallback(async () => {
    return loadWatchlistFeed(1, 20);
  }, [loadWatchlistFeed]);

  return {
    // Actions
    loadWatchlistFeed,
    refreshFeed,
    resetError,
    
    // State
    loading,
    error,
    posts,
    pagination,
    followedWallets,
  };
}