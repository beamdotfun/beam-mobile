// Event types from backend
export type EventType =
  | 'new_post'
  | 'post_updated'
  | 'post_deleted'
  | 'vote_cast'
  | 'vote_updated'
  | 'tip_sent'
  | 'tip_received'
  | 'user_followed'
  | 'user_unfollowed'
  | 'reputation_updated'
  | 'auction_created'
  | 'auction_updated'
  | 'bid_placed'
  | 'auction_ended'
  | 'brand_created'
  | 'brand_updated'
  | 'brand_activity'
  | 'notification'
  | 'user_online'
  | 'user_offline'
  | 'typing'
  | 'heartbeat';

export interface EventData {
  // Social events
  new_post: {
    post: any;
    userWallet: string;
  };
  post_updated: {
    postId: string;
    updates: any;
  };
  post_deleted: {
    postId: string;
    userWallet: string;
  };
  vote_cast: {
    voterWallet: string;
    targetWallet: string;
    voteType: 'upvote' | 'downvote';
    postId?: string;
  };
  vote_updated: {
    postId: string;
    upvoteCount: number;
    downvoteCount: number;
    voteScore: number;
  };
  tip_sent: {
    senderWallet: string;
    receiverWallet: string;
    amount: number;
    transactionHash: string;
    postId?: string;
  };
  tip_received: {
    postId: string;
    tipCount: number;
    totalTipAmount: number;
  };

  // Reputation events
  reputation_updated: {
    userWallet: string;
    oldReputation: number;
    newReputation: number;
    change: number;
    reason: 'vote' | 'tip' | 'post' | 'follow' | 'transaction';
    timestamp: string;
  };

  // Follow events
  user_followed: {
    followerWallet: string;
    followedWallet: string;
    followerName?: string;
    followerAvatar?: string;
  };
  user_unfollowed: {
    followerWallet: string;
    unfollowedWallet: string;
  };

  // Auction events
  auction_created: {
    auction: any;
    brandWallet: string;
  };
  auction_updated: {
    auctionId: string;
    updates: any;
  };
  bid_placed: {
    auctionId: string;
    bidderWallet: string;
    amount: number;
    timestamp: string;
  };
  auction_ended: {
    auctionId: string;
    winnerWallet?: string;
    finalAmount?: number;
  };

  // Brand events
  brand_created: {
    brand: any;
    ownerWallet: string;
  };
  brand_updated: {
    brandAddress: string;
    updates: any;
  };
  brand_activity: {
    brandAddress: string;
    activityType: string;
    data: any;
  };

  // Notification events
  notification: {
    type: 'tip' | 'vote' | 'follow' | 'mention' | 'auction' | 'brand';
    title: string;
    message: string;
    data?: any;
    userId: string;
  };

  // Presence events
  user_online: {
    userWallet: string;
    timestamp: string;
  };
  user_offline: {
    userWallet: string;
    lastSeen: string;
  };
  
  // Typing events
  typing: {
    chatId: string;
    userName: string;
    isTyping: boolean;
  };
  
  // Heartbeat event
  heartbeat: {
    timestamp: string;
  };
}

export interface RealtimeNotification {
  id: string;
  type: 'tip' | 'vote' | 'follow' | 'mention' | 'auction' | 'brand';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}