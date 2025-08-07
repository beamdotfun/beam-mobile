import React, {useEffect} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {Settings} from 'lucide-react-native';
import {Screen} from '../../components/layout/Screen';
import {Header} from '../../components/layout/Header';
import {ProfileHeader} from '../../components/profile/ProfileHeader';
import {PostCard} from '../../components/social/PostCard';
import {ActivityItem} from '../../components/profile/ActivityItem';
import {Button} from '../../components/ui/button';
import {useProfileStore} from '../../store/profileStore';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {ProfileStackScreenProps} from '../../types/navigation';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

type Props = ProfileStackScreenProps<'ProfileHome'>;

const Tab = createMaterialTopTabNavigator();

function PostsTab() {
  const navigation = useNavigation();
  const {userPosts, postsLoading, loadUserPosts} = useProfileStore();
  const {publicKey} = useWalletStore();

  useEffect(() => {
    if (publicKey) {
      loadUserPosts(publicKey.toString(), true);
    }
  }, [publicKey]);

  const handlePostPress = (post: any) => {
    // ENGAGEMENT TRACKING: Add postExpansion=true for analytics
    console.log('📊 ProfileHomeScreen: Tracking post expansion for engagement metrics');
    
    // Check if this is a thread root post and route appropriately
    if (post.threadData || post.isThreadRoot || post.threadPostCount > 0) {
      console.log('🧵 ProfileHomeScreen.handlePostPress: Navigating to thread details for post:', post.id);
      navigation.navigate('ThreadDetails', {
        threadId: post.signature || post.transactionHash || post.id?.toString(),
        post: post,
        postExpansion: true // Track expansion for analytics
      });
    } else {
      console.log('📄 ProfileHomeScreen.handlePostPress: Navigating to post details for regular post:', post.id);
      navigation.navigate('PostDetail', {
        postId: post.transaction_hash || post.signature || post.id, 
        post,
        postExpansion: true // Track expansion for analytics
      });
    }
  };

  const handleQuotePress = (post: any) => {
    navigation.navigate('CreatePost', {quotedPost: post});
  };

  const handleThreadPress = (post: any) => {
    navigation.navigate('ThreadDetails', {
      threadId: post.signature || post.transactionHash || post.id?.toString(),
      post: post
    });
  };

  const handleQuotedPostPress = (quotedPost: any) => {
    navigation.navigate('PostDetail', {
      postId: quotedPost.postSignature || quotedPost.signature,
      post: null
    });
  };

  if (userPosts.length === 0 && !postsLoading) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-muted-foreground text-center text-lg mb-4">
          You haven't posted anything yet!
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          Share your thoughts with the community.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {userPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onPress={() => handlePostPress(post)}
          onUserPress={() => {
            /* Already on user profile */
          }}
          onQuotePress={handleQuotePress}
          onThreadPress={handleThreadPress}
          onQuotedPostPress={handleQuotedPostPress}
        />
      ))}

      {postsLoading && userPosts.length > 0 && (
        <View className="py-4 items-center">
          <Text className="text-muted-foreground text-sm">
            Loading more posts...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function ActivityTab() {
  const {userActivity, activityLoading, loadUserActivity} = useProfileStore();
  const {publicKey} = useWalletStore();

  useEffect(() => {
    if (publicKey) {
      loadUserActivity(publicKey.toString(), true);
    }
  }, [publicKey]);

  if (userActivity.length === 0 && !activityLoading) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-muted-foreground text-center">
          No recent activity
        </Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {userActivity.map(activity => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          onPress={() => {
            /* Handle activity press */
          }}
        />
      ))}

      {activityLoading && userActivity.length > 0 && (
        <View className="py-4 items-center">
          <Text className="text-muted-foreground text-sm">
            Loading more activity...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

export default function ProfileHomeScreen({navigation}: Props) {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const {currentProfile, loading, error, loadProfile} = useProfileStore();

  // Load profile when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      if (publicKey) {
        loadProfile(publicKey.toString());
      }
    }, [publicKey]),
  );

  const handleEditProfile = () => {
    navigation.navigate('GeneralSettings');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  if (!publicKey) {
    return (
      <Screen>
        <Header title="Profile" />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-muted-foreground text-center text-lg mb-4">
            Connect your wallet to view your profile
          </Text>
        </View>
      </Screen>
    );
  }

  if (loading && !currentProfile) {
    return (
      <Screen>
        <Header title="Profile" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading profile...</Text>
        </View>
      </Screen>
    );
  }

  if (error && !currentProfile) {
    return (
      <Screen>
        <Header title="Profile" />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-destructive text-center mb-4">{error}</Text>
          <Button onPress={() => loadProfile(publicKey.toString())}>
            Try Again
          </Button>
        </View>
      </Screen>
    );
  }

  // Create a default profile if none exists
  const profile = currentProfile || {
    userWallet: publicKey.toString(),
    displayName: undefined,
    bio: undefined,
    profilePicture: undefined,
    bannerImage: undefined,
    nftVerified: false,
    snsVerified: false,
    isVerifiedCreator: false,
    postCount: 0,
    followerCount: 0,
    followingCount: 0,
    onChainReputation: 0,
    tipsSentCount: 0,
    tipsSentTotal: 0,
    tipsReceivedCount: 0,
    tipsReceivedTotal: 0,
    lastActiveSlot: 0,
    joinedAt: new Date().toISOString(),
    isActive: true,
    isPrivate: false,
    allowDirectMessages: true,
    showActivity: true,
  };

  return (
    <Screen>
      <Header
        title="Profile"
        rightComponent={<Settings size={24} color={colors.foreground} />}
        onRightPress={handleSettings}
      />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <ProfileHeader
          profile={profile}
          onEditPress={handleEditProfile}
          onSettingsPress={handleSettings}
          onFollowersPress={() => {
            /* Navigate to followers */
          }}
          onFollowingPress={() => {
            /* Navigate to following */
          }}
        />

        {/* Tab Navigator */}
        <View style={{height: 400}}>
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.mutedForeground,
              tabBarIndicatorStyle: {backgroundColor: colors.primary},
              tabBarStyle: {backgroundColor: colors.background},
              tabBarLabelStyle: {fontSize: 14, fontWeight: '600'},
            }}>
            <Tab.Screen name="Posts" component={PostsTab} />
            {profile.showActivity && (
              <Tab.Screen name="Activity" component={ActivityTab} />
            )}
          </Tab.Navigator>
        </View>
      </ScrollView>
    </Screen>
  );
}
