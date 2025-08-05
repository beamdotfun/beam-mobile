import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NFTAuction,
  Bid,
  NFTAuctionFilter,
  AutoBidSettings,
  NFTAuctionRealtimeUpdate,
} from '../types/auctions';
import {nftAuctionAPI} from '../services/api';

interface NFTAuctionState {
  // Auction data
  auctions: Record<string, NFTAuction>;
  bids: Record<string, Bid[]>; // Grouped by auctionId
  watchlist: string[]; // Auction IDs
  myBids: Record<string, Bid>; // My highest bid per auction

  // Filters and search
  filter: NFTAuctionFilter;
  searchQuery: string;
  sortBy: 'ending_soon' | 'price_low' | 'price_high' | 'most_bids';

  // UI state
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Auto-bid
  autoBidSettings: Record<string, AutoBidSettings>; // Per auction

  // Actions
  fetchAuctions: (filter?: NFTAuctionFilter) => Promise<void>;
  fetchAuction: (auctionId: string) => Promise<void>;
  fetchBids: (auctionId: string) => Promise<void>;

  // Bidding
  placeBid: (auctionId: string, amount: number) => Promise<void>;
  buyNow: (auctionId: string) => Promise<void>;

  // Watchlist
  addToWatchlist: (auctionId: string) => Promise<void>;
  removeFromWatchlist: (auctionId: string) => Promise<void>;

  // Auto-bid
  setAutoBid: (auctionId: string, settings: AutoBidSettings) => Promise<void>;

  // Search and filter
  setFilter: (filter: NFTAuctionFilter) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  clearError: () => void;
}

let searchTimeout: NodeJS.Timeout;

export const useNFTAuctionStore = create<NFTAuctionState>()(
  persist(
    (set, get) => ({
      auctions: {},
      bids: {},
      watchlist: [],
      myBids: {},
      filter: {},
      searchQuery: '',
      sortBy: 'ending_soon',
      loading: false,
      refreshing: false,
      error: null,
      autoBidSettings: {},

      fetchAuctions: async filter => {
        set({loading: true, error: null});

        try {
          const {searchQuery, sortBy} = get();
          const auctions = await nftAuctionAPI.getAuctions({
            filter,
            search: searchQuery,
            sort: sortBy,
          });

          set({
            auctions: auctions.reduce(
              (acc: Record<string, NFTAuction>, auction: NFTAuction) => {
                acc[auction.id] = auction;
                return acc;
              },
              {},
            ),
            loading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch auctions',
            loading: false,
          });
        }
      },

      fetchAuction: async auctionId => {
        try {
          const auction = await nftAuctionAPI.getAuction(auctionId);

          set(state => ({
            auctions: {
              ...state.auctions,
              [auctionId]: auction,
            },
          }));

          // Auction fetched successfully
        } catch (error) {
          console.error('Failed to fetch auction:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch auction',
          });
        }
      },

      fetchBids: async auctionId => {
        try {
          const bids = await nftAuctionAPI.getBids(auctionId);

          set(state => ({
            bids: {
              ...state.bids,
              [auctionId]: bids,
            },
          }));
        } catch (error) {
          console.error('Failed to fetch bids:', error);
        }
      },

      placeBid: async (auctionId, amount) => {
        try {
          const response = await nftAuctionAPI.placeBid(auctionId, amount);
          const {bid} = response.data || {};

          // TODO: Implement wallet integration for transaction signing
          // For now, we'll simulate a successful bid

          // Update local state optimistically
          set(state => ({
            myBids: {
              ...state.myBids,
              [auctionId]: bid,
            },
            auctions: {
              ...state.auctions,
              [auctionId]: {
                ...state.auctions[auctionId],
                currentBid: amount,
                bidCount: state.auctions[auctionId].bidCount + 1,
                highestBidder: bid?.bidderWallet,
              },
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      buyNow: async auctionId => {
        try {
          const auction = get().auctions[auctionId];
          if (!auction?.buyNowPrice) {
            throw new Error('Buy now not available');
          }

          await nftAuctionAPI.buyNow(auctionId);

          // TODO: Implement wallet integration for transaction signing

          // Update auction status
          set(state => ({
            auctions: {
              ...state.auctions,
              [auctionId]: {
                ...state.auctions[auctionId],
                status: 'ended',
                winner: 'user_wallet', // TODO: Get from auth store
                finalPrice: auction.buyNowPrice,
              },
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      addToWatchlist: async auctionId => {
        try {
          await nftAuctionAPI.addToWatchlist(auctionId);

          set(state => ({
            watchlist: [...state.watchlist, auctionId],
            auctions: {
              ...state.auctions,
              [auctionId]: {
                ...state.auctions[auctionId],
                isWatching: true,
                watcherCount: state.auctions[auctionId].watcherCount + 1,
              },
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      removeFromWatchlist: async auctionId => {
        try {
          await nftAuctionAPI.removeFromWatchlist(auctionId);

          set(state => ({
            watchlist: state.watchlist.filter(id => id !== auctionId),
            auctions: {
              ...state.auctions,
              [auctionId]: {
                ...state.auctions[auctionId],
                isWatching: false,
                watcherCount: Math.max(
                  0,
                  state.auctions[auctionId].watcherCount - 1,
                ),
              },
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      setAutoBid: async (auctionId, settings) => {
        try {
          await nftAuctionAPI.setAutoBid(auctionId, settings);

          set(state => ({
            autoBidSettings: {
              ...state.autoBidSettings,
              [auctionId]: settings,
            },
          }));
        } catch (error) {
          throw error;
        }
      },


      setFilter: filter => {
        set({filter});
        get().fetchAuctions(filter);
      },

      setSearchQuery: query => {
        set({searchQuery: query});
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          get().fetchAuctions();
        }, 300);
      },

      setSortBy: sort => {
        set({sortBy: sort as any});
        get().fetchAuctions();
      },

      clearError: () => {
        set({error: null});
      },
    }),
    {
      name: 'nft-auction-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        watchlist: state.watchlist,
        autoBidSettings: state.autoBidSettings,
        filter: state.filter,
        sortBy: state.sortBy,
      }),
    },
  ),
);
