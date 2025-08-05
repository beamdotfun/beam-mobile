import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SearchState,
  SearchQuery,
  SearchResult,
  SearchResponse,
  SearchSuggestion,
  SearchHistory,
  TrendingTopic,
  DiscoveryFeed,
  DiscoveryFeedType,
  SearchFilters,
  SearchSorting,
  SearchType,
  SavedSearch,
  SearchConfig,
  SearchAnalytics,
  VoiceSearchConfig,
} from '@/types/search';

interface SearchStore extends SearchState {
  // Search Actions
  search: (query: string, type?: SearchType) => Promise<void>;
  searchWithFilters: (searchQuery: SearchQuery) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
  clearSearch: () => void;

  // Real-time Search
  updateQuery: (query: string) => void;
  updateType: (type: SearchType) => void;
  getSuggestions: (query: string) => Promise<void>;

  // Filters and Sorting
  updateFilters: (filters: Partial<SearchFilters>) => void;
  updateSorting: (sorting: SearchSorting) => void;
  resetFilters: () => void;
  toggleFilterModal: () => void;

  // History Management
  addToHistory: (query: string, type: SearchType, resultCount: number) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
  getRecentSearches: (limit?: number) => SearchHistory[];

  // Trending Topics
  loadTrending: () => Promise<void>;
  refreshTrending: () => Promise<void>;

  // Discovery Feeds
  loadDiscoveryFeed: (type: DiscoveryFeedType) => Promise<void>;
  refreshDiscoveryFeed: (type: DiscoveryFeedType) => Promise<void>;
  refreshAllFeeds: () => Promise<void>;

  // Saved Searches
  saveSearch: (name: string, query: SearchQuery) => void;
  removeSavedSearch: (id: string) => void;
  runSavedSearch: (id: string) => Promise<void>;
  toggleSavedSearchAlerts: (id: string) => void;

  // Recently Viewed
  addToRecentlyViewed: (result: SearchResult) => void;
  clearRecentlyViewed: () => void;

  // Voice Search
  startVoiceSearch: () => Promise<void>;
  stopVoiceSearch: () => void;
  processVoiceResult: (transcript: string, confidence: number) => void;

  // Analytics
  trackSearchQuery: (
    query: string,
    type: SearchType,
    resultCount: number,
  ) => void;
  trackResultClick: (result: SearchResult, position: number) => void;
  trackConversion: (type: 'follow' | 'tip' | 'like' | 'share') => void;

  // Configuration
  updateConfig: (config: Partial<SearchConfig>) => void;
  resetConfig: () => void;

  // Utilities
  getSearchUrl: (query: SearchQuery) => string;
  exportSearchHistory: () => string;
  importSearchHistory: (data: string) => void;

  // Performance
  preloadResults: (query: string) => Promise<void>;
  invalidateCache: () => void;
  getSearchStats: () => {
    totalSearches: number;
    avgResultsPerSearch: number;
    mostSearchedType: SearchType;
    topQueries: string[];
  };
}

const DEFAULT_FILTERS: SearchFilters = {
  timeRange: 'all',
  verificationLevel: 'all',
  hasMedia: undefined,
  language: 'en',
};

const DEFAULT_SORTING: SearchSorting = {
  field: 'relevance',
  direction: 'desc',
};

