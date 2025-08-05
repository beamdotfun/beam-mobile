import api from './client';
import {
  ApiResponse,
  PaginatedResponse,
  Post,
  User,
  Profile,
  Vote,
  Tip,
  CreatePostRequest,
  SendTipRequest,
} from './types';

export class SocialAPIService {
  // User Management
  async getUser(wallet: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${wallet}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }


  async updateProfile(profileData: Partial<Profile>): Promise<any> {
    // Use the new update profile endpoint
    const response = await api.put<ApiResponse<any>>(
      '/user/profile/update',
      profileData,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async verifyNFT(nftMint: string): Promise<{success: boolean}> {
    const response = await api.post<ApiResponse<{success: boolean}>>(
      '/profile/verify-nft',
      {nftMint},
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async verifySNS(domain: string): Promise<{success: boolean}> {
    const response = await api.post<ApiResponse<{success: boolean}>>(
      '/profile/verify-sns',
      {domain},
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Posts - Updated to use new processed_posts backend feed endpoints
  async getPosts(page = 1, limit = 20, feedType: 'for-you' | 'recent' | 'watchlist' | 'trending' | 'controversial' | 'receipts' | 'discovery' = 'for-you', timeRange?: 'hour' | 'day' | 'week'): Promise<any> {
    // Map feed types to new backend endpoints per FEED_INTEGRATION_GUIDE.md
    // All endpoints now return processed_posts data with brand information
    const endpoints = {
      'for-you': '/feed',               // Personalized feed with processed_posts structure
      'recent': '/recent',              // Chronological recent posts with processed_posts structure
      'watchlist': '/watchlist',        // Posts from followed users with processed_posts structure
      'trending': '/trending',          // Trending posts by engagement with processed_posts structure
      'controversial': '/controversial', // Most controversial posts with processed_posts structure
      'receipts': '/receipts',          // Bookmarked posts with processed_posts structure
      'discovery': '/discovery/feed'    // Advanced content discovery with processed_posts structure
    };

    // Use the correct endpoint based on feed type
    const endpoint = endpoints[feedType] || '/feed';
    
    console.log('API getPosts called with processed_posts endpoints:', { page, limit, feedType, endpoint, timeRange });
    console.log('Full URL will be:', `${API_CONFIG.BASE_URL}${endpoint}`);
    console.log('Expected response: processed_posts structure with brand information');
    
    // Build query parameters according to new API specifications
    const params: any = { page, limit };
    
    // Add time_range parameter for trending and controversial feeds if needed
    if ((feedType === 'trending' || feedType === 'controversial') && timeRange) {
      params.time_range = timeRange;
    }
    
    console.log('🔍 Making API request to:', endpoint, 'with params:', params);
    const response = await api.get<any>(endpoint, params);
    console.log('🔍 API Response received:', {
      ok: response.ok,
      status: response.status,
      problem: response.problem,
      dataExists: !!response.data,
    });

    if (!response.ok) {
      console.error('🔴 API Error:', response.problem, response.status, response.data);
      throw new Error(response.problem);
    }

    console.log('🔍 SocialAPI Response received:', {
      responseExists: !!response.data,
      success: response.data?.success,
      dataExists: !!response.data?.data,
      postsCount: response.data?.data?.posts?.length || 0,
    });

    // Handle new response format: { success: true, data: { posts, pagination, feedType } }
    if (response.data?.success && response.data?.data) {
      const { posts, pagination, feedType: responseFeedType } = response.data.data;
      
      console.log('🔍 SocialAPI processed_posts data:', {
        postsArrayLength: posts?.length || 0,
        paginationExists: !!pagination,
        firstPostExists: !!posts?.[0],
        firstPostKeys: posts?.[0] ? Object.keys(posts[0]).slice(0, 10) : 'no posts',
        hasProcessedPostsFields: !!posts?.[0]?.postSignature
      });

      // Log the complete structure of the first post for debugging processed_posts
      if (posts?.[0]) {
        console.log('🔍 SocialAPI: PROCESSED_POSTS STRUCTURE:');
        console.log(JSON.stringify(posts[0], null, 2));
        
        // DEBUG: Check for processed_posts brand fields
        console.log('🔍 SocialAPI: PROCESSED_POSTS BRAND FIELDS:', {
          displayName: posts[0].displayName, // Now available from backend
          userIsBrand: posts[0].userIsBrand,
          brandName: posts[0].brandName,
          brandLogoUrl: posts[0].brandLogoUrl,
          brandIsVerified: posts[0].brandIsVerified,
          userSnsDomain: posts[0].userSnsDomain,
          userProfileImageUri: posts[0].userProfileImageUri,
          // Rich content fields
          hasQuotedPostData: !!posts[0].quotedPostData,
          hasThreadData: !!posts[0].threadData,
          isThreadRoot: posts[0].isThreadRoot,
          threadPostCount: posts[0].threadPostCount
        });
      }
      
      // Return data in consistent format for the store
      return {
        data: posts || [],
        pagination: pagination || {
          page: page,
          limit: limit,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        feedType: responseFeedType || feedType,
        // Legacy support for existing code
        total: pagination?.totalCount || 0,
        perPage: pagination?.limit || limit
      };
    }

    throw new Error('Unexpected response structure');
  }

  async getUserPosts(
    wallet: string,
    limit = 20,
    page = 0,
  ): Promise<any> {
    console.log('🔍 SocialAPI.getUserPosts: Fetching user posts with processed_posts structure:', { 
      wallet: `${wallet.slice(0, 8)}...`, 
      limit, 
      page 
    });
    
    const response = await api.get<any>(
      `/api/v1/wallet/${wallet}/posts`,
      {
        limit,
        page, // Use page parameter (0-based) instead of offset
        include_hidden: false,
      },
    );
    
    if (!response.ok) {
      throw new Error(response.problem);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load user posts');
    }

    console.log('🔍 SocialAPI.getUserPosts: Response received:', {
      success: response.data.success,
      postsCount: response.data.data?.posts?.length || 0,
      paginationExists: !!response.data.data?.pagination,
      walletAddress: response.data.data?.walletAddress
    });

    // Log processed_posts structure for first post
    const posts = response.data.data?.posts;
    if (posts?.length > 0) {
      console.log('🔍 SocialAPI.getUserPosts: User posts processed_posts structure:', {
        firstPostId: posts[0].id,
        displayName: posts[0].displayName,
        userIsBrand: posts[0].userIsBrand,
        brandName: posts[0].brandName,
        hasProcessedPostsFields: !!posts[0].postSignature
      });
    }

    // Return data in format expected by UserProfileScreen
    return {
      posts: response.data.data?.posts || [],
      pagination: response.data.data?.pagination || {},
      walletAddress: response.data.data?.walletAddress || wallet,
      cachedAt: response.data.data?.cachedAt
    };
  }

  async createPost(
    postData: CreatePostRequest,
  ): Promise<{transaction: string; postId: number}> {
    console.log('🔍 SocialAPI.createPost: Attempting to create post with data:', JSON.stringify(postData, null, 2));
    console.log('🔍 SocialAPI.createPost: Using endpoint: /posts');
    
    const response = await api.post<
      ApiResponse<{transaction: string; postId: number}>
    >('/posts', postData);
    
    console.log('🔍 SocialAPI.createPost: Response received:', {
      ok: response.ok,
      status: response.status,
      problem: response.problem,
      data: response.data
    });
    
    if (!response.ok) {
      console.error('❌ SocialAPI.createPost: Request failed:', {
        problem: response.problem,
        status: response.status,
        data: response.data,
        originalError: response.originalError
      });
      throw new Error(response.problem || 'Create post request failed');
    }
    return response.data!.data;
  }

  // Get individual post with processed_posts structure
  async getPost(postId: string): Promise<any> {
    console.log('🔍 SocialAPI.getPost: Fetching individual post with processed_posts structure:', { postId });
    
    const response = await api.get<any>(`/social/posts/${postId}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load post');
    }
    
    console.log('🔍 SocialAPI.getPost: Individual post response structure:', {
      success: response.data.success,
      hasPost: !!response.data.data?.post,
      postStructure: response.data.data?.post ? Object.keys(response.data.data.post).slice(0, 10) : 'no post'
    });
    
    // Log individual post processed_posts fields
    const post = response.data.data?.post;
    if (post) {
      console.log('🔍 SocialAPI.getPost: Individual post processed_posts fields:', {
        id: post.id,
        postSignature: post.postSignature?.substring(0, 20) + '...',
        displayName: post.displayName,
        userIsBrand: post.userIsBrand,
        brandName: post.brandName,
        hasQuotedPostData: !!post.quotedPostData,
        hasThreadData: !!post.threadData,
        userVote: post.userVote,
        userBookmarked: post.userBookmarked
      });
    }
    
    return response.data.data;
  }

  // Get post quotes with processed_posts structure
  async getPostQuotes(postId: string, page = 1, limit = 20): Promise<any> {
    console.log('🔍 SocialAPI.getPostQuotes: Fetching quotes with processed_posts structure:', { postId, page, limit });
    
    const response = await api.get<any>(`/social/posts/${postId}/quotes`, {
      page,
      limit
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load post quotes');
    }
    
    console.log('🔍 SocialAPI.getPostQuotes: Quotes response structure:', {
      success: response.data.success,
      hasPosts: !!response.data.data?.posts,
      quotesCount: response.data.data?.posts?.length,
      hasPagination: !!response.data.data?.pagination
    });
    
    // Log quotes processed_posts fields
    const quotes = response.data.data?.posts;
    if (quotes?.length > 0) {
      console.log('🔍 SocialAPI.getPostQuotes: Quote posts processed_posts fields:', {
        firstQuoteId: quotes[0].id,
        firstQuoteDisplayName: quotes[0].displayName,
        firstQuoteUserIsBrand: quotes[0].userIsBrand,
        firstQuoteBrandName: quotes[0].brandName,
        firstQuoteHasQuotedPostData: !!quotes[0].quotedPostData,
        quotesWithQuotedData: quotes.filter((q: any) => q.quotedPostData).length
      });
    }
    
    return response.data.data;
  }

  // Get complete thread with processed_posts structure
  async getThreadPosts(postSignature: string): Promise<any> {
    console.log('🔍 SocialAPI.getThreadPosts: Fetching thread with processed_posts structure:', { postSignature });
    
    const response = await api.get<any>(`/social/threads/${postSignature}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load thread');
    }
    
    console.log('🔍 SocialAPI.getThreadPosts: Thread response structure:', {
      success: response.data.success,
      hasThread: !!response.data.data?.thread,
      hasRootPost: !!response.data.data?.thread?.rootPost,
      totalPosts: response.data.data?.thread?.totalPosts
    });
    
    // Log thread processed_posts fields
    const thread = response.data.data?.thread;
    if (thread) {
      console.log('🔍 SocialAPI.getThreadPosts: Thread processed_posts fields:', {
        rootPostId: thread.rootPost?.id,
        rootDisplayName: thread.rootPost?.displayName,
        rootUserIsBrand: thread.rootPost?.userIsBrand,
        rootBrandName: thread.rootPost?.brandName,
        postsCount: thread.posts?.length,
        totalPosts: thread.totalPosts,
        lastUpdated: thread.lastUpdated
      });
      
      // Log display names for all posts in thread
      if (thread.posts?.length > 0) {
        console.log('🔍 SocialAPI.getThreadPosts: Thread posts display names:', 
          thread.posts.map((post: any) => ({
            id: post.id,
            displayName: post.displayName,
            userIsBrand: post.userIsBrand,
            brandName: post.brandName
          }))
        );
      }
    }
    
    return response.data.data;
  }

  // Batch reputation scores for live updates
  async getBatchReputationScores(walletAddresses: string[]): Promise<{
    reputationScores: Array<{
      walletAddress: string;
      reputation: number;
    }>;
    count: number;
  }> {
    console.log('🔍 SocialAPI.getBatchReputationScores: Fetching reputation for wallets:', { 
      count: walletAddresses.length,
      wallets: walletAddresses.slice(0, 5).map(w => `${w.slice(0, 8)}...`) // Log first 5 abbreviated
    });
    
    const response = await api.post<any>('/social/batch/reputation-scores', {
      walletAddresses: walletAddresses.slice(0, 100) // Limit to 100 as per API spec
    });

    if (!response.ok) {
      throw new Error(response.problem);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load reputation scores');
    }

    console.log('🔍 SocialAPI.getBatchReputationScores: Response received:', {
      success: response.data.success,
      scoresCount: response.data.data?.reputationScores?.length || 0,
      totalCount: response.data.data?.count || 0
    });

    return response.data.data;
  }

  // Batch receipt status for feed posts
  async getBatchReceiptStatus(postSignatures: string[]): Promise<{
    receiptStatuses: Array<{
      postSignature: string;
      isReceipted: boolean;
      receiptedAt: string | null;
    }>;
    count: number;
  }> {
    console.log('🔍 SocialAPI.getBatchReceiptStatus: Fetching receipt status for posts:', { 
      count: postSignatures.length,
      signatures: postSignatures.slice(0, 5).map(s => `${s.slice(0, 12)}...`) // Log first 5 abbreviated
    });
    
    const response = await api.post<any>('/receipts/batch/check', {
      signatures: postSignatures.slice(0, 100) // Limit to 100 as per API spec
    });

    if (!response.ok) {
      throw new Error(response.problem);
    }

    // Transform the receipts API response to match our expected format
    const receiptsMap = response.data?.data?.receipts || {};
    const receiptStatuses = postSignatures.map(signature => ({
      postSignature: signature,
      isReceipted: receiptsMap[signature] || false,
      receiptedAt: receiptsMap[signature] ? new Date().toISOString() : null // API doesn't return timestamp
    }));

    console.log('🔍 SocialAPI.getBatchReceiptStatus: Response received:', {
      statusesCount: receiptStatuses.length,
      receiptedCount: receiptStatuses.filter(r => r.isReceipted).length
    });

    return {
      receiptStatuses,
      count: receiptStatuses.length
    };
  }

  // Receipt/Bookmark functionality per FEED_INTEGRATION_GUIDE.md
  async receiptPost(postId: string): Promise<{success: boolean; message: string}> {
    const response = await api.post<ApiResponse<{success: boolean; message: string}>>(
      `/posts/${postId}/receipt`
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async removeReceipt(postId: string): Promise<{success: boolean; message: string}> {
    const response = await api.delete<ApiResponse<{success: boolean; message: string}>>(
      `/posts/${postId}/receipt`
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async pinPost(postId: number): Promise<{transaction: string}> {
    const response = await api.post<ApiResponse<{transaction: string}>>(
      `/posts/${postId}/pin`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async unpinPost(postId: number): Promise<{transaction: string}> {
    const response = await api.delete<ApiResponse<{transaction: string}>>(
      `/posts/${postId}/pin`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Voting
  async vote(
    targetWallet: string,
    voteType: 'upvote' | 'downvote',
  ): Promise<{transaction: string}> {
    const response = await api.post<ApiResponse<{transaction: string}>>(
      '/votes',
      {
        targetWallet,
        voteType,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getVotes(wallet: string): Promise<Vote[]> {
    const response = await api.get<ApiResponse<Vote[]>>(
      `/users/${wallet}/votes`,
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Tipping
  async sendTip(
    tipData: SendTipRequest,
  ): Promise<{transaction: string; tipId: number}> {
    const response = await api.post<
      ApiResponse<{transaction: string; tipId: number}>
    >('/tips/send', tipData);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getTipHistory(
    direction?: 'sent' | 'received',
    limit = 20,
    offset = 0,
  ): Promise<PaginatedResponse<Tip>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Tip>>>(
      '/tips/history',
      {
        direction,
        limit,
        offset,
      },
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getTipStats(
    wallet?: string,
  ): Promise<{tipsSent: any; tipsReceived: any}> {
    const endpoint = wallet ? `/tips/stats/${wallet}` : '/tips/stats';
    const response = await api.get<
      ApiResponse<{tipsSent: any; tipsReceived: any}>
    >(endpoint);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getTipLeaderboard(
    period = 'weekly',
    limit = 10,
  ): Promise<{topReceivers: any[]; topSenders: any[]}> {
    const response = await api.get<
      ApiResponse<{topReceivers: any[]; topSenders: any[]}>
    >('/tips/leaderboard', {
      period,
      limit,
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Profile Management - Get public profile by wallet address
  async getUserProfile(walletAddress: string): Promise<any> {
    console.log('🔍 SocialAPI.getUserProfile: Called with walletAddress:', walletAddress);
    
    const response = await api.get<ApiResponse<any>>(`/api/v1/wallet/${walletAddress}/profile`);
    
    console.log('🔍 SocialAPI.getUserProfile: Response received:', {
      ok: response.ok,
      status: response.status,
      problem: response.problem,
      dataExists: !!response.data
    });
    
    if (!response.ok) {
      throw new Error(response.problem);
    }
    
    return response.data!.data;
  }

  // Get authenticated user's own profile (comprehensive)
  async getAuthenticatedUserProfile(): Promise<any> {
    console.log('🔍 SocialAPI.getAuthenticatedUserProfile: Called');
    const response = await api.get<ApiResponse<any>>('/user/profile/comprehensive');
    console.log('🔍 SocialAPI.getAuthenticatedUserProfile: Response received:', {
      ok: response.ok,
      status: response.status,
      problem: response.problem,
      data: JSON.stringify(response.data, null, 2)
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Get comprehensive profile (combines user data + blockchain profile)
  async getComprehensiveProfile(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/user/profile/comprehensive');
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // getUserStats removed - stats are now included in profile response

  async getUserActivity(
    wallet: string,
    params: {page: number; limit: number},
  ): Promise<{activities: any[]; hasMore: boolean}> {
    const response = await api.get<
      ApiResponse<{activities: any[]; hasMore: boolean}>
    >(`/users/${wallet}/activity`, params);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // User interactions per FEED_INTEGRATION_GUIDE.md
  async followUser(userId: string): Promise<{success: boolean; message: string}> {
    const response = await api.post<ApiResponse<{success: boolean; message: string}>>(
      `/users/${userId}/follow`
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async unfollowUser(userId: string): Promise<{success: boolean; message: string}> {
    const response = await api.delete<ApiResponse<{success: boolean; message: string}>>(
      `/users/${userId}/follow`
    );
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Get list of users that the current user is following
  async getFollowedUsers(page = 1, limit = 20): Promise<any> {
    const response = await api.get<any>('/users/following', {
      page,
      limit,
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Get list of users following the current user
  async getFollowers(page = 1, limit = 20): Promise<any> {
    const response = await api.get<any>('/users/followers', {
      page,
      limit,
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Get voters (upvoters and downvoters) for a specific wallet
  async getWalletVotes(walletAddress: string, page = 1, limit = 50): Promise<any> {
    const response = await api.get<any>(`/api/v1/wallet/${walletAddress}/votes`, {
      page,
      limit,
    });
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  // Domain and Username Management
  async getUserDomains(walletAddress: string): Promise<{
    domains: Array<{domain_name: string, verification_status: string, created_at: string}>,
    count: number,
    hasVerifiedDomain: boolean
  }> {
    const response = await api.get<ApiResponse<{
      domains: Array<{domain_name: string, verification_status: string, created_at: string}>,
      count: number,
      hasVerifiedDomain: boolean
    }>>(`/domains?wallet=${walletAddress}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async checkUsernameAvailability(username: string): Promise<{username: string, available: boolean, reason?: string}> {
    const response = await api.get<ApiResponse<{username: string, available: boolean, reason?: string}>>(`/username-available?username=${username}`);
    if (!response.ok) {
      throw new Error(response.problem);
    }
    return response.data!.data;
  }

  async getWalletBalance(walletAddress: string): Promise<{
    success: boolean,
    walletAddress: string,
    balanceLamports: number,
    balanceSOL: number
  }> {
    const response = await api.get<ApiResponse<{
      success: boolean,
      walletAddress: string,
      balanceLamports: number,
      balanceSOL: number
    }>>(`/wallets/${walletAddress}/balance`);
    
    if (!response.ok) {
      throw new Error(response.problem || 'Failed to fetch wallet balance');
    }
    
    // Ensure we have valid data
    if (!response.data?.data) {
      throw new Error('Invalid response format from wallet balance API');
    }
    
    return response.data.data;
  }

  // Search functionality with processed_posts format
  async searchPosts(query: string, page = 1, limit = 20): Promise<any> {
    console.log('🔍 SocialAPI.searchPosts: Searching with processed_posts format:', { query, page, limit });
    
    const response = await api.get<any>('/search', {
      q: query,
      type: 'posts',
      page,
      limit
    });
    
    if (!response.ok) {
      throw new Error(response.problem);
    }
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Search failed');
    }
    
    console.log('🔍 SocialAPI.searchPosts: Response received:', {
      success: response.data.success,
      postsCount: response.data.results?.posts?.results?.length || 0,
      totalResults: response.data.results?.posts?.pagination?.totalCount || 0
    });
    
    const posts = response.data.results?.posts?.results || [];
    const pagination = response.data.results?.posts?.pagination || {};
    
    // Log search posts structure if available
    if (posts.length > 0) {
      console.log('🔍 SocialAPI.searchPosts: Search posts structure:', {
        firstPostId: posts[0].id,
        hasProcessedPostsFields: !!posts[0].postSignature,
        postKeys: Object.keys(posts[0]).slice(0, 10)
      });
    }
    
    return {
      data: posts,
      pagination: {
        page: pagination.page || page,
        limit: pagination.limit || limit,
        totalCount: pagination.totalCount || 0,
        totalPages: pagination.totalPages || 0,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      query: query,
      type: 'posts'
    };
  }
}

export const socialAPI = new SocialAPIService();
