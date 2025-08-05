export type SearchType =
  | 'all'
  | 'posts'
  | 'users'
  | 'brands'
  | 'groups'
  | 'auctions'
  | 'hashtags'
  | 'locations';

export interface SearchQuery {
  query: string;
  type: SearchType;
  filters: SearchFilters;
  sorting: SearchSorting;
  pagination: SearchPagination;
}

export interface SearchFilters {
  // Time filters
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  dateFrom?: string;
  dateTo?: string;

  // User filters
  verificationLevel?: 'all' | 'basic' | 'verified' | 'premium';
  userType?: 'individual' | 'brand' | 'organization';
  followersMin?: number;
  followersMax?: number;

  // Content filters
  hasMedia?: boolean;
  hasLinks?: boolean;
  language?: string;
  minEngagement?: number;
  contentType?: 'text' | 'image' | 'video' | 'audio' | 'poll';

  // Location filters
  location?: {
    lat: number;
    lng: number;
    radius: number; // in km
  };
  country?: string;
  city?: string;

  // Price filters (for auctions/marketplace)
  priceMin?: number;
  priceMax?: number;
  currency?: 'SOL' | 'USD';

  // Engagement filters
  likesMin?: number;
  commentsMin?: number;
  sharesMin?: number;
  tipsMin?: number;
}

export interface SearchSorting {
  field:
    | 'relevance'
    | 'date'
    | 'engagement'
    | 'followers'
    | 'price'
    | 'distance';
  direction: 'asc' | 'desc';
}

export interface SearchPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SearchResult {
  id: string;
  type: SearchType;
  relevanceScore: number;
  data: SearchResultData;
  highlightedFields?: Record<string, string>;
  metadata?: SearchResultMetadata;
}

export type SearchResultData =
  | PostSearchResult
  | UserSearchResult
  | BrandSearchResult
  | GroupSearchResult
  | AuctionSearchResult
  | HashtagSearchResult
  | LocationSearchResult;

export interface PostSearchResult {
  id: string;
  content: string;
  author: {
    wallet: string;
    username?: string;
    avatar?: string;
    verificationLevel?: 'basic' | 'verified' | 'premium';
  };
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbnail?: string;
  }[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    tips: number;
    tipAmount: number;
  };
  timestamp: string;
  hashtags: string[];
  location?: {
    name: string;
    coordinates: [number, number];
  };
}

export interface UserSearchResult {
  wallet: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  verificationLevel?: 'basic' | 'verified' | 'premium';
  userType: 'individual' | 'brand' | 'organization';
  stats: {
    followers: number;
    following: number;
    posts: number;
    reputation: number;
  };
  lastActive: string;
  location?: string;
  isFollowing?: boolean;
}

export interface BrandSearchResult {
  id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  website?: string;
  category: string;
  verificationLevel: 'basic' | 'verified' | 'premium';
  stats: {
    followers: number;
    products: number;
    sales: number;
    rating: number;
  };
  location?: string;
  isFollowing?: boolean;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  category: string;
  privacy: 'public' | 'private' | 'invite-only';
  stats: {
    members: number;
    posts: number;
    activity: number;
  };
  admins: UserSearchResult[];
  isMember?: boolean;
  lastActivity: string;
}

export interface AuctionSearchResult {
  id: string;
  title: string;
  description: string;
  images: string[];
  currentBid: number;
  startingBid: number;
  endTime: string;
  seller: UserSearchResult;
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location?: string;
  bidCount: number;
  isActive: boolean;
}

export interface HashtagSearchResult {
  tag: string;
  posts: number;
  trend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;
  relatedTags: string[];
  category?: string;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  type: 'city' | 'landmark' | 'business' | 'region';
  coordinates: [number, number];
  country: string;
  region?: string;
  postCount: number;
  popularTimes?: string[];
}

export interface SearchResultMetadata {
  cached: boolean;
  fetchTime: number;
  source: 'local' | 'api' | 'ai';
  confidence?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  facets?: SearchFacets;
  suggestions?: SearchSuggestion[];
  relatedQueries?: string[];
  took: number; // query time in ms
}

