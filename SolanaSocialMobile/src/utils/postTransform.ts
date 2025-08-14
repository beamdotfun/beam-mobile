// Utility functions for transforming processed_posts API responses to our Post type
import { Post } from '../types/social';

/**
 * Transform a single processed_posts API response to our Post type
 * This handles both individual posts and posts within threads
 */
export function transformProcessedPost(apiPost: any): Post {
  // Brand vs User prioritization logic per FEED_INTEGRATION_GUIDE.md
  const shouldUseBrandInfo = apiPost.userIsBrand && apiPost.brandName;
  
  // Get display name - backend now provides displayName directly
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
    
    // 72-hour vote fields for controversial feed
    upvotesReceived72h: apiPost.userUpvotesReceived72h || apiPost.upvotesReceived72h || 0,
    downvotesReceived72h: apiPost.userDownvotesReceived72h || apiPost.downvotesReceived72h || 0,
    votesReceived72h: (apiPost.userUpvotesReceived72h || apiPost.upvotesReceived72h || 0) + 
                      (apiPost.userDownvotesReceived72h || apiPost.downvotesReceived72h || 0),
    
    replyCount: apiPost.reply_count || apiPost.replyCount || apiPost.postReplyCount || 0,
    tipCount: apiPost.userTipsReceivedCount || 0,
    totalTipAmount: 0, // Will be calculated from tip data if available
    isPinned: false, // Will be updated when pin data is available
    createdAt: apiPost.processedAt || apiPost.postProcessedAt || new Date().toISOString(),
    updatedAt: apiPost.updatedAt || apiPost.processedAt || apiPost.postProcessedAt || new Date().toISOString(),
    
    // User object with brand prioritization
    user: {
      walletAddress: apiPost.postUser || '',
      name: getDisplayName(),
      display_name: getDisplayName(),
      profilePicture: getProfilePicture(),
      avatar_url: getProfilePicture(),
      isVerified: getIsVerified(),
      is_verified: getIsVerified(),
      onChainReputation: apiPost.userReputation || 0,
      brandAddress: apiPost.userBrandAddress,
      // Pass through raw profile picture fields for debugging
      userProfileImageUri: apiPost.userProfileImageUri,
      brandLogoUrl: apiPost.brandLogoUrl,
      brand_logo_url: apiPost.brandLogoUrl,
      
      // Additional processed_posts fields
      id: apiPost.id,
      username: apiPost.userSnsDomain,
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
      brand_reputation: shouldUseBrandInfo ? apiPost.brandReputation : undefined,
    },
    
    userVote: apiPost.userVote || null,
    userTipped: false, // Should be determined based on user's tips
    userBookmarked: apiPost.userBookmarked || false,
    
    // Additional processed_posts fields
    images: apiPost.postImages || [],
    video: apiPost.postVideo,
    slot: apiPost.postSlot || 0,
    epoch: apiPost.postEpoch || 0,
    is_thread: apiPost.postIsThread || false,
    previous_thread_post: apiPost.postPreviousThreadPost || null,
    is_pinned: false, // Will be updated when pin data is available
    
    // Map actual stats from backend - API returns camelCase field names per ENGAGEMENT_TRACKING_API.md
    view_count: apiPost.postViewCount || apiPost.view_count || apiPost.viewCount || 0,
    receipts_count: apiPost.postReceiptsCount || apiPost.receipts_count || apiPost.receiptsCount || 0,
    expansions_count: apiPost.postExpansionsCount || apiPost.expansions_count || 0,
    profile_visits_count: apiPost.profileVisitsCount || apiPost.profile_visits_count || 0,
    unique_views_count: apiPost.postUniqueViewsCount || apiPost.unique_views_count || 0,
    
    // Also map camelCase versions for component compatibility
    viewCount: apiPost.postViewCount || apiPost.viewCount || 0,
    receiptsCount: apiPost.postReceiptsCount || apiPost.receiptsCount || 0,
    expansionsCount: apiPost.postExpansionsCount || apiPost.expansionsCount || 0,
    profileVisitsCount: apiPost.profileVisitsCount || 0,
    uniqueViewsCount: apiPost.postUniqueViewsCount || apiPost.uniqueViewsCount || 0,
    
    // Quote count not mentioned in engagement docs - keep existing mapping
    quote_count: apiPost.quote_count || apiPost.quoteCount || 0,
    quoteCount: apiPost.quote_count || apiPost.quoteCount || 0,
    
    signature: apiPost.postSignature, // Use postSignature from processed_posts
    created_at: apiPost.processedAt || apiPost.postProcessedAt,
    updated_at: apiPost.updatedAt || apiPost.processedAt || apiPost.postProcessedAt,
    
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
    tagged_users: apiPost.postTaggedUsers || [],
    
    // Pass through raw profile picture fields for fallback
    userProfileImageUri: apiPost.userProfileImageUri,
    brandLogoUrl: apiPost.brandLogoUrl,
    profileImageUrl: apiPost.userProfileImageUri || apiPost.brandLogoUrl,
    
    // Quote tracking fields from POST_DATA_STRUCTURE.md
    quoted_by: apiPost.quotedBy || apiPost.quoted_by || [],
    quotedBy: apiPost.quotedBy || apiPost.quoted_by || [],
    quoted_by_count: apiPost.quotedByCount || apiPost.quoted_by_count || 0,
    quotedByCount: apiPost.quotedByCount || apiPost.quoted_by_count || 0,
    quote_details: apiPost.quotedByDetails || apiPost.quote_details || [],
    quotedByDetails: apiPost.quotedByDetails || apiPost.quote_details || [],
    quotes_received_24h: apiPost.quotesReceived24h || apiPost.quotes_received_24h || 0,
    quotesReceived24h: apiPost.quotesReceived24h || apiPost.quotes_received_24h || 0,
    quotes_received_48h: apiPost.quotesReceived48h || apiPost.quotes_received_48h || 0,
    quotesReceived48h: apiPost.quotesReceived48h || apiPost.quotes_received_48h || 0,
    quotes_received_72h: apiPost.quotesReceived72h || apiPost.quotes_received_72h || 0,
    quotesReceived72h: apiPost.quotesReceived72h || apiPost.quotes_received_72h || 0,
  };
}

