export interface Platform {
  id: string;
  platformId: string;
  ownerWallet: string;
  platformName: string;
  platformUrl: string;
  createdAt: string;
  updatedAt: string;

  // Platform configuration
  feeRecipient: string;
  rentalPeriodSlots: number;
  platformFee: number;
  activityStatus: PlatformStatus;

  // Platform metrics
  platformRating: number;
  totalVotes: number;
  totalAuctionsHosted: number;
  totalRevenueGenerated: number;

  // Verification and security
  isVerified: boolean;
  needsSecondSigner: boolean;
  secondSigner?: string;

  // Blockchain data
  platformPDA: string;
  transactionSignature?: string;
  slot?: number;
  blockTime?: string;
  onChainVerified: boolean;

  // UI metadata
  description?: string;
  category?: PlatformCategory;
  tags?: string[];
  logoUrl?: string;
  bannerUrl?: string;
}

export type PlatformStatus = 'active' | 'inactive' | 'suspended';
export type PlatformCategory =
  | 'gaming'
  | 'defi'
  | 'nft'
  | 'social'
  | 'entertainment'
  | 'education'
  | 'ecommerce'
  | 'other';

export interface PlatformVote {
  id: string;
  platformId: string;
  voterWallet: string;
  voterUserId?: number;
  voteType: VoteType;

  // Vote metadata
  createdAt: string;

  // Blockchain data
  voteSignature?: string;
  slot?: number;
  blockTime?: string;
  onChainVerified: boolean;
}

export type VoteType = 'upvote' | 'downvote';

export interface PlatformCreationRequest {
  platformName: string;
  platformUrl: string;
  feeRecipient: string;
  rentalPeriodSlots: number;
  platformFee: number;
  needsSecondSigner: boolean;
  secondSigner?: string;

  // Optional metadata
  description?: string;
  category?: PlatformCategory;
  tags?: string[];
}

export interface PlatformUpdateRequest {
  platformName?: string;
  platformUrl?: string;
  feeRecipient?: string;
  rentalPeriodSlots?: number;
  platformFee?: number;
  activityStatus?: PlatformStatus;
  needsSecondSigner?: boolean;
  secondSigner?: string;
  description?: string;
  category?: PlatformCategory;
  tags?: string[];
}

export interface PlatformAnalytics {
  platformId: string;

  // Revenue metrics
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;

  // Auction metrics
  totalAuctions: number;
  activeAuctions: number;
  completedAuctions: number;
  averageAuctionValue: number;

  // Performance metrics
  platformRating: number;
  ratingTrend: number;
  totalVotes: number;
  positiveVotePercentage: number;

  // Traffic metrics
  totalViews: number;
  uniqueVisitors: number;
  clickThroughRate: number;
  conversionRate: number;

  // Advertiser metrics
  totalAdvertisers: number;
  repeatAdvertisers: number;
  advertiserSatisfaction: number;

  // Time series data
  revenueHistory: RevenueDataPoint[];
  ratingHistory: RatingDataPoint[];
  trafficHistory: TrafficDataPoint[];
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  auctionCount: number;
  averageValue: number;
}

export interface RatingDataPoint {
  date: string;
  rating: number;
  voteCount: number;
  trend: number;
}

export interface TrafficDataPoint {
  date: string;
  views: number;
  visitors: number;
  clicks: number;
  conversions: number;
}

export interface PlatformDiscoveryFilters {
  category?: PlatformCategory;
  minRating?: number;
  maxFee?: number;
  verified?: boolean;
  active?: boolean;
  sortBy?: PlatformSortOption;
  search?: string;
}

export type PlatformSortOption =
  | 'rating'
  | 'revenue'
  | 'auctions'
  | 'created'
  | 'alphabetical'
  | 'fee_low'
  | 'fee_high';

export interface PlatformRankingData {
  platforms: PlatformRankingEntry[];
  totalPlatforms: number;
  lastUpdated: string;
}

export interface PlatformRankingEntry {
  rank: number;
  platform: Platform;
  score: number;
  scoreComponents: {
    rating: number;
    volume: number;
    activity: number;
    reliability: number;
  };
  trend: 'up' | 'down' | 'stable';
  previousRank?: number;
}

// Voting weight calculation
export interface VotingWeight {
  userId: number;
  baseWeight: number;
  stakeWeight: number;
  reputationWeight: number;
  totalWeight: number;
  calculations: {
    solanaStake: number;
    platformHistory: number;
    accountAge: number;
    verificationLevel: number;
  };
}

// Platform search and filtering
export interface PlatformSearchResult {
  platforms: Platform[];
  totalCount: number;
  hasNextPage: boolean;
  filters: PlatformDiscoveryFilters;
  suggestions: string[];
}

// Platform statistics
export interface PlatformStatistics {
  totalPlatforms: number;
  activePlatforms: number;
  verifiedPlatforms: number;
  averageRating: number;
  totalRevenue: number;
  totalAuctions: number;
  categoryCounts: Record<PlatformCategory, number>;
  recentActivity: PlatformActivity[];
}

export interface PlatformActivity {
  id: string;
  platformId: string;
  platformName: string;
  activityType: 'created' | 'updated' | 'vote_received' | 'auction_completed';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// User platform interaction history
export interface UserPlatformInteraction {
  id: string;
  userId: number;
  platformId: string;
  interactionType: 'view' | 'vote' | 'bookmark' | 'report';
  timestamp: string;
  metadata?: Record<string, any>;
}

// Platform recommendation system
export interface PlatformRecommendation {
  platform: Platform;
  score: number;
  reasons: RecommendationReason[];
  category: 'trending' | 'similar' | 'new' | 'high_rated';
}

export interface RecommendationReason {
  type: 'category_match' | 'rating_similar' | 'user_behavior' | 'trending';
  description: string;
  weight: number;
}

// Platform verification levels
export type VerificationLevel = 'unverified' | 'basic' | 'verified' | 'premium';

export interface VerificationStatus {
  level: VerificationLevel;
  verifiedAt?: string;
  verifiedBy?: string;
  requirements: VerificationRequirement[];
  badges: string[];
}

export interface VerificationRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
}

// Platform health metrics
export interface PlatformHealth {
  score: number; // 0-100
  uptime: number; // percentage
  responseTime: number; // ms
  errorRate: number; // percentage
  lastChecked: string;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detectedAt: string;
  resolvedAt?: string;
}

// Platform comparison
export interface PlatformComparison {
  platforms: Platform[];
  metrics: ComparisonMetric[];
  winner?: {
    platformId: string;
    score: number;
    reasons: string[];
  };
}

export interface ComparisonMetric {
  name: string;
  type: 'numeric' | 'percentage' | 'boolean' | 'text';
  values: Record<string, any>; // platformId -> value
  weight: number;
}
