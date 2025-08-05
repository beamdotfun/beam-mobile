import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityNotificationSystem,
  ActivityNotification,
  NotificationSettings,
  LiveActivityItem,
  NotificationSubscription,
  SubscriptionType,
  NotificationFilter,
  NotificationTypeSettings,
  QuietHours,
  NotificationType,
} from '../types/activity-notifications';
import {analyticsService} from '../services/analytics/analyticsService';
import {API_CONFIG} from '../config/api';

// Use centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface ActivityNotificationStore {
  // State
  notificationSystem: ActivityNotificationSystem | null;
  unreadCount: number;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Cache management
  lastFetchTime: number;
  cacheExpiration: number; // 2 minutes

  // Notification management
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  interactWithNotification: (
    notificationId: string,
    action: string,
  ) => Promise<void>;

  // Live activity feed
  fetchLiveActivity: () => Promise<void>;
  subscribeTo: (
    subscription: Partial<NotificationSubscription>,
  ) => Promise<void>;
  unsubscribeFrom: (subscriptionId: string) => Promise<void>;

  // Settings management
  updateNotificationSettings: (
    settings: Partial<NotificationSettings>,
  ) => Promise<void>;
  toggleNotificationType: (
    type: NotificationType,
    enabled: boolean,
  ) => Promise<void>;
  updateQuietHours: (quietHours: QuietHours) => Promise<void>;

  // Real-time connection
  connectToRealTime: () => void;
  disconnectFromRealTime: () => void;

  // Analytics
  fetchNotificationStats: () => Promise<void>;

  // UI state
  clearError: () => void;
  resetUnreadCount: () => void;
  clearCache: () => void;
}

