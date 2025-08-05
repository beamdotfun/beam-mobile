export interface Tip {
  id: string;
  fromWallet: string;
  toWallet: string;
  amount: number; // SOL amount
  amountUSD: number;
  message?: string;
  isAnonymous: boolean;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  transactionSignature: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  networkFee: number;
  metadata?: {
    contentType?: string;
    engagement?: number;
    creatorFollowers?: number;
  };
}

export interface TipAnimation {
  id: string;
  amount: number;
  emoji: string;
  fromPosition: {x: number; y: number};
  toPosition: {x: number; y: number};
  duration: number;
  startTime: number;
  status: 'starting' | 'animating' | 'completed';
}

export interface CreatorEarnings {
  wallet: string;
  totalEarned: number; // SOL
  totalEarnedUSD: number;
  tipCount: number;
  uniqueTippers: number;
  averageTip: number;
  topTip: number;

  // Time-series data
  dailyEarnings: TimeSeriesEarnings[];
  weeklyEarnings: TimeSeriesEarnings[];
  monthlyEarnings: TimeSeriesEarnings[];

  // Top content and supporters
  topContent: ContentEarnings[];
  topSupporters: TipperInfo[];

  // Analytics
  analytics: {
    engagementRate: number;
    tipConversionRate: number; // tips per view
    averageSessionValue: number;
    retentionRate: number; // repeat tippers
    growthRate: number; // period over period
  };
}

export interface TimeSeriesEarnings {
  date: string;
  amount: number;
  amountUSD: number;
  tipCount: number;
  uniqueTippers: number;
}

export interface ContentEarnings {
  contentId: string;
  contentType: 'post' | 'comment';
  title?: string;
  preview: string;
  totalEarned: number;
  tipCount: number;
  createdAt: string;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface TipperInfo {
  wallet: string;
  username?: string;
  avatar?: string;
  totalTipped: number;
  tipCount: number;
  firstTip: string;
  lastTip: string;
  isAnonymous: boolean;
  verificationLevel?: 'basic' | 'verified' | 'premium';
}

export interface TipLeaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  lastUpdated: string;

  // Top earners
  topEarners: LeaderboardEntry[];

  // Top tippers
  topTippers: LeaderboardEntry[];

  // Rising stars (biggest growth)
  risingStars: LeaderboardEntry[];

  // User positions
  userPosition?: {
    earnerRank?: number;
    tipperRank?: number;
    totalUsers: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  username?: string;
  avatar?: string;
  amount: number; // SOL
  amountUSD: number;
  change: number; // percentage change from previous period
  tipCount?: number;
  badge?: 'gold' | 'silver' | 'bronze' | 'rising';
  verificationLevel?: 'basic' | 'verified' | 'premium';
}

export interface TipPreset {
  amount: number; // SOL
  emoji: string;
  label: string;
  description: string;
  popular?: boolean;
}

export interface TipConfig {
  presets: TipPreset[];
  minAmount: number;
  maxAmount: number;
  networkFeeEstimate: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  animationsEnabled: boolean;
  showUSDValues: boolean;
  defaultAnonymous: boolean;
}

export interface SOLPriceData {
  price: number; // USD
  change24h: number;
  timestamp: string;
  source: string;
}

export interface TipStats {
  totalTips: number;
  totalVolume: number; // SOL
  totalVolumeUSD: number;
  averageTip: number;
  activeTippers: number;
  activeCreators: number;

  // Trends
  trendData: {
    period: string;
    tips: number;
    volume: number;
    users: number;
  }[];
}

export interface TipNotification {
  id: string;
  type: 'tip_received' | 'tip_sent' | 'milestone_reached';
  fromWallet?: string;
  fromUsername?: string;
  amount?: number;
  message?: string;
  contentId?: string;
  milestone?: {
    type: 'earnings' | 'tips_count' | 'supporters';
    value: number;
    achievement: string;
  };
  timestamp: string;
  read: boolean;
}

// Animation and UI types
export interface TipButtonProps {
  targetWallet: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'floating';
  showAmount?: boolean;
  onTipSent?: (tip: Tip) => void;
}

export interface TipModalState {
  isVisible: boolean;
  targetWallet: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  selectedAmount: number;
  customAmount: string;
  message: string;
  isAnonymous: boolean;
  isLoading: boolean;
  step: 'amount' | 'message' | 'confirm' | 'processing' | 'success' | 'error';
  error?: string;
}

export interface TipSound {
  name: string;
  file: string;
  volume: number;
  enabled: boolean;
}

export interface TipFeedback {
  haptic: 'light' | 'medium' | 'heavy';
  sound?: TipSound;
  animation: {
    type: 'bounce' | 'pulse' | 'shake' | 'float';
    duration: number;
    intensity: number;
  };
}