const DEFAULT_CONFIG: SearchConfig = {
  realtimeEnabled: true,
  suggestionsEnabled: true,
  historyEnabled: true,
  maxHistoryItems: 50,
  debounceMs: 300,
  cacheEnabled: true,
  cacheTtl: 300, // 5 minutes
  voiceSearch: {
    enabled: true,
    language: 'en-US',
    autoSubmit: false,
    confidenceThreshold: 0.8,
  },
  aiRecommendations: true,
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      type: 'all',
      filters: DEFAULT_FILTERS,
      sorting: DEFAULT_SORTING,
      results: [],
      isLoading: false,
      hasMore: false,
      total: 0,
      error: null,
      suggestions: [],
      history: [],
      trending: [],
      discoveryFeeds: {} as Record<DiscoveryFeedType, DiscoveryFeed>,
      isFilterModalOpen: false,
      recentlyViewed: [],
      savedSearches: [],
      analytics: null,
      config: DEFAULT_CONFIG,

      // Search Actions
      search: async (query: string, type: SearchType = 'all') => {
        const {filters, sorting, trackSearchQuery} = get();

        try {
          set({isLoading: true, error: null, query, type});

          const searchQuery: SearchQuery = {
            query,
            type,
            filters,
            sorting,
            pagination: {limit: 20, offset: 0, hasMore: false},
          };

          // Mock search API call
          await new Promise(resolve => setTimeout(resolve, 500));

          const mockResults: SearchResult[] = [
            {
              id: 'post_1',
              type: 'posts',
              relevanceScore: 0.95,
              data: {
                id: 'post_1',
                content: `Great post about ${query}! This is exactly what I was looking for.`,
                author: {
                  wallet: 'user1',
                  username: 'creator1',
                  avatar: 'https://example.com/avatar1.jpg',
                  verificationLevel: 'verified',
                },
                engagement: {
                  likes: 42,
                  comments: 8,
                  shares: 3,
                  tips: 2,
                  tipAmount: 0.5,
                },
                timestamp: new Date().toISOString(),
                hashtags: [query.toLowerCase()],
              },
            },
            {
              id: 'user_1',
              type: 'users',
              relevanceScore: 0.88,
              data: {
                wallet: 'expert_user',
                username: `${query}_expert`,
                displayName: `${query} Expert`,
                bio: `Professional ${query} creator and enthusiast`,
                avatar: 'https://example.com/avatar2.jpg',
                verificationLevel: 'premium',
                userType: 'individual',
                stats: {
                  followers: 1250,
                  following: 345,
                  posts: 187,
                  reputation: 4.7,
                },
                lastActive: new Date().toISOString(),
                isFollowing: false,
              },
            },
          ];

          const response: SearchResponse = {
            results: mockResults,
            total: mockResults.length,
            hasMore: false,
            took: 125,
          };

          set({
            results: response.results,
            total: response.total,
            hasMore: response.hasMore,
            isLoading: false,
          });

          // Track search
          trackSearchQuery(query, type, response.total);

          // Add to history
          get().addToHistory(query, type, response.total);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Search failed',
            isLoading: false,
          });
        }
      },

      searchWithFilters: async (searchQuery: SearchQuery) => {
        try {
          set({isLoading: true, error: null});

          // Mock filtered search
          await new Promise(resolve => setTimeout(resolve, 600));

          // Apply filters to results (mock implementation)
          const mockResults = get().results.filter(result => {
            // Apply time filter
            if (
              searchQuery.filters.timeRange &&
              searchQuery.filters.timeRange !== 'all'
            ) {
              // Mock time filtering logic
              return true;
            }

            // Apply verification filter
            if (
              searchQuery.filters.verificationLevel &&
              searchQuery.filters.verificationLevel !== 'all'
            ) {
              if (result.type === 'users') {
                const userData = result.data as any;
                return (
                  userData.verificationLevel ===
                  searchQuery.filters.verificationLevel
                );
              }
            }

            return true;
          });

          set({
            results: mockResults,
            total: mockResults.length,
            filters: searchQuery.filters,
            sorting: searchQuery.sorting,
            isLoading: false,
          });

        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Filtered search failed',
            isLoading: false,
          });
        }
      },

      loadMore: async () => {
        const {hasMore, isLoading, results} = get();
        if (!hasMore || isLoading) {return;}

        try {
          set({isLoading: true});

          // Mock load more
          await new Promise(resolve => setTimeout(resolve, 400));

          const moreResults: SearchResult[] = [
            {
              id: `additional_${Date.now()}`,
              type: 'posts',
              relevanceScore: 0.75,
              data: {
                id: `additional_${Date.now()}`,
                content: 'Additional search result...',
                author: {
                  wallet: 'user_additional',
                  username: 'additional_user',
                },
                engagement: {
                  likes: 15,
                  comments: 2,
                  shares: 1,
                  tips: 0,
                  tipAmount: 0,
                },
                timestamp: new Date().toISOString(),
                hashtags: [],
              },
            },
          ];

          set({
            results: [...results, ...moreResults],
            hasMore: false, // No more results in mock
            isLoading: false,
          });

        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load more results',
            isLoading: false,
          });
        }
      },

      clearResults: () => {
        set({
          results: [],
          total: 0,
          hasMore: false,
          error: null,
        });
      },

      clearSearch: () => {
        set({
          query: '',
          type: 'all',
          results: [],
          total: 0,
          hasMore: false,
          error: null,
          suggestions: [],
        });
      },

      // Real-time Search
      updateQuery: (query: string) => {
        set({query});

        // Auto-trigger suggestions if enabled
        if (get().config.suggestionsEnabled && query.length > 1) {
          // Debounce suggestions
          setTimeout(() => {
            if (get().query === query) {
              get().getSuggestions(query);
            }
          }, get().config.debounceMs);
        } else {
          set({suggestions: []});
        }
      },

      updateType: (type: SearchType) => {
        set({type});
      },

      getSuggestions: async (query: string) => {
        if (!query || query.length < 2) {
          set({suggestions: []});
          return;
        }

        try {
          // Mock suggestions API call
          await new Promise(resolve => setTimeout(resolve, 150));

          const mockSuggestions: SearchSuggestion[] = [
            {text: `${query} tutorial`, type: 'query', count: 142},
            {text: `${query} tips`, type: 'query', count: 89},
            {text: `#${query}`, type: 'hashtag', count: 267, trending: true},
            {text: `${query}_expert`, type: 'user', count: 23},
          ];

          set({suggestions: mockSuggestions});
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      },

      // Filters and Sorting
      updateFilters: (filters: Partial<SearchFilters>) => {
        set(state => ({
          filters: {...state.filters, ...filters},
        }));
      },

      updateSorting: (sorting: SearchSorting) => {
        set({sorting});
      },

      resetFilters: () => {
        set({filters: DEFAULT_FILTERS});
      },

      toggleFilterModal: () => {
        set(state => ({isFilterModalOpen: !state.isFilterModalOpen}));
      },

      // History Management
      addToHistory: (query: string, type: SearchType, resultCount: number) => {
        const {history, config} = get();

        if (!config.historyEnabled || !query.trim()) {return;}

        const historyItem: SearchHistory = {
          id: `history_${Date.now()}`,
          query,
          type,
          timestamp: new Date().toISOString(),
          resultCount,
        };

        const updatedHistory = [
          historyItem,
          ...history.filter(h => h.query !== query || h.type !== type),
        ].slice(0, config.maxHistoryItems);

        set({history: updatedHistory});
      },

      clearHistory: () => {
        set({history: []});
      },

      removeHistoryItem: (id: string) => {
        set(state => ({
          history: state.history.filter(h => h.id !== id),
        }));
      },

      getRecentSearches: (limit = 10) => {
        return get()
          .history.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, limit);
      },

      // Trending Topics
      loadTrending: async () => {
        try {
          // Mock trending API call
          await new Promise(resolve => setTimeout(resolve, 300));

          const mockTrending: TrendingTopic[] = [
            {
              tag: 'solana',
              posts: 1247,
              change: 15.3,
              category: 'crypto',
              timeframe: 'day',
            },
            {
              tag: 'nft',
              posts: 892,
              change: -5.2,
              category: 'crypto',
              timeframe: 'day',
            },
            {
              tag: 'mobile',
              posts: 634,
              change: 8.7,
              category: 'tech',
              timeframe: 'day',
            },
          ];

          set({trending: mockTrending});
        } catch (error) {
          console.error('Failed to load trending topics:', error);
        }
      },

      refreshTrending: async () => {
        await get().loadTrending();
      },

      // Discovery Feeds
      loadDiscoveryFeed: async (type: DiscoveryFeedType) => {
        try {
          // Mock discovery feed API call
          await new Promise(resolve => setTimeout(resolve, 400));

          const mockFeed: DiscoveryFeed = {
            id: `feed_${type}`,
            title: getFeedTitle(type),
            description: getFeedDescription(type),
            type,
            items: [], // Mock discovery items
            refreshed: new Date().toISOString(),
            hasMore: true,
          };

          set(state => ({
            discoveryFeeds: {
              ...state.discoveryFeeds,
              [type]: mockFeed,
            },
          }));

        } catch (error) {
          console.error(`Failed to load discovery feed ${type}:`, error);
        }
      },

      refreshDiscoveryFeed: async (type: DiscoveryFeedType) => {
        await get().loadDiscoveryFeed(type);
      },

      refreshAllFeeds: async () => {
        const feedTypes: DiscoveryFeedType[] = [
          'for-you',
          'trending',
          'new-creators',
          'trending-hashtags',
          'nearby',
        ];

        await Promise.all(feedTypes.map(type => get().loadDiscoveryFeed(type)));
      },

      // Saved Searches
      saveSearch: (name: string, query: SearchQuery) => {
        const savedSearch: SavedSearch = {
          id: `saved_${Date.now()}`,
          name,
          query,
          createdAt: new Date().toISOString(),
          alertsEnabled: false,
        };

        set(state => ({
          savedSearches: [...state.savedSearches, savedSearch],
        }));
      },

      removeSavedSearch: (id: string) => {
        set(state => ({
          savedSearches: state.savedSearches.filter(s => s.id !== id),
        }));
      },

      runSavedSearch: async (id: string) => {
        const {savedSearches} = get();
        const savedSearch = savedSearches.find(s => s.id === id);

        if (savedSearch) {
          await get().searchWithFilters(savedSearch.query);

          // Update last run time
          set(state => ({
            savedSearches: state.savedSearches.map(s =>
              s.id === id ? {...s, lastRun: new Date().toISOString()} : s,
            ),
          }));
        }
      },

      toggleSavedSearchAlerts: (id: string) => {
        set(state => ({
          savedSearches: state.savedSearches.map(s =>
            s.id === id ? {...s, alertsEnabled: !s.alertsEnabled} : s,
          ),
        }));
      },

      // Recently Viewed
      addToRecentlyViewed: (result: SearchResult) => {
        const {recentlyViewed} = get();

        const updated = [
          result,
          ...recentlyViewed.filter(r => r.id !== result.id),
        ].slice(0, 20);

        set({recentlyViewed: updated});
      },

      clearRecentlyViewed: () => {
        set({recentlyViewed: []});
      },

      // Voice Search
      startVoiceSearch: async () => {
        // Mock voice search implementation
        console.log('Starting voice search...');
      },

      stopVoiceSearch: () => {
        console.log('Stopping voice search...');
      },

      processVoiceResult: (transcript: string, confidence: number) => {
        const {config} = get();

        if (confidence >= config.voiceSearch.confidenceThreshold) {
          set({query: transcript});

          if (config.voiceSearch.autoSubmit) {
            get().search(transcript);
          }
        }
      },

      // Analytics
      trackSearchQuery: (
        query: string,
        type: SearchType,
        resultCount: number,
      ) => {
        // Mock analytics tracking
        console.log('Tracking search:', {query, type, resultCount});
      },

      trackResultClick: (result: SearchResult, position: number) => {
        console.log('Tracking result click:', {result: result.id, position});

        // Add to recently viewed
        get().addToRecentlyViewed(result);
      },

      trackConversion: (type: 'follow' | 'tip' | 'like' | 'share') => {
        console.log('Tracking conversion:', type);
      },

      // Configuration
      updateConfig: (config: Partial<SearchConfig>) => {
        set(state => ({
          config: {...state.config, ...config},
        }));
      },

      resetConfig: () => {
        set({config: DEFAULT_CONFIG});
      },

      // Utilities
      getSearchUrl: (query: SearchQuery) => {
        const params = new URLSearchParams({
          q: query.query,
          type: query.type,
          ...query.filters,
        });
        return `/search?${params.toString()}`;
      },

      exportSearchHistory: () => {
        const {history} = get();
        return JSON.stringify(history, null, 2);
      },

      importSearchHistory: (data: string) => {
        try {
          const importedHistory = JSON.parse(data) as SearchHistory[];
          set({history: importedHistory});
        } catch (error) {
          console.error('Failed to import search history:', error);
        }
      },

      preloadResults: async (query: string) => {
        // Mock preloading for performance
        console.log('Preloading results for:', query);
      },

      invalidateCache: () => {
        console.log('Invalidating search cache');
      },

      getSearchStats: () => {
        const {history} = get();

        const totalSearches = history.length;
        const avgResults =
          history.reduce((sum, h) => sum + h.resultCount, 0) / totalSearches ||

        const typeCount = history.reduce((acc, h) => {
          acc[h.type] = (acc[h.type] || 0) + 1;
          return acc;
        }, {} as Record<SearchType, number>);

        const mostSearchedType =
          (Object.entries(typeCount).sort(
            ([, a], [, b]) => b - a,
          )[0]?.[0] as SearchType) || 'all';

        const queryCount = history.reduce((acc, h) => {
          acc[h.query] = (acc[h.query] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topQueries = Object.entries(queryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([query]) => query);

        return {
          totalSearches,
          avgResultsPerSearch: Math.round(avgResults * 100) / 100,
          mostSearchedType,
          topQueries,
        };
      },
    }),
    {
      name: 'search-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        history: state.history,
        savedSearches: state.savedSearches,
        recentlyViewed: state.recentlyViewed,
        config: state.config,
      }),
    },
  ),
);

// Helper functions
function getFeedTitle(type: DiscoveryFeedType): string {
  switch (type) {
    case 'for-you':
      return 'For You';
    case 'trending':
      return 'Trending Now';
    case 'new-creators':
      return 'New Creators';
    case 'trending-hashtags':
      return 'Trending Hashtags';
    case 'nearby':
      return 'Nearby';
    case 'followed-activity':
      return 'Following Activity';
    case 'recommended-brands':
      return 'Recommended Brands';
    case 'hot-auctions':
      return 'Hot Auctions';
    default:
      return 'Discovery';
  }
}

function getFeedDescription(type: DiscoveryFeedType): string {
  switch (type) {
    case 'for-you':
      return 'Personalized content just for you';
    case 'trending':
      return "What's popular right now";
    case 'new-creators':
      return 'Fresh voices to discover';
    case 'trending-hashtags':
      return 'Popular hashtags and topics';
    case 'nearby':
      return 'Content from your area';
    case 'followed-activity':
      return 'Activity from people you follow';
    case 'recommended-brands':
      return 'Brands you might like';
    case 'hot-auctions':
      return 'Popular auctions ending soon';
    default:
      return 'Discover something new';
  }
}
