import api from './client';
import {
  NFTAuction,
  NFTAuctionFilter,
  NFTAuctionsListResponse,
  NFTAuctionResponse,
  BidsResponse,
  BidResponse,
  Bid,
  AutoBidSettings,
} from '@/types/auctions';

interface NFTAuctionQueryParams {
  filter?: NFTAuctionFilter;
  sort?: 'ending_soon' | 'price_low' | 'price_high' | 'most_bids';
  search?: string;
  page?: number;
  pageSize?: number;
}

export class NFTAuctionAPIService {
  /**
   * Get list of NFT auctions with filtering and sorting
   */
  async getAuctions(params: NFTAuctionQueryParams = {}): Promise<NFTAuction[]> {
    const {
      filter = {},
      sort = 'ending_soon',
      search = '',
      page = 1,
      pageSize = 20,
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sort,
    });

    if (search) {
      queryParams.append('search', search);
    }

    // Add filter parameters
    if (filter.status?.length) {
      queryParams.append('status', filter.status.join(','));
    }
    if (filter.categories?.length) {
      queryParams.append('categories', filter.categories.join(','));
    }
    if (filter.brands?.length) {
      queryParams.append('brands', filter.brands.join(','));
    }
    if (filter.priceRange) {
      if (filter.priceRange.min !== undefined) {
        queryParams.append('minPrice', filter.priceRange.min.toString());
      }
      if (filter.priceRange.max !== undefined) {
        queryParams.append('maxPrice', filter.priceRange.max.toString());
      }
    }
    if (filter.endingSoon) {
      queryParams.append('endingSoon', 'true');
    }
    if (filter.featured) {
      queryParams.append('featured', 'true');
    }

    const response = await api.get(`/nft-auctions?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to fetch NFT auctions');
    }

    return response.data?.data?.auctions || [];
  }

  /**
   * Get detailed information about a specific auction
   */
  async getAuction(auctionId: string): Promise<NFTAuction> {
    const response = await api.get(`/nft-auctions/${auctionId}`);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to fetch auction');
    }

    return response.data?.data;
  }

  /**
   * Get bid history for an auction
   */
  async getBids(auctionId: string): Promise<Bid[]> {
    const response = await api.get(`/nft-auctions/${auctionId}/bids`);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to fetch bids');
    }

    return response.data?.data || [];
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(auctionId: string, amount: number): Promise<BidResponse> {
    const response = await api.post(`/nft-auctions/${auctionId}/bid`, {
      amount,
    });

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to place bid');
    }

    return response.data;
  }

  /**
   * Buy NFT immediately at buy-now price
   */
  async buyNow(auctionId: string): Promise<{transaction: string}> {
    const response = await api.post(`/nft-auctions/${auctionId}/buy-now`);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to buy now');
    }

    return response.data?.data;
  }

  /**
   * Add auction to watchlist
   */
  async addToWatchlist(auctionId: string): Promise<void> {
    const response = await api.post(`/nft-auctions/${auctionId}/watch`);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to add to watchlist');
    }
  }

  /**
   * Remove auction from watchlist
   */
  async removeFromWatchlist(auctionId: string): Promise<void> {
    const response = await api.delete(`/nft-auctions/${auctionId}/watch`);

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to remove from watchlist',
      );
    }
  }

  /**
   * Configure auto-bid settings for an auction
   */
  async setAutoBid(
    auctionId: string,
    settings: AutoBidSettings,
  ): Promise<void> {
    const response = await api.post(
      `/nft-auctions/${auctionId}/auto-bid`,
      settings,
    );

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to set auto-bid');
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(): Promise<string[]> {
    const response = await api.get('/nft-auctions/watchlist');

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to fetch watchlist');
    }

    return response.data?.data?.map((item: any) => item.auctionId) || [];
  }

  /**
   * Get user's bid history
   */
  async getUserBids(): Promise<Bid[]> {
    const response = await api.get('/nft-auctions/my-bids');

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to fetch user bids');
    }

    return response.data?.data || [];
  }

  /**
   * Get featured auctions
   */
  async getFeaturedAuctions(): Promise<NFTAuction[]> {
    const response = await api.get('/nft-auctions/featured');

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to fetch featured auctions',
      );
    }

    return response.data?.data || [];
  }

  /**
   * Search auctions by NFT name or description
   */
  async searchAuctions(query: string, limit = 10): Promise<NFTAuction[]> {
    const response = await api.get(
      `/nft-auctions/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to search auctions');
    }

    return response.data?.data || [];
  }
}

export const nftAuctionAPI = new NFTAuctionAPIService();
