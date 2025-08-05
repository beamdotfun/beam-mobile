import {api} from './index';
import {
  QuoteablePost,
  QuoteContext,
  QuoteChain,
  QuotingAnalytics,
  QuoteSearchResult,
  QuoteSearchFilters,
  CreateQuoteRequest,
  CreateQuoteResponse,
  QuoteChainResponse,
  TrendingQuotesResponse,
  QuoteType,
} from '@/types/post-quoting';

export class PostQuotingService {
  /**
   * Create a new quote for a post
   */
  static async createQuote(
    request: CreateQuoteRequest,
  ): Promise<CreateQuoteResponse> {
    const response = await api.post<CreateQuoteResponse>(
      '/posts/quote',
      request,
    );
    return response.data;
  }

  /**
   * Get quoteable post preview data
   */
  static async getQuotePreview(postId: string): Promise<QuoteablePost> {
    const response = await api.get<QuoteablePost>(
      `/posts/${postId}/quote-preview`,
    );
    return response.data;
  }

  /**
   * Get quote chain for a post
   */
  static async getQuoteChain(
    postId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<QuoteChainResponse> {
    const params = new URLSearchParams();
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', limit.toString());

    const response = await api.get<QuoteChainResponse>(
      `/posts/${postId}/quote-chain?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Search quoteable posts
   */
  static async searchQuotablePosts(
    query: string,
    filters?: QuoteSearchFilters,
  ): Promise<QuoteablePost[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('quoteable', 'true');

    if (filters) {
      if (filters.quoteTypes?.length) {
        params.append('quote_types', filters.quoteTypes.join(','));
      }
      if (filters.timeRange) {
        params.append('time_range', filters.timeRange);
      }
      if (filters.minEngagement !== undefined) {
        params.append('min_engagement', filters.minEngagement.toString());
      }
      if (filters.hasMedia !== undefined) {
        params.append('has_media', filters.hasMedia.toString());
      }
      if (filters.author) {
        params.append('author', filters.author);
      }
      if (filters.originalAuthor) {
        params.append('original_author', filters.originalAuthor);
      }
      if (filters.trending !== undefined) {
        params.append('trending', filters.trending.toString());
      }
      if (filters.verified !== undefined) {
        params.append('verified', filters.verified.toString());
      }
    }

    const response = await api.get<QuoteablePost[]>(
      `/posts/search?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Search quotes with advanced filtering
   */
  static async searchQuotes(
    query: string,
    filters?: QuoteSearchFilters,
  ): Promise<QuoteSearchResult[]> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters) {
      if (filters.quoteTypes?.length) {
        params.append('quote_types', filters.quoteTypes.join(','));
      }
      if (filters.timeRange) {
        params.append('time_range', filters.timeRange);
      }
      if (filters.minEngagement !== undefined) {
        params.append('min_engagement', filters.minEngagement.toString());
      }
    }

    const response = await api.get<QuoteSearchResult[]>(
      `/quotes/search?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get trending quotes
   */
  static async getTrendingQuotes(
    timeframe: 'hour' | 'day' | 'week' = 'day',
  ): Promise<TrendingQuotesResponse> {
    const response = await api.get<TrendingQuotesResponse>(
      `/quotes/trending?timeframe=${timeframe}`,
    );
    return response.data;
  }

  /**
   * Get quotes by user
   */
  static async getQuotesByUser(
    userWallet: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<QuoteContext[]> {
    const params = new URLSearchParams();
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', limit.toString());

    const response = await api.get<QuoteContext[]>(
      `/users/${userWallet}/quotes?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get quote analytics for a post
   */
  static async getQuoteAnalytics(
    postId: string,
    timeframe: string = 'week',
  ): Promise<QuotingAnalytics> {
    const response = await api.get<QuotingAnalytics>(
      `/posts/${postId}/quote-analytics?timeframe=${timeframe}`,
    );
    return response.data;
  }

  /**
   * Like a quote
   */
  static async likeQuote(quoteId: string): Promise<void> {
    await api.post(`/quotes/${quoteId}/like`);
  }

  /**
   * Unlike a quote
   */
  static async unlikeQuote(quoteId: string): Promise<void> {
    await api.delete(`/quotes/${quoteId}/like`);
  }

  /**
   * Share a quote
   */
  static async shareQuote(quoteId: string, message?: string): Promise<void> {
    await api.post(`/quotes/${quoteId}/share`, {message});
  }

  /**
   * Tip a quote
   */
  static async tipQuote(quoteId: string, amount: number): Promise<void> {
    await api.post(`/quotes/${quoteId}/tip`, {amount});
  }

  /**
   * Report a quote
   */
  static async reportQuote(quoteId: string, reason: string): Promise<void> {
    await api.post(`/quotes/${quoteId}/report`, {reason});
  }

  /**
   * Track quote view (analytics)
   */
  static async trackQuoteView(quoteId: string): Promise<void> {
    // Fire and forget analytics call
    try {
      await api.post(`/quotes/${quoteId}/view`);
    } catch (error) {
      // Silently ignore analytics errors
      console.warn('Failed to track quote view:', error);
    }
  }

  /**
   * Get quote details by ID
   */
  static async getQuoteById(quoteId: string): Promise<QuoteContext> {
    const response = await api.get<QuoteContext>(`/quotes/${quoteId}`);
    return response.data;
  }

  /**
   * Delete a quote (user's own quote only)
   */
  static async deleteQuote(quoteId: string): Promise<void> {
    await api.delete(`/quotes/${quoteId}`);
  }

  /**
   * Edit a quote (user's own quote only)
   */
  static async editQuote(
    quoteId: string,
    content: string,
    quoteType: QuoteType,
  ): Promise<QuoteContext> {
    const response = await api.put<QuoteContext>(`/quotes/${quoteId}`, {
      content,
      quoteType,
    });
    return response.data;
  }

  /**
   * Get quote notifications for a user
   */
  static async getQuoteNotifications(
    cursor?: string,
    limit: number = 20,
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', limit.toString());

    const response = await api.get<any[]>(
      `/quotes/notifications?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Mark quote notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    await api.put(`/quotes/notifications/${notificationId}/read`);
  }

  /**
   * Get quote recommendations based on user activity
   */
  static async getQuoteRecommendations(
    limit: number = 10,
  ): Promise<QuoteablePost[]> {
    const response = await api.get<QuoteablePost[]>(
      `/quotes/recommendations?limit=${limit}`,
    );
    return response.data;
  }

  /**
   * Get popular quote chains
   */
  static async getPopularQuoteChains(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 10,
  ): Promise<QuoteChain[]> {
    const response = await api.get<QuoteChain[]>(
      `/quotes/chains/popular?timeframe=${timeframe}&limit=${limit}`,
    );
    return response.data;
  }
}
