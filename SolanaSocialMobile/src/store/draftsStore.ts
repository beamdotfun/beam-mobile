import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {draftsApi, Draft, DraftRequest, ThreadDraft} from '../services/api/drafts';
import {useAuthStore} from './auth';

interface DraftsState {
  drafts: Draft[];
  threads: ThreadDraft[];
  currentPage: number;
  totalPages: number;
  totalDrafts: number;
  isLoading: boolean;
  error: string | null;
  selectedDraft: Draft | null;
}

interface DraftsStore extends DraftsState {
  // Actions
  loadDrafts: (page?: number) => Promise<void>;
  loadThreads: () => Promise<void>;
  createDraft: (draft: DraftRequest) => Promise<Draft | null>;
  updateDraft: (draftId: number, updates: Partial<DraftRequest>) => Promise<boolean>;
  deleteDraft: (draftId: number) => Promise<boolean>;
  publishDraft: (draftId: number) => Promise<{signature: string} | null>;
  selectDraft: (draft: Draft | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: DraftsState = {
  drafts: [],
  threads: [],
  currentPage: 1,
  totalPages: 1,
  totalDrafts: 0,
  isLoading: false,
  error: null,
  selectedDraft: null,
};

export const useDraftsStore = create<DraftsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadDrafts: async (page = 1) => {
        set({ isLoading: true, error: null });
        
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await draftsApi.getDrafts(token, page);
          
          if (response.success) {
            set({
              drafts: response.data.drafts,
              currentPage: response.data.pagination.page,
              totalPages: response.data.pagination.total_pages,
              totalDrafts: response.data.pagination.total,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      loadThreads: async () => {
        console.log('📋 Loading threads using new /drafts/threads endpoint');
        set({ isLoading: true, error: null });
        
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await draftsApi.getThreads(token);
          
          if (response.success) {
            console.log('📋 Threads loaded successfully:', {
              threadsCount: response.data.threads.length,
              threads: response.data.threads.map(t => ({
                threadId: t.threadId,
                title: t.threadTitle,
                postCount: t.postCount
              }))
            });
            
            set({
              threads: response.data.threads,
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error('🚨 Failed to load threads:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      createDraft: async (draft) => {
        console.log('📝 DraftsStore: Creating draft:', draft);
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await draftsApi.createDraft(token, draft);
          console.log('📝 DraftsStore: Create draft response:', response);
          
          if (response.success) {
            // Reload drafts to include the new one
            await get().loadDrafts(1);
            return response.data;
          }
          
          return null;
        } catch (error: any) {
          console.error('🚨 DraftsStore: Failed to create draft:', error);
          set({ error: error.message });
          return null;
        }
      },

      updateDraft: async (draftId, updates) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await draftsApi.updateDraft(token, draftId, updates);
          
          if (response.success) {
            // Update local draft
            set(state => ({
              drafts: state.drafts.map(draft =>
                draft.id === draftId
                  ? { ...draft, ...updates, updatedAt: new Date().toISOString() }
                  : draft
              ),
            }));
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      deleteDraft: async (draftId) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await draftsApi.deleteDraft(token, draftId);
          
          if (response.success) {
            // Remove from local state
            set(state => ({
              drafts: state.drafts.filter(draft => draft.id !== draftId),
              totalDrafts: state.totalDrafts - 1,
            }));
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      publishDraft: async (draftId) => {
        console.log('📤 DraftsStore: Publishing draft:', draftId);
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await draftsApi.publishDraft(token, draftId);
          console.log('📤 DraftsStore: Publish response:', response);
          
          if (response.success) {
            // Remove from local state after successful publish
            set(state => ({
              drafts: state.drafts.filter(draft => draft.id !== draftId),
              totalDrafts: state.totalDrafts - 1,
              selectedDraft: null,
            }));
            return { signature: response.data.signature };
          }
          
          return null;
        } catch (error: any) {
          console.error('🚨 DraftsStore: Failed to publish draft:', error);
          set({ error: error.message });
          return null;
        }
      },

      selectDraft: (draft) => {
        set({ selectedDraft: draft });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'drafts-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist selected draft, not the full list
        selectedDraft: state.selectedDraft,
      }),
    }
  )
);