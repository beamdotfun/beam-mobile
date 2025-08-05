// User and Profile Types
export interface User {
  id: number;
  walletAddress: string;
  name?: string;
  profilePicture?: string;
  isVerified: boolean;
  onChainReputation: number;
  tipsSentCount: number;
  tipsSentTotal: number;
  tipsReceivedCount: number;
  tipsReceivedTotal: number;
  brandAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
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
}

// Social Platform Types
export interface Post {
  id: number;
  userWallet: string;
  transactionHash: string;
  message: string;
  mediaUrls?: string[];
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
  user?: User;
}

export interface Vote {
  id: number;
  voterWallet: string;
  targetWallet: string;
  voteType: 'upvote' | 'downvote';
  transactionHash: string;
  createdAt: string;
}

export interface Tip {
  id: number;
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  createdAt: string;
}

// Brand Management Types
export interface Brand {
  id: number;
  brandId: string;
  name: string;
  description: string;
  website: string;
  category: string;
  logoUrl: string;
  ownerWallet: string;
  isActive: boolean;
  isVerified: boolean;
  verificationLevel: string;
  createdAt: string;
}

export interface BrandActivity {
  id: number;
  brandId: string;
  activityType: string;
  activitySlot: number;
  expiresSlot: number;
  transactionSig: string;
  entityId?: string;
  createdAt: string;
}

// Auction System Types
export interface Auction {
  id: number;
  groupId: string;
  slotType: string;
  currentBid: number;
  bidCount: number;
  auctionEndSlot: number;
  status: 'pending' | 'active' | 'ended' | 'finalized';
  winnerWallet?: string;
  winningBid: number;
  createdAt: string;
}

export interface Bid {
  id: number;
  auctionId: string;
  bidderWallet: string;
  bidAmount: number;
  adNftAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
  bidNumber: number;
  createdAt: string;
}

export interface Group {
  id: number;
  groupId: string;
  name: string;
  description: string;
  category: string;
  adminWallet: string;
  memberCount: number;
  minPricePerSlot: number;
  isActive: boolean;
  createdAt: string;
}

// Admin Types
export interface AdminUser {
  id: number;
  wallet: string;
  role: 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

// Request Types
export interface CreatePostRequest {
  message: string;
  mediaUrls?: string[];
  quotedPostId?: string;
}

export interface SendTipRequest {
  receiverWallet: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}

export interface CreateBrandRequest {
  name: string;
  description: string;
  website: string;
  category: string;
  logoUrl: string;
}

export interface CreateBidRequest {
  groupId: string;
  bidAmount: number;
  adNftAddress: string;
}


// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Authentication Types
export interface AuthRequest {
  walletAddress: string;
  signature?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// Reputation Types
export interface ReputationData {
  walletAddress: string;
  totalScore: number;
  upvotesReceived: number;
  downvotesReceived: number;
  scoreThisEpoch: number;
  lastEpochUpdated: number;
  reputationLevel: 'newcomer' | 'rising' | 'established' | 'expert' | 'legendary';
  voteRatio: number;
  lastUpdated: string | null;
}

export interface ReputationResponse {
  success: boolean;
  data: ReputationData;
  message?: string;
}
