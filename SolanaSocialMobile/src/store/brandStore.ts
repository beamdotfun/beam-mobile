import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Brand, BrandProfile, Product} from '../types/brands';
import {api, brandAPI} from '../services/api';

interface BrandState {
  // Brand data
  brands: Record<string, Brand>;
  brandProfiles: Record<string, BrandProfile>;
  followedBrands: string[];
  ownedBrands: string[]; // Brands owned by current user

  // UI state
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Current brand
  currentBrandId: string | null;

  // Brand data actions
  fetchBrand: (brandId: string) => Promise<void>;
  fetchBrandProfile: (brandId: string) => Promise<void>;
  fetchOwnedBrands: () => Promise<void>;

  // Following functionality
  followBrand: (brandId: string) => Promise<void>;
  unfollowBrand: (brandId: string) => Promise<void>;
  fetchFollowedBrands: () => Promise<void>;

  // Brand management (for owned brands)
  updateBrandProfile: (
    brandId: string,
    updates: Partial<BrandProfile>,
  ) => Promise<void>;
  updateBrandSettings: (brandId: string, settings: any) => Promise<void>;
  createProduct: (
    brandId: string,
    product: Omit<Product, 'id'>,
  ) => Promise<Product>;
  updateProduct: (
    brandId: string,
    productId: string,
    updates: Partial<Product>,
  ) => Promise<void>;
  deleteProduct: (brandId: string, productId: string) => Promise<void>;

  // Analytics (for owned brands)
  fetchBrandAnalytics: (brandId: string) => Promise<void>;

  // Products/Collections
  fetchBrandProducts: (brandId: string) => Promise<void>;
  fetchBrandCollections: (brandId: string) => Promise<void>;

  // Utility functions
  isOwner: (brandId: string) => boolean;
  isFollowing: (brandId: string) => boolean;
  clearCache: () => void;
  clearError: () => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      brands: {},
      brandProfiles: {},
      followedBrands: [],
      ownedBrands: [],
      loading: false,
      refreshing: false,
      error: null,
      currentBrandId: null,

