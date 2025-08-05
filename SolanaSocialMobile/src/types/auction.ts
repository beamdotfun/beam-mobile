export interface Auction {
  auctionId: string;
  brandAddress: string;
  brandName: string;
  brandLogo?: string;

  // Auction details
  title: string;
  description: string;
  adContent: AdContent;
  targetAudience: TargetAudience;

  // Bidding information
  startingBid: number;
  currentBid: number;
  bidIncrement: number;
  reservePrice?: number;

  // Timing
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  timeRemaining?: number;

  // Status
  status: 'pending' | 'active' | 'ending_soon' | 'ended' | 'cancelled';
  isExtended: boolean;
  extensionCount: number;

  // Participants
  totalBidders: number;
  totalBids: number;
  currentWinner?: string;
  currentWinnerName?: string;

  // Rewards and payouts
  totalPayout: number;
  userPayout: number;
  groupPayout: number;
  platformFee: number;

  // Performance metrics
  expectedReach: number;
  estimatedImpressions: number;
  qualityScore: number;

  // User interaction
  userHasBid: boolean;
  userMaxBid?: number;
  userIsWatching: boolean;
  userEligibleForPayout: boolean;
}

export interface AdContent {
  type: 'banner' | 'sponsored_post' | 'video' | 'native';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  clickUrl: string;
  callToAction: string;
  duration?: number; // for video ads
}

export interface TargetAudience {
  minReputation?: number;
  maxReputation?: number;
  verifiedUsersOnly: boolean;
  nftHoldersOnly: boolean;
  snsOwnersOnly: boolean;
  geographicRegions?: string[];
  interests?: string[];
  excludedUsers?: string[];
  maxAudienceSize?: number;
}

export interface Bid {
  bidId: string;
  auctionId: string;
  bidderWallet: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
  isAutoBid: boolean;
  maxAmount?: number;
  timestamp: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface AuctionFilter {
  status?: Auction['status'][];
  category?: string[];
  minBid?: number;
  maxBid?: number;
  timeRemaining?: 'ending_soon' | 'today' | 'this_week';
  brandCategory?: string[];
  hasUserBid?: boolean;
  qualityScoreMin?: number;
}

export interface AuctionSort {
  field:
    | 'endTime'
    | 'currentBid'
    | 'totalBidders'
    | 'qualityScore'
    | 'expectedReach';
  direction: 'asc' | 'desc';
}

export interface BidRequest {
  auctionId: string;
  amount: number;
  isAutoBid?: boolean;
  maxAmount?: number;
}

export interface BidResponse {
  success: boolean;
  bid?: Bid;
  newCurrentBid?: number;
  isWinning?: boolean;
  message?: string;
  error?: string;
}

export interface WatchlistItem {
  auctionId: string;
  addedAt: string;
  notifyOnBidUpdate: boolean;
  notifyOnEndingSoon: boolean;
}

export interface AuctionActivity {
  id: string;
  auctionId: string;
  type:
    | 'bid_placed'
    | 'auction_extended'
    | 'auction_ended'
    | 'payout_distributed';
  userId?: string;
  userName?: string;
  userAvatar?: string;
  timestamp: string;
  data: {
    amount?: number;
    previousBid?: number;
    extensionMinutes?: number;
    winnerPayout?: number;
    participantPayout?: number;
  };
}

export interface AuctionPayout {
  auctionId: string;
  userId: string;
  payoutType: 'winner' | 'participant' | 'group_bonus';
  amount: number;
  currency: 'SOL' | 'USD';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  processedAt?: string;
  description: string;
}

export interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  totalBids: number;
  totalPayout: number;
  averageBidAmount: number;
  participationRate: number;
  winRate?: number; // For authenticated users
  totalEarnings?: number; // For authenticated users
}

export interface UserAuctionHistory {
  participated: Auction[];
  won: Auction[];
  watching: Auction[];
  totalBids: number;
  totalWinnings: number;
  averageBidAmount: number;
  successRate: number;
}

// API Response Types
export interface AuctionListResponse {
  auctions: Auction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  stats?: AuctionStats;
}

export interface AuctionDetailResponse {
  auction: Auction;
  recentBids: Bid[];
  activities: AuctionActivity[];
  relatedAuctions: Auction[];
}

