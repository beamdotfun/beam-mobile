export interface UserAnalytics {
  // Overview
  overview: {
    followers: number;
    following: number;
    totalPosts: number;
    totalEngagement: number;
    reputationScore: number;
    totalEarned: number; // SOL
  };

  // Time series data
  timeSeries: {
    period: 'hour' | 'day' | 'week' | 'month' | 'year';
    data: TimeSeriesPoint[];
  };

  // Content performance
  contentPerformance: ContentAnalytics;

  // Audience insights
  audienceInsights: AudienceAnalytics;

  // Earnings breakdown
  earnings: EarningsAnalytics;

  // Engagement patterns
  engagementPatterns: EngagementAnalytics;
}

export interface TimeSeriesPoint {
  timestamp: string;
  metrics: {
    views: number;
    engagement: number;
    followers: number;
    earnings: number;
    posts: number;
  };
}

export interface ContentAnalytics {
  // Top performing
  topPosts: PostPerformance[];
  topComments: CommentPerformance[];

  // By type
  byType: {
    text: ContentTypeMetrics;
    photo: ContentTypeMetrics;
    video: ContentTypeMetrics;
    poll: ContentTypeMetrics;
  };

  // By time
  bestPostingTimes: PostingTime[];
  postFrequency: FrequencyData[];

  // Tags and topics
  topHashtags: HashtagPerformance[];
  topMentions: MentionData[];
}

export interface PostPerformance {
  postId: string;
  content: string;
  thumbnail?: string;

  metrics: {
    views: number;
    upvotes: number;
    downvotes: number;
    comments: number;
    shares: number;
    tips: number;
    tipAmount: number; // SOL
  };

  trend: 'viral' | 'rising' | 'steady' | 'declining';
  viralityScore: number;
  createdAt: string;
}

export interface CommentPerformance {
  commentId: string;
  content: string;
  postId: string;
  metrics: {
    upvotes: number;
    downvotes: number;
    replies: number;
    tips: number;
    tipAmount: number;
  };
  createdAt: string;
}

export interface ContentTypeMetrics {
  count: number;
  totalViews: number;
  avgEngagement: number;
  totalEarnings: number;
  trend: number; // percentage change
}

export interface PostingTime {
  day: string;
  hour: number;
  engagementRate: number;
  averageViews: number;
}

export interface FrequencyData {
  period: string;
  postsCount: number;
  avgEngagement: number;
}

export interface HashtagPerformance {
  tag: string;
  uses: number;
  totalViews: number;
  avgEngagement: number;
  growth: number; // percentage
}

export interface MentionData {
  username: string;
  mentions: number;
  engagementGenerated: number;
}

export interface AudienceAnalytics {
  // Demographics
  demographics: {
    locations: LocationData[];
    languages: LanguageData[];
    devices: DeviceData[];
    walletTypes: WalletTypeData[];
  };

  // Behavior
  behavior: {
    activeHours: HourlyActivity[];
    activeDays: DailyActivity[];
    engagementRate: number;
    averageSessionTime: number;
  };

  // Top fans
  topFans: FanData[];
  newFollowers: FollowerData[];
  lostFollowers: FollowerData[];

  // Growth
  growthRate: number;
  projectedFollowers: number;
  milestones: GrowthMilestone[];
}

export interface LocationData {
  country: string;
  region?: string;
  percentage: number;
  count: number;
}

export interface LanguageData {
  language: string;
  percentage: number;
  count: number;
}

export interface DeviceData {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  os: string;
  percentage: number;
  count: number;
}

export interface WalletTypeData {
  walletType: 'phantom' | 'solflare' | 'backpack' | 'other';
  percentage: number;
  count: number;
}

export interface HourlyActivity {
  hour: number;
  activityLevel: number;
  engagementRate: number;
}

export interface DailyActivity {
  day: string;
  activityLevel: number;
  engagementRate: number;
}

export interface FanData {
  wallet: string;
  username?: string;
  avatar?: string;
  engagementScore: number;
  totalTips: number;
  totalInteractions: number;
  fanSince: string;
}

