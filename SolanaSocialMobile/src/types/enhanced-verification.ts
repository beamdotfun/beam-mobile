export interface EnhancedVerificationSystem {
  // User verification status
  userVerification: UserVerificationStatus;
  verificationHistory: VerificationAttempt[];

  // Available verification methods
  availableVerifications: VerificationMethod[];
  verificationRequirements: VerificationRequirement[];

  // Verification analytics
  verificationStats: VerificationStats;
  verificationBenefits: VerificationBenefit[];
}

export interface UserVerificationStatus {
  userId: string;
  userWallet: string;

  // Split verification status
  isVerifiedNFT: boolean;
  isVerifiedSNS: boolean;
  isFullyVerified: boolean;

  // NFT verification details
  nftVerification?: NFTVerification;

  // SNS verification details
  snsVerification?: SNSVerification;

  // Overall verification
  verificationLevel: VerificationLevel;
  verificationScore: number;

  // Timestamps
  nftVerifiedAt?: string;
  snsVerifiedAt?: string;
  lastVerificationCheck: string;

  // Blockchain verification
  onChainVerified: boolean;
  verificationTransaction?: string;

  // Benefits unlocked
  unlockedFeatures: VerificationFeature[];
  verificationBadges: VerificationBadge[];
}

export type VerificationLevel =
  | 'unverified'
  | 'nft_verified'
  | 'sns_verified'
  | 'fully_verified'
  | 'premium_verified';

export interface NFTVerification {
  // NFT details
  nftMint: string;
  nftName?: string;
  nftSymbol?: string;
  nftImage?: string;

  // Collection info
  collectionName?: string;
  collectionVerified: boolean;

  // Verification details
  verificationMethod:
    | 'wallet_signature'
    | 'ownership_proof'
    | 'metadata_verification';
  verifiedAt: string;
  expiresAt?: string;

  // Status
  status: VerificationStatus;
  lastChecked: string;
  autoVerify: boolean;

  // Metadata
  nftAttributes?: NFTAttribute[];
  rarity?: NFTRarity;
  floorPrice?: number;
}

export interface SNSVerification {
  // Domain details
  domain: string;
  fullDomain: string; // e.g., "example.sol"

  // Domain info
  domainOwner: string;
  registeredAt?: string;
  expiresAt?: string;

  // Verification details
  verificationMethod: 'domain_signature' | 'dns_record' | 'wallet_proof';
  verifiedAt: string;

  // Status
  status: VerificationStatus;
  lastChecked: string;
  autoRenew: boolean;

  // Social links
  socialLinks?: SocialLink[];
  websiteUrl?: string;
  verified3rdParty?: boolean;
}

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'expired'
  | 'failed'
  | 'revoked';

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFTRarity {
  rank?: number;
  score?: number;
  totalSupply: number;
}

export interface SocialLink {
  platform:
    | 'twitter'
    | 'discord'
    | 'telegram'
    | 'instagram'
    | 'github'
    | 'website';
  url: string;
  verified: boolean;
  username?: string;
}

export interface VerificationAttempt {
  id: string;
  type: VerificationType;

  // Attempt details
  initiatedAt: string;
  completedAt?: string;
  status: VerificationAttemptStatus;

  // Method used
  verificationMethod: string;
  evidence: VerificationEvidence[];

  // Results
  success: boolean;
  failureReason?: string;
  verificationData?: any;

  // Blockchain transaction
  transactionSignature?: string;
  transactionStatus?: 'pending' | 'confirmed' | 'failed';

  // Retry information
  retryable: boolean;
  maxRetries: number;
  retryCount: number;
}

export type VerificationType = 'nft' | 'sns' | 'both';
export type VerificationAttemptStatus =
  | 'initiated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface VerificationEvidence {
  type: 'signature' | 'transaction' | 'metadata' | 'ownership_proof';
  data: string;
  timestamp: string;
  verified: boolean;
}

export interface VerificationMethod {
  id: string;
  type: VerificationType;
  name: string;
  description: string;

  // Requirements
  requirements: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';

  // Costs
  gasCost?: number;
  serviceFee?: number;

