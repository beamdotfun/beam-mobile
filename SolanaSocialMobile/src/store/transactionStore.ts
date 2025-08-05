import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  TransactionFilter,
  TransactionStats,
  TransactionStatus,
  TransactionResponse,
} from '@/types/transactions';
import {TransactionService} from '../services/api/transactions';

interface TransactionState {
  // Transaction data
  transactions: Transaction[];
  stats: TransactionStats | null;

  // Filters
  filter: TransactionFilter;

  // UI state
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Pagination
  hasMore: boolean;
  currentPage: number;

  // Actions
  fetchTransactions: (wallet?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshTransactions: () => Promise<void>;

  // Filtering
  setFilter: (filter: TransactionFilter) => void;
  clearFilters: () => void;

  // Transaction details
  getTransaction: (signature: string) => Promise<Transaction>;

  // Export
  exportTransactions: (format: 'csv' | 'json') => Promise<string>;

  updateTransactionStatus: (
    signature: string,
    status: TransactionStatus,
  ) => void;

  // UI helpers
  clearError: () => void;
  reset: () => void;
}


export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      stats: null,
      filter: {},
      loading: false,
      refreshing: false,
      error: null,
      hasMore: true,
      currentPage: 1,

      fetchTransactions: async wallet => {
        if (!wallet) {
          return;
        }

        const {currentPage, filter} = get();

        set({
          loading: currentPage === 1,
          error: null,
        });

        try {
          const result = await TransactionService.getUserTransactions(wallet, {
            page: currentPage,
            limit: 20,
            filters: filter,
          });

          const {transactions, stats, hasMore} = result;

          set(state => ({
            transactions:
              currentPage === 1
                ? transactions
                : [...state.transactions, ...transactions],
            stats,
            hasMore,
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch transactions',
            loading: false,
          });
        }
      },

      loadMore: async () => {
        const {hasMore, loading} = get();

        if (!hasMore || loading) {
          return;
        }

        set(state => ({currentPage: state.currentPage + 1}));
        await get().fetchTransactions();
      },

      refreshTransactions: async () => {
        set({refreshing: true, currentPage: 1});
        await get().fetchTransactions();
        set({refreshing: false});
      },

      setFilter: newFilter => {
        set({
          filter: newFilter,
          currentPage: 1,
          transactions: [],
          hasMore: true,
        });

        // Auto-fetch with new filters will be handled by component
      },

      clearFilters: () => {
        set({
          filter: {},
          currentPage: 1,
          transactions: [],
          hasMore: true,
        });

        // Clear filters will be handled by component
      },

      getTransaction: async signature => {
        try {
          return await TransactionService.getTransactionDetails(signature);
        } catch (error) {
          throw error;
        }
      },

      exportTransactions: async (format, wallet) => {
        try {
          const {transactions, filter} = get();
          const result = await TransactionService.exportTransactions(wallet, {
            format,
            filters: filter,
            signatures: transactions.map(tx => tx.signature),
          });

          return result.url;
        } catch (error) {
          throw error;
        }
      },


      updateTransactionStatus: (signature, status) => {
        set(state => ({
          transactions: state.transactions.map(tx =>
            tx.signature === signature ? {...tx, status} : tx,
          ),
        }));
      },

      clearError: () => {
        set({error: null});
      },

      reset: () => {
        set({
          transactions: [],
          stats: null,
          filter: {},
          loading: false,
          refreshing: false,
          error: null,
          hasMore: true,
          currentPage: 1,
        });
      },
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        filter: state.filter,
      }),
    },
  ),
);
