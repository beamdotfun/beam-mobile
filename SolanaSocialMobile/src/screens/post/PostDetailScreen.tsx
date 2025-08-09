import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Plus,
  Eye,
  MessageCircle,
  Quote,
  Bookmark,
  BookmarkCheck,
  Share,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Zap,
  ChartBar,
  Receipt,
  UserCheck,
  Expand,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {PostCard} from '../../components/social/PostCard';
import {StatusDot} from '../../components/ui/StatusDot';
import {getAvatarFallback} from '../../lib/utils';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {useThemeStore} from '../../store/themeStore';
import {useSocialStore} from '../../store/socialStore';
import {socialAPI} from '../../services/api/social';
import {useAuthStore} from '../../store/auth';
import {useWalletStore} from '../../store/wallet';
import {Post} from '../../types/social';
import {transformProcessedPost} from '../../utils/postTransform';
import {LoadingOverlay} from '../../components/ui/LoadingOverlay';
import {SkeletonCard} from '../../components/ui/Skeleton';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {format} from 'date-fns';
import {AppNavBar} from '../../components/navigation/AppNavBar';

interface PostDetailScreenProps {
  navigation: any;
  route: {
    params: {
      postId: string | number;
      post?: Post;
      postExpansion?: boolean; // Track if this is a post expansion for analytics
    };
  };
}

