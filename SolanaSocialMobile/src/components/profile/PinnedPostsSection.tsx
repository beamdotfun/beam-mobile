import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {ChevronRight, Pin} from 'lucide-react-native';
import {useContentPinningStore} from '../../store/contentPinningStore';
import {PostPreviewCard} from '../posts/PostPreviewCard';
import {useNavigation} from '@react-navigation/native';

interface PinnedPostsSectionProps {
  userWallet: string;
  isOwnProfile?: boolean;
}

export const PinnedPostsSection: React.FC<PinnedPostsSectionProps> = ({
  userWallet,
  isOwnProfile = false,
}) => {
  const navigation = useNavigation();
  const {pinnedPosts, isLoading, error, loadPinnedPosts} =
    useContentPinningStore();

  useEffect(() => {
    loadPinnedPosts(userWallet);
  }, [userWallet, loadPinnedPosts]);

  const activePinnedPosts = pinnedPosts.filter(pin => pin.isActive);
  const displayedPosts = activePinnedPosts.slice(0, 3);
  const hasMorePosts = activePinnedPosts.length > 3;

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', {postId});
  };

  const handleViewAllPress = () => {
    navigation.navigate('PinnedPosts', {userWallet});
  };

  if (isLoading) {
    return (
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          <Pin size={20} color="#6B7280" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            Pinned Posts
          </Text>
        </View>
        <View className="flex-row justify-center py-8">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      </View>
    );
  }

  if (error || activePinnedPosts.length === 0) {
    return (
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          <Pin size={20} color="#6B7280" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            Pinned Posts
          </Text>
        </View>
        <View className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
          <Pin size={32} color="#9CA3AF" />
          <Text className="text-gray-500 text-center mt-2">
            {isOwnProfile
              ? "You haven't pinned any posts yet.\nPin your favorite posts to showcase them here!"
              : 'No pinned posts to show'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="p-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Pin size={20} color="#6B7280" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            Pinned Posts
          </Text>
          <View className="bg-gray-200 rounded-full px-2 py-1 ml-2">
            <Text className="text-xs text-gray-600 font-medium">
              {activePinnedPosts.length}
            </Text>
          </View>
        </View>

        {hasMorePosts && (
          <Pressable
            onPress={handleViewAllPress}
            className="flex-row items-center">
            <Text className="text-blue-600 text-sm font-medium mr-1">
              View All
            </Text>
            <ChevronRight size={16} color="#2563EB" />
          </Pressable>
        )}
      </View>

      {/* Pinned Posts Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="space-x-3"
        contentContainerStyle={{paddingRight: 16}}>
        {displayedPosts.map(pinnedPost => (
          <View key={pinnedPost.id} className="w-64">
            <PostPreviewCard
              post={pinnedPost.post}
              compact={true}
              onPress={() => handlePostPress(pinnedPost.postId)}
            />
          </View>
        ))}
      </ScrollView>

      {/* View All Footer */}
      {hasMorePosts && (
        <Pressable
          onPress={handleViewAllPress}
          className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-700 font-medium">
              View All {activePinnedPosts.length} Pinned Posts
            </Text>
            <ChevronRight size={16} color="#374151" className="ml-1" />
          </View>
        </Pressable>
      )}
    </View>
  );
};
