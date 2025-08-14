import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DiscoveryFeed,
  SearchResult,
  DiscoveryPreferences,
  TrendingTimeframe,
  ContentCategory,
  PopularCreator,
  ExploreSection,
  InteractionEvent,
  TrendingPost,
  RecommendedPost,
} from '@/types/discovery';
import apiClient from '../services/api';

interface DiscoveryState {
  // Discovery feed
  discoveryFeed: DiscoveryFeed | null;
  exploreSections: ExploreSection[];

  // Search
  searchResults: SearchResult | null;
  searchHistory: string[];
  searchSuggestions: string[];

  // Preferences
  preferences: DiscoveryPreferences;

  // Categories and creators
  categories: ContentCategory[];
  popularCreators: PopularCreator[];

  // UI state
  loading: boolean;
  refreshing: boolean;
  searching: boolean;
  error: string | null;

  // Current state
  currentTrendingTimeframe: TrendingTimeframe;
  currentSearchQuery: string;

  // Actions
  fetchDiscoveryFeed: (force?: boolean) => Promise<void>;
  refreshDiscoveryFeed: () => Promise<void>;

  // Search
  search: (query: string, filters?: any) => Promise<void>;
  clearSearch: () => void;
  saveSearchQuery: (query: string) => void;
  getSearchSuggestions: (query: string) => Promise<string[]>;

  // Trending
  setTrendingTimeframe: (timeframe: TrendingTimeframe) => void;
  fetchTrendingContent: (timeframe: TrendingTimeframe) => Promise<void>;

  // Categories
  fetchCategories: () => Promise<void>;
  followCategory: (categoryId: string) => Promise<void>;
  unfollowCategory: (categoryId: string) => Promise<void>;

  // Creators
  fetchPopularCreators: () => Promise<void>;
  followCreator: (wallet: string) => Promise<void>;
  unfollowCreator: (wallet: string) => Promise<void>;

  // Preferences
  updatePreferences: (updates: Partial<DiscoveryPreferences>) => Promise<void>;
  recordInteraction: (event: InteractionEvent) => void;

  // Content actions
  bookmarkPost: (postId: string) => Promise<void>;
  hidePost: (postId: string) => void;
  reportPost: (postId: string, reason: string) => Promise<void>;

  // Explore sections
  loadExploreSection: (sectionId: string) => Promise<void>;
  refreshExploreSection: (sectionId: string) => Promise<void>;

  // Utils
  clearError: () => void;
}

