import React from 'react';
import {View, Text, Image, Pressable} from 'react-native';
import {X} from 'lucide-react-native';
import {QuotedPostData} from '../../types/post-creation';
import {useThemeStore} from '../../store/themeStore';
import {formatDistanceToNow} from 'date-fns';

interface QuotedPostPreviewProps {
  quotedPost: QuotedPostData;
  onRemove?: () => void;
}

export function QuotedPostPreview({
  quotedPost,
  onRemove,
}: QuotedPostPreviewProps) {
  const {colors} = useThemeStore();

  return (
    <View
      className="border rounded-lg p-3"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.muted,
      }}>
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center flex-1">
          {quotedPost.author.avatar ? (
            <Image
              source={{uri: quotedPost.author.avatar}}
              className="w-6 h-6 rounded-full mr-2"
              style={{backgroundColor: colors.border}}
            />
          ) : (
            <View
              className="w-6 h-6 rounded-full mr-2"
              style={{backgroundColor: colors.border}}
            />
          )}
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap">
              <Text
                className="font-medium text-sm"
                style={{color: colors.foreground}}>
                {quotedPost.author.displayName}
              </Text>
              <Text
                className="text-xs ml-1"
                style={{color: colors.mutedForeground}}>
                @{quotedPost.author.username}
              </Text>
              <Text
                className="text-xs ml-2"
                style={{color: colors.mutedForeground}}>
                ·{' '}
                {formatDistanceToNow(new Date(quotedPost.createdAt), {
                  addSuffix: true,
                })}
              </Text>
            </View>
          </View>
        </View>
        {onRemove && (
          <Pressable
            onPress={onRemove}
            className="p-1 ml-2"
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <Text
        className="text-sm mb-2"
        style={{color: colors.foreground}}
        numberOfLines={3}>
        {quotedPost.content}
      </Text>

      {/* Media Preview */}
      {quotedPost.mediaPreview && (
        <Image
          source={{uri: quotedPost.mediaPreview}}
          className="w-full h-20 rounded-lg"
          style={{backgroundColor: colors.border}}
          resizeMode="cover"
        />
      )}
    </View>
  );
}
