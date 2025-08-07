import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Install react-native-haptic-feedback or use alternative haptic solution
// import HapticFeedback from "react-native-haptic-feedback";
import {
  Vote,
  ReputationScore,
  VotingStats,
  VoteImpact,
  VotingConfig,
  VoteAnimation,
  VotingInsights,
} from '@/types/voting';
import {votingService} from '../services/voting/votingService';
import {useWalletStore} from './wallet';
import {socialAPI} from '../services/api/social';

interface VotingStore {
  // State
  userReputation?: ReputationScore;
  votingStats?: VotingStats;
  recentVotes: Vote[];
  pendingVotes: Map<string, Vote>;
  config: VotingConfig;

  // UI State
  activeAnimations: VoteAnimation[];
  isVoting: Record<string, boolean>;
  voteErrors: Record<string, string>;

  // Cache
  reputationCache: Map<string, ReputationScore>;
  voteHistory: Map<string, Vote[]>;

  // Actions
  loadUserReputation: () => Promise<void>;
  loadVotingStats: () => Promise<void>;
  loadVoteHistory: (targetUser?: string) => Promise<void>;

  // Voting
  vote: (
    targetUser: string,
    value: number,
    context?: any,
  ) => Promise<VoteImpact>;
  undoVote: (voteId: string) => Promise<void>;

  // Reputation
  getUserReputation: (userWallet: string) => Promise<ReputationScore>;
  refreshReputation: () => Promise<void>;

  // Analytics
  getVotingInsights: () => VotingInsights;
  getVoteImpactPreview: (
    targetUser: string,
    value: number,
  ) => Promise<VoteImpact>;

  // Animations
  addVoteAnimation: (animation: VoteAnimation) => void;
  removeVoteAnimation: (index: number) => void;

  // Utilities
  canVote: (targetUser: string) => {allowed: boolean; reason?: string};
  checkUserPostCount: (userWallet: string) => Promise<number>;
  getVoteCost: (value: number) => number;
  formatReputation: (score: number) => string;
}

const defaultConfig: VotingConfig = {
  upvoteFee: 0.001,
  downvoteFee: 0.002,
  reputationMultiplier: 1.0,
  streakMultiplier: 1.1,
  decayFactor: 0.95,
  anonymousVoting: false,
  voteReasons: true,
  voteUndoWindow: 300, // 5 minutes
};

