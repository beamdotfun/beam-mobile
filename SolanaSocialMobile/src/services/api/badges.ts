import api from './client';
import { ApiResponse } from './types';

// Badge API response types based on badge integration guide
export interface BadgeResponse {
  id: number;
  badge_name: string;
  badge_description: string;
  badge_criteria?: string;
  badge_category?: string;
  badge_icon?: string;
  earned: boolean;
  display_enabled: boolean;
  user_badge_id?: number;
}

export interface BadgesData {
  badges: BadgeResponse[];
  badgesEnabled: boolean;
}

export interface PublicBadgesData {
  badges: BadgeResponse[];
}

export class BadgeAPIService {
  // Get user's badges (authenticated)
  async getUserBadges(): Promise<BadgesData> {
    console.log('🔍 BadgeAPI: Getting user badges');
    const response = await api.get<ApiResponse<BadgesData>>('/user/badges');
    
    console.log('🔍 BadgeAPI: User badges response:', {
      ok: response.ok,
      status: response.status,
      problem: response.problem,
      data: JSON.stringify(response.data, null, 2)
    });
    
    if (!response.ok) {
      throw new Error(response.problem || 'Failed to load user badges');
    }
    
    return response.data!.data;
  }

  // Get public profile badges
  async getPublicBadges(userIdOrWallet: string): Promise<PublicBadgesData> {
    console.log('🔍 BadgeAPI: Getting public badges for:', userIdOrWallet);
    const response = await api.get<ApiResponse<PublicBadgesData>>(
      `/social/users/${userIdOrWallet}/badges`
    );
    
    console.log('🔍 BadgeAPI: Public badges response:', {
      ok: response.ok,
      status: response.status,
      problem: response.problem,
      data: JSON.stringify(response.data, null, 2)
    });
    
    if (!response.ok) {
      throw new Error(response.problem || 'Failed to load public badges');
    }
    
    return response.data!.data;
  }

  // Toggle individual badge display
  async toggleBadgeDisplay(badgeId: number, displayEnabled: boolean): Promise<void> {
    console.log('🔍 BadgeAPI: Toggling badge display:', { badgeId, displayEnabled });
    const response = await api.put<ApiResponse<any>>(
      `/user/badges/${badgeId}/display`,
      { displayEnabled }
    );
    
    if (!response.ok) {
      throw new Error(response.problem || 'Failed to toggle badge display');
    }
    
    console.log('🔍 BadgeAPI: Badge display toggled successfully');
  }

  // Toggle all badges on/off
  async toggleAllBadges(badgesEnabled: boolean): Promise<void> {
    console.log('🔍 BadgeAPI: Toggling all badges:', badgesEnabled);
    const response = await api.put<ApiResponse<any>>(
      '/user/badges/enabled',
      { badgesEnabled }
    );
    
    if (!response.ok) {
      throw new Error(response.problem || 'Failed to toggle badges');
    }
    
    console.log('🔍 BadgeAPI: All badges toggled successfully');
  }
}

export const badgeAPI = new BadgeAPIService();