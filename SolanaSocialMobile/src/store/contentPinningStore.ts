import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api/client';
import {
  PinnedPost,
  PinningCapabilities,
  PinHistory,
} from '@/types/content-pinning';

interface ContentPinningState {
  // State
  pinnedPosts: PinnedPost[];
  capabilities: PinningCapabilities | null;
  pinHistory: PinHistory[];

  // UI State
  isLoading: boolean;
  isPinning: boolean;
  error: string | null;

  // Pin Operations
  pinPost: (postId: string, reason?: string) => Promise<void>;
  unpinPost: (postId: string) => Promise<void>;

  // Data Loading
  loadPinnedPosts: (userWallet?: string) => Promise<void>;
  loadPinningCapabilities: () => Promise<void>;
  loadPinHistory: () => Promise<void>;

  // Utilities
  isPinned: (postId: string) => boolean;
  canPinMore: () => boolean;

  // UI Actions
  clearError: () => void;
}

export const useContentPinningStore = create<ContentPinningState>()(
  persist(
    (set, get) => ({
      // Initial state
      pinnedPosts: [],
      capabilities: null,
      pinHistory: [],
      isLoading: false,
      isPinning: false,
      error: null,

      // Pin a post
      pinPost: async (postId, reason) => {
        set({isPinning: true, error: null});

        try {
          const response = await api.post('/posts/pin', {
            postId,
            reason,
          });

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to pin post');
          }

          const pinnedPost = response.data?.data;

          // Update state optimistically
          set(state => ({
            pinnedPosts: [pinnedPost, ...state.pinnedPosts],
            capabilities: state.capabilities
              ? {
                  ...state.capabilities,
                  currentPins: state.capabilities.currentPins + 1,
                }
              : null,
            isPinning: false,
          }));
        } catch (error) {
          set({
            isPinning: false,
            error:
              error instanceof Error ? error.message : 'Failed to pin post',
          });
          throw error;
        }
      },

      // Unpin a post
      unpinPost: async postId => {
        set({isPinning: true, error: null});

        try {
          const response = await api.delete(`/posts/${postId}/unpin`);

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to unpin post');
          }

          // Update state optimistically
          set(state => ({
            pinnedPosts: state.pinnedPosts.filter(pin => pin.postId !== postId),
            capabilities: state.capabilities
              ? {
                  ...state.capabilities,
                  currentPins: Math.max(0, state.capabilities.currentPins - 1),
                }
              : null,
            isPinning: false,
          }));
        } catch (error) {
          set({
            isPinning: false,
            error:
              error instanceof Error ? error.message : 'Failed to unpin post',
          });
          throw error;
        }
      },

      // Load pinned posts
      loadPinnedPosts: async userWallet => {
        set({isLoading: true, error: null});

        try {
          const endpoint = userWallet
            ? `/users/${userWallet}/pins`
            : '/users/pins';

          const response = await api.get(endpoint);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to load pinned posts',
            );
          }

          const pinnedPosts = response.data?.data || [];
          set({pinnedPosts, isLoading: false});
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load pinned posts',
          });
        }
      },

      // Load pinning capabilities
      loadPinningCapabilities: async () => {
        try {
          const response = await api.get('/users/pin-capabilities');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to load capabilities',
            );
          }

          const capabilities = response.data?.data;
          set({capabilities});
        } catch (error) {
          console.error('Failed to load capabilities:', error);
        }
      },

      // Load pin history
      loadPinHistory: async () => {
        try {
          const response = await api.get('/users/pin-history');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to load pin history',
            );
          }

          const history = response.data?.data || [];
          set({pinHistory: history});
        } catch (error) {
          console.error('Failed to load pin history:', error);
        }
      },

      // Check if post is pinned
      isPinned: postId => {
        return get().pinnedPosts.some(
          pin => pin.postId === postId && pin.isActive,
        );
      },

      // Check if user can pin more posts
      canPinMore: () => {
        const {capabilities} = get();
        if (!capabilities) {
          return false;
        }
        return (
          capabilities.canPin && capabilities.currentPins < capabilities.maxPins
        );
      },

      // Clear error
      clearError: () => set({error: null}),
    }),
    {
      name: 'content-pinning-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        // Only persist essential data, not loading states
        pinnedPosts: state.pinnedPosts,
        capabilities: state.capabilities,
      }),
    },
  ),
);
