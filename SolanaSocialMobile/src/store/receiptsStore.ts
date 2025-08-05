import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {receiptsApi, Receipt, ReceiptCategory} from '../services/api/receipts';
import {useAuthStore} from './auth';

interface ReceiptsState {
  // Receipts data
  receipts: Receipt[];
  receiptStatusCache: Record<string, boolean>; // signature -> isReceipted
  categories: ReceiptCategory[];
  
  // Pagination
  currentPage: number;
  hasMoreReceipts: boolean;
  isLoadingReceipts: boolean;
  
  // Categories
  isLoadingCategories: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  loadReceipts: (page?: number, categoryId?: string) => Promise<void>;
  loadMoreReceipts: () => Promise<void>;
  addReceipt: (signature: string, categoryId?: number, notes?: string) => Promise<boolean>;
  removeReceipt: (signature: string) => Promise<boolean>;
  updateReceipt: (signature: string, categoryId?: number, notes?: string) => Promise<boolean>;
  checkReceiptStatus: (signature: string) => Promise<boolean>;
  checkMultipleReceiptStatus: (signatures: string[]) => Promise<void>;
  
  // Category actions
  loadCategories: () => Promise<void>;
  createCategory: (name: string, description?: string, color?: string, icon?: string) => Promise<boolean>;
  updateCategory: (categoryId: number, updates: any) => Promise<boolean>;
  deleteCategory: (categoryId: number) => Promise<boolean>;
  
  // Utility actions
  getReceiptBySignature: (signature: string) => Receipt | undefined;
  getCategoryById: (categoryId: number) => ReceiptCategory | undefined;
  isPostReceipted: (signature: string) => boolean;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  receipts: [],
  receiptStatusCache: {},
  categories: [],
  currentPage: 1,
  hasMoreReceipts: true,
  isLoadingReceipts: false,
  isLoadingCategories: false,
  error: null,
};

