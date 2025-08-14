import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserAnalytics,
  AnalyticsFilters,
  ExportOptions,
  ANALYTICS_CONSTANTS,
  DATE_PRESETS,
} from '@/types/analytics';
import {AnalyticsService} from '../services/api/analytics';

interface AnalyticsCache {
  data: any;
  timestamp: number;
  ttl: number;
}

interface AnalyticsState {
  // Current data
  analytics: UserAnalytics | null;
  loading: boolean;
  error: string | null;

  // Filters
  filters: AnalyticsFilters;

  // Comparison
  comparisonEnabled: boolean;
  comparisonData: UserAnalytics | null;

  // Cache
  cache: Map<string, AnalyticsCache>;

  // UI State
  selectedTab: string;
  exportProgress: number;
  exportLoading: boolean;

  // Actions
  fetchAnalytics: (
    wallet?: string,
    customFilters?: Partial<AnalyticsFilters>,
  ) => Promise<void>;
  updateFilters: (newFilters: Partial<AnalyticsFilters>) => void;
  setDateRange: (preset: keyof typeof DATE_PRESETS) => void;
  toggleComparison: () => void;
  refreshMetric: (metric: string) => Promise<void>;


  // Export
  exportAnalytics: (options: ExportOptions) => Promise<string>;

  // Cache management
  clearCache: () => void;
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any, ttl?: number) => void;

  // UI Actions
  setSelectedTab: (tab: string) => void;
  clearError: () => void;
}


export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Initial state
      analytics: null,
      loading: false,
      error: null,

      filters: {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date(),
          preset: 'month',
        },
        granularity: 'day',
      },

      comparisonEnabled: false,
      comparisonData: null,

      cache: new Map(),
      selectedTab: 'overview',
      exportProgress: 0,
      exportLoading: false,

      // Fetch analytics data
      fetchAnalytics: async (wallet, customFilters) => {
        set({loading: true, error: null});

        try {
          const currentFilters = customFilters
            ? {...get().filters, ...customFilters}
            : get().filters;

          // Generate cache key
          const cacheKey = `analytics-${wallet}-${JSON.stringify(
            currentFilters,

          // Check cache first
          const cached = get().getCachedData(cacheKey);
          if (cached) {
            set({
              analytics: cached,
              loading: false,
              filters: currentFilters, 
            });
            return;
          }

          // Fetch from API
          const analytics: UserAnalytics =
            await AnalyticsService.getUserAnalytics(wallet, currentFilters);

          // Cache the result
          get().setCachedData(cacheKey, analytics);

          // Fetch comparison data if enabled
          let comparisonData = null;
          if (get().comparisonEnabled) {
            const duration =
              currentFilters.dateRange.end.getTime() -
              currentFilters.dateRange.start.getTime();
            const comparisonStart = new Date(
              currentFilters.dateRange.start.getTime() - duration,
            );
            const comparisonEnd = new Date(
              currentFilters.dateRange.start.getTime() - 1,
            );

            try {
              const comparisonFilters = {
                ...currentFilters,
                dateRange: {
                  start: comparisonStart,
                  end: comparisonEnd,
                  preset: undefined,
                },
              };
              comparisonData = await AnalyticsService.getUserAnalytics(
                wallet,
                comparisonFilters,
              );
            } catch (compError) {
              console.warn('Failed to fetch comparison data:', compError);
            }
          }

          set({
            analytics,
            comparisonData,
            loading: false,
            filters: currentFilters,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch analytics',
            loading: false,
          });
        }
      },

      // Update filters
      updateFilters: newFilters => {
        const updatedFilters = {...get().filters, ...newFilters};
        set({filters: updatedFilters});

        // Auto-refresh if filters changed significantly
        if (newFilters.dateRange || newFilters.granularity) {
          // Will be called with wallet from component using this store
          // get().fetchAnalytics(wallet);
        }
      },

      // Set date range preset
      setDateRange: preset => {
        const now = new Date();
        const presetConfig = DATE_PRESETS[preset];

        let start: Date;
        if (preset === 'today') {
          start = new Date(now.setHours(0, 0, 0, 0));
        } else if (preset === 'all') {
          start = new Date(0); // Unix epoch
        } else {
          start = new Date(
            now.getTime() - (presetConfig.days || 30) * 24 * 60 * 60 * 1000,
          );
        }

        get().updateFilters({
          dateRange: {
            start,
            end: new Date(),
            preset,
          },
        });
      },

      // Toggle comparison mode
      toggleComparison: () => {
        const comparisonEnabled = !get().comparisonEnabled;
        set({comparisonEnabled, comparisonData: null});

        if (comparisonEnabled) {
          // Will be called with wallet from component using this store
          // get().fetchAnalytics(wallet);
        }
      },

      // Refresh specific metric
      refreshMetric: async (metric, wallet) => {
        try {
          const data = await AnalyticsService.getMetric(wallet, metric);

          set(state => ({
            analytics: state.analytics
              ? {
                  ...state.analytics,
                  [metric]: data,
                }
              : null,
          }));
        } catch (error) {
          console.error('Failed to refresh metric:', error);
        }
      },


      // Export analytics data
      exportAnalytics: async (options, wallet) => {
        set({exportLoading: true, exportProgress: 0});

        try {
          const {analytics, filters} = get();

          if (!analytics) {
            throw new Error('No analytics data to export');
          }

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            set(state => ({
              exportProgress: Math.min(state.exportProgress + 10, 90),
            }));
          }, 200);

          try {
            const exportData = await AnalyticsService.exportAnalytics(
              wallet,
              options,
            );
            
            clearInterval(progressInterval);
            set({exportProgress: 100});

            // Clean up progress after a delay
            setTimeout(() => {
              set({exportLoading: false, exportProgress: 0});
            }, 1000);

            return exportData.url;
          } catch (error) {
            clearInterval(progressInterval); // CRITICAL: Clear interval on error too!
            set({
              exportLoading: false,
              exportProgress: 0,
              error: error instanceof Error ? error.message : 'Export failed',
            });
            throw error;
          }
        } catch (error) {
          // Outer catch for any errors before interval starts
          set({
            exportLoading: false,
            exportProgress: 0,
            error: error instanceof Error ? error.message : 'Export failed',
          });
          throw error;
        }
      },

      // Cache management
      clearCache: () => {
        set({cache: new Map()});
      },

      getCachedData: key => {
        const cached = get().cache.get(key);
        if (!cached) {return null;}

        // Check if cache is still valid
        if (Date.now() - cached.timestamp > cached.ttl) {
          const newCache = new Map(get().cache);
          newCache.delete(key);
          set({cache: newCache});
          return null;
        }

        return cached.data;
      },

      setCachedData: (
        key,
        data,
        ttl = ANALYTICS_CONSTANTS.DEFAULT_CACHE_TTL,
      ) => {
        const newCache = new Map(get().cache);
        newCache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        });

        // Limit cache size
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }

        set({cache: newCache});
      },

      // UI Actions
      setSelectedTab: tab => {
        set({selectedTab: tab});
      },

      clearError: () => {
        set({error: null});
      },
    }),
    {
      name: 'analytics-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        filters: state.filters,
        comparisonEnabled: state.comparisonEnabled,
        selectedTab: state.selectedTab,
      }),
    },
  ),
);
