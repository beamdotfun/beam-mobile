import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Pin, Filter, History} from 'lucide-react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useContentPinningStore} from '../../store/contentPinningStore';
import {useAuthStore} from '../../store/auth';
import {PostPreviewCard} from '../../components/posts/PostPreviewCard';
import {PinnedPost} from '../../types/content-pinning';

type PinnedPostsScreenRoute = {
  key: string;
  name: string;
  params: {
    userWallet: string;
  };
};

export const PinnedPostsScreen: React.FC = () => {
  const route = useRoute<PinnedPostsScreenRoute>();
  const navigation = useNavigation();
  const {userWallet} = route.params;
  const {user} = useAuthStore();

  const {pinnedPosts, isLoading, error, loadPinnedPosts, unpinPost, isPinning} =
    useContentPinningStore();

  const [showInactive, setShowInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = user?.walletAddress === userWallet;

  useEffect(() => {
    loadPinnedPosts(userWallet);
  }, [userWallet, loadPinnedPosts]);

  const filteredPosts = showInactive
    ? pinnedPosts
    : pinnedPosts.filter(pin => pin.isActive);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPinnedPosts(userWallet);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', {postId});
  };

  const handleUnpinPost = (postId: string) => {
    if (!isOwnProfile) {
      return;
    }

    Alert.alert('Unpin Post', 'Remove this post from your pinned posts?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Unpin',
        style: 'destructive',
        onPress: async () => {
          try {
            await unpinPost(postId);
          } catch (error) {
            console.error('Failed to unpin post:', error);
          }
        },
      },
    ]);
  };

  const renderPinnedPost = ({item}: {item: PinnedPost}) => (
    <View className="mb-4">
      <PostPreviewCard
        post={item.post}
        onPress={() => handlePostPress(item.postId)}
      />

      {/* Pin metadata */}
      <View className="bg-gray-50 p-3 rounded-b-lg border-t border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pin size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 ml-1">
              Pinned on {new Date(item.pinnedAt).toLocaleDateString()}
            </Text>
            {item.reason && (
              <Text className="text-xs text-gray-500 ml-2">
                • {item.reason}
              </Text>
            )}
          </View>

          {isOwnProfile && item.isActive && (
            <Pressable
              onPress={() => handleUnpinPost(item.postId)}
              disabled={isPinning}
              className="px-2 py-1 rounded">
              <Text className="text-xs text-red-600 font-medium">Unpin</Text>
            </Pressable>
          )}
        </View>

        {!item.isActive && (
          <View className="mt-2">
            <Text className="text-xs text-gray-500 italic">
              This post has been unpinned
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Pin size={48} color="#9CA3AF" />
      <Text className="text-gray-500 text-lg font-medium mt-4 text-center">
        {showInactive ? 'No pin history available' : 'No pinned posts'}
      </Text>
      <Text className="text-gray-400 text-center mt-2 px-8">
        {isOwnProfile
          ? showInactive
            ? 'Your pin history will appear here'
            : 'Pin your favorite posts to showcase them on your profile'
          : showInactive
          ? "This user's pin history is not available"
          : "This user hasn't pinned any posts yet"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full">
            <ArrowLeft size={24} color="#374151" />
          </Pressable>
          <View className="ml-3">
            <Text className="text-lg font-semibold text-gray-900">
              Pinned Posts
            </Text>
            <Text className="text-sm text-gray-500">
              {filteredPosts.length}{' '}
              {filteredPosts.length === 1 ? 'post' : 'posts'}
            </Text>
          </View>
        </View>

        {/* Filter Toggle */}
        <Pressable
          onPress={() => setShowInactive(!showInactive)}
          className="flex-row items-center p-2 rounded-lg bg-gray-50">
          {showInactive ? (
            <History size={16} color="#6B7280" />
          ) : (
            <Filter size={16} color="#6B7280" />
          )}
          <Text className="text-xs text-gray-600 ml-1 font-medium">
            {showInactive ? 'History' : 'Active'}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading pinned posts...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <Pressable
            onPress={() => loadPinnedPosts(userWallet)}
            className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPinnedPost}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 16}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};
