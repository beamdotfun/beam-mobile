import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {auctionAPI} from '../services/api/auction';
import {
  Auction,
  Bid,
  AuctionFilter,
  AuctionSort,
  BidRequest,
  BidResponse,
  WatchlistItem,
  AuctionActivity,
  AuctionPayout,
  AuctionStats,
  UserAuctionHistory,
} from '@/types/auction';

interface AuctionState {
  // Auction data
  auctions: Auction[];
  auctionDetails: Record<string, Auction>;
  recentBids: Record<string, Bid[]>;
  activities: Record<string, AuctionActivity[]>;

  // User data
  userBids: Bid[];
  watchlist: WatchlistItem[];
  userHistory: UserAuctionHistory | null;
  userPayouts: AuctionPayout[];

  // UI state
  filter: AuctionFilter;
  sort: AuctionSort;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  hasMore: boolean;
  totalCount: number;

  // Stats
  stats: AuctionStats | null;
}

interface AuctionActions {
  // Auction management
  fetchAuctions: (refresh?: boolean) => Promise<void>;
  fetchAuctionDetails: (auctionId: string) => Promise<void>;
  fetchMoreAuctions: () => Promise<void>;

  // Bidding actions
  placeBid: (bidRequest: BidRequest) => Promise<BidResponse>;
  fetchUserBids: () => Promise<void>;

  // Watchlist management
  addToWatchlist: (
    auctionId: string,
    notifications?: {onBidUpdate?: boolean; onEndingSoon?: boolean},
  ) => Promise<void>;
  removeFromWatchlist: (auctionId: string) => Promise<void>;
  fetchWatchlist: () => Promise<void>;
  updateWatchlistNotifications: (
    auctionId: string,
    notifications: {onBidUpdate?: boolean; onEndingSoon?: boolean},
  ) => Promise<void>;

  // User data
  fetchUserHistory: () => Promise<void>;
  fetchUserPayouts: () => Promise<void>;

  // Real-time updates

  // Filtering and sorting
  setFilter: (filter: Partial<AuctionFilter>) => void;
  setSort: (sort: AuctionSort) => void;
  clearFilters: () => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;

  // Stats
  fetchStats: () => Promise<void>;
}

type AuctionStore = AuctionState & AuctionActions;

const initialFilter: AuctionFilter = {};
const initialSort: AuctionSort = {field: 'endTime', direction: 'asc'};

