// Updated User Profile types based on new API endpoints
export interface UserProfile {
  // Core identity
  userWallet: string;
  displayName?: string;
  description?: string; // Renamed from bio
  profilePicture?: string;
  bannerImage?: string;
  location?: string;
  website?: string;
  timefun?: string;
  joinedAt: string;

  // Linked wallets
  linkedWallets?: string[];

  // Badges and verification
  badges?: string[];
  nftVerified: boolean;
  nftMint?: string;
  nftMetadata?: NFTMetadata;
  snsVerified: boolean;
  snsDomain?: string;
  isVerifiedCreator: boolean;

  // Social metrics
  postCount: number;
  followerCount: number;
  followingCount: number;
  onChainReputation: number;
  reputation?: number; // New field from API
  totalReputation: number; // Total reputation score (for consistency with leaderboard)
  gainThisEpoch: number; // Reputation gained this epoch
  scoreThisEpoch: number; // Alias for gainThisEpoch
  upvotesReceived?: number; // From new API
  downvotesReceived?: number; // From new API
  epochStreak?: number; // From new API

  // Tip statistics
  tipsSentCount: number;
  tipsSentTotal: number;
  tipsReceivedCount: number;
  tipsReceivedTotal: number;

  // Activity tracking
  lastActiveSlot: number;
  isActive: boolean;

  // Brand association
  brandAddress?: string;
  brandName?: string;

  // Social relationships
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isMutualFollow?: boolean;

  // Privacy and filtering
  isPrivate: boolean;
  allowDirectMessages: boolean;
  showActivity: boolean;
  repFilter?: number;
  mutedUsers?: string[];
  mutedWords?: string[];

  // Solana settings
  connectionMethod?: string;
  explorer?: string;
  
  // Profile display settings
  showBadgesOnProfile?: boolean;
}

// API Response types for new endpoints
export interface AuthenticatedProfileResponse {
  success: boolean;
  data: {
    userId: number;
    userWallet: string;
    displayName?: string;
    description?: string;
    profilePicture?: string;
    bannerImage?: string;
    location?: string;
    website?: string;
    timefun?: string;
    linkedWallets?: string[];
    badges?: string[];
    isPrivate: boolean;
    repFilter?: number;
    mutedUsers?: string[];
    mutedWords?: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface ComprehensiveProfileResponse {
  success: boolean;
  data: {
    // User data from database
    userData: {
      userId: number;
      userWallet: string;
      displayName?: string;
      description?: string;
      profilePicture?: string;
      bannerImage?: string;
      location?: string;
      website?: string;
      timefun?: string;
      linkedWallets?: string[];
      badges?: string[];
      isPrivate: boolean;
      repFilter?: number;
      mutedUsers?: string[];
      mutedWords?: string[];
      createdAt: string;
      updatedAt: string;
    };
    // Blockchain profile data
    blockchainProfile: {
      userWallet: string;
      displayName?: string;
      bio?: string;
      nftVerified: boolean;
      nftMint?: string;
      snsVerified: boolean;
      snsDomain?: string;
      isVerifiedCreator: boolean;
      postCount: number;
      followerCount: number;
      followingCount: number;
      lastActiveSlot: number;
      onChainReputation?: number;
      reputation?: number;
    };
  };
}

export interface PublicProfileResponse {
  success: boolean;
  data: {
    userWallet: string;
    displayName?: string;
    description?: string;
    profilePicture?: string;
    bannerImage?: string;
    location?: string;
    website?: string;
    timefun?: string;
    badges?: string[];
    isPrivate: boolean;
    // Social metrics from blockchain
    postCount: number;
    followerCount: number;
    followingCount: number;
    onChainReputation?: number;
    reputation?: number;
    // Verification status
    nftVerified: boolean;
    nftMint?: string;
    snsVerified: boolean;
    snsDomain?: string;
    isVerifiedCreator: boolean;
    // Tip statistics
    tipsSentCount?: number;
    tipsSentTotal?: number;
    tipsReceivedCount?: number;
    tipsReceivedTotal?: number;
  };
}

export interface NFTMetadata {
  name: string;
  image?: string;
  description?: string;
  collection?: string;
  verified: boolean;
  floorPrice?: number;
}

export interface UserActivity {
  id: string;
  type: 'post' | 'vote' | 'tip' | 'follow' | 'brand_action';
  timestamp: string;
  data: any;
  isVisible: boolean;
}

export interface ProfileEditData {
  displayName?: string;
  description?: string; // Renamed from bio
  profilePicture?: string;
  bannerImage?: string;
  location?: string;
  website?: string;
  timefun?: string;
  linkedWallets?: string[];
  badges?: string[];
  isPrivate?: boolean;
  repFilter?: number;
  mutedUsers?: string[];
  mutedWords?: string[];
  // Legacy fields for compatibility
  allowDirectMessages?: boolean;
  showActivity?: boolean;
}

export interface SocialStats {
  posts: number;
  followers: number;
  following: number;
  reputation: number;
  tipsSent: number;
  tipsReceived: number;
  totalTipVolume: number;
}
