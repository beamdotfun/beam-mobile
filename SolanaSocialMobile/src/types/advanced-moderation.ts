export interface ContentModerationSystem {
  // User reporting system
  reportCategories: ReportCategory[];
  userReports: ContentReport[];
  reportStats: UserReportingStats;

  // Ad removal system (user perspective)
  availableForRemoval: FlaggedAd[];
  userRemovalRequests: AdRemovalRequest[];

  // User moderation history
  moderationHistory: UserModerationHistory[];
}

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  severity: ReportSeverity;
  requiredEvidence: EvidenceType[];
  autoActions: AutoModerationAction[];
  threshold: number; // reports needed for auto-flagging
}

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceType =
  | 'screenshot'
  | 'url'
  | 'description'
  | 'blockchain_tx';
export type AutoModerationAction =
  | 'flag_for_review'
  | 'escalate_priority'
  | 'auto_remove'
  | 'require_verification';

export interface ContentReport {
  id: string;
  reporterWallet: string;
  reporterUserId?: number;
  groupId: string;
  advertiserWallet: string;

  // Report details
  categoryId: string;
  category: ReportCategory;
  reason: string;
  reasonLength: number;
  evidence: ReportEvidence[];

  // Status and timing
  status: ReportStatus;
  createdAt: string;
  processedAt?: string;

  // Blockchain data
  transactionSignature?: string;
  slot?: number;
  blockTime?: string;
  onChainVerified: boolean;

  // Processing status (no admin details)
  resolutionSummary?: string;
  outcome?: 'pending' | 'reviewed' | 'action_taken' | 'no_action';
}

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'closed';

export interface ReportEvidence {
  id: string;
  type: EvidenceType;
  data: string; // URL, base64 image, or description
  description?: string;
  timestamp: string;
  verified: boolean;
}

export interface FlaggedAd {
  id: string;
  groupId: string;
  advertiserWallet: string;

  // Flagging details
  reportCount: number;
  totalReports: number;
  flaggedAt: string;
  threshold: number;

  // Ad details
  groupInfo: GroupInfo;
  advertiserInfo: AdvertiserInfo;
  campaignInfo?: CampaignInfo;

  // Status
  flagStatus: FlagStatus;
  priorityLevel: PriorityLevel;

  // Removal requests
  hasRemovalRequest: boolean;
  activeRemovalRequest?: AdRemovalRequest;

  // Review status (user perspective)
  reviewStatus: 'awaiting_review' | 'under_review' | 'resolved';
  resolvedAt?: string;
}

export type FlagStatus =
  | 'flagged'
  | 'under_review'
  | 'removal_requested'
  | 'resolved';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface GroupInfo {
  groupId: string;
  groupName: string;
  description: string;
  memberCount: number;
  activityLevel: string;
}

export interface AdvertiserInfo {
  wallet: string;
  brandName?: string;
  reputation: number;
  totalReports: number;
  previousViolations: number;
  accountAge: number;
}

export interface CampaignInfo {
  campaignId: string;
  title: string;
  budget: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
}

export interface AdRemovalRequest {
  id: string;
  groupId: string;
  removerWallet: string;
  removerUserId?: number;

  // Request details
  status: RemovalRequestStatus;
  depositAmount: number;
  rewardAmount: number;

  // Timing
  requestedAt: string;
  processedAt?: string;
  expiresAt: string;

  // Processing status (user perspective)
  reviewStatus: 'pending_review' | 'approved' | 'rejected';
  outcome?: string; // User-friendly outcome message

  // Blockchain transaction
  transactionSignature?: string;
  slot?: number;
  blockTime?: string;
  onChainVerified: boolean;

  // Metadata
  evidenceProvided: ReportEvidence[];
  justification: string;
  riskAssessment: RiskAssessment;
}

