import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  RefreshControl,
  Vibration,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Search, TrendingUp, Hash, X, Plus, User, FileText} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {StatusDot} from '../../components/ui/StatusDot';
import {PostCard} from '../../components/social/PostCard';
import {ErrorState} from '../../components/ui/ErrorState';
import {SegmentedControl} from '../../components/ui/SegmentedControl';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useWalletStore} from '../../store/wallet';
import {useSocialStore} from '../../store/socialStore';
import {discoveryAPI} from '../../services/api/discovery';
import {TrendingTopic} from '../../types/discovery';
import {Post} from '../../types/social';
import {getAvatarFallback} from '../../lib/utils';

interface SearchScreenProps {
  navigation: any;
}

export default function SearchScreen({navigation}: SearchScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {connected} = useWalletStore();
  const socialStoreData = useSocialStore();
  const trendingPosts = socialStoreData?.posts || [];
  const loadFeed = socialStoreData?.loadFeed;
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{users: any[], posts: any[], hashtags: any[]}>({users: [], posts: [], hashtags: []});
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Trending posts tabs state
  const [selectedTrendingTab, setSelectedTrendingTab] = useState(0);
  const trendingTabs = ['Trending', 'Controversial', 'Tokens'];
  const trendingTabMap = {
    0: { timeRange: 'day', sortBy: 'trending' },      // Trending (24h)
    1: { timeRange: 'day', sortBy: 'controversial' }, // Controversial (posts with high engagement but mixed votes)
    2: { timeRange: 'day', sortBy: 'tokens' },        // Tokens (coming soon)
  };
  
  // Debounce timer ref
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load trending content on mount
  useEffect(() => {
    loadTrendingContent();
  }, []);

  const loadTrendingContent = async (tabIndex?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load trending topics (only for the first tab)
      if (!tabIndex || tabIndex === 0) {
        const topics = await discoveryAPI.getTrendingTopics();
        setTrendingTopics(topics);
      }
      
      // Load trending posts based on selected tab
      if (loadFeed) {
        try {
          const currentTabIndex = tabIndex !== undefined ? tabIndex : selectedTrendingTab;
          const tabConfig = trendingTabMap[currentTabIndex as keyof typeof trendingTabMap];
          
          if (tabConfig.sortBy === 'tokens') {
            // For "Tokens" tab, don't load any posts (coming soon)
            return;
          } else if (tabConfig.sortBy === 'controversial') {
            // For "Controversial" tab, use controversial feed endpoint
            await loadFeed(true, 'controversial', tabConfig.timeRange as 'hour' | 'day' | 'week');
          } else {
            // For "Trending" tab, use trending with time range
            await loadFeed(true, 'trending', tabConfig.timeRange as 'hour' | 'day' | 'week');
          }
        } catch (feedError) {
          console.error('Failed to load feed:', feedError);
          // Continue execution even if feed fails
        }
      }
      
    } catch (err) {
      console.error('Failed to load trending content:', err);
      setError('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    // Clear results if query is empty or too short
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults({users: [], posts: [], hashtags: []});
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      
      const results = await discoveryAPI.search(query.trim(), {
        timeRange: 'all',
        verificationLevel: 'all',
      });
      
      console.log('🔍 Search API response structure:', {
        query: query.trim(),
        hasPostsResults: !!results.posts?.results,
        hasPostsArray: Array.isArray(results.posts),
        postsResultsLength: results.posts?.results?.length,
        postsArrayLength: Array.isArray(results.posts) ? results.posts.length : 'not array',
        samplePost: results.posts?.results?.[0] || results.posts?.[0]
      });

      // Check if posts are already transformed or need transformation
      let transformedResults;
      
      if (results.posts?.results) {
        // New API format with nested structure
        transformedResults = {
          ...results,
          posts: results.posts.results.map((item: any) => {
            const post = item.post;
            const metadata = item.metadata;
            
            return {
              // Core post fields
              id: post.id,
              signature: post.postSignature,
              message: post.postMessage,
              createdAt: metadata?.createdAt || post.processedAt || post.updatedAt,
              
              // User information
              user: {
                name: post.displayName || '',
                displayName: post.displayName || post.userSnsDomain || '',
                profilePicture: post.userProfileImageUri || '',
                isVerified: post.userIsVerifiedSns || post.userIsVerifiedNft || false,
                walletAddress: post.postUser,
              },
              userWallet: post.postUser,
              
              // Engagement metrics
              upvoteCount: post.userUpvotesReceived || 0,
              downvoteCount: post.userDownvotesReceived || 0,
              replyCount: metadata?.replyCount || 0,
              quoteCount: 0,
              viewCount: 0,
              receiptsCount: 0,
              
              // Thread and quote info
              isThread: post.postIsThread || false,
              threadPostCount: metadata?.replyCount || 0,
              quotedPost: post.postQuotedPost ? {
                signature: post.postQuotedPost,
                message: '',
              } : null,
              
              // Media info
              hasMedia: metadata?.hasMedia || false,
              mediaCount: metadata?.mediaCount || 0,
              mediaUrls: [],
              
              // Additional metadata
              slot: post.postSlot,
              epoch: post.postEpoch,
              transactionHash: post.postSignature,
              isPinned: false,
              
              // Reputation and verification
              reputation: post.userReputation || 0,
              score: item.score || metadata?.voteScore || 0,
              
              // Search-specific
              highlights: item.highlights,
              matchedFields: item.matchedFields || [],
            };
          })
        };
      } else if (Array.isArray(results.posts)) {
        // Posts are in flat array format - need to transform them too
        transformedResults = {
          ...results,
          posts: results.posts.map((post: any) => {
            return {
              // Core post fields
              id: post.id,
              signature: post.signature || post.transaction_hash,
              message: post.message,
              createdAt: post.createdAt || post.created_at,
              
              // User information - fix profile picture mapping
              user: {
                name: post.user?.display_name || post.user?.username || '',
                displayName: post.user?.display_name || post.user?.username || '',
                profilePicture: post.user?.avatar_url || post.profileImageUrl || '',
                isVerified: post.user?.is_verified || post.is_profile_verified || false,
                walletAddress: post.user?.wallet_address || post.userWallet || '',
              },
              userWallet: post.user?.wallet_address || post.userWallet || '',
              
              // Engagement metrics
              upvoteCount: post.upvoteCount || 0,
              downvoteCount: post.downvoteCount || 0,
              replyCount: post.replyCount || 0,  
              quoteCount: post.quoteCount || 0,
              viewCount: post.viewCount || 0,
              receiptsCount: post.receiptsCount || 0,
              
              // Thread and quote info
              isThread: post.is_thread || post.isThread || false,
              threadPostCount: post.replyCount || 0,
              quotedPost: post.quoted_post || post.quotedPost,
              
              // Media info
              hasMedia: post.images?.length > 0 || !!post.video,
              mediaCount: (post.images?.length || 0) + (post.video ? 1 : 0),
              mediaUrls: post.images || [],
              video: post.video,
              
              // Additional metadata
              slot: post.slot || 0,
              epoch: post.epoch || 0,
              transactionHash: post.signature || post.transaction_hash,
              isPinned: post.is_pinned || post.isPinned || false,
              
              // Reputation and verification
              reputation: post.user?.reputation_score || 0,
              score: post.score || 0,
              
              // Preserve any other fields
              ...post
            };
          })
        };
      } else {
        // Fallback - use results as-is
        transformedResults = results;
      }

      console.log('🔍 Final transformed results:', {
        transformedPostsLength: transformedResults.posts?.length || 0,
        sampleTransformed: transformedResults.posts?.[0]
      });
      
      setSearchResults(transformedResults);
      
      // Report search for analytics (don't let this fail the search)
      try {
        await discoveryAPI.reportSearch(query.trim());
      } catch (analyticsError) {
        console.warn('Search analytics failed:', analyticsError.message);
      }
      
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrendingContent();
    setRefreshing(false);
  }, []);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading);
  }, [refreshing, loading, handleRefreshStateChange]);

  const handleTrendingTabChange = (tabIndex: number) => {
    // Haptic feedback for tab selection
    Vibration.vibrate(10);
    
    // Update UI immediately for instant visual feedback
    setSelectedTrendingTab(tabIndex);
    
    // Load content asynchronously to not block UI
    setTimeout(() => {
      loadTrendingContent(tabIndex);
    }, 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({users: [], posts: [], hashtags: []});
    setIsSearching(false);
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Debounced search handler
  const handleSearchDebounced = useCallback((query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300); // 300ms delay
  }, []);

  const handlePostPress = useCallback(
    (post: Post) => {
      // ENGAGEMENT TRACKING: Add postExpansion=true for analytics
      console.log('📊 SearchScreen: Tracking post expansion for engagement metrics');
      
      // Check if this is a thread root post and route appropriately
      if (post.threadData || post.isThreadRoot || post.threadPostCount > 0) {
        console.log('🧵 SearchScreen.handlePostPress: Navigating to thread details for post:', post.id);
        navigation.navigate('ThreadDetails', {
          threadId: post.signature || post.transactionHash || post.id?.toString(),
          post: post,
          postExpansion: true // Track expansion for analytics
        });
      } else {
        console.log('📄 SearchScreen.handlePostPress: Navigating to post details for regular post:', post.id);
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
      console.log('📊 SearchScreen: Tracking profile visit from post:', postSignature);
      
      navigation.navigate('Profile', {
        walletAddress,
        profileVisitFrom: postSignature // Track where the visit came from
      });
    },
    [navigation],
  );

  const handleHashtagPress = useCallback(
    (hashtag: string) => {
      // Search for posts with this hashtag
      setSearchQuery(hashtag);
      handleSearchDebounced(hashtag);
    },
    [handleSearchDebounced],
  );

  const handleQuotePress = useCallback(
    (post: Post) => {
      navigation.navigate('CreatePost', {quotedPost: post});
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
        postId: quotedPost.postSignature || quotedPost.signature,
        post: null
      });
    },
    [navigation],
  );

  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false); // Close sidebar first
    
    // Screens that exist in Feed tab
    const feedTabScreens = [
      'Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
      'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
      'Posts', 'Receipts', 'Watchlist', 'Points', 'Business', 'HelpCenter'
    ];
    
    if (feedTabScreens.includes(screen)) {
      // Navigate to Feed tab first, then to the specific screen
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Feed', {
          screen: screen,
          params: params
        });
      }
    } else if (screen === 'Profile') {
      navigation.navigate('Profile', params);
    } else {
      console.log(`Navigate to ${screen}`, params);
    }
  }, [navigation]);

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
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarButton: {
      position: 'relative',
    },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerSide: {
      flex: 1,
      flexDirection: 'row',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerSideRight: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
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
    searchContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    content: {
      flex: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionIcon: {
      marginRight: 8,
    },
    trendingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cleanTabs: {
      flexDirection: 'row',
      flex: 1,
      marginLeft: 12,
    },
    cleanTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    cleanTabActive: {
      backgroundColor: colors.muted,
    },
    cleanTabText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
    },
    cleanTabTextActive: {
      color: colors.foreground,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    comingSoonContainer: {
      paddingVertical: 40,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    comingSoonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    comingSoonSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    trendingTopicsContainer: {
      paddingVertical: 8,
    },
    trendingTopic: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    trendingTopicIcon: {
      marginRight: 12,
    },
    trendingTopicInfo: {
      flex: 1,
    },
    trendingTopicName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    trendingTopicStats: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    postsContainer: {
      paddingTop: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 16,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 16,
    },
    sectionContainer: {
      marginBottom: 16,
    },
    userResult: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    userBio: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    userStats: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    hashtagResult: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    hashtagIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    hashtagInfo: {
      flex: 1,
    },
    hashtagTag: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    hashtagStats: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    trendingLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 8,
    },
    viewAllButton: {
      marginLeft: 'auto',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary + '15',
      borderRadius: 6,
    },
    viewAllText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    showMoreButton: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    showMoreText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });

  if (error && !(trendingTopics?.length) && !(trendingPosts?.length)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppNavBar
          title="Search"
          onProfilePress={() => setSidebarVisible(true)}
          onNewPostPress={() => navigation.navigate('CreatePost')}
        />

        <ErrorState
          title="Can't load search"
          subtitle="Check your connection and try again"
          onRetry={loadTrendingContent}
          retryText="Retry"
          loading={loading}
        />

        <SidebarMenu
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onNavigate={handleSidebarNavigate}
        />
      </SafeAreaView>
    );
  }

  const renderPost = ({item}: {item: Post}) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item)}
      onUserPress={handleUserPress}
      onQuotePress={handleQuotePost}
      onThreadPress={handleThreadPress}
      onQuotedPostPress={handleQuotedPostPress}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Search"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, users, and topics..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearchDebounced(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <Pressable style={styles.clearButton} onPress={clearSearch}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={enhancedOnRefresh}
            tintColor={colors.primary} // iOS spinner color
            colors={[colors.primary, colors.secondary]} // Android spinner colors  
            progressBackgroundColor={colors.card} // Android background
            progressViewOffset={0} // Normal positioning
            size="default"
            title="Pull to refresh" // iOS title
            titleColor={colors.mutedForeground} // iOS title color
          />
        }>
        
        {/* Show search results if searching */}
        {isSearching && (
          <View style={styles.emptyState}>
            <Search size={32} color={colors.mutedForeground} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Show search results */}
        {searchQuery.length > 0 && !isSearching && (
          searchResults.users.length > 0 || searchResults.posts.length > 0 || searchResults.hashtags.length > 0
        ) && (
          <View style={styles.postsContainer}>
            {/* Users Results */}
            {searchResults.users.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <User size={20} color={colors.foreground} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Users ({searchResults.users.length})</Text>
                </View>
                {searchResults.users.slice(0, 3).map((user: any, index: number) => (
                  <Pressable
                    key={`user-${user.id || index}`}
                    style={styles.userResult}
                    onPress={() => handleUserPress(user.walletAddress)}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      fallback={getAvatarFallback(user)}
                      size="md"
                      showRing={user.isVerified}
                      ringColor={colors.success}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.displayName}</Text>
                      <Text style={styles.userBio} numberOfLines={1}>
                        {user.bio || `${user.walletAddress?.slice(0, 8)}...`}
                      </Text>
                      {user.followerCount && (
                        <Text style={styles.userStats}>
                          {user.followerCount} followers • {user.postCount || 0} posts
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Posts Results */}
            {searchResults.posts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <FileText size={20} color={colors.foreground} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Posts ({searchResults.posts.length})</Text>
                  {searchResults.posts.length > 5 && (
                    <Pressable
                      style={styles.viewAllButton}
                      onPress={() => navigation.navigate('SearchResults', { query: searchQuery })}
                    >
                      <Text style={styles.viewAllText}>View All</Text>
                    </Pressable>
                  )}
                </View>
                {searchResults.posts.slice(0, 5).map((post: any, index: number) => (
                  <PostCard
                    key={`post-${post.signature || index}`}
                    post={post}
                    onPress={() => handlePostPress(post)}
                    onUserPress={handleUserPress}
                    onHashtagPress={handleHashtagPress}
                    onQuotePress={handleQuotePress}
                    onThreadPress={(post) => {
                      // Navigate to thread details for thread posts
                      navigation.navigate('ThreadDetails', {
                        threadId: post.signature || post.transactionHash || post.id?.toString(),
                        post: post
                      });
                    }}
                    onQuotedPostPress={(quotedPost) => {
                      // Navigate to the quoted post's detail screen
                      navigation.navigate('PostDetail', {
                        postId: quotedPost.signature || quotedPost.postSignature,
                        post: null // Let it fetch the full post data
                      });
                    }}
                  />
                ))}
                {searchResults.posts.length > 5 && (
                  <Pressable
                    style={styles.showMoreButton}
                    onPress={() => navigation.navigate('SearchResults', { query: searchQuery })}
                  >
                    <Text style={styles.showMoreText}>
                      Show all {searchResults.posts.length} results
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Hashtags Results */}
            {searchResults.hashtags.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Hash size={20} color={colors.foreground} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Hashtags ({searchResults.hashtags.length})</Text>
                </View>
                {searchResults.hashtags.slice(0, 5).map((hashtag: any, index: number) => (
                  <Pressable
                    key={`hashtag-${hashtag.tag || index}`}
                    style={styles.hashtagResult}
                    onPress={() => handleHashtagPress(hashtag.tag)}
                  >
                    <View style={styles.hashtagIcon}>
                      <Hash size={16} color={colors.primary} />
                    </View>
                    <View style={styles.hashtagInfo}>
                      <Text style={styles.hashtagTag}>{hashtag.tag}</Text>
                      <Text style={styles.hashtagStats}>
                        {hashtag.postCount || 0} posts
                        {hashtag.trending && (
                          <Text style={styles.trendingLabel}> • Trending</Text>
                        )}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Show empty search state */}
        {searchQuery.length > 0 && !isSearching && (
          searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.hashtags.length === 0
        ) && (
          <View style={styles.emptyState}>
            <Search size={32} color={colors.mutedForeground} />
            <Text style={styles.emptyStateText}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try searching for users, posts, or hashtags
            </Text>
          </View>
        )}

        {/* Show trending content when not searching */}
        {searchQuery.length === 0 && (
          <>
            {/* Trending Topics */}
            {(trendingTopics?.length || 0) > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={20} color={colors.foreground} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Trending Topics</Text>
                </View>
                <View style={styles.trendingTopicsContainer}>
                  {(trendingTopics || []).slice(0, 5).map((topic, index) => (
                    topic ? (
                      <Pressable key={`topic-${topic.id || index}-${index}`} style={styles.trendingTopic}>
                        <Hash size={16} color={colors.primary} style={styles.trendingTopicIcon} />
                        <View style={styles.trendingTopicInfo}>
                          <Text style={styles.trendingTopicName}>{topic.name || 'Unknown'}</Text>
                          <Text style={styles.trendingTopicStats}>
                            {topic.postCount || 0} posts • {topic.participantCount || 0} participants
                          </Text>
                        </View>
                      </Pressable>
                    ) : null
                  ))}
                </View>
              </View>
            )}

            {/* Trending Posts with Tabs */}
            {(trendingPosts?.length || 0) > 0 && (
              <View>
                <View style={styles.trendingHeader}>
                  <TrendingUp size={18} color={colors.foreground} style={styles.sectionIcon} />
                  <View style={styles.cleanTabs}>
                    {trendingTabs.map((tab, index) => (
                      <Pressable
                        key={tab}
                        style={[
                          styles.cleanTab,
                          index === selectedTrendingTab && styles.cleanTabActive
                        ]}
                        onPress={() => handleTrendingTabChange(index)}
                      >
                        <Text style={[
                          styles.cleanTabText,
                          index === selectedTrendingTab && styles.cleanTabTextActive
                        ]}>
                          {tab}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.postsContainer}>
                  {selectedTrendingTab === 2 ? (
                    // Tokens tab - coming soon message
                    <View style={styles.comingSoonContainer}>
                      <Text style={styles.comingSoonTitle}>Tokens Coming Soon</Text>
                      <Text style={styles.comingSoonSubtitle}>
                        Token-related posts and discussions will appear here.
                      </Text>
                    </View>
                  ) : (
                    // Trending and Controversial tabs - show posts
                    (trendingPosts || []).slice(0, 10).map((post, index) => (
                      post ? (
                        <PostCard
                          key={`post-${post.id || index}-${index}`}
                          post={post}
                          onPress={() => handlePostPress(post)}
                          onUserPress={handleUserPress}
                          onQuotePress={handleQuotePost}
                          onThreadPress={handleThreadPress}
                          onQuotedPostPress={handleQuotedPostPress}
                          feedContext={selectedTrendingTab === 0 ? 'trending' : selectedTrendingTab === 1 ? 'controversial' : 'default'}
                        />
                      ) : null
                    ))
                  )}
                </View>
              </View>
            )}

            {/* Empty state when no trending content */}
            {(trendingTopics?.length || 0) === 0 && (trendingPosts?.length || 0) === 0 && !loading && (
              <View style={styles.emptyState}>
                <TrendingUp size={32} color={colors.mutedForeground} />
                <Text style={styles.emptyStateText}>
                  No trending content available right now.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}