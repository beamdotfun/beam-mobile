import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  MessageCircle,
  Clock,
  TrendingUp,
  Eye,
  Quote,
  Bookmark,
  Share,
} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {PostCard} from '../../components/social/PostCard';
import {SkeletonCard} from '../../components/ui/Skeleton';
import {StatusDot} from '../../components/ui/StatusDot';
import {getAvatarFallback} from '../../lib/utils';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {useThemeStore} from '../../store/themeStore';
import {useSocialStore} from '../../store/socialStore';
import {socialAPI} from '../../services/api/social';
import {useAuthStore} from '../../store/auth';
import {useWalletStore} from '../../store/wallet';
import {Post} from '../../types/social';
import {ThreadGroup, getThreadSummary} from '../../utils/threadUtils';
import {transformProcessedPost} from '../../utils/postTransform';
import {format, formatDistanceToNow} from 'date-fns';
import {AppNavBar} from '../../components/navigation/AppNavBar';

interface ThreadDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      thread?: ThreadGroup;
      threadId?: string;
      posts?: Post[];
      postExpansion?: boolean; // Track if this is a post expansion for analytics
    };
  };
}

export default function ThreadDetailsScreen({navigation, route}: ThreadDetailsScreenProps) {
  const {colors} = useThemeStore();
  const {posts} = useSocialStore();
  const {user} = useAuthStore();
  const {connected} = useWalletStore();
  
  const [thread, setThread] = useState<ThreadGroup | null>(route.params?.thread || null);
  const [loading, setLoading] = useState(!thread);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!thread && (route.params?.threadId || route.params?.posts)) {
      loadThreadData();
    }
  }, []);

  const loadThreadData = async () => {
    setLoading(true);
    
    try {
      if (route.params?.posts) {
        // Thread created from posts array (fallback for when posts are already available)
        const sortedPosts = route.params.posts.sort((a, b) => 
          new Date(a.created_at || a.createdAt).getTime() - 
          new Date(b.created_at || b.createdAt).getTime()
        );
        
        const firstPost = sortedPosts[0];
        const lastPost = sortedPosts[sortedPosts.length - 1];
        
        const threadData: ThreadGroup = {
          id: route.params.threadId || firstPost.id?.toString() || '',
          posts: sortedPosts,
          firstPost,
          lastPost,
          totalPosts: sortedPosts.length,
          isThread: true,
          createdAt: firstPost.created_at || firstPost.createdAt,
          updatedAt: lastPost.updated_at || lastPost.updatedAt || lastPost.created_at || lastPost.createdAt,
        };
        
        setThread(threadData);
      } else if (route.params?.threadId) {
        // Fetch thread posts from API using any post signature in the thread
        console.log('🧵 ThreadDetailsScreen: Loading thread from API:', route.params.threadId);
        
        // ENGAGEMENT TRACKING: Include postExpansion parameter if this is a user expansion
        const isPostExpansion = route.params?.postExpansion === true;
        console.log('📊 ThreadDetailsScreen: Thread expansion tracking:', isPostExpansion);
        
        const threadResponse = await socialAPI.getThreadPosts(route.params.threadId, isPostExpansion);
        const { thread: threadData } = threadResponse;
        
        if (threadData && threadData.posts && threadData.posts.length > 0) {
          // Use the centralized transform utility for processed_posts structure
          const transformedPosts = threadData.posts.map((apiPost: any) => transformProcessedPost(apiPost));
          
          const firstPost = transformedPosts[0];
          const lastPost = transformedPosts[transformedPosts.length - 1];
          
          const threadGroupData: ThreadGroup = {
            id: threadData.rootPost?.postSignature || firstPost.signature || firstPost.transactionHash || route.params.threadId,
            posts: transformedPosts,
            firstPost,
            lastPost,
            totalPosts: threadData.totalPosts || transformedPosts.length,
            isThread: true,
            createdAt: firstPost.createdAt,
            updatedAt: threadData.lastUpdated || lastPost.updatedAt || lastPost.createdAt,
          };
          
          console.log('🧵 ThreadDetailsScreen: Thread loaded from processed_posts API:', {
            threadId: threadGroupData.id,
            postsCount: threadGroupData.totalPosts,
            rootPostDisplayName: threadData.rootPost?.displayName,
            transformedPostsCount: transformedPosts.length,
            firstPostDisplayName: transformedPosts[0]?.user?.display_name
          });
          
          setThread(threadGroupData);
        } else {
          console.warn('🧵 ThreadDetailsScreen: No posts found for thread:', route.params.threadId);
        }
      }
    } catch (error) {
      console.error('🧵 ThreadDetailsScreen: Error loading thread data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadThreadData();
    setRefreshing(false);
  };

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading);
  }, [refreshing, loading, handleRefreshStateChange]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSidebarOpen = () => {
    setSidebarVisible(true);
  };

  const handleSidebarNavigate = (screen: string, params?: any) => {
    setSidebarVisible(false);
    navigation.navigate(screen, params);
  };

  const handleUserPress = (userId: number | undefined | null, walletAddress: string, postSignature?: string) => {
    // ENGAGEMENT TRACKING: Include profileVisitFrom for analytics
    console.log('📊 ThreadDetailsScreen: Tracking profile visit from post:', postSignature);
    
    // Check if we're in SearchNavigator (has 'Profile' screen) or FeedNavigator (has 'UserProfile' screen)
    const routes = navigation.getState?.()?.routeNames || [];
    if (routes.includes('UserProfile')) {
      // We're in FeedNavigator
      navigation.navigate('UserProfile', {
        walletAddress,
        profileVisitFrom: postSignature // Track visit source
      });
    } else {
      // We're in SearchNavigator or other navigator with 'Profile' screen
      navigation.navigate('Profile', {
        walletAddress,
        profileVisitFrom: postSignature // Track visit source
      });
    }
  };

  const handleQuotePress = (post: Post) => {
    navigation.navigate('CreatePost', {quotedPost: post});
  };

  const handleReplyToThread = () => {
    if (thread) {
      navigation.navigate('CreatePost', {
        replyToThread: thread.id,
        isThreadReply: true,
      });
    }
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerRight: {
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
      marginLeft: 8,
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
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    createPostButton: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
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
      color: '#000000',
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    threadHeader: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    threadTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    threadIcon: {
      marginRight: 8,
    },
    threadTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      flex: 1,
    },
    threadMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    threadMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    threadMetaIcon: {
      marginRight: 4,
    },
    threadMetaText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    threadStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    threadStat: {
      alignItems: 'center',
    },
    threadStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    threadStatLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    postsContainer: {
      paddingBottom: 80,
    },
    postWrapper: {
      marginBottom: 1, // Small gap between posts in thread
    },
    threadConnector: {
      position: 'absolute',
      left: 32,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: colors.border,
      zIndex: 0,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
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
        <AppNavBar
          title="Thread"
          showBackButton={true}
          onBackPress={handleBack}
          onNewPostPress={() => navigation.navigate('CreatePost')}
        />
        
        <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
          {/* Thread Header Skeleton */}
          <View style={[styles.threadHeader, {opacity: 0.7}]}>
            <View style={styles.threadTitleRow}>
              <View style={{width: 20, height: 20, backgroundColor: colors.muted, borderRadius: 4}} />
              <View style={{width: 60, height: 20, backgroundColor: colors.muted, borderRadius: 4, marginLeft: 8}} />
            </View>
            
            <View style={styles.threadMeta}>
              <View style={styles.threadMetaItem}>
                <View style={{width: 16, height: 16, backgroundColor: colors.muted, borderRadius: 4}} />
                <View style={{width: 100, height: 16, backgroundColor: colors.muted, borderRadius: 4, marginLeft: 8}} />
              </View>
            </View>

            {/* Stats skeleton */}
            <View style={styles.threadStats}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.threadStat}>
                  <View style={{width: 30, height: 24, backgroundColor: colors.muted, borderRadius: 4, marginBottom: 4}} />
                  <View style={{width: 40, height: 14, backgroundColor: colors.muted, borderRadius: 4}} />
                </View>
              ))}
            </View>
          </View>

          {/* Thread Posts Skeleton */}
          <View style={{paddingHorizontal: 16}}>
            <FeedSkeleton itemCount={3} showImages={true} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!thread) {
    if (error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.backButton} onPress={handleBack}>
                <ArrowLeft size={24} color={colors.foreground} />
              </Pressable>
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
              <Text style={styles.headerTitle}>Thread</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                style={styles.createPostButton}
                onPress={() => navigation.navigate('CreatePost')}>
                <Plus size={16} color="#000000" strokeWidth={2.5} />
                <Text style={styles.createPostButtonText}>New Post</Text>
              </Pressable>
            </View>
          </View>
          
          <EnhancedErrorState
            title="Can't load thread"
            subtitle="Check your connection and try again"
            onRetry={async () => {
              setError(null);
              await loadThreadData();
            }}
            retryLabel="Try Again"
            retrying={loading}
          />
          
          {/* Sidebar Menu */}
          <SidebarMenu 
            visible={sidebarVisible} 
            onClose={() => setSidebarVisible(false)} 
            onNavigate={handleSidebarNavigate}
          />
        </SafeAreaView>
      );
    }
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Thread</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{color: colors.mutedForeground}}>Thread not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const threadSummary = getThreadSummary(thread);
  
  // Calculate thread stats from all posts in the thread
  const totalViews = thread.posts.reduce((sum, post, index) => {
    // Try multiple field names for views
    const views = post.postViewCount || post.view_count || post.viewCount || 0;
    
    // Debug log for first post to check field names
    if (index === 0) {
      console.log('📊 ThreadDetails: Sample post stats:', {
        postViewCount: post.postViewCount,
        postUniqueViewsCount: post.postUniqueViewsCount,
        postExpansionsCount: post.postExpansionsCount,
        postReceiptsCount: post.postReceiptsCount,
        view_count: post.view_count,
        receipts_count: post.receipts_count,
      });
    }
    
    return sum + views;
  }, 0);
  
  const totalUniqueViews = thread.posts.reduce((sum, post) => {
    // Try multiple field names for unique views
    const uniqueViews = post.postUniqueViewsCount || post.unique_views_count || post.uniqueViewsCount || 0;
    return sum + uniqueViews;
  }, 0);
  
  const totalExpansions = thread.posts.reduce((sum, post) => {
    // Count post expansions (when users click to view full post)
    const expansions = post.postExpansionsCount || post.expansions_count || post.expansionsCount || 0;
    return sum + expansions;
  }, 0);
  
  const totalReceipts = thread.posts.reduce((sum, post) => {
    // Count receipts/bookmarks
    const receipts = post.postReceiptsCount || post.receipts_count || post.receiptsCount || 0;
    return sum + receipts;
  }, 0);
  
  console.log('📊 ThreadDetails: Thread stats calculated:', {
    totalPosts: thread.posts?.length,
    totalViews,
    totalUniqueViews,
    totalExpansions,
    totalReceipts,
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        
        <AppNavBar
          title="Thread"
          showBackButton={true}
          onBackPress={handleBack}
          onNewPostPress={() => navigation.navigate('CreatePost')}
        />

        <ScrollView
          ref={scrollViewRef}
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
          contentContainerStyle={styles.postsContainer}>
          
          {/* Thread Header */}
          <View style={styles.threadHeader}>
            <View style={styles.threadTitleRow}>
              <MessageCircle size={20} color={colors.primary} style={styles.threadIcon} />
              <Text style={styles.threadTitle}>Thread</Text>
            </View>
            
            <View style={styles.threadMeta}>
              <View style={styles.threadMetaItem}>
                <Clock size={16} color={colors.mutedForeground} style={styles.threadMetaIcon} />
                <Text style={styles.threadMetaText}>
                  {formatDistanceToNow(new Date(thread.updatedAt), {addSuffix: true})}
                </Text>
              </View>
            </View>

            <View style={styles.threadStats}>
              <View style={styles.threadStat}>
                <Text style={styles.threadStatValue}>{thread.posts?.length || thread.totalPosts || 0}</Text>
                <Text style={styles.threadStatLabel}>Posts</Text>
              </View>
              
              <View style={styles.threadStat}>
                <Text style={styles.threadStatValue}>{totalViews.toLocaleString()}</Text>
                <Text style={styles.threadStatLabel}>Views</Text>
              </View>
              
              <View style={styles.threadStat}>
                <Text style={styles.threadStatValue}>{totalUniqueViews.toLocaleString()}</Text>
                <Text style={styles.threadStatLabel}>Unique</Text>
              </View>
              
              <View style={styles.threadStat}>
                <Text style={styles.threadStatValue}>{totalReceipts}</Text>
                <Text style={styles.threadStatLabel}>Receipts</Text>
              </View>
            </View>
          </View>

          {/* Thread Posts */}
          <View style={{position: 'relative'}}>
            {/* Thread connector line */}
            {thread.posts.length > 1 && (
              <View style={styles.threadConnector} />
            )}
            
{(() => {
              // Get the latest reputation score for each unique user in the thread
              const userLatestReputation = new Map<string, number>();
              
              // Collect the highest reputation score for each user (assuming later posts have more current data)
              thread.posts.forEach(post => {
                const walletAddress = post.user?.walletAddress || post.user?.wallet_address || post.userWallet;
                if (walletAddress) {
                  const currentReputation = post.user?.reputation_score || post.user?.onChainReputation || 0;
                  userLatestReputation.set(walletAddress, currentReputation);
                }
              });
              
              return thread.posts.map((post, index) => {
                const walletAddress = post.user?.walletAddress || post.user?.wallet_address || post.userWallet;
                const consistentReputation = walletAddress ? userLatestReputation.get(walletAddress) || 0 : 0;
                
                // Create a normalized post with consistent user reputation
                const normalizedPost = {
                  ...post,
                  user: {
                    ...post.user,
                    reputation_score: consistentReputation,
                    onChainReputation: consistentReputation,
                  }
                };
                
                return (
                  <View key={post.id || index} style={styles.postWrapper}>
                    <PostCard
                      post={normalizedPost}
                      onPress={() => {}}
                      onUserPress={handleUserPress}
                      onQuotePress={handleQuotePress}
                      showFullComments={false}
                      hideExpandButton={false}
                    />
                  </View>
                );
              });
            })()}
          </View>
        </ScrollView>
        
        {/* Reply to Thread FAB */}
        <Pressable style={styles.fab} onPress={handleReplyToThread}>
          <MessageCircle size={24} color="#FFFFFF" />
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