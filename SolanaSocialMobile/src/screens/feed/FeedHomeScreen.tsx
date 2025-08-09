import React, {useEffect, useCallback, useState, useRef} from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Vibration,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Plus} from 'lucide-react-native';
import {PostCard} from '../../components/social/PostCard';
import {BillboardAd, BillboardAdData} from '../../components/ads/BillboardAd';
import {billboardAdService} from '../../services/ads/billboardService';
import {Button} from '../../components/ui/button';
import {ErrorState} from '../../components/ui/ErrorState';
import {StatusDot} from '../../components/ui/StatusDot';
import {ProfileMenuButton} from '../../components/navigation/ProfileMenuButton';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {SegmentedControl} from '../../components/ui/SegmentedControl';
import {Avatar} from '../../components/ui/avatar';
import {useSocialStore} from '../../store/socialStore';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useAuthStore} from '../../store/auth';
// WebSocket implementation removed - using polling instead
import {useFeedPolling} from '../../hooks/useFeedPolling';
import {useNetworkStatus} from '../../hooks/useNetworkStatus';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {Toast} from '../../components/ui/Toast';
import {NoHooksRefreshControl} from '../../components/ui/NoHooksRefreshControl';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {InlineLoader} from '../../components/ui/UniversalLoader';
import {StyledLoadMoreIndicator} from '../../components/ui/StyledLoadMoreIndicator';
import {FeedStackScreenProps} from '../../types/navigation';
import {Post} from '../../types/social';
import {getAvatarFallback} from '../../lib/utils';
import {debouncedNavigate} from '../../utils/navigationUtils';
import {useScreenCleanup} from '../../hooks/useScreenCleanup';

type Props = FeedStackScreenProps<'FeedHome'>;

