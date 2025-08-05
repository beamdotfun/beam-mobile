import {create} from 'zustand';
import {
  SearchResult,
  TrendingTopic,
  LeaderboardEntry,
  Recommendation,
  SearchFilters,
  DiscoverySection,
} from '@/types/discovery';
import {discoveryAPI} from '../services/api/discovery';

interface DiscoveryState {
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchFilters: SearchFilters;
  recentSearches: string[];

  // Discovery sections
  discoverySections: DiscoverySection[];
  discoveryLoading: boolean;

  // Trending
  trendingTopics: TrendingTopic[];
  trendingLoading: boolean;

  // Leaderboards
  reputationLeaderboard: LeaderboardEntry[];
  epochLeaderboard: LeaderboardEntry[];
  tipsLeaderboard: LeaderboardEntry[];
  postsLeaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardPagination: any;

  // Recommendations
  userRecommendations: Recommendation[];
  brandRecommendations: Recommendation[];
  topicRecommendations: Recommendation[];

  // UI state
  error: string | null;

  // Actions
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Discovery
  loadDiscoveryContent: () => Promise<void>;
  loadTrendingTopics: () => Promise<void>;

  // Leaderboards
  loadLeaderboard: (type: 'reputation' | 'epoch' | 'tips' | 'posts', period?: string) => Promise<void>;

  // Recommendations
  loadRecommendations: () => Promise<void>;
  dismissRecommendation: (type: string, id: string) => void;

  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  // Initial state
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchFilters: {
    type: 'all',
    timeRange: 'all',
    sortBy: 'relevance',
  },
  recentSearches: [],

  discoverySections: [],
  discoveryLoading: false,

  trendingTopics: [],
  trendingLoading: false,

  reputationLeaderboard: [],
  epochLeaderboard: [],
  tipsLeaderboard: [],
  postsLeaderboard: [],
  leaderboardLoading: false,
  leaderboardPagination: {},

  userRecommendations: [],
  brandRecommendations: [],
  topicRecommendations: [],

  error: null,

  // Search functionality
  search: async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) {
      set({searchResults: [], searchQuery: ''});
      return;
    }

    set({
      searchLoading: true,
      searchQuery: query,
      error: null,
      ...(filters && {searchFilters: {...get().searchFilters, ...filters}}),
    });

    try {
      const results = await discoveryAPI.search(query, get().searchFilters);

      set({
        searchResults: results,
        searchLoading: false,
      });

      // Add to recent searches
      get().addRecentSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
      set({
        searchLoading: false,
        error: 'Search failed. Please try again.',
        searchResults: [],
      });
    }
  },

  // Clear search results
  clearSearch: () => {
    set({
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      error: null,
    });
  },

  // Update search filters
  updateSearchFilters: (filters: Partial<SearchFilters>) => {
    const newFilters = {...get().searchFilters, ...filters};
    set({searchFilters: newFilters});

    // Re-search if there's an active query
    const {searchQuery} = get();
    if (searchQuery.trim()) {
      get().search(searchQuery, newFilters);
    }
  },

  // Add recent search
  addRecentSearch: (query: string) => {
    set(state => {
      const filtered = state.recentSearches.filter(s => s !== query);
      return {
        recentSearches: [query, ...filtered].slice(0, 10), // Keep last 10
      };
    });
  },

  // Clear recent searches
  clearRecentSearches: () => {
    set({recentSearches: []});
  },

  // Load discovery content
  loadDiscoveryContent: async () => {
    set({discoveryLoading: true, error: null});

    try {
      const sections = await discoveryAPI.getDiscoveryContent();

      set({
        discoverySections: sections,
        discoveryLoading: false,
      });
    } catch (error) {
      console.error('Failed to load discovery content:', error);
      set({
        discoveryLoading: false,
        error: 'Failed to load content. Please try again.',
      });
    }
  },

  // Load trending topics
  loadTrendingTopics: async () => {
    set({trendingLoading: true, error: null});

    try {
      const topics = await discoveryAPI.getTrendingTopics();

      set({
        trendingTopics: topics,
        trendingLoading: false,
      });
    } catch (error) {
      console.error('Failed to load trending topics:', error);
      set({
        trendingLoading: false,
        error: 'Failed to load trending topics.',
      });
    }
  },

  // Load leaderboard
  loadLeaderboard: async (type: 'reputation' | 'epoch' | 'tips' | 'posts', period?: string) => {
    set({leaderboardLoading: true, error: null});

    try {
      console.log('Loading leaderboard:', { type, period });
      const result = await discoveryAPI.getLeaderboard(type, 1, 50, period);

      console.log('Leaderboard result:', result);

      set({
        [`${type}Leaderboard`]: result.leaderboard,
        leaderboardPagination: result.pagination,
        leaderboardLoading: false,
      });
    } catch (error) {
      console.error(`Failed to load ${type} leaderboard:`, error);
      set({
        leaderboardLoading: false,
        error: `Failed to load ${type} leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  // Load recommendations
  loadRecommendations: async () => {
    try {
      const [userRecs, brandRecs, topicRecs] = await Promise.all([
        discoveryAPI.getUserRecommendations(),
        discoveryAPI.getBrandRecommendations(),
        discoveryAPI.getTopicRecommendations(),
      ]);

      set({
        userRecommendations: userRecs,
        brandRecommendations: brandRecs,
        topicRecommendations: topicRecs,
      });
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  },

  // Dismiss recommendation
  dismissRecommendation: (type: string, id: string) => {
    const key = `${type}Recommendations` as keyof DiscoveryState;
    set(state => ({
      [key]: (state[key] as Recommendation[]).filter(rec => rec.id !== id),
    }));

    // Report dismissal to backend
    discoveryAPI.dismissRecommendation(type, id).catch(console.error);
  },

  // Utilities
  setLoading: (loading: boolean) => set({discoveryLoading: loading}),
  setError: (error: string | null) => set({error}),
}));
