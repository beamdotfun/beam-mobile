import {create} from 'zustand';
import {
  Brand,
  BrandCreationRequest,
  BrandUpdateRequest,
  BrandAnalytics,
  BrandFollower,
  BrandActivity,
  BrandVerificationRequest,
} from '@/types/brand';
import {brandAPI} from '../services/api/brand';

interface BrandManagementState {
  // State
  userBrands: Brand[];
  selectedBrand: Brand | null;
  brandAnalytics: BrandAnalytics | null;
  brandFollowers: BrandFollower[];
  brandActivities: BrandActivity[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;

  // Brand management
  fetchUserBrands: () => Promise<void>;
  createBrand: (request: BrandCreationRequest) => Promise<Brand>;
  updateBrand: (brandId: string, request: BrandUpdateRequest) => Promise<void>;
  deleteBrand: (brandId: string) => Promise<void>;

  // Brand selection and details
  selectBrand: (brand: Brand) => void;
  fetchBrandDetails: (brandId: string) => Promise<void>;
  refreshBrandActivity: (brandId: string) => Promise<void>;

  // Analytics
  fetchBrandAnalytics: (brandId: string, timeframe: string) => Promise<void>;
  exportAnalytics: (brandId: string, format: 'csv' | 'json') => Promise<void>;

  // Followers
  fetchBrandFollowers: (brandId: string) => Promise<void>;

  // Activities
  fetchBrandActivities: (brandId: string) => Promise<void>;

  // Verification
  requestVerification: (
    brandId: string,
    verificationData: BrandVerificationRequest['verificationData'],
  ) => Promise<void>;

  // UI state
  clearError: () => void;
  clearSelectedBrand: () => void;
}

export const useBrandManagementStore = create<BrandManagementState>(
  (set, get) => ({
    // Initial state
    userBrands: [],
    selectedBrand: null,
    brandAnalytics: null,
    brandFollowers: [],
    brandActivities: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    error: null,

    // Fetch user's brands
    fetchUserBrands: async () => {
      set({isLoading: true, error: null});

      try {
        const brands = await brandAPI.getUserBrands();
        set({userBrands: brands, isLoading: false});
      } catch (error) {
        console.error('Failed to fetch user brands:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to fetch brands',
        });
      }
    },

    // Create a new brand
    createBrand: async (request: BrandCreationRequest) => {
      set({isCreating: true, error: null});

      try {
        const newBrand = await brandAPI.createBrand(request);

        set(state => ({
          userBrands: [...state.userBrands, newBrand],
          isCreating: false,
        }));

        return newBrand;
      } catch (error) {
        console.error('Failed to create brand:', error);
        set({
          isCreating: false,
          error:
            error instanceof Error ? error.message : 'Failed to create brand',
        });
        throw error;
      }
    },

    // Update an existing brand
    updateBrand: async (brandId: string, request: BrandUpdateRequest) => {
      set({isUpdating: true, error: null});

      try {
        const updatedBrand = await brandAPI.updateBrand(brandId, request);

        set(state => ({
          userBrands: state.userBrands.map(brand =>
            brand.id === brandId ? updatedBrand : brand,
          ),
          selectedBrand:
            state.selectedBrand?.id === brandId
              ? updatedBrand
              : state.selectedBrand,
          isUpdating: false,
        }));
      } catch (error) {
        console.error('Failed to update brand:', error);
        set({
          isUpdating: false,
          error:
            error instanceof Error ? error.message : 'Failed to update brand',
        });
        throw error;
      }
    },

    // Delete a brand
    deleteBrand: async (brandId: string) => {
      set({isLoading: true, error: null});

      try {
        await brandAPI.deleteBrand(brandId);

        set(state => ({
          userBrands: state.userBrands.filter(brand => brand.id !== brandId),
          selectedBrand:
            state.selectedBrand?.id === brandId ? null : state.selectedBrand,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to delete brand:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to delete brand',
        });
        throw error;
      }
    },

    // Select a brand
    selectBrand: (brand: Brand) => {
      set({selectedBrand: brand});
    },

    // Fetch brand details
    fetchBrandDetails: async (brandId: string) => {
      set({isLoading: true, error: null});

      try {
        const brand = await brandAPI.getBrandDetails(brandId);
        set({selectedBrand: brand, isLoading: false});
      } catch (error) {
        console.error('Failed to fetch brand details:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch brand details',
        });
      }
    },

    // Refresh brand activity
    refreshBrandActivity: async (brandId: string) => {
      try {
        await brandAPI.refreshBrandActivity(brandId);
        // Refresh the brand details after activity refresh
        await get().fetchBrandDetails(brandId);
      } catch (error) {
        console.error('Failed to refresh brand activity:', error);
      }
    },

    // Fetch brand analytics
    fetchBrandAnalytics: async (brandId: string, timeframe: string) => {
      set({isLoading: true, error: null});

      try {
        const analytics = await brandAPI.getBrandAnalytics(brandId, timeframe);
        set({brandAnalytics: analytics, isLoading: false});
      } catch (error) {
        console.error('Failed to fetch brand analytics:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch analytics',
        });
      }
    },

    // Export analytics
    exportAnalytics: async (brandId: string, format: 'csv' | 'json') => {
      try {
        const data = await brandAPI.exportAnalytics(brandId, format);

        // For React Native, we'll provide the data for the UI to handle
        // The actual export will depend on the platform's capabilities
        console.log('Analytics export data:', data);

        // You could use react-native-fs or similar to save the file
        // or provide a share functionality
      } catch (error) {
        console.error('Failed to export analytics:', error);
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to export analytics',
        });
      }
    },

    // Fetch brand followers
    fetchBrandFollowers: async (brandId: string) => {
      set({isLoading: true, error: null});

      try {
        const followers = await brandAPI.getBrandFollowers(brandId);
        set({brandFollowers: followers, isLoading: false});
      } catch (error) {
        console.error('Failed to fetch brand followers:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch followers',
        });
      }
    },

    // Fetch brand activities
    fetchBrandActivities: async (brandId: string) => {
      set({isLoading: true, error: null});

      try {
        const activities = await brandAPI.getBrandActivities(brandId);
        set({brandActivities: activities, isLoading: false});
      } catch (error) {
        console.error('Failed to fetch brand activities:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch activities',
        });
      }
    },

    // Request brand verification
    requestVerification: async (
      brandId: string,
      verificationData: BrandVerificationRequest['verificationData'],
    ) => {
      set({isLoading: true, error: null});

      try {
        await brandAPI.requestVerification(brandId, verificationData);
        // Refresh brand details to show updated verification status
        await get().fetchBrandDetails(brandId);
        set({isLoading: false});
      } catch (error) {
        console.error('Failed to request verification:', error);
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to request verification',
        });
        throw error;
      }
    },

    // Clear error
    clearError: () => set({error: null}),

    // Clear selected brand
    clearSelectedBrand: () => set({selectedBrand: null}),
  }),
);
