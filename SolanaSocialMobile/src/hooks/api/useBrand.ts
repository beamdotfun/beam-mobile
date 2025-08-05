import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {brandAPI} from '../../services/api/brand';

// Query Keys
export const BRAND_QUERY_KEYS = {
  brands: ['brands'],
  brand: (brandId: string) => ['brands', brandId],
  userBrands: ['brands', 'user'],
  brandFollowers: (brandId: string) => ['brands', brandId, 'followers'],
  brandActivities: (brandId: string) => ['brands', brandId, 'activities'],
  brandAnalytics: (brandId: string) => ['brands', brandId, 'analytics'],
} as const;

// Brand Management Hooks
export function useBrand(brandId: string) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.brand(brandId),
    queryFn: () => brandAPI.getBrandDetails(brandId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUserBrands() {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.userBrands,
    queryFn: () => brandAPI.getUserBrands(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useFeaturedBrands() {
  return useQuery({
    queryKey: [...BRAND_QUERY_KEYS.brands, 'featured'],
    queryFn: () => brandAPI.getFeaturedBrands(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTrendingBrands() {
  return useQuery({
    queryKey: [...BRAND_QUERY_KEYS.brands, 'trending'],
    queryFn: () => brandAPI.getTrendingBrands(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useBrandFollowers(brandId: string) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.brandFollowers(brandId),
    queryFn: () => brandAPI.getBrandFollowers(brandId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 7 * 60 * 1000, // 7 minutes
  });
}

export function useBrandActivities(brandId: string) {
  return useQuery({
    queryKey: BRAND_QUERY_KEYS.brandActivities(brandId),
    queryFn: () => brandAPI.getBrandActivities(brandId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 7 * 60 * 1000, // 7 minutes
  });
}

export function useBrandAnalytics(brandId: string, timeframe: string) {
  return useQuery({
    queryKey: [...BRAND_QUERY_KEYS.brandAnalytics(brandId), timeframe],
    queryFn: () => brandAPI.getBrandAnalytics(brandId, timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Brand Mutations
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandAPI.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: BRAND_QUERY_KEYS.brands});
      queryClient.invalidateQueries({queryKey: BRAND_QUERY_KEYS.userBrands});
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({brandId, brandData}: {brandId: string; brandData: any}) =>
      brandAPI.updateBrand(brandId, brandData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BRAND_QUERY_KEYS.brand(variables.brandId),
      });
      queryClient.invalidateQueries({queryKey: BRAND_QUERY_KEYS.userBrands});
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandAPI.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: BRAND_QUERY_KEYS.brands});
      queryClient.invalidateQueries({queryKey: BRAND_QUERY_KEYS.userBrands});
    },
  });
}

export function useFollowBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandAPI.followBrand,
    onSuccess: (_, brandId) => {
      queryClient.invalidateQueries({
        queryKey: BRAND_QUERY_KEYS.brand(brandId),
      });
      queryClient.invalidateQueries({
        queryKey: BRAND_QUERY_KEYS.brandFollowers(brandId),
      });
    },
  });
}

export function useUnfollowBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandAPI.unfollowBrand,
    onSuccess: (_, brandId) => {
      queryClient.invalidateQueries({
        queryKey: BRAND_QUERY_KEYS.brand(brandId),
      });
      queryClient.invalidateQueries({
        queryKey: BRAND_QUERY_KEYS.brandFollowers(brandId),
      });
    },
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brandId,
      verificationData,
    }: {
      brandId: string;
      verificationData: any;
    }) => brandAPI.requestVerification(brandId, verificationData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BRAND_QUERY_KEYS.brand(variables.brandId),
      });
    },
  });
}