export const useVotingStore = create<VotingStore>()(
  persist(
    (set, get) => ({
      recentVotes: [],
      pendingVotes: new Map(),
      config: defaultConfig,
      activeAnimations: [],
      isVoting: {},
      voteErrors: {},
      reputationCache: new Map(),
      voteHistory: new Map(),

      // Load user reputation
      loadUserReputation: async () => {
        try {
          const response = await votingService.getUserReputation();
          if (response.ok && response.data) {
            set({userReputation: response.data.data});
          }
        } catch (error) {
          console.error('Failed to load reputation:', error);
        }
      },

      // Load voting stats
      loadVotingStats: async () => {
        try {
          const response = await votingService.getVotingStats();
          if (response.ok && response.data) {
            set({votingStats: response.data.data});
          }
        } catch (error) {
          console.error('Failed to load voting stats:', error);
        }
      },

      // Load vote history
      loadVoteHistory: async (targetUser?: string) => {
        try {
          const response = await votingService.getVoteHistory({targetUser});
          if (response.ok && response.data) {
            const votes = response.data.data;
            if (targetUser) {
              get().voteHistory.set(targetUser, votes);
            } else {
              set({recentVotes: votes});
            }
          }
        } catch (error) {
          console.error('Failed to load vote history:', error);
        }
      },

      // Vote using blockchain transactions
      vote: async (targetUser: string, value: number, context?: any) => {
        const voteId = `vote_${Date.now()}`;
        const {config, pendingVotes} = get();
        const walletStore = useWalletStore.getState();

        // Check if can vote
        const canVoteResult = get().canVote(targetUser);
        if (!canVoteResult.allowed) {
          throw new Error(canVoteResult.reason);
        }

        // Check if wallet is connected
        if (!walletStore.connected || !walletStore.publicKey) {
          throw new Error('Wallet not connected');
        }

        // Check if user has created at least one post
        try {
          const userWallet = walletStore.publicKey.toString();
          console.log('🔍 VotingStore: About to check post count for voting user:', userWallet.slice(0, 8) + '...');
          const userPostCount = await get().checkUserPostCount(userWallet);
          console.log('🔍 VotingStore: Post count check result:', {
            userWallet: userWallet.slice(0, 8) + '...',
            postCount: userPostCount,
            canVote: userPostCount > 0
          });
          
          if (userPostCount === 0) {
            console.log('🚫 VotingStore: User has no posts, cannot vote');
            throw new Error('You must create at least one post before you can vote on other users');
          }
          
          console.log('✅ VotingStore: User has posts, can proceed with vote');
        } catch (error: any) {
          if (error.message.includes('at least one post')) {
            throw error; // Re-throw post count error
          }
          console.warn('Failed to check post count, allowing vote:', error);
          // Continue with vote if post count check fails (API might be down)
        }

        // Set voting state
        set(state => ({
          isVoting: {...state.isVoting, [targetUser]: true},
          voteErrors: {...state.voteErrors, [targetUser]: undefined},
        }));

        // Create pending vote
        const pendingVote: Vote = {
          id: voteId,
          voterWallet: walletStore.publicKey.toString(),
          targetUserWallet: targetUser,
          value,
          timestamp: new Date().toISOString(),
          transactionSignature: '',
          feePaid: get().getVoteCost(value),
          impactScore: 0,
          ...context,
        };

        pendingVotes.set(voteId, pendingVote);

        try {
          console.log(`🗳️ Starting blockchain vote: ${value > 0 ? 'upvote' : 'downvote'} for ${targetUser}`);

          // TODO: Add haptic feedback when react-native-haptic-feedback is installed
          // HapticFeedback.trigger(value > 0 ? "impactLight" : "impactMedium", {
          //   enableVibrateFallback: true,
          //   ignoreAndroidSystemSettings: false,
          // });

          // Submit vote via blockchain transaction service
          const blockchainService = walletStore.blockchainService;
          const voteType = value > 0 ? 'upvote' : 'downvote';
          
          const result = await blockchainService.createVote({
            voterWallet: walletStore.publicKey.toString(),
            targetWallet: targetUser,
            voteType,
          });

          console.log(`✅ Blockchain vote transaction confirmed: ${result.signature}`);

          // Create synthetic impact result for now
          const impact: VoteImpact = {
            change: value,
            newScore: 0, // Will be updated by backend sync
            effects: {
              rankChange: 0,
              percentileChange: 0,
            },
          };

          // Update pending vote with blockchain data
          const blockchainVote: Vote = {
            ...pendingVote,
            id: result.signature, // Use transaction signature as vote ID
            transactionSignature: result.signature,
            feePaid: result.fee || get().getVoteCost(value),
            impactScore: value,
          };

          pendingVotes.delete(voteId);

          set(state => ({
            recentVotes: [blockchainVote, ...state.recentVotes].slice(0, 50),
          }));

          // Try to sync with backend API for additional features (non-blocking)
          try {
            const response = await votingService.submitVote({
              targetUser,
              value,
              blockchainSignature: result.signature, // Link to blockchain transaction
              ...context,
            });

            if (response.ok && response.data) {
              const {impact: apiImpact} = response.data.data;
              
              // Update with real impact data from API
              if (apiImpact.newScore !== undefined) {
                get().reputationCache.set(targetUser, {
                  score: apiImpact.newScore,
                  rank: 0,
                  percentile: 0,
                  trend: apiImpact.change > 0 ? 'up' : apiImpact.change < 0 ? 'down' : 'stable',
                  breakdown: {
                    receivedVotes: 0,
                    givenVotes: 0,
                    postQuality: 0,
                    engagement: 0,
                    consistency: 0,
                  },
                  history: [],
                  milestones: [],
                  projectedScore: apiImpact.newScore,
                });

                // Merge API impact with blockchain impact
                impact.newScore = apiImpact.newScore;
                impact.effects = apiImpact.effects;
              }

              console.log('✅ Backend API vote sync successful');
            }
          } catch (apiError) {
            console.warn('⚠️ Backend API vote sync failed, but blockchain transaction succeeded:', apiError);
            // Don't throw here - blockchain transaction succeeded
          }

          // Refresh user reputation if voting affected it
          if (impact.effects?.rankChange) {
            get().loadUserReputation();
          }

          return impact;
        } catch (error: any) {
          console.error('❌ Blockchain vote transaction failed:', error);
          pendingVotes.delete(voteId);
          
          // Provide specific error messages
          let errorMessage = error.message || 'Vote failed';
          if (error.message?.includes('insufficient funds')) {
            errorMessage = 'Insufficient SOL balance for voting fee';
          } else if (error.message?.includes('User rejected')) {
            errorMessage = 'Transaction was cancelled';
          } else if (error.message?.includes('at least one post')) {
            errorMessage = 'You must create at least one post before voting';
          }
          
          set(state => ({
            voteErrors: {
              ...state.voteErrors,
              [targetUser]: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        } finally {
          set(state => ({
            isVoting: {...state.isVoting, [targetUser]: false},
          }));
        }
      },

      // Undo vote
      undoVote: async (voteId: string) => {
        try {
          const response = await votingService.undoVote(voteId);
          if (response.ok) {
            set(state => ({
              recentVotes: state.recentVotes.filter(v => v.id !== voteId),
            }));

            // Refresh reputation
            get().loadUserReputation();
          }
        } catch (error) {
          console.error('Failed to undo vote:', error);
          throw error;
        }
      },

      // Get user reputation
      getUserReputation: async (userWallet: string) => {
        // Check cache first
        const cached = get().reputationCache.get(userWallet);
        if (cached) {
          return cached;
        }

        try {
          const response = await votingService.getUserReputation(userWallet);
          if (response.ok && response.data) {
            const reputation = response.data.data;
            get().reputationCache.set(userWallet, reputation);
            return reputation;
          }
          throw new Error('Failed to get reputation');
        } catch (error) {
          console.error('Failed to get user reputation:', error);
          throw error;
        }
      },

      // Refresh reputation
      refreshReputation: async () => {
        get().reputationCache.clear();
        await get().loadUserReputation();
      },

      // Get voting insights
      getVotingInsights: () => {
        const {userReputation, votingStats} = get();

        if (!userReputation || !votingStats) {
          return {
            votingPower: 0,
            influence: 0,
            consistency: 0,
            suggestions: ['Start voting to build your reputation'],
          };
        }

        const votingPower = Math.min(100, userReputation.score / 10);
        const influence = userReputation.percentile;
        const consistency =
          votingStats.votingStreak > 0
            ? Math.min(100, votingStats.votingStreak * 10)
            : 0;

        const suggestions: string[] = [];

        if (votingStats.votingStreak < 7) {
          suggestions.push(
            'Vote daily to build your streak and earn bonus reputation',
          );
        }

        if (votingStats.totalVotesGiven < 10) {
          suggestions.push(
            'Vote on quality content to increase your influence',
          );
        }

        if (userReputation.trend === 'down') {
          suggestions.push('Engage more positively to improve your reputation');
        }

        return {
          votingPower,
          influence,
          consistency,
          suggestions,
        };
      },

      // Get vote impact preview
      getVoteImpactPreview: async (targetUser: string, value: number) => {
        try {
          const response = await votingService.previewVoteImpact({
            targetUser,
            value,
          });

          if (response.ok && response.data) {
            return response.data.data;
          }

          throw new Error('Failed to preview impact');
        } catch (error) {
          console.error('Failed to preview vote impact:', error);
          throw error;
        }
      },

      // Add vote animation
      addVoteAnimation: (animation: VoteAnimation) => {
        set(state => ({
          activeAnimations: [...state.activeAnimations, animation],
        }));

        // Remove animation after completion
        setTimeout(() => {
          set(state => ({
            activeAnimations: state.activeAnimations.filter(
              a => a !== animation,
            ),
          }));
        }, 1000);
      },

      // Remove vote animation
      removeVoteAnimation: (index: number) => {
        set(state => ({
          activeAnimations: state.activeAnimations.filter(
            (_, i) => i !== index,
          ),
        }));
      },

      // Check user post count
      checkUserPostCount: async (userWallet: string) => {
        try {
          console.log('🔍 VotingStore: Checking post count for wallet:', userWallet);
          const posts = await socialAPI.getUserPosts(userWallet, 1, 0); // Get first page with 1 item to check if any exist
          const postCount = posts?.posts?.length || 0;
          console.log('🔍 VotingStore: Post count result:', {
            wallet: userWallet.slice(0, 8) + '...',
            postCount,
            postsData: posts?.posts?.[0] ? 'Has posts' : 'No posts found'
          });
          return postCount;
        } catch (error) {
          console.error('Failed to check user post count:', error);
          console.log('🔍 VotingStore: Falling back to allow voting due to API error');
          // Return 1 as fallback to allow voting if API is down
          return 1;
        }
      },

      // Can vote
      canVote: (targetUser: string) => {
        const {config, recentVotes} = get();
        const walletStore = useWalletStore.getState();
        const userWallet = walletStore.publicKey?.toString();

        if (!userWallet) {
          return {allowed: false, reason: 'Wallet not connected'};
        }

        if (targetUser === userWallet) {
          return {allowed: false, reason: 'Cannot vote for yourself'};
        }

        // Check daily limit
        if (config.dailyVoteLimit) {
          const today = new Date().toDateString();
          const todayVotes = recentVotes.filter(
            v => new Date(v.timestamp).toDateString() === today,
          );

          if (todayVotes.length >= config.dailyVoteLimit) {
            return {allowed: false, reason: 'Daily vote limit reached'};
          }
        }

        // Check cooldown
        if (config.cooldownPeriod) {
          const recentVoteForUser = recentVotes.find(
            v =>
              v.targetUserWallet === targetUser &&
              Date.now() - new Date(v.timestamp).getTime() <
                config.cooldownPeriod! * 1000,
          );

          if (recentVoteForUser) {
            return {allowed: false, reason: 'Cooldown period active'};
          }
        }

        return {allowed: true};
      },

      // Get vote cost
      getVoteCost: (value: number) => {
        const {config} = get();
        return value > 0 ? config.upvoteFee : config.downvoteFee;
      },

      // Format reputation
      formatReputation: (score: number) => {
        if (score >= 1000000) {
          return `${(score / 1000000).toFixed(1)}M`;
        }
        if (score >= 1000) {
          return `${(score / 1000).toFixed(1)}K`;
        }
        return score.toString();
      },
    }),
    {
      name: 'voting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        recentVotes: state.recentVotes.slice(0, 20),
        config: state.config,
      }),
    },
  ),
);
