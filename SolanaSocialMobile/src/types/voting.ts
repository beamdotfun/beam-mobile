export interface Vote {
  id: string;
  voterWallet: string;
  targetUserWallet: string;
  value: number; // -1, 0, 1
  timestamp: string;

  // Context
  postId?: string;
  commentId?: string;
  reason?: string;

  // Transaction
  transactionSignature: string;
  feePaid: number; // SOL

  // Analytics
  impactScore: number; // How much this vote affected reputation
  streak?: number; // Consecutive days voting
}

export interface VoteAnimation {
  type: 'upvote' | 'downvote' | 'neutral';
  startPosition: {x: number; y: number};
  endPosition: {x: number; y: number};
  value: number;
  color: string;
}

export interface ReputationScore {
  score: number;
  rank: number;
  percentile: number;
  trend: 'up' | 'down' | 'stable';

  // Breakdown
  breakdown: {
    receivedVotes: number;
    givenVotes: number;
    postQuality: number;
    engagement: number;
    consistency: number;
  };

  // History
  history: ReputationPoint[];
  milestones: ReputationMilestone[];

  // Predictions
  projectedScore: number;
  nextMilestone?: ReputationMilestone;
}

export interface ReputationPoint {
  timestamp: string;
  score: number;
  change: number;
  event: string;
}

export interface ReputationMilestone {
  id: string;
  name: string;
  description: string;
  requiredScore: number;
  badge?: string;
  reward?: {
    type: 'badge' | 'feature' | 'multiplier';
    value: any;
  };
  unlockedAt?: string;
}

export interface VotingStats {
  // User's voting activity
  totalVotesGiven: number;
  upvotesGiven: number;
  downvotesGiven: number;
  votingStreak: number;
  lastVoteAt?: string;

  // Votes received
  totalVotesReceived: number;
  upvotesReceived: number;
  downvotesReceived: number;

  // Patterns
  mostVotedUsers: UserVotePattern[];
  votingHours: HourlyActivity[];
  votingTrends: VotingTrend[];

  // Achievements
  votingAchievements: VotingAchievement[];
}

export interface UserVotePattern {
  userWallet: string;
  displayName: string;
  profilePicture?: string;
  votesGiven: number;
  votesReceived: number;
  netVotes: number;
  relationship: 'mutual' | 'supporter' | 'critic' | 'neutral';
}

export interface HourlyActivity {
  hour: number;
  votes: number;
  percentage: number;
}

export interface VotingTrend {
  period: string;
  upvotes: number;
  downvotes: number;
  ratio: number;
  change: number;
}

export interface VotingAchievement {
  id: string;
  type: 'streak' | 'volume' | 'impact' | 'special';
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlockedAt?: string;
  reward?: string;
}

export interface VoteImpact {
  previousScore: number;
  newScore: number;
  change: number;
  percentageChange: number;

  // Factors
  factors: {
    voterReputation: number;
    voteWeight: number;
    timeFactor: number;
    streakBonus: number;
  };

  // Effects
  effects: {
    rankChange: number;
    unlockedFeatures: string[];
    newBadges: string[];
  };
}

export interface VotingConfig {
  // Fees
  upvoteFee: number; // SOL
  downvoteFee: number; // SOL

  // Weights
  reputationMultiplier: number;
  streakMultiplier: number;
  decayFactor: number;

  // Limits
  dailyVoteLimit?: number;
  cooldownPeriod?: number; // seconds

  // Features
  anonymousVoting: boolean;
  voteReasons: boolean;
  voteUndoWindow: number; // seconds
}

export interface VotingInsights {
  votingPower: number;
  influence: number;
  consistency: number;
  suggestions: string[];
}
