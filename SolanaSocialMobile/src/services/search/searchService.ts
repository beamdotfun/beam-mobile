import {api, ApiResponse} from '../api';
import {
  SearchQuery,
  SearchResponse,
  SearchSuggestion,
  TrendingTopic,
  DiscoveryFeed,
  DiscoveryFeedType,
  SavedSearch,
  SearchAlert,
  SearchAnalytics,
} from '@/types/search';

class SearchService {
  /**
   * Perform a search with the given query and parameters
   */
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const response = await api.post<ApiResponse<SearchResponse>>(
      '/search',
      searchQuery,

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Search failed');
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(
    query: string,
    limit: number = 10,
  ): Promise<SearchSuggestion[]> {
    const response = await api.get<
      ApiResponse<{suggestions: SearchSuggestion[]}>
    >('/search/suggestions', {
      params: {q: query, limit},
    });

    if (response.ok && response.data) {
      return response.data.data.suggestions;
    }

    throw new Error(response.data?.message || 'Failed to get suggestions');
  }

  /**
   * Get trending topics and hashtags
   */
  async getTrending(params?: {
    timeframe?: 'hour' | 'day' | 'week';
    location?: string;
    category?: string;
    limit?: number;
  }): Promise<TrendingTopic[]> {
    const response = await api.get<ApiResponse<{trending: TrendingTopic[]}>>(
      '/search/trending',
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data.trending;
    }

    throw new Error(response.data?.message || 'Failed to get trending topics');
  }

  /**
   * Get discovery feed content
   */
  async getDiscoveryFeed(
    type: DiscoveryFeedType,
    params?: {
      limit?: number;
      offset?: number;
      refresh?: boolean;
    },
  ): Promise<DiscoveryFeed> {
    const response = await api.get<ApiResponse<{feed: DiscoveryFeed}>>(
      `/search/discovery/${type}`,
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data.feed;
    }

    throw new Error(response.data?.message || 'Failed to get discovery feed');
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  async getRecommendations(params?: {
    type?: 'posts' | 'users' | 'hashtags' | 'groups';
    limit?: number;
    context?: string; // current post/user context
  }): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>(
      '/search/recommendations',
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to get recommendations');
  }

  /**
   * Perform semantic search using AI embeddings
   */
  async semanticSearch(
    query: string,
    params?: {
      similarity_threshold?: number;
      limit?: number;
      types?: string[];
    },
  ): Promise<SearchResponse> {
    const response = await api.post<ApiResponse<SearchResponse>>(
      '/search/semantic',
      {query, ...params},
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Semantic search failed');
  }

  /**
   * Search within a specific user's content
   */
  async searchUserContent(
    userWallet: string,
    query: string,
    params?: {
      content_type?: 'posts' | 'comments' | 'all';
      time_range?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>(
      `/search/users/${userWallet}`,
      {
        params: {q: query, ...params},
      },
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'User content search failed');
  }

  /**
   * Search within a specific group
   */
  async searchGroupContent(
    groupId: string,
    query: string,
    params?: {
      limit?: number;
      offset?: number;
      sort?: 'relevance' | 'date' | 'engagement';
    },
  ): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>(
      `/search/groups/${groupId}`,
      {
        params: {q: query, ...params},
      },
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Group content search failed');
  }

  /**
   * Get search analytics and insights
   */
  async getSearchAnalytics(params?: {
    timeframe?: 'day' | 'week' | 'month';
    user_id?: string;
  }): Promise<SearchAnalytics> {
    const response = await api.get<ApiResponse<{analytics: SearchAnalytics}>>(
      '/search/analytics',
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data.analytics;
    }

    throw new Error(response.data?.message || 'Failed to get search analytics');
  }

  /**
   * Track search interaction for analytics
   */
  async trackSearchEvent(event: {
    type: 'query' | 'click' | 'conversion';
    query?: string;
    result_id?: string;
    position?: number;
    session_id: string;
    user_agent?: string;
  }): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/search/track', event);

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to track search event');
    }
  }

  /**
   * Save a search query for later use
   */
  async saveSearch(
    savedSearch: Omit<SavedSearch, 'id' | 'createdAt'>,
  ): Promise<SavedSearch> {
    const response = await api.post<ApiResponse<{savedSearch: SavedSearch}>>(
      '/search/saved',
      savedSearch,
    );

    if (response.ok && response.data) {
      return response.data.data.savedSearch;
    }

    throw new Error(response.data?.message || 'Failed to save search');
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(): Promise<SavedSearch[]> {
    const response = await api.get<ApiResponse<{savedSearches: SavedSearch[]}>>(
      '/search/saved',
    );

    if (response.ok && response.data) {
      return response.data.data.savedSearches;
    }

    throw new Error(response.data?.message || 'Failed to get saved searches');
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    id: string,
    updates: Partial<SavedSearch>,
  ): Promise<SavedSearch> {
    const response = await api.patch<ApiResponse<{savedSearch: SavedSearch}>>(
      `/search/saved/${id}`,
      updates,
    );

    if (response.ok && response.data) {
      return response.data.data.savedSearch;
    }

    throw new Error(response.data?.message || 'Failed to update saved search');
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(`/search/saved/${id}`);

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to delete saved search',
      );
    }
  }

  /**
   * Run a saved search and get new results
   */
  async runSavedSearch(id: string): Promise<{
    results: SearchResponse;
    newResultsCount: number;
  }> {
    const response = await api.post<
      ApiResponse<{
        results: SearchResponse;
        newResultsCount: number;
      }>
    >(`/search/saved/${id}/run`);

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to run saved search');
  }

  /**
   * Get search alerts for saved searches
   */
  async getSearchAlerts(params?: {
    unread_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    alerts: SearchAlert[];
    hasMore: boolean;
    unreadCount: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        alerts: SearchAlert[];
        hasMore: boolean;
        unreadCount: number;
      }>
    >('/search/alerts', {params});

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to get search alerts');
  }

  /**
   * Mark search alert as read
   */
  async markAlertRead(alertId: string): Promise<void> {
    const response = await api.patch<ApiResponse<{}>>(
      `/search/alerts/${alertId}/read`,

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to mark alert as read');
    }
  }

  /**
   * Get search suggestions based on user's search history
   */
  async getPersonalizedSuggestions(
    limit: number = 10,
  ): Promise<SearchSuggestion[]> {
    const response = await api.get<
      ApiResponse<{suggestions: SearchSuggestion[]}>
    >('/search/suggestions/personalized', {params: {limit}});

    if (response.ok && response.data) {
      return response.data.data.suggestions;
    }

    throw new Error(
      response.data?.message || 'Failed to get personalized suggestions',
    );
  }

  /**
   * Get related searches for a given query
   */
  async getRelatedSearches(
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    const response = await api.get<ApiResponse<{related: string[]}>>(
      '/search/related',
      {
        params: {q: query, limit},
      },
    );

    if (response.ok && response.data) {
      return response.data.data.related;
    }

    throw new Error(response.data?.message || 'Failed to get related searches');
  }

  /**
   * Get search facets for filtering
   */
  async getSearchFacets(query: string): Promise<{
    types: Record<string, number>;
    timeRanges: Record<string, number>;
    locations: Record<string, number>;
    verificationLevels: Record<string, number>;
    categories: Record<string, number>;
  }> {
    const response = await api.get<
      ApiResponse<{
        types: Record<string, number>;
        timeRanges: Record<string, number>;
        locations: Record<string, number>;
        verificationLevels: Record<string, number>;
        categories: Record<string, number>;
      }>
    >('/search/facets', {
      params: {q: query},
    });

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to get search facets');
  }

  /**
   * Search for nearby content based on location
   */
  async searchNearby(params: {
    latitude: number;
    longitude: number;
    radius: number; // in km
    query?: string;
    type?: string;
    limit?: number;
  }): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>(
      '/search/nearby',
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Nearby search failed');
  }

  /**
   * Search using voice/speech input
   */
  async voiceSearch(params: {
    audio_data: string; // base64 encoded audio
    language?: string;
    context?: string;
  }): Promise<{
    transcript: string;
    confidence: number;
    results: SearchResponse;
  }> {
    const response = await api.post<
      ApiResponse<{
        transcript: string;
        confidence: number;
        results: SearchResponse;
      }>
    >('/search/voice', params);

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Voice search failed');
  }

  /**
   * Get search suggestions for hashtags
   */
  async getHashtagSuggestions(
    prefix: string,
    limit: number = 10,
  ): Promise<
    {
      hashtag: string;
      count: number;
      trending?: boolean;
    }[]
  > {
    const response = await api.get<
      ApiResponse<{
        hashtags: {
          hashtag: string;
          count: number;
          trending?: boolean;
        }[];
      }>
    >('/search/hashtags', {
      params: {prefix, limit},
    });

    if (response.ok && response.data) {
      return response.data.data.hashtags;
    }

    throw new Error(
      response.data?.message || 'Failed to get hashtag suggestions',
    );
  }

  /**
   * Search for content with specific hashtags
   */
  async searchByHashtag(
    hashtag: string,
    params?: {
      time_range?: string;
      sort?: 'recent' | 'popular' | 'engagement';
      limit?: number;
      offset?: number;
    },
  ): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>(
      `/search/hashtags/${encodeURIComponent(hashtag)}`,
      {params},
    );

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Hashtag search failed');
  }

