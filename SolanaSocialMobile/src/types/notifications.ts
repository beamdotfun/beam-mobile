export type NotificationType =
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'comment_reply'
  | 'comment_like'
  | 'user_follow'
  | 'user_mention'
  | 'user_tip'
  | 'user_vote'
  | 'brand_follow'
  | 'brand_post'
  | 'auction_bid'
  | 'auction_won'
  | 'auction_outbid'
  | 'auction_ended'
  | 'system_announcement'
  | 'system_update'
  | 'moderation_warning'
  | 'moderation_action';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationCategory =
  | 'social'
  | 'financial'
  | 'system'
  | 'moderation';
export type NotificationDeliveryMethod = 'push' | 'in_app' | 'email' | 'sms';

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
  foreground?: boolean;
  input?: boolean;
  inputPlaceholder?: string;
}

export interface NotificationMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
}

export interface NotificationData {
  // Core notification data
  postId?: string;
  commentId?: string;
  userId?: string;
  userWallet?: string;
  brandId?: string;
  auctionId?: string;
  tipAmount?: number;
  voteType?: 'upvote' | 'downvote';

  // Navigation data
  screen?: string;
  params?: Record<string, any>;

  // Rich content
  media?: NotificationMedia;
  actions?: NotificationAction[];

  // Metadata
  groupId?: string;
  threadId?: string;
  campaignId?: string;
}

export interface BaseNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content
  title: string;
  body: string;
  subtitle?: string;
  imageUrl?: string;

  // Sender information
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;

  // Metadata
  data: NotificationData;
  timestamp: number;

  // State
  read: boolean;
  dismissed: boolean;
  interacted: boolean;

  // Delivery
  deliveryMethods: NotificationDeliveryMethod[];

  // Grouping
  groupKey?: string;
  summary?: string;

  // Scheduling
  scheduledFor?: number;
  expiresAt?: number;

  // Tracking
  delivered?: boolean;
  deliveredAt?: number;
  clickedAt?: number;
  fcmMessageId?: string;
}

export interface NotificationGroup {
  id: string;
  key: string;
  type: NotificationType;
  category: NotificationCategory;

  // Content
  title: string;
  summary: string;

  // Notifications in group
  notifications: BaseNotification[];
  count: number;

  // State
  read: boolean;
  dismissed: boolean;

  // Metadata
  timestamp: number;
  updatedAt: number;
}

export interface NotificationPreferences {
  // Global settings
  enabled: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
    days: number[]; // 0-6 (Sunday-Saturday)
  };

  // Delivery methods
  push: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    badge: boolean;
    lockScreen: boolean;
    priority: NotificationPriority;
  };

  inApp: {
    enabled: boolean;
    banner: boolean;
    popover: boolean;
    sound: boolean;
  };

  email: {
    enabled: boolean;
    frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
    digest: boolean;
  };

  // Category preferences
  categories: {
    [K in NotificationCategory]: {
      enabled: boolean;
      deliveryMethods: NotificationDeliveryMethod[];
      priority: NotificationPriority;
      doNotDisturb: boolean;
    };
  };

  // Type-specific preferences
  types: {
    [K in NotificationType]: {
      enabled: boolean;
      deliveryMethods: NotificationDeliveryMethod[];
      priority: NotificationPriority;
      grouping: boolean;
      frequency?: 'instant' | 'batched';
      batchInterval?: number; // minutes
    };
  };

  // Advanced settings
  grouping: {
    enabled: boolean;
    maxGroupSize: number;
    timeWindow: number; // minutes
  };

  frequency: {
    maxPerHour: number;
    maxPerDay: number;
    cooldownPeriod: number; // minutes
  };

  // Smart delivery
  adaptiveDelivery: {
    enabled: boolean;
    quietHours: boolean;
    activityBased: boolean;
    locationBased: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  category: NotificationCategory;

  // Template content
  titleTemplate: string;
  bodyTemplate: string;
  subtitleTemplate?: string;

  // Default settings
  priority: NotificationPriority;
  deliveryMethods: NotificationDeliveryMethod[];
  actions?: NotificationAction[];

  // Grouping
  groupable: boolean;
  groupKey?: string;

  // Scheduling
  delay?: number; // minutes
  cooldown?: number; // minutes

  // Conditions
  conditions?: {
    userActivity?: 'active' | 'idle' | 'away';
    timeOfDay?: {start: string; end: string};
    dayOfWeek?: number[];
    deviceState?: 'online' | 'offline';
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;

  byCategory: {
    [K in NotificationCategory]: {
      total: number;
      unread: number;
      delivered: number;
      clicked: number;
      dismissed: number;
    };
  };

  byType: {
    [K in NotificationType]: {
      total: number;
      unread: number;
      delivered: number;
      clicked: number;
      dismissed: number;
    };
  };

  engagement: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    dismissalRate: number;
  };
}

export interface NotificationFilter {
  category?: NotificationCategory[];
  type?: NotificationType[];
  read?: boolean;
  dismissed?: boolean;
  priority?: NotificationPriority[];

  // Time filters
  startDate?: number;
  endDate?: number;

  // Sender filters
  senderId?: string[];

  // Content filters
  hasMedia?: boolean;
  hasActions?: boolean;

  // Grouping
  grouped?: boolean;
  groupKey?: string;

  // Pagination
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'priority' | 'read';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationBatch {
  id: string;
  notifications: BaseNotification[];
  scheduledFor: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';

  // Delivery stats
  totalRecipients: number;
  delivered: number;
  failed: number;

  // Error tracking
  errors?: {
    code: string;
    message: string;
    notificationIds: string[];
  }[];

  // Metadata
  createdAt: number;
  sentAt?: number;
  completedAt?: number;
}

// FCM specific types
export interface FCMMessage {
  messageId: string;
  from: string;
  to?: string;
  collapse_key?: string;
  notification?: {
    title?: string;
    body?: string;
    image?: string;
    sound?: string;
    tag?: string;
    color?: string;
    click_action?: string;
  };
  data?: Record<string, string>;
  priority?: 'normal' | 'high';
  ttl?: number;
}

export interface FCMToken {
  token: string;
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
  userId: string;
  deviceId: string;

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;

  // State
  active: boolean;
  validated: boolean;
}

// WebSocket notification events
export interface NotificationEvent {
  type:
    | 'notification_received'
    | 'notification_read'
    | 'notification_dismissed'
    | 'notification_clicked';
  notificationId: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface NotificationSubscription {
  userId: string;
  fcmTokens: FCMToken[];
  preferences: NotificationPreferences;

  // Subscription state
  active: boolean;
  paused: boolean;
  pausedUntil?: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastActivity?: number;
}
