export interface PinnedPost {
  id: string;
  postId: string;
  userWallet: string;

  // Pin details
  pinnedAt: string;
  reason?: string;

  // Blockchain transaction
  transactionSignature: string;

  // Post preview
  post: {
    id: string;
    content: string;
    author: {
      wallet: string;
      username: string;
      displayName: string;
      avatar?: string;
    };
    createdAt: string;
    mediaPreview?: string;
    voteScore: number;
    quoteCount: number;
  };

  // Status
  isActive: boolean;
}

export interface PinningCapabilities {
  canPin: boolean;
  maxPins: number;
  currentPins: number;
  reason?: string;
}

export interface PinAction {
  type: 'pin' | 'unpin';
  postId: string;
  reason?: string;
}

export interface PinHistory {
  id: string;
  action: 'pinned' | 'unpinned';
  postId: string;
  postPreview: string;
  timestamp: string;
  transactionSignature: string;
}
