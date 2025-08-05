import api from './client';
import {ApiResponse, PaginatedResponse, Group} from './types';
import {
  Auction,
  Bid,
  AuctionFilter,
  AuctionSort,
  AuctionListResponse,
  AuctionDetailResponse,
  BidRequest,
  BidResponse,
  WatchlistItem,
  AuctionPayout,
  AuctionStats,
  UserAuctionHistory,
} from '@/types/auction';

interface AuctionQueryParams {
  filter?: AuctionFilter;
  sort?: AuctionSort;
  page?: number;
  pageSize?: number;
}

export class AuctionAPIService {
  /**
   * Get list of auctions with filtering and sorting
   */
  async getAuctions(
    params: AuctionQueryParams = {},
  ): Promise<AuctionListResponse> {
    const {
      filter = {},
      sort = {field: 'endTime', direction: 'asc'},
      page = 1,
      pageSize = 20,
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortField: sort.field,
      sortDirection: sort.direction,
    });

    // Add filter parameters
    if (filter.status?.length) {
      queryParams.append('status', filter.status.join(','));
    }
    if (filter.category?.length) {
      queryParams.append('category', filter.category.join(','));
    }
    if (filter.minBid !== undefined) {
      queryParams.append('minBid', filter.minBid.toString());
    }
    if (filter.maxBid !== undefined) {
      queryParams.append('maxBid', filter.maxBid.toString());
    }
    if (filter.timeRemaining) {
      queryParams.append('timeRemaining', filter.timeRemaining);
    }
    if (filter.brandCategory?.length) {
      queryParams.append('brandCategory', filter.brandCategory.join(','));
    }
    if (filter.hasUserBid !== undefined) {
      queryParams.append('hasUserBid', filter.hasUserBid.toString());
    }
    if (filter.qualityScoreMin !== undefined) {
      queryParams.append('qualityScoreMin', filter.qualityScoreMin.toString());
    }

    const response = await api.get<ApiResponse<AuctionListResponse>>(
      `/auctions?${queryParams.toString()}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch auctions');
    }

    return response.data.data;
  }

  /**
   * Get detailed auction information including bids and activities
   */
  async getAuctionDetails(auctionId: string): Promise<AuctionDetailResponse> {
    const response = await api.get<ApiResponse<AuctionDetailResponse>>(
      `/auctions/${auctionId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch auction details',
      );
    }

