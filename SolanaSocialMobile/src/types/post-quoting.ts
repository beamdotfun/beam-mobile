export type QuoteType =
  | 'agree'
  | 'disagree'
  | 'add_context'
  | 'share'
  | 'question'
  | 'neutral';

export interface QuoteTypeInfo {
  type: QuoteType;
  label: string;
  description: string;
  icon: string;
  color: string;
  emoji: string;
}

export interface QuoteablePost {
  id: string;
  author: {
    wallet: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    verificationLevel?: 'basic' | 'verified' | 'premium';
  };
  content: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbnail?: string;
    duration?: number;
  }[];
  timestamp: string;
  engagement: {
    likes: number;
    quotes: number;
    shares: number;
    tips: number;
  };

  // Quote chain information
  isQuote: boolean;
  quotedPost?: QuotedPost;
  quoteDepth: number;
  maxQuoteDepth: number;

  // Quote permissions
  canQuote: boolean;
  quoteSettings: {
    allowQuotes: boolean;
    maxQuoteDepth: number;
    restrictQuoteTypes?: QuoteType[];
    requireApproval: boolean;
  };

  // Preview data for quoting
  preview: {
    contentPreview: string; // Truncated content
    hasMedia: boolean;
    authorInfo: string; // "@username - 2h ago"
  };
}

export interface QuotedPost {
  id: string;
  content: string;
  author: {
    wallet: string;
    username?: string;
    displayName?: string;
    avatar?: string;
  };
  timestamp: string;
  quoteType?: QuoteType;
  hasMedia?: boolean;
  mediaPreview?: string;
  isDeleted?: boolean;
  isRestricted?: boolean;
}

export interface QuoteContext {
  id: string;
  parentPostId: string;
  quoterWallet: string;
  quoteType: QuoteType;
  content: string;
  timestamp: string;

  // Quote relationships
  quotedPost: QuotedPost;
  depth: number;
  chainId: string;

  // Engagement
  engagement: {
    likes: number;
    subQuotes: number;
    shares: number;
    tips: number;
  };

  // Status
  status: 'active' | 'deleted' | 'hidden' | 'reported';
  moderationFlags?: string[];

  // Permissions
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}

export interface QuoteChain {
  id: string;
  originalPostId: string;
  totalQuotes: number;
  depth: number;
  maxDepth: number;

  // Chain structure
  quotes: QuoteContext[];
  branches: QuoteChain[]; // For nested quote conversations

  // Analytics
  analytics: {
    totalEngagement: number;
    mostPopularQuote: string;
    dominantQuoteType: QuoteType;
    averageResponseTime: number;
    participantCount: number;
  };

  // Timeline
  createdAt: string;
  lastActivity: string;
  trending: boolean;
}

export interface QuoteInteraction {
  id: string;
  type: 'like' | 'share' | 'tip' | 'report';
  userWallet: string;
  quoteId: string;
  timestamp: string;
  metadata?: {
    tipAmount?: number;
    shareMessage?: string;
    reportReason?: string;
  };
}

export interface QuotingAnalytics {
  // User analytics
  userStats: {
    totalQuotes: number;
    quotesByType: Record<QuoteType, number>;
    averageEngagement: number;
    mostQuotedPosts: string[];
    quoteStreak: number;
  };

  // Content analytics
  contentStats: {
    quotabilityScore: number;
    viralQuotes: QuoteContext[];
    quoteConversionRate: number; // quotes per view
    avgQuoteDepth: number;
    popularQuoteTypes: QuoteType[];
  };

  // Trend analytics
  trendingQuotes: {
    quote: QuoteContext;
    trendScore: number;
    growthRate: number;
    timeframe: string;
  }[];
}

export interface QuoteSettings {
  // User preferences
  defaultQuoteType: QuoteType;
  autoExpandChains: boolean;
  showQuotePreview: boolean;
  enableQuoteNotifications: boolean;

  // Privacy settings
  allowQuotesFromStrangers: boolean;
  requireQuoteApproval: boolean;
  restrictedQuoteTypes: QuoteType[];

  // Display preferences
  maxChainDepthDisplay: number;
  collapseOldQuotes: boolean;
  highlightOwnQuotes: boolean;
  showQuoteTypes: boolean;
}

export interface QuoteNotification {
  id: string;
  type:
    | 'quote_received'
    | 'quote_liked'
    | 'quote_chain_activity'
    | 'quote_trending';
  fromUser: {
    wallet: string;
    username?: string;
    avatar?: string;
  };
  quoteId: string;
  quoteType?: QuoteType;
  message: string;
  timestamp: string;
  read: boolean;

  // Context
  originalPostId: string;
  quotePreview: string;
}

export interface QuoteSearchFilters {
  quoteTypes?: QuoteType[];
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'all';
  minEngagement?: number;
  hasMedia?: boolean;
  author?: string;
  originalAuthor?: string;
  trending?: boolean;
  verified?: boolean;
}

export interface QuoteSearchResult {
  quote: QuoteContext;
  relevanceScore: number;
  highlightedText: string;
  matchType: 'content' | 'author' | 'type';
}

// UI State Types
export interface QuoteModalState {
  isVisible: boolean;
  targetPost: QuoteablePost | null;
  selectedQuoteType: QuoteType;
  quoteContent: string;
  isLoading: boolean;
  error: string | null;
  step: 'select_type' | 'write_content' | 'review' | 'posting' | 'success';
}