export const useReceiptsStore = create<ReceiptsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadReceipts: async (page = 1, categoryId) => {
        set({ isLoadingReceipts: true, error: null });
        
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.getUserReceipts(token, page, 20, categoryId);
          
          console.log('📝 ReceiptsStore: Full API response:', JSON.stringify(response, null, 2));
          
          if (response.success) {
            // Handle nested response structure: response.data.data.receipts
            const responseData = response.data.data || response.data;
            const receiptsData = responseData.receipts || [];
            const paginationData = responseData.pagination || response.data.pagination;
            
            console.log('📝 ReceiptsStore: Parsed response data:', {
              responseDataKeys: Object.keys(responseData),
              receiptsCount: receiptsData.length,
              paginationData
            });
            
            // Log detailed receipt structure for debugging
            if (receiptsData.length > 0) {
              console.log('📝 ReceiptsStore: First receipt structure:', JSON.stringify(receiptsData[0], null, 2));
              console.log('📝 ReceiptsStore: First receipt post data:', receiptsData[0]?.post);
              console.log('📝 ReceiptsStore: First receipt user data:', receiptsData[0]?.post?.user);
              console.log('📝 ReceiptsStore: First receipt userInfo data:', receiptsData[0]?.post?.userInfo);
            }
            
            const newReceipts = page === 1 ? receiptsData : [...get().receipts, ...receiptsData];
            
            // Update status cache
            const newStatusCache = { ...get().receiptStatusCache };
            receiptsData.forEach(receipt => {
              newStatusCache[receipt.signature] = true;
            });
            
            set({
              receipts: newReceipts,
              receiptStatusCache: newStatusCache,
              currentPage: page,
              hasMoreReceipts: paginationData.page < paginationData.total_pages,
              isLoadingReceipts: false,
            });
          } else {
            throw new Error('Failed to load receipts');
          }
        } catch (error: any) {
          set({ error: error.message, isLoadingReceipts: false });
        }
      },

      loadMoreReceipts: async () => {
        const { currentPage, hasMoreReceipts, isLoadingReceipts } = get();
        
        if (!hasMoreReceipts || isLoadingReceipts) return;
        
        await get().loadReceipts(currentPage + 1);
      },

      addReceipt: async (signature, categoryId, notes) => {
        console.log('📝 ReceiptsStore: addReceipt called with:', { signature, categoryId, notes });
        try {
          const { token } = useAuthStore.getState();
          console.log('📝 ReceiptsStore: Auth token exists:', !!token);
          if (!token) {
            throw new Error('Not authenticated');
          }

          console.log('📝 ReceiptsStore: Calling receiptsApi.addReceipt...');
          const response = await receiptsApi.addReceipt(token, signature, categoryId, notes);
          console.log('📝 ReceiptsStore: API response:', response);
          
          if (response.success) {
            console.log('✅ ReceiptsStore: Receipt added successfully');
            // Update status cache immediately for optimistic UI
            set(state => ({
              receiptStatusCache: {
                ...state.receiptStatusCache,
                [signature]: true,
              },
            }));
            
            // Reload receipts to get the full receipt object
            await get().loadReceipts(1);
            return true;
          }
          
          console.log('❌ ReceiptsStore: API response not successful');
          return false;
        } catch (error: any) {
          console.log('🚨 ReceiptsStore: Error adding receipt:', error);
          set({ error: error.message });
          return false;
        }
      },

      removeReceipt: async (signature) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.removeReceipt(token, signature);
          
          if (response.success) {
            // Update state immediately
            set(state => ({
              receipts: state.receipts.filter(receipt => receipt.signature !== signature),
              receiptStatusCache: {
                ...state.receiptStatusCache,
                [signature]: false,
              },
            }));
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      updateReceipt: async (signature, categoryId, notes) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.updateReceipt(token, signature, categoryId, notes);
          
          if (response.success) {
            // Update local receipt with full category info
            set(state => {
              const category = categoryId 
                ? state.categories.find(cat => cat.id === categoryId) 
                : undefined;
              
              return {
                receipts: state.receipts.map(receipt =>
                  receipt.signature === signature
                    ? { ...receipt, categoryId, notes, category }
                    : receipt
                ),
              };
            });
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      checkReceiptStatus: async (signature) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            return false;
          }

          // Check cache first
          const cached = get().receiptStatusCache[signature];
          if (cached !== undefined) {
            return cached;
          }

          const response = await receiptsApi.checkReceipt(token, signature);
          
          if (response.success) {
            const isReceipted = response.data.isReceipted;
            
            // Update cache
            set(state => ({
              receiptStatusCache: {
                ...state.receiptStatusCache,
                [signature]: isReceipted,
              },
            }));
            
            return isReceipted;
          }
          
          return false;
        } catch (error: any) {
          return false;
        }
      },

      checkMultipleReceiptStatus: async (signatures) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token || signatures.length === 0) {
            return;
          }

          // Filter out signatures we already have cached
          const uncachedSignatures = signatures.filter(
            sig => get().receiptStatusCache[sig] === undefined
          );

          if (uncachedSignatures.length === 0) {
            console.log('📝 ReceiptsStore: All signatures already cached');
            return;
          }

          console.log('📝 ReceiptsStore: Batch checking', uncachedSignatures.length, 'signatures');
          const statusMap = await receiptsApi.checkMultipleReceipts(token, uncachedSignatures);
          console.log('📝 ReceiptsStore: Batch check results:', statusMap);
          
          // Update cache with results
          set(state => ({
            receiptStatusCache: {
              ...state.receiptStatusCache,
              ...statusMap,
            },
          }));
        } catch (error: any) {
          // Silently fail for batch operations
          console.warn('Failed to check multiple receipt status:', error.message);
        }
      },

      loadCategories: async () => {
        set({ isLoadingCategories: true, error: null });
        
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.getCategories(token);
          
          if (response.success) {
            set({
              categories: response.data,
              isLoadingCategories: false,
            });
          } else {
            throw new Error('Failed to load categories');
          }
        } catch (error: any) {
          set({ error: error.message, isLoadingCategories: false });
        }
      },

      createCategory: async (name, description, color = '#3B82F6', icon) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.createCategory(token, {
            name,
            description,
            color,
            icon,
          });
          
          if (response.success) {
            // Reload categories
            await get().loadCategories();
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      updateCategory: async (categoryId, updates) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.updateCategory(token, categoryId, updates);
          
          if (response.success) {
            // Update local category
            set(state => ({
              categories: state.categories.map(cat =>
                cat.id === categoryId ? { ...cat, ...updates } : cat
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

      deleteCategory: async (categoryId) => {
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await receiptsApi.deleteCategory(token, categoryId);
          
          if (response.success) {
            // Remove category from state
            set(state => ({
              categories: state.categories.filter(cat => cat.id !== categoryId),
            }));
            
            // Reload receipts to reflect category changes
            await get().loadReceipts(1);
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      // Utility functions
      getReceiptBySignature: (signature) => {
        return get().receipts.find(receipt => receipt.signature === signature);
      },

      getCategoryById: (categoryId) => {
        return get().categories.find(category => category.id === categoryId);
      },

      isPostReceipted: (signature) => {
        return get().receiptStatusCache[signature] || false;
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'receipts-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist the cache, not the full receipts data
        receiptStatusCache: state.receiptStatusCache,
      }),
    }
  )
);