export default function FeedHomeScreen({navigation}: Props) {
  const {colors, isDark} = useThemeStore();
  const {publicKey, connectionStatus} = useWalletStore();
  const {isAuthenticated, token, user, isRehydrated} = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // Automatic memory cleanup on unmount
  useScreenCleanup('FeedHomeScreen');
  const feedTypes = ['For You', 'Recent', 'Watchlist'];
  const feedTypeMap = {
    0: 'for-you' as const,
    1: 'recent' as const,
    2: 'watchlist' as const,
  };
  
  // Get currentFeedType from store
  const currentFeedType = useSocialStore(state => state.currentFeedType);
  
  // Use local state for tab indicator UI - this is the single source of truth for visual state
  const [selectedFeedType, setSelectedFeedType] = useState(() => {
    // Initialize based on current store state
    const index = Object.entries(feedTypeMap).find(([_, value]) => value === currentFeedType)?.[0];
    return parseInt(index || '0');
  });
  
  // NO SYNC EFFECT - selectedFeedType is controlled only by user interaction
  // The store updates happen asynchronously and don't affect the visual state
  
  const {isOnline} = useNetworkStatus();
  
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    avatarButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSide: {
      flex: 1,
      flexDirection: 'row',
    },
    headerSideRight: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    statusDot: {
      marginLeft: 8,
    },
    segmentedRow: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: colors.background,
    },
    offlineOverlay: {
      opacity: isOnline ? 1 : 0.6,
    },
    createPostButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    createPostButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
  });
  const {
    posts,
    loading,
    refreshing,
    hasMore,
    error,
    loadFeed,
    loadMorePosts,
    refreshFeed,
    setFeedType,
    startReputationPolling,
    stopReputationPolling,
    checkBatchReceiptStatus,
  } = useSocialStore();

  // Real-time integration
  // Realtime functionality removed - using polling instead
  
  // Feed polling for new posts - only for recent and watchlist feeds
  const shouldPollForFeed = currentFeedType === 'recent' || currentFeedType === 'watchlist';
  const currentPollingFeedType = currentFeedType === 'recent' ? 'recent' : currentFeedType === 'watchlist' ? 'watchlist' : 'recent';
  
  const {
    posts: pollingPosts,
    newPostCount,
    isPolling,
    error: pollingError,
    markAsViewed,
    refresh: refreshPolling,
    startPolling,
    stopPolling,
    clearPollingPosts,
  } = useFeedPolling({
    feedType: currentPollingFeedType,
    pollingInterval: 10000, // 10 seconds for more frequent updates
    enabled: isAuthenticated && isOnline && shouldPollForFeed,
    onNewPosts: (newPosts) => {
      console.log(`[FeedHomeScreen] Received ${newPosts.length} new posts for ${currentFeedType} feed`);
      // Note: New posts are handled internally by the hook
      // We can show a notification here if needed
    },
  });

  // Clear queued posts when switching feeds
  useEffect(() => {
    // Clear queued posts and counter when switching to a feed that doesn't support polling
    if (!shouldPollForFeed) {
      clearPollingPosts();
      markAsViewed();
    }
  }, [currentFeedType, shouldPollForFeed, clearPollingPosts, markAsViewed]);

  // Display posts - always use store posts now that we're adding polling posts to the store
  const displayPosts = React.useMemo(() => {
    return posts;
  }, [posts]);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [billboardAd, setBillboardAd] = useState<BillboardAdData | null>(null);
  const [adLoading, setAdLoading] = useState(true);
  
  // Ref for FlatList scrolling
  const flatListRef = useRef<FlatList>(null);
  
  // Load billboard ad
  useEffect(() => {
    const loadBillboardAd = async () => {
      // Use a default wallet address for demo purposes if user doesn't have one
      const userWalletAddress = user?.primary_wallet_address || user?.primaryWalletAddress || user?.walletAddress;
      const walletAddress = userWalletAddress || 'demo_wallet_address';
      
      try {
        setAdLoading(true);
        const ad = await billboardAdService.getBillboardAdForUser(walletAddress);
        setBillboardAd(ad);
      } catch (error) {
        console.error('Failed to load billboard ad:', error);
        setBillboardAd(null);
      } finally {
        setAdLoading(false);
      }
    };

    loadBillboardAd();
  }, [user?.primary_wallet_address, user?.primaryWalletAddress, user?.walletAddress]);

  // Handle billboard ad claim
  const handleAdClaim = useCallback(async (adId: string) => {
    const userWalletAddress = user?.primary_wallet_address || user?.primaryWalletAddress || user?.walletAddress;
    const walletAddress = userWalletAddress || 'demo_wallet_address';
    
    try {
      const result = await billboardAdService.claimAd(adId, walletAddress);
      if (result.success) {
        // Remove the ad from view after successful claim
        setBillboardAd(null);
        // You could show a success toast here
      } else {
        console.error('Ad claim failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to claim ad:', error);
    }
  }, [user?.primary_wallet_address, user?.primaryWalletAddress, user?.walletAddress]);

  // Handle brand profile navigation
  const handleBrandPress = useCallback((brandWallet: string) => {
    // Navigate to brand profile (similar to user profile) with debouncing
    debouncedNavigate(navigation, 'Profile', { walletAddress: brandWallet });
  }, [navigation]);

  // Handle hashtag press in billboard ads
  const handleHashtagPress = useCallback((hashtag: string) => {
    // Navigate to search with the hashtag
    navigation.navigate('Search', { initialQuery: `#${hashtag}` });
  }, [navigation]);

  // Real-time subscription removed - using polling instead

  // Load initial feed
  useEffect(() => {
    console.log('FeedHomeScreen - Auth state changed:', { isAuthenticated, hasToken: !!token, isRehydrated });
    if (isRehydrated && isAuthenticated && token) {
      console.log('FeedHomeScreen - Loading feed with authentication');
      loadFeed(true);
    } else if (isRehydrated) {
      console.log('FeedHomeScreen - Not loading feed, missing auth or token');
    } else {
      console.log('FeedHomeScreen - Waiting for auth rehydration...');
    }
  }, [isAuthenticated, token, isRehydrated, loadFeed]);

  // Start reputation polling when posts are loaded and user is authenticated (with delay)
  useEffect(() => {
    if (isAuthenticated && posts.length > 0) {
      console.log('🔄 FeedHomeScreen: Scheduling delayed reputation polling for', posts.length, 'posts');
      // Delay reputation polling to avoid interfering with initial load
      const timeoutId = setTimeout(() => {
        console.log('🔄 FeedHomeScreen: Starting reputation polling');
        startReputationPolling();
      }, 2000); // 2 second delay
      
      return () => {
        clearTimeout(timeoutId);
        console.log('🔄 FeedHomeScreen: Stopping reputation polling');
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

  // Handle network status changes
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Just came back online
      setShowOfflineToast(true);
      setWasOffline(false);
      // Refresh feed when back online
      if (isRehydrated && isAuthenticated && token) {
        loadFeed(true);
      }
    }
  }, [isOnline, wasOffline, isRehydrated, isAuthenticated, token, loadFeed]);

  // Check receipt status for posts when they're loaded using batch API (truly non-blocking)
  useEffect(() => {
    if (posts.length > 0 && isAuthenticated) {
      console.log('🔖 FeedHomeScreen: Scheduling non-blocking batch receipt status check for', posts.length, 'posts');
      // Use delay to avoid interfering with initial load
      const timeoutId = setTimeout(() => {
        checkBatchReceiptStatus().catch(error => {
          console.error('🔖 FeedHomeScreen: Receipt status check failed (non-blocking):', error);
        });
      }, 3000); // 3 second delay to ensure UI is settled
      
      // Return cleanup function to cancel if component unmounts or posts change
      return () => clearTimeout(timeoutId);
    }
  }, [posts.length, isAuthenticated, checkBatchReceiptStatus]);

  const handleRefresh = useCallback(async () => {
    // If we have queued posts, add them first before refreshing
    if (newPostCount > 0 && pollingPosts.length > 0 && shouldPollForFeed) {
      console.log('[FeedHomeScreen] Adding', pollingPosts.length, 'queued posts before refresh');
      useSocialStore.getState().addNewPosts(pollingPosts);
      clearPollingPosts();
      markAsViewed();
    }
    
    await refreshFeed();
    
    // Also reload billboard ad on refresh
    const userWalletAddress = user?.primary_wallet_address || user?.primaryWalletAddress || user?.walletAddress;
    const walletAddress = userWalletAddress || 'demo_wallet_address';
    try {
      const ad = await billboardAdService.getBillboardAdForUser(walletAddress);
      setBillboardAd(ad);
    } catch (error) {
      console.error('Failed to reload billboard ad:', error);
    }
  }, [refreshFeed, user?.primary_wallet_address, user?.primaryWalletAddress, user?.walletAddress, newPostCount, pollingPosts, shouldPollForFeed, clearPollingPosts, markAsViewed]);

  // Enhanced refresh with haptic feedback - AFTER handleRefresh is defined
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing);
  }, [refreshing, handleRefreshStateChange]);

  const handleLoadMore = useCallback(async () => {
    console.log('🔍 FeedHomeScreen.handleLoadMore: Called with state:', { hasMore, loading, postsLength: posts.length, refreshing });
    
    // Only load more if we have more posts available and we're not already loading/refreshing
    if (hasMore && !loading && !refreshing && posts.length > 0) {
      console.log('🔍 FeedHomeScreen.handleLoadMore: Loading more posts...');
      try {
        await loadMorePosts();
        console.log('🔍 FeedHomeScreen.handleLoadMore: Load more completed successfully');
      } catch (error) {
        console.error('🔍 FeedHomeScreen.handleLoadMore: Error loading more posts:', error);
      }
    } else {
      console.log('🔍 FeedHomeScreen.handleLoadMore: Skipped - hasMore:', hasMore, 'loading:', loading, 'refreshing:', refreshing, 'postsLength:', posts.length);
    }
  }, [hasMore, loading, refreshing, loadMorePosts, posts.length]);

  const handlePostPress = useCallback(
    (post: Post) => {
      // ENGAGEMENT TRACKING: Add postExpansion=true for analytics
      console.log('📊 FeedHomeScreen: Tracking post expansion for engagement metrics');
      
      // Check if this is a thread root post and route appropriately
      if (post.threadData || post.isThreadRoot || post.threadPostCount > 0) {
        console.log('🧵 FeedHomeScreen.handlePostPress: Navigating to thread details for post:', {
          postId: post.id,
          hasThreadData: !!post.threadData,
          isThreadRoot: post.isThreadRoot,
          threadPostCount: post.threadPostCount
        });
        navigation.navigate('ThreadDetails', {
          threadId: post.signature || post.transactionHash || post.id?.toString(),
          post: post,
          postExpansion: true // Track expansion for analytics
        });
      } else {
        console.log('📄 FeedHomeScreen.handlePostPress: Navigating to post details for regular post:', post.id);
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
      console.log('🔍 FeedHomeScreen.handleUserPress: ===== USER PRESS DEBUG =====');
      console.log('🔍 FeedHomeScreen.handleUserPress: Called with userId, walletAddress, and postSignature:', {userId, walletAddress, postSignature});
      console.log('🔍 FeedHomeScreen.handleUserPress: walletAddress type:', typeof walletAddress);
      console.log('🔍 FeedHomeScreen.handleUserPress: walletAddress length:', walletAddress?.length);
      console.log('🔍 FeedHomeScreen.handleUserPress: walletAddress trimmed:', walletAddress?.trim());
      
      // ENGAGEMENT TRACKING: Include profileVisitFrom for analytics
      console.log('📊 FeedHomeScreen: Tracking profile visit from post:', postSignature);
      
      // Use wallet-based navigation (userId endpoint not available) with debouncing
      if (walletAddress && walletAddress.trim()) {
        console.log('🔍 FeedHomeScreen.handleUserPress: Navigating to Profile with walletAddress:', walletAddress);
        console.log('🔍 FeedHomeScreen.handleUserPress: Navigation params:', {walletAddress, profileVisitFrom: postSignature});
        const success = debouncedNavigate(navigation, 'Profile', {
          walletAddress,
          profileVisitFrom: postSignature // Track where the visit came from
        });
        console.log('🔍 FeedHomeScreen.handleUserPress: Navigation call completed, success:', success);
      } else {
        console.error('🚨 FeedHomeScreen.handleUserPress: No valid walletAddress provided:', {userId, walletAddress});
      }
    },
    [navigation],
  );

  const handleCreatePost = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

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
      // Navigate to thread details page per FEED_INTEGRATION_GUIDE.md
      navigation.navigate('ThreadDetails', {
        threadId: post.signature || post.transactionHash || post.id?.toString(),
        post: post
      });
    },
    [navigation],
  );

  const handleQuotedPostPress = useCallback(
    (quotedPost: any) => {
      // Navigate to the quoted post's detail screen
      navigation.navigate('PostDetail', {
        postId: quotedPost.postSignature,
        post: null // Let it fetch the full post data
      });
    },
    [navigation],
  );

  const handleSidebarNavigate = useCallback(
    (screen: string, params?: any) => {
      console.log('🔍 FeedHomeScreen.handleSidebarNavigate: Called with:', { screen, params });
      
      setSidebarVisible(false); // Close sidebar first
      
      // Check if screen exists in Feed stack
      const feedStackScreens = [
        'Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
        'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
        'Posts', 'Receipts', 'Watchlist', 'Tokens', 'Points', 'Business', 'HelpCenter'
      ];
      
      if (feedStackScreens.includes(screen)) {
        // Screen exists in Feed stack, navigate directly
        console.log('🔍 FeedHomeScreen: Navigating to feedStackScreen:', screen, 'with params:', params);
        navigation.navigate(screen as any, params);
      } else if (screen === 'Profile') {
        // Profile exists in Feed stack too
        console.log('🔍 FeedHomeScreen: Navigating to Profile with params:', JSON.stringify(params, null, 2));
        console.log('🔍 FeedHomeScreen: Current user data:', JSON.stringify(user, null, 2));
        console.log('🔍 FeedHomeScreen: Navigation object type:', typeof navigation);
        console.log('🔍 FeedHomeScreen: Navigation methods:', Object.getOwnPropertyNames(navigation));
        console.log('🔍 FeedHomeScreen: Navigation state:', navigation.getState?.());
        
        // Check if Profile screen exists in current navigator
        try {
          const state = navigation.getState();
          console.log('🔍 FeedHomeScreen: Navigator routes:', state?.routes?.map(r => r.name));
        } catch (e) {
          console.log('🔍 FeedHomeScreen: Could not get navigation state:', e.message);
        }
        
        try {
          const startTime = Date.now();
          console.log('🔍 FeedHomeScreen: About to call debouncedNavigate...');
          const success = debouncedNavigate(navigation, 'Profile', params);
          const endTime = Date.now();
          console.log(`🔍 FeedHomeScreen: Profile navigation call completed in ${endTime - startTime}ms, success: ${success}`);
        } catch (error) {
          console.error('🚨 FeedHomeScreen: Profile navigation failed:', error);
          console.error('🚨 FeedHomeScreen: Error stack:', error.stack);
        }
      } else {
        // For other screens, this will be handled in their respective tabs
        console.log('🚨 Screen not found in Feed stack:', screen);
      }
    },
    [navigation, user],
  );

  const renderFeedItem = useCallback(
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

  const renderEmpty = () => {
    const getEmptyStateContent = () => {
      switch (currentFeedType) {
        case 'watchlist':
          return {
            title: "You haven't added any users to your watchlist",
            subtitle: "Follow users to see their posts in your watchlist feed.",
            buttonText: "Discover Users",
            onButtonPress: () => navigation.navigate('Search'),
          };
        case 'recent':
          return {
            title: "No recent posts",
            subtitle: "Be the first to share something with the community.",
            buttonText: "Create First Post",
            onButtonPress: handleCreatePost,
          };
        default: // 'for-you'
          return {
            title: "No posts yet!",
            subtitle: "Be the first to share something with the community.",
            buttonText: "Create First Post", 
            onButtonPress: handleCreatePost,
          };
      }
    };

    const emptyContent = getEmptyStateContent();

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateContent}>
          <Text style={styles.emptyStateTitle}>{emptyContent.title}</Text>
          <Text style={styles.emptyStateSubtitle}>
            {emptyContent.subtitle}
          </Text>
          <Button
            onPress={emptyContent.onButtonPress}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              paddingHorizontal: 32,
            }}>
            {emptyContent.buttonText}
          </Button>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    console.log('🔍 FeedHomeScreen.renderFooter: State check:', { hasMore, postsLength: posts.length, loading });
    
    // Don't show "You've reached the end!" if there are no posts (empty state is shown instead)  
    if (!hasMore && posts.length > 0) {
      return (
        <View style={{paddingVertical: 16, alignItems: 'center'}}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 14,
              fontFamily: 'Inter-Regular',
            }}>
            You've reached the end!
          </Text>
        </View>
      );
    }

    if (loading && posts.length > 0) {
      return (
        <InlineLoader title="Loading more posts..." />
      );
    }

    // Add some padding when there are posts but not loading/at end - helps with scroll detection
    if (posts.length > 0 && hasMore) {
      return <View style={{height: 50}} />;
    }

    return null;
  };

  const renderHeader = () => (
    <>
      <AppNavBar
        title="Feed"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={handleCreatePost}
      />

      <View style={styles.segmentedRow}>
        <SegmentedControl
          segments={feedTypes}
          selectedIndex={selectedFeedType}
          onSelectionChange={(index) => {
            // IMMEDIATE VISUAL UPDATE - No delays, no conditions
            setSelectedFeedType(index);
            Vibration.vibrate(10);
            
            // Background data updates - completely separate from UI
            const newFeedType = feedTypeMap[index as keyof typeof feedTypeMap];
            if (currentFeedType !== newFeedType) {
              // Clear polling state immediately (non-blocking)
              clearPollingPosts();
              markAsViewed();
              
              // Scroll to top (non-blocking)
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              
              // Update store data asynchronously (non-blocking)
              setTimeout(() => setFeedType(newFeedType), 0);
            }
          }}
        />
      </View>
    </>
  );

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? 'light-content' : 'dark-content'}
          translucent={false}
        />
        <AppNavBar
          title="Feed"
          onProfilePress={() => setSidebarVisible(true)}
          onNewPostPress={handleCreatePost}
        />

        <EnhancedErrorState
          title={isOnline ? "Can't load feed" : "You're offline"}
          subtitle={
            isOnline
              ? 'Check your connection and try again'
              : 'Showing cached posts. Connect to internet to refresh.'
          }
          onRetry={isOnline ? () => loadFeed(true) : undefined}
          retryLabel="Try Again"
          retrying={loading}
        />

        <SidebarMenu
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onNavigate={handleSidebarNavigate}
        />
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      <AppNavBar
        title="Feed"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={handleCreatePost}
      />

      <View style={styles.segmentedRow}>
        <SegmentedControl
          segments={feedTypes}
          selectedIndex={selectedFeedType}
          onSelectionChange={(index) => {
            // IMMEDIATE VISUAL UPDATE - No delays, no conditions
            setSelectedFeedType(index);
            Vibration.vibrate(10);
            
            // Background data updates - completely separate from UI
            const newFeedType = feedTypeMap[index as keyof typeof feedTypeMap];
            if (currentFeedType !== newFeedType) {
              // Clear polling state immediately (non-blocking)
              clearPollingPosts();
              markAsViewed();
              
              // Scroll to top (non-blocking)
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              
              // Update store data asynchronously (non-blocking)
              setTimeout(() => setFeedType(newFeedType), 0);
            }
          }}
        />
      </View>

      {/* New posts notification banner - only show for feeds with polling */}
      {newPostCount > 0 && shouldPollForFeed && (
        <StyledLoadMoreIndicator
          onPress={() => {
            // Add new posts to the main feed
            if (pollingPosts.length > 0) {
              useSocialStore.getState().addNewPosts(pollingPosts);
              
              // Clear polling posts to avoid duplication
              clearPollingPosts();
            } else {
              // If no polling posts, just refresh the feed
              refreshFeed();
            }
            
            // Mark as viewed to hide the banner
            markAsViewed();
            
            // Smooth scroll to top to show new posts
            flatListRef.current?.scrollToOffset({offset: 0, animated: true});
          }}
          pendingPosts={(() => {
            // First try to get posts with profile pictures
            const postsWithImages = pollingPosts.filter(post => {
              const profilePicture = post.user?.profilePicture || post.user?.avatar_url;
              return profilePicture && profilePicture.trim() !== '';
            });
            
            // If none have images, use all posts
            const postsToShow = postsWithImages.length > 0 ? postsWithImages : pollingPosts;
            
            return postsToShow.map(post => ({
              id: post.id,
              user: {
                walletAddress: post.userWallet || post.user?.walletAddress,
                display_name: post.user?.display_name || post.user?.name,
                name: post.user?.name,
                profilePicture: post.user?.profilePicture,
                avatar_url: post.user?.avatar_url,
                is_verified: post.user?.is_verified || post.user?.isVerified,
              }
            }));
          })()}
          isLoading={false}
        />
      )}

      <View style={[styles.offlineOverlay, {position: 'relative'}]}>
        <FlatList
          ref={flatListRef}
          data={[
            ...(currentFeedType === 'for-you' && !adLoading && billboardAd ? [{ type: 'ad', data: billboardAd }] : []),
            ...(Array.isArray(displayPosts) ? displayPosts.map(item => ({ type: 'post', data: item })) : [])
          ]}
          keyExtractor={(item, index) => {
            if (item.type === 'ad') {
              return `ad-${item.data?.id || 'house-ad'}`;
            }
            // Use index as primary unique identifier, post ID as secondary
            return `post-${index}-${item.data.id || 'unknown'}`;
          }}
          renderItem={({ item }) => {
            if (item.type === 'ad') {
              return (
                <BillboardAd
                  ad={item.data}
                  onClaim={handleAdClaim}
                  onBrandPress={handleBrandPress}
                  onHashtagPress={handleHashtagPress}
                  onBusinessPress={() => navigation.navigate('Business')}
                />
              );
            }
            return renderFeedItem({ item: item.data });
          }}
          contentContainerStyle={displayPosts.length === 0 && !loading ? {flex: 1} : {flexGrow: 1}}
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
            console.log('🔍 FeedHomeScreen.FlatList.onEndReached: Triggered with info:', info);
            console.log('🔍 FeedHomeScreen.FlatList.onEndReached: Current state:', { hasMore, loading, postsCount: displayPosts.length, isOnline });
            // Always try to load more, let the handleLoadMore function decide if it should proceed
            handleLoadMore();
          }}
          onEndReachedThreshold={0.8}
          ListEmptyComponent={
            displayPosts.length === 0 && !loading && !(billboardAd && currentFeedType === 'for-you') 
              ? renderEmpty 
              : displayPosts.length === 0 && loading 
                ? <FeedSkeleton itemCount={6} showImages={true} />
                : null
          }
          ListFooterComponent={(() => {
            console.log('🔍 FeedHomeScreen.ListFooterComponent: State check:', { hasMore, postsLength: posts.length, loading });
            
            // Show loading indicator when loading more posts
            if (loading && hasMore && posts.length > 0) {
              return (
                <View style={{
                  paddingTop: 24,
                  paddingBottom: 240, // Increased bottom padding to ensure visibility above nav bar
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  backgroundColor: colors.background, // Add background to ensure visibility
                }}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 15,
                      fontWeight: '500',
                      fontFamily: 'Inter-Medium',
                      textAlign: 'center',
                    }}>
                    Loading more posts...
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 13,
                      fontFamily: 'Inter-Regular',
                      textAlign: 'center',
                      marginTop: 4,
                    }}>
                    Fetching latest content
                  </Text>
                </View>
              );
            }
            
            // Add bottom margin even when not loading to prevent content from hiding behind nav
            if (posts.length > 0) {
              const endContent = !hasMore ? (
                <View style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  shadowColor: colors.foreground,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 14,
                      fontFamily: 'Inter-Regular',
                      textAlign: 'center',
                    }}>
                    You've reached the end!
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 12,
                      fontFamily: 'Inter-Regular',
                      textAlign: 'center',
                      marginTop: 4,
                      opacity: 0.7,
                    }}>
                    Pull to refresh for new posts
                  </Text>
                </View>
              ) : null;
              
              return (
                <View style={{
                  paddingTop: 20,
                  paddingBottom: 240, // Increased bottom padding to ensure visibility above nav bar
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  backgroundColor: colors.background,
                }}>
                  {endContent}
                </View>
              );
            }
            
            return null;
          })()}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
          getItemLayout={(data, index) => ({
            length: 400, // Estimated item height
            offset: 400 * index,
            index,
          })}
        />
      </View>

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />

      {/* Offline/Online Toast */}
      <Toast
        message="You're back online! Feed refreshed."
        type="success"
        visible={showOfflineToast}
        onHide={() => setShowOfflineToast(false)}
      />
    </SafeAreaView>
  );
}