    return response.data.data;
  }

  // Auction Management (Legacy methods for backward compatibility)
  async getAuction(groupId: string): Promise<Auction> {
    const response = await api.get<ApiResponse<Auction>>(
      `/auctions/${groupId}`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getActiveAuctions(
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Auction>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Auction>>>(
      '/auctions/active',
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getAuctionHistory(
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Auction>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Auction>>>(
      '/auctions/history',
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getUserAuctions(
    wallet: string,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Auction>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Auction>>>(
      `/users/${wallet}/auctions`,
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Bidding
  /**
   * Place a bid on an auction (New format)
   */
  async placeBid(bidRequest: BidRequest): Promise<BidResponse> {
    const response = await api.post<ApiResponse<BidResponse>>(
      `/auctions/${bidRequest.auctionId}/bids`,
      {
        amount: bidRequest.amount,
        isAutoBid: bidRequest.isAutoBid,
        maxAmount: bidRequest.maxAmount,
      },
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to place bid');
    }

    return response.data.data;
  }

  /**
   * Place a bid (Legacy format)
   */
  async placeBidLegacy(
    bidData: any,
  ): Promise<{transaction: string; bidId: number}> {
    const response = await api.post<
      ApiResponse<{transaction: string; bidId: number}>
    >('/bids', bidData);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getAuctionBids(
    groupId: string,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Bid>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Bid>>>(
      `/auctions/${groupId}/bids`,
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getUserBidsLegacy(
    wallet: string,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Bid>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Bid>>>(
      `/users/${wallet}/bids`,
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getBidDetails(bidId: number): Promise<Bid> {
    const response = await api.get<ApiResponse<Bid>>(`/bids/${bidId}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Groups
  async getGroup(groupId: string): Promise<Group> {
    const response = await api.get<ApiResponse<Group>>(`/groups/${groupId}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getAllGroups(
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Group>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Group>>>(
      '/groups',
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getActiveGroups(): Promise<Group[]> {
    const response = await api.get<ApiResponse<Group[]>>('/groups/active');
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getGroupsByCategory(
    category: string,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Group>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Group>>>(
      `/groups/category/${category}`,
      {
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getUserGroups(wallet: string): Promise<Group[]> {
    const response = await api.get<ApiResponse<Group[]>>(
      `/users/${wallet}/groups`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Group Management (Admin)
  async createGroup(groupData: {
    name: string;
    description: string;
    category: string;
    minPricePerSlot: number;
  }): Promise<{transaction: string; groupId: string}> {
    const response = await api.post<
      ApiResponse<{transaction: string; groupId: string}>
    >('/admin/groups', groupData);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async updateGroup(
    groupId: string,
    groupData: Partial<{
      name: string;
      description: string;
      category: string;
      minPricePerSlot: number;
    }>,
  ): Promise<{transaction: string}> {
    const response = await api.put<ApiResponse<{transaction: string}>>(
      `/admin/groups/${groupId}`,
      groupData,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async activateGroup(groupId: string): Promise<{transaction: string}> {
    const response = await api.post<ApiResponse<{transaction: string}>>(
      `/admin/groups/${groupId}/activate`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async deactivateGroup(groupId: string): Promise<{transaction: string}> {
    const response = await api.post<ApiResponse<{transaction: string}>>(
      `/admin/groups/${groupId}/deactivate`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Auction Statistics
  async getAuctionStats(groupId?: string): Promise<{
    totalAuctions: number;
    activeAuctions: number;
    totalBids: number;
    averageBidAmount: number;
    totalVolume: number;
  }> {
    const endpoint = groupId ? `/auctions/stats/${groupId}` : '/auctions/stats';
    const response = await api.get<
      ApiResponse<{
        totalAuctions: number;
        activeAuctions: number;
        totalBids: number;
        averageBidAmount: number;
        totalVolume: number;
      }>
    >(endpoint);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getLeaderboard(
    period = 'weekly',
    limit = 10,
  ): Promise<{topBidders: any[]; topSpenders: any[]}> {
    const response = await api.get<
      ApiResponse<{topBidders: any[]; topSpenders: any[]}>
    >('/auctions/leaderboard', {
      period,
      limit,
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Real-time Auction Updates
  async getAuctionUpdates(
    groupId: string,
    lastUpdateTime: number,
  ): Promise<{
    auction: Auction;
    recentBids: Bid[];
    hasUpdates: boolean;
  }> {
    const response = await api.get<
      ApiResponse<{
        auction: Auction;
        recentBids: Bid[];
        hasUpdates: boolean;
      }>
    >(`/auctions/${groupId}/updates`, {
      since: lastUpdateTime,
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // New Auction Methods for Task 12
  /**
   * Get auction statistics
   */
  async getStats(): Promise<AuctionStats> {
    const response = await api.get<ApiResponse<AuctionStats>>('/auctions/stats');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch stats');
    }

    return response.data.data;
  }

  /**
   * Get user's bid history
   */
  async getUserBids(): Promise<Bid[]> {
    const response = await api.get<ApiResponse<{bids: Bid[]}>>('/auctions/user/bids');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch user bids');
    }

    return response.data.data.bids;
  }

  /**
   * Get user's auction history and statistics
   */
  async getUserHistory(): Promise<UserAuctionHistory> {
    const response = await api.get<ApiResponse<UserAuctionHistory>>('/auctions/user/history');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch user history');
    }

    return response.data.data;
  }

  /**
   * Get user's payout history
   */
  async getUserPayouts(): Promise<AuctionPayout[]> {
    const response = await api.get<ApiResponse<{payouts: AuctionPayout[]}>>('/auctions/user/payouts');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch user payouts');
    }

    return response.data.data.payouts;
  }

  /**
   * Add auction to user's watchlist
   */
  async addToWatchlist(
    auctionId: string,
    notifications: {onBidUpdate?: boolean; onEndingSoon?: boolean} = {},
  ): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      `/auctions/${auctionId}/watch`,
      {
        notifyOnBidUpdate: notifications.onBidUpdate ?? false,
        notifyOnEndingSoon: notifications.onEndingSoon ?? true,
      },
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to add to watchlist');
    }
  }

  /**
   * Remove auction from user's watchlist
   */
  async removeFromWatchlist(auctionId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/auctions/${auctionId}/watch`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to remove from watchlist',
      );
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await api.get<ApiResponse<{watchlist: WatchlistItem[]}>>('/auctions/user/watchlist');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch watchlist');
    }

    return response.data.data.watchlist;
  }

  /**
   * Update watchlist notification preferences
   */
  async updateWatchlistNotifications(
    auctionId: string,
    notifications: {onBidUpdate?: boolean; onEndingSoon?: boolean},
  ): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      `/auctions/${auctionId}/watch`,
      {
        notifyOnBidUpdate: notifications.onBidUpdate,
        notifyOnEndingSoon: notifications.onEndingSoon,
      },
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to update watchlist notifications',
      );
    }
  }

  /**
   * Get featured auctions for home screen
   */
  async getFeaturedAuctions(): Promise<Auction[]> {
    const response = await api.get<ApiResponse<{auctions: Auction[]}>>('/auctions/featured');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch featured auctions',
      );
    }

    return response.data.data.auctions;
  }

  /**
   * Get ending soon auctions
   */
  async getEndingSoonAuctions(): Promise<Auction[]> {
    const response = await api.get<ApiResponse<{auctions: Auction[]}>>('/auctions/ending-soon');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch ending soon auctions',
      );

    return response.data.data.auctions;
  }

  /**
   * Get trending auctions based on activity
   */
  async getTrendingAuctions(): Promise<Auction[]> {
    const response = await api.get<ApiResponse<{auctions: Auction[]}>>('/auctions/trending');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch trending auctions',
      );
    }

    return response.data.data.auctions;
  }

  /**
   * Get recommended auctions for user
   */
  async getRecommendedAuctions(): Promise<Auction[]> {
    const response = await api.get<ApiResponse<{auctions: Auction[]}>>('/auctions/recommended');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch recommended auctions',
      );

    return response.data.data.auctions;
  }

  /**
   * Search auctions by query
   */
  async searchAuctions(
    query: string,
    filter?: AuctionFilter,
  ): Promise<Auction[]> {
    const queryParams = new URLSearchParams({
      q: query,
    });

    if (filter?.category?.length) {
      queryParams.append('category', filter.category.join(','));
    }
    if (filter?.minBid !== undefined) {
      queryParams.append('minBid', filter.minBid.toString());
    }
    if (filter?.maxBid !== undefined) {
      queryParams.append('maxBid', filter.maxBid.toString());
    }

    const response = await api.get<ApiResponse<{auctions: Auction[]}>>(
      `/auctions/search?${queryParams.toString()}`,

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to search auctions');
    }

    return response.data.data.auctions;
  }
}

export const auctionAPI = new AuctionAPIService();
