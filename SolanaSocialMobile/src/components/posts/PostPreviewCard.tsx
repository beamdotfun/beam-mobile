import React from 'react';
import {View, Text, Image, Pressable} from 'react-native';
import {formatDistanceToNow} from '../../utils/formatting';

interface PostPreview {
  id: string;
  content: string;
  author: {
    wallet: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  mediaPreview?: string;
  voteScore: number;
  quoteCount: number;
}

interface PostPreviewCardProps {
  post: PostPreview;
  compact?: boolean;
  onPress?: () => void;
}

export const PostPreviewCard: React.FC<PostPreviewCardProps> = ({
  post,
  compact = false,
  onPress,
}) => {
  const formatContent = (
    content: string,
    maxLength: number = compact ? 80 : 150,
  ) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View
        className={`${
          compact ? 'p-2' : 'p-3'
        } bg-white rounded-lg border border-gray-100`}>
        {/* Author Info */}
        <View className="flex-row items-center mb-2">
          <View
            className={`${
              compact ? 'w-6 h-6' : 'w-8 h-8'
            } bg-gray-200 rounded-full mr-2`}>
            {post.author.avatar ? (
              <Image
                source={{uri: post.author.avatar}}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                <Text
                  className={`${
                    compact ? 'text-xs' : 'text-sm'
                  } text-gray-600 font-medium`}>
                  {post.author.displayName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text
              className={`${
                compact ? 'text-xs' : 'text-sm'
              } font-medium text-gray-900`}>
              {post.author.displayName}
            </Text>
            <Text
              className={`${compact ? 'text-xs' : 'text-xs'} text-gray-500`}>
              @{post.author.username} • {formatDistanceToNow(post.createdAt)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text
          className={`${compact ? 'text-sm' : 'text-base'} text-gray-800 mb-2`}>
          {formatContent(post.content)}
        </Text>

        {/* Media Preview */}
        {post.mediaPreview && !compact && (
          <View className="mb-2">
            <Image
              source={{uri: post.mediaPreview}}
              className="w-full h-32 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}

        {/* Stats */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Text
                className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                {post.voteScore} votes
              </Text>
            </View>
            {post.quoteCount > 0 && (
              <View className="flex-row items-center">
                <Text
                  className={`${
                    compact ? 'text-xs' : 'text-sm'
                  } text-gray-500`}>
                  {post.quoteCount} quotes
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