export default function PostDetailScreen({navigation, route}: PostDetailScreenProps) {
  const {colors} = useThemeStore();
  const {posts, startReputationPolling, stopReputationPolling, checkBatchReceiptStatus} = useSocialStore();
  const {user} = useAuthStore();
  const {connected} = useWalletStore();
  const [post, setPost] = useState<Post | null>(route.params?.post || null);
  const [quotePosts, setQuotePosts] = useState<Post[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [loading, setLoading] = useState(!post);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const postId = route.params.postId;

  useEffect(() => {
    loadPostDetails();
  }, [postId]);

  // Start reputation polling and check receipt status when post and quotes are loaded
  useEffect(() => {
    const allPosts = [post, ...quotePosts].filter(Boolean);
    if (allPosts.length > 0) {
      console.log('🔄 PostDetailScreen: Starting reputation polling for', allPosts.length, 'posts');
      startReputationPolling();
      
      console.log('🔖 PostDetailScreen: Triggering batch receipt status check for', allPosts.length, 'posts');
      checkBatchReceiptStatus();
      
      return () => {
        console.log('🔄 PostDetailScreen: Stopping reputation polling');
        stopReputationPolling();
      };
    }
  }, [post, quotePosts, startReputationPolling, stopReputationPolling, checkBatchReceiptStatus]);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      stopReputationPolling();
    };
  }, [stopReputationPolling]);

  const loadPostDetails = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (!post) setLoading(true);

    try {
      let postData = post;

      // If we don't have the post, try to find it in the store first
      if (!postData) {
        const foundPost = posts.find(p => 
          (p.transaction_hash || p.signature || p.id)?.toString() === postId.toString()
        );
        if (foundPost) {
          postData = foundPost;
          setPost(foundPost);
          setIsBookmarked(foundPost.user_bookmarked || foundPost.userBookmarked || false);
        }
      }

      // If still no post, fetch from API using new processed_posts structure
      if (!postData || refresh) {
        console.log('🔍 PostDetailScreen: Fetching individual post from API:', postId);
        
        // ENGAGEMENT TRACKING: Include postExpansion parameter if this is a user expansion
        const isPostExpansion = route.params?.postExpansion === true;
        console.log('📊 PostDetailScreen: Post expansion tracking:', isPostExpansion);
        
        try {
          const response = await socialAPI.getPost(postId.toString(), isPostExpansion);
          if (response.post) {
            // Transform the processed_posts response to our Post type
            const transformedPost = transformProcessedPost(response.post);
            setPost(transformedPost);
            setIsBookmarked(transformedPost.user_bookmarked || transformedPost.userBookmarked || false);
            postData = transformedPost;
            
            console.log('🔍 PostDetailScreen: Individual post loaded from processed_posts API:', {
              postId: transformedPost.id,
              displayName: transformedPost.user?.display_name,
              userIsBrand: transformedPost.user?.is_brand,
              brandName: transformedPost.user?.brand_name
            });
          }
        } catch (apiError: any) {
          console.warn('🔍 PostDetailScreen: Failed to fetch post from API:', apiError);
          
          // Check if this is a "Post not found" error
          if (apiError?.message?.includes('Post not found') || 
              apiError?.response?.data?.message === 'Post not found' ||
              apiError?.toString()?.includes('Post not found')) {
            // Post was deleted or doesn't exist
            setPost(null);
            return; // Exit early to show the not found UI
          }
          // Continue with existing post data if API fails for other reasons
        }
      }

      // Load quotes if available using the quotedBy array
      if (postData && postData.quoted_by && postData.quoted_by.length > 0) {
        loadQuotes(postData.quoted_by);
      } else if (postData && postData.quotedBy && postData.quotedBy.length > 0) {
        // Support both field names (quoted_by and quotedBy)
        loadQuotes(postData.quotedBy);
      } else {
        setQuotePosts([]);
      }
    } catch (error: any) {
      console.error('Error loading post details:', error);
      
      // Check if this is a "Post not found" error
      if (error?.message?.includes('Post not found') || 
          error?.response?.data?.message === 'Post not found' ||
          error?.toString()?.includes('Post not found')) {
        // Post was deleted or doesn't exist
        setPost(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSidebarOpen = () => {
    setSidebarVisible(true);
  };

  const handleSidebarNavigate = useCallback(
    (screen: string, params?: any) => {
      console.log('🔍 PostDetailScreen.handleSidebarNavigate: Called with:', { screen, params });
      
      setSidebarVisible(false); // Close sidebar first
      
      // Check if screen exists in Feed stack
      const feedStackScreens = [
        'Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
        'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
        'Posts', 'Receipts', 'Points', 'Business', 'HelpCenter', 'Watchlist'
      ];
      
      if (feedStackScreens.includes(screen)) {
        // Screen exists in Feed stack, navigate directly
        console.log('🔍 PostDetailScreen: Navigating to feedStackScreen:', screen, 'with params:', params);
        navigation.navigate(screen as any, params);
      } else if (screen === 'Profile') {
        // Navigate to Profile screen
        console.log('🔍 PostDetailScreen: Navigating to Profile from sidebar with params:', JSON.stringify(params, null, 2));
        navigation.navigate('Profile', params);
      }
    },
    [navigation],
  );

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share post:', postId);
  };

  // Handle refresh with callback
  const loadQuotes = async (quoteSignatures: string[]) => {
    setQuotesLoading(true);
    try {
      console.log('🔍 PostDetailScreen: Loading quotes for post:', { 
        postId, 
        quoteCount: quoteSignatures.length,
        signatures: quoteSignatures.slice(0, 3)
      });
      
      // Fetch the actual posts using the signatures
      const quotesResponse = await socialAPI.getPostsBySignatures(quoteSignatures);
      
      if (quotesResponse?.posts) {
        // Transform the posts to our Post type
        const transformedQuotes = quotesResponse.posts.map(transformProcessedPost);
        setQuotePosts(transformedQuotes);
        
        console.log('🔍 PostDetailScreen: Quotes loaded successfully:', {
          count: transformedQuotes.length
        });
      } else {
        console.log('🔍 PostDetailScreen: No quotes data in response');
        setQuotePosts([]);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      setQuotePosts([]);
    } finally {
      setQuotesLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await loadPostDetails(true);
  }, [postId]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading);
  }, [refreshing, loading, handleRefreshStateChange]);

  const handleUserPress = (userId: number | undefined | null, walletAddress: string, postSignature?: string) => {
    // ENGAGEMENT TRACKING: Include profileVisitFrom for analytics
    console.log('📊 PostDetailScreen: Tracking profile visit from post:', postSignature);
    
    // Navigate to Profile screen
    console.log('🔍 PostDetailScreen: Navigating to Profile with walletAddress:', walletAddress);
    navigation.navigate('Profile', {
      walletAddress, 
      profileVisitFrom: postSignature // Track visit source
    });
  };

  const handleQuotePress = (quotedPost: Post) => {
    // Navigate to create quote post
    navigation.navigate('CreatePost', {quotedPost});
  };

  const handleQuoteNavigation = (quotePost: Post) => {
    // Check if the quoted post is a thread and route appropriately
    if (quotePost.threadData || quotePost.isThreadRoot || quotePost.threadPostCount > 0) {
      console.log('🧵 PostDetailScreen.handleQuoteNavigation: Navigating to thread details for quoted post:', quotePost.id);
      navigation.push('ThreadDetails', {
        threadId: quotePost.signature || quotePost.transactionHash || quotePost.id?.toString(),
        post: quotePost
      });
    } else {
      console.log('📄 PostDetailScreen.handleQuoteNavigation: Navigating to post details for quoted post:', quotePost.id);
      navigation.push('PostDetail', {postId: quotePost.id, post: quotePost});
    }
  };

  const handleThreadPress = (threadPost: Post) => {
    // Navigate to thread details page per FEED_INTEGRATION_GUIDE.md
    navigation.navigate('ThreadDetails', {threadId: threadPost.signature || threadPost.transactionHash, post: threadPost});
  };

  const handleQuotedPostPress = (quotedPost: any) => {
    // Navigate to the quoted post's detail screen
    navigation.push('PostDetail', {
      postId: quotedPost.postSignature,
      post: null // Let it fetch the full post data
    });
  };

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
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
    avatarButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    postCardWrapper: {
      marginTop: 12,
    },
    analyticsCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 16,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    analyticsHeader: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    analyticsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    analyticsTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    analyticsSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 8,
    },
    metricTile: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    metricIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    metricContent: {
      flex: 1,
    },
    metricCount: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      lineHeight: 24,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    metricTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    metricTrendText: {
      fontSize: 11,
      color: colors.success,
      fontFamily: 'Inter-Medium',
    },
    quotesSection: {
      margin: 16,
      marginTop: 8,
    },
    quotesSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    quotesTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    quotesTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    quotesCountBadge: {
      backgroundColor: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    quotesCountText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    quotesDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    quotesDropdownText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      height: 44,
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    emptyQuotesContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyQuotesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyQuotesCaption: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 24,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      height: 44,
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.foreground,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    quoteCard: {
      marginBottom: 12,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <FeedSkeleton itemCount={1} showImages={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Pressable
              style={styles.avatarButton}
              onPress={handleSidebarOpen}
              accessibilityLabel="Open profile menu">
              <Avatar
                src={user?.profilePicture}
                fallback={getAvatarFallback({
                  displayName: user?.displayName,
                  username: user?.username,
                  walletAddress: user?.primary_wallet_address || user?.primaryWalletAddress || user?.walletAddress
                })}
                size="md"
                showRing={user?.is_verified}
                ringColor={colors.success}
                shape={user?.is_brand ? 'square' : 'circle'}
              />
              {!connected && (
                <View style={styles.statusDot}>
                  <StatusDot status="offline" showLabel={false} />
                </View>
              )}
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Post</Text>
          </View>
          <View style={styles.headerSideRight} />
        </View>
        <View style={[styles.loadingContainer, {paddingHorizontal: 32}]}>
          <MessageCircle size={48} color={colors.mutedForeground} style={{opacity: 0.3, marginBottom: 16}} />
          <Text style={{
            color: colors.foreground, 
            fontSize: 18, 
            fontWeight: '600',
            fontFamily: 'Inter-SemiBold',
            marginBottom: 8
          }}>Post not found</Text>
          <Text style={{
            color: colors.mutedForeground,
            fontSize: 14,
            fontFamily: 'Inter-Regular',
            textAlign: 'center',
            marginBottom: 24
          }}>This post may have been deleted or is no longer available.</Text>
          <Pressable 
            style={[
              styles.primaryButton,
              {paddingHorizontal: 24}
            ]} 
            onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
        
        {/* Sidebar Menu */}
        <SidebarMenu 
          visible={sidebarVisible} 
          onClose={() => setSidebarVisible(false)} 
          onNavigate={handleSidebarNavigate}
        />
      </SafeAreaView>
    );
  }

  const userWallet = post.user?.wallet_address || post.userPubkey || post.userWallet || '';
  const isBrandUser = post.user?.is_brand && post.user?.brand_name;
  const displayName = (isBrandUser ? post.user.brand_name : null) ||
    post.user?.display_name || post.user?.username || post.username || 
    (userWallet ? `${userWallet.slice(0, 5)}...${userWallet.slice(-5)}` : 'Unknown');
  const avatarUrl = isBrandUser && post.user?.brand_logo_url 
    ? post.user.brand_logo_url
    : (post.user?.avatar_url || post.profile_image_url || post.profileImageUrl);
  const reputationScore = post.user?.reputation_score || post.reputation || 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <AppNavBar
          title="Post"
          showBackButton={true}
          onBackPress={handleBack}
          onNewPostPress={() => navigation.navigate('CreatePost' as any)}
        />

        <ScrollView
          style={{flex: 1}}
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
          contentContainerStyle={{paddingBottom: 80}}>
          {/* Main Post Card - Using exact PostCard component */}
          <View style={styles.postCardWrapper}>
            <PostCard
              post={post}
              onPress={() => {}}
              onUserPress={handleUserPress}
              onQuotePress={handleQuotePress}
              onThreadPress={handleThreadPress}
              onQuotedPostPress={handleQuotedPostPress}
              showFullComments={true}
              hideExpandButton={true}
            />
          </View>

          {/* Engagement Analytics Card */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsTitleRow}>
                <ChartBar size={20} color={colors.foreground} />
                <Text style={styles.analyticsTitle}>Post Analytics</Text>
              </View>
              <Text style={styles.analyticsSubtitle}>Performance metrics</Text>
            </View>
            
            <View style={styles.metricsGrid}>
              <Pressable style={[styles.metricTile, {borderBottomWidth: 1}]}>
                <View style={styles.metricIconContainer}>
                  <Eye size={20} color={colors.primary} />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricCount}>{(post.view_count || post.viewCount || 0).toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Views</Text>
                </View>
              </Pressable>
              
              <Pressable style={[styles.metricTile, {borderBottomWidth: 1, borderRightWidth: 0}]}>
                <View style={styles.metricIconContainer}>
                  <Quote size={20} color={colors.primary} />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricCount}>{(post.quote_count || post.quoteCount || 0).toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Quotes</Text>
                </View>
              </Pressable>
              
              <Pressable style={[styles.metricTile, {borderBottomWidth: 0}]}>
                <View style={styles.metricIconContainer}>
                  <Bookmark size={20} color={colors.primary} />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricCount}>{(post.receipts_count || post.receiptsCount || 0).toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Receipts</Text>
                </View>
              </Pressable>
              
              <Pressable style={[styles.metricTile, {borderBottomWidth: 0, borderRightWidth: 0}]}>
                <View style={styles.metricIconContainer}>
                  <Expand size={20} color={colors.primary} />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricCount}>{(post.expansions_count || post.expansionsCount || 0).toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Expansions</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Quotes Section */}
          <View style={styles.quotesSection}>
            <View style={styles.quotesSectionHeader}>
              <View style={styles.quotesTitleContainer}>
                <Text style={styles.quotesTitle}>Quotes</Text>
                <View style={styles.quotesCountBadge}>
                  <Text style={styles.quotesCountText}>
                    {post.quotedByCount || post.quoted_by_count || 
                     post.quoted_by?.length || post.quotedBy?.length || quotePosts.length || 0}
                  </Text>
                </View>
              </View>
              <Pressable 
                style={styles.quotesDropdown} 
                onPress={() => console.log('Dropdown pressed')}>
                <Text style={styles.quotesDropdownText}>Recent</Text>
                <ChevronDown size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {quotesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.emptyQuotesCaption, {marginTop: 12}]}>Loading quotes...</Text>
              </View>
            ) : quotePosts.length === 0 ? (
              <View style={styles.emptyQuotesContainer}>
                <Quote size={48} color={colors.mutedForeground} style={{opacity: 0.5}} />
                <Text style={styles.emptyQuotesTitle}>No quotes yet</Text>
                <Text style={styles.emptyQuotesCaption}>Be the first to share your thoughts on this post</Text>
                <Pressable 
                  style={styles.secondaryButton} 
                  onPress={() => handleQuotePress(post)}>
                  <Text style={styles.secondaryButtonText}>Quote This Post</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={quotePosts}
                keyExtractor={(item) => item?.id || `quote-${Math.random()}`}
                renderItem={({item}) => (
                  <View style={styles.quoteCard}>
                    <PostCard
                      post={item}
                      onPress={() => handleQuoteNavigation(item)}
                      onUserPress={handleUserPress}
                      onQuotePress={handleQuotePress}
                      onThreadPress={handleThreadPress}
                      onQuotedPostPress={handleQuotedPostPress}
                    />
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
        
        {/* Floating Action Button */}
        <Pressable 
          style={[styles.fab, {backgroundColor: colors.primary}]} 
          onPress={() => handleQuotePress(post)}>
          <Quote size={24} color={colors.primaryForeground} />
        </Pressable>
      </KeyboardAvoidingView>
      
      {/* Sidebar Menu */}
      <SidebarMenu 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}