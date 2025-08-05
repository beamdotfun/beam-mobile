export interface ActivityNotificationSystem {
  // User notifications
  notifications: ActivityNotification[];
  notificationSettings: NotificationSettings;

  // Live activity feeds
  liveActivityFeed: LiveActivityItem[];
  personalActivityFeed: PersonalActivityItem[];

  // Real-time subscriptions
  activeSubscriptions: NotificationSubscription[];

  // Analytics
  notificationStats: NotificationStats;
}

export interface ActivityNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;

  // Content
  title: string;
  message: string;
  actionText?: string;

  // Context
  relatedUserId?: string;
  relatedUserName?: string;
  relatedUserAvatar?: string;
  relatedContentId?: string;
  relatedContentType?: ContentType;

  // Timing
  createdAt: string;
  expiresAt?: string;

  // Interaction
  read: boolean;
  interacted: boolean;
  dismissed: boolean;

  // Navigation
  deepLink?: string;
  actionData?: any;

  // Visual
  icon?: string;
  image?: string;
  color?: string;

  // Grouping
  groupKey?: string;
  groupCount?: number;
}

export type NotificationType =
  | 'new_follower'
  | 'post_liked'
  | 'post_commented'
  | 'post_shared'
  | 'mention'
  | 'tip_received'
  | 'tip_sent'
  | 'vote_received'
  | 'verification_complete'
  | 'moderation_reward'
  | 'platform_update'
  | 'social_milestone'
  | 'trending_post'
  | 'friend_activity';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ContentType = 'post' | 'comment' | 'profile' | 'tip' | 'vote';

export interface LiveActivityItem {
  id: string;
  activityType: ActivityType;

  // User involved
  userId: string;
  userName: string;
  userAvatar?: string;
  userVerified: boolean;

  // Activity details
  action: string;
  description: string;

  // Content involved
  contentId?: string;
  contentType?: ContentType;
  contentPreview?: string;

  // Timing
  timestamp: string;
  relativeTime: string;

  // Engagement
  isRelevantToUser: boolean;
  userCanInteract: boolean;

  // Visual
  activityIcon: string;
  activityColor: string;
}

export type ActivityType =
  | 'post_created'
  | 'post_voted'
  | 'user_tipped'
  | 'user_followed'
  | 'achievement_earned'
  | 'verification_completed'
  | 'milestone_reached'
  | 'platform_joined';

export interface PersonalActivityItem {
  id: string;
  type: PersonalActivityType;

  // Activity summary
  title: string;
  description: string;
  summary: string;

  // Related data
  relatedItems: RelatedItem[];

  // Metrics
  metrics: ActivityMetrics;

  // Timing
  occurredAt: string;
  periodStart?: string;
  periodEnd?: string;

  // User engagement
  requiresAction: boolean;
  actionItems: ActionItem[];

  // Visual presentation
  icon: string;
  color: string;
  importance: 'low' | 'medium' | 'high';
}

export type PersonalActivityType =
  | 'engagement_summary'
  | 'daily_activity'
  | 'weekly_recap'
  | 'achievement_unlocked'
  | 'goal_progress'
  | 'social_growth'
  | 'content_performance';

export interface RelatedItem {
  id: string;
  type: ContentType;
  title: string;
  preview?: string;
  metrics?: any;
}

