import {
  Brand,
  BrandCreationRequest,
  BrandUpdateRequest,
  BrandAnalytics,
  BrandFollower,
  BrandActivity,
  BrandVerificationRequest,
} from '@/types/brand';
import api from './client';

class BrandAPI {
  // Get user's brands
  async getUserBrands(): Promise<Brand[]> {
    const response = await api.get('/brands/me');

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch user brands',
      );
    }

    return (response.data as any).brands;
  }

  // Create a new brand
  async createBrand(request: BrandCreationRequest): Promise<Brand> {
    const response = await api.post('/brands', request);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to create brand',
      );
    }

    return response.data as Brand;
  }

  // Update an existing brand
  async updateBrand(
    brandId: string,
    request: BrandUpdateRequest,
  ): Promise<Brand> {
    const response = await api.put(`/brands/${brandId}`, request);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to update brand',
      );
    }

    return response.data as Brand;
  }

  // Delete a brand
  async deleteBrand(brandId: string): Promise<void> {
    const response = await api.delete(`/brands/${brandId}`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to delete brand',
      );
    }
  }

  // Get brand details
  async getBrandDetails(brandId: string): Promise<Brand> {
    const response = await api.get(`/brands/${brandId}`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch brand details',
      );
    }

    return response.data as Brand;
  }

  // Refresh brand activity
  async refreshBrandActivity(brandId: string): Promise<void> {
    const response = await api.post(`/brands/${brandId}/refresh-activity`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to refresh brand activity',
      );
    }
  }

  // Get brand analytics
  async getBrandAnalytics(
    brandId: string,
    timeframe: string,
  ): Promise<BrandAnalytics> {
    const response = await api.get(`/brands/${brandId}/analytics`, {
      params: {timeframe},
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch brand analytics',
      );
    }

    return response.data as BrandAnalytics;
  }

  // Export analytics
  async exportAnalytics(brandId: string, format: 'csv' | 'json'): Promise<any> {
    const response = await api.get(`/brands/${brandId}/analytics/export`, {
      params: {format},
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to export analytics',
      );
    }

    return response.data;
  }

  // Get brand followers
  async getBrandFollowers(brandId: string): Promise<BrandFollower[]> {
    const response = await api.get(`/brands/${brandId}/followers`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch brand followers',
      );
    }

    return (response.data as any).followers;
  }

  // Get brand activities
  async getBrandActivities(brandId: string): Promise<BrandActivity[]> {
    const response = await api.get(`/brands/${brandId}/activities`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch brand activities',
      );
    }

    return (response.data as any).activities;
  }

  // Request brand verification
  async requestVerification(
    brandId: string,
    verificationData: BrandVerificationRequest['verificationData'],
  ): Promise<void> {
    const response = await api.post(`/brands/${brandId}/verification`, {
      verificationData,
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to request verification',
      );
    }
  }

  // Follow/unfollow a brand
  async followBrand(brandId: string): Promise<void> {
    const response = await api.post(`/brands/${brandId}/follow`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to follow brand',
      );
    }
  }

  async unfollowBrand(brandId: string): Promise<void> {
    const response = await api.delete(`/brands/${brandId}/follow`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to unfollow brand',
      );
    }
  }

  // Get public brand profile
  async getBrandProfile(brandId: string): Promise<Brand> {
    const response = await api.get(`/brands/${brandId}/profile`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch brand profile',
      );
    }

    return response.data as Brand;
  }

  // Search brands
  async searchBrands(
    query: string,
    filters?: {
      category?: string;
      verified?: boolean;
      limit?: number;
    },
  ): Promise<Brand[]> {
    const response = await api.get('/brands/search', {
      params: {
        q: query,
        ...filters,
      },
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to search brands',
      );
    }

    return (response.data as any).brands;
  }

  // Get featured brands
  async getFeaturedBrands(): Promise<Brand[]> {
    const response = await api.get('/brands/featured');

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch featured brands',
      );
    }

    return (response.data as any).brands;
  }

  // Get trending brands
  async getTrendingBrands(): Promise<Brand[]> {
    const response = await api.get('/brands/trending');

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to fetch trending brands',
      );
    }

    return (response.data as any).brands;
  }

  // Check brand handle availability
  async checkHandleAvailability(handle: string): Promise<boolean> {
    const response = await api.get(`/brands/check-handle/${handle}`);

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message ||
          'Failed to check handle availability',
      );
    }

    return (response.data as any).available;
  }
}

export const brandAPI = new BrandAPI();
