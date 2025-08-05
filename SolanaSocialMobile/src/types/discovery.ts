export interface DiscoveryFeed {
  // Content sections
  trending: TrendingContent;
  recommended: RecommendedContent;
  categories: ContentCategory[];
  creators: PopularCreator[];

  // User context
  personalized: boolean;
  lastUpdated: string;
  refreshToken: string;
}

export interface TrendingContent {
  posts: TrendingPost[];
  hashtags: TrendingHashtag[];
  topics: TrendingTopic[];
  timeframe: TrendingTimeframe;
}

export type TrendingTimeframe = '1h' | '6h' | '24h' | '7d';

export interface TrendingPost {
  id: string;
  content: string;
  authorWallet: string;
  author: UserInfo;

  // Engagement metrics
  voteScore: number;
  commentCount: number;
  tipCount: number;
  shareCount: number;
  viewCount: number;

  // Trending metrics
  trendingScore: number;
  trendingRank: number;
  velocityScore: number; // Rate of engagement increase

  // Media
  mediaUrls: string[];
  mediaType?: 'image' | 'video' | 'gif';

  // Context
  tags: string[];
  category: string;
  createdAt: string;

  // User interaction
  userVoted?: number;
  userTipped?: boolean;
  userBookmarked?: boolean;
}

export interface UserInfo {
  wallet: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface TrendingHashtag {
  tag: string;
  postCount: number;
  totalEngagement: number;
  trendingScore: number;
  category: string;
  description?: string;
  relatedTags: string[];
}

export interface TrendingTopic {
  id: string;
  name: string;
  description: string;
  postCount: number;
  participantCount: number;
  trendingScore: number;
  category: string;
  tags: string[];
  featuredPost?: TrendingPost;
}

export interface RecommendedContent {
  forYou: RecommendedPost[];
  similarToLiked: RecommendedPost[];
  fromFollowing: RecommendedPost[];
  basedOnActivity: RecommendedPost[];
}

export interface RecommendedPost extends TrendingPost {
  recommendationReason: RecommendationReason;
  confidenceScore: number; // 0-100
  similarityScore?: number; // For content-based recommendations
}

export type RecommendationReason =
  | 'similar_to_liked'
  | 'from_following'
  | 'trending_in_category'
  | 'based_on_tags'
  | 'popular_with_similar_users'
  | 'new_from_creator'
  | 'high_engagement';

export interface ContentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;

  // Content stats
  postCount: number;
  activeUsers: number;
  trendingPosts: TrendingPost[];

  // Subcategories
  subcategories: Subcategory[];

  // User engagement
  userFollowing: boolean;
  userEngagement: number; // 0-100 score
}

export interface Subcategory {
  id: string;
  name: string;
  postCount: number;
  color: string;
}

export interface PopularCreator {
  wallet: string;
  displayName: string;
  username: string;
  avatar: string;

  // Metrics
  followerCount: number;
  postCount: number;
  totalTips: number;
  avgEngagement: number;
  reputationScore: number;

  // Growth metrics
  followerGrowth: number; // Percentage change
  engagementGrowth: number;

  // Content info
  topPost?: TrendingPost;
  recentPosts: TrendingPost[];
  primaryCategory: string;
  tags: string[];

  // User relationship
  userFollowing: boolean;
  userEngagement: number; // How much user engages with this creator

  // Verification
  isVerified: boolean;
  badges: string[];
}

export interface SearchResult {
  posts: SearchPost[];
  users: SearchUser[];
  hashtags: SearchHashtag[];
  groups: SearchGroup[];
  brands: SearchBrand[];

  // Search metadata
  query: string;
  totalResults: number;
  searchTime: number; // milliseconds
  suggestions: string[];
}

export interface SearchPost extends TrendingPost {
  searchScore: number;
  matchedTerms: string[];
  snippet: string;
}

export interface SearchUser extends PopularCreator {
  searchScore: number;
  matchedFields: string[];
  mutualConnections: number;
}

export interface SearchHashtag extends TrendingHashtag {
  searchScore: number;
  isFollowing: boolean;
}

export interface SearchGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  avatar: string;
  category: string;

  // Search context
  searchScore: number;
  matchedTerms: string[];
  userIsMember: boolean;
}

export interface SearchBrand {
  id: string;
  name: string;
  description: string;
  followerCount: number;
  avatar: string;
  category: string;

  // Search context
  searchScore: number;
  userFollowing: boolean;
}

export interface DiscoveryPreferences {
  // Content preferences
  preferredCategories: string[];
  excludedCategories: string[];
  preferredLanguages: string[];

  // Algorithm preferences
  personalizedRecommendations: boolean;
  trendingWeight: number; // 0-100
  diversityWeight: number; // 0-100
  freshnessWeight: number; // 0-100

  // Content filters
  minimumVoteScore: number;
  excludeNSFW: boolean;
  showOnlyVerified: boolean;
  hideDownvoted: boolean;

  // Creator preferences
  followingWeight: number; // How much to prioritize followed creators
  discoverNewCreators: boolean;
  similarCreatorsWeight: number;

  // Interaction history
  viewedPosts: string[]; // Recent post IDs to avoid duplicates
  dismissedRecommendations: string[];
  interactionHistory: InteractionEvent[];
}

export interface InteractionEvent {
  type: 'view' | 'like' | 'comment' | 'share' | 'tip' | 'follow';
  targetId: string;
  targetType: 'post' | 'user' | 'hashtag';
  timestamp: string;
  duration?: number; // For view events
}

export interface ExploreSection {
  id: string;
  title: string;
  type: ExploreSectionType;
  items: any[];
  refreshable: boolean;
  loadMore: boolean;
  loading: boolean;
}

export type ExploreSectionType =
  | 'trending_posts'
  | 'recommended_posts'
  | 'popular_creators'
  | 'trending_hashtags'
  | 'categories'
  | 'new_users'
  | 'featured_content';

export interface LeaderboardEntry {
  // Core identification
  rank: number;
  address: string;         // Blockchain PDA address
  owner: string;           // User's wallet address (for walletAddress compatibility)
  
  // Reputation metrics
  reputation: number;      // Total reputation score
  scoreThisEpoch: number;  // Score in current epoch
  upvotesReceived: number;
  downvotesReceived: number;
  voteRatio: number;       // Percentage of upvotes (0-1)
  reputationLevel: string; // newcomer|rising|established|expert|legendary
  lastEpochUpdated: number;
  updatedAt: number;
  
  // User profile (optional - only if user linked)
  username?: string;
  avatar?: string;
  isVerified?: boolean;
  
  // NEW: Blockchain profile info
  solDomain?: string;          // Optional - verified .sol domain
  verificationType?: string;   // "none", "nft", "sns", "both"
  
  // NEW: Timeline/streak info
  consecutiveEpochs?: number;  // Current posting streak
  postsThisEpoch?: number;     // Posts made this epoch
  isStreaking?: boolean;       // Whether user has active streak
  
  // Computed fields for compatibility
  walletAddress?: string;      // Computed from owner field
  displayName?: string;        // Computed from username
  totalReputation?: number;    // Alias for reputation
  gainThisEpoch?: number;      // Alias for scoreThisEpoch
  totalPosts?: number;         // Legacy field
  postStreak?: number;         // Alias for consecutiveEpochs
  change?: number;             // Position change from previous period
  
  // Additional context
  id?: string;                 // Computed field for React keys
  joinedAt?: string;
  lastActive?: string;
}
