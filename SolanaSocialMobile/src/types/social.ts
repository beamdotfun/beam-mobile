export interface Post {
  // ===== CORE POST IDENTITY =====
  id: string;
  createdAt?: string;                // New camelCase field from backend
  updatedAt?: string;                // New camelCase field from backend
  userId?: number;                   // New camelCase field from backend
  user_id?: number;                 // Legacy field for compatibility
  userWallet?: string;

  // ===== USER INFORMATION =====
  user: {
    id?: number;
    name?: string;                     // New camelCase field from backend
    profilePicture?: string;          // New camelCase field from backend  
    primaryWalletAddress?: string;     // New camelCase field from backend
    isVerified?: boolean;              // New camelCase field from backend
    onChainReputation?: number;        // New camelCase field from backend
    // Legacy snake_case fields for compatibility
    username?: string;
    display_name?: string;
    avatar_url?: string;
    wallet_address?: string;
    is_verified?: boolean;
    reputation_score?: number;
    follower_count?: number;
    following_count?: number;
    is_brand?: boolean;
    
    // Brand information (from processed_posts when userIsBrand is true)
    brand_name?: string | null;
    brand_logo_url?: string | null;
    brand_is_verified?: boolean;
    brand_category?: string | null;
    brand_url?: string | null;
    brand_reputation?: number;
    brandAddress?: string;
    walletAddress?: string;
  };

  // ===== POST CONTENT =====
  message: string;
  mediaUrls?: string[];              // New camelCase field from backend
  media_urls?: string[];            // Legacy field for compatibility
  tags?: string[];
  language?: string;

  // ===== MEDIA CONTENT =====
  images?: string[];
  video?: string | null;

  // ===== SOCIAL METRICS =====
  replyCount?: number;             // New field from backend
  repostCount?: number;            // New field from backend
  voteScore?: number;              // New field from backend
  upvoteCount?: number;            // New field from backend  
  downvoteCount?: number;          // New field from backend
  viewCount?: number;              // New camelCase field from backend
  view_count?: number;            // Legacy field for compatibility

  // ===== QUOTE AND THREAD FEATURES =====
  quote_count?: number;
  quoted_post?: string | null;
  is_thread?: boolean;
  previous_thread_post?: string | null;

  // ===== NEW BACKEND FIELDS (from backend fixes) =====
  quotedPostData?: Post | null;        // Full quoted post data instead of just signature
  threadData?: {
    rootPostSignature: string;
    rootPost: Post;
    replyCount: number;
    participants: string[];
    lastReplyAt: string;
    threadPosts: Post[];
    hasMore: boolean;
  } | null;
  isThreadRoot?: boolean;              // Indicates if this post is the root of a thread
  threadPostCount?: number;            // Total posts in this thread

  // ===== QUOTE TRACKING =====
  quoted_by: string[];              // Array of signatures that quoted this post
  quote_details: Array<{
    signature: string;
    user: string;                   // wallet address
    userId: number;
    displayName: string;
    avatar?: string;
    quoteMessage: string;
    createdAt: string;
  }>;

  // ===== ENGAGEMENT COUNTS =====
  receiptCount?: number;                 // New camelCase field from backend
  receipts_count?: number;              // Legacy field for compatibility
  tipCount?: number;
  totalTipAmount?: number;

  // ===== TAGGED USERS =====
  tagged_users?: string[];
  taggedUsers?: string[];               // Alternative field name for processed_posts

  // ===== BLOCKCHAIN DATA =====
  transactionHash?: string;          // New camelCase field from backend
  transaction_hash?: string;        // Legacy field for compatibility
  walletAddress?: string;            // New camelCase field from backend
  slot?: number;
  epoch?: number;
  blockTime?: string;                // New field from backend
  postNumber?: number;               // New camelCase field from backend
  postsInEpoch?: number;             // New camelCase field from backend
  onChainVerified?: boolean;         // New camelCase field from backend

  // ===== BLOCKCHAIN USER PROFILE DATA =====
  username?: string;
  profile_image_url?: string;
  is_username_verified?: boolean;
  is_profile_verified?: boolean;
  is_brand?: boolean;
  post_count?: number;

  // ===== USER SCORING DATA =====
  reputation?: number;
  upvotes_received?: number;
  downvotes_received?: number;

  // ===== USER TIMELINE DATA =====
  streak?: number;
  posts_this_epoch?: number;

  // ===== METADATA =====
  isPinned?: boolean;                // New camelCase field from backend
  isHidden?: boolean;                // New field from backend
  // Legacy fields for compatibility
  post_number?: number;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;

  // ===== REPLY/QUOTE CONTEXT =====
  reply_to_post?: Post | null;
  quote_post?: Post | null;

  // ===== USER INTERACTIONS =====
  user_vote?: 'upvote' | 'downvote' | null;
  userVote?: 'upvote' | 'downvote' | null;    // New camelCase field from backend
  user_bookmarked?: boolean;
  userBookmarked?: boolean;                     // New camelCase field from backend
  userTipped?: boolean;

  // ===== LEGACY COMPATIBILITY FIELDS (avoiding duplicates) =====
  signature?: string;               // Use transaction_hash instead
  userPubkey?: string;             // Use user.wallet_address instead
  isThread?: boolean;              // Use is_thread instead
  quotedPost?: string;             // Use quoted_post instead
}

export interface CreatePostRequest {
  message: string;
  mediaUrls?: string[];
}

export interface VoteRequest {
  targetWallet: string;
  voteType: 'upvote' | 'downvote';
}

export interface TipRequest {
  receiverWallet: string;
  amount: number;
  message?: string;
}

export interface FeedState {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
}