export interface ActivityMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  tips?: number;
  followers?: number;
  engagement?: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  actionType: 'navigate' | 'create' | 'interact' | 'share';
  actionData: any;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationSubscription {
  id: string;
  type: SubscriptionType;

  // Subscription details
  target: string; // user ID, content ID, etc.
  targetType: 'user' | 'content' | 'topic' | 'hashtag';

  // Settings
  enabled: boolean;
  frequency: SubscriptionFrequency;
  delivery: DeliveryMethod[];

  // Filters
  filters: NotificationFilter[];

  // Status
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export type SubscriptionType =
  | 'user_activity'
  | 'content_updates'
  | 'topic_activity'
  | 'trending_content'
  | 'platform_updates';

export type SubscriptionFrequency = 'instant' | 'hourly' | 'daily' | 'weekly';
export type DeliveryMethod = 'push' | 'in_app' | 'badge';

export interface NotificationFilter {
  type: 'user_verified' | 'min_engagement' | 'content_type' | 'time_window';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface NotificationSettings {
  // Global settings
  globalEnabled: boolean;
  doNotDisturbEnabled: boolean;
  doNotDisturbSchedule?: DoNotDisturbSchedule;

  // Delivery preferences
  pushNotifications: boolean;
  badgeNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;

  // Content preferences
  typeSettings: NotificationTypeSettings[];

  // Timing preferences
  quietHours: QuietHours;
  batchNotifications: boolean;
  maxNotificationsPerHour: number;

  // Privacy
  showPreviewInLockScreen: boolean;
  showSenderInPreview: boolean;

  // Grouping
  groupSimilarNotifications: boolean;
  maxGroupSize: number;
}

export interface DoNotDisturbSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[]; // ["monday", "tuesday", etc.]
  allowUrgent: boolean;
}

export interface NotificationTypeSettings {
  type: NotificationType;
  enabled: boolean;
  priority: NotificationPriority;
  deliveryMethods: DeliveryMethod[];
  soundEnabled: boolean;
  groupingEnabled: boolean;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  allowHighPriority: boolean;
  allowFollowers: boolean;
}

export interface NotificationStats {
  // Delivery stats
  totalSent: number;
  totalReceived: number;
  totalRead: number;
  totalInteracted: number;

  // Engagement metrics
  readRate: number;
  interactionRate: number;
  dismissalRate: number;

  // Type breakdown
  typeBreakdown: TypeStats[];

  // Time patterns
  activeHours: HourlyStats[];
  peakEngagementTime: string;

  // Effectiveness
  actionConversionRate: number;
  notificationSatisfaction: number;
}

export interface TypeStats {
  type: NotificationType;
  count: number;
  readRate: number;
  interactionRate: number;
  averageTimeToRead: number;
}

export interface HourlyStats {
  hour: number;
  count: number;
  readRate: number;
  interactionRate: number;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;

  // Group details
  title: string;
  summary: string;
  count: number;

  // Latest notification
  latestNotification: ActivityNotification;
  previewNotifications: ActivityNotification[];

  // Timing
  createdAt: string;
  lastUpdated: string;

  // User interaction
  read: boolean;
  expanded: boolean;

  // Actions
  groupActions: GroupAction[];
}

export interface GroupAction {
  id: string;
  title: string;
  description: string;
  actionType: 'mark_all_read' | 'dismiss_all' | 'navigate_to_source';
  actionData?: any;
}

export interface NotificationPreferences {
  // Content filtering
  minimumUserReputation: number;
  verifiedUsersOnly: boolean;
  followersOnly: boolean;

  // Content types
  allowedContentTypes: ContentType[];
  blockedKeywords: string[];
  allowedLanguages: string[];

  // Engagement thresholds
  minimumTipAmount: number;
  minimumPostLikes: number;
  minimumFollowerCount: number;

  // Frequency controls
  maxDailyNotifications: number;
  batchSimilarNotifications: boolean;
  delayNonUrgentNotifications: boolean;
}

export interface RealTimeActivityFeed {
  // Feed configuration
  feedId: string;
  feedType: 'global' | 'following' | 'personalized';

  // Current state
  items: LiveActivityItem[];
  hasMore: boolean;
  isLive: boolean;

  // Real-time status
  connectedUsers: number;
  updatesPerMinute: number;
  lastUpdate: string;

  // Filters
  activeFilters: FeedFilter[];
  availableFilters: FeedFilterOption[];

  // User preferences
  autoRefresh: boolean;
  showNotifications: boolean;
  soundEnabled: boolean;
}

export interface FeedFilter {
  type: 'user' | 'content_type' | 'activity_type' | 'time_range';
  value: any;
  label: string;
}

export interface FeedFilterOption {
  type: string;
  label: string;
  options: FilterOption[];
}

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
  enabled: boolean;
}
