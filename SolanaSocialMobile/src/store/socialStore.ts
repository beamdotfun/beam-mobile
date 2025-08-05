import {create} from 'zustand';
import {
  Post,
  FeedState,
  CreatePostRequest,
  VoteRequest,
  TipRequest,
} from '@/types/social';
import {Post as ApiPost} from '../services/api/types';
import {socialAPI} from '../services/api/social';
import {useWalletStore} from './wallet';

// Helper function to transform processed_posts API response to social posts
const transformApiPost = (apiPost: any): Post => {
  // Log the transformation for debugging (processed_posts structure) - only log first few to reduce noise
  if (Math.random() < 0.1) { // Log 10% of posts randomly
    console.log('🔍 SocialStore.transformApiPost: Input structure (processed_posts):', {
      id: apiPost.id,
      postSignature: apiPost.postSignature?.substring(0, 20) + '...',
      postUser: apiPost.postUser?.substring(0, 20) + '...',
      postMessage: apiPost.postMessage?.substring(0, 50) + '...',
      displayName: apiPost.displayName, // Now available from backend
      userIsBrand: apiPost.userIsBrand,
      brandName: apiPost.brandName,
      userSnsDomain: apiPost.userSnsDomain,
      // NEW BACKEND FIELDS CHECK
      hasQuotedPostData: !!apiPost.quotedPostData,
      hasThreadData: !!apiPost.threadData,
      isThreadRoot: apiPost.isThreadRoot,
      threadPostCount: apiPost.threadPostCount,
      allFields: Object.keys(apiPost).slice(0, 10) // Show first 10 fields
    });
  }

  // Brand vs User prioritization logic per FEED_INTEGRATION_GUIDE.md
  const shouldUseBrandInfo = apiPost.userIsBrand && apiPost.brandName;
  
  // Get display name - use displayName from response or fall back to brand prioritization
  const getDisplayName = () => {
    // First priority: use displayName if available from the backend
    if (apiPost.displayName) {
      return apiPost.displayName;
    }
    
    // Fallback to brand prioritization logic
    if (shouldUseBrandInfo) {
      return apiPost.brandName;
    }
    return apiPost.userSnsDomain || `${apiPost.postUser?.slice(0, 5)}...${apiPost.postUser?.slice(-5)}` || 'Anonymous';
  };

  // Get profile picture with brand prioritization
  const getProfilePicture = () => {
    if (shouldUseBrandInfo && apiPost.brandLogoUrl) {
      return apiPost.brandLogoUrl;
    }
    return apiPost.userProfileImageUri;
  };

  // Get verification status with brand prioritization
  const getIsVerified = () => {
    if (shouldUseBrandInfo) {
      return apiPost.brandIsVerified || false;
    }
    return apiPost.userIsVerifiedNft || apiPost.userIsVerifiedSns || false;
  };

  return {
    id: apiPost.id?.toString() || '0',
    userWallet: apiPost.postUser || '',
    transactionHash: apiPost.postSignature || '',
    message: apiPost.postMessage || '',
    mediaUrls: apiPost.postImages || [],
    voteScore: (apiPost.userUpvotesReceived || 0) - (apiPost.userDownvotesReceived || 0),
    upvoteCount: apiPost.userUpvotesReceived || 0,
    downvoteCount: apiPost.userDownvotesReceived || 0,
    replyCount: 0, // Will be updated when available in processed_posts
    tipCount: apiPost.userTipsReceivedCount || 0,
    totalTipAmount: 0, // Will be calculated from tip data if available
    isPinned: false, // Will be updated when pin data is available
    createdAt: apiPost.postProcessedAt || new Date().toISOString(),
    updatedAt: apiPost.updatedAt || apiPost.postProcessedAt || new Date().toISOString(),
    
    // User object with brand prioritization
    user: {
      walletAddress: apiPost.postUser || '',
      name: getDisplayName(),
      profilePicture: getProfilePicture(),
      isVerified: getIsVerified(),
      onChainReputation: apiPost.userReputation || 0,
      brandAddress: apiPost.userBrandAddress,
      
      // Additional processed_posts fields
      id: apiPost.id,
      username: apiPost.userSnsDomain,
      display_name: getDisplayName(),
      avatar_url: getProfilePicture(),
      is_verified: getIsVerified(),
      is_username_verified: apiPost.userIsVerifiedSns || false,
      is_profile_verified: apiPost.userIsVerifiedNft || false,
      is_brand: apiPost.userIsBrand || false,
      reputation_score: apiPost.userReputation || 0,
      follower_count: 0, // Not available in current processed_posts
      following_count: 0, // Not available in current processed_posts
      wallet_address: apiPost.postUser,
      
      // Brand information (when user is a brand)
      brand_name: shouldUseBrandInfo ? apiPost.brandName : null,
      brand_logo_url: shouldUseBrandInfo ? apiPost.brandLogoUrl : null,
      brand_is_verified: shouldUseBrandInfo ? apiPost.brandIsVerified : false,
      brand_category: shouldUseBrandInfo ? apiPost.brandCategory : null,
      brand_url: shouldUseBrandInfo ? apiPost.brandUrl : null,
    },
    
    userVote: null, // Should be determined based on user's votes
    userTipped: false, // Should be determined based on user's tips
    userBookmarked: false, // Will be updated when receipt data is available
    
    // Additional processed_posts fields
    images: apiPost.postImages || [],
    video: apiPost.postVideo,
    slot: apiPost.postSlot || 0,
    epoch: apiPost.postEpoch || 0,
    is_thread: apiPost.postIsThread || false,
    previous_thread_post: apiPost.postPreviousThreadPost || null,
    is_pinned: false, // Will be updated when pin data is available
    quote_count: 0, // Will be updated when quote count is available
    receipts_count: 0, // Will be updated when receipt count is available
    view_count: 0, // Will be updated when view count is available
    signature: apiPost.postSignature, // Use postSignature from processed_posts
    created_at: apiPost.postProcessedAt,
    updated_at: apiPost.updatedAt || apiPost.postProcessedAt,
    
    // Quote post data - from processed_posts structure
    quoted_post: apiPost.postQuotedPost,
    quotedPost: apiPost.postQuotedPost,
    quote_post: apiPost.postQuotedPost,
    
    // Thread data - from processed_posts structure
    isThread: apiPost.postIsThread || false,
    previousThreadPost: apiPost.postPreviousThreadPost || null,
    
    // Rich content from processed_posts (don't transform, pass through directly)
    quotedPostData: apiPost.quotedPostData || null,
    threadData: apiPost.threadData || null, 
    isThreadRoot: apiPost.isThreadRoot || false,
    threadPostCount: apiPost.threadPostCount || 0,
    
    // Tagged users from processed_posts
    taggedUsers: apiPost.postTaggedUsers || [],
  };
};

