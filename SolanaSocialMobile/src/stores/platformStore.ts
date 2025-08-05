import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Platform,
  PlatformVote,
  PlatformCreationRequest,
  PlatformUpdateRequest,
  PlatformAnalytics,
  PlatformDiscoveryFilters,
  PlatformRankingData,
  PlatformSearchResult,
  PlatformStatistics,
  UserPlatformInteraction,
  PlatformRecommendation,
  VotingWeight,
  PlatformHealth,
} from '../types/platform';
import {analyticsService} from '../services/analytics/analyticsService';
import {API_CONFIG} from '../config/api';

// Use centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface PlatformStore {
  // State
  platforms: Platform[];
  userPlatforms: Platform[];
  selectedPlatform: Platform | null;
  platformAnalytics: PlatformAnalytics | null;
  platformRankings: PlatformRankingData | null;
  platformStatistics: PlatformStatistics | null;
  userVotes: PlatformVote[];
  userInteractions: UserPlatformInteraction[];
  recommendations: PlatformRecommendation[];
  searchResults: PlatformSearchResult | null;
  votingWeight: VotingWeight | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isVoting: boolean;
  isSearching: boolean;
  error: string | null;

  // Cache management
  lastFetchTime: number;
  cacheExpiration: number; // 5 minutes

  // Platform discovery
  fetchPlatforms: (filters?: PlatformDiscoveryFilters) => Promise<void>;
  fetchUserPlatforms: () => Promise<void>;
  fetchPlatformRankings: () => Promise<void>;
  fetchPlatformStatistics: () => Promise<void>;
  searchPlatforms: (
    query: string,
    filters?: PlatformDiscoveryFilters,
  ) => Promise<void>;
  fetchRecommendations: () => Promise<void>;

  // Voting system
  votePlatform: (
    platformId: string,
    voteType: 'upvote' | 'downvote',
  ) => Promise<void>;
  fetchUserVotes: () => Promise<void>;
  fetchVotingWeight: () => Promise<void>;

  // Analytics
  fetchPlatformAnalytics: (platformId: string) => Promise<void>;
  fetchPlatformHealth: (platformId: string) => Promise<PlatformHealth>;

  // User interactions
  trackPlatformView: (platformId: string) => Promise<void>;
  bookmarkPlatform: (platformId: string) => Promise<void>;
  reportPlatform: (platformId: string, reason: string) => Promise<void>;
  fetchUserInteractions: () => Promise<void>;

  // Cache management
  invalidateCache: () => void;
  refreshAll: () => Promise<void>;

  // UI state management
  setSelectedPlatform: (platform: Platform | null) => void;
  clearError: () => void;
  clearSearchResults: () => void;
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set, get) => ({
      platforms: [],
      userPlatforms: [],
      selectedPlatform: null,
      platformAnalytics: null,
      platformRankings: null,
      platformStatistics: null,
      userVotes: [],
      userInteractions: [],
      recommendations: [],
      searchResults: null,
      votingWeight: null,
      isLoading: false,
      isCreating: false,
      isVoting: false,
      isSearching: false,
      error: null,
      lastFetchTime: 0,
      cacheExpiration: 5 * 60 * 1000, // 5 minutes

      fetchPlatforms: async filters => {
        const state = get();
        const now = Date.now();

        // Check cache validity
        if (
          state.platforms.length > 0 &&
          now - state.lastFetchTime < state.cacheExpiration &&
          !filters
        ) {
          return;
        }

        set({isLoading: true, error: null});

        try {
          const params = new URLSearchParams();
          if (filters?.category) {params.append("category", filters.category);}
          if (filters?.minRating)
            params.append('min_rating', filters.minRating.toString());
          if (filters?.maxFee)
            params.append('max_fee', filters.maxFee.toString());
          if (filters?.verified !== undefined)
            params.append('verified', filters.verified.toString());
          if (filters?.active !== undefined)
            params.append('active', filters.active.toString());
          if (filters?.sortBy) {params.append("sort", filters.sortBy);}
          if (filters?.search) {params.append("search", filters.search);}

          // Mock API response for development
          const mockPlatforms: Platform[] = [
            {
              id: 'platform-1',
              platformId: 'gaming-platform-1',
              ownerWallet: 'EXample1111111111111111111111111111111111',
              platformName: 'GameVerse Hub',
              platformUrl: 'https://gameverse.hub',
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-02-20T15:30:00Z',
              feeRecipient: 'EXample1111111111111111111111111111111111',
              rentalPeriodSlots: 1000,
              platformFee: 2500000, // 0.0025 SOL
              activityStatus: 'active',
              platformRating: 4.8,
              totalVotes: 1250,
              totalAuctionsHosted: 45,
              totalRevenueGenerated: 15750000000, // 15.75 SOL
              isVerified: true,
              needsSecondSigner: false,
              platformPDA: 'GameVersePDA111111111111111111111111111',
              onChainVerified: true,
              description:
                'Premier gaming platform for Web3 games and NFT marketplaces',
              category: 'gaming',
              tags: ['gaming', 'nft', 'web3'],
              logoUrl: 'https://gameverse.hub/logo.png',
            },
            {
              id: 'platform-2',
              platformId: 'defi-platform-1',
              ownerWallet: 'EXample2222222222222222222222222222222222',
              platformName: 'DeFi Central',
              platformUrl: 'https://defi.central',
              createdAt: '2024-01-20T14:00:00Z',
              updatedAt: '2024-02-18T09:15:00Z',
              feeRecipient: 'EXample2222222222222222222222222222222222',
              rentalPeriodSlots: 1500,
              platformFee: 3000000, // 0.003 SOL
              activityStatus: 'active',
              platformRating: 4.6,
              totalVotes: 890,
              totalAuctionsHosted: 32,
              totalRevenueGenerated: 12300000000, // 12.3 SOL
              isVerified: true,
              needsSecondSigner: true,
              secondSigner: 'EXample3333333333333333333333333333333333',
              platformPDA: 'DeFiCentralPDA111111111111111111111111111',
              onChainVerified: true,
              description:
                'Comprehensive DeFi platform for yield farming and liquidity provision',
              category: 'defi',
              tags: ['defi', 'yield', 'liquidity'],
              logoUrl: 'https://defi.central/logo.png',
            },
            {
              id: 'platform-3',
              platformId: 'social-platform-1',
              ownerWallet: 'EXample4444444444444444444444444444444444',
              platformName: 'SocialDAO',
              platformUrl: 'https://social.dao',
              createdAt: '2024-02-01T16:00:00Z',
              updatedAt: '2024-02-22T11:45:00Z',
              feeRecipient: 'EXample4444444444444444444444444444444444',
              rentalPeriodSlots: 800,
              platformFee: 2000000, // 0.002 SOL
              activityStatus: 'active',
              platformRating: 4.3,
              totalVotes: 567,
              totalAuctionsHosted: 18,
              totalRevenueGenerated: 7800000000, // 7.8 SOL
              isVerified: false,
              needsSecondSigner: false,
              platformPDA: 'SocialDAOPDA1111111111111111111111111111',
              onChainVerified: true,
              description:
                'Decentralized social media platform with token-gated communities',
              category: 'social',
              tags: ['social', 'community', 'dao'],
              logoUrl: 'https://social.dao/logo.png',
            },
          ];

          // Apply filters to mock data
          let filteredPlatforms = mockPlatforms;

          if (filters?.category) {
            filteredPlatforms = filteredPlatforms.filter(
              p => p.category === filters.category,
            );
          }

          if (filters?.minRating) {
            filteredPlatforms = filteredPlatforms.filter(
              p => p.platformRating >= filters.minRating!,
            );

          if (filters?.maxFee) {
            filteredPlatforms = filteredPlatforms.filter(
              p => p.platformFee / 1000000 <= filters.maxFee!,
            );

          if (filters?.verified !== undefined) {
            filteredPlatforms = filteredPlatforms.filter(
              p => p.isVerified === filters.verified,
            );
          }

          if (filters?.active !== undefined) {
            const isActive = filters.active;
            filteredPlatforms = filteredPlatforms.filter(p =>
              isActive
                ? p.activityStatus === 'active'
                : p.activityStatus !== 'active',
            );
          }

          if (filters?.search) {
            const query = filters.search.toLowerCase();
            filteredPlatforms = filteredPlatforms.filter(
              p =>
                p.platformName.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.tags?.some(tag => tag.toLowerCase().includes(query)),
            );
          }

          // Apply sorting
          if (filters?.sortBy) {
            switch (filters.sortBy) {
              case 'rating':
                filteredPlatforms.sort(
                  (a, b) => b.platformRating - a.platformRating,
                );
                break;
              case 'revenue':
                filteredPlatforms.sort(
                  (a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated,
                );
                break;
              case 'auctions':
                filteredPlatforms.sort(
                  (a, b) => b.totalAuctionsHosted - a.totalAuctionsHosted,
                );
                break;
              case 'created':
                filteredPlatforms.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                );
                break;
              case 'alphabetical':
                filteredPlatforms.sort((a, b) =>
                  a.platformName.localeCompare(b.platformName),
                );
                break;
              case 'fee_low':
                filteredPlatforms.sort((a, b) => a.platformFee - b.platformFee);
                break;
              case 'fee_high':
                filteredPlatforms.sort((a, b) => b.platformFee - a.platformFee);
                break;
            }
          }

          set({
            platforms: filteredPlatforms,
            isLoading: false,
            lastFetchTime: now,
          });

          // Track analytics
          analyticsService.trackEvent('platforms_fetched', {
            filter_count: Object.keys(filters || {}).length,
            result_count: filteredPlatforms.length,
            has_search: !!filters?.search,
            category: filters?.category,
            sort_by: filters?.sortBy,
          });
        } catch (error) {
          console.error('Error fetching platforms:', error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch platforms',
          });

          analyticsService.trackEvent('platforms_fetch_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },

      fetchUserPlatforms: async () => {
        try {
          // Mock user platforms - in production this would fetch user's owned platforms
          const mockUserPlatforms: Platform[] = [];

          set({userPlatforms: mockUserPlatforms});
        } catch (error) {
          console.error('Failed to fetch user platforms:', error);
        }
      },

      fetchPlatformRankings: async () => {
        set({isLoading: true, error: null});

        try {
          // Mock ranking data
          const platforms = get().platforms;
          const rankingEntries = platforms
            .map((platform, index) => ({
              rank: index + 1,
              platform,
              score: platform.platformRating * 20 + platform.totalVotes * 0.01,
              scoreComponents: {
                rating: platform.platformRating,
                volume: platform.totalRevenueGenerated / 1000000000,
                activity: platform.totalAuctionsHosted,
                reliability: platform.isVerified ? 1.0 : 0.8,
              },
              trend:
                Math.random() > 0.5
                  ? 'up'
                  : ((Math.random() > 0.5 ? 'down' : 'stable') as
                      | 'up'
                      | 'down'
                      | 'stable'),
              previousRank:
                Math.random() > 0.5
                  ? index + Math.floor(Math.random() * 3) - 1
                  : undefined,
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({...entry, rank: index + 1}));

          const platformRankings: PlatformRankingData = {
            platforms: rankingEntries,
            totalPlatforms: platforms.length,
            lastUpdated: new Date().toISOString(),
          };

          set({platformRankings, isLoading: false});

          analyticsService.trackEvent('platform_rankings_fetched', {
            total_platforms: platformRankings.totalPlatforms,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch rankings',
          });
        }
      },

      fetchPlatformStatistics: async () => {
        try {
          const platforms = get().platforms;

          const statistics: PlatformStatistics = {
            totalPlatforms: platforms.length,
            activePlatforms: platforms.filter(
              p => p.activityStatus === 'active',
            ).length,
            verifiedPlatforms: platforms.filter(p => p.isVerified).length,
            averageRating:
              platforms.reduce((sum, p) => sum + p.platformRating, 0) /
              platforms.length,
            totalRevenue: platforms.reduce(
              (sum, p) => sum + p.totalRevenueGenerated,
              0,
            ),
            totalAuctions: platforms.reduce(
              (sum, p) => sum + p.totalAuctionsHosted,
              0,
            ),
            categoryCounts: platforms.reduce((counts, p) => {
              if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
              }
              return counts;
            }, {} as Record<any, number>),
            recentActivity: [], // Would be populated with real activity data
          };

          set({platformStatistics: statistics});
        } catch (error) {
          console.error('Failed to fetch platform statistics:', error);
        }
      },

      searchPlatforms: async (query, filters) => {
        set({isSearching: true, error: null});

        try {
          const platforms = get().platforms;
          const searchQuery = query.toLowerCase();

          let results = platforms.filter(
            platform =>
              platform.platformName.toLowerCase().includes(searchQuery) ||
              platform.description?.toLowerCase().includes(searchQuery) ||
              platform.tags?.some(tag =>
                tag.toLowerCase().includes(searchQuery),
              ) ||
              platform.category?.toLowerCase().includes(searchQuery),
          );

          // Apply additional filters if provided
          if (filters) {
            if (filters.category) {
              results = results.filter(p => p.category === filters.category);
            }
            if (filters.minRating) {
              results = results.filter(
                p => p.platformRating >= filters.minRating!,
              );
            }
            if (filters.verified !== undefined) {
              results = results.filter(p => p.isVerified === filters.verified);
            }
          }

          const searchResults: PlatformSearchResult = {
            platforms: results,
            totalCount: results.length,
            hasNextPage: false,
            filters: filters || {},
            suggestions: ['gaming', 'defi', 'nft', 'social'], // Mock suggestions
          };

          set({searchResults, isSearching: false});

          analyticsService.trackEvent('platforms_searched', {
            query,
            result_count: results.length,
            has_filters: !!filters && Object.keys(filters).length > 0,
          });
        } catch (error) {
          set({
            isSearching: false,
            error: error instanceof Error ? error.message : 'Search failed',
          });
        }
      },

      fetchRecommendations: async () => {
        try {
          const platforms = get().platforms;

          // Mock recommendation algorithm
          const recommendations: PlatformRecommendation[] = platforms
            .slice(0, 3)
            .map(platform => ({
              platform,
              score: Math.random() * 100,
              reasons: [
                {
                  type: 'rating_similar' as const,
                  description: 'High user rating',
                  weight: 0.4,
                },
                {
                  type: 'trending' as const,
                  description: 'Trending in your interests',
                  weight: 0.3,
                },
              ],
              category: 'trending' as const,
            }));

          set({recommendations});
        } catch (error) {
          console.error('Failed to fetch recommendations:', error);
        }
      },

      votePlatform: async (platformId, voteType) => {
        set({isVoting: true, error: null});

        try {
          // Mock voting process
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Update local platform vote count
          const platforms = get().platforms.map(platform => {
            if (platform.id === platformId) {
              return {
                ...platform,
                totalVotes: platform.totalVotes + 1,
                platformRating:
                  voteType === 'upvote'
                    ? Math.min(5.0, platform.platformRating + 0.01)
                    : Math.max(1.0, platform.platformRating - 0.01),
              };
            }
            return platform;
          });

          // Add to user votes
          const newVote: PlatformVote = {
            id: `vote-${Date.now()}`,
            platformId,
            voterWallet: 'UserWallet111111111111111111111111111111',
            voteType,
            createdAt: new Date().toISOString(),
            onChainVerified: false,
          };

          const userVotes = get().userVotes.filter(
            v => v.platformId !== platformId,
          );
          userVotes.push(newVote);

          set({
            platforms,
            userVotes,
            isVoting: false,
          });

          analyticsService.trackEvent('platform_voted', {
            platform_id: platformId,
            vote_type: voteType,
          });
        } catch (error) {
          set({
            isVoting: false,
            error: error instanceof Error ? error.message : 'Failed to vote',
          });
          throw error;
        }
      },

      fetchUserVotes: async () => {
        try {
          // Mock user votes
          const mockVotes: PlatformVote[] = [];
          set({userVotes: mockVotes});
        } catch (error) {
          console.error('Failed to fetch user votes:', error);
        }
      },

      fetchVotingWeight: async () => {
        try {
          // Mock voting weight calculation
          const mockWeight: VotingWeight = {
            userId: 123,
            baseWeight: 1.0,
            stakeWeight: 0.5,
            reputationWeight: 0.3,
            totalWeight: 1.8,
            calculations: {
              solanaStake: 10.5,
              platformHistory: 0.8,
              accountAge: 0.6,
              verificationLevel: 1.0,
            },
          };

          set({votingWeight: mockWeight});
        } catch (error) {
          console.error('Failed to fetch voting weight:', error);
        }
      },

      fetchPlatformAnalytics: async platformId => {
        set({isLoading: true, error: null});

        try {
          // Mock analytics data
          const mockAnalytics: PlatformAnalytics = {
            platformId,
            totalRevenue: 15750000000,
            monthlyRevenue: 2500000000,
            revenueGrowth: 12.5,
            totalAuctions: 45,
            activeAuctions: 3,
            completedAuctions: 42,
            averageAuctionValue: 350000000,
            platformRating: 4.8,
            ratingTrend: 0.2,
            totalVotes: 1250,
            positiveVotePercentage: 87.5,
            totalViews: 15420,
            uniqueVisitors: 8930,
            clickThroughRate: 0.145,
            conversionRate: 0.032,
            totalAdvertisers: 28,
            repeatAdvertisers: 19,
            advertiserSatisfaction: 4.6,
            revenueHistory: [],
            ratingHistory: [],
            trafficHistory: [],
          };

          set({platformAnalytics: mockAnalytics, isLoading: false});

          analyticsService.trackEvent('platform_analytics_viewed', {
            platform_id: platformId,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch analytics',
          });
        }
      },

      fetchPlatformHealth: async platformId => {
        // Mock health check
        const health: PlatformHealth = {
          score: Math.floor(Math.random() * 30) + 70, // 70-100
          uptime: 99.2,
          responseTime: Math.floor(Math.random() * 500) + 100,
          errorRate: Math.random() * 2,
          lastChecked: new Date().toISOString(),
          issues: [],
        };

        return health;
      },

      trackPlatformView: async platformId => {
        try {
          const interaction: UserPlatformInteraction = {
            id: `interaction-${Date.now()}`,
            userId: 123,
            platformId,
            interactionType: 'view',
            timestamp: new Date().toISOString(),
          };

          const userInteractions = [...get().userInteractions, interaction];
          set({userInteractions});

          analyticsService.trackEvent('platform_viewed', {
            platform_id: platformId,
          });
        } catch (error) {
          console.error('Failed to track platform view:', error);
        }
      },

      bookmarkPlatform: async platformId => {
        try {
          const interaction: UserPlatformInteraction = {
            id: `bookmark-${Date.now()}`,
            userId: 123,
            platformId,
            interactionType: 'bookmark',
            timestamp: new Date().toISOString(),
          };

          const userInteractions = [...get().userInteractions, interaction];
          set({userInteractions});

          analyticsService.trackEvent('platform_bookmarked', {
            platform_id: platformId,
          });
        } catch (error) {
          console.error('Failed to bookmark platform:', error);
        }
      },

      reportPlatform: async (platformId, reason) => {
        try {
          const interaction: UserPlatformInteraction = {
            id: `report-${Date.now()}`,
            userId: 123,
            platformId,
            interactionType: 'report',
            timestamp: new Date().toISOString(),
            metadata: {reason},
          };

          const userInteractions = [...get().userInteractions, interaction];
          set({userInteractions});

          analyticsService.trackEvent('platform_reported', {
            platform_id: platformId,
            reason,
          });
        } catch (error) {
          console.error('Failed to report platform:', error);
        }
      },

      fetchUserInteractions: async () => {
        try {
          // In production, this would fetch from the backend
          // For now, we'll use the local state
        } catch (error) {
          console.error('Failed to fetch user interactions:', error);
        }
      },

      invalidateCache: () => {
        set({
          lastFetchTime: 0,
          platforms: [],
          platformRankings: null,
          platformStatistics: null,
        });
      },

      refreshAll: async () => {
        const actions = get();
        await Promise.all([
          actions.fetchPlatforms(),
          actions.fetchPlatformRankings(),
          actions.fetchPlatformStatistics(),
          actions.fetchUserVotes(),
          actions.fetchRecommendations(),
        ]);
      },

      setSelectedPlatform: platform => {
        set({selectedPlatform: platform});
        if (platform) {
          get().trackPlatformView(platform.id);
        }
      },

      clearError: () => set({error: null}),

      clearSearchResults: () => set({searchResults: null}),
    }),
    {
      name: 'platform-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        userVotes: state.userVotes,
        userInteractions: state.userInteractions,
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