const defaultPreferences: DiscoveryPreferences = {
  preferredCategories: [],
  excludedCategories: [],
  preferredLanguages: ['en'],
  personalizedRecommendations: true,
  trendingWeight: 50,
  diversityWeight: 30,
  freshnessWeight: 20,
  minimumVoteScore: 0,
  excludeNSFW: true,
  showOnlyVerified: false,
  hideDownvoted: true,
  followingWeight: 70,
  discoverNewCreators: true,
  similarCreatorsWeight: 40,
  viewedPosts: [],
  dismissedRecommendations: [],
  interactionHistory: [],
};

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      discoveryFeed: null,
      exploreSections: [],
      searchResults: null,
      searchHistory: [],
      searchSuggestions: [],
      preferences: defaultPreferences,
      categories: [],
      popularCreators: [],
      loading: false,
      refreshing: false,
      searching: false,
      error: null,
      currentTrendingTimeframe: '24h',
      currentSearchQuery: '',

      fetchDiscoveryFeed: async (force = false) => {
        const {discoveryFeed} = get();
        if (
          !force &&
          discoveryFeed &&
          new Date(discoveryFeed.lastUpdated).getTime() >
            Date.now() - 5 * 60 * 1000
        ) {
          return; // Cache for 5 minutes
        }

        set({loading: true, error: null});
        try {
          const response = await apiClient.get('/discovery/feed');

          if (response.data.success) {
            set({
              discoveryFeed: response.data.data,
              loading: false, 
            });
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch discovery feed',
            loading: false, 
          });
        }
      },

      refreshDiscoveryFeed: async () => {
        set({refreshing: true});
        await get().fetchDiscoveryFeed(true);
        set({refreshing: false});
      },

      search: async (query: string, filters?: any) => {
        set({searching: true, error: null, currentSearchQuery: query});

        try {
          const response = await apiClient.post('/discovery/search', {
            query,
            filters,
            preferences: get().preferences,
          });

          if (response.data.success) {
            set({
              searchResults: response.data.data,
              searching: false, 
            });

            // Save to search history
            get().saveSearchQuery(query);
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({
            error: error.message || 'Search failed',
            searching: false, 
          });
        }
      },

      clearSearch: () => {
        set({searchResults: null, currentSearchQuery: ''});
      },

      saveSearchQuery: (query: string) => {
        const {searchHistory} = get();
        const filtered = searchHistory.filter(q => q !== query);
        set({searchHistory: [query, ...filtered].slice(0, 10)});
      },

      getSearchSuggestions: async (query: string) => {
        try {
          const response = await apiClient.get(
            `/discovery/suggestions?q=${query}`,

          if (response.data.success) {
            set({searchSuggestions: response.data.data});
            return response.data.data;
          }
        } catch (error) {
          console.error('Failed to get search suggestions:', error);
        }
        return [];
      },

      setTrendingTimeframe: (timeframe: TrendingTimeframe) => {
        set({currentTrendingTimeframe: timeframe});
        get().fetchTrendingContent(timeframe);
      },

      fetchTrendingContent: async (timeframe: TrendingTimeframe) => {
        set({loading: true, error: null});

        try {
          const response = await apiClient.get(
            `/discovery/trending?timeframe=${timeframe}`,

          if (response.data.success) {
            set(state => ({
              discoveryFeed: state.discoveryFeed
                ? {
                    ...state.discoveryFeed,
                    trending: {
                      ...response.data.data,
                      timeframe,
                    },
                  }
                : null,
              loading: false,
            }));
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch trending content',
            loading: false, 
          });
        }
      },

      fetchCategories: async () => {
        try {
          const response = await apiClient.get('/discovery/categories');

          if (response.data.success) {
            set({categories: response.data.data});
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      },

      followCategory: async (categoryId: string) => {
        try {
          const response = await apiClient.post(
            `/discovery/categories/${categoryId}/follow`,

          if (response.data.success) {
            set(state => ({
              categories: state.categories.map(cat =>
                cat.id === categoryId ? {...cat, userFollowing: true} : cat,
              ),
              preferences: {
                ...state.preferences,
                preferredCategories: [
                  ...state.preferences.preferredCategories,
                  categoryId,
                ],
              },
            }));
          }
        } catch (error) {
          console.error('Failed to follow category:', error);
        }
      },

      unfollowCategory: async (categoryId: string) => {
        try {
          const response = await apiClient.delete(
            `/discovery/categories/${categoryId}/follow`,

          if (response.data.success) {
            set(state => ({
              categories: state.categories.map(cat =>
                cat.id === categoryId ? {...cat, userFollowing: false} : cat,
              ),
              preferences: {
                ...state.preferences,
                preferredCategories:
                  state.preferences.preferredCategories.filter(
                    id => id !== categoryId,
                  ),
              },
            }));
          }
        } catch (error) {
          console.error('Failed to unfollow category:', error);
        }
      },

      fetchPopularCreators: async () => {
        try {
          const response = await apiClient.get('/discovery/creators/popular');

          if (response.data.success) {
            set({popularCreators: response.data.data});
          }
        } catch (error) {
          console.error('Failed to fetch popular creators:', error);
        }
      },

      followCreator: async (wallet: string) => {
        try {
          const response = await apiClient.post(`/users/${wallet}/follow`);

          if (response.data.success) {
            set(state => ({
              popularCreators: state.popularCreators.map(creator =>
                creator.wallet === wallet
                  ? {...creator, userFollowing: true}
                  : creator,
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to follow creator:', error);
        }
      },

      unfollowCreator: async (wallet: string) => {
        try {
          const response = await apiClient.delete(`/users/${wallet}/follow`);

          if (response.data.success) {
            set(state => ({
              popularCreators: state.popularCreators.map(creator =>
                creator.wallet === wallet
                  ? {...creator, userFollowing: false}
                  : creator,
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to unfollow creator:', error);
        }
      },

      updatePreferences: async (updates: Partial<DiscoveryPreferences>) => {
        const newPreferences = {...get().preferences, ...updates};
        set({preferences: newPreferences});

        try {
          await apiClient.put('/discovery/preferences', newPreferences);
        } catch (error) {
          console.error('Failed to update preferences:', error);
        }
      },

      recordInteraction: (event: InteractionEvent) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            interactionHistory: [
              event,
              ...state.preferences.interactionHistory.slice(0, 99),
            ],
          },
        }));

        // Send to backend asynchronously
        apiClient.post('/discovery/interactions', event).catch(console.error);
      },

      bookmarkPost: async (postId: string) => {
        try {
          await apiClient.post(`/posts/${postId}/bookmark`);

          // Update local state if the post is in discovery feed
          set(state => {
            if (!state.discoveryFeed) {return state;}

            const updatePost = (post: TrendingPost | RecommendedPost) =>
              post.id === postId ? {...post, userBookmarked: true} : post;

            return {
              discoveryFeed: {
                ...state.discoveryFeed,
                trending: {
                  ...state.discoveryFeed.trending,
                  posts: state.discoveryFeed.trending.posts.map(updatePost),
                },
                recommended: {
                  forYou:
                    state.discoveryFeed.recommended.forYou.map(updatePost),
                  similarToLiked:
                    state.discoveryFeed.recommended.similarToLiked.map(
                      updatePost,
                    ),
                  fromFollowing:
                    state.discoveryFeed.recommended.fromFollowing.map(
                      updatePost,
                    ),
                  basedOnActivity:
                    state.discoveryFeed.recommended.basedOnActivity.map(
                      updatePost,
                    ),
                },
              },
            };
          });
        } catch (error) {
          console.error('Failed to bookmark post:', error);
        }
      },

      hidePost: (postId: string) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            dismissedRecommendations: [
              ...state.preferences.dismissedRecommendations,
              postId,
            ],
          },

        // Remove from current feed
        set(state => {
          if (!state.discoveryFeed) {return state;}

          const filterPost = (post: TrendingPost | RecommendedPost) =>
            post.id !== postId;

          return {
            discoveryFeed: {
              ...state.discoveryFeed,
              trending: {
                ...state.discoveryFeed.trending,
                posts: state.discoveryFeed.trending.posts.filter(filterPost),
              },
              recommended: {
                forYou:
                  state.discoveryFeed.recommended.forYou.filter(filterPost),
                similarToLiked:
                  state.discoveryFeed.recommended.similarToLiked.filter(
                    filterPost,
                  ),
                fromFollowing:
                  state.discoveryFeed.recommended.fromFollowing.filter(
                    filterPost,
                  ),
                basedOnActivity:
                  state.discoveryFeed.recommended.basedOnActivity.filter(
                    filterPost,
                  ),
              },
            },
          };
        });
      },

      reportPost: async (postId: string, reason: string) => {
        try {
          await apiClient.post(`/posts/${postId}/report`, {reason});
          get().hidePost(postId);
        } catch (error) {
          console.error('Failed to report post:', error);
        }
      },

      loadExploreSection: async (sectionId: string) => {
        set(state => ({
          exploreSections: state.exploreSections.map(section =>
            section.id === sectionId ? {...section, loading: true} : section,
          ),
        }));

        try {
          const response = await apiClient.get(
            `/discovery/sections/${sectionId}`,

          if (response.data.success) {
            set(state => ({
              exploreSections: state.exploreSections.map(section =>
                section.id === sectionId
                  ? {...section, items: response.data.data, loading: false}
                  : section,
              ),
            }));
          }
        } catch (error) {
          console.error(`Failed to load section ${sectionId}:`, error);
          set(state => ({
            exploreSections: state.exploreSections.map(section =>
              section.id === sectionId ? {...section, loading: false} : section,
            ),
          }));
        }
      },

      refreshExploreSection: async (sectionId: string) => {
        await get().loadExploreSection(sectionId);
      },

      clearError: () => set({error: null}),
    }),
    {
      name: 'discovery-storage',
      storage: {
        getItem: async name => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Failed to get/parse item from AsyncStorage:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async name => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: state => ({
        preferences: state.preferences,
        searchHistory: state.searchHistory,
      }),
    },
  ),
);
