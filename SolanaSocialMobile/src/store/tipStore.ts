import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Tip,
  TipAnimation,
  CreatorEarnings,
  TipLeaderboard,
  TipConfig,
  SOLPriceData,
  TipStats,
  TipModalState,
  TipPreset,
  TipNotification,
} from '@/types/tips';

interface TipStore {
  // State
  tips: Tip[];
  sentTips: Tip[];
  receivedTips: Tip[];
  earnings: CreatorEarnings | null;
  leaderboard: TipLeaderboard | null;
  animations: TipAnimation[];
  solPrice: SOLPriceData | null;
  config: TipConfig;
  modalState: TipModalState;
  notifications: TipNotification[];
  stats: TipStats | null;
  isLoading: boolean;
  error: string | null;

  // SOL Price Management
  fetchSOLPrice: () => Promise<void>;
  updateSOLPrice: (price: SOLPriceData) => void;
  convertSOLToUSD: (amount: number) => number;
  convertUSDToSOL: (amount: number) => number;

  // Tip Actions
  sendTip: (
    targetWallet: string,
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    amount: number,
    message?: string,
    isAnonymous?: boolean,
  ) => Promise<Tip>;
  loadTips: (wallet?: string) => Promise<void>;
  loadSentTips: () => Promise<void>;
  loadReceivedTips: () => Promise<void>;
  refreshTipData: () => Promise<void>;

  // Animation Management
  addAnimation: (animation: Omit<TipAnimation, 'id' | 'startTime'>) => string;
  updateAnimation: (id: string, updates: Partial<TipAnimation>) => void;
  removeAnimation: (id: string) => void;
  clearCompletedAnimations: () => void;

  // Earnings Management
  loadEarnings: (wallet?: string) => Promise<void>;
  refreshEarnings: () => Promise<void>;
  exportEarnings: (format: 'csv' | 'json', period?: string) => Promise<string>;

  // Leaderboard Management
  loadLeaderboard: (
    period?: 'daily' | 'weekly' | 'monthly' | 'all-time',
  ) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;

  // Modal Management
  openTipModal: (
    targetWallet: string,
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
  ) => void;
  closeTipModal: () => void;
  updateModalState: (updates: Partial<TipModalState>) => void;
  resetModalState: () => void;

  // Configuration
  updateConfig: (updates: Partial<TipConfig>) => void;
  resetConfig: () => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  toggleAnimations: () => void;

  // Notifications
  addNotification: (notification: Omit<TipNotification, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;

  // Statistics
  loadStats: () => Promise<void>;
  getTipStats: (wallet?: string) => {
    totalSent: number;
    totalReceived: number;
    totalSentUSD: number;
    totalReceivedUSD: number;
    tipCount: number;
    uniqueRecipients: number;
    averageTip: number;
  };

  // Utilities
  formatTipAmount: (amount: number) => string;
  formatTipAmountUSD: (amount: number) => string;
  validateTipAmount: (amount: number) => {valid: boolean; error?: string};
  estimateNetworkFee: () => Promise<number>;
  canAffordTip: (amount: number) => boolean;
}

const DEFAULT_CONFIG: TipConfig = {
  presets: [
    {
      amount: 0.01,
      emoji: '☕',
      label: 'Coffee',
      description: 'Buy them a coffee',
      popular: true,
    },
    {
      amount: 0.05,
      emoji: '🍕',
      label: 'Pizza',
      description: 'Pizza slice',
      popular: true,
    },
    {
      amount: 0.1,
      emoji: '🍺',
      label: 'Beer',
      description: 'Cold beer',
      popular: true,
    },
    {amount: 0.25, emoji: '🍔', label: 'Burger', description: 'Tasty burger'},
    {
      amount: 0.5,
      emoji: '🥩',
      label: 'Steak',
      description: 'Nice steak dinner',
    },
    {
      amount: 1.0,
      emoji: '💎',
      label: 'Premium',
      description: 'Premium support',
      popular: true,
    },
    {amount: 2.5, emoji: '🏆', label: 'Champion', description: 'Champion tier'},
    {amount: 5.0, emoji: '👑', label: 'Royal', description: 'Royal treatment'},
  ],
  minAmount: 0.001,
  maxAmount: 100,
  networkFeeEstimate: 0.000005,
  soundEnabled: true,
  hapticEnabled: true,
  animationsEnabled: true,
  showUSDValues: true,
  defaultAnonymous: false,
};

const DEFAULT_MODAL_STATE: TipModalState = {
  isVisible: false,
  targetWallet: '',
  targetType: 'user',
  targetId: '',
  selectedAmount: 0,
  customAmount: '',
  message: '',
  isAnonymous: false,
  isLoading: false,
  step: 'amount',
};

export const useTipStore = create<TipStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tips: [],
      sentTips: [],
      receivedTips: [],
      earnings: null,
      leaderboard: null,
      animations: [],
      solPrice: null,
      config: DEFAULT_CONFIG,
      modalState: DEFAULT_MODAL_STATE,
      notifications: [],
      stats: null,
      isLoading: false,
      error: null,

