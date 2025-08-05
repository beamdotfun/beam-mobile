import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {socialAPI} from '../../services/api/social';
import {cacheHelpers} from '../../services/storage';
// WebSocket service removed - using polling instead
import {useEffect} from 'react';

// Query Keys
export const SOCIAL_QUERY_KEYS = {
  users: ['users'],
  user: (wallet: string) => ['users', wallet],
  userPosts: (wallet: string) => ['users', wallet, 'posts'],
  posts: ['posts'],
  votes: (wallet: string) => ['users', wallet, 'votes'],
  tipHistory: ['tips', 'history'],
  tipStats: (wallet?: string) =>
    wallet ? ['tips', 'stats', wallet] : ['tips', 'stats'],
  tipLeaderboard: (period: string) => ['tips', 'leaderboard', period],
} as const;

// User Hooks
export function useUser(wallet: string) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.user(wallet),
    queryFn: () => socialAPI.getUser(wallet),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.updateProfile,
    onSuccess: profile => {
      // Update user cache
      queryClient.setQueryData(
        SOCIAL_QUERY_KEYS.user(profile.userWallet),
        (oldUser: any) => (oldUser ? {...oldUser, ...profile} : oldUser),
      );
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.users});
    },
  });
}

export function useVerifyNFT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.verifyNFT,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.users});
    },
  });
}

export function useVerifySNS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.verifySNS,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.users});
    },
  });
}

// Posts Hooks
export function usePosts(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...SOCIAL_QUERY_KEYS.posts, {limit, offset}],
    queryFn: () => socialAPI.getPosts(limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserPosts(wallet: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...SOCIAL_QUERY_KEYS.userPosts(wallet), {limit, offset}],
    queryFn: () => socialAPI.getUserPosts(wallet, limit, offset),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 7 * 60 * 1000, // 7 minutes
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.createPost,
    onSuccess: () => {
      // Invalidate posts queries to refresh feed
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.posts});
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.users});
    },
  });
}

export function usePinPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.pinPost,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.posts});
    },
  });
}

export function useUnpinPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.unpinPost,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.posts});
    },
  });
}

// Voting Hooks
export function useVotes(wallet: string) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.votes(wallet),
    queryFn: () => socialAPI.getVotes(wallet),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetWallet,
      voteType,
    }: {
      targetWallet: string;
      voteType: 'upvote' | 'downvote';
    }) => socialAPI.vote(targetWallet, voteType),
    onSuccess: (_, variables) => {
      // Invalidate votes and user data
      queryClient.invalidateQueries({
        queryKey: SOCIAL_QUERY_KEYS.votes(variables.targetWallet),
      });
      queryClient.invalidateQueries({
        queryKey: SOCIAL_QUERY_KEYS.user(variables.targetWallet),
      });
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.users});
    },
  });
}

// Tipping Hooks
export function useSendTip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAPI.sendTip,
    onSuccess: () => {
      // Invalidate tip-related queries
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.tipHistory});
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.tipStats()});
      queryClient.invalidateQueries({queryKey: SOCIAL_QUERY_KEYS.users});
    },
  });
}

export function useTipHistory(
  direction?: 'sent' | 'received',
  limit = 20,
  offset = 0,
) {
  return useQuery({
    queryKey: [...SOCIAL_QUERY_KEYS.tipHistory, {direction, limit, offset}],
    queryFn: () => socialAPI.getTipHistory(direction, limit, offset),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 7 * 60 * 1000, // 7 minutes
  });
}

export function useTipStats(wallet?: string) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.tipStats(wallet),
    queryFn: () => socialAPI.getTipStats(wallet),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTipLeaderboard(period = 'weekly', limit = 10) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.tipLeaderboard(period),
    queryFn: () => socialAPI.getTipLeaderboard(period, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Real-time Updates Hook - WebSocket functionality removed, using polling instead

// Offline-first hooks with caching
export function usePostsWithCache(limit = 20, offset = 0) {
  const page = Math.floor(offset / limit);

  return useQuery({
    queryKey: [...SOCIAL_QUERY_KEYS.posts, {limit, offset}],
    queryFn: async () => {
      try {
        const data = await socialAPI.getPosts(limit, offset);
        // Cache the data
        await cacheHelpers.cachePosts(data.data, page);
        return data;
      } catch (error) {
        // Try to get cached data on error
        const cachedData = await cacheHelpers.getCachedPosts(page);
        if (cachedData) {
          return {
            data: cachedData,
            total: cachedData.length,
            page,
            perPage: limit,
          };
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserWithCache(wallet: string) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.user(wallet),
    queryFn: async () => {
      try {
        const data = await socialAPI.getUser(wallet);
        // Cache the profile data
        await cacheHelpers.cacheUserProfile(wallet, data);
        return data;
      } catch (error) {
        // Try to get cached data on error
        const cachedData = await cacheHelpers.getCachedUserProfile(wallet);
        if (cachedData) {
          return cachedData;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
