import api from './client';

/**
 * Watchlist service for following/unfollowing users and getting watchlist data
 * Implements the watchlist integration as specified in watchlist-integration.md
 */
export class WatchlistService {

  /**
   * Deduplicate users by wallet address
   */
  private deduplicateUsers(users: any[]): any[] {
    return users.filter((user, index, self) => 
      index === self.findIndex(u => u.walletAddress === user.walletAddress)
    );
  }

  /**
   * Format user data consistently
   */
  private formatUserData(user: any) {
    // Handle profileImage that might come as array or string
    const getProfileImageUrl = (profileImageData: any): string | undefined => {
      if (!profileImageData) return undefined;
      if (typeof profileImageData === 'string') return profileImageData;
      if (Array.isArray(profileImageData) && profileImageData.length > 0) {
        return typeof profileImageData[0] === 'string' ? profileImageData[0] : profileImageData[0]?.url;
      }
      return undefined;
    };

    return {
      walletAddress: user.walletAddress,
      username: user.username || `@${user.walletAddress.slice(0, 8)}...`,
      displayName: user.displayName || user.username || `User ${user.walletAddress.slice(0, 8)}...`,
      profileImage: getProfileImageUrl(user.profileImageUrl || user.profileImage || user.profile_image_url),
      isVerified: user.isVerified || user.isProfileVerified || user.isUsernameVerified,
      isBrand: user.isBrand || false,
      reputation: user.reputation || 0,
      postCount: user.postCount || 0,
      postsThisEpoch: user.postsThisEpoch || 0,
      streak: user.streak || 0,
      dateJoined: user.dateJoined,
      followedAt: user.followed_at
    };
  }

  /**
   * Follow a user by their wallet address
   */
  async followWallet(walletAddress: string) {
    console.log(`🔄 Following wallet: ${walletAddress}`);
    
    const response = await api.post(`/watch/${walletAddress}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("This user hasn't posted yet and can't be followed. They need to make their first post before you can follow them.");
      } else if (response.status === 409) {
        throw new Error("You are already following this user");
      } else if (response.status === 400) {
        throw new Error("Cannot follow yourself or invalid wallet address");
      }
      throw new Error(response.data?.message || `Failed to follow wallet: ${response.status}`);
    }

    console.log(`✅ Successfully followed wallet: ${walletAddress}`);
    return response.data;
  }

  /**
   * Unfollow a user by their wallet address
   */
  async unfollowWallet(walletAddress: string) {
    console.log(`🔄 Unfollowing wallet: ${walletAddress}`);
    
    const response = await api.delete(`/unwatch/${walletAddress}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("You are not following this user");
      }
      throw new Error(response.data?.message || `Failed to unfollow wallet: ${response.status}`);
    }

    console.log(`✅ Successfully unfollowed wallet: ${walletAddress}`);
    return response.data;
  }

  /**
   * Get the list of users that the authenticated user follows
   */
  async getWatchlistMembers(page: number = 1, limit: number = 20) {
    console.log(`🔄 Getting watchlist members (page: ${page}, limit: ${limit})`);
    
    const response = await api.get(
      `/watchlist-members?page=${page}&limit=${limit}`
    );
    
    console.log(`🔍 WatchlistService: Response status: ${response.status}`);
    console.log(`🔍 WatchlistService: Response ok: ${response.ok}`);
    console.log('🔍 WatchlistService: Raw API response:', JSON.stringify(response.data, null, 2));

    if (!response.ok) {
      throw new Error(`Failed to get watchlist members: ${response.status}`);
    }

    const result = response.data;
    
    // Handle nested response structure: result.data.following
    const actualData = result.data || result;
    
    // Deduplicate users and format response
    if (result.success && actualData?.following) {
      actualData.following = this.deduplicateUsers(actualData.following).map(user => 
        this.formatUserData(user)
      );
      
      // Update the result structure to match what the hook expects
      result.data = {
        following: actualData.following,
        pagination: actualData.pagination
      };
    }

    console.log(`✅ Retrieved ${actualData?.following?.length || 0} watchlist members`);
    return result;
  }

  /**
   * Get posts from wallet addresses that the authenticated user follows
   */
  async getWatchlistFeed(page: number = 1, limit: number = 20, includeHidden: boolean = false) {
    console.log(`🔄 Getting watchlist feed (page: ${page}, limit: ${limit})`);
    
    const response = await api.get(
      `/watchlist?page=${page}&limit=${limit}&include_hidden=${includeHidden}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get watchlist feed: ${response.status}`);
    }

    console.log(`✅ Retrieved ${response.data?.data?.posts?.length || 0} posts from watchlist feed`);
    return response.data;
  }

  /**
   * Check if currently following a specific wallet address
   */
  async isFollowing(walletAddress: string): Promise<boolean> {
    try {
      const watchlistData = await this.getWatchlistMembers(1, 50); // Get first 50 to check
      const following = watchlistData.data?.following || [];
      return following.some(user => user.walletAddress === walletAddress);
    } catch (error) {
      console.warn('Failed to check following status:', error);
      return false;
    }
  }

  /**
   * Toggle follow status for a wallet address
   */
  async toggleFollow(walletAddress: string): Promise<{ action: 'followed' | 'unfollowed', result: any }> {
    const isCurrentlyFollowing = await this.isFollowing(walletAddress);
    
    if (isCurrentlyFollowing) {
      const result = await this.unfollowWallet(walletAddress);
      return { action: 'unfollowed', result };
    } else {
      const result = await this.followWallet(walletAddress);
      return { action: 'followed', result };
    }
  }
}

// Export singleton instance
export const watchlistService = new WatchlistService();

// Export individual functions for convenience
export const {
  followWallet,
  unfollowWallet,
  getWatchlistMembers,
  getWatchlistFeed,
  isFollowing,
  toggleFollow,
} = watchlistService;