export interface FollowerData {
  wallet: string;
  username?: string;
  avatar?: string;
  followedAt: string;
  engagementLevel: 'high' | 'medium' | 'low';
}

export interface GrowthMilestone {
  type: 'followers' | 'posts' | 'earnings' | 'engagement';
  value: number;
  achievedAt?: string;
  projectedAt?: string;
  description: string;
}

export interface EarningsAnalytics {
  // Summary
  total: {
    amount: number; // SOL
    usdValue: number;
    transactions: number;
    uniqueTippers: number;
  };

  // Breakdown
  bySource: {
    tips: EarningsSource;
    subscriptions: EarningsSource;
    nftSales: EarningsSource;
  };

  // Top earners
  topEarningPosts: PostEarnings[];
  topTippers: TipperAnalytics[];

  // Trends
  earningsTrend: TrendData[];
  projectedEarnings: ProjectionData;

  // Comparisons
  vsLastPeriod: ComparisonData;
  vsSimilarCreators: ComparisonData;
}

export interface EarningsSource {
  amount: number;
  usdValue: number;
  transactions: number;
  percentage: number;
  trend: number;
}

export interface PostEarnings {
  postId: string;
  content: string;
  thumbnail?: string;
  earnings: number;
  tips: number;
  avgTipAmount: number;
  createdAt: string;
}

export interface TipperAnalytics {
  wallet: string;
  username?: string;
  avatar?: string;
  totalTipped: number;
  tipCount: number;
  avgTipAmount: number;
  lastTipAt: string;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
}

export interface ProjectionData {
  nextWeek: number;
  nextMonth: number;
  nextYear: number;
  confidence: number; // 0-1
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface EngagementAnalytics {
  // Rates
  rates: {
    overall: number;
    byType: Record<string, number>;
    trend: 'increasing' | 'decreasing' | 'stable';
  };

  // Patterns
  patterns: {
    peakHours: number[];
    peakDays: string[];
    seasonality: SeasonalityData[];
  };

  // Sentiment
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    trend: SentimentTrend[];
  };

  // Interactions
  interactions: {
    commentsPerPost: number;
    votesPerPost: number;
    sharesPerPost: number;
    avgResponseTime: number;
  };
}

export interface SeasonalityData {
  period: string;
  multiplier: number;
  confidence: number;
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

// Analytics filters and options
export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
    preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  };
  contentTypes?: string[];
  includeComparison?: boolean;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

// Analytics export options
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'xlsx';
  sections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
}

// Real-time analytics updates
export interface RealtimeUpdate {
  type: 'metric_update' | 'new_interaction' | 'milestone_reached';
  data: any;
  timestamp: string;
}

// API response types
export interface AnalyticsResponse {
  success: boolean;
  data: UserAnalytics;
  meta: {
    generatedAt: string;
    period: string;
    totalRecords: number;
  };
}

export interface ExportResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
    size: number;
    expiresAt: string;
  };
}

// Constants for analytics
export const ANALYTICS_CONSTANTS = {
  DEFAULT_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  REALTIME_UPDATE_INTERVAL: 30 * 1000, // 30 seconds
  MAX_CHART_POINTS: 50,
  MAX_TOP_ITEMS: 10,
  VIRAL_THRESHOLD: 1000, // views for viral content
  HIGH_ENGAGEMENT_THRESHOLD: 0.1, // 10% engagement rate
} as const;

export const DATE_PRESETS = {
  today: {label: 'Today', days: 0, hours: 24},
  week: {label: 'Last 7 days', days: 7},
  month: {label: 'Last 30 days', days: 30},
  quarter: {label: 'Last 90 days', days: 90},
  year: {label: 'Last year', days: 365},
  all: {label: 'All time', days: null},
} as const;

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  muted: '#6B7280',
  success: '#22C55E',
  warning: '#F97316',
  purple: '#8B5CF6',
} as const;
