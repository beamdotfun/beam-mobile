import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {auctionAPI} from '../../services/api/auction';
// WebSocket service removed - using polling instead
import {useEffect} from 'react';

// Query Keys
export const AUCTION_QUERY_KEYS = {
  auctions: ['auctions'],
  auction: (groupId: string) => ['auctions', groupId],
  activeAuctions: ['auctions', 'active'],
  auctionHistory: ['auctions', 'history'],
  userAuctions: (wallet: string) => ['users', wallet, 'auctions'],
  auctionBids: (groupId: string) => ['auctions', groupId, 'bids'],
  userBids: (wallet: string) => ['users', wallet, 'bids'],
  bidDetails: (bidId: number) => ['bids', bidId],
  groups: ['groups'],
  group: (groupId: string) => ['groups', groupId],
  activeGroups: ['groups', 'active'],
  groupsByCategory: (category: string) => ['groups', 'category', category],
  userGroups: (wallet: string) => ['users', wallet, 'groups'],
  auctionStats: (groupId?: string) =>
    groupId ? ['auctions', 'stats', groupId] : ['auctions', 'stats'],
  leaderboard: (period: string) => ['auctions', 'leaderboard', period],
  auctionUpdates: (groupId: string) => ['auctions', groupId, 'updates'],
} as const;

// Auction Hooks
export function useAuction(groupId: string) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.auction(groupId),
    queryFn: () => auctionAPI.getAuction(groupId),
    staleTime: 30 * 1000, // 30 seconds for active auctions
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

export function useActiveAuctions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.activeAuctions, {limit, offset}],
    queryFn: () => auctionAPI.getActiveAuctions(limit, offset),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

export function useAuctionHistory(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.auctionHistory, {limit, offset}],
    queryFn: () => auctionAPI.getAuctionHistory(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useUserAuctions(wallet: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.userAuctions(wallet), {limit, offset}],
    queryFn: () => auctionAPI.getUserAuctions(wallet, limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Bidding Hooks
export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: auctionAPI.placeBid,
    onSuccess: (_, variables) => {
      // Invalidate auction and bid-related queries
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.auction(variables.auctionId),
      });
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.auctionBids(variables.auctionId),
      });
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.activeAuctions,
      });
      queryClient.invalidateQueries({queryKey: ['users', 'bids']});
    },
  });
}

export function useAuctionBids(groupId: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.auctionBids(groupId), {limit, offset}],
    queryFn: () => auctionAPI.getAuctionBids(groupId, limit, offset),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refresh for live bidding
  });
}

export function useUserBids(wallet: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.userBids(wallet), {limit, offset}],
    queryFn: () => auctionAPI.getUserBidsLegacy(wallet, limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBidDetails(bidId: number) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.bidDetails(bidId),
    queryFn: () => auctionAPI.getBidDetails(bidId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Group Hooks
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.group(groupId),
    queryFn: () => auctionAPI.getGroup(groupId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useGroups(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.groups, {limit, offset}],
    queryFn: () => auctionAPI.getAllGroups(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useActiveGroups() {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.activeGroups,
    queryFn: () => auctionAPI.getActiveGroups(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useGroupsByCategory(category: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [
      ...AUCTION_QUERY_KEYS.groupsByCategory(category),
      {limit, offset},
    ],
    queryFn: () => auctionAPI.getGroupsByCategory(category, limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useUserGroups(wallet: string) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.userGroups(wallet),
    queryFn: () => auctionAPI.getUserGroups(wallet),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Admin Group Hooks
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: auctionAPI.createGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: AUCTION_QUERY_KEYS.groups});
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.groupsByCategory(variables.category),
      });
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.activeGroups,
      });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({groupId, groupData}: {groupId: string; groupData: any}) =>
      auctionAPI.updateGroup(groupId, groupData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.group(variables.groupId),
      });
      queryClient.invalidateQueries({queryKey: AUCTION_QUERY_KEYS.groups});
    },
  });
}

export function useActivateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: auctionAPI.activateGroup,
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.group(groupId),
      });
      queryClient.invalidateQueries({queryKey: AUCTION_QUERY_KEYS.groups});
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.activeGroups,
      });
    },
  });
}

export function useDeactivateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: auctionAPI.deactivateGroup,
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.group(groupId),
      });
      queryClient.invalidateQueries({queryKey: AUCTION_QUERY_KEYS.groups});
      queryClient.invalidateQueries({
        queryKey: AUCTION_QUERY_KEYS.activeGroups,
      });
    },
  });
}

// Statistics Hooks
export function useAuctionStats(groupId?: string) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.auctionStats(groupId),
    queryFn: () => auctionAPI.getAuctionStats(groupId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useLeaderboard(period = 'weekly', limit = 10) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.leaderboard(period),
    queryFn: () => auctionAPI.getLeaderboard(period, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Real-time Updates Hook
export function useAuctionUpdates(groupId: string) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.auctionUpdates(groupId),
    queryFn: () => auctionAPI.getAuctionUpdates(groupId, 0),
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 10 * 1000, // Very frequent updates for active auctions
  });
}

// Live Auction Hook - WebSocket functionality removed, using polling instead
export function useLiveAuction(groupId: string) {
  const auctionQuery = useAuction(groupId);

  return {
    ...auctionQuery,
    isLive: auctionQuery.data?.status === 'active',
  };
}