export type RemovalRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  factors: RiskFactor[];
  recommendation: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface UserModerationHistory {
  id: string;
  type:
    | 'report_submitted'
    | 'removal_requested'
    | 'reward_received'
    | 'deposit_returned';

  // Basic details
  title: string;
  description: string;

  // Timing
  createdAt: string;
  resolvedAt?: string;

  // Financial
  depositAmount?: number;
  rewardAmount?: number;

  // Status
  status: 'pending' | 'completed' | 'failed';
  outcome: string;
}

export interface UserReportingStats {
  // User's personal stats
  totalReportsSubmitted: number;
  reportsThisMonth: number;
  successfulReports: number;

  // User's rewards and deposits
  totalRewardsEarned: number;
  totalDepositsPlaced: number;
  totalDepositsReturned: number;

  // User's success rate
  reportSuccessRate: number;
  averageResolutionTime: number;

  // User's moderation reputation
  moderationScore: number;
  reporterLevel: 'new' | 'trusted' | 'expert';
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
  trend: number;
  averageResolutionTime: number;
}

export interface SeverityStats {
  severity: ReportSeverity;
  count: number;
  percentage: number;
  averageResolutionTime: number;
}

export interface TrendData {
  date: string;
  value: number;
  change: number;
}

export interface UserModerationDashboard {
  // User's moderation overview
  personalStats: UserReportingStats;
  recentReports: ContentReport[];
  recentRemovalRequests: AdRemovalRequest[];

  // Available opportunities
  availableForRemoval: FlaggedAd[];
  pendingRewards: PendingReward[];

  // Guidelines and help
  moderationGuidelines: ModerationGuideline[];
  rewardInformation: RewardInfo;
}

export interface PendingReward {
  id: string;
  type: 'removal_reward' | 'deposit_return';
  amount: number;
  description: string;
  expectedDate: string;
  status: 'pending' | 'processing' | 'ready';
}

export interface ModerationGuideline {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
}

export interface RewardInfo {
  currentDepositAmount: number;
  currentRewardAmount: number;
  successRate: number;
  minimumReputation: number;
  guidelines: string[];
}

// Request/Response types
export interface SubmitReportRequest {
  reporterWallet: string;
  groupId: string;
  advertiserWallet: string;
  categoryId: string;
  reason: string;
  evidence: Omit<ReportEvidence, 'id' | 'verified'>[];
}

export interface RequestRemovalRequest {
  flaggedAdId: string;
  justification: string;
  depositAmount: number;
  evidence?: Omit<ReportEvidence, 'id' | 'verified'>[];
}

// Filter types
export interface ReportFilters {
  status?: ReportStatus;
  category?: string;
  severity?: ReportSeverity;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface RemovalRequestFilters {
  status?: RemovalRequestStatus;
  priorityLevel?: PriorityLevel;
  includeExpired?: boolean;
}

// Analytics types for user dashboard
export interface UserModerationAnalytics {
  reportsByCategory: CategoryStats[];
  reportsBySeverity: SeverityStats[];
  rewardsTrend: TrendData[];
  successRateTrend: TrendData[];
  monthlyActivity: {
    reports: number;
    removals: number;
    rewards: number;
  };
}

// Evidence validation
export interface EvidenceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Report templates for common issues
export interface ReportTemplate {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  suggestedReason: string;
  requiredEvidence: EvidenceType[];
  tips: string[];
}

// Achievement system for moderation
export interface ModerationAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'reports' | 'removals' | 'rewards' | 'score';
    value: number;
  };
  reward?: number;
  unlockedAt?: string;
  progress: number;
}

// Notification preferences
export interface ModerationNotificationPreferences {
  reportStatusUpdates: boolean;
  removalRequestUpdates: boolean;
  rewardNotifications: boolean;
  newOpportunities: boolean;
  guidelineUpdates: boolean;
}

// Quick actions for experienced moderators
export interface QuickModerationAction {
  id: string;
  type: 'report' | 'removal_request';
  label: string;
  description: string;
  categoryId?: string;
  requiredReputation: number;
  enabled: boolean;
}