  // Capabilities
  supportedWallets: string[];
  supportedNFTs?: string[];
  supportedDomains?: string[];

  // Status
  available: boolean;
  deprecated: boolean;
  beta: boolean;
}

export interface VerificationRequirement {
  type: VerificationType;
  requirement: string;
  description: string;
  mandatory: boolean;
  completed: boolean;

  // Help
  helpUrl?: string;
  tutorialUrl?: string;
  supportContact?: string;
}

export interface VerificationStats {
  // Personal stats
  totalAttempts: number;
  successfulVerifications: number;
  failedAttempts: number;
  successRate: number;

  // Time metrics
  averageVerificationTime: number;
  fastestVerification: number;

  // Feature usage
  featuresUnlocked: number;
  credibilityScore: number;
  trustRating: number;

  // Community comparison
  verificationRank?: number;
  percentile?: number;

  // Benefits earned
  totalBenefitsValue: number;
  featuresSaved: string[];
  prioritySupport: boolean;
}

export interface VerificationBenefit {
  id: string;
  name: string;
  description: string;

  // Requirements
  requiredLevel: VerificationLevel;
  requiredNFT: boolean;
  requiredSNS: boolean;

  // Benefit details
  benefitType: BenefitType;
  value: string;
  permanent: boolean;

  // Status
  available: boolean;
  unlocked: boolean;
  expires?: string;

  // Visual
  icon: string;
  color: string;
  priority: number;
}

export type BenefitType =
  | 'feature_access'
  | 'reduced_fees'
  | 'priority_support'
  | 'exclusive_content'
  | 'early_access'
  | 'enhanced_limits'
  | 'custom_badge'
  | 'analytics_access';

export interface VerificationFeature {
  featureId: string;
  featureName: string;
  description: string;
  unlockedAt: string;
  requiredLevel: VerificationLevel;
}

export interface VerificationBadge {
  badgeId: string;
  badgeName: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
  displayOrder: number;
  visible: boolean;
}

export interface VerificationOnboarding {
  // Progress tracking
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  totalSteps: number;

  // User selections
  selectedVerificationType: VerificationType | null;
  selectedMethod: VerificationMethod | null;

  // Preparation checklist
  preparationItems: PreparationItem[];
  readyToStart: boolean;

  // Help and guidance
  tutorials: Tutorial[];
  faqs: FAQ[];
  supportOptions: SupportOption[];
}

export type OnboardingStep =
  | 'welcome'
  | 'select_type'
  | 'choose_method'
  | 'prepare'
  | 'verify'
  | 'confirm'
  | 'complete';

export interface PreparationItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  helpUrl?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  steps: TutorialStep[];
}

export interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  actionRequired: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: boolean;
  helpfulCount: number;
}

export interface SupportOption {
  type: 'chat' | 'email' | 'documentation' | 'community';
  title: string;
  description: string;
  available: boolean;
  responseTime?: string;
  contactInfo?: string;
}

export interface VerificationDashboard {
  // Overview
  verificationSummary: VerificationSummary;
  quickActions: QuickAction[];

  // Recent activity
  recentAttempts: VerificationAttempt[];
  recentlyUnlocked: VerificationBenefit[];

  // Progress tracking
  progressMetrics: ProgressMetric[];
  upcomingExpiration: ExpirationWarning[];

  // Recommendations
  recommendations: VerificationRecommendation[];
  suggestedActions: SuggestedAction[];
}

export interface VerificationSummary {
  verificationLevel: VerificationLevel;
  completionPercentage: number;
  nextMilestone: string;
  benefitsUnlocked: number;
  credibilityScore: number;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  available: boolean;
}

export interface ProgressMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ExpirationWarning {
  type: 'nft' | 'sns' | 'benefit';
  item: string;
  expiresAt: string;
  daysRemaining: number;
  actionRequired: string;
  urgent: boolean;
}

export interface VerificationRecommendation {
  id: string;
  title: string;
  description: string;
  benefit: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  priority: number;
  category: 'verification' | 'enhancement' | 'maintenance';
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  actionType: 'verify_nft' | 'verify_sns' | 'update_profile' | 'claim_benefit';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedReward: string;
}
