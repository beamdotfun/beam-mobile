export interface Comment {
  id: string;
  postId: string;
  parentCommentId?: string; // for nested replies
  userWallet: string;
  content: string;
  mentions: Mention[];
  hashtags: string[];

  // Engagement
  upvotes: number;
  downvotes: number;
  voteScore: number;
  replyCount: number;

  // User interaction
  userVote?: 'upvote' | 'downvote' | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isPinned: boolean;

  // User info
  user: {
    walletAddress: string;
    displayName: string;
    profilePicture?: string;
    isVerified: boolean;
    onChainReputation: number;
  };

  // Nested replies (for comment threads)
  replies?: Comment[];
}

export interface Mention {
  id: string;
  userWallet: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
}

export interface Hashtag {
  tag: string;
  postCount: number;
  trendingScore: number;
  category?: string;
}

export interface Reaction {
  id: string;
  postId?: string;
  commentId?: string;
  userWallet: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow';
  createdAt: string;
}

export interface PostShare {
  id: string;
  postId: string;
  sharedByWallet: string;
  sharedByName: string;
  comment?: string;
  platform: 'internal' | 'twitter' | 'discord' | 'telegram';
  createdAt: string;
}

export interface SocialThread {
  id: string;
  title: string;
  description?: string;
  creatorWallet: string;
  posts: string[]; // Array of post IDs
  participantCount: number;
  isPublic: boolean;
  hashtags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateRequest {
  postId: string;
  parentCommentId?: string;
  content: string;
  mentions?: string[]; // Array of user wallets
}

export interface CommentUpdateRequest {
  content: string;
  mentions?: string[];
}

export interface CommentVoteRequest {
  commentId: string;
  voteType: 'upvote' | 'downvote';
}

export interface ReactionRequest {
  targetId: string; // postId or commentId
  targetType: 'post' | 'comment';
  reactionType: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow';
}

export interface ShareRequest {
  postId: string;
  platform: 'internal' | 'twitter' | 'discord' | 'telegram';
  comment?: string;
}

export interface MentionSuggestion {
  walletAddress: string;
  displayName: string;
  profilePicture?: string;
  isVerified: boolean;
  onChainReputation: number;
}

export interface HashtagSuggestion {
  tag: string;
  postCount: number;
  trendingScore: number;
  category?: string;
}

export interface SocialAnalytics {
  totalComments: number;
  totalReactions: number;
  totalShares: number;
  engagementRate: number;
  sentimentScore: number;
  reachCount: number;
}

export interface CommentFilter {
  sortBy?: 'newest' | 'oldest' | 'top' | 'controversial';
  includeReplies?: boolean;
  userWallet?: string;
  hasMedia?: boolean;
}

export interface ReactionSummary {
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow';
  count: number;
  hasUserReacted: boolean;
  recentUsers: {
    walletAddress: string;
    displayName: string;
    profilePicture?: string;
  }[];
}

export interface ThreadParticipant {
  walletAddress: string;
  displayName: string;
  profilePicture?: string;
  isVerified: boolean;
  joinedAt: string;
  postCount: number;
}

export interface SocialNotification {
  id: string;
  type: 'mention' | 'reply' | 'reaction' | 'share' | 'thread_invite';
  fromUser: {
    walletAddress: string;
    displayName: string;
    profilePicture?: string;
  };
  targetId: string; // postId, commentId, or threadId
  targetType: 'post' | 'comment' | 'thread';
  message: string;
  isRead: boolean;
  createdAt: string;
}