export interface QuoteUIState {
  // Modal state
  modalState: QuoteModalState;

  // Quote preview state
  expandedPreviews: Set<string>;
  loadingPreviews: Set<string>;
  previewCache: Map<string, QuoteablePost>;

  // Chain view state
  expandedChains: Set<string>;
  loadingChains: Set<string>;
  chainCache: Map<string, QuoteChain>;

  // Interaction state
  pendingInteractions: Map<string, 'liking' | 'sharing' | 'tipping'>;
  optimisticUpdates: Map<string, Partial<QuoteContext>>;
}

export interface QuoteStore extends QuoteUIState {
  // Core data
  quotes: Map<string, QuoteContext>;
  quoteChains: Map<string, QuoteChain>;
  userQuotes: string[];

  // Settings
  settings: QuoteSettings;
  analytics: QuotingAnalytics;

  // Actions
  quotePost: (
    postId: string,
    quoteType: QuoteType,
    content: string,
  ) => Promise<QuoteContext>;

  loadQuoteablePost: (postId: string) => Promise<QuoteablePost>;
  loadQuoteChain: (postId: string) => Promise<QuoteChain>;
  loadUserQuotes: (wallet?: string) => Promise<void>;

  // Quote interactions
  likeQuote: (quoteId: string) => Promise<void>;
  shareQuote: (quoteId: string, message?: string) => Promise<void>;
  tipQuote: (quoteId: string, amount: number) => Promise<void>;
  reportQuote: (quoteId: string, reason: string) => Promise<void>;

  // Modal management
  openQuoteModal: (post: QuoteablePost) => void;
  closeQuoteModal: () => void;
  updateModalState: (updates: Partial<QuoteModalState>) => void;

  // Preview management
  togglePreviewExpansion: (postId: string) => void;
  preloadQuotePreview: (postId: string) => Promise<void>;

  // Chain management
  toggleChainExpansion: (chainId: string) => void;
  loadMoreInChain: (chainId: string) => Promise<void>;

  // Search and discovery
  searchQuotes: (
    query: string,
    filters?: QuoteSearchFilters,
  ) => Promise<QuoteSearchResult[]>;

  getTrendingQuotes: (
    timeframe?: 'hour' | 'day' | 'week',
  ) => Promise<QuoteContext[]>;

  // Settings
  updateSettings: (settings: Partial<QuoteSettings>) => void;
  resetSettings: () => void;

  // Analytics
  trackQuoteEvent: (
    event: 'view' | 'quote' | 'expand' | 'interact',
    quoteId: string,
    metadata?: any,
  ) => void;

  getQuoteAnalytics: (timeframe?: string) => Promise<QuotingAnalytics>;

  // Cache management
  clearCache: () => void;
  optimizeCache: () => void;

  // Utilities
  getQuoteTypeInfo: (type: QuoteType) => QuoteTypeInfo;
  formatQuotePreview: (content: string, maxLength?: number) => string;
  validateQuoteContent: (content: string) => {valid: boolean; error?: string};
  canUserQuote: (post: QuoteablePost, userWallet: string) => boolean;
}

// API Types
export interface CreateQuoteRequest {
  parentPostId: string;
  quoteType: QuoteType;
  content: string;
  isAnonymous?: boolean;
}

export interface CreateQuoteResponse {
  quote: QuoteContext;
  quotedPost: QuotedPost;
  chainId: string;
}

export interface QuoteChainResponse {
  chain: QuoteChain;
  hasMore: boolean;
  nextCursor?: string;
}

export interface TrendingQuotesResponse {
  quotes: QuoteContext[];
  trending: boolean;
  timeframe: string;
  total: number;
}

// Constants
export const QUOTE_TYPES: QuoteTypeInfo[] = [
  {
    type: 'agree',
    label: 'Agree',
    description: 'I agree with this post',
    icon: 'thumbs-up',
    color: '#10B981',
    emoji: '👍',
  },
  {
    type: 'disagree',
    label: 'Disagree',
    description: 'I disagree with this post',
    icon: 'thumbs-down',
    color: '#EF4444',
    emoji: '👎',
  },
  {
    type: 'add_context',
    label: 'Add Context',
    description: 'Add more information or context',
    icon: 'plus-circle',
    color: '#3B82F6',
    emoji: '➕',
  },
  {
    type: 'share',
    label: 'Share',
    description: 'Share with my audience',
    icon: 'share',
    color: '#8B5CF6',
    emoji: '🔄',
  },
  {
    type: 'question',
    label: 'Question',
    description: 'Ask a question about this',
    icon: 'help-circle',
    color: '#F59E0B',
    emoji: '❓',
  },
  {
    type: 'neutral',
    label: 'Comment',
    description: 'General comment or response',
    icon: 'message-circle',
    color: '#6B7280',
    emoji: '💬',
  },
];

export const QUOTE_LIMITS = {
  MAX_CONTENT_LENGTH: 500,
  MAX_QUOTE_DEPTH: 5,
  MIN_CONTENT_LENGTH: 1,
  PREVIEW_LENGTH: 100,
  CHAIN_LOAD_LIMIT: 20,
  CACHE_SIZE_LIMIT: 100,
} as const;
