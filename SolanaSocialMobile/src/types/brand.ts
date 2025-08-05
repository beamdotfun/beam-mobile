export interface Brand {
  id: string;
  brandId: string;
  ownerWallet: string;
  ownerUserId?: number;

  // Brand identity
  brandName: string;
  brandHandle: string;
  displayName: string;
  bio: string;
  category: BrandCategory;
  tags: string[];

  // Visual branding
  logoUrl?: string;
  bannerUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // Brand configuration
  isVerified: boolean;
  isActive: boolean;
  visibility: BrandVisibility;
  allowFollowers: boolean;

  // Performance metrics
  followerCount: number;
  totalPosts: number;
  totalEngagement: number;
  brandRating: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;

  // Blockchain data
  brandPDA: string;
  transactionSignature?: string;
  slot?: number;
  blockTime?: string;
  onChainVerified: boolean;

  // Analytics
  monthlyViews: number;
  weeklyGrowth: number;
  engagementRate: number;
  topContent: BrandPost[];
}

export type BrandCategory =
  | 'technology'
  | 'fashion'
  | 'food'
  | 'travel'
  | 'fitness'
  | 'gaming'
  | 'music'
  | 'art'
  | 'education'
  | 'business'
  | 'lifestyle'
  | 'entertainment'
  | 'other';

export type BrandVisibility = 'public' | 'private' | 'followers_only';

export interface BrandPost {
  id: string;
  content: string;
  mediaUrls: string[];
  engagement: number;
  createdAt: string;
}

export interface BrandCreationRequest {
  brandName: string;
  brandHandle: string;
  displayName: string;
  bio: string;
  category: BrandCategory;
  tags: string[];
  logoUrl?: string;
  bannerUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  visibility: BrandVisibility;
  allowFollowers: boolean;
}

export interface BrandUpdateRequest {
  displayName?: string;
  bio?: string;
  category?: BrandCategory;
  tags?: string[];
  logoUrl?: string;
  bannerUrl?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  visibility?: BrandVisibility;
  allowFollowers?: boolean;
}

export interface BrandAnalytics {
  // Growth metrics
  followerGrowth: TimeSeriesData[];
  engagementGrowth: TimeSeriesData[];
  contentGrowth: TimeSeriesData[];

  // Performance metrics
  topPosts: BrandPost[];
  audienceInsights: AudienceInsight[];
  engagementBreakdown: EngagementBreakdown;

  // Activity metrics
  posting_frequency: number;
  averageEngagement: number;
  bestPostingTimes: string[];
  contentCategories: ContentCategoryStats[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  change: number;
}

export interface AudienceInsight {
  metric: string;
  value: string;
  percentage: number;
}

export interface EngagementBreakdown {
  likes: number;
  comments: number;
  shares: number;
  votes: number;
  tips: number;
}

export interface ContentCategoryStats {
  category: string;
  count: number;
  engagement: number;
  performance: number;
}

export interface BrandVerificationRequest {
  brandId: string;
  verificationType: 'manual' | 'social_media' | 'website' | 'business_license';
  verificationData: {
    socialMediaUrls?: string[];
    websiteUrl?: string;
    businessLicense?: string;
    additionalInfo?: string;
  };
}

export interface BrandFollower {
  userId: string;
  userWallet: string;
  username: string;
  userAvatar?: string;
  followedAt: string;
  engagementLevel: 'high' | 'medium' | 'low';
  isVerified: boolean;
}

export interface BrandActivity {
  id: string;
  type: BrandActivityType;
  description: string;
  timestamp: string;
  metadata?: any;
}

export type BrandActivityType =
  | 'brand_created'
  | 'brand_updated'
  | 'post_published'
  | 'follower_gained'
  | 'follower_lost'
  | 'engagement_milestone'
  | 'verification_status_changed'
  | 'content_featured';
