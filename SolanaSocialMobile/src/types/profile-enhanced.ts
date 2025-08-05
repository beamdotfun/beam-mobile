export interface ProfileCustomization {
  // Theme customization
  theme: {
    primaryColor?: string;
    accentColor?: string;
    backgroundType: 'color' | 'gradient' | 'image';
    backgroundValue?: string;
    cardStyle: 'default' | 'glass' | 'minimal';
  };

  // Layout customization
  layout: {
    profileStyle: 'standard' | 'compact' | 'expanded';
    showStats: boolean;
    showAchievements: boolean;
    showActivity: boolean;
    pinnedSections: string[];
  };

  // Content sections
  sections: {
    bio: boolean;
    links: boolean;
    badges: boolean;
    gallery: boolean;
    brands: boolean;
  };
}

export interface ProfileAnalytics {
  // Overview stats
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    followerGrowth: number;
    engagementRate: number;
    reputationTrend: 'up' | 'down' | 'stable';
  };

  // Time-based metrics
  metrics: {
    period: '24h' | '7d' | '30d' | 'all';
    views: TimeSeriesData[];
    followers: TimeSeriesData[];
    engagement: TimeSeriesData[];
    reputation: TimeSeriesData[];
  };

  // Content performance
  content: {
    topPosts: PostPerformance[];
    avgEngagement: number;
    bestPostingTime: string;
    contentReach: number;
  };

  // Audience insights
  audience: {
    topLocations: LocationData[];
    activeHours: HourlyActivity[];
    followerQuality: number; // 0-100 score
    commonInterests: string[];
  };
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  change?: number;
}

export interface PostPerformance {
  postId: string;
  content: string;
  views: number;
  engagement: number;
  shares: number;
  timestamp: string;
}

export interface LocationData {
  name: string;
  percentage: number;
  count: number;
}

export interface HourlyActivity {
  hour: number;
  activity: number;
}

export interface Achievement {
  id: string;
  category: 'social' | 'engagement' | 'reputation' | 'special' | 'milestone';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  // Progress
  progress: number; // 0-100
  target: number;
  current: number;

  // Rewards
  unlockedAt?: string;
  reward?: {
    type: 'badge' | 'title' | 'feature' | 'cosmetic';
    value: string;
  };

  // Display
  featured: boolean;
  order: number;
}

export interface ProfileVerification {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  type?: 'identity' | 'business' | 'creator' | 'developer';
  verifiedAt?: string;
  expiresAt?: string;

  // Verification steps
  steps: VerificationStep[];
  currentStep: number;

  // Evidence
  documents?: {
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  }[];

  // Benefits
  benefits?: string[];
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'social' | 'payment' | 'review';
  status: 'incomplete' | 'pending' | 'completed';
  required: boolean;
}

export interface FollowerInsights {
  follower: {
    walletAddress: string;
    name?: string;
    profilePicture?: string;
    reputation: number;
  };
  followedAt: string;
  engagement: {
    views: number;
    votes: number;
    comments: number;
    tips: number;
  };
  mutualFollowers: number;
  quality: 'high' | 'medium' | 'low'; // Based on activity
  tags?: string[]; // Auto-generated tags
}

export interface ProfileShowcase {
  // Featured content
  featuredPosts: string[]; // Post IDs
  featuredBrands: string[]; // Brand IDs
  featuredAchievements: string[]; // Achievement IDs

  // Custom sections
  customSections: {
    id: string;
    title: string;
    type: 'text' | 'links' | 'gallery' | 'embed';
    content: any;
    order: number;
    visible: boolean;
  }[];

  // Media gallery
  gallery: {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    order: number;
  }[];
}

export interface ProfileInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ProfileSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}
