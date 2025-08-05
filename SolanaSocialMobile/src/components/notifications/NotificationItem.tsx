import React, {useMemo} from 'react';
import {View, Text, Pressable, Alert} from 'react-native';
import {formatDistanceToNow} from 'date-fns';
import {
  Heart,
  MessageCircle,
  Share,
  UserPlus,
  AtSign,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Gavel,
  Trophy,
  TrendingUp,
  Bell,
  AlertTriangle,
  Shield,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {useNotificationStore} from '../../store/notificationStore';
import {useThemeStore} from '../../store/themeStore';
import {BaseNotification, NotificationType} from '../../types/notifications';
import {cn} from '../../utils/cn';

interface NotificationItemProps {
  notification: BaseNotification;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
  showDivider?: boolean;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<any>> = {
  post_like: Heart,
  post_comment: MessageCircle,
  post_share: Share,
  comment_reply: MessageCircle,
  comment_like: Heart,
  user_follow: UserPlus,
  user_mention: AtSign,
  user_tip: DollarSign,
  user_vote: ThumbsUp,
  brand_follow: UserPlus,
  brand_post: Bell,
  auction_bid: Gavel,
  auction_won: Trophy,
  auction_outbid: TrendingUp,
  auction_ended: Gavel,
  system_announcement: Bell,
  system_update: Bell,
  moderation_warning: AlertTriangle,
  moderation_action: Shield,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  post_like: '#ef4444', // red
  post_comment: '#3b82f6', // blue
  post_share: '#10b981', // green
  comment_reply: '#3b82f6', // blue
  comment_like: '#ef4444', // red
  user_follow: '#8b5cf6', // purple
  user_mention: '#f59e0b', // amber
  user_tip: '#10b981', // green
  user_vote: '#6366f1', // indigo
  brand_follow: '#8b5cf6', // purple
  brand_post: '#6366f1', // indigo
  auction_bid: '#f59e0b', // amber
  auction_won: '#10b981', // green
  auction_outbid: '#ef4444', // red
  auction_ended: '#6b7280', // gray
  system_announcement: '#3b82f6', // blue
  system_update: '#6b7280', // gray
  moderation_warning: '#ef4444', // red
  moderation_action: '#dc2626', // red-600
};

export function NotificationItem({
  notification,
  onPress,
  onLongPress,
  selected = false,
  selectionMode = false,
  showDivider = false,
}: NotificationItemProps) {
  const {colors} = useThemeStore();
  const {markAsRead, dismissNotification, deleteNotification, trackEvent} =
    useNotificationStore();

  const IconComponent = NOTIFICATION_ICONS[notification.type];
  const iconColor = NOTIFICATION_COLORS[notification.type];

  const formattedTime = useMemo(() => {
    return formatDistanceToNow(new Date(notification.timestamp), {
      addSuffix: true,
    });
  }, [notification.timestamp]);

  const handlePress = () => {
    if (!notification.read) {
      markAsRead(notification.id);
      trackEvent({
        type: 'notification_read',
        notificationId: notification.id,
        userId: notification.data.userId || '',
        timestamp: Date.now(),
      });
    }

    trackEvent({
      type: 'notification_clicked',
      notificationId: notification.id,
      userId: notification.data.userId || '',
      timestamp: Date.now(),
    });

    onPress?.();
  };

  const handleMarkAsRead = async (e: any) => {
    e.stopPropagation();
    try {
      await markAsRead(notification.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleDismiss = async (e: any) => {
    e.stopPropagation();
    try {
      await dismissNotification(notification.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to dismiss notification');
    }
  };

  const handleDelete = async (e: any) => {
    e.stopPropagation();
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notification.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ],
    );
  };

  const getPriorityBadge = () => {
    switch (notification.priority) {
      case 'urgent':
        return (
          <Badge variant="destructive" className="ml-auto">
            <Text className="text-xs text-white">Urgent</Text>
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="secondary" className="ml-auto">
            <Text className="text-xs">High</Text>
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (!notification.data.actions?.length) {
      return null;
    }

    return (
      <View className="flex-row space-x-2 mt-3">
        {notification.data.actions.map(action => (
          <Button
            key={action.id}
            variant={action.destructive ? 'destructive' : 'outline'}
            size="sm"
            onPress={() => {
              // Handle action - this would integrate with app navigation
              console.log('Action pressed:', action.id);
            }}>
            <Text
              className={cn(
                'text-xs',
                action.destructive ? 'text-white' : 'text-foreground',
              )}>
              {action.title}
            </Text>
          </Button>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => {
    if (selectionMode) {
      return null;
    }

    return (
      <View className="flex-row items-center space-x-1 ml-auto">
        {!notification.read && (
          <Pressable
            onPress={handleMarkAsRead}
            className="p-2 rounded-full"
            style={{backgroundColor: colors.muted}}>
            <Check size={12} color={colors.mutedForeground} />
          </Pressable>
        )}

        {!notification.dismissed && (
          <Pressable
            onPress={handleDismiss}
            className="p-2 rounded-full"
            style={{backgroundColor: colors.muted}}>
            <EyeOff size={12} color={colors.mutedForeground} />
          </Pressable>
        )}

        <Pressable
          onPress={handleDelete}
          className="p-2 rounded-full"
          style={{backgroundColor: colors.muted}}>
          <X size={12} color={colors.destructive} />
        </Pressable>
      </View>
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      className={cn(
        'flex-1 px-4 py-3',
        selected && 'bg-primary/10',
        !notification.read && 'bg-muted/30',
      )}
      style={{
        backgroundColor: selected
          ? `${colors.primary}20`
          : !notification.read
          ? `${colors.muted}30`
          : 'transparent',
      }}>
      <View className="flex-row">
        {/* Selection Indicator */}
        {selectionMode && (
          <View className="mr-3 justify-center">
            <View
              className={cn(
                'w-5 h-5 rounded-full border-2 items-center justify-center',
                selected ? 'border-primary bg-primary' : 'border-border',
              )}>
              {selected && <Check size={12} color="white" />}
            </View>
          </View>
        )}

        {/* Icon */}
        <View className="mr-3 justify-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{backgroundColor: `${iconColor}20`}}>
            <IconComponent size={20} color={iconColor} />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              {/* Sender Info */}
              {notification.senderName && (
                <View className="flex-row items-center mb-1">
                  {notification.senderAvatar && (
                    <Avatar
                      src={notification.senderAvatar}
                      fallback={notification.senderName.charAt(0)}
                      size="sm"
                      className="mr-2"
                    />
                  )}
                  <Text className="text-sm font-medium text-foreground">
                    {notification.senderName}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text
                className={cn(
                  'text-base font-medium mb-1',
                  !notification.read
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                )}>
                {notification.title}
              </Text>

              {/* Body */}
              <Text className="text-sm text-muted-foreground mb-1">
                {notification.body}
              </Text>

              {/* Subtitle */}
              {notification.subtitle && (
                <Text className="text-xs text-muted-foreground mb-2">
                  {notification.subtitle}
                </Text>
              )}

              {/* Media */}
              {notification.imageUrl && (
                <FastImage
                  source={{uri: notification.imageUrl}}
                  className="w-full h-32 rounded-lg mb-2"
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}

              {/* Action Buttons */}
              {renderActionButtons()}

              {/* Timestamp and Category */}
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-xs text-muted-foreground">
                  {formattedTime}
                </Text>

                <View className="flex-row items-center space-x-2">
                  <Badge variant="outline">
                    <Text className="text-xs capitalize">
                      {notification.category}
                    </Text>
                  </Badge>
                  {getPriorityBadge()}
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            {renderQuickActions()}
          </View>

          {/* Unread Indicator */}
          {!notification.read && (
            <View
              className="absolute top-0 left-0 w-2 h-2 rounded-full"
              style={{backgroundColor: colors.primary}}
            />
          )}
        </View>
      </View>

      {/* Divider */}
      {showDivider && (
        <View
          className="absolute bottom-0 left-16 right-4 h-px"
          style={{backgroundColor: colors.border}}
        />
      )}
    </Pressable>
  );
}
