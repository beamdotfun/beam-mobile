import {api, ApiResponse} from '../api';
import {
  Tip,
  CreatorEarnings,
  TipLeaderboard,
  TipStats,
  SOLPriceData,
  TipNotification,
} from '@/types/tips';

class TipService {
  /**
   * Send a tip to another user
   */
  async sendTip(data: {
    toWallet: string;
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    amount: number;
    message?: string;
    isAnonymous?: boolean;
  }): Promise<Tip> {
    const response = await api.post<ApiResponse<{tip: Tip}>>(
      '/tips/send',
      data,
    );

    if (response.ok && response.data) {
      return response.data.data.tip;
    }

    throw new Error(response.data?.message || 'Failed to send tip');
  }

  /**
   * Get tips for a specific user
   */
  async getTips(params?: {
    wallet?: string;
    type?: 'sent' | 'received' | 'all';
    limit?: number;
    offset?: number;
    targetType?: 'post' | 'comment' | 'user';
  }): Promise<{tips: Tip[]; hasMore: boolean; total: number}> {
    const response = await api.get<
      ApiResponse<{
        tips: Tip[];
        hasMore: boolean;
        total: number;
      }>
    >('/tips', {params});

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to fetch tips');
  }

  /**
   * Get tip details by ID
   */
  async getTipById(tipId: string): Promise<Tip> {
    const response = await api.get<ApiResponse<{tip: Tip}>>(`/tips/${tipId}`);

    if (response.ok && response.data) {
      return response.data.data.tip;
    }

    throw new Error(response.data?.message || 'Failed to fetch tip');
  }

  /**
   * Get creator earnings data
   */
  async getCreatorEarnings(params?: {
    wallet?: string;
    period?: 'day' | 'week' | 'month' | 'year' | 'all';
    includeAnalytics?: boolean;
  }): Promise<CreatorEarnings> {
    const response = await api.get<ApiResponse<{earnings: CreatorEarnings}>>(
      '/tips/earnings',
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data.earnings;
    }

    throw new Error(response.data?.message || 'Failed to fetch earnings');
  }

  /**
   * Export earnings data
   */
  async exportEarnings(params: {
    format: 'csv' | 'json';
    period?: 'day' | 'week' | 'month' | 'year' | 'all';
    wallet?: string;
  }): Promise<string> {
    const response = await api.get<string>('/tips/earnings/export', {
      params,
      responseType: 'text',
    });

    if (response.ok && response.data) {
      return response.data;
    }

    throw new Error('Failed to export earnings');
  }

