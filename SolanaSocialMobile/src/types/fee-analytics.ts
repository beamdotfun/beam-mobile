export interface FeeAnalytics {
  // Overview
  summary: FeeSummary;

  // Detailed breakdowns
  byCategory: CategoryBreakdown[];
  byTimeframe: TimeframeData[];
  byTransaction: TransactionFee[];

  // Optimization insights
  insights: FeeInsight[];
  recommendations: FeeRecommendation[];

  // Comparison data
  comparison: PeriodComparison;
  benchmarks: FeeBenchmark[];
}

export interface FeeSummary {
  // Total costs
  totalFeesPaid: number; // SOL
  totalTipsSent: number; // SOL
  totalTipsReceived: number; // SOL
  totalAuctionCosts: number; // SOL

  // Net calculations
  netSpending: number; // SOL (fees + tips sent - tips received)
  netRevenue: number; // SOL (earnings from auctions and tips - costs)
  roi: number; // Percentage

  // Activity counts
  totalTransactions: number;
  onChainTransactions: number;
  offChainTransactions: number;

  // Time period
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;

  // Trends
  trends: {
    fees: TrendData;
    tips: TrendData;
    revenue: TrendData;
  };
}

export interface CategoryBreakdown {
  category: FeeCategory;
  amount: number; // SOL
  percentage: number;
  transactionCount: number;
  averageFee: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export type FeeCategory =
  | 'posting'
  | 'voting'
  | 'tipping'
  | 'auction_bids'
  | 'auction_creation'
  | 'group_operations'
  | 'profile_updates'
  | 'other';

export interface TimeframeData {
  timestamp: string;
  totalFees: number;
  tipsSent: number;
  tipsReceived: number;
  transactionCount: number;
  averageFee: number;
}

export interface TransactionFee {
  id: string;
  type: string;
  timestamp: string;
  baseFee: number; // SOL
  priorityFee: number; // SOL
  totalFee: number; // SOL
  status: 'confirmed' | 'failed';
  signature: string;

  // Context
  description: string;
  category: FeeCategory;
  relatedEntity?: string; // Post ID, User ID, etc.

  // Optimization
  wasOptimal: boolean;
  suggestedFee?: number;
  savings?: number;
}

export interface FeeInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: FeeCategory;

  // Data points
  currentValue: number;
  suggestedValue?: number;
  potentialSavings?: number;

  // Timeframe
  relevantPeriod: string;

  // Actions
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
}

export type InsightType =
  | 'high_fee_period'
  | 'overpayment_detected'
  | 'fee_spike'
  | 'optimization_opportunity'
  | 'revenue_opportunity'
  | 'spending_pattern';

export interface FeeRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';

  // Expected impact
  estimatedSavings: number; // SOL per month
  implementationEffort: 'easy' | 'medium' | 'hard';

  // Category
  category: FeeCategory;
  tags: string[];

  // Implementation
  steps: string[];
  learnMoreUrl?: string;
}

export interface PeriodComparison {
  current: FeeSummary;
  previous: FeeSummary;

  // Changes
  changes: {
    totalFees: number; // Percentage change
    totalTips: number;
    totalRevenue: number;
    roi: number;
    efficiency: number; // Fees per transaction
  };
}

export interface FeeBenchmark {
  category: string;
  userValue: number;
  platformAverage: number;
  percentile: number; // User's percentile (0-100)
  isGood: boolean; // Whether user is performing well
}

export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d' | 'all';

export interface TrendData {
  value: number;
  change: number; // Percentage
  direction: 'up' | 'down' | 'stable';
}

export interface FeeOptimization {
  // Current settings
  currentSettings: {
    defaultPriorityFee: number;
    autoOptimize: boolean;
    maxFeeLimit: number;
  };

  // Recommendations
  recommendedSettings: {
    defaultPriorityFee: number;
    maxFeeLimit: number;
    reasoning: string;
  };

  // Historical performance
  optimizationHistory: OptimizationRecord[];
}

export interface OptimizationRecord {
  timestamp: string;
  action: string;
  expectedSavings: number;
  actualSavings: number;
  effectiveness: number; // 0-100%
}

export interface FeeFilter {
  categories?: FeeCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minAmount?: number;
  maxAmount?: number;
  status?: string[];
  transactionTypes?: string[];
}

export interface FeeExport {
  format: 'csv' | 'json' | 'pdf';
  period: AnalyticsPeriod;
  includeCharts: boolean;
  categories: FeeCategory[];
  groupBy: 'day' | 'week' | 'month' | 'category';
}
