import {api} from './index';
import {
  UserAnalytics,
  AnalyticsFilters,
  ExportOptions,
  AnalyticsResponse,
  ExportResponse,
  TimeSeriesPoint,
  ContentAnalytics,
  AudienceAnalytics,
  EarningsAnalytics,
  PostPerformance,
} from '@/types/analytics';

export class AnalyticsService {
  /**
   * Fetch comprehensive user analytics
   */
  static async getUserAnalytics(
    wallet: string,
    filters?: AnalyticsFilters,
  ): Promise<UserAnalytics> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);

    if (filters) {
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
        if (filters.dateRange.preset) {
          params.append('preset', filters.dateRange.preset);
        }
      }
      if (filters.granularity) {
        params.append('granularity', filters.granularity);
      }
      if (filters.contentTypes?.length) {
        params.append('contentTypes', filters.contentTypes.join(','));
      }
      if (filters.includeComparison) {
        params.append('includeComparison', 'true');
      }
    }

    const response = await api.get<AnalyticsResponse>(
      `/analytics/user?${params.toString()}`,
    );
    return response.data.data;
  }

  /**
   * Fetch analytics overview/summary
   */
  static async getAnalyticsOverview(
    wallet: string,
  ): Promise<UserAnalytics['overview']> {
    const response = await api.get(`/analytics/user/${wallet}/overview`);
    return response.data;
  }

  /**
   * Fetch time series data for charts
   */
  static async getTimeSeriesData(
    wallet: string,
    period: 'hour' | 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<TimeSeriesPoint[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }

    const response = await api.get(
      `/analytics/user/${wallet}/timeseries?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Fetch content performance analytics
   */
  static async getContentAnalytics(
    wallet: string,
    filters?: {
      limit?: number;
      sortBy?: 'views' | 'engagement' | 'earnings' | 'viral_score';
      timeRange?: string;
    },
  ): Promise<ContentAnalytics> {
    const params = new URLSearchParams();
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters?.timeRange) {
      params.append('timeRange', filters.timeRange);
    }

    const response = await api.get(
      `/analytics/user/${wallet}/content?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Fetch audience insights
   */
  static async getAudienceAnalytics(
    wallet: string,
  ): Promise<AudienceAnalytics> {
    const response = await api.get(`/analytics/user/${wallet}/audience`);
    return response.data;
  }

  /**
   * Fetch earnings analytics
   */
  static async getEarningsAnalytics(
    wallet: string,
    timeframe?: 'week' | 'month' | 'quarter' | 'year',
  ): Promise<EarningsAnalytics> {
    const params = new URLSearchParams();
    if (timeframe) {
      params.append('timeframe', timeframe);
    }

    const response = await api.get(
      `/analytics/user/${wallet}/earnings?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Fetch specific metric data
   */
  static async getMetric(
    wallet: string,
    metric: string,
    period?: string,
  ): Promise<any> {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }

    const response = await api.get(
      `/analytics/user/${wallet}/metric/${metric}?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Fetch top performing posts
   */
  static async getTopPosts(
    wallet: string,
    options?: {
      limit?: number;
      timeRange?: string;
      sortBy?: 'views' | 'engagement' | 'earnings';
      includeDeleted?: boolean;
    },
  ): Promise<PostPerformance[]> {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.timeRange) {
      params.append('timeRange', options.timeRange);
    }
    if (options?.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    if (options?.includeDeleted) {
      params.append('includeDeleted', 'true');
    }

    const response = await api.get(
      `/analytics/user/${wallet}/posts/top?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Fetch hashtag performance
   */
  static async getHashtagPerformance(
    wallet: string,
    limit: number = 20,
  ): Promise<any[]> {
    const response = await api.get(
      `/analytics/user/${wallet}/hashtags?limit=${limit}`,
    );
    return response.data;
  }

  /**
   * Fetch audience demographics
   */
  static async getAudienceDemographics(wallet: string): Promise<any> {
    const response = await api.get(
      `/analytics/user/${wallet}/audience/demographics`,
    );
    return response.data;
  }

  /**
   * Fetch audience behavior patterns
   */
  static async getAudienceBehavior(wallet: string): Promise<any> {
    const response = await api.get(
      `/analytics/user/${wallet}/audience/behavior`,
    );
    return response.data;
  }

  /**
   * Fetch growth metrics and projections
   */
  static async getGrowthMetrics(wallet: string): Promise<any> {
    const response = await api.get(`/analytics/user/${wallet}/growth`);
    return response.data;
  }

  /**
   * Fetch comparison analytics
   */
  static async getComparisonAnalytics(
    wallet: string,
    compareWith: {
      startDate: Date;
      endDate: Date;
    },
    baseline: {
      startDate: Date;
      endDate: Date;
    },
  ): Promise<any> {
    const response = await api.post(`/analytics/user/${wallet}/compare`, {
      compareWith: {
        startDate: compareWith.startDate.toISOString(),
        endDate: compareWith.endDate.toISOString(),
      },
      baseline: {
        startDate: baseline.startDate.toISOString(),
        endDate: baseline.endDate.toISOString(),
      },
    });
    return response.data;
  }

  /**
   * Export analytics data
   */
  static async exportAnalytics(
    wallet: string,
    options: ExportOptions,
  ): Promise<ExportResponse['data']> {
    const response = await api.post<ExportResponse>(
      `/analytics/user/${wallet}/export`,
      {
        format: options.format,
        sections: options.sections,
        includeCharts: options.includeCharts,
        includeRawData: options.includeRawData,
      },
    );
    return response.data.data;
  }

  /**
   * Track analytics event
   */
  static async trackEvent(
    wallet: string,
    event: {
      type: string;
      category?: string;
      data?: any;
    },
  ): Promise<void> {
    await api.post(`/analytics/user/${wallet}/track`, {
      type: event.type,
      category: event.category,
      data: event.data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get real-time metrics
   */
  static async getRealtimeMetrics(wallet: string): Promise<any> {
    const response = await api.get(`/analytics/user/${wallet}/realtime`);
    return response.data;
  }


  /**
   * Get analytics for multiple users (admin/comparison)
   */
  static async getMultiUserAnalytics(
    wallets: string[],
    filters?: AnalyticsFilters,
  ): Promise<Record<string, UserAnalytics>> {
    const response = await api.post('/analytics/users/batch', {
      wallets,
      filters,
    });
    return response.data;
  }

  /**
   * Get platform-wide analytics (admin)
   */
  static async getPlatformAnalytics(filters?: AnalyticsFilters): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }

    const response = await api.get(`/analytics/platform?${params.toString()}`);
    return response.data;
  }

  /**
   * Get trending analytics
   */
  static async getTrendingAnalytics(
    category?: 'posts' | 'users' | 'hashtags',
    timeframe?: 'hour' | 'day' | 'week',
  ): Promise<any> {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    if (timeframe) {
      params.append('timeframe', timeframe);
    }

    const response = await api.get(`/analytics/trending?${params.toString()}`);
    return response.data;
  }

  /**
   * Get analytics insights and recommendations
   */
  static async getInsights(wallet: string): Promise<any> {
    const response = await api.get(`/analytics/user/${wallet}/insights`);
    return response.data;
  }

  /**
   * Get performance benchmarks
   */
  static async getBenchmarks(wallet: string, category?: string): Promise<any> {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }

    const response = await api.get(
      `/analytics/user/${wallet}/benchmarks?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Set analytics preferences
   */
  static async setAnalyticsPreferences(
    wallet: string,
    preferences: {
      trackingEnabled?: boolean;
      granularity?: 'hour' | 'day' | 'week';
      notifications?: boolean;
      dataRetention?: number; // days
    },
  ): Promise<void> {
    await api.put(`/analytics/user/${wallet}/preferences`, preferences);
  }

  /**
   * Get analytics preferences
   */
  static async getAnalyticsPreferences(wallet: string): Promise<any> {
    const response = await api.get(`/analytics/user/${wallet}/preferences`);
    return response.data;
  }

  /**
   * Clear analytics cache
   */
  static async clearCache(wallet: string): Promise<void> {
    await api.delete(`/analytics/user/${wallet}/cache`);
  }

  /**
   * Get analytics health status
   */
  static async getHealthStatus(): Promise<any> {
    const response = await api.get('/analytics/health');
    return response.data;
  }
}
