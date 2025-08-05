import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api/client';
import {
  UserGroupMembership,
  GroupPayout,
  GroupEarningsHistory,
  UserGroupAnalytics,
} from '@/types/user-groups';

interface UserGroupsState {
  // State
  memberships: UserGroupMembership[];
  availablePayouts: GroupPayout[];
  earningsHistory: Record<string, GroupEarningsHistory>;
  analytics: UserGroupAnalytics | null;

  // UI State
  isLoading: boolean;
  isClaimingPayout: boolean;
  error: string | null;

  // Data Operations
  loadGroupMemberships: () => Promise<void>;
  loadAvailablePayouts: () => Promise<void>;
  loadEarningsHistory: (groupId?: string) => Promise<void>;
  loadAnalytics: () => Promise<void>;

  // Payout Operations
  claimPayout: (payoutId: string) => Promise<void>;
  claimAllPayouts: () => Promise<void>;

  // UI Actions
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useUserGroupsStore = create<UserGroupsState>()(
  persist(
    (set, get) => ({
      // Initial state
      memberships: [],
      availablePayouts: [],
      earningsHistory: {},
      analytics: null,
      isLoading: false,
      isClaimingPayout: false,
      error: null,

      // Load group memberships
      loadGroupMemberships: async () => {
        set({isLoading: true, error: null});

        try {
          const response = await api.get('/users/groups');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to load group memberships',
            );
          }

          const memberships = response.data?.data || [];
          set({memberships, isLoading: false});
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to load groups',
          });
        }
      },

      // Load available payouts
      loadAvailablePayouts: async () => {
        try {
          const response = await api.get('/users/payouts/available');

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to load payouts');
          }

          const payouts = response.data?.data || [];
          set({availablePayouts: payouts});
        } catch (error) {
          console.error('Failed to load payouts:', error);
        }
      },

      // Load earnings history
      loadEarningsHistory: async groupId => {
        try {
          const endpoint = groupId
            ? `/users/earnings/history?groupId=${groupId}`
            : '/users/earnings/history';

          const response = await api.get(endpoint);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to load earnings history',
            );
          }

          const history = response.data?.data || [];

          if (groupId) {
            set(state => ({
              earningsHistory: {...state.earningsHistory, [groupId]: history},
            }));
          } else {
            // Multiple groups
            const historyMap = history.reduce((acc: any, group: any) => {
              acc[group.groupId] = group;
              return acc;
            }, {});
            set({earningsHistory: historyMap});
          }
        } catch (error) {
          console.error('Failed to load earnings history:', error);
        }
      },

      // Load analytics
      loadAnalytics: async () => {
        try {
          const response = await api.get('/users/groups/analytics');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to load analytics',
            );
          }

          const analytics = response.data?.data;
          set({analytics});
        } catch (error) {
          console.error('Failed to load analytics:', error);
        }
      },

      // Claim a single payout
      claimPayout: async payoutId => {
        set({isClaimingPayout: true, error: null});

        try {
          const response = await api.post(`/payouts/${payoutId}/claim`);

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to claim payout');
          }

          // Update payout status optimistically
          set(state => ({
            availablePayouts: state.availablePayouts.map(payout =>
              payout.id === payoutId
                ? {...payout, status: 'processing' as const}
                : payout,
            ),
            isClaimingPayout: false,
          }));

          // Refresh data
          await get().loadAvailablePayouts();
          await get().loadGroupMemberships();
          await get().loadAnalytics();
        } catch (error) {
          set({
            isClaimingPayout: false,
            error:
              error instanceof Error ? error.message : 'Failed to claim payout',
          });
          throw error;
        }
      },

      // Claim all available payouts
      claimAllPayouts: async () => {
        const availablePayouts = get().availablePayouts.filter(
          p => p.status === 'available',
        );

        if (availablePayouts.length === 0) {
          return;
        }

        set({isClaimingPayout: true, error: null});

        try {
          const response = await api.post('/payouts/claim-all');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to claim payouts',
            );
          }

          set({isClaimingPayout: false});

          // Refresh data
          await get().loadAvailablePayouts();
          await get().loadGroupMemberships();
          await get().loadAnalytics();
        } catch (error) {
          set({
            isClaimingPayout: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to claim payouts',
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({error: null}),

      // Refresh all data
      refresh: async () => {
        set({isLoading: true});
        try {
          await Promise.all([
            get().loadGroupMemberships(),
            get().loadAvailablePayouts(),
            get().loadAnalytics(),
          ]);
        } finally {
          set({isLoading: false});
        }
      },
    }),
    {
      name: 'user-groups-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        // Only persist essential data, not loading states
        memberships: state.memberships,
        analytics: state.analytics,
      }),
    },
  ),
);
