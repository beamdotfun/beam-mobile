import api from './client';
import {
  BaseNotification,
  NotificationPreferences,
  NotificationFilter,
  NotificationStats,
  FCMToken,
  NotificationBatch,
  NotificationSubscription,
} from '@/types/notifications';
import {ApiResponse} from './types';

export class NotificationAPIService {
  /**
   * Get user's notifications with filtering and pagination
   */
  async getNotifications(filter?: NotificationFilter): Promise<{
    notifications: BaseNotification[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();

    if (filter?.category?.length) {
      params.append('category', filter.category.join(','));
    }
    if (filter?.type?.length) {
      params.append('type', filter.type.join(','));
    }
    if (filter?.read !== undefined) {
      params.append('read', filter.read.toString());
    }
    if (filter?.dismissed !== undefined) {
      params.append('dismissed', filter.dismissed.toString());
    }
    if (filter?.priority?.length) {
      params.append('priority', filter.priority.join(','));
    }
    if (filter?.startDate) {
      params.append('startDate', filter.startDate.toString());
    }
    if (filter?.endDate) {
      params.append('endDate', filter.endDate.toString());
    }
    if (filter?.senderId?.length) {
      params.append('senderId', filter.senderId.join(','));
    }
    if (filter?.hasMedia !== undefined) {
      params.append('hasMedia', filter.hasMedia.toString());
    }
    if (filter?.hasActions !== undefined) {
      params.append('hasActions', filter.hasActions.toString());
    }
    if (filter?.grouped !== undefined) {
      params.append('grouped', filter.grouped.toString());
    }
    if (filter?.groupKey) {
      params.append('groupKey', filter.groupKey);
    }
    if (filter?.limit) {
      params.append('limit', filter.limit.toString());
    }
    if (filter?.offset) {
      params.append('offset', filter.offset.toString());
    }
    if (filter?.sortBy) {
      params.append('sortBy', filter.sortBy);
    }
    if (filter?.sortOrder) {
      params.append('sortOrder', filter.sortOrder);
    }

    const response = await api.get<
      ApiResponse<{
        notifications: BaseNotification[];
        total: number;
        hasMore: boolean;
      }>
    >(`/notifications?${params.toString()}`);

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch notifications',
      );
    }

    return response.data.data;
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(notificationId: string): Promise<BaseNotification> {
    const response = await api.get<
      ApiResponse<{notification: BaseNotification}>
    >(`/notifications/${notificationId}`);

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch notification');
    }

