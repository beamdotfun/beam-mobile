export interface BrandInfo {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
}

export interface NFTAuction {
  id: string;
  brandId: string;
  brand: BrandInfo;

  // NFT Details
  nft: {
    mintAddress: string;
    name: string;
    description: string;
    image: string;
    attributes: NFTAttribute[];
    collection?: string;
  };

  // Auction Settings
  startPrice: number; // SOL
  reservePrice?: number; // SOL
  buyNowPrice?: number; // SOL
  bidIncrement: number; // SOL

  // Timing
  startTime: string;
  endTime: string;
  extendTime: number; // seconds to extend on last-minute bid

  // Current State
  status: NFTAuctionStatus;
  currentBid: number;
  bidCount: number;
  highestBidder?: string;

  // Metadata
  viewCount: number;
  watcherCount: number;
  isWatching?: boolean;

  // Settlement
  winner?: string;
  finalPrice?: number;
  settlementTx?: string;

  createdAt: string;
  updatedAt: string;
}

export type NFTAuctionStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'ending' // Last 5 minutes
  | 'ended'
  | 'settled'
  | 'cancelled';

export interface Bid {
  id: string;
  auctionId: string;
  bidderWallet: string;
  bidder: {
    wallet: string;
    displayName: string;
    avatar?: string;
    reputation: number;
  };

  amount: number; // SOL
  transactionSignature: string;

  // Status
  status: 'pending' | 'confirmed' | 'outbid' | 'won' | 'refunded';
  confirmedAt?: string;

  // Auto-bid settings
  isAutoBid: boolean;
  maxAutoBid?: number;

  timestamp: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFTAuctionFilter {
  status?: NFTAuctionStatus[];
  categories?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  endingSoon?: boolean; // Within 1 hour
  featured?: boolean;
  search?: string;
}

export interface NFTAuctionActivity {
  id: string;
  auctionId: string;
  type: ActivityType;
  actor: string;
  data: any;
  timestamp: string;
}

export type ActivityType =
  | 'bid_placed'
  | 'auction_extended'
  | 'buy_now'
  | 'auction_ended'
  | 'price_met';

export interface AutoBidSettings {
  enabled: boolean;
  maxAmount: number;
  incrementStrategy: 'minimum' | 'aggressive';
  notifications: boolean;
}

export interface NFTAuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  totalVolume: number; // SOL
  averagePrice: number;
  topCategories: CategoryStat[];
  priceHistory: PricePoint[];
}

export interface CategoryStat {
  category: string;
  count: number;
  volume: number;
}

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

// API Response types
export interface NFTAuctionResponse {
  success: boolean;
  message: string;
  data: NFTAuction;
}

export interface NFTAuctionsListResponse {
  success: boolean;
  message: string;
  data: {
    auctions: NFTAuction[];
    hasMore: boolean;
    page: number;
    totalPages: number;
  };
}

export interface BidsResponse {
  success: boolean;
  message: string;
  data: Bid[];
}

export interface BidResponse {
  success: boolean;
  message: string;
  data: {
    bid: Bid;
    transaction: string; // Base64 encoded transaction
  };
}

// WebSocket message types
export interface NFTAuctionRealtimeUpdate {
  type: 'auction_update' | 'bid_placed' | 'auction_extended' | 'auction_ended';
  auctionId: string;
  data: any;
  timestamp: string;
}

// Constants
export const NFT_AUCTION_STATUSES: Record<
  NFTAuctionStatus,
  {label: string; color: string}
> = {
  draft: {label: 'Draft', color: 'text-gray-500'},
  scheduled: {label: 'Scheduled', color: 'text-blue-500'},
  active: {label: 'Live', color: 'text-green-500'},
  ending: {label: 'Ending Soon', color: 'text-orange-500'},
  ended: {label: 'Ended', color: 'text-red-500'},
  settled: {label: 'Settled', color: 'text-gray-500'},
  cancelled: {label: 'Cancelled', color: 'text-gray-500'},
};

export const BID_STATUSES: Record<
  Bid['status'],
  {label: string; color: string}
> = {
  pending: {label: 'Pending', color: 'text-yellow-500'},
  confirmed: {label: 'Confirmed', color: 'text-green-500'},
  outbid: {label: 'Outbid', color: 'text-red-500'},
  won: {label: 'Won', color: 'text-green-500'},
  refunded: {label: 'Refunded', color: 'text-blue-500'},
};