interface SocialState extends FeedState {
  // Feed type state
  currentFeedType: 'for-you' | 'recent' | 'watchlist' | 'trending' | 'controversial' | 'receipts' | 'discovery';
  currentTimeRange?: 'hour' | 'day' | 'week';
  
  // Reputation polling state
  reputationPollingInterval: NodeJS.Timeout | null;
  
  
  // Actions
  loadFeed: (refresh?: boolean, feedType?: 'for-you' | 'recent' | 'watchlist' | 'trending' | 'controversial' | 'receipts' | 'discovery', timeRange?: 'hour' | 'day' | 'week') => Promise<void>;
  loadMorePosts: () => Promise<void>;
  loadUserPosts: (walletAddress: string, refresh?: boolean) => Promise<void>;
  createPost: (data: CreatePostRequest) => Promise<void>;
  voteOnUser: (data: VoteRequest) => Promise<void>;
  sendTip: (data: TipRequest) => Promise<void>;
  refreshFeed: () => Promise<void>;
  setFeedType: (feedType: 'for-you' | 'recent' | 'watchlist' | 'trending' | 'controversial' | 'receipts' | 'discovery') => void;
  setTimeRange: (timeRange: 'hour' | 'day' | 'week') => void;

  // Receipt/Bookmark functionality
  receiptPost: (postId: string) => Promise<void>;
  removeReceipt: (postId: string) => Promise<void>;