  /**
   * Get tip leaderboard
   */
  async getTipLeaderboard(params?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'all-time';
    type?: 'earners' | 'tippers' | 'rising';
    limit?: number;
  }): Promise<TipLeaderboard> {
    const response = await api.get<ApiResponse<{leaderboard: TipLeaderboard}>>(
      '/tips/leaderboard',
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data.leaderboard;
    }

    throw new Error(response.data?.message || 'Failed to fetch leaderboard');
  }

  /**
   * Get global tip statistics
   */
  async getTipStats(): Promise<TipStats> {
    const response = await api.get<ApiResponse<{stats: TipStats}>>(
      '/tips/stats',
    );

    if (response.ok && response.data) {
      return response.data.data.stats;
    }

    throw new Error(response.data?.message || 'Failed to fetch tip stats');
  }

  /**
   * Get SOL price data
   */
  async getSOLPrice(): Promise<SOLPriceData> {
    const response = await api.get<ApiResponse<{price: SOLPriceData}>>(
      '/market/sol-price',
    );

    if (response.ok && response.data) {
      return response.data.data.price;
    }

    throw new Error(response.data?.message || 'Failed to fetch SOL price');
  }

  /**
   * Get tip notifications
   */
  async getTipNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<{
    notifications: TipNotification[];
    hasMore: boolean;
    unreadCount: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        notifications: TipNotification[];
        hasMore: boolean;
        unreadCount: number;
      }>
    >('/tips/notifications', {params});

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to fetch notifications');
  }

  /**
   * Mark tip notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      `/tips/notifications/${notificationId}/read`,
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to mark notification as read',
      );
    }
  }

  /**
   * Mark all tip notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      '/tips/notifications/read-all',
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to mark all notifications as read',
      );
    }
  }

  /**
   * Get tip transaction fee estimate
   */
  async estimateNetworkFee(): Promise<{fee: number; currency: 'SOL'}> {
    const response = await api.get<ApiResponse<{fee: number; currency: 'SOL'}>>(
      '/tips/estimate-fee',
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to estimate network fee');
  }

  /**
   * Validate tip amount and check user balance
   */
  async validateTip(data: {amount: number; toWallet: string}): Promise<{
    valid: boolean;
    error?: string;
    balance: number;
    estimatedFee: number;
  }> {
    const response = await api.post<
      ApiResponse<{
        valid: boolean;
        error?: string;
        balance: number;
        estimatedFee: number;
      }>
    >('/tips/validate', data);

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to validate tip');
  }

  /**
   * Get tip impact preview (how it affects recipient's reputation)
   */
  async getTipImpactPreview(data: {toWallet: string; amount: number}): Promise<{
    currentScore: number;
    newScore: number;
    change: number;
    percentageChange: number;
    effects: {
      rankChange: number;
      newRank: number;
      milestoneReached?: string;
    };
  }> {
    const response = await api.post<
      ApiResponse<{
        currentScore: number;
        newScore: number;
        change: number;
        percentageChange: number;
        effects: {
          rankChange: number;
          newRank: number;
          milestoneReached?: string;
        };
      }>
    >('/tips/impact-preview', data);

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || 'Failed to get tip impact preview',
    );
  }

  /**
   * Get tip history for a specific content
   */
  async getContentTipHistory(
    contentId: string,
    contentType: 'post' | 'comment',
  ): Promise<{
    tips: Tip[];
    totalAmount: number;
    totalAmountUSD: number;
    tipCount: number;
    uniqueTippers: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        tips: Tip[];
        totalAmount: number;
        totalAmountUSD: number;
        tipCount: number;
        uniqueTippers: number;
      }>
    >(`/tips/content/${contentType}/${contentId}`);

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || 'Failed to fetch content tip history',
    );
  }

  /**
   * Get user's tip preferences
   */
  async getTipPreferences(): Promise<{
    defaultAnonymous: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    animationsEnabled: boolean;
    showUSDValues: boolean;
    presetAmounts: number[];
  }> {
    const response = await api.get<
      ApiResponse<{
        defaultAnonymous: boolean;
        soundEnabled: boolean;
        hapticEnabled: boolean;
        animationsEnabled: boolean;
        showUSDValues: boolean;
        presetAmounts: number[];
      }>
    >('/tips/preferences');

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || 'Failed to fetch tip preferences',
    );
  }

  /**
   * Update user's tip preferences
   */
  async updateTipPreferences(preferences: {
    defaultAnonymous?: boolean;
    soundEnabled?: boolean;
    hapticEnabled?: boolean;
    animationsEnabled?: boolean;
    showUSDValues?: boolean;
    presetAmounts?: number[];
  }): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      '/tips/preferences',
      preferences,
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to update tip preferences',
      );
    }
  }

  /**
   * Get tip statistics for user
   */
  async getUserTipStats(wallet?: string): Promise<{
    totalSent: number;
    totalReceived: number;
    totalSentUSD: number;
    totalReceivedUSD: number;
    tipCount: number;
    uniqueRecipients: number;
    averageTip: number;
    streak: number;
    rank: {
      tipper: number;
      earner: number;
    };
  }> {
    const response = await api.get<
      ApiResponse<{
        totalSent: number;
        totalReceived: number;
        totalSentUSD: number;
        totalReceivedUSD: number;
        tipCount: number;
        uniqueRecipients: number;
        averageTip: number;
        streak: number;
        rank: {
          tipper: number;
          earner: number;
        };
      }>
    >('/tips/user/stats', {params: {wallet}});

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to fetch user tip stats');
  }

  /**
   * Report a tip (for moderation)
   */
  async reportTip(tipId: string, reason: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(`/tips/${tipId}/report`, {
      reason,
    });

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to report tip');
    }
  }

  /**
   * Cancel a pending tip (if still unconfirmed)
   */
  async cancelTip(tipId: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(`/tips/${tipId}/cancel`);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to cancel tip');
    }
  }

  /**
   * Get trending content by tips received
   */
  async getTrendingTippedContent(params?: {
    period?: 'day' | 'week' | 'month';
    contentType?: 'post' | 'comment' | 'all';
    limit?: number;
  }): Promise<{
    content: Array<{
      id: string;
      type: 'post' | 'comment';
      title?: string;
      preview: string;
      author: {
        wallet: string;
        username?: string;
        avatar?: string;
      };
      tipStats: {
        totalAmount: number;
        totalAmountUSD: number;
        tipCount: number;
        uniqueTippers: number;
      };
      engagement: {
        views: number;
        likes: number;
        comments: number;
        shares: number;
      };
    }>;
  }> {
    const response = await api.get<
      ApiResponse<{
        content: Array<{
          id: string;
          type: 'post' | 'comment';
          title?: string;
          preview: string;
          author: {
            wallet: string;
            username?: string;
            avatar?: string;
          };
          tipStats: {
            totalAmount: number;
            totalAmountUSD: number;
            tipCount: number;
            uniqueTippers: number;
          };
          engagement: {
            views: number;
            likes: number;
            comments: number;
            shares: number;
          };
        }>;
      }>
    >('/tips/trending', {params});

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || 'Failed to fetch trending tipped content',
    );
  }
}

export const tipService = new TipService();
