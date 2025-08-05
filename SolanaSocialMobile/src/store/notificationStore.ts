import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BaseNotification,
  NotificationGroup,
  NotificationPreferences,
  NotificationFilter,
  NotificationStats,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  FCMToken,
  NotificationEvent,
} from '@/types/notifications';

interface NotificationState {
  // Core state
  notifications: BaseNotification[];
  groups: NotificationGroup[];
  preferences: NotificationPreferences;
  fcmTokens: FCMToken[];

  // UI state
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Filter state
  activeFilter: NotificationFilter;
  filteredNotifications: BaseNotification[];

  // Permission state
  permissionStatus: 'not-determined' | 'denied' | 'authorized' | 'provisional';
  fcmToken: string | null;

  // Actions
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  refreshFCMToken: () => Promise<void>;

  // Notification management
  addNotification: (
    notification: Omit<BaseNotification, 'id' | 'timestamp'>,
  ) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Bulk operations
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  deleteMultiple: (notificationIds: string[]) => Promise<void>;

  // Grouping
  createGroup: (notifications: BaseNotification[]) => NotificationGroup;
  updateGroup: (groupId: string, notifications: BaseNotification[]) => void;
  disbandGroup: (groupId: string) => void;
  toggleGroupRead: (groupId: string) => Promise<void>;

  // Filtering
  setFilter: (filter: NotificationFilter) => void;
  clearFilter: () => void;
  applyFilter: () => void;

  // Preferences
  updatePreferences: (
    preferences: Partial<NotificationPreferences>,
  ) => Promise<void>;
  resetPreferences: () => Promise<void>;

  // Analytics
  getStats: () => NotificationStats;
  trackEvent: (event: NotificationEvent) => void;

  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
}

