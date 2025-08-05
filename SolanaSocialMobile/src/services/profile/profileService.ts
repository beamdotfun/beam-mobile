import api from '../api/client';
import {ApiResponse} from '../api/types';
import {
  ProfileCustomization,
  ProfileAnalytics,
  Achievement,
  ProfileVerification,
  FollowerInsights,
  ProfileShowcase,
} from '@/types/profile-enhanced';

class ProfileService {
  // Analytics
  async getAnalytics(params: {
    period?: '24h' | '7d' | '30d' | 'all';
  }): Promise<ApiResponse<ProfileAnalytics>> {
    try {
      const response = await api.get<ApiResponse<ProfileAnalytics>>(
        `/profile/analytics?period=${params.period || '7d'}`,
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to fetch analytics',
        data: null,
      };
    }
  }

  async exportAnalytics(
    format: 'csv' | 'pdf',
  ): Promise<ApiResponse<{url: string}>> {
    try {
      const response = await api.post<ApiResponse<{url: string}>>(
        '/profile/analytics/export',
        {format},
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to export analytics',
        data: null,
      };
    }
  }

  // Achievements
  async getAchievements(): Promise<ApiResponse<Achievement[]>> {
    try {
      const response = await api.get<ApiResponse<Achievement[]>>(
        '/profile/achievements',
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: []};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to fetch achievements',
        data: [],
      };
    }
  }

  async claimAchievement(
    achievementId: string,
  ): Promise<ApiResponse<Achievement>> {
    try {
      const response = await api.post<ApiResponse<Achievement>>(
        `/profile/achievements/${achievementId}/claim`,
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to claim achievement',
        data: null,
      };
    }
  }

  async featureAchievement(
    achievementId: string,
    featured: boolean,
  ): Promise<ApiResponse<null>> {
    try {
      const response = await api.patch<ApiResponse<null>>(
        `/profile/achievements/${achievementId}/feature`,
        {featured},
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to update achievement',
        data: null,
      };
    }
  }

  // Verification
  async getVerificationStatus(): Promise<ApiResponse<ProfileVerification>> {
    try {
      const response = await api.get<ApiResponse<ProfileVerification>>(
        '/profile/verification',
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to fetch verification status',
        data: null,
      };
    }
  }

  async startVerification(
    type: string,
  ): Promise<ApiResponse<ProfileVerification>> {
    try {
      const response = await api.post<ApiResponse<ProfileVerification>>(
        '/profile/verification/start',
        {type},
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to start verification',
        data: null,
      };
    }
  }

  async submitVerificationStep(
    stepId: string,
    data: any,
  ): Promise<ApiResponse<ProfileVerification>> {
    try {
      const response = await api.post<ApiResponse<ProfileVerification>>(
        `/profile/verification/steps/${stepId}`,
        data,
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to submit verification step',
        data: null,
      };
    }
  }

  // Customization
  async updateCustomization(
    customization: ProfileCustomization,
  ): Promise<ApiResponse<null>> {
    try {
      const response = await api.put<ApiResponse<null>>(
        '/profile/customization',
        customization,
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to update customization',
        data: null,
      };
    }
  }

  async resetCustomization(): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(
        '/profile/customization',
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to reset customization',
        data: null,
      };
    }
  }

  // Showcase
  async updateShowcase(showcase: ProfileShowcase): Promise<ApiResponse<null>> {
    try {
      const response = await api.put<ApiResponse<null>>(
        '/profile/showcase',
        showcase,
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: null};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to update showcase',
        data: null,
      };
    }
  }

  // Follower insights
  async getFollowerInsights(params: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<FollowerInsights[]>> {
    try {
      const response = await api.get<ApiResponse<FollowerInsights[]>>(
        `/profile/followers/insights?page=${params.page || 1}&limit=${
          params.limit || 20
        }`,
      );
      if (response.ok && response.data) {
        return response.data;
      }
      return {status: 'error', message: 'No data', data: []};
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to fetch follower insights',
        data: [],
      };
    }
  }
}

export const profileService = new ProfileService();
