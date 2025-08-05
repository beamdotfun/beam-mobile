import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QuoteStore,
  QuoteContext,
  QuoteChain,
  QuoteablePost,
  QuoteModalState,
  QuoteType,
  QuoteSettings,
  QuotingAnalytics,
  QuoteSearchFilters,
  QuoteSearchResult,
  QuoteTypeInfo,
  QuoteNotification,
  QUOTE_TYPES,
  QUOTE_LIMITS,
} from '@/types/post-quoting';
import {PostQuotingService} from '../services/api/postQuoting';

const DEFAULT_QUOTE_SETTINGS: QuoteSettings = {
  defaultQuoteType: 'neutral',
  autoExpandChains: true,
  showQuotePreview: true,
  enableQuoteNotifications: true,
  allowQuotesFromStrangers: true,
  requireQuoteApproval: false,
  restrictedQuoteTypes: [],
  maxChainDepthDisplay: 3,
  collapseOldQuotes: false,
  highlightOwnQuotes: true,
  showQuoteTypes: true,
};

const DEFAULT_MODAL_STATE: QuoteModalState = {
  isVisible: false,
  targetPost: null,
  selectedQuoteType: 'neutral',
  quoteContent: '',
  isLoading: false,
  error: null,
  step: 'select_type',
};

export const usePostQuotingStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      // Core data
      quotes: new Map(),
      quoteChains: new Map(),
      userQuotes: [],

      // UI State
      modalState: DEFAULT_MODAL_STATE,
      expandedPreviews: new Set(),
      loadingPreviews: new Set(),
      previewCache: new Map(),
      expandedChains: new Set(),
      loadingChains: new Set(),
      chainCache: new Map(),
      pendingInteractions: new Map(),
      optimisticUpdates: new Map(),

      // Settings and analytics
      settings: DEFAULT_QUOTE_SETTINGS,
      analytics: {
        userStats: {
          totalQuotes: 0,
          quotesByType: {
            agree: 0,
            disagree: 0,
            add_context: 0,
            share: 0,
            question: 0,
            neutral: 0,
          },
          averageEngagement: 0,
          mostQuotedPosts: [],
          quoteStreak: 0,
        },
        contentStats: {
          quotabilityScore: 0,
          viralQuotes: [],
          quoteConversionRate: 0,
          avgQuoteDepth: 0,
          popularQuoteTypes: [],
        },
        trendingQuotes: [],
      },

      // Quote Actions
      quotePost: async (
        postId: string,
        quoteType: QuoteType,
        content: string,
      ) => {
        const {validateQuoteContent, trackQuoteEvent} = get();

        try {
          // Validate content
          const validation = validateQuoteContent(content);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          set(state => ({
            modalState: {...state.modalState, isLoading: true, step: 'posting'},
          }));

          // Create quote using API service
          const response = await PostQuotingService.createQuote({
            parentPostId: postId,
            quoteType,
            content,
          });

          const newQuote = response.quote;

          // Update store with new quote
          set(state => {
            const newQuotes = new Map(state.quotes);
            newQuotes.set(newQuote.id, newQuote);

            return {
              quotes: newQuotes,
              userQuotes: [newQuote.id, ...state.userQuotes],
              modalState: {
                ...state.modalState,
                step: 'success',
                isLoading: false,
              },
              analytics: {
                ...state.analytics,
                userStats: {
                  ...state.analytics.userStats,
                  totalQuotes: state.analytics.userStats.totalQuotes + 1,
                  quotesByType: {
                    ...state.analytics.userStats.quotesByType,
                    [quoteType]:
                      state.analytics.userStats.quotesByType[quoteType] + 1,
                  },
                },
              },
            };
          });

          // Track the quote event
          trackQuoteEvent('quote', newQuote.id, {
            quoteType,
            contentLength: content.length,
          });

          return newQuote;
        } catch (error) {
          set(state => ({
            modalState: {
              ...state.modalState,
              isLoading: false,
              step: 'write_content',
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to create quote',
            },
          }));
          throw error;
        }
      },

      loadQuoteablePost: async (postId: string) => {
        try {
          set(state => ({
            loadingPreviews: new Set([...state.loadingPreviews, postId]),
          }));

          // Check cache first
          const cached = get().previewCache.get(postId);
          if (cached) {
            set(state => ({
              loadingPreviews: new Set(
                [...state.loadingPreviews].filter(id => id !== postId),
              ),
            }));
            return cached;
          }

          // Load quoteable post using API service
          const quoteablePost = await PostQuotingService.getQuotePreview(
            postId,
          );

          // Cache the result
          set(state => {
            const newCache = new Map(state.previewCache);
            newCache.set(postId, quoteablePost);

            // Limit cache size
            if (newCache.size > QUOTE_LIMITS.CACHE_SIZE_LIMIT) {
              const firstKey = newCache.keys().next().value;
              newCache.delete(firstKey);
            }

            return {
              previewCache: newCache,
              loadingPreviews: new Set(
                [...state.loadingPreviews].filter(id => id !== postId),
              ),
            };
          });

          return quoteablePost;
        } catch (error) {
          set(state => ({
            loadingPreviews: new Set(
              [...state.loadingPreviews].filter(id => id !== postId),
            ),
          }));
          throw error;
        }
      },

      loadQuoteChain: async (postId: string) => {
        try {
          set(state => ({
            loadingChains: new Set([...state.loadingChains, postId]),
          }));

          // Check cache first
          const chainId = `chain_${postId}`;
          const cached = get().chainCache.get(chainId);
          if (cached) {
            set(state => ({
              loadingChains: new Set(
                [...state.loadingChains].filter(id => id !== postId),
              ),
            }));
            return cached;
          }

          // Load quote chain using API service
          const response = await PostQuotingService.getQuoteChain(postId);
          const quoteChain = response.chain;

          // Cache the result
          set(state => {
            const newCache = new Map(state.chainCache);
            newCache.set(chainId, quoteChain);

            const newQuoteChains = new Map(state.quoteChains);
            newQuoteChains.set(chainId, quoteChain);

            return {
              chainCache: newCache,
              quoteChains: newQuoteChains,
              loadingChains: new Set(
                [...state.loadingChains].filter(id => id !== postId),
              ),
            };
          });

          return quoteChain;
        } catch (error) {
          set(state => ({
            loadingChains: new Set(
              [...state.loadingChains].filter(id => id !== postId),
            ),
          }));
          throw error;
        }
      },

      loadUserQuotes: async (wallet?: string) => {
        try {
          if (!wallet) {return;}

          const quotes = await PostQuotingService.getQuotesByUser(wallet);
          const userQuoteIds = quotes.map(quote => quote.id);

          // Update quotes in store
          set(state => {
            const newQuotes = new Map(state.quotes);
            quotes.forEach(quote => newQuotes.set(quote.id, quote));

            return {
              quotes: newQuotes,
              userQuotes: userQuoteIds,
            };
          });
        } catch (error) {
          console.error('Failed to load user quotes:', error);
        }
      },

      // Quote interactions
      likeQuote: async (quoteId: string) => {
        try {
          set(state => ({
            pendingInteractions: new Map([
              ...state.pendingInteractions,
              [quoteId, 'liking'],
            ]),
          }));

          // Optimistic update
          set(state => {
            const quote = state.quotes.get(quoteId);
            if (quote) {
              const updatedQuote = {
                ...quote,
                engagement: {
                  ...quote.engagement,
                  likes: quote.engagement.likes + 1,
                },
              };
              const newQuotes = new Map(state.quotes);
              newQuotes.set(quoteId, updatedQuote);
              return {quotes: newQuotes};
            }
            return state;
          });

          // Like quote using API service
          await PostQuotingService.likeQuote(quoteId);

          set(state => ({
            pendingInteractions: new Map(
              [...state.pendingInteractions].filter(([id]) => id !== quoteId),
            ),
          }));

          get().trackQuoteEvent('interact', quoteId, {action: 'like'});
        } catch (error) {
          // Revert optimistic update
          set(state => {
            const quote = state.quotes.get(quoteId);
            if (quote) {
              const revertedQuote = {
                ...quote,
                engagement: {
                  ...quote.engagement,
                  likes: Math.max(0, quote.engagement.likes - 1),
                },
              };
              const newQuotes = new Map(state.quotes);
              newQuotes.set(quoteId, revertedQuote);
              return {
                quotes: newQuotes,
                pendingInteractions: new Map(
                  [...state.pendingInteractions].filter(
                    ([id]) => id !== quoteId,
                  ),
                ),
              };
            }
            return {
              pendingInteractions: new Map(
                [...state.pendingInteractions].filter(([id]) => id !== quoteId),
              ),
            };
          });
          throw error;
        }
      },

      shareQuote: async (quoteId: string, message?: string) => {
        try {
          set(state => ({
            pendingInteractions: new Map([
              ...state.pendingInteractions,
              [quoteId, 'sharing'],
            ]),
          }));

          // Share quote using API service
          await PostQuotingService.shareQuote(quoteId, message);

          set(state => ({
            pendingInteractions: new Map(
              [...state.pendingInteractions].filter(([id]) => id !== quoteId),
            ),
          }));

          get().trackQuoteEvent('interact', quoteId, {
            action: 'share',
            message,
          });
        } catch (error) {
          set(state => ({
            pendingInteractions: new Map(
              [...state.pendingInteractions].filter(([id]) => id !== quoteId),
            ),
          }));
          throw error;
        }
      },

      tipQuote: async (quoteId: string, amount: number) => {
        try {
          set(state => ({
            pendingInteractions: new Map([
              ...state.pendingInteractions,
              [quoteId, 'tipping'],
            ]),
          }));

          // Tip quote using API service
          await PostQuotingService.tipQuote(quoteId, amount);

          set(state => ({
            pendingInteractions: new Map(
              [...state.pendingInteractions].filter(([id]) => id !== quoteId),
            ),
          }));

          get().trackQuoteEvent('interact', quoteId, {action: 'tip', amount});
        } catch (error) {
          set(state => ({
            pendingInteractions: new Map(
              [...state.pendingInteractions].filter(([id]) => id !== quoteId),
            ),
          }));
          throw error;
        }
      },

      reportQuote: async (quoteId: string, reason: string) => {
        try {
          // Report quote using API service
          await PostQuotingService.reportQuote(quoteId, reason);

          get().trackQuoteEvent('interact', quoteId, {
            action: 'report',
            reason,
          });
        } catch (error) {
          throw error;
        }
      },

      // Modal management
      openQuoteModal: (post: QuoteablePost) => {
        set({
          modalState: {
            ...DEFAULT_MODAL_STATE,
            isVisible: true,
            targetPost: post,
          },
        });
      },

      closeQuoteModal: () => {
        set({
          modalState: {...get().modalState, isVisible: false},
        });

        // Reset modal after animation
        setTimeout(() => {
          set({modalState: DEFAULT_MODAL_STATE});
        }, 300);
      },

      updateModalState: (updates: Partial<QuoteModalState>) => {
        set(state => ({
          modalState: {...state.modalState, ...updates},
        }));
      },

      // Preview management
      togglePreviewExpansion: (postId: string) => {
        set(state => {
          const newExpanded = new Set(state.expandedPreviews);
          if (newExpanded.has(postId)) {
            newExpanded.delete(postId);
          } else {
            newExpanded.add(postId);
          }
          return {expandedPreviews: newExpanded};
        });
      },

      preloadQuotePreview: async (postId: string) => {
        if (!get().previewCache.has(postId)) {
          await get().loadQuoteablePost(postId);
        }
      },

      // Chain management
      toggleChainExpansion: (chainId: string) => {
        set(state => {
          const newExpanded = new Set(state.expandedChains);
          if (newExpanded.has(chainId)) {
            newExpanded.delete(chainId);
          } else {
            newExpanded.add(chainId);
          }
          return {expandedChains: newExpanded};
        });
      },

      loadMoreInChain: async (chainId: string) => {
        try {
          // Mock loading more quotes in chain
          await new Promise(resolve => setTimeout(resolve, 800));

          // Would append more quotes to the chain
          console.log('Loading more quotes for chain:', chainId);
        } catch (error) {
          console.error('Failed to load more in chain:', error);
        }
      },

      // Search and discovery
      searchQuotes: async (query: string, filters?: QuoteSearchFilters) => {
        try {
          const results = await PostQuotingService.searchQuotes(query, filters);
          return results;
        } catch (error) {
          console.error('Search failed:', error);
          return [];
        }
      },

      getTrendingQuotes: async (timeframe = 'day') => {
        try {
          const response = await PostQuotingService.getTrendingQuotes(
            timeframe as 'hour' | 'day' | 'week',
          );
          return response.quotes;
        } catch (error) {
          console.error('Failed to load trending quotes:', error);
          return [];
        }
      },

      // Settings
      updateSettings: (settings: Partial<QuoteSettings>) => {
        set(state => ({
          settings: {...state.settings, ...settings},
        }));
      },

      resetSettings: () => {
        set({settings: DEFAULT_QUOTE_SETTINGS});
      },

      // Analytics
      trackQuoteEvent: (
        event: 'view' | 'quote' | 'expand' | 'interact',
        quoteId: string,
        metadata?: any,
      ) => {
        // Mock analytics tracking
        console.log('Quote event tracked:', {
          event,
          quoteId,
          metadata,
          timestamp: Date.now(),
        });
      },

      getQuoteAnalytics: async (timeframe = 'week') => {
        try {
          // Note: This method would need a postId parameter in real implementation
          // For now, returning cached analytics
          const analytics = get().analytics;
          return analytics;
        } catch (error) {
          console.error('Failed to load analytics:', error);
          return get().analytics;
        }
      },

      // Cache management
      clearCache: () => {
        set({
          previewCache: new Map(),
          chainCache: new Map(),
        });
      },

      optimizeCache: () => {
        set(state => {
          const newPreviewCache = new Map(state.previewCache);
          const newChainCache = new Map(state.chainCache);

          // Keep only the most recent CACHE_SIZE_LIMIT items
          if (newPreviewCache.size > QUOTE_LIMITS.CACHE_SIZE_LIMIT) {
            const entries = Array.from(newPreviewCache.entries());
            const toKeep = entries.slice(-QUOTE_LIMITS.CACHE_SIZE_LIMIT);
            newPreviewCache.clear();
            toKeep.forEach(([key, value]) => newPreviewCache.set(key, value));
          }

          if (newChainCache.size > QUOTE_LIMITS.CACHE_SIZE_LIMIT) {
            const entries = Array.from(newChainCache.entries());
            const toKeep = entries.slice(-QUOTE_LIMITS.CACHE_SIZE_LIMIT);
            newChainCache.clear();
            toKeep.forEach(([key, value]) => newChainCache.set(key, value));
          }

          return {
            previewCache: newPreviewCache,
            chainCache: newChainCache,
          };
        });
      },

      // Utilities
      getQuoteTypeInfo: (type: QuoteType): QuoteTypeInfo => {
        return (
          QUOTE_TYPES.find(qt => qt.type === type) ||
          QUOTE_TYPES[QUOTE_TYPES.length - 1]
        );
      },

      formatQuotePreview: (
        content: string,
        maxLength = QUOTE_LIMITS.PREVIEW_LENGTH,
      ): string => {
        if (content.length <= maxLength) {return content;}
        return content.substring(0, maxLength).trim() + '...';
      },

      validateQuoteContent: (
        content: string,
      ): {valid: boolean; error?: string} => {
        if (!content || content.trim().length === 0) {
          return {valid: false, error: 'Quote content cannot be empty'};
        }

        if (content.length < QUOTE_LIMITS.MIN_CONTENT_LENGTH) {
          return {
            valid: false,
            error: `Quote must be at least ${QUOTE_LIMITS.MIN_CONTENT_LENGTH} character`,
          };
        }

        if (content.length > QUOTE_LIMITS.MAX_CONTENT_LENGTH) {
          return {
            valid: false,
            error: `Quote cannot exceed ${QUOTE_LIMITS.MAX_CONTENT_LENGTH} characters`,
          };

        return {valid: true};
      },

      canUserQuote: (post: QuoteablePost, userWallet: string): boolean => {
        if (!post.canQuote || !post.quoteSettings.allowQuotes) {
          return false;
        }

        if (post.quoteDepth >= post.maxQuoteDepth) {
          return false;
        }

        // Add additional business logic as needed
        return true;
      },
    }),
    {
      name: 'post-quoting-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        settings: state.settings,
        userQuotes: state.userQuotes,
        analytics: state.analytics,
      }),
    },
  ),
);
