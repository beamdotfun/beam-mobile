import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api/client';
import {
  FeeAnalytics,
  FeeSummary,
  FeeFilter,
  FeeOptimization,
  AnalyticsPeriod,
  FeeExport,
} from '@/types/fee-analytics';

interface FeeAnalyticsState {
  // Analytics data
  analytics: Record<AnalyticsPeriod, FeeAnalytics>;
  currentPeriod: AnalyticsPeriod;

  // Optimization
  optimization: FeeOptimization | null;

  // Filters
  filter: FeeFilter;

  // UI state
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Cache
  lastUpdated: Record<AnalyticsPeriod, string>;

  // Actions
  fetchAnalytics: (period: AnalyticsPeriod, force?: boolean) => Promise<void>;
  fetchOptimization: () => Promise<void>;
  updateOptimizationSettings: (settings: any) => Promise<void>;

  // Filtering
  setFilter: (filter: FeeFilter) => void;
  clearFilter: () => void;

  // Export
  exportData: (config: FeeExport) => Promise<string>;

  // Insights
  dismissInsight: (insightId: string) => Promise<void>;
  implementRecommendation: (recommendationId: string) => Promise<void>;

  // Period management
  setPeriod: (period: AnalyticsPeriod) => void;
  refreshCurrentPeriod: () => Promise<void>;
}

export const useFeeAnalyticsStore = create<FeeAnalyticsState>()(
  persist(
    (set, get) => ({
      analytics: {} as Record<AnalyticsPeriod, FeeAnalytics>,
      currentPeriod: '30d',
      optimization: null,
      filter: {},
      loading: false,
      refreshing: false,
      error: null,
      lastUpdated: {} as Record<AnalyticsPeriod, string>,

      fetchAnalytics: async (period, force = false) => {
        const {analytics, lastUpdated} = get();

        // Check if we have recent data (less than 5 minutes old)
        const cacheTime = lastUpdated[period];
        const isRecent =
          cacheTime &&
          Date.now() - new Date(cacheTime).getTime() < 5 * 60 * 1000;

        if (!force && analytics[period] && isRecent) {
          return;
        }

        set({loading: true, error: null});

        try {
          const {filter} = get();
          const response = await api.get('/analytics/fees', {
            params: {
              period,
              ...filter,
            },
          });

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to fetch analytics',
            );
          }

          const analyticsData = response.data?.data;

          set(state => ({
            analytics: {
              ...state.analytics,
              [period]: analyticsData,
            },
            lastUpdated: {
              ...state.lastUpdated,
              [period]: new Date().toISOString(),
            },
            loading: false,
          }));
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

      fetchOptimization: async () => {
        try {
          const response = await api.get('/analytics/fee-optimization');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to fetch optimization',
            );

          set({optimization: response.data?.data});
        } catch (error) {
          console.error('Failed to fetch optimization data:', error);
        }
      },

      updateOptimizationSettings: async settings => {
        try {
          const response = await api.patch(
            '/analytics/fee-optimization',
            settings,
          );

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to update settings',
            );

          set({optimization: response.data?.data});
        } catch (error) {
          throw error;
        }
      },

      setFilter: filter => {
        set({filter});
        // Refresh analytics with new filter
        const {currentPeriod} = get();
        get().fetchAnalytics(currentPeriod, true);
      },

      clearFilter: () => {
        set({filter: {}});
        const {currentPeriod} = get();
        get().fetchAnalytics(currentPeriod, true);
      },

      exportData: async config => {
        try {
          const {analytics, currentPeriod} = get();
          const data = analytics[config.period || currentPeriod];

          const response = await api.post('/analytics/fees/export', {
            data,
            config,
          });

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to export data');
          }

          return response.data?.data?.downloadUrl || '';
        } catch (error) {
          throw error;
        }
      },

      dismissInsight: async insightId => {
        try {
          const response = await api.delete(`/analytics/insights/${insightId}`);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to dismiss insight',
            );
          }

          // Remove insight from current analytics
          const {analytics, currentPeriod} = get();
          const current = analytics[currentPeriod];

          if (current) {
            set(state => ({
              analytics: {
                ...state.analytics,
                [currentPeriod]: {
                  ...current,
                  insights: current.insights.filter(i => i.id !== insightId),
                },
              },
            }));
          }
        } catch (error) {
          throw error;
        }
      },

      implementRecommendation: async recommendationId => {
        try {
          const response = await api.post(
            `/analytics/recommendations/${recommendationId}/implement`,
          );

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to implement recommendation',
            );
          }

          // Remove recommendation and refresh optimization data
          await get().fetchOptimization();
          await get().refreshCurrentPeriod();
        } catch (error) {
          throw error;
        }
      },

      setPeriod: period => {
        set({currentPeriod: period});
        get().fetchAnalytics(period);
      },

      refreshCurrentPeriod: async () => {
        set({refreshing: true});
        const {currentPeriod} = get();
        await get().fetchAnalytics(currentPeriod, true);
        set({refreshing: false});
      },
    }),
    {
      name: 'fee-analytics-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        filter: state.filter,
        currentPeriod: state.currentPeriod,
      }),
    },
  ),
);
