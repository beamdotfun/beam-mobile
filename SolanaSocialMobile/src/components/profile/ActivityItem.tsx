import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {formatDistanceToNow} from 'date-fns';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Coins,
  UserPlus,
  Building2,
  Heart,
} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Card, CardContent} from '../ui/card';
import {useThemeStore} from '../../store/themeStore';
import {UserActivity} from '../../types/profile';

interface ActivityItemProps {
  activity: UserActivity;
  onPress?: () => void;
}

export function ActivityItem({activity, onPress}: ActivityItemProps) {
  const {colors} = useThemeStore();

  const getActivityIcon = () => {
    const iconSize = 16;
    const iconColor = colors.mutedForeground;

    switch (activity.type) {
      case 'post':
        return <MessageSquare size={iconSize} color={iconColor} />;
      case 'vote':
        return activity.data.voteType === 'upvote' ? (
          <ThumbsUp size={iconSize} color={colors.upvote} />
        ) : (
          <ThumbsDown size={iconSize} color={colors.downvote} />
        );
      case 'tip':
        return <Coins size={iconSize} color={colors.tip} />;
      case 'follow':
        return <UserPlus size={iconSize} color={iconColor} />;
      case 'brand_action':
        return <Building2 size={iconSize} color={colors.brand} />;
      default:
        return <Heart size={iconSize} color={iconColor} />;
    }
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'post':
        return {
          primary: 'Created a new post',
          secondary: activity.data.message?.slice(0, 60) + '...',
        };
      case 'vote':
        return {
          primary: `${
            activity.data.voteType === 'upvote' ? 'Upvoted' : 'Downvoted'
          } a user`,
          secondary: `${activity.data.targetUser?.name || 'Anonymous User'}`,
        };
      case 'tip':
        return {
          primary: `Sent ${activity.data.amount} SOL tip`,
          secondary: `To ${
            activity.data.receiverUser?.name || 'Anonymous User'
          }`,
        };
      case 'follow':
        return {
          primary: 'Started following',
          secondary: activity.data.followedUser?.name || 'Anonymous User',
        };
      case 'brand_action':
        return {
          primary: activity.data.action || 'Brand activity',
          secondary: activity.data.brandName || 'Brand',
        };
      default:
        return {
          primary: 'Activity',
          secondary: '',
        };
    }
  };

  const {primary, secondary} = getActivityText();
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  return (
    <Pressable onPress={onPress}>
      <Card className="mx-4 mb-2">
        <CardContent className="p-3">
          <View className="flex-row items-start space-x-3">
            {/* Activity Icon */}
            <View className="w-8 h-8 bg-muted rounded-full items-center justify-center mt-1">
              {getActivityIcon()}
            </View>

            {/* Activity Content */}
            <View className="flex-1">
              <Text className="text-foreground font-medium text-sm">
                {primary}
              </Text>

              {secondary && (
                <Text className="text-muted-foreground text-sm mt-1">
                  {secondary}
                </Text>
              )}

              <Text className="text-muted-foreground text-xs mt-2">
                {timeAgo}
              </Text>
            </View>

            {/* Activity Badge */}
            {activity.type === 'vote' && (
              <Badge
                variant={
                  activity.data.voteType === 'upvote'
                    ? 'success'
                    : 'destructive'
                }
                className="mt-1">
                <Text className="text-xs">
                  {activity.data.voteType === 'upvote' ? '+1' : '-1'}
                </Text>
              </Badge>
            )}

            {activity.type === 'tip' && (
              <Badge variant="secondary" className="mt-1">
                <Text className="text-xs text-tip">
                  {activity.data.amount} SOL
                </Text>
              </Badge>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
