import React, {useEffect, useState, useCallback} from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Header} from '../../components/layout/Header';
import {PostCard} from '../../components/social/PostCard';
import {Avatar} from '../../components/ui/avatar';
import {Badge} from '../../components/ui/badge';
import {Card, CardContent} from '../../components/ui/card';
import {Button} from '../../components/ui/button';
import {Eye, ThumbsUp, DollarSign, Shield} from 'lucide-react-native';
import {socialAPI} from '../../services/api/social';
import {Post} from '../../types/social';
import {User} from '../../services/api/types';
import {transformProcessedPost} from '../../utils/postTransform';
import {FeedStackScreenProps} from '../../types/navigation';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useVoting} from '../../hooks/useBlockchainTransactions';
import {useWatchlist} from '../../hooks/useWatchlist';
import {TipUserButton} from '../../components/social/TipUserButton';
import {getUserProfilePicture} from '../../utils/profileUtils';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

type Props = FeedStackScreenProps<'UserProfile'>;

export default function UserProfileScreen({route, navigation}: Props) {
  const {walletAddress: paramWalletAddress, username, profileVisitFrom} = route.params;
  // Use walletAddress if provided, otherwise use username as the identifier
  const walletAddress = paramWalletAddress || username || '';
  
  console.log('🔍 UserProfileScreen: Params received:', {
    paramWalletAddress,
    username,
    profileVisitFrom,
    resolvedWalletAddress: walletAddress
  });
  
  const {colors} = useThemeStore();
  const {publicKey, connected} = useWalletStore();
  const {upvote, downvote, loading: votingLoading, error: votingError} = useVoting();
  const {toggleFollow, isFollowing, loading: watchlistLoading, error: watchlistError} = useWatchlist();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const isOwnProfile = publicKey?.toString() === walletAddress;

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    loadProfile();
  }, [walletAddress]);

  // Check following status when component mounts or wallet changes
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!isOwnProfile && connected && walletAddress) {
        try {
          console.log('🔍 UserProfileScreen: Checking watch status for:', walletAddress);
          const followingStatus = await isFollowing(walletAddress);
          console.log('👁️ UserProfileScreen: Watch status result:', followingStatus, 'current state:', following);
          if (followingStatus !== following) {
            console.log(`🔄 UserProfileScreen: Updating watch state from ${following} to ${followingStatus}`);
            setFollowing(followingStatus);
          } else {
            console.log('✅ UserProfileScreen: Watch status matches current state, no update needed');
          }
        } catch (err) {
          console.warn('Failed to check watch status:', err);
        }
      }
    };

    checkFollowingStatus();
  }, [walletAddress, isOwnProfile, connected, isFollowing]);

  const loadProfile = async () => {
    try {
      if (!walletAddress) {
        console.error('🚨 UserProfileScreen: No wallet address available to load profile');
        setError('No wallet address provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log('📊 UserProfileScreen: Loading profile for wallet:', walletAddress);
      
      // ENGAGEMENT TRACKING: Log if this visit came from a post
      if (profileVisitFrom) {
        console.log('📊 UserProfileScreen: Loading profile with visit tracking from post:', profileVisitFrom);
      }

      // Load user info and initial posts in parallel
      // Note: getUser doesn't support profileVisitFrom tracking - consider using getUserProfile for full tracking
      const [userData, postsData] = await Promise.all([
        socialAPI.getUser(walletAddress),
        socialAPI.getUserPosts(walletAddress, 20, 0),
      ]);

      setUser(userData);

      // Transform processed_posts API response using utility
      console.log('🔍 UserProfileScreen.loadProfile: Transforming processed_posts response:', {
        postsCount: postsData.posts?.length || 0,
        hasPagination: !!postsData.pagination,
        firstPostStructure: postsData.posts?.[0] ? Object.keys(postsData.posts[0]).slice(0, 10) : 'no posts'
      });

      const transformedPosts = postsData.posts.map(transformProcessedPost);

      setPosts(transformedPosts);
      setHasMore(postsData.pagination?.total_pages > postsData.pagination?.page);
      setPage(2);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadProfile();
    setRefreshing(false);
  }, [walletAddress]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {return;}

    setLoadingMore(true);
    try {
      const postsData = await socialAPI.getUserPosts(
        walletAddress,
        20,
        page - 1, // Use 0-based page indexing
      );

      console.log('🔍 UserProfileScreen.handleLoadMore: Loading more posts with processed_posts:', {
        page: page - 1,
        postsCount: postsData.posts?.length || 0,
        pagination: postsData.pagination
      });

      const transformedPosts = postsData.posts.map(transformProcessedPost);

      setPosts(prev => [...prev, ...transformedPosts]);
      setHasMore(postsData.pagination?.total_pages > postsData.pagination?.page);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [walletAddress, page, hasMore, loadingMore, user]);

  const handlePostPress = useCallback(
    (post: Post) => {
      // ENGAGEMENT TRACKING: Add postExpansion=true for analytics
      console.log('📊 UserProfileScreen: Tracking post expansion for engagement metrics');
      
      // Check if this is a thread root post and route appropriately
      if (post.threadData || post.isThreadRoot || post.threadPostCount > 0) {
        console.log('🧵 UserProfileScreen.handlePostPress: Navigating to thread details for post:', {
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
        console.log('📄 UserProfileScreen.handlePostPress: Navigating to post details for regular post:', post.id);
        navigation.navigate('PostDetail', {
          postId: post.id,
          postExpansion: true // Track expansion for analytics
        });
      }
    },
    [navigation],
  );

  const handleUserPress = useCallback(
    (userId: number | undefined | null, walletAddress: string, postSignature?: string) => {
      // ENGAGEMENT TRACKING: Include profileVisitFrom for analytics
      console.log('📊 UserProfileScreen: Tracking profile visit from post:', postSignature);
      
      // Navigate to another user's profile
      navigation.push('UserProfile', {
        walletAddress,
        profileVisitFrom: postSignature // Track where the visit came from
      });
    },
    [navigation],
  );

  const handleVote = useCallback(() => {
    if (!connected) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to vote.');
      return;
    }

    if (isOwnProfile) {
      Alert.alert('Invalid Action', 'You cannot vote for yourself.');
      return;
    }

    // Navigate to vote selection screen
    navigation.navigate('VoteSelection', {
      targetWallet: walletAddress,
      targetName: user?.name,
    });
  }, [connected, isOwnProfile, navigation, walletAddress, user?.name]);

  const handleTip = useCallback(() => {
    if (!connected) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to send tips.');
      return;
    }

    if (isOwnProfile) {
      Alert.alert('Invalid Action', 'You cannot tip yourself.');
      return;
    }

    // Navigate to tip screen
    navigation.navigate('SendTip', {
      recipientWallet: walletAddress,
      recipientName: user?.name,
      recipientAvatar: getUserProfilePicture(user),
    });
  }, [connected, isOwnProfile, navigation, walletAddress, user?.name, user]);

  const handleWatch = useCallback(async () => {
    if (!connected) {
      setStatusMessage({
        type: 'error',
        message: 'Please connect your wallet to watch users.'
      });
      return;
    }

    if (isOwnProfile) {
      setStatusMessage({
        type: 'info',
        message: 'You cannot watch yourself.'
      });
      return;
    }

    setStatusMessage(null); // Clear any previous status messages

    // Haptic feedback
    ReactNativeHapticFeedback.trigger('impactLight');

    // Optimistic update - toggle the following state immediately
    const newFollowingState = !following;
    console.log(`🚀 UserProfileScreen: Optimistic update - changing from ${following} to ${newFollowingState}`);
    setFollowing(newFollowingState);
    
    // Show success message immediately for better UX
    const actionText = newFollowingState ? 'watching' : 'no longer watching';
    setStatusMessage({
      type: 'success',
      message: `You are now ${actionText} ${user?.name || 'this user'}.`
    });

    try {
      console.log(`🔄 Toggling follow status for: ${walletAddress}`);
      const result = await toggleFollow(walletAddress);
      
      // Verify the backend state matches our optimistic update
      const actualFollowingState = result.action === 'followed';
      console.log(`🔍 UserProfileScreen: Backend returned action '${result.action}', actualState: ${actualFollowingState}, optimisticState: ${newFollowingState}`);
      
      if (actualFollowingState !== newFollowingState) {
        console.log(`⚠️ UserProfileScreen: Mismatch detected! Correcting state from ${newFollowingState} to ${actualFollowingState}`);
        // Backend state doesn't match - revert to actual state
        setFollowing(actualFollowingState);
        const actualActionText = actualFollowingState ? 'watching' : 'no longer watching';
        setStatusMessage({
          type: 'success',
          message: `You are now ${actualActionText} ${user?.name || 'this user'}.`
        });
      } else {
        console.log(`✅ UserProfileScreen: Backend state matches optimistic update - keeping state as ${newFollowingState}`);
      }
      
      console.log(`✅ Successfully ${result.action} user: ${walletAddress}`);
    } catch (err: any) {
      console.error(`❌ Failed to toggle follow for: ${walletAddress}`, err);
      
      // Revert the optimistic update on error
      setFollowing(!newFollowingState);
      
      let errorMessage = 'Failed to update watch status. Please try again.';
      
      if (err.message?.includes("hasn't posted yet")) {
        errorMessage = "This user hasn't posted yet and can't be watched. They need to make their first post before you can watch them.";
      } else if (err.message?.includes('already following')) {
        errorMessage = 'You are already watching this user.';
      } else if (err.message?.includes('not following')) {
        errorMessage = 'You are not watching this user.'
      }
      
      setStatusMessage({
        type: 'error',
        message: errorMessage
      });
    }
  }, [connected, isOwnProfile, toggleFollow, walletAddress, user?.name, following]);

  const renderPost = useCallback(
    ({item}: {item: Post}) => (
      <PostCard
        post={item}
        onPress={() => handlePostPress(item)}
        onUserPress={handleUserPress}
        onQuotePress={(post) => {
          // Navigate to create quote post
          navigation.navigate('CreatePost', {quotedPost: post});
        }}
        onThreadPress={(post) => {
          // Navigate to thread details
          navigation.navigate('ThreadDetails', {
            threadId: post.signature || post.transactionHash || post.id?.toString(),
            post: post
          });
        }}
        onQuotedPostPress={(quotedPost) => {
          // Navigate to quoted post details
          if (quotedPost.threadData || quotedPost.isThreadRoot || quotedPost.threadPostCount > 0) {
            navigation.navigate('ThreadDetails', {
              threadId: quotedPost.postSignature,
              post: null
            });
          } else {
            navigation.navigate('PostDetail', {
              postId: quotedPost.postSignature,
              post: null
            });
          }
        }}
      />
    ),
    [handlePostPress, handleUserPress, navigation],
  );

  const renderHeader = () => (
    <>
      {/* Profile Info Card */}
      <Card className="mx-4 mb-4">
        <CardContent className="p-6">
          {/* Profile Info */}
          <View className="items-center mb-6">
            <Avatar
              src={getUserProfilePicture(user)}
              fallback={user?.name?.charAt(0) || walletAddress.slice(0, 2)}
              size="xl"
              className="mb-4"
            />

            <View className="items-center">
              <Text className="text-foreground text-xl font-bold mb-1">
                {user?.name && user.name !== walletAddress ? user.name : 'Anonymous User'}
              </Text>

              <View className="flex-row items-center mb-2">
                <Text className="text-muted-foreground text-sm">
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </Text>
                {user?.isVerified && (
                  <Badge variant="default" className="ml-2">
                    <Text className="text-xs text-verified">Verified</Text>
                  </Badge>
                )}
                {user?.brandAddress && (
                  <Badge variant="secondary" className="ml-2">
                    <Text className="text-xs text-brand">Brand</Text>
                  </Badge>
                )}
              </View>

              <Pressable
                onPress={() => {
                  // TODO: Show reputation details
                  console.log('Show reputation details');
                }}
                className="px-3 py-1 rounded-full bg-secondary">
                <Text className="text-secondary-foreground text-sm font-medium">
                  Reputation: {user?.onChainReputation || 0}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Actions */}
          {isOwnProfile ? (
            <Button
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate('Feed', {screen: 'GeneralSettings'})
              }
              variant="outline">
              Edit Profile
            </Button>
          ) : (
            <View className="flex-row space-x-3">
              <Button
                onPress={() => {
                  // TODO: Implement follow functionality
                  console.log('Follow user:', walletAddress);
                }}
                className="flex-1">
                Follow
              </Button>
              <Button
                onPress={() => {
                  // TODO: Implement message functionality
                  console.log('Message user:', walletAddress);
                }}
                variant="outline"
                className="flex-1">
                Message
              </Button>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row justify-around mt-6 pt-6 border-t border-border">
            <View className="items-center">
              <Text className="text-foreground text-lg font-bold">
                {posts.length}
              </Text>
              <Text className="text-muted-foreground text-sm">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-foreground text-lg font-bold">0</Text>
              <Text className="text-muted-foreground text-sm">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-foreground text-lg font-bold">0</Text>
              <Text className="text-muted-foreground text-sm">Following</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Status Message */}
      {statusMessage && (
        <Card className="mx-4 mb-4" style={{
          backgroundColor: statusMessage.type === 'success' ? colors.success + '10' : 
                          statusMessage.type === 'error' ? colors.destructive + '10' : 
                          colors.primary + '10',
          borderColor: statusMessage.type === 'success' ? colors.success : 
                       statusMessage.type === 'error' ? colors.destructive : 
                       colors.primary,
          borderWidth: 1,
        }}>
          <CardContent className="p-4">
            <Text className="text-center" style={{
              color: statusMessage.type === 'success' ? colors.success : 
                     statusMessage.type === 'error' ? colors.destructive : 
                     colors.primary,
              fontSize: 14,
              lineHeight: 20,
            }}>
              {statusMessage.message}
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Action Bar - Only show for other users */}
      {!isOwnProfile && (
        <Card className="mx-4 mb-4">
          <CardContent className="p-4">
            <View className="flex-row justify-around">
              {/* Watch */}
              <Pressable
                onPress={handleWatch}
                disabled={isOwnProfile}
                className="items-center flex-1"
                style={{
                  opacity: isOwnProfile ? 0.5 : 1,
                }}>
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center mb-2">
                  <Eye size={20} color={following ? colors.primary : colors.foreground} />
                </View>
                <Text className="text-xs text-center text-foreground font-medium" style={{
                  color: following ? colors.primary : colors.foreground,
                }}>
                  {following ? 'Watching' : 'Watch'}
                </Text>
              </Pressable>

              {/* Vote */}
              <Pressable
                onPress={handleVote}
                disabled={votingLoading || isOwnProfile}
                className="items-center flex-1"
                style={{
                  opacity: votingLoading || isOwnProfile ? 0.5 : 1,
                }}>
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center mb-2">
                  <ThumbsUp size={20} color={colors.foreground} />
                </View>
                <Text className="text-xs text-center text-foreground font-medium">
                  {votingLoading ? 'Voting...' : 'Vote'}
                </Text>
              </Pressable>

              {/* Tip */}
              <Pressable
                onPress={handleTip}
                disabled={isOwnProfile}
                className="items-center flex-1"
                style={{
                  opacity: isOwnProfile ? 0.5 : 1,
                }}>
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center mb-2">
                  <DollarSign size={20} color={colors.foreground} />
                </View>
                <Text className="text-xs text-center text-foreground font-medium">
                  Tip
                </Text>
              </Pressable>

              {/* Verify */}
              <Pressable
                onPress={() => {
                  navigation.navigate('Verification', {
                    targetWallet: walletAddress,
                    targetName: user?.name,
                  });
                }}
                className="items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center mb-2">
                  <Shield size={20} color={colors.foreground} />
                </View>
                <Text className="text-xs text-center text-foreground font-medium">
                  Verify
                </Text>
              </Pressable>
            </View>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center px-8 py-12">
      <Text className="text-muted-foreground text-center text-lg mb-4">
        {isOwnProfile ? "You haven't posted anything yet!" : 'No posts yet'}
      </Text>
      {isOwnProfile && (
        <Button onPress={() => navigation.navigate('CreatePost')}>
          Create Your First Post
        </Button>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View className="py-4 items-center">
          <Text className="text-muted-foreground text-sm">
            You've reached the end!
          </Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View className="py-4 items-center">
          <Text className="text-muted-foreground text-sm">
            Loading more posts...
          </Text>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Profile" showBackButton />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Profile" showBackButton />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-destructive text-center text-lg mb-4">
            {error || 'User not found'}
          </Text>
          <Button onPress={loadProfile}>Try Again</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title={user.name || 'Profile'}
        showBackButton
      />

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={posts.length === 0 ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{flexGrow: 1}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}
