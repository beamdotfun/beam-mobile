export interface Brand {
  id: string;
  name: string;
  handle: string;
  ownerWallet: string;

  // Profile information
  displayName: string;
  bio: string;
  category: BrandCategory;
  tags: string[];

  // Branding
  logo: string;
  banner?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // Verification
  isVerified: boolean;
  verificationLevel: 'basic' | 'premium' | 'enterprise';
  verifiedAt?: string;

  // Social metrics
  followerCount: number;
  postCount: number;
  auctionCount: number;
  totalSales: number; // SOL
  rating: number; // 0-5

  // Links
  website?: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    instagram?: string;
  };

  // Status
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile extends Brand {
  // Extended profile data
  description: string;
  story?: string;
  team?: TeamMember[];

  // Business info
  established?: string;
  location?: string;
  businessType: 'individual' | 'company' | 'dao';

  // Collections
  collections: Collection[];
  featuredProducts: Product[];

  // Achievements
  badges: BrandBadge[];
  milestones: Milestone[];

  // Analytics data for brand owners
  analytics?: BrandAnalytics;
}

export type BrandCategory =
  | 'art'
  | 'music'
  | 'gaming'
  | 'fashion'
  | 'sports'
  | 'technology'
  | 'education'
  | 'entertainment'
  | 'other';

export interface TeamMember {
  wallet: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  itemCount: number;
  floorPrice?: number;
  totalVolume?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price?: number;
  auctionId?: string;
  status: 'available' | 'auction' | 'sold';
}

export interface BrandBadge {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: string;
  metric?: {
    type: string;
    value: number;
  };
}

export interface BrandAnalytics {
  // Performance metrics
  views: {
    total: number;
    daily: number[];
    weekly: number[];
  };

  engagement: {
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    averageEngagementRate: number;
  };

  // Follower analytics
  followers: {
    total: number;
    growth: number;
    demographics: {
      countries: Record<string, number>;
      ages: Record<string, number>;
    };
  };

  // Sales performance
  sales: {
    totalRevenue: number; // SOL
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{
      id: string;
      name: string;
      revenue: number;
      units: number;
    }>;
  };

  // Auction performance
  auctions: {
    totalAuctions: number;
    successRate: number;
    averageBidCount: number;
    topPerformers: Array<{
      id: string;
      title: string;
      finalPrice: number;
      bidCount: number;
    }>;
  };
}

// API Response types
export interface BrandResponse {
  success: boolean;
  message: string;
  data: Brand;
}

export interface BrandProfileResponse {
  success: boolean;
  message: string;
  data: BrandProfile;
}

export interface BrandsListResponse {
  success: boolean;
  message: string;
  data: {
    brands: Brand[];
    hasMore: boolean;
    page: number;
    totalPages: number;
  };
}

export interface FollowResponse {
  success: boolean;
  message: string;
  data: {
    following: boolean;
    followerCount: number;
  };
}

// Filter and search types
export interface BrandFilter {
  category?: BrandCategory;
  verified?: boolean;
  minRating?: number;
  search?: string;
  tags?: string[];
}

export interface BrandSort {
  field: 'name' | 'followerCount' | 'rating' | 'totalSales' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Constants
export const BRAND_CATEGORIES: Record<
  BrandCategory,
  {label: string; icon: string; color: string}
> = {
  art: {label: 'Art', icon: 'palette', color: 'text-purple-500'},
  music: {label: 'Music', icon: 'music', color: 'text-pink-500'},
  gaming: {label: 'Gaming', icon: 'gamepad-2', color: 'text-blue-500'},
  fashion: {label: 'Fashion', icon: 'shirt', color: 'text-rose-500'},
  sports: {label: 'Sports', icon: 'trophy', color: 'text-orange-500'},
  technology: {label: 'Technology', icon: 'cpu', color: 'text-green-500'},
  education: {
    label: 'Education',
    icon: 'graduation-cap',
    color: 'text-indigo-500',
  },
  entertainment: {label: 'Entertainment', icon: 'film', color: 'text-red-500'},
  other: {label: 'Other', icon: 'layers', color: 'text-gray-500'},
};

export const VERIFICATION_LEVELS = {
  basic: {label: 'Basic', color: 'text-blue-500', icon: 'check'},
  premium: {label: 'Premium', color: 'text-purple-500', icon: 'check-circle'},
  enterprise: {label: 'Enterprise', color: 'text-gold-500', icon: 'crown'},
} as const;
