import {
  SearchResult,
  TrendingTopic,
  LeaderboardEntry,
  Recommendation,
  SearchFilters,
  DiscoverySection,
} from '../../types/discovery';
import {useAuthStore} from '../../store/auth';
import api from './client';

class DiscoveryAPI {
  async search(query: string, filters: SearchFilters): Promise<any> {
    if (!query || query.length < 2) {
      return {users: [], posts: [], hashtags: []};
    }

    const params = {
      q: query,
      type: 'all', // Search all content types
      page: '1',
      limit: '20',
    };

    try {
      console.log('🔍 Search API call: /search with params:', params);
      
      const response = await api.get('/search', params);

      if (!response.ok) {
        console.error('Search API error:', response.status, response.data);
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = response.data;
      console.log('🔍 Search API response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Search failed');
      }

      // Updated response structure based on API logs:
      // { success, query, type, results: { users: {results: [], pagination: {}}, posts: {results: [], pagination: {}}, hashtags: [] } }
      const rawPosts = data.results?.posts?.results || [];
      const rawUsers = data.results?.users?.results || [];
      
      // Create a map of user data for profile enrichment
      const userProfileMap = new Map();
      rawUsers.forEach((userResult: any) => {
        const user = userResult.user || {};
        const displayName = userResult.displayName || user.name || '';
        const profilePicture = userResult.profileImageUrl || user.profilePicture || '';
        const walletAddress = user.primaryWalletAddress || '';
        
        if (displayName) {
          userProfileMap.set(displayName, {
            displayName,
            profileImageUrl: profilePicture,
            walletAddress,
            isVerified: userResult.isVerified || false
          });
        }
      });
      
      // Transform search posts to match PostCard expected format
      const transformedPosts = rawPosts.map((searchPost: any) => {
        
        // Extract data from the new search API response structure
        const post = searchPost.post || {};
        const highlights = searchPost.highlights || {};
        const metadata = searchPost.metadata || {};
        
        // User data is now at the top level of searchPost
        const displayName = searchPost.displayName || post.displayName || 'Unknown User';
        const username = searchPost.username || post.username || '';
        let profileImageUrl = searchPost.profileImageUrl || post.profileImageUrl || '';
        let isVerified = searchPost.isVerified || searchPost.isUsernameVerified || searchPost.isProfileVerified || 
                        post.isVerified || post.isUsernameVerified || post.isProfileVerified || false;
        
        // Try to enrich with user profile data if available
        const userProfile = userProfileMap.get(displayName);
        if (userProfile && !profileImageUrl && userProfile.profileImageUrl) {
          profileImageUrl = userProfile.profileImageUrl;
        }
        if (userProfile && userProfile.isVerified) {
          isVerified = true;
        }
        
        // Map search post fields to PostCard expected format
        return {
          // Core post fields - access from nested post object
          id: post.signature || post.id || `search-${Date.now()}-${Math.random()}`,
          message: post.message || highlights.content || '',
          signature: post.signature,
          transaction_hash: post.transactionHash || post.signature,
          
          // User fields - create user object from top-level and post data
          user: {
            id: post.userId || 0,
            display_name: displayName,
            username: username,
            wallet_address: post.userWallet || '', // We might need to derive this from somewhere else
            avatar_url: profileImageUrl,
            is_verified: isVerified,
            reputation_score: post.reputation || 0,
          },
          
          // Alternative user fields for fallback
          userWallet: post.userWallet || '',
          username: username,
          profileImageUrl: profileImageUrl,
          
          // Timestamps - use post.createdAt or metadata.createdAt
          created_at: post.createdAt || metadata.createdAt,
          createdAt: post.createdAt || metadata.createdAt,
          
          // Engagement metrics - from post object
          replyCount: post.replyCount || metadata.replyCount || 0,
          quoteCount: post.quoteCount || 0,
          receiptsCount: post.receiptsCount || 0,
          
          // Media and content
          images: post.images || post.mediaUrls || [],
          video: post.video,
          
          // Quote post data
          quoted_post: post.quotedPost,
          quotedPost: post.quotedPost,
          
          // Blockchain data
          epoch: post.epoch || 0,
          slot: post.slot || 0,
          
          // Status flags
          is_pinned: post.isPinned || false,
          is_thread: post.isThread || false,
          is_profile_verified: isVerified,
        };
      });
      
      
      return {
        users: data.results?.users?.results || [],
        posts: transformedPosts,
        hashtags: data.results?.hashtags || [],
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async getDiscoveryContent(): Promise<DiscoverySection[]> {
    const response = await api.get('/discovery/content');

    if (!response.ok) {
      throw new Error('Failed to load discovery content');
    }

    return (response.data as any).sections;
  }

  async getTrendingTopics(): Promise<TrendingTopic[]> {
    try {
      // Use trending hashtags endpoint from search integration guide
      const response = await api.get('/search/hashtags/trending', { limit: 10 });

      if (!response.ok) {
        console.error('Trending topics API error:', response.status);
        throw new Error('Failed to load trending topics');
      }

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load trending topics');
      }

      // Transform hashtag data to match TrendingTopic interface
      const hashtags = data.data?.results || [];
      return hashtags.map((hashtag: any) => ({
        id: hashtag.tag,
        title: hashtag.tag,
        postCount: hashtag.postCount || 0,
        userCount: hashtag.userCount || 0,
        trending: hashtag.trending || false,
        trendingScore: hashtag.trendingScore || 0,
        category: 'hashtag',
        description: `${hashtag.postCount || 0} posts`,
      }));
    } catch (error) {
      console.error('Error loading trending topics:', error);
      throw error;
    }
  }

  async getLeaderboard(
    type: 'reputation' | 'epoch' | 'tips' | 'posts',
    page: number = 1,
    limit: number = 50,
    period?: string
  ): Promise<{leaderboard: LeaderboardEntry[], pagination: any}> {
    let endpoint: string;
    let params: any = { page, limit };

    // Map to correct blockchain leaderboard endpoints per leaderboard-integration.md
    if (type === 'reputation') {
      endpoint = '/blockchain/leaderboards/reputation';
      if (period) {
        params.period = period;
      }
    } else if (type === 'epoch') {
      endpoint = '/blockchain/leaderboards/epoch';
      // Add min_score parameter for epoch leaderboard
      params.min_score = 1;
    } else {
      // Legacy support for tips/posts - use discovery endpoint
      endpoint = `/discovery/leaderboard/${type}`;
    }

    console.log('Leaderboard API call:', { endpoint, params });

    const response = await api.get(endpoint, params);

    if (!response.ok) {
      throw new Error(`Failed to load ${type} leaderboard`);
    }

    const data = response.data as any;
    
    // Handle the new blockchain API response format
    if (data.success && data.data) {
      const rawLeaderboard = data.data.leaderboard || [];
      
      // Transform blockchain API data to match our LeaderboardEntry interface
      const transformedLeaderboard = rawLeaderboard.map((entry: any) => {
        // No need to fetch user profiles - the API already provides displayName and profileImageUrl
        
        return {
          // Keep original blockchain fields
          ...entry,
          
          // Add computed fields for compatibility with existing UI
          id: `${type}-${entry.rank}-${entry.walletAddress}`,
          walletAddress: entry.walletAddress, // Use the actual walletAddress field from API
          displayName: entry.displayName || entry.username || (entry.walletAddress ? `${entry.walletAddress.slice(0, 4)}...${entry.walletAddress.slice(-4)}` : 'Unknown'),
          totalReputation: entry.reputation,
          gainThisEpoch: entry.scoreThisEpoch,
          totalPosts: entry.postsThisEpoch || 0, // Use current epoch posts as fallback
          postStreak: entry.consecutiveEpochs || 0,
          
          // Set defaults for missing fields using data from API response
          isVerified: entry.isVerified || false,
          avatar: entry.avatar || entry.profileImageUrl || entry.profilePicture || entry.profile_image_url || entry.avatar_url || null,
          username: entry.username || null
        };
      });
      
      return {
        leaderboard: transformedLeaderboard,
        pagination: data.data.pagination || {}
      };
    }

    // Fallback for old format
    return {
      leaderboard: data.leaderboard || [],
      pagination: {}
    };
  }

  async getUserRecommendations(): Promise<Recommendation[]> {
    const response = await api.get('/discovery/recommendations/users');

    if (!response.ok) {
      throw new Error('Failed to load user recommendations');
    }

    return (response.data as any).recommendations;
  }

  async getBrandRecommendations(): Promise<Recommendation[]> {
    const response = await api.get('/discovery/recommendations/brands');

    if (!response.ok) {
      throw new Error('Failed to load brand recommendations');
    }

    return (response.data as any).recommendations;
  }

  async getTopicRecommendations(): Promise<Recommendation[]> {
    const response = await api.get('/discovery/recommendations/topics');

    if (!response.ok) {
      throw new Error('Failed to load topic recommendations');
    }

    return (response.data as any).recommendations;
  }

  async dismissRecommendation(type: string, id: string): Promise<void> {
    const response = await api.post('/discovery/recommendations/dismiss', {
      type,
      id,
    });

    if (!response.ok) {
      throw new Error('Failed to dismiss recommendation');
    }
  }

  async reportSearch(query: string): Promise<void> {
    // Analytics endpoint for tracking search behavior
    const response = await api.post('/analytics/search', {
      query,
      timestamp: new Date().toISOString(),
    });

    if (!response.ok) {
      console.warn('Failed to report search analytics');
    }
  }
}

export const discoveryAPI = new DiscoveryAPI();