const useAuctionStore = create<AuctionStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        auctions: [],
        auctionDetails: {},
        recentBids: {},
        activities: {},
        userBids: [],
        watchlist: [],
        userHistory: null,
        userPayouts: [],
        filter: initialFilter,
        sort: initialSort,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        currentPage: 1,
        hasMore: true,
        totalCount: 0,
        stats: null,

        // Actions
        fetchAuctions: async (refresh = false) => {
          const {filter, sort} = get();
          set({isLoading: refresh, error: null});

          try {
            const response = await auctionAPI.getAuctions({
              filter,
              sort,
              page: refresh ? 1 : 1,
              pageSize: 20,
            });

            set({
              auctions: response.auctions,
              totalCount: response.totalCount,
              currentPage: response.page,
              hasMore: response.hasMore,
              stats: response.stats,
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch auctions',
              isLoading: false,
            });
          }
        },

        fetchAuctionDetails: async (auctionId: string) => {
          set({isLoading: true, error: null});

          try {
            const response = await auctionAPI.getAuctionDetails(auctionId);

            set(state => ({
              auctionDetails: {
                ...state.auctionDetails,
                [auctionId]: response.auction,
              },
              recentBids: {
                ...state.recentBids,
                [auctionId]: response.recentBids,
              },
              activities: {
                ...state.activities,
                [auctionId]: response.activities,
              },
              isLoading: false,
            }));
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch auction details',
              isLoading: false,
            });
          }
        },

        fetchMoreAuctions: async () => {
          const {isLoadingMore, hasMore, currentPage, filter, sort} = get();

          if (isLoadingMore || !hasMore) {return;}

          set({isLoadingMore: true, error: null});

          try {
            const response = await auctionAPI.getAuctions({
              filter,
              sort,
              page: currentPage + 1,
              pageSize: 20,
            });

            set(state => ({
              auctions: [...state.auctions, ...response.auctions],
              currentPage: response.page,
              hasMore: response.hasMore,
              isLoadingMore: false,
            }));
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to load more auctions',
              isLoadingMore: false,
            });
          }
        },

        placeBid: async (bidRequest: BidRequest) => {
          try {

            const response = await auctionAPI.placeBid(bidRequest);

            if (response.success && response.bid) {
              // Update user bids
              set(state => ({
                userBids: [response.bid!, ...state.userBids],
              }));

              // Update auction current bid if provided
              if (response.newCurrentBid) {
                set(state => ({
                  auctions: state.auctions.map(auction =>
                    auction.auctionId === bidRequest.auctionId
                      ? {
                          ...auction,
                          currentBid: response.newCurrentBid!,
                          userHasBid: true,
                        }
                      : auction,
                  ),
                  auctionDetails: {
                    ...state.auctionDetails,
                    [bidRequest.auctionId]: state.auctionDetails[
                      bidRequest.auctionId
                    ]
                      ? {
                          ...state.auctionDetails[bidRequest.auctionId],
                          currentBid: response.newCurrentBid!,
                          userHasBid: true,
                        }
                      : state.auctionDetails[bidRequest.auctionId],
                  },
                }));
              }
            }

            return response;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to place bid';
            set({error: errorMessage});
            return {success: false, error: errorMessage};
          }
        },

        fetchUserBids: async () => {
          try {

            const bids = await auctionAPI.getUserBids();
            set({userBids: bids});
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch user bids',
            });
          }
        },

        addToWatchlist: async (auctionId: string, notifications = {}) => {
          try {
            await auctionAPI.addToWatchlist(auctionId, notifications);

            const watchlistItem: WatchlistItem = {
              auctionId,
              addedAt: new Date().toISOString(),
              notifyOnBidUpdate: notifications.onBidUpdate ?? false,
              notifyOnEndingSoon: notifications.onEndingSoon ?? true,
            };

            set(state => ({
              watchlist: [
                ...state.watchlist.filter(item => item.auctionId !== auctionId),
                watchlistItem,
              ],
              auctions: state.auctions.map(auction =>
                auction.auctionId === auctionId
                  ? {...auction, userIsWatching: true}
                  : auction,
              ),
            }));
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to add to watchlist',
            });
          }
        },

        removeFromWatchlist: async (auctionId: string) => {
          try {

            await auctionAPI.removeFromWatchlist(auctionId);

            set(state => ({
              watchlist: state.watchlist.filter(
                item => item.auctionId !== auctionId,
              ),
              auctions: state.auctions.map(auction =>
                auction.auctionId === auctionId
                  ? {...auction, userIsWatching: false}
                  : auction,
              ),
            }));
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to remove from watchlist',
            });
          }
        },

        fetchWatchlist: async () => {
          try {

            const watchlist = await auctionAPI.getWatchlist();
            set({watchlist});
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch watchlist',
            });
          }
        },

        updateWatchlistNotifications: async (
          auctionId: string,
          notifications: {onBidUpdate?: boolean; onEndingSoon?: boolean},
        ) => {

            await auctionAPI.updateWatchlistNotifications(
              auctionId,
              notifications,

            set(state => ({
              watchlist: state.watchlist.map(item =>
                item.auctionId === auctionId
                  ? {
                      ...item,
                      notifyOnBidUpdate:
                        notifications.onBidUpdate ?? item.notifyOnBidUpdate,
                      notifyOnEndingSoon:
                        notifications.onEndingSoon ?? item.notifyOnEndingSoon,
                    }
                  : item,
              ),
            }));
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to update watchlist notifications',
            });
          }
        },

        fetchUserHistory: async () => {
          try {

            const history = await auctionAPI.getUserHistory();
            set({userHistory: history});
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch user history',
            });
          }
        },

        fetchUserPayouts: async () => {
          try {
            const payouts = await auctionAPI.getUserPayouts();
            set({userPayouts: payouts});
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch user payouts',
            });
          }
        },


        setFilter: (newFilter: Partial<AuctionFilter>) => {
          set(state => ({
            filter: {...state.filter, ...newFilter},
            currentPage: 1,
            hasMore: true,
          }));
          get().fetchAuctions(true);
        },

        setSort: (sort: AuctionSort) => {
          set({sort, currentPage: 1, hasMore: true});
          get().fetchAuctions(true);
        },

        clearFilters: () => {
          set({filter: initialFilter, currentPage: 1, hasMore: true});
          get().fetchAuctions(true);
        },

        fetchStats: async () => {
          try {

            const stats = await auctionAPI.getStats();
            set({stats});
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch stats',
            });
          }
        },

        clearError: () => {
          set({error: null});
        },

        reset: () => {
          set({
            auctions: [],
            auctionDetails: {},
            recentBids: {},
            activities: {},
            userBids: [],
            userHistory: null,
            userPayouts: [],
            filter: initialFilter,
            sort: initialSort,
            isLoading: false,
            isLoadingMore: false,
            error: null,
            currentPage: 1,
            hasMore: true,
            totalCount: 0,
            stats: null,
            liveAuctionUpdates: {},
          });
        },
      }),
      {
        name: 'auction-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: state => ({
          watchlist: state.watchlist,
          filter: state.filter,
          sort: state.sort,
        }),
      },
    ),
  ),
);

export {useAuctionStore};