/**
 * Transform individual post API response (from /social/posts/:postId)
 */
export function transformIndividualPostResponse(response: any): { post: Post } {
  if (!response.post) {
    throw new Error('Invalid individual post response structure');
  }
  
  return {
    post: transformProcessedPost(response.post)
  };
}

/**
 * Transform thread API response (from /social/threads/:postId)
 */
export function transformThreadResponse(response: any): {
  thread: {
    rootPost: Post;
    posts: Post[];
    totalPosts: number;
    lastUpdated: string;
  }
} {
  if (!response.thread) {
    throw new Error('Invalid thread response structure');
  }
  
  const { thread } = response;
  
  return {
    thread: {
      rootPost: transformProcessedPost(thread.rootPost),
      posts: thread.posts.map(transformProcessedPost),
      totalPosts: thread.totalPosts || thread.posts.length,
      lastUpdated: thread.lastUpdated || new Date().toISOString(),
    }
  };
}

/**
 * Transform post quotes API response (from /social/posts/:postId/quotes)
 */
export function transformPostQuotesResponse(response: any): {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  feedType: string;
  cachedAt: string;
} {
  if (!response.posts) {
    throw new Error('Invalid post quotes response structure');
  }
  
  return {
    posts: response.posts.map(transformProcessedPost),
    pagination: response.pagination || {
      page: 1,
      limit: 20,
      total: response.posts.length,
      totalPages: 1,
    },
    feedType: response.feedType || 'quotes',
    cachedAt: response.cachedAt || new Date().toISOString(),
  };
}