export const useActivityNotificationStore = create<ActivityNotificationStore>()(
  persist(
    (set, get) => ({
      notificationSystem: null,
      unreadCount: 0,
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastFetchTime: 0,
      cacheExpiration: 2 * 60 * 1000, // 2 minutes

      fetchNotifications: async () => {
        const state = get();
        const now = Date.now();

        // Check cache validity
        if (
          state.notificationSystem &&
          now - state.lastFetchTime < state.cacheExpiration &&
          !state.isRefreshing
        ) {
          return;
        }

        set({isLoading: !state.isRefreshing, error: null});

        try {
          // Mock notification data
          const mockNotifications: ActivityNotification[] = [
            {
              id: 'notif-1',
              type: 'new_follower',
              priority: 'normal',
              title: 'New Follower',
              message: 'Alice started following you',
              relatedUserId: 'user-123',
              relatedUserName: 'alice',
              relatedUserAvatar: 'https://via.placeholder.com/50',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              read: false,
              interacted: false,
              dismissed: false,
              deepLink: '/profile/alice',
            },
            {
              id: 'notif-2',
              type: 'post_liked',
              priority: 'low',
              title: 'Post Liked',
              message: 'Bob liked your post',
              relatedUserId: 'user-456',
              relatedUserName: 'bob',
              relatedContentId: 'post-789',
              relatedContentType: 'post',
              createdAt: new Date(
                Date.now() - 2 * 60 * 60 * 1000,
              ).toISOString(),
              read: true,
              interacted: false,
              dismissed: false,
              deepLink: '/post/789',
            },
            {
              id: 'notif-3',
              type: 'tip_received',
              priority: 'high',
              title: 'Tip Received!',
              message: 'You received 0.05 SOL from Charlie',
              actionText: 'View Tip',
              relatedUserId: 'user-789',
              relatedUserName: 'charlie',
              createdAt: new Date(
                Date.now() - 5 * 60 * 60 * 1000,
              ).toISOString(),
              read: false,
              interacted: false,
              dismissed: false,
              deepLink: '/tips/received',
            },
          ];

          const mockSettings: NotificationSettings = {
            globalEnabled: true,
            doNotDisturbEnabled: false,
            pushNotifications: true,
            badgeNotifications: true,
            soundEnabled: true,
            vibrationEnabled: true,
            typeSettings: getDefaultTypeSettings(),
            quietHours: {
              enabled: false,
              startTime: '22:00',
              endTime: '08:00',
              allowHighPriority: true,
              allowFollowers: true,
            },
            batchNotifications: false,
            maxNotificationsPerHour: 20,
            showPreviewInLockScreen: true,
            showSenderInPreview: true,
            groupSimilarNotifications: true,
            maxGroupSize: 5,
          };

          const notificationSystem: ActivityNotificationSystem = {
            notifications: mockNotifications,
            notificationSettings: mockSettings,
            liveActivityFeed: [],
            personalActivityFeed: [],
            activeSubscriptions: [],
            notificationStats: {
              totalSent: 150,
              totalReceived: 145,
              totalRead: 120,
              totalInteracted: 45,
              readRate: 0.83,
              interactionRate: 0.31,
              dismissalRate: 0.05,
              typeBreakdown: [],
              activeHours: [],
              peakEngagementTime: '14:00',
              actionConversionRate: 0.65,
              notificationSatisfaction: 4.2,
            },
          };

          const unreadCount = mockNotifications.filter(n => !n.read).length;

          set({
            notificationSystem,
            unreadCount,
            isLoading: false,
            isRefreshing: false,
            lastFetchTime: now,
          });

          analyticsService.trackEvent('notifications_fetched', {
            count: mockNotifications.length,
            unread_count: unreadCount,
          });
        } catch (error) {
          set({
            isLoading: false,
            isRefreshing: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch notifications',
          });
        }
      },

      markAsRead: async notificationId => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 200));

          // Update local state
          set(state => {
            if (!state.notificationSystem) {
              return state;
            }

            const updatedNotifications =
              state.notificationSystem.notifications.map(n =>
                n.id === notificationId ? {...n, read: true} : n,
              );

            const unreadCount = updatedNotifications.filter(
              n => !n.read,
            ).length;

            return {
              notificationSystem: {
                ...state.notificationSystem,
                notifications: updatedNotifications,
              },
              unreadCount,
            };
          });

          analyticsService.trackEvent('notification_marked_read', {
            notification_id: notificationId,
          });
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      markAllAsRead: async () => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));

          // Update local state
          set(state => {
            if (!state.notificationSystem) {
              return state;
            }

            const updatedNotifications =
              state.notificationSystem.notifications.map(n => ({
                ...n,
                read: true,
              }));

            return {
              notificationSystem: {
                ...state.notificationSystem,
                notifications: updatedNotifications,
              },
              unreadCount: 0,
            };
          });

          analyticsService.trackEvent('all_notifications_marked_read', {});
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
        }
      },

      dismissNotification: async notificationId => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 200));

          // Remove from local state
          set(state => {
            if (!state.notificationSystem) {
              return state;
            }

            const updatedNotifications =
              state.notificationSystem.notifications.filter(
                n => n.id !== notificationId,
              );

            const unreadCount = updatedNotifications.filter(
              n => !n.read,
            ).length;

            return {
              notificationSystem: {
                ...state.notificationSystem,
                notifications: updatedNotifications,
              },
              unreadCount,
            };
          });

          analyticsService.trackEvent('notification_dismissed', {
            notification_id: notificationId,
          });
        } catch (error) {
          console.error('Failed to dismiss notification:', error);
        }
      },

      interactWithNotification: async (notificationId, action) => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 200));

          // Update interaction status
          set(state => {
            if (!state.notificationSystem) {
              return state;
            }

            const updatedNotifications =
              state.notificationSystem.notifications.map(n =>
                n.id === notificationId
                  ? {...n, interacted: true, read: true}
                  : n,
              );

            const unreadCount = updatedNotifications.filter(
              n => !n.read,
            ).length;

            return {
              notificationSystem: {
                ...state.notificationSystem,
                notifications: updatedNotifications,
              },
              unreadCount,
            };
          });

          analyticsService.trackEvent('notification_interacted', {
            notification_id: notificationId,
            action,
          });
        } catch (error) {
          console.error('Failed to interact with notification:', error);
        }
      },

      fetchLiveActivity: async () => {
        try {
          // Mock live activity data
          const mockLiveActivity: LiveActivityItem[] = [
            {
              id: 'activity-1',
              activityType: 'post_created',
              userId: 'user-111',
              userName: 'david',
              userAvatar: 'https://via.placeholder.com/50',
              userVerified: true,
              action: 'created a new post',
              description: 'Check out this amazing Solana project!',
              contentId: 'post-123',
              contentType: 'post',
              contentPreview: 'Just discovered an incredible DeFi protocol...',
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              relativeTime: '5m ago',
              isRelevantToUser: true,
              userCanInteract: true,
              activityIcon: '📝',
              activityColor: '#3B82F6',
            },
            {
              id: 'activity-2',
              activityType: 'user_followed',
              userId: 'user-222',
              userName: 'eve',
              userAvatar: 'https://via.placeholder.com/50',
              userVerified: false,
              action: 'started following',
              description: 'frank',
              timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              relativeTime: '10m ago',
              isRelevantToUser: false,
              userCanInteract: false,
              activityIcon: '👥',
              activityColor: '#10B981',
            },
          ];

          set(state => ({
            notificationSystem: state.notificationSystem
              ? {
                  ...state.notificationSystem,
                  liveActivityFeed: mockLiveActivity,
                }
              : null,
          }));
        } catch (error) {
          console.error('Failed to fetch live activity:', error);
        }
      },

      subscribeTo: async subscription => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));

          const newSubscription: NotificationSubscription = {
            id: `sub-${Date.now()}`,
            type: subscription.type || 'user_activity',
            target: subscription.target || '',
            targetType: subscription.targetType || 'user',
            enabled: true,
            frequency: subscription.frequency || 'instant',
            delivery: subscription.delivery || ['in_app', 'push'],
            filters: subscription.filters || [],
            createdAt: new Date().toISOString(),
            triggerCount: 0,
          };

          set(state => ({
            notificationSystem: state.notificationSystem
              ? {
                  ...state.notificationSystem,
                  activeSubscriptions: [
                    ...state.notificationSystem.activeSubscriptions,
                    newSubscription,
                  ],
                }
              : null,
          }));

          analyticsService.trackEvent('notification_subscription_created', {
            type: newSubscription.type,
            target_type: newSubscription.targetType,
          });
        } catch (error) {
          console.error('Failed to create subscription:', error);
          throw error;
        }
      },

      unsubscribeFrom: async subscriptionId => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 200));

          set(state => ({
            notificationSystem: state.notificationSystem
              ? {
                  ...state.notificationSystem,
                  activeSubscriptions:
                    state.notificationSystem.activeSubscriptions.filter(
                      s => s.id !== subscriptionId,
                    ),
                }
              : null,
          }));

          analyticsService.trackEvent('notification_subscription_removed', {
            subscription_id: subscriptionId,
          });
        } catch (error) {
          console.error('Failed to unsubscribe:', error);
          throw error;
        }
      },

      updateNotificationSettings: async settings => {
        set({isLoading: true, error: null});

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));

          set(state => ({
            notificationSystem: state.notificationSystem
              ? {
                  ...state.notificationSystem,
                  notificationSettings: {
                    ...state.notificationSystem.notificationSettings,
                    ...settings,
                  },
                }
              : null,
            isLoading: false,
          }));

          analyticsService.trackEvent('notification_settings_updated', {
            settings_changed: Object.keys(settings),
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update settings',
          });
          throw error;
        }
      },

      toggleNotificationType: async (type, enabled) => {
        try {
          // Update local settings
          set(state => {
            if (!state.notificationSystem) {
              return state;
            }

            const updatedTypeSettings =
              state.notificationSystem.notificationSettings.typeSettings.map(
                ts => (ts.type === type ? {...ts, enabled} : ts),
              );

            return {
              notificationSystem: {
                ...state.notificationSystem,
                notificationSettings: {
                  ...state.notificationSystem.notificationSettings,
                  typeSettings: updatedTypeSettings,
                },
              },
            };
          });

          analyticsService.trackEvent('notification_type_toggled', {
            type,
            enabled,
          });
        } catch (error) {
          console.error('Failed to toggle notification type:', error);
        }
      },

      updateQuietHours: async quietHours => {
        try {
          set(state => ({
            notificationSystem: state.notificationSystem
              ? {
                  ...state.notificationSystem,
                  notificationSettings: {
                    ...state.notificationSystem.notificationSettings,
                    quietHours,
                  },
                }
              : null,
          }));

          analyticsService.trackEvent('quiet_hours_updated', {
            enabled: quietHours.enabled,
            start: quietHours.startTime,
            end: quietHours.endTime,
          });
        } catch (error) {
          console.error('Failed to update quiet hours:', error);
        }
      },

      connectToRealTime: () => {
        // WebSocket connection for real-time notifications
        console.log('Connecting to real-time notifications');

        // In a real implementation, this would establish WebSocket connection
        // and set up event listeners for real-time updates

        analyticsService.trackEvent('realtime_notifications_connected', {});
      },

      disconnectFromRealTime: () => {
        // WebSocket disconnection
        console.log('Disconnecting from real-time notifications');

        // In a real implementation, this would close WebSocket connection

        analyticsService.trackEvent('realtime_notifications_disconnected', {});
      },

      fetchNotificationStats: async () => {
        try {
          // Mock stats data
          const mockStats = {
            totalSent: 250,
            totalReceived: 245,
            totalRead: 200,
            totalInteracted: 80,
            readRate: 0.82,
            interactionRate: 0.33,
            dismissalRate: 0.04,
            typeBreakdown: [
              {
                type: 'new_follower' as NotificationType,
                count: 50,
                readRate: 0.9,
                interactionRate: 0.6,
                averageTimeToRead: 300,
              },
              {
                type: 'post_liked' as NotificationType,
                count: 80,
                readRate: 0.85,
                interactionRate: 0.2,
                averageTimeToRead: 180,
              },
              {
                type: 'tip_received' as NotificationType,
                count: 20,
                readRate: 0.95,
                interactionRate: 0.85,
                averageTimeToRead: 120,
              },
            ],
            activeHours: Array.from({length: 24}, (_, hour) => ({
              hour,
              count: Math.floor(Math.random() * 20),
              readRate: 0.7 + Math.random() * 0.3,
              interactionRate: 0.2 + Math.random() * 0.3,
            })),
            peakEngagementTime: '14:00',
            actionConversionRate: 0.68,
            notificationSatisfaction: 4.3,
          };

          set(state => ({
            notificationSystem: state.notificationSystem
              ? {
                  ...state.notificationSystem,
                  notificationStats: mockStats,
                }
              : null,
          }));
        } catch (error) {
          console.error('Failed to fetch notification stats:', error);
        }
      },

      clearError: () => set({error: null}),
      resetUnreadCount: () => set({unreadCount: 0}),
      clearCache: () => set({lastFetchTime: 0}),
    }),
    {
      name: 'activity-notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        notificationSettings: state.notificationSystem?.notificationSettings,
        unreadCount: state.unreadCount,
        lastFetchTime: state.lastFetchTime,
      }),
    },
  ),
);

// Helper function to get auth token
function getAuthToken(): string {
  // In a real app, this would get the token from secure storage
  return 'mock-auth-token';
}

// Helper function to get default type settings
function getDefaultTypeSettings(): NotificationTypeSettings[] {
  const types: NotificationType[] = [
    'new_follower',
    'post_liked',
    'post_commented',
    'post_shared',
    'mention',
    'tip_received',
    'tip_sent',
    'vote_received',
    'verification_complete',
    'moderation_reward',
    'platform_update',
    'social_milestone',
    'trending_post',
    'friend_activity',
  ];

  return types.map(type => ({
    type,
    enabled: true,
    priority: type === 'tip_received' || type === 'mention' ? 'high' : 'normal',
    deliveryMethods: ['in_app', 'push'],
    soundEnabled: type === 'tip_received',
    groupingEnabled: type !== 'tip_received' && type !== 'mention',
  }));
}
