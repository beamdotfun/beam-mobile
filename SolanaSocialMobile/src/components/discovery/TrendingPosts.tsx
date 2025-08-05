import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Eye,
} from 'lucide-react-native';
import {TrendingPost} from '../../types/discovery';
import {Card} from '../ui/card';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {formatDistanceToNow, formatNumber} from '../../utils/formatting';
import {useDiscoveryStore} from '../../store/discoveryStore';

interface TrendingPostsProps {
  posts: TrendingPost[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const TrendingPosts: React.FC<TrendingPostsProps> = ({
  posts,
  loading,
  onRefresh,
}) => {
  const navigation = useNavigation();
  const {bookmarkPost, hidePost, recordInteraction} = useDiscoveryStore();

  const handlePostPress = (post: TrendingPost) => {
    recordInteraction({
      type: 'view',
      targetId: post.id,
      targetType: 'post',
      timestamp: new Date().toISOString(),
    });

    // Check if this is a thread post and route appropriately
    if (post.isThread || post.threadPostCount > 0) {
      console.log('🧵 TrendingPosts.handlePostPress: Navigating to thread details for post:', post.id);
      navigation.navigate('ThreadDetails' as never, {
        threadId: post.signature || post.transactionHash || post.id,
        post: post
      } as never);
    } else {
      console.log('📄 TrendingPosts.handlePostPress: Navigating to post details for regular post:', post.id);
      navigation.navigate('PostDetail' as never, {
        postId: post.signature || post.transactionHash || post.id,
        post: post
      } as never);
    }
  };

  const handleAuthorPress = (post: TrendingPost) => {
    navigation.navigate(
      'UserProfile' as never,
      {wallet: post.authorWallet} as never,
    );
  };

  const handleBookmark = async (postId: string) => {
    await bookmarkPost(postId);
  };

  const handleShare = (post: TrendingPost) => {
    recordInteraction({
      type: 'share',
      targetId: post.id,
      targetType: 'post',
      timestamp: new Date().toISOString(),
    });
    // Implement share functionality
  };

  const renderTrendingBadge = (rank: number) => (
    <View className="absolute top-2 right-2 bg-orange-500 rounded-full px-2 py-1 flex-row items-center">
      <TrendingUp size={12} className="text-white" />
      <Text className="text-white text-xs font-bold ml-1">#{rank}</Text>
    </View>
  );

  const renderPostItem = ({item}: {item: TrendingPost}) => (
    <Card className="mb-4 overflow-hidden">
      <TouchableOpacity onPress={() => handlePostPress(item)}>
        {/* Author Header */}
        <View className="flex-row items-center p-4 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => handleAuthorPress(item)}
            className="flex-row items-center flex-1">
            <Avatar
              source={{uri: item.author.avatar}}
              fallback={item.author.displayName[0]}
              size="sm"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900">
                  {item.author.displayName}
                </Text>
                {item.author.isVerified && (
                  <View className="ml-1 w-4 h-4 bg-blue-500 rounded-full" />
                )}
              </View>
              <Text className="text-sm text-gray-600">
                @{item.author.username} · {formatDistanceToNow(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
          {item.trendingRank <= 10 && renderTrendingBadge(item.trendingRank)}
        </View>

        {/* Content */}
        <View className="p-4">
          <Text className="text-gray-900 leading-relaxed">{item.content}</Text>

          {/* Tags */}
          {item.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {item.tags.map(tag => (
                <Text key={tag} className="text-blue-500 mr-2">
                  #{tag}
                </Text>
              ))}
            </View>
          )}

          {/* Media Preview */}
          {item.mediaUrls.length > 0 && (
            <View className="mt-3">
              {item.mediaType === 'image' && (
                <Image
                  source={{uri: item.mediaUrls[0]}}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              )}
              {item.mediaUrls.length > 1 && (
                <View className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1">
                  <Text className="text-white text-xs">
                    +{item.mediaUrls.length - 1}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Engagement Stats */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Eye size={16} className="text-gray-500" />
              <Text className="ml-1 text-sm text-gray-600">
                {formatNumber(item.viewCount)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TrendingUp size={16} className="text-orange-500" />
              <Text className="ml-1 text-sm text-orange-600 font-medium">
                +{item.velocityScore}%
              </Text>
            </View>
            <Text className="text-sm text-gray-600">
              Score: {formatNumber(item.trendingScore)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-100">
          <TouchableOpacity className="flex-row items-center">
            <Heart
              size={20}
              className={item.userVoted ? 'text-red-500' : 'text-gray-500'}
              fill={item.userVoted ? '#EF4444' : 'none'}
            />
            <Text className="ml-1 text-sm text-gray-700">
              {formatNumber(item.voteScore)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center">
            <MessageCircle size={20} className="text-gray-500" />
            <Text className="ml-1 text-sm text-gray-700">
              {formatNumber(item.commentCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleShare(item)}
            className="flex-row items-center">
            <Share2 size={20} className="text-gray-500" />
            <Text className="ml-1 text-sm text-gray-700">
              {formatNumber(item.shareCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleBookmark(item.id)}
            className="flex-row items-center">
            <Bookmark
              size={20}
              className={
                item.userBookmarked ? 'text-blue-500' : 'text-gray-500'
              }
              fill={item.userBookmarked ? '#3B82F6' : 'none'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading && posts.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading trending posts...</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <TrendingUp size={48} className="text-gray-300" />
        <Text className="mt-4 text-gray-600 text-center">
          No trending posts available
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          Check back later for trending content
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPostItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{padding: 16}}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={loading || false}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Trending Posts
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Most engaging content right now
          </Text>
        </View>
      }
    />
  );
};
