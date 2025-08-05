export interface UserGroupMembership {
  groupId: string;
  groupName: string;
  groupDescription: string;

  // Membership details
  joinedAt: string;
  memberRole: 'member';
  status: 'active' | 'pending' | 'removed';

  // Earnings
  totalEarned: number;
  pendingPayout: number;
  lastPayoutAt?: string;

  // Group metrics
  memberCount: number;
  revenueThisPeriod: number;

  // Payout info
  payoutFrequency: 'daily' | 'weekly' | 'monthly';
  nextPayoutDate: string;
  minPayoutAmount: number;

  // Performance
  engagementScore: number;
  eligibleForPayout: boolean;
}

export interface GroupPayout {
  id: string;
  groupId: string;
  groupName: string;
  amount: number;
  period: PayoutPeriod;

  // Status
  status: 'available' | 'claimed' | 'processing' | 'failed';
  availableAt: string;
  claimedAt?: string;
  expiresAt?: string;

  // Transaction
  transactionSignature?: string;

  // Details
  reason: string;
  periodStart: string;
  periodEnd: string;
}

export interface PayoutPeriod {
  start: string;
  end: string;
  label: string;
}

export interface GroupEarningsHistory {
  groupId: string;
  groupName: string;
  totalEarnings: number;
  payouts: GroupPayout[];

  // Analytics
  averagePerPayout: number;
  bestPayout: number;
  earningsGrowth: number;

  // Trends
  monthlyTrends: EarningsTrend[];
}

export interface EarningsTrend {
  month: string;
  earnings: number;
  payoutCount: number;
  averagePayout: number;
}

export interface UserGroupAnalytics {
  totalGroups: number;
  activeGroups: number;
  totalEarnings: number;
  pendingPayouts: number;

  // Performance
  averageEngagement: number;
  topGroup: {
    name: string;
    earnings: number;
  };

  // Recent activity
  recentPayouts: GroupPayout[];
  upcomingPayouts: GroupPayout[];
}