      // SOL Price Management
      fetchSOLPrice: async () => {
        try {
          set({isLoading: true, error: null});

          // Mock SOL price fetch - in real app would use CoinGecko/Jupiter API
          const mockPrice: SOLPriceData = {
            price: 20.5 + Math.random() * 2 - 1, // $19.50 - $21.50 range
            change24h: Math.random() * 10 - 5, // -5% to +5%
            timestamp: new Date().toISOString(),
            source: 'mock-api',
          };

          set({solPrice: mockPrice, isLoading: false});
        } catch (error) {
          set({error: 'Failed to fetch SOL price', isLoading: false});
        }
      },

      updateSOLPrice: (price: SOLPriceData) => {
        set({solPrice: price});
      },

      convertSOLToUSD: (amount: number) => {
        const {solPrice} = get();
        return solPrice ? amount * solPrice.price : 0;
      },

      convertUSDToSOL: (amount: number) => {
        const {solPrice} = get();
        return solPrice ? amount / solPrice.price : 0;
      },

      // Tip Actions
      sendTip: async (
        targetWallet: string,
        targetType: 'post' | 'comment' | 'user',
        targetId: string,
        amount: number,
        message?: string,
        isAnonymous = false,
      ) => {
        const {convertSOLToUSD, config, addAnimation, addNotification} = get();

        try {
          set(state => ({
            ...state,
            modalState: {
              ...state.modalState,
              isLoading: true,
              step: 'processing',
            },
          }));

          // Validate amount
          const validation = get().validateTipAmount(amount);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // Check balance
          if (!get().canAffordTip(amount)) {
            throw new Error('Insufficient balance for tip');
          }

          // Create tip object
          const tip: Tip = {
            id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromWallet: 'current_user_wallet', // Would come from wallet store
            toWallet: targetWallet,
            amount,
            amountUSD: convertSOLToUSD(amount),
            message,
            isAnonymous,
            targetType,
            targetId,
            transactionSignature: `sig_${Date.now()}`, // Mock signature
            status: 'pending',
            timestamp: new Date().toISOString(),
            networkFee: config.networkFeeEstimate,
          };

          // Add animation
          const preset = config.presets.find(
            p => Math.abs(p.amount - amount) < 0.001,
          );
          const animationId = addAnimation({
            amount,
            emoji: preset?.emoji || '💰',
            fromPosition: {x: 0, y: 0},
            toPosition: {x: 100, y: -50},
            duration: 1500,
            status: 'starting',
          });

          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Update tip status
          const confirmedTip: Tip = {...tip, status: 'confirmed'};

          // Update store
          set(state => ({
            tips: [confirmedTip, ...state.tips],
            sentTips: [confirmedTip, ...state.sentTips],
            modalState: {
              ...state.modalState,
              step: 'success',
              isLoading: false,
            },
          }));

          // Add success notification
          addNotification({
            type: 'tip_sent',
            amount,
            message: `Tip of ${amount} SOL sent successfully`,
            timestamp: new Date().toISOString(),
            read: false,
          });

          return confirmedTip;
        } catch (error) {
          set(state => ({
            ...state,
            modalState: {
              ...state.modalState,
              step: 'error',
              isLoading: false,
              error:
                error instanceof Error ? error.message : 'Failed to send tip',
            },
          }));
          throw error;
        }
      },