    return response.data.data.notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      `/notifications/${notificationId}/read`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      '/notifications/bulk/read',
      {notificationIds},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to mark notifications as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      '/notifications/all/read',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      `/notifications/${notificationId}/dismiss`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to dismiss notification');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/notifications/${notificationId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultiple(notificationIds: string[]): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>('/notifications/bulk', {
      data: {notificationIds},
    });

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to delete notifications');
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>('/notifications/all');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to clear all notifications');
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{count: number}>>(
      '/notifications/unread/count',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch unread count');
    }

    return response.data.data.count;
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const response = await api.get<ApiResponse<{stats: NotificationStats}>>(
      '/notifications/stats',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch notification statistics');
    }

    return response.data.data.stats;
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<
      ApiResponse<{preferences: NotificationPreferences}>
    >('/notifications/preferences');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch notification preferences');
    }

    return response.data.data.preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const response = await api.put<
      ApiResponse<{preferences: NotificationPreferences}>
    >('/notifications/preferences', preferences);

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to update notification preferences');
    }

    return response.data.data.preferences;
  }

  /**
   * Reset notification preferences to defaults
   */
  async resetPreferences(): Promise<NotificationPreferences> {
    const response = await api.post<
      ApiResponse<{preferences: NotificationPreferences}>
    >('/notifications/preferences/reset');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to reset notification preferences');
    }

    return response.data.data.preferences;
  }

  /**
   * Register FCM token
   */
  async registerFCMToken(
    token: Omit<FCMToken, 'createdAt' | 'updatedAt' | 'lastUsed'>,
  ): Promise<FCMToken> {
    const response = await api.post<ApiResponse<{token: FCMToken}>>(
      '/notifications/fcm/register',
      token,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to register FCM token');
    }

    return response.data.data.token;
  }

  /**
   * Update FCM token
   */
  async updateFCMToken(
    tokenId: string,
    updates: Partial<FCMToken>,
  ): Promise<FCMToken> {
    const response = await api.patch<ApiResponse<{token: FCMToken}>>(
      `/notifications/fcm/${tokenId}`,
      updates,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to update FCM token');
    }

    return response.data.data.token;
  }

  /**
   * Deactivate FCM token
   */
  async deactivateFCMToken(tokenId: string): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      `/notifications/fcm/${tokenId}/deactivate`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to deactivate FCM token');
    }
  }

  /**
   * Get user's FCM tokens
   */
  async getFCMTokens(): Promise<FCMToken[]> {
    const response = await api.get<ApiResponse<{tokens: FCMToken[]}>>(
      '/notifications/fcm/tokens',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch FCM tokens');
    }

    return response.data.data.tokens;
  }

  /**
   * Test notification delivery
   */
  async testNotification(type: 'push' | 'in_app' | 'email'): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/notifications/test', {
      type,
    });

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to send test notification');
    }
  }

  /**
   * Subscribe to notification updates
   */
  async subscribe(
    subscription: Partial<NotificationSubscription>,
  ): Promise<NotificationSubscription> {
    const response = await api.post<
      ApiResponse<{subscription: NotificationSubscription}>
    >('/notifications/subscribe', subscription);

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to subscribe to notifications');
    }

    return response.data.data.subscription;
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      '/notifications/unsubscribe',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to unsubscribe from notifications');
    }
  }

  /**
   * Pause notifications temporarily
   */
  async pauseNotifications(duration?: number): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/notifications/pause', {
      duration,
    });

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to pause notifications');
    }
  }

  /**
   * Resume notifications
   */
  async resumeNotifications(): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/notifications/resume');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to resume notifications');
    }
  }

  /**
   * Create a notification batch (admin/system use)
   */
  async createBatch(
    notifications: Omit<BaseNotification, 'id' | 'timestamp'>[],
  ): Promise<NotificationBatch> {
    const response = await api.post<ApiResponse<{batch: NotificationBatch}>>(
      '/notifications/batch',
      {notifications},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to create notification batch');
    }

    return response.data.data.batch;
  }

  /**
   * Get notification batch status
   */
  async getBatchStatus(batchId: string): Promise<NotificationBatch> {
    const response = await api.get<ApiResponse<{batch: NotificationBatch}>>(
      `/notifications/batch/${batchId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch batch status');
    }

    return response.data.data.batch;
  }

  /**
   * Track notification event (analytics)
   */
  async trackEvent(
    notificationId: string,
    event: 'delivered' | 'opened' | 'clicked' | 'dismissed',
    metadata?: Record<string, any>,
  ): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/notifications/track', {
      notificationId,
      event,
      metadata,
      timestamp: Date.now(),
    });

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to track notification event');
    }
  }

  /**
   * Get notification delivery report
   */
  async getDeliveryReport(
    startDate: number,
    endDate: number,
    type?: string[],
  ): Promise<{
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    byType: Record<
      string,
      {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        failed: number;
      }
    >;
  }> {
    const params = new URLSearchParams({
      startDate: startDate.toString(),
      endDate: endDate.toString(),
    });

    if (type?.length) {
      params.append('type', type.join(','));
    }

    const response = await api.get<
      ApiResponse<{
        report: {
          totalSent: number;
          delivered: number;
          opened: number;
          clicked: number;
          failed: number;
          byType: Record<
            string,
            {
              sent: number;
              delivered: number;
              opened: number;
              clicked: number;
              failed: number;
            }
          >;
        };
      }>
    >(`/notifications/report?${params.toString()}`);

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch delivery report');
    }

    return response.data.data.report;
  }

  /**
   * Export notifications data
   */
  async exportNotifications(
    format: 'json' | 'csv',
    filter?: NotificationFilter,
  ): Promise<{downloadUrl: string; expiresAt: number}> {
    const response = await api.post<
      ApiResponse<{
        export: {downloadUrl: string; expiresAt: number};
      }>
    >('/notifications/export', {format, filter});

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to export notifications');
    }

    return response.data.data.export;
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    notification: Omit<BaseNotification, 'id' | 'timestamp'>,
    scheduledFor: number,
  ): Promise<BaseNotification> {
    const response = await api.post<
      ApiResponse<{notification: BaseNotification}>
    >('/notifications/schedule', {notification, scheduledFor});

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to schedule notification');
    }

    return response.data.data.notification;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/notifications/schedule/${notificationId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to cancel scheduled notification');
    }
  }
}

export const notificationAPI = new NotificationAPIService();
