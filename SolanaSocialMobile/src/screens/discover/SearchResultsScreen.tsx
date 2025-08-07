import React, {useEffect, useCallback, useState} from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Search} from 'lucide-react-native';
import {PostCard} from '../../components/social/PostCard';
import {ErrorState} from '../../components/ui/ErrorState';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {InlineLoader} from '../../components/ui/UniversalLoader';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useSocialStore} from '../../store/socialStore';
import {socialAPI} from '../../services/api/social';
import {DiscoverStackScreenProps} from '../../types/navigation';
import {Post} from '../../types/social';

type Props = DiscoverStackScreenProps<'SearchResults'>;

export default function SearchResultsScreen({route, navigation}: Props) {
  const {query} = route.params;
  const {colors} = useThemeStore();
  const {isAuthenticated, token} = useAuthStore();
  
  // Local state for search results
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Get social store methods for reputation polling and batch receipt checking
  const {
    startReputationPolling,
    stopReputationPolling,
    checkBatchReceiptStatus,
    updateReputationScores,
    updateReceiptStatuses
  } = useSocialStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    queryText: {
      fontSize: 16,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 60, // Add top padding to push content down from header
    },
    emptyStateContent: {
      alignItems: 'center',
      maxWidth: 280,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Inter-SemiBold',
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    resultsHeader: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    resultsText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
  });

  // Helper function to transform search posts to match processed_posts structure
  const transformSearchPost = useCallback((searchPost: any): Post => {
    console.log('🔍 SearchResultsScreen.transformSearchPost: Transforming search post:', {
      id: searchPost.id,
      hasPost: !!searchPost.post,
      postKeys: searchPost.post ? Object.keys(searchPost.post).slice(0, 10) : 'no post object'
    });

    // If the search result already has processed_posts structure, use existing transformation
    if (searchPost.postSignature || searchPost.displayName) {
      // Use the same transformation logic as socialStore but adapted for search results
      const apiPost = searchPost;
      const shouldUseBrandInfo = apiPost.userIsBrand && apiPost.brandName;
      
      const getDisplayName = () => {
        if (apiPost.displayName) return apiPost.displayName;
        if (shouldUseBrandInfo) return apiPost.brandName;
        return apiPost.userSnsDomain || `${apiPost.postUser?.slice(0, 5)}...${apiPost.postUser?.slice(-5)}` || 'Anonymous';
      };

      const getProfilePicture = () => {
        if (shouldUseBrandInfo && apiPost.brandLogoUrl) return apiPost.brandLogoUrl;
        return apiPost.userProfileImageUri;
      };

      const getIsVerified = () => {
        if (shouldUseBrandInfo) return apiPost.brandIsVerified || false;
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
        replyCount: 0,
        tipCount: apiPost.userTipsReceivedCount || 0,
        totalTipAmount: 0,
        isPinned: false,
        createdAt: apiPost.processedAt || apiPost.postProcessedAt || new Date().toISOString(),
        updatedAt: apiPost.updatedAt || apiPost.processedAt || apiPost.postProcessedAt || new Date().toISOString(),
        
        user: {
          walletAddress: apiPost.postUser || '',
          name: getDisplayName(),
          profilePicture: getProfilePicture(),
          isVerified: getIsVerified(),
          onChainReputation: apiPost.userReputation || 0,
          brandAddress: apiPost.userBrandAddress,
          
          id: apiPost.id,
          username: apiPost.userSnsDomain,
          display_name: getDisplayName(),
          avatar_url: getProfilePicture(),
          is_verified: getIsVerified(),
          reputation_score: apiPost.userReputation || 0,
          follower_count: 0,
          following_count: 0,
          wallet_address: apiPost.postUser,
          is_brand: apiPost.userIsBrand || false,
          
          brand_name: shouldUseBrandInfo ? apiPost.brandName : null,
          brand_logo_url: shouldUseBrandInfo ? apiPost.brandLogoUrl : null,
          brand_is_verified: shouldUseBrandInfo ? apiPost.brandIsVerified : false,
          brand_category: shouldUseBrandInfo ? apiPost.brandCategory : null,
          brand_url: shouldUseBrandInfo ? apiPost.brandUrl : null,
        },
        
        userVote: null,
        userTipped: false,
        userBookmarked: false,
        
        images: apiPost.postImages || [],
        video: apiPost.postVideo,
        slot: apiPost.postSlot || 0,
        epoch: apiPost.postEpoch || 0,
        is_thread: apiPost.postIsThread || false,
        previous_thread_post: apiPost.postPreviousThreadPost || null,
        is_pinned: false,
        quote_count: 0,
        receipts_count: 0,
        view_count: 0,
        signature: apiPost.postSignature,
        created_at: apiPost.processedAt || apiPost.postProcessedAt,
        updated_at: apiPost.updatedAt || apiPost.processedAt || apiPost.postProcessedAt,
        
        quoted_post: apiPost.postQuotedPost,
        quotedPost: apiPost.postQuotedPost,
        quote_post: apiPost.postQuotedPost,
        
        isThread: apiPost.postIsThread || false,
        previousThreadPost: apiPost.postPreviousThreadPost || null,
        
        quotedPostData: apiPost.quotedPostData || null,
        threadData: apiPost.threadData || null,
        isThreadRoot: apiPost.isThreadRoot || false,
        threadPostCount: apiPost.threadPostCount || 0,
        
        taggedUsers: apiPost.postTaggedUsers || [],
      };
    }

    // Otherwise, use simple transformation for legacy search format
    const post = searchPost.post || searchPost;
    const highlights = searchPost.highlights || {};
    const metadata = searchPost.metadata || {};
    
    return {
      id: post.signature || post.id?.toString() || '0',
      userWallet: post.userWallet || post.user_wallet || '',
      transactionHash: post.signature || post.transactionHash || '',
      signature: post.signature,
      message: post.message || highlights.content || '',
      mediaUrls: post.images || post.mediaUrls || [],
      voteScore: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      replyCount: post.replyCount || metadata.replyCount || 0,
      tipCount: 0,
      totalTipAmount: 0,
      isPinned: false,
      createdAt: post.createdAt || metadata.createdAt || new Date().toISOString(),
      updatedAt: post.createdAt || metadata.createdAt || new Date().toISOString(),
      
      user: {
        walletAddress: post.userWallet || post.user_wallet || '',
        name: searchPost.displayName || post.displayName || 'Unknown User',
        profilePicture: searchPost.profileImageUrl || post.profileImageUrl || undefined,
        isVerified: searchPost.isVerified || post.isVerified || false,
        onChainReputation: post.reputation || 0,
        brandAddress: undefined,
      },
      
      userVote: null,
      userTipped: false,
      userBookmarked: false,
      
      images: post.images || post.mediaUrls || [],
      video: post.video,
      slot: post.slot || 0,
      epoch: post.epoch || 0,
      is_thread: post.isThread || false,
      previous_thread_post: null,
      is_pinned: false,
      quote_count: post.quoteCount || 0,
      receipts_count: post.receiptsCount || 0,
      view_count: 0,
      created_at: post.createdAt || metadata.createdAt,
      updated_at: post.createdAt || metadata.createdAt,
      
      quoted_post: post.quotedPost,
      quotedPost: post.quotedPost,
      quote_post: post.quotedPost,
      
      isThread: post.isThread || false,
      previousThreadPost: null,
      
      quotedPostData: null,
      threadData: null,
      isThreadRoot: false,
      threadPostCount: 0,
      
      taggedUsers: [],
    };
  }, []);

  // Load search results
  const loadSearchResults = useCallback(async (refresh = false) => {
    if (loading || refreshing) return;
    
    console.log('🔍 SearchResultsScreen.loadSearchResults: Loading search results:', { query, refresh, page: refresh ? 1 : page });
    
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    
    if (refresh) {
      setPage(1);
      setHasMore(true);
    }
    
    try {
      const response = await socialAPI.searchPosts(query, refresh ? 1 : page, 20);
      
      console.log('🔍 SearchResultsScreen.loadSearchResults: Response received:', {
        postsCount: response.data?.length || 0,
        pagination: response.pagination
      });
      
      const transformedPosts = (response.data || []).map(transformSearchPost);
      
      const newPosts = refresh ? transformedPosts : [...posts, ...transformedPosts];
      
      setPosts(newPosts);
      setHasMore(response.pagination?.hasNext || false);
      setPage(refresh ? 2 : page + 1);
      
    } catch (err) {
      console.error('🔍 SearchResultsScreen.loadSearchResults: Error:', err);
      setError('Failed to load search results. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, page, posts, loading, refreshing, transformSearchPost]);

  // Load initial results
  useEffect(() => {
    if (query && query.trim()) {
      loadSearchResults(true);
    }
  }, [query]); // Only depend on query, not loadSearchResults to avoid infinite loop

  // Start reputation polling when posts are loaded and user is authenticated
  useEffect(() => {
    if (isAuthenticated && posts.length > 0) {
      console.log('🔄 SearchResultsScreen: Starting reputation polling for', posts.length, 'search results');
      startReputationPolling();
      
      return () => {
        console.log('🔄 SearchResultsScreen: Stopping reputation polling');
        stopReputationPolling();
      };
    }
  }, [isAuthenticated, posts.length, startReputationPolling, stopReputationPolling]);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      stopReputationPolling();
    };
  }, [stopReputationPolling]);

  // Check receipt status for posts when they're loaded using batch API (non-blocking)
  useEffect(() => {
    if (posts.length > 0 && isAuthenticated) {
      console.log('🔖 SearchResultsScreen: Triggering non-blocking batch receipt status check for', posts.length, 'search results');
      // Make the call asynchronously without awaiting to not block UI
      checkBatchReceiptStatus().catch(error => {
        console.error('🔖 SearchResultsScreen: Receipt status check failed (non-blocking):', error);
      });
    }
  }, [posts, isAuthenticated, checkBatchReceiptStatus]);

  const handleRefresh = useCallback(async () => {
    await loadSearchResults(true);
  }, [loadSearchResults]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading);
  }, [refreshing, loading, handleRefreshStateChange]);

  const handleLoadMore = useCallback(async () => {
    console.log('🔍 SearchResultsScreen.handleLoadMore: Called with state:', { hasMore, loading, postsLength: posts.length });
    if (hasMore && !loading && !refreshing) {
      console.log('🔍 SearchResultsScreen.handleLoadMore: Loading more search results...');
      await loadSearchResults(false);
    }
  }, [hasMore, loading, refreshing, loadSearchResults, posts.length]);

  const handlePostPress = useCallback(
    (post: Post) => {
      // ENGAGEMENT TRACKING: Add postExpansion=true for analytics
      console.log('📊 SearchResultsScreen: Tracking post expansion for engagement metrics');
      
      // Check if this is a thread root post and route appropriately
      if (post.threadData || post.isThreadRoot || post.threadPostCount > 0) {
        console.log('🧵 SearchResultsScreen.handlePostPress: Navigating to thread details for post:', post.id);
        navigation.navigate('ThreadDetails', {
          threadId: post.signature || post.transactionHash || post.id?.toString(),
          post: post,
          postExpansion: true // Track expansion for analytics
        });
      } else {
        console.log('📄 SearchResultsScreen.handlePostPress: Navigating to post details for regular post:', post.id);
        navigation.navigate('PostDetail', {
          postId: post.transaction_hash || post.signature || post.id, 
          post,
          postExpansion: true // Track expansion for analytics
        });
      }
    },
    [navigation],
  );

  const handleUserPress = useCallback(
    (userId: number | undefined | null, walletAddress: string, postSignature?: string) => {
      // ENGAGEMENT TRACKING: Include profileVisitFrom for analytics
      console.log('📊 SearchResultsScreen: Tracking profile visit from post:', postSignature);
      
      if (walletAddress && walletAddress.trim()) {
        console.log('🔍 SearchResultsScreen.handleUserPress: Navigating to Profile with walletAddress:', walletAddress);
        navigation.navigate('Profile', {
          walletAddress,
          profileVisitFrom: postSignature // Track where the visit came from
        });
      }
    },
    [navigation],
  );

  const handleQuotePost = useCallback(
    (post: Post) => {
      navigation.navigate('CreatePost', {
        quotedPost: {
          id: post.id,
          message: post.message,
          user: {
            name: post.user.name,
            profilePicture: post.user.profilePicture,
            isVerified: post.user.isVerified,
          },
          userWallet: post.userWallet,
          createdAt: post.createdAt,
        },
      });
    },
    [navigation],
  );

  const handleThreadPress = useCallback(
    (post: Post) => {
      navigation.navigate('ThreadDetails', {
        threadId: post.signature || post.transactionHash || post.id?.toString(),
        post: post
      });
    },
    [navigation],
  );

  const handleQuotedPostPress = useCallback(
    (quotedPost: any) => {
      navigation.navigate('PostDetail', {
        postId: quotedPost.postSignature,
        post: null
      });
    },
    [navigation],
  );

  const renderPost = useCallback(
    ({item}: {item: Post}) => (
      <PostCard
        post={item}
        onPress={() => handlePostPress(item)}
        onUserPress={handleUserPress}
        onQuotePress={handleQuotePost}
        onThreadPress={handleThreadPress}
        onQuotedPostPress={handleQuotedPostPress}
      />
    ),
    [handlePostPress, handleUserPress, handleQuotePost, handleThreadPress, handleQuotedPostPress],
  );

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateContent}>
        <Search size={32} color={colors.mutedForeground} />
        <Text style={styles.emptyStateTitle}>No results found for "{query}"</Text>
        <Text style={styles.emptyStateSubtitle}>
          Try searching with different keywords or check your spelling.
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore && posts.length > 0) {
      return (
        <View style={{paddingVertical: 16, alignItems: 'center'}}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 14,
              fontFamily: 'Inter-Regular',
            }}>
            You've reached the end of search results!
          </Text>
        </View>
      );
    }

    if (loading && posts.length > 0) {
      return (
        <InlineLoader title="Loading more results..." />
      );
    }

    if (posts.length > 0 && hasMore) {
      return <View style={{height: 50}} />;
    }

    return null;
  };

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back">
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Search Results</Text>
        </View>

        <EnhancedErrorState
          title="Can't load search results"
          subtitle="Check your connection and try again"
          onRetry={() => loadSearchResults(true)}
          retryLabel="Try Again"
          retrying={loading}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back">
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>
          Search: <Text style={styles.queryText}>"{query}"</Text>
        </Text>
      </View>

      {posts.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {posts.length} result{posts.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item, index) => `search-post-${index}-${item.id || 'unknown'}`}
        renderItem={renderPost}
        contentContainerStyle={posts.length === 0 && !loading ? {flex: 1} : {flexGrow: 1}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={enhancedOnRefresh}
            tintColor={colors.primary} // iOS spinner color
            colors={[colors.primary, colors.secondary]} // Android spinner colors  
            progressBackgroundColor={colors.card} // Android background
            progressViewOffset={0} // Normal positioning
            size="default"
            title="Pull to refresh" // iOS title
            titleColor={colors.mutedForeground} // iOS title color
          />
        }
        onEndReached={(info) => {
          console.log('🔍 SearchResultsScreen.FlatList.onEndReached: Triggered with info:', info);
          handleLoadMore();
        }}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={posts.length === 0 && !loading ? renderEmpty : loading ? <FeedSkeleton itemCount={10} showImages={false} /> : null}
        ListFooterComponent={renderFooter}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </SafeAreaView>
  );
}