      loadTips: async (wallet?: string) => {
        try {
          set({isLoading: true, error: null});

          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Mock tips data
          const mockTips: Tip[] = [
            {
              id: 'tip_1',
              fromWallet: 'user1',
              toWallet: 'user2',
              amount: 0.1,
              amountUSD: 2.05,
              isAnonymous: false,
              targetType: 'post',
              targetId: 'post_1',
              transactionSignature: 'sig_1',
              status: 'confirmed',
              timestamp: new Date().toISOString(),
              networkFee: 0.000005,
            },
          ];

          set({tips: mockTips, isLoading: false});
        } catch (error) {
          set({error: 'Failed to load tips', isLoading: false});
        }
      },

      loadSentTips: async () => {
        const {tips} = get();
        const sentTips = tips.filter(
          tip => tip.fromWallet === 'current_user_wallet',
        );
        set({sentTips});
      },

      loadReceivedTips: async () => {
        const {tips} = get();
        const receivedTips = tips.filter(
          tip => tip.toWallet === 'current_user_wallet',
        );
        set({receivedTips});
      },

      refreshTipData: async () => {
        await Promise.all([
          get().loadTips(),
          get().loadEarnings(),
          get().fetchSOLPrice(),
        ]);
      },

      // Animation Management
      addAnimation: animation => {
        const id = `anim_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newAnimation: TipAnimation = {
          ...animation,
          id,
          startTime: Date.now(),
        };

        set(state => ({
          animations: [...state.animations, newAnimation],
        }));

        return id;
      },

      updateAnimation: (id, updates) => {
        set(state => ({
          animations: state.animations.map(anim =>
            anim.id === id ? {...anim, ...updates} : anim,
          ),
        }));
      },

      removeAnimation: id => {
        set(state => ({
          animations: state.animations.filter(anim => anim.id !== id),
        }));
      },

      clearCompletedAnimations: () => {
        set(state => ({
          animations: state.animations.filter(
            anim => anim.status !== 'completed',
          ),
        }));
      },

      // Earnings Management
      loadEarnings: async (wallet?: string) => {
        try {
          set({isLoading: true, error: null});

          // Mock earnings data
          const mockEarnings: CreatorEarnings = {
            wallet: wallet || 'current_user_wallet',
            totalEarned: 5.25,
            totalEarnedUSD: 107.63,
            tipCount: 42,
            uniqueTippers: 28,
            averageTip: 0.125,
            topTip: 1.0,
            dailyEarnings: [],
            weeklyEarnings: [],
            monthlyEarnings: [],
            topContent: [],
            topSupporters: [],
            analytics: {
              engagementRate: 0.085,
              tipConversionRate: 0.032,
              averageSessionValue: 0.85,
              retentionRate: 0.65,
              growthRate: 0.15,
            },
          };

          set({earnings: mockEarnings, isLoading: false});
        } catch (error) {
          set({error: 'Failed to load earnings', isLoading: false});
        }
      },

      refreshEarnings: async () => {
        await get().loadEarnings();
      },

      exportEarnings: async (format, period) => {
        const {earnings} = get();
        if (!earnings) {
          return '';
        }

        if (format === 'csv') {
          return 'Date,Amount SOL,Amount USD,Tips\n2024-01-01,1.5,30.75,5';
        }
        return JSON.stringify(earnings, null, 2);
      },

      // Leaderboard Management
      loadLeaderboard: async (period = 'weekly') => {
        try {
          set({isLoading: true, error: null});

          const mockLeaderboard: TipLeaderboard = {
            period,
            lastUpdated: new Date().toISOString(),
            topEarners: [
              {
                rank: 1,
                wallet: 'creator1',
                username: 'TopCreator',
                amount: 50.5,
                amountUSD: 1035.25,
                change: 15.5,
                tipCount: 120,
                badge: 'gold',
              },
            ],
            topTippers: [
              {
                rank: 1,
                wallet: 'tipper1',
                username: 'GenerousTipper',
                amount: 25.0,
                amountUSD: 512.5,
                change: 8.2,
                tipCount: 85,
                badge: 'gold',
              },
            ],
            risingStars: [],
          };

          set({leaderboard: mockLeaderboard, isLoading: false});
        } catch (error) {
          set({error: 'Failed to load leaderboard', isLoading: false});
        }
      },

      refreshLeaderboard: async () => {
        const {leaderboard} = get();
        await get().loadLeaderboard(leaderboard?.period);
      },

      // Modal Management
      openTipModal: (targetWallet, targetType, targetId) => {
        set({
          modalState: {
            ...DEFAULT_MODAL_STATE,
            isVisible: true,
            targetWallet,
            targetType,
            targetId,
          },
        });
      },

      closeTipModal: () => {
        set({modalState: {...get().modalState, isVisible: false}});

        // Reset modal after close animation
        setTimeout(() => {
          set({modalState: DEFAULT_MODAL_STATE});
        }, 300);
      },

      updateModalState: updates => {
        set(state => ({
          modalState: {...state.modalState, ...updates},
        }));
      },

      resetModalState: () => {
        set({modalState: DEFAULT_MODAL_STATE});
      },

      // Configuration
      updateConfig: updates => {
        set(state => ({
          config: {...state.config, ...updates},
        }));
      },

      resetConfig: () => {
        set({config: DEFAULT_CONFIG});
      },

      toggleSound: () => {
        set(state => ({
          config: {...state.config, soundEnabled: !state.config.soundEnabled},
        }));
      },

      toggleHaptic: () => {
        set(state => ({
          config: {...state.config, hapticEnabled: !state.config.hapticEnabled},
        }));
      },

      toggleAnimations: () => {
        set(state => ({
          config: {
            ...state.config,
            animationsEnabled: !state.config.animationsEnabled,
          },
        }));
      },

      // Notifications
      addNotification: notification => {
        const id = `notif_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newNotification: TipNotification = {...notification, id};

        set(state => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markNotificationRead: id => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.id === id ? {...notif, read: true} : notif,
          ),
        }));
      },

      clearNotifications: () => {
        set({notifications: []});
      },

      getUnreadCount: () => {
        return get().notifications.filter(notif => !notif.read).length;
      },

      // Statistics
      loadStats: async () => {
        try {
          const mockStats: TipStats = {
            totalTips: 1542,
            totalVolume: 156.75,
            totalVolumeUSD: 3213.38,
            averageTip: 0.102,
            activeTippers: 245,
            activeCreators: 89,
            trendData: [],
          };

          set({stats: mockStats});
        } catch (error) {
          set({error: 'Failed to load stats'});
        }
      },

      getTipStats: wallet => {
        const {sentTips, receivedTips, convertSOLToUSD} = get();
        const userSent = wallet
          ? sentTips.filter(t => t.fromWallet === wallet)
          : sentTips;
        const userReceived = wallet
          ? receivedTips.filter(t => t.toWallet === wallet)
          : receivedTips;

        const totalSent = userSent.reduce((sum, tip) => sum + tip.amount, 0);
        const totalReceived = userReceived.reduce(
          (sum, tip) => sum + tip.amount,
          0,
        );

        return {
          totalSent,
          totalReceived,
          totalSentUSD: convertSOLToUSD(totalSent),
          totalReceivedUSD: convertSOLToUSD(totalReceived),
          tipCount: userSent.length + userReceived.length,
          uniqueRecipients: new Set(userSent.map(t => t.toWallet)).size,
          averageTip: userSent.length > 0 ? totalSent / userSent.length : 0,
        };
      },

      // Utilities
      formatTipAmount: amount => {
        return `${amount.toFixed(3)} SOL`;
      },

      formatTipAmountUSD: amount => {
        return `$${amount.toFixed(2)}`;
      },

      validateTipAmount: amount => {
        const {config} = get();

        if (amount < config.minAmount) {
          return {
            valid: false,
            error: `Minimum tip is ${config.minAmount} SOL`,
          };
        }

        if (amount > config.maxAmount) {
          return {
            valid: false,
            error: `Maximum tip is ${config.maxAmount} SOL`,
          };
        }

        return {valid: true};
      },

      estimateNetworkFee: async () => {
        // Mock network fee estimation
        return 0.000005;
      },

      canAffordTip: amount => {
        // Mock balance check - would integrate with wallet store
        const mockBalance = 10.0;
        const {config} = get();
        return mockBalance >= amount + config.networkFeeEstimate;
      },
    }),
    {
      name: 'tip-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        config: state.config,
        sentTips: state.sentTips,
        receivedTips: state.receivedTips,
        notifications: state.notifications,
      }),
    },
  ),
);
