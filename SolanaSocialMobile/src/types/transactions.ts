export interface Transaction {
  id: string;
  signature: string;
  type: TransactionType;
  status: TransactionStatus;

  // Blockchain data
  slot: number;
  blockTime: number;
  fee: number; // lamports

  // User context
  fromWallet: string;
  toWallet?: string;

  // Transaction details
  amount?: number; // SOL amount for tips/bids
  data?: TransactionData;

  // UI metadata
  title: string;
  description: string;
  icon: string;

  // Timestamps
  createdAt: string;
  confirmedAt?: string;
}

export type TransactionType =
  | 'initialize_user'
  | 'update_profile'
  | 'create_post'
  | 'create_vote'
  | 'send_tip'
  | 'create_brand'
  | 'update_brand'
  | 'create_bid'
  | 'claim_payout'
  | 'create_report';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'expired';

export interface TransactionData {
  // Post data
  postContent?: string;
  postId?: string;

  // Vote data
  targetUser?: string;
  voteType?: 'upvote' | 'downvote';

  // Tip data
  recipientUser?: string;
  tipMessage?: string;

  // Brand data
  brandName?: string;
  brandId?: string;

  // Auction data
  groupId?: string;
  bidAmount?: number;
  auctionEndSlot?: number;
}

export interface TransactionFilter {
  types?: TransactionType[];
  status?: TransactionStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalFees: number; // SOL

  byType: Record<TransactionType, number>;
  byStatus: Record<TransactionStatus, number>;

  // Specific stats
  totalTipsSent: number;
  totalTipsReceived: number;
  totalVotesCast: number;
  totalPostsCreated: number;
  totalBidsPlaced: number;
}

// API response types
export interface TransactionResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    stats: TransactionStats;
    hasMore: boolean;
    page: number;
    totalPages: number;
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  message: string;
  data: Transaction;
}

export interface ExportTransactionResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    filename: string;
    format: 'csv' | 'json';
  };
}

// Constants for transaction type metadata
export const TRANSACTION_TYPE_METADATA: Record<
  TransactionType,
  {
    label: string;
    icon: string;
    color: string;
    description: string;
  }
> = {
  initialize_user: {
    label: 'Initialize Account',
    icon: 'user-plus',
    color: 'text-blue-500',
    description: 'Account initialization on Solana',
  },
  update_profile: {
    label: 'Update Profile',
    icon: 'edit',
    color: 'text-blue-500',
    description: 'Profile information update',
  },
  create_post: {
    label: 'Create Post',
    icon: 'message-square',
    color: 'text-green-500',
    description: 'New post created on blockchain',
  },
  create_vote: {
    label: 'Cast Vote',
    icon: 'thumbs-up',
    color: 'text-purple-500',
    description: 'Vote cast on another user',
  },
  send_tip: {
    label: 'Send Tip',
    icon: 'dollar-sign',
    color: 'text-yellow-500',
    description: 'SOL tip sent to user',
  },
  create_brand: {
    label: 'Create Brand',
    icon: 'building',
    color: 'text-orange-500',
    description: 'New brand created',
  },
  update_brand: {
    label: 'Update Brand',
    icon: 'edit-3',
    color: 'text-orange-500',
    description: 'Brand information updated',
  },
  create_bid: {
    label: 'Place Bid',
    icon: 'gavel',
    color: 'text-red-500',
    description: 'Auction bid placed',
  },
  claim_payout: {
    label: 'Claim Payout',
    icon: 'coins',
    color: 'text-green-600',
    description: 'Earnings claimed from platform',
  },
  create_report: {
    label: 'Submit Report',
    icon: 'flag',
    color: 'text-red-600',
    description: 'Content report submitted',
  },
};

export const TRANSACTION_STATUS_COLORS: Record<
  TransactionStatus,
  {
    bg: string;
    text: string;
    badge: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    badge: 'secondary',
  },
  confirmed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'default',
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    badge: 'destructive',
  },
  expired: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    badge: 'outline',
  },
};

// Date range presets for filtering
export const DATE_PRESETS = {
  today: {label: 'Today', days: 1},
  week: {label: 'Last 7 days', days: 7},
  month: {label: 'Last 30 days', days: 30},
  quarter: {label: 'Last 90 days', days: 90},
  year: {label: 'Last year', days: 365},
  all: {label: 'All time', days: null},
} as const;

export type DatePreset = keyof typeof DATE_PRESETS;