  /**
   * Get search performance metrics
   */
  async getSearchMetrics(): Promise<{
    totalSearches: number;
    avgResponseTime: number;
    popularQueries: {query: string; count: number}[];
    successRate: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        totalSearches: number;
        avgResponseTime: number;
        popularQueries: {query: string; count: number}[];
        successRate: number;
      }>
    >('/search/metrics');

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to get search metrics');
  }

  /**
   * Preload search results for better performance
   */
  async preloadSearch(queries: string[]): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/search/preload', {
      queries,

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to preload searches');
    }
  }

  /**
   * Clear search cache
   */
  async clearSearchCache(): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>('/search/cache');

    if (!response.ok) {
      throw new Error(response.data?.message || 'Failed to clear search cache');
    }
  }

  /**
   * Get search index status
   */
  async getIndexStatus(): Promise<{
    lastUpdated: string;
    documentsIndexed: number;
    indexHealth: 'green' | 'yellow' | 'red';
    isReindexing: boolean;
  }> {
    const response = await api.get<
      ApiResponse<{
        lastUpdated: string;
        documentsIndexed: number;
        indexHealth: 'green' | 'yellow' | 'red';
        isReindexing: boolean;
      }>
    >('/search/index/status');

    if (response.ok && response.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to get index status');
  }

  /**
   * Report search issue or feedback
   */
  async reportSearchIssue(issue: {
    query: string;
    type:
      | 'no_results'
      | 'irrelevant_results'
      | 'slow_response'
      | 'error'
      | 'other';
    description?: string;
    expected?: string;
    session_id?: string;
  }): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/search/feedback', issue);

    if (!response.ok) {
      throw new Error(
        response.data?.message || 'Failed to report search issue',
      );
    }
  }
}

export const searchService = new SearchService();