export interface SearchFacets {
  types: Record<SearchType, number>;
  timeRanges: Record<string, number>;
  locations: Record<string, number>;
  verificationLevels: Record<string, number>;
  categories: Record<string, number>;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'hashtag' | 'user' | 'location';
  count?: number;
  trending?: boolean;
}

export interface SearchHistory {
  id: string;
  query: string;
  type: SearchType;
  timestamp: string;
  resultCount: number;
  clicked?: boolean;
}

export interface TrendingTopic {
  tag: string;
  posts: number;
  change: number; // percentage change
  category?: string;
  location?: string;
  timeframe: 'hour' | 'day' | 'week';
}

export interface DiscoveryFeed {
  id: string;
  title: string;
  description: string;
  type: DiscoveryFeedType;
  items: DiscoveryItem[];
  refreshed: string;
  hasMore: boolean;
}

export type DiscoveryFeedType =
  | 'for-you'
  | 'trending'
  | 'new-creators'
  | 'trending-hashtags'
  | 'nearby'
  | 'followed-activity'
  | 'recommended-brands'
  | 'hot-auctions';

export interface DiscoveryItem {
  id: string;
  type: 'post' | 'user' | 'hashtag' | 'group' | 'auction' | 'brand';
  data: SearchResultData;
  reason: RecommendationReason;
  score: number;
  seenAt?: string;
}

export interface RecommendationReason {
  type:
    | 'trending'
    | 'similar-interests'
    | 'followed-activity'
    | 'location'
    | 'ai-suggestion';
  description: string;
  confidence: number;
}

export interface SearchAnalytics {
  sessionId: string;
  queries: SearchQueryAnalytics[];
  timeSpent: number;
  resultsClicked: number;
  conversions: number; // follows, tips, etc.
}

export interface SearchQueryAnalytics {
  query: string;
  type: SearchType;
  timestamp: string;
  resultCount: number;
  timeToResults: number;
  clicked: boolean;
  clickedPosition?: number;
  refinements: number;
}

export interface VoiceSearchConfig {
  enabled: boolean;
  language: string;
  autoSubmit: boolean;
  confidenceThreshold: number;
}

export interface SearchConfig {
  realtimeEnabled: boolean;
  suggestionsEnabled: boolean;
  historyEnabled: boolean;
  maxHistoryItems: number;
  debounceMs: number;
  cacheEnabled: boolean;
  cacheTtl: number; // seconds
  voiceSearch: VoiceSearchConfig;
  aiRecommendations: boolean;
}

// Search UI State
export interface SearchState {
  // Current search
  query: string;
  type: SearchType;
  filters: SearchFilters;
  sorting: SearchSorting;

  // Results
  results: SearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  total: number;
  error: string | null;

  // Suggestions and history
  suggestions: SearchSuggestion[];
  history: SearchHistory[];
  trending: TrendingTopic[];

  // Discovery
  discoveryFeeds: Record<DiscoveryFeedType, DiscoveryFeed>;

  // UI state
  isFilterModalOpen: boolean;
  recentlyViewed: SearchResult[];
  savedSearches: SavedSearch[];

  // Analytics
  analytics: SearchAnalytics | null;

  // Config
  config: SearchConfig;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: string;
  lastRun?: string;
  alertsEnabled: boolean;
  newResults?: number;
}

export interface SearchAlert {
  id: string;
  savedSearchId: string;
  type: 'new-results' | 'trending' | 'price-change';
  message: string;
  timestamp: string;
  read: boolean;
}

// Advanced Search Features
export interface SemanticSearch {
  enabled: boolean;
  embeddings: boolean;
  similarityThreshold: number;
}

export interface AISearch {
  naturalLanguageQuery: boolean;
  intentDetection: boolean;
  autoCorrection: boolean;
  personalization: boolean;
  contextAware: boolean;
}

export interface SearchPersonalization {
  userId: string;
  interests: string[];
  searchPatterns: Record<string, number>;
  preferredTypes: SearchType[];
  locationBias: boolean;
  timezoneBias: boolean;
  languagePreference: string;
}
