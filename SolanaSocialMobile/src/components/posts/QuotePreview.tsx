import React from 'react';
import {View, Text, Image} from 'react-native';
import {QuoteablePost} from '../../types/post-quoting';
import {formatDistanceToNow} from '../../utils/date';
import {CheckCircle} from 'lucide-react-native';

interface QuotePreviewProps {
  post: QuoteablePost;
  nested?: boolean;
  maxDepth?: number;
}

export const QuotePreview: React.FC<QuotePreviewProps> = ({
  post,
  nested = false,
  maxDepth = 2,
}) => {
  const showNestedQuote = nested && post.isQuote && post.quoteDepth < maxDepth;

  return (
    <View
      className={`border border-gray-200 rounded-lg p-3 ${
        nested ? 'bg-gray-50' : 'bg-white'
      }`}>
      {/* Author Info */}
      <View className="flex-row items-center mb-2">
        <Image
          source={{uri: post.author.avatar || 'https://via.placeholder.com/32'}}
          className="w-8 h-8 rounded-full bg-gray-300 mr-2"
        />
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-medium text-sm">
              {post.author.displayName || post.author.username}
            </Text>
            {post.author.verificationLevel === 'verified' && (
              <CheckCircle size={16} color="#3B82F6" className="ml-1" />
            )}
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-xs">
              @{post.author.username}
            </Text>
            <Text className="text-gray-500 text-xs ml-2">
              {formatDistanceToNow(new Date(post.timestamp))}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <Text className="text-sm text-gray-700 mb-2">{post.content}</Text>

      {/* Media Preview */}
      {post.preview?.hasMedia && (
        <View className="w-full h-24 rounded-lg bg-gray-200 mb-2 flex items-center justify-center">
          <Text className="text-gray-500 text-xs">Media content</Text>
        </View>
      )}

      {/* Nested Quote */}
      {showNestedQuote && post.quotedPost && (
        <View className="mt-2">
          <QuotePreview
            post={post.quotedPost}
            nested={true}
            maxDepth={maxDepth}
          />
        </View>
      )}

      {/* Quote Depth Indicator */}
      {post.quoteDepth >= maxDepth && post.quotedPost && (
        <View className="mt-2 p-2 bg-gray-100 rounded border-l-2 border-gray-300">
          <Text className="text-xs text-gray-500">
            Quoting @{post.quotedPost.author.username}:{' '}
            {post.quotedPost.content.substring(0, 50)}...
          </Text>
        </View>
      )}

      {/* Engagement Stats */}
      <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          {post.engagement.likes} votes
        </Text>
        <Text className="text-xs text-gray-500 ml-4">
          {post.engagement.quotes} quotes
        </Text>
      </View>
    </View>
  );
};