const STORAGE_KEYS = {
  NOTIFICATIONS: '@notifications',
  PREFERENCES: '@notification_preferences',
  FCM_TOKENS: '@fcm_tokens',
  STATS: '@notification_stats',
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  push: {
    enabled: true,
    sound: true,
    vibration: true,
    badge: true,
    lockScreen: true,
    priority: 'normal',
  },
  inApp: {
    enabled: true,
    banner: true,
    popover: true,
    sound: false,
  },
  email: {
    enabled: false,
    frequency: 'daily',
    digest: true,
  },
  categories: {
    social: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      doNotDisturb: false,
    },
    financial: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'high',
      doNotDisturb: false,
    },
    system: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'high',
      doNotDisturb: true,
    },
    moderation: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'urgent',
      doNotDisturb: true,
    },
  },
  types: {
    post_like: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'low',
      grouping: true,
      frequency: 'batched',
      batchInterval: 15,
    },
    post_comment: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      grouping: true,
      frequency: 'instant',
    },
    post_share: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      grouping: true,
      frequency: 'instant',
    },
    comment_reply: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      grouping: false,
      frequency: 'instant',
    },
    comment_like: {
      enabled: true,
      deliveryMethods: ['in_app'],
      priority: 'low',
      grouping: true,
      frequency: 'batched',
      batchInterval: 30,
    },
    user_follow: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      grouping: true,
      frequency: 'instant',
    },
    user_mention: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'high',
      grouping: false,
      frequency: 'instant',
    },
    user_tip: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'high',
      grouping: false,
      frequency: 'instant',
    },
    user_vote: {
      enabled: true,
      deliveryMethods: ['in_app'],
      priority: 'low',
      grouping: true,
      frequency: 'batched',
      batchInterval: 60,
    },
    brand_follow: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      grouping: true,
      frequency: 'instant',
    },
    brand_post: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'normal',
      grouping: false,
      frequency: 'instant',
    },
    auction_bid: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'high',
      grouping: false,
      frequency: 'instant',
    },
    auction_won: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'urgent',
      grouping: false,
      frequency: 'instant',
    },
    auction_outbid: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'high',
      grouping: false,
      frequency: 'instant',
    },
    auction_ended: {
      enabled: true,
      deliveryMethods: ['push', 'in_app'],
      priority: 'high',
      grouping: false,
      frequency: 'instant',
    },
    system_announcement: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'high',
      grouping: false,
      frequency: 'instant',
    },
    system_update: {
      enabled: true,
      deliveryMethods: ['in_app'],
      priority: 'normal',
      grouping: false,
      frequency: 'instant',
    },
    moderation_warning: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'urgent',
      grouping: false,
      frequency: 'instant',
    },
    moderation_action: {
      enabled: true,
      deliveryMethods: ['push', 'in_app', 'email'],
      priority: 'urgent',
      grouping: false,
      frequency: 'instant',
    },
  },
  grouping: {
    enabled: true,
    maxGroupSize: 10,
    timeWindow: 60,
  },
  frequency: {
    maxPerHour: 20,
    maxPerDay: 100,
    cooldownPeriod: 5,
  },
  adaptiveDelivery: {
    enabled: true,
    quietHours: true,
    activityBased: true,
    locationBased: false,
  },
};

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    notifications: [],
    groups: [],
    preferences: DEFAULT_PREFERENCES,
    fcmTokens: [],
    unreadCount: 0,
    loading: false,
    refreshing: false,
    error: null,
    activeFilter: {},
    filteredNotifications: [],
    permissionStatus: 'not-determined',
    fcmToken: null,

    // Initialize store
    initialize: async () => {
      try {
        set({loading: true, error: null});

        // Load persisted data
        await get().loadFromStorage();

        // Request permissions if not determined
        if (get().permissionStatus === 'not-determined') {
          await get().requestPermissions();
        }

        // Refresh FCM token
        await get().refreshFCMToken();

        // Apply current filter
        get().applyFilter();

        // Update unread count
        const unreadCount = get().notifications.filter(n => !n.read).length;
        set({unreadCount});
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        set({error: 'Failed to initialize notifications'});
      } finally {
        set({loading: false});
      }
    },

    // Request permissions
    requestPermissions: async () => {
      try {
        // This would integrate with @react-native-firebase/messaging
        // For now, we'll simulate the permission request

        // In a real implementation:
        // import messaging from '@react-native-firebase/messaging';
        // const authStatus = await messaging().requestPermission();
        // const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        //                 authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        // Simulate permission granted
        set({permissionStatus: 'authorized'});
        return true;
      } catch (error) {
        console.error('Failed to request permissions:', error);
        set({permissionStatus: 'denied'});
        return false;
      }
    },

    // Refresh FCM token
    refreshFCMToken: async () => {
      try {
        if (get().permissionStatus !== 'authorized') {
          return;
        }

        // This would integrate with FCM
        // const token = await messaging().getToken();

        // Simulate token
        const token = `fcm_token_${Date.now()}`;
        set({fcmToken: token});

        // Update token in storage
        await get().saveToStorage();
      } catch (error) {
        console.error('Failed to refresh FCM token:', error);
      }
    },

    // Add notification
    addNotification: notification => {
      const newNotification: BaseNotification = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        timestamp: Date.now(),
      };

      set(state => {
        const notifications = [newNotification, ...state.notifications];
        const unreadCount = notifications.filter(n => !n.read).length;

        return {
          notifications,
          unreadCount,
        };
      });

      // Apply grouping if enabled
      const {preferences} = get();
      if (preferences.grouping.enabled && newNotification.groupKey) {
        get().updateGroup(newNotification.groupKey, [newNotification]);
      }

      // Save to storage
      get().saveToStorage();

      // Apply current filter
      get().applyFilter();
    },

    // Mark as read
    markAsRead: async notificationId => {
      set(state => {
        const notifications = state.notifications.map(n =>
          n.id === notificationId ? {...n, read: true} : n,
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return {notifications, unreadCount};
      });

      await get().saveToStorage();
      get().applyFilter();
    },

    // Mark all as read
    markAllAsRead: async () => {
      set(state => ({
        notifications: state.notifications.map(n => ({...n, read: true})),
        unreadCount: 0,
      }));

      await get().saveToStorage();
      get().applyFilter();
    },

    // Dismiss notification
    dismissNotification: async notificationId => {
      set(state => {
        const notifications = state.notifications.map(n =>
          n.id === notificationId ? {...n, dismissed: true} : n,
        );
        return {notifications};
      });

      await get().saveToStorage();
      get().applyFilter();
    },

    // Delete notification
    deleteNotification: async notificationId => {
      set(state => {
        const notifications = state.notifications.filter(
          n => n.id !== notificationId,
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return {notifications, unreadCount};
      });

      await get().saveToStorage();
      get().applyFilter();
    },

    // Clear all notifications
    clearAll: async () => {
      set({notifications: [], groups: [], unreadCount: 0});
      await get().saveToStorage();
      get().applyFilter();
    },

    // Bulk operations
    markMultipleAsRead: async notificationIds => {
      set(state => {
        const notifications = state.notifications.map(n =>
          notificationIds.includes(n.id) ? {...n, read: true} : n,
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return {notifications, unreadCount};
      });

      await get().saveToStorage();
      get().applyFilter();
    },

    deleteMultiple: async notificationIds => {
      set(state => {
        const notifications = state.notifications.filter(
          n => !notificationIds.includes(n.id),
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return {notifications, unreadCount};
      });

      await get().saveToStorage();
      get().applyFilter();
    },

    // Group management
    createGroup: notifications => {
      const groupId = `group_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const group: NotificationGroup = {
        id: groupId,
        key: notifications[0]?.groupKey || groupId,
        type: notifications[0]?.type || 'post_like',
        category: notifications[0]?.category || 'social',
        title: `${notifications.length} ${notifications[0]?.type.replace(
          '_',
          ' ',
        )}s`,
        summary: `You have ${
          notifications.length
        } new ${notifications[0]?.type.replace('_', ' ')}s`,
        notifications,
        count: notifications.length,
        read: notifications.every(n => n.read),
        dismissed: false,
        timestamp: Math.max(...notifications.map(n => n.timestamp)),
        updatedAt: Date.now(),
      };

      set(state => ({
        groups: [...state.groups, group],
      }));

      return group;
    },

    updateGroup: (groupId, notifications) => {
      set(state => ({
        groups: state.groups.map(group =>
          group.id === groupId
            ? {
                ...group,
                notifications: [...group.notifications, ...notifications],
                count: group.count + notifications.length,
                updatedAt: Date.now(),
              }
            : group,
        ),
      }));
    },

    disbandGroup: groupId => {
      set(state => ({
        groups: state.groups.filter(group => group.id !== groupId),
      }));
    },

    toggleGroupRead: async groupId => {
      const group = get().groups.find(g => g.id === groupId);
      if (!group) {
        return;
      }

      const shouldMarkAsRead = !group.read;
      const notificationIds = group.notifications.map(n => n.id);

      if (shouldMarkAsRead) {
        await get().markMultipleAsRead(notificationIds);
      }

      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId ? {...g, read: shouldMarkAsRead} : g,
        ),
      }));
    },

    // Filtering
    setFilter: filter => {
      set({activeFilter: filter});
      get().applyFilter();
    },

    clearFilter: () => {
      set({activeFilter: {}});
      get().applyFilter();
    },

    applyFilter: () => {
      const {notifications, activeFilter} = get();

      let filtered = [...notifications];

      // Apply filters
      if (activeFilter.category?.length) {
        filtered = filtered.filter(n =>
          activeFilter.category!.includes(n.category),
        );
      }

      if (activeFilter.type?.length) {
        filtered = filtered.filter(n => activeFilter.type!.includes(n.type));
      }

      if (activeFilter.read !== undefined) {
        filtered = filtered.filter(n => n.read === activeFilter.read);
      }

      if (activeFilter.dismissed !== undefined) {
        filtered = filtered.filter(n => n.dismissed === activeFilter.dismissed);
      }

      if (activeFilter.priority?.length) {
        filtered = filtered.filter(n =>
          activeFilter.priority!.includes(n.priority),
        );
      }

      if (activeFilter.startDate) {
        filtered = filtered.filter(n => n.timestamp >= activeFilter.startDate!);
      }

      if (activeFilter.endDate) {
        filtered = filtered.filter(n => n.timestamp <= activeFilter.endDate!);
      }

      if (activeFilter.senderId?.length) {
        filtered = filtered.filter(
          n => n.senderId && activeFilter.senderId!.includes(n.senderId),
        );
      }

      if (activeFilter.hasMedia !== undefined) {
        filtered = filtered.filter(n =>
          activeFilter.hasMedia
            ? !!n.imageUrl || !!n.data.media
            : !n.imageUrl && !n.data.media,
        );
      }

      if (activeFilter.hasActions !== undefined) {
        filtered = filtered.filter(n =>
          activeFilter.hasActions
            ? !!n.data.actions?.length
            : !n.data.actions?.length,
        );
      }

      // Sort
      const sortBy = activeFilter.sortBy || 'timestamp';
      const sortOrder = activeFilter.sortOrder || 'desc';

      filtered.sort((a, b) => {
        let aVal: any = a[sortBy as keyof BaseNotification];
        let bVal: any = b[sortBy as keyof BaseNotification];

        if (sortBy === 'read') {
          aVal = a.read ? 1 : 0;
          bVal = b.read ? 1 : 0;
        }

        if (sortOrder === 'desc') {
          return bVal - aVal;
        } else {
          return aVal - bVal;
        }
      });

      // Pagination
      if (activeFilter.limit) {
        const offset = activeFilter.offset || 0;
        filtered = filtered.slice(offset, offset + activeFilter.limit);
      }

      set({filteredNotifications: filtered});
    },

    // Preferences
    updatePreferences: async preferences => {
      set(state => ({
        preferences: {...state.preferences, ...preferences},
      }));

      await get().saveToStorage();
    },

    resetPreferences: async () => {
      set({preferences: DEFAULT_PREFERENCES});
      await get().saveToStorage();
    },

    // Analytics
    getStats: () => {
      const {notifications} = get();
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = now - 7 * 24 * 60 * 60 * 1000;

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        today: notifications.filter(n => n.timestamp >= todayStart).length,
        thisWeek: notifications.filter(n => n.timestamp >= weekStart).length,

        byCategory: {
          social: {
            total: notifications.filter(n => n.category === 'social').length,
            unread: notifications.filter(
              n => n.category === 'social' && !n.read,
            ).length,
            delivered: notifications.filter(
              n => n.category === 'social' && n.delivered,
            ).length,
            clicked: notifications.filter(
              n => n.category === 'social' && n.clickedAt,
            ).length,
            dismissed: notifications.filter(
              n => n.category === 'social' && n.dismissed,
            ).length,
          },
          financial: {
            total: notifications.filter(n => n.category === 'financial').length,
            unread: notifications.filter(
              n => n.category === 'financial' && !n.read,
            ).length,
            delivered: notifications.filter(
              n => n.category === 'financial' && n.delivered,
            ).length,
            clicked: notifications.filter(
              n => n.category === 'financial' && n.clickedAt,
            ).length,
            dismissed: notifications.filter(
              n => n.category === 'financial' && n.dismissed,
            ).length,
          },
          system: {
            total: notifications.filter(n => n.category === 'system').length,
            unread: notifications.filter(
              n => n.category === 'system' && !n.read,
            ).length,
            delivered: notifications.filter(
              n => n.category === 'system' && n.delivered,
            ).length,
            clicked: notifications.filter(
              n => n.category === 'system' && n.clickedAt,
            ).length,
            dismissed: notifications.filter(
              n => n.category === 'system' && n.dismissed,
            ).length,
          },
          moderation: {
            total: notifications.filter(n => n.category === 'moderation')
              .length,
            unread: notifications.filter(
              n => n.category === 'moderation' && !n.read,
            ).length,
            delivered: notifications.filter(
              n => n.category === 'moderation' && n.delivered,
            ).length,
            clicked: notifications.filter(
              n => n.category === 'moderation' && n.clickedAt,
            ).length,
            dismissed: notifications.filter(
              n => n.category === 'moderation' && n.dismissed,
            ).length,
          },
        },

        byType: {} as any, // Would be populated with actual type stats

        engagement: {
          deliveryRate:
            notifications.filter(n => n.delivered).length /
            Math.max(notifications.length, 1),
          openRate:
            notifications.filter(n => n.read).length /
            Math.max(notifications.length, 1),
          clickRate:
            notifications.filter(n => n.clickedAt).length /
            Math.max(notifications.length, 1),
          dismissalRate:
            notifications.filter(n => n.dismissed).length /
            Math.max(notifications.length, 1),
        },
      };

      return stats;
    },

    trackEvent: event => {
      const {notifications} = get();

      // Update notification with event data
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === event.notificationId
            ? {
                ...n,
                interacted: true,
                clickedAt:
                  event.type === 'notification_clicked'
                    ? event.timestamp
                    : n.clickedAt,
                read: event.type === 'notification_read' ? true : n.read,
                dismissed:
                  event.type === 'notification_dismissed' ? true : n.dismissed,
              }
            : n,
        ),
      }));

      // Save to storage
      get().saveToStorage();
    },


    // Persistence
    saveToStorage: async () => {
      try {
        const {notifications, preferences, fcmTokens} = get();

        await Promise.all([
          AsyncStorage.setItem(
            STORAGE_KEYS.NOTIFICATIONS,
            JSON.stringify(notifications),
          ),
          AsyncStorage.setItem(
            STORAGE_KEYS.PREFERENCES,
            JSON.stringify(preferences),
          ),
          AsyncStorage.setItem(
            STORAGE_KEYS.FCM_TOKENS,
            JSON.stringify(fcmTokens),
          ),
        ]);
      } catch (error) {
        console.error('Failed to save notifications to storage:', error);
      }
    },

    loadFromStorage: async () => {
      try {
        const [notificationsData, preferencesData, fcmTokensData] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
            AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES),
            AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKENS),
          ]);

        if (notificationsData) {
          const notifications = JSON.parse(notificationsData);
          const unreadCount = notifications.filter(
            (n: BaseNotification) => !n.read,
          ).length;
          set({notifications, unreadCount});
        }

        if (preferencesData) {
          const preferences = JSON.parse(preferencesData);
          set({preferences: {...DEFAULT_PREFERENCES, ...preferences}});
        }

        if (fcmTokensData) {
          const fcmTokens = JSON.parse(fcmTokensData);
          set({fcmTokens});
        }
      } catch (error) {
        console.error('Failed to load notifications from storage:', error);
      }
    },

    clearStorage: async () => {
      try {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS),
          AsyncStorage.removeItem(STORAGE_KEYS.PREFERENCES),
          AsyncStorage.removeItem(STORAGE_KEYS.FCM_TOKENS),
          AsyncStorage.removeItem(STORAGE_KEYS.STATS),
        ]);
      } catch (error) {
        console.error('Failed to clear notification storage:', error);
      }
    },
  })),
);

// Initialize store when imported
useNotificationStore.getState().initialize();