      fetchBrand: async brandId => {
        set({loading: true, error: null});

        try {
          const response = await api.get(`/brands/${brandId}`);
          const brand = response.data.data;

          set(state => ({
            brands: {
              ...state.brands,
              [brandId]: brand,
            },
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to fetch brand',
            loading: false,
          });
        }
      },

      fetchBrandProfile: async brandId => {
        set({loading: true, error: null});

        try {
          const profile = await brandAPI.getBrandProfile(brandId);

          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: profile,
            },
            brands: {
              ...state.brands,
              [brandId]: profile,
            },
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch brand profile',
            loading: false,
          });
        }
      },

      fetchOwnedBrands: async () => {
        try {
          const response = await api.get('/brands/owned');
          set({ownedBrands: response.data.data.map((b: Brand) => b.id)});
        } catch (error) {
          console.error('Failed to fetch owned brands:', error);
        }
      },

      updateBrandProfile: async (brandId, updates) => {
        set({loading: true, error: null});

        try {
          const response = await api.patch(`/brands/${brandId}`, updates);
          const updatedBrand = response.data.data;

          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: updatedBrand,
            },
            brands: {
              ...state.brands,
              [brandId]: updatedBrand,
            },
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update brand profile',
            loading: false,
          });
          throw error;
        }
      },

      updateBrandSettings: async (brandId, settings) => {
        try {
          await api.patch(`/brands/${brandId}/settings`, settings);
          // Refetch brand profile to get updated settings
          await get().fetchBrandProfile(brandId);
        } catch (error) {
          throw error;
        }
      },

      createProduct: async (brandId, product) => {
        try {
          const response = await api.post(
            `/brands/${brandId}/products`,
            product,
          );
          const newProduct = response.data.data;

          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: {
                ...state.brandProfiles[brandId],
                featuredProducts: [
                  ...(state.brandProfiles[brandId]?.featuredProducts || []),
                  newProduct,
                ],
              },
            },
          }));

          return newProduct;
        } catch (error) {
          throw error;
        }
      },

      updateProduct: async (brandId, productId, updates) => {
        try {
          const response = await api.patch(
            `/brands/${brandId}/products/${productId}`,
            updates,
          );
          const updatedProduct = response.data.data;

          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: {
                ...state.brandProfiles[brandId],
                featuredProducts:
                  state.brandProfiles[brandId]?.featuredProducts?.map(product =>
                    product.id === productId ? updatedProduct : product,
                  ) || [],
              },
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      deleteProduct: async (brandId, productId) => {
        try {
          await api.delete(`/brands/${brandId}/products/${productId}`);

          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: {
                ...state.brandProfiles[brandId],
                featuredProducts:
                  state.brandProfiles[brandId]?.featuredProducts?.filter(
                    product => product.id !== productId,
                  ) || [],
              },
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      fetchBrandAnalytics: async brandId => {
        try {
          const response = await api.get(`/brands/${brandId}/analytics`);
          const analytics = response.data.data;

          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: {
                ...state.brandProfiles[brandId],
                analytics,
              },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch brand analytics:', error);
          throw error;
        }
      },

      followBrand: async brandId => {
        try {
          await brandAPI.followBrand(brandId);

          set(state => ({
            followedBrands: [...state.followedBrands, brandId],
            brands: {
              ...state.brands,
              [brandId]: {
                ...state.brands[brandId],
                followerCount: (state.brands[brandId]?.followerCount || 0) + 1,
              },
            },
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: state.brandProfiles[brandId]
                ? {
                    ...state.brandProfiles[brandId],
                    followerCount:
                      (state.brandProfiles[brandId].followerCount || 0) + 1,
                  }
                : state.brandProfiles[brandId],
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      unfollowBrand: async brandId => {
        try {
          await brandAPI.unfollowBrand(brandId);

          set(state => ({
            followedBrands: state.followedBrands.filter(id => id !== brandId),
            brands: {
              ...state.brands,
              [brandId]: {
                ...state.brands[brandId],
                followerCount: Math.max(
                  0,
                  (state.brands[brandId]?.followerCount || 0) - 1,
                ),
              },
            },
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: state.brandProfiles[brandId]
                ? {
                    ...state.brandProfiles[brandId],
                    followerCount: Math.max(
                      0,
                      (state.brandProfiles[brandId].followerCount || 0) - 1,
                    ),
                  }
                : state.brandProfiles[brandId],
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      fetchFollowedBrands: async () => {
        try {
          const response = await api.get('/brands/following');
          set({followedBrands: response.data.data.map((b: Brand) => b.id)});
        } catch (error) {
          console.error('Failed to fetch followed brands:', error);
        }
      },

      isOwner: brandId => {
        return get().ownedBrands.includes(brandId);
      },

      isFollowing: brandId => {
        return get().followedBrands.includes(brandId);
      },

      fetchBrandProducts: async brandId => {
        try {
          const response = await api.get(`/brands/${brandId}/products`);
          // Update brand profile with products
          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: {
                ...state.brandProfiles[brandId],
                featuredProducts: response.data.data,
              },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch brand products:', error);
          throw error;
        }
      },

      fetchBrandCollections: async brandId => {
        try {
          const response = await api.get(`/brands/${brandId}/collections`);
          // Update brand profile with collections
          set(state => ({
            brandProfiles: {
              ...state.brandProfiles,
              [brandId]: {
                ...state.brandProfiles[brandId],
                collections: response.data.data,
              },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch brand collections:', error);
          throw error;
        }
      },

      clearCache: () => {
        set({
          brands: {},
          brandProfiles: {},
          currentBrandId: null,
        });
      },

      clearError: () => {
        set({error: null});
      },
    }),
    {
      name: 'brand-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        followedBrands: state.followedBrands,
        ownedBrands: state.ownedBrands,
      }),
    },
  ),
);