  // User interactions
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;

  // Quote posts functionality
  loadPostQuotes: (postId: string, page?: number, limit?: number) => Promise<any>;

  // Real-time updates
  addNewPost: (post: Post) => void;
  addNewPosts: (posts: Post[]) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  updateVoteCounts: (postId: string, voteData: any) => void;
  updateTipCounts: (postId: string, tipData: any) => void;

  // Reputation polling
  pollReputationScores: () => Promise<void>;
  updateReputationScores: (scores: Array<{ walletAddress: string; reputation: number }>) => void;
  startReputationPolling: () => void;
  stopReputationPolling: () => void;

  // Receipt status batch checking
  checkBatchReceiptStatus: () => Promise<void>;
  updateReceiptStatuses: (statuses: Array<{ postSignature: string; isReceipted: boolean; receiptedAt: string | null }>) => void;

  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  // Initial state
  posts: [],
  loading: false,
  refreshing: false,
  hasMore: true,
  page: 1,
  error: null,
  currentFeedType: 'for-you',
  currentTimeRange: 'day',
  
  // Reputation polling state
  reputationPollingInterval: null as NodeJS.Timeout | null,

  // Load initial feed
  loadFeed: async (refresh = false, feedType?: 'for-you' | 'recent' | 'watchlist' | 'trending' | 'controversial' | 'receipts' | 'discovery', timeRange?: 'hour' | 'day' | 'week') => {
    const {loading, refreshing, currentFeedType, currentTimeRange} = get();
    if (loading || refreshing) {
      return;
    }

    const activeFeedType = feedType || currentFeedType;
    const activeTimeRange = timeRange || currentTimeRange;
    
    console.log('Store loadFeed called with:', { refresh, feedType, currentFeedType, activeFeedType, timeRange, activeTimeRange });

    set({
      loading: !refresh,
      refreshing: refresh,
      error: null,
      ...(refresh && {page: 1, hasMore: true}),
      ...(feedType && {currentFeedType: feedType}),
      ...(timeRange && {currentTimeRange: timeRange}),
    });

    try {
      const response = await socialAPI.getPosts(
        refresh ? 1 : get().page,
        20,
        activeFeedType,
        activeTimeRange
      );

      console.log('🔍 SocialStore: V2 API response received:', {
        responseExists: !!response,
        dataExists: !!response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'not array',
        paginationExists: !!response?.pagination,
        feedType: response?.feedType
      });

      // Handle new response format: { data: Post[], pagination: {...}, feedType: string }
      const postsArray = response.data || [];
      const pagination = response.pagination || {};

      // Transform posts asynchronously to avoid blocking UI
      const transformedPosts = await new Promise<Post[]>((resolve) => {
        requestAnimationFrame(() => {
          const posts = postsArray.map(transformApiPost);
          resolve(posts);
        });
      });
      
      console.log('🔍 SocialStore: Posts transformation:', {
        postsArrayLength: postsArray.length,
        transformedPostsLength: transformedPosts.length,
        existingPostsLength: get().posts.length,
        refresh
      });
      
      const newPosts = refresh
        ? transformedPosts
        : [...get().posts, ...transformedPosts];

      console.log('🔍 SocialStore: Setting new posts in state:', {
        newPostsLength: newPosts.length,
        firstPost: newPosts[0] ? { id: newPosts[0].id, message: newPosts[0].message?.substring(0, 50) } : 'none'
      });

      // More robust hasMore calculation
      let hasMorePages;
      if (pagination.hasNext !== undefined) {
        // Use hasNext if available (most reliable)
        hasMorePages = pagination.hasNext;
      } else if (pagination.page && pagination.totalPages) {
        // Use page comparison if available
        hasMorePages = pagination.page < pagination.totalPages;
      } else {
        // Fallback: if we received fewer posts than requested, we've reached the end
        hasMorePages = transformedPosts.length >= 20; // Assuming 20 is the limit
      }
      
      const nextPage = refresh ? 2 : get().page + 1;
      
      console.log('🔍 SocialStore.loadFeed: Pagination logic:', {
        paginationHasNext: pagination.hasNext,
        paginationPage: pagination.page,
        paginationTotalPages: pagination.totalPages,
        postsReceived: transformedPosts.length,
        expectedLimit: 20,
        calculatedHasMore: hasMorePages,
        currentPage: get().page,
        nextPage: nextPage
      });

      set({
        posts: newPosts,
        loading: false,
        refreshing: false,
        hasMore: hasMorePages,
        page: nextPage,
      });
    } catch (error) {
      console.error('🔴 Failed to load feed:', error);
      console.error('🔴 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if this is the known backend authentication issue
      const errorMessage =
        error instanceof Error && error.message.includes('CLIENT_ERROR')
          ? 'Backend authentication issue: The server needs to be updated to support mobile Bearer tokens. Please contact the backend team.'
          : 'Failed to load feed. Please try again.';

      set({
        loading: false,
        refreshing: false,
        error: errorMessage,
      });
    }
  },

  // Load more posts for infinite scroll
  loadMorePosts: async () => {
    const {loading, hasMore, currentFeedType, currentTimeRange, page, posts} = get();
    console.log('🔍 SocialStore.loadMorePosts: Called with state:', { loading, hasMore, currentFeedType, currentTimeRange, page, postsLength: posts.length });
    
    if (loading || !hasMore) {
      console.log('🔍 SocialStore.loadMorePosts: Skipped - loading:', loading, 'hasMore:', hasMore);
      return;
    }

    console.log('🔍 SocialStore.loadMorePosts: Proceeding to load feed with page:', page);
    await get().loadFeed(false, currentFeedType, currentTimeRange);
  },

  // Load posts for a specific user
  loadUserPosts: async (walletAddress: string, refresh = false) => {
    const {loading, refreshing} = get();
    if (loading || refreshing) {
      return;
    }

    set({
      loading: !refresh,
      refreshing: refresh,
      error: null,
      ...(refresh && {page: 1, hasMore: true}),
    });

    try {
      // For now, use the same endpoint as general feed
      // TODO: Replace with user-specific endpoint when available
      const response = await socialAPI.getPosts(
        refresh ? 1 : get().page,
        20,
        'recent'
      );

      const postsArray = response.data || [];

      // Filter posts by user wallet address
      const userPosts = postsArray.filter(
        post =>
          post.walletAddress === walletAddress ||
          post.userWallet === walletAddress,
      );

      const transformedPosts = userPosts.map(transformApiPost);
      const newPosts = refresh
        ? transformedPosts
        : [...get().posts, ...transformedPosts];

      set({
        posts: newPosts,
        loading: false,
        refreshing: false,
        hasMore: userPosts.length === 20,
        page: refresh ? 2 : get().page + 1,
      });
    } catch (error) {
      console.error('Failed to load user posts:', error);

      const errorMessage =
        error instanceof Error && error.message.includes('CLIENT_ERROR')
          ? 'Backend authentication issue: The server needs to be updated to support mobile Bearer tokens. Please contact the backend team.'
          : 'Failed to load user posts. Please try again.';

      set({
        loading: false,
        refreshing: false,
        error: errorMessage,
      });
    }
  },

  // Create new post
  createPost: async (data: CreatePostRequest) => {
    try {
      const {publicKey} = useWalletStore.getState();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      set({loading: true, error: null});

      const result = await socialAPI.createPost(data);

      // Create optimistic post object
      const newPost: Post = {
        id: result.postId.toString(),
        userWallet: publicKey.toString(),
        transactionHash: result.transaction,
        message: data.message,
        mediaUrls: data.mediaUrls,
        voteScore: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        replyCount: 0,
        tipCount: 0,
        totalTipAmount: 0,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          walletAddress: publicKey.toString(),
          name: undefined,
          profilePicture: undefined,
          isVerified: false,
          onChainReputation: 0,
          brandAddress: undefined,
        },
        userVote: null,
        userTipped: false,
      };

      // Optimistically add to feed
      set(state => ({
        posts: [newPost, ...state.posts],
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to create post:', error);
      set({
        loading: false,
        error: 'Failed to create post. Please try again.',
      });
      throw error;
    }
  },

  // Vote on user (affects their reputation)
  voteOnUser: async (data: VoteRequest) => {
    try {
      const {publicKey} = useWalletStore.getState();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Optimistic update
      const {posts} = get();
      const updatedPosts = posts.map(post => {
        if (post.userWallet === data.targetWallet) {
          const isUpvote = data.voteType === 'upvote';
          const hadVote = post.userVote;

          // Calculate new vote counts
          let upvoteCount = post.upvoteCount;
          let downvoteCount = post.downvoteCount;

          if (hadVote === 'upvote') {
            upvoteCount--;
          }
          if (hadVote === 'downvote') {
            downvoteCount--;
          }

          if (hadVote !== data.voteType) {
            if (isUpvote) {
              upvoteCount++;
            } else {
              downvoteCount++;
            }
          }

          return {
            ...post,
            upvoteCount,
            downvoteCount,
            voteScore: upvoteCount - downvoteCount,
            userVote: hadVote === data.voteType ? null : data.voteType,
          };
        }
        return post;
      });

      set({posts: updatedPosts});

      // Make API call
      await socialAPI.vote(data.targetWallet, data.voteType);
    } catch (error) {
      console.error('Failed to vote:', error);
      // Revert optimistic update on error
      await get().refreshFeed();
      throw error;
    }
  },

  // Send tip to user
  sendTip: async (data: TipRequest) => {
    try {
      const {publicKey} = useWalletStore.getState();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Make API call first (this handles blockchain transaction)
      await socialAPI.sendTip(data);

      // Update UI optimistically after successful transaction
      const {posts} = get();
      const updatedPosts = posts.map(post => {
        if (post.userWallet === data.receiverWallet) {
          return {
            ...post,
            tipCount: post.tipCount + 1,
            totalTipAmount: post.totalTipAmount + data.amount,
            userTipped: true,
          };
        }
        return post;
      });

      set({posts: updatedPosts});
    } catch (error) {
      console.error('Failed to send tip:', error);
      throw error;
    }
  },

  // Refresh feed
  refreshFeed: async () => {
    await get().loadFeed(true);
  },

  // Set feed type
  setFeedType: (feedType: 'for-you' | 'recent' | 'watchlist' | 'trending' | 'controversial' | 'receipts' | 'discovery') => {
    console.log('Store setFeedType called with:', feedType);
    set({currentFeedType: feedType});
    // Load feed asynchronously without blocking UI - use multiple deferral mechanisms
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          get().loadFeed(true, feedType);
        }, 100); // Longer delay to ensure UI animations complete
      });
    });
  },

  // Set time range for trending feed
  setTimeRange: (timeRange: 'hour' | 'day' | 'week') => {
    console.log('Store setTimeRange called with:', timeRange);
    set({currentTimeRange: timeRange});
    const {currentFeedType} = get();
    if (currentFeedType === 'trending') {
      get().loadFeed(true, currentFeedType, timeRange);
    }
  },

  // Receipt/Bookmark functionality
  receiptPost: async (postId: string) => {
    try {
      await socialAPI.receiptPost(postId);
      
      // Update post in state
      const {posts} = get();
      const updatedPosts = posts.map(post => 
        post.id === postId 
          ? {...post, userBookmarked: true}
          : post
      );
      set({posts: updatedPosts});
    } catch (error) {
      console.error('Failed to receipt post:', error);
      throw error;
    }
  },

  removeReceipt: async (postId: string) => {
    try {
      await socialAPI.removeReceipt(postId);
      
      // Update post in state
      const {posts} = get();
      const updatedPosts = posts.map(post => 
        post.id === postId 
          ? {...post, userBookmarked: false}
          : post
      );
      set({posts: updatedPosts});
    } catch (error) {
      console.error('Failed to remove receipt:', error);
      throw error;
    }
  },

  // User interactions
  followUser: async (userId: string) => {
    try {
      await socialAPI.followUser(userId);
      // Could update user follow state here if needed
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      await socialAPI.unfollowUser(userId);
      // Could update user follow state here if needed
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  // Quote posts functionality
  loadPostQuotes: async (postId: string, page = 1, limit = 20) => {
    try {
      console.log('🔍 SocialStore.loadPostQuotes: Loading quotes for post:', { postId, page, limit });
      
      const response = await socialAPI.getPostQuotes(postId, page, limit);
      
      console.log('🔍 SocialStore.loadPostQuotes: Response received:', {
        postsCount: response.posts?.length || 0,
        pagination: response.pagination,
        feedType: response.feedType
      });
      
      // Transform quotes using the utility function
      const transformedQuotes = response.posts ? response.posts.map(transformApiPost) : [];
      
      return {
        posts: transformedQuotes,
        pagination: response.pagination,
        feedType: response.feedType || 'quotes',
        cachedAt: response.cachedAt
      };
    } catch (error) {
      console.error('Failed to load post quotes:', error);
      throw error;
    }
  },

  // Real-time update handlers
  addNewPost: (post: Post) => {
    set(state => ({
      posts: [post, ...state.posts],
    }));
  },

  addNewPosts: (newPosts: Post[]) => {
    set(state => ({
      posts: [...newPosts, ...state.posts],
    }));
  },

  updatePost: (postId: string, updates: Partial<Post>) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId ? {...post, ...updates} : post,
      ),
    }));
  },

  updateVoteCounts: (postId: string, voteData: any) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              upvoteCount: voteData.upvoteCount,
              downvoteCount: voteData.downvoteCount,
              voteScore: voteData.voteScore,
            }
          : post,
      ),
    }));
  },

  updateTipCounts: (postId: string, tipData: any) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              tipCount: tipData.tipCount,
              totalTipAmount: tipData.totalTipAmount,
            }
          : post,
      ),
    }));
  },

  // Reputation polling implementation
  pollReputationScores: async () => {
    const { posts } = get();
    
    if (posts.length === 0) {
      console.log('🔄 SocialStore.pollReputationScores: No posts to poll reputation for');
      return;
    }

    try {
      // Extract unique wallet addresses from current posts
      const walletAddresses = Array.from(new Set(
        posts
          .map(post => post.userWallet || post.user?.wallet_address || post.user?.walletAddress)
          .filter(Boolean)
      )) as string[];

      if (walletAddresses.length === 0) {
        console.log('🔄 SocialStore.pollReputationScores: No wallet addresses found in posts');
        return;
      }

      console.log('🔄 SocialStore.pollReputationScores: Polling reputation for', walletAddresses.length, 'wallets');

      const { reputationScores } = await socialAPI.getBatchReputationScores(walletAddresses);
      
      if (reputationScores.length > 0) {
        get().updateReputationScores(reputationScores);
      }
    } catch (error) {
      console.error('🔄 SocialStore.pollReputationScores: Failed to poll reputation scores:', error);
    }
  },

  updateReputationScores: (scores: Array<{ walletAddress: string; reputation: number }>) => {
    const { posts } = get();
    let hasChanges = false;
    
    const updatedPosts = posts.map(post => {
      const userWallet = post.userWallet || post.user?.wallet_address || post.user?.walletAddress;
      const scoreData = scores.find(s => s.walletAddress === userWallet);
      
      if (scoreData && scoreData.reputation !== undefined) {
        const currentReputation = post.user?.reputation_score || 0;
        
        if (currentReputation !== scoreData.reputation) {
          console.log('🔄 SocialStore.updateReputationScores: Reputation changed for', userWallet?.slice(0, 8), 
            'from', currentReputation, 'to', scoreData.reputation);
          hasChanges = true;
          
          return {
            ...post,
            user: {
              ...post.user,
              reputation_score: scoreData.reputation,
              onChainReputation: scoreData.reputation, // Legacy field
            }
          };
        }
      }
      
      return post;
    });

    if (hasChanges) {
      console.log('🔄 SocialStore.updateReputationScores: Updated reputation scores for posts');
      set({ posts: updatedPosts });
    }
  },

  startReputationPolling: () => {
    const { reputationPollingInterval } = get();
    
    // Clear existing interval if any
    if (reputationPollingInterval) {
      clearInterval(reputationPollingInterval);
    }
    
    console.log('🔄 SocialStore.startReputationPolling: Starting reputation polling every 10 seconds');
    
    // Start new polling interval (10 seconds)
    const interval = setInterval(() => {
      get().pollReputationScores();
    }, 10000);
    
    set({ reputationPollingInterval: interval });
    
    // Do initial poll
    get().pollReputationScores();
  },

  stopReputationPolling: () => {
    const { reputationPollingInterval } = get();
    
    if (reputationPollingInterval) {
      console.log('🔄 SocialStore.stopReputationPolling: Stopping reputation polling');
      clearInterval(reputationPollingInterval);
      set({ reputationPollingInterval: null });
    }
  },

  // Batch receipt status checking implementation
  checkBatchReceiptStatus: async () => {
    const { posts } = get();
    
    if (posts.length === 0) {
      console.log('🔖 SocialStore.checkBatchReceiptStatus: No posts to check receipt status for');
      return;
    }

    try {
      // Extract valid post signatures from current posts
      const getValidSignature = (post: Post) => {
        const transactionHash = post.transaction_hash || post.transactionHash;
        const signature = post.signature;
        
        // Validate signature (same logic as PostCard)
        const isValidSignature = (sig: string) => {
          return sig && typeof sig === 'string' && sig.length > 50 && !sig.match(/^[0-9]+$/);
        };
        
        if (isValidSignature(transactionHash)) return transactionHash;
        if (isValidSignature(signature)) return signature;
        return null;
      };

      const postSignatures = posts
        .map(getValidSignature)
        .filter(Boolean) as string[];

      if (postSignatures.length === 0) {
        console.log('🔖 SocialStore.checkBatchReceiptStatus: No valid post signatures found');
        return;
      }

      console.log('🔖 SocialStore.checkBatchReceiptStatus: Checking receipt status for', postSignatures.length, 'posts');

      const { receiptStatuses } = await socialAPI.getBatchReceiptStatus(postSignatures);
      
      if (receiptStatuses.length > 0) {
        get().updateReceiptStatuses(receiptStatuses);
      }
    } catch (error) {
      console.error('🔖 SocialStore.checkBatchReceiptStatus: Failed to check receipt statuses:', error);
    }
  },

  updateReceiptStatuses: (statuses: Array<{ postSignature: string; isReceipted: boolean; receiptedAt: string | null }>) => {
    const { posts } = get();
    let hasChanges = false;
    
    const updatedPosts = posts.map(post => {
      const postSignature = post.transaction_hash || post.transactionHash || post.signature;
      const statusData = statuses.find(s => s.postSignature === postSignature);
      
      if (statusData && statusData.isReceipted !== undefined) {
        const currentReceiptStatus = post.userBookmarked || post.user_bookmarked || false;
        
        if (currentReceiptStatus !== statusData.isReceipted) {
          console.log('🔖 SocialStore.updateReceiptStatuses: Receipt status changed for', postSignature?.slice(0, 12), 
            'from', currentReceiptStatus, 'to', statusData.isReceipted);
          hasChanges = true;
          
          return {
            ...post,
            userBookmarked: statusData.isReceipted,
            user_bookmarked: statusData.isReceipted,
          };
        }
      }
      
      return post;
    });

    if (hasChanges) {
      console.log('🔖 SocialStore.updateReceiptStatuses: Updated receipt statuses for posts');
      set({ posts: updatedPosts });
    }
  },

  // UI helpers
  setLoading: (loading: boolean) => set({loading}),
  setError: (error: string | null) => set({error}),
  
}));
