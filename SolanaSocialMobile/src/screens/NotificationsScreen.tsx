import React, {useEffect, useState} from 'react';
import {View, ScrollView, Alert, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  BellOff,
  Settings,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react-native';
import {useActivityNotificationStore} from '../stores/activityNotificationStore';
import {
  ActivityNotification,
  NotificationType,
} from '../types/activity-notifications';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {cn} from '../lib/utils';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    notificationSystem,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    interactWithNotification,
    clearError,
    connectToRealTime,
    disconnectFromRealTime,
  } = useActivityNotificationStore();

  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'mentions'>(
    'all',
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    connectToRealTime();

    return () => {
      disconnectFromRealTime();
    };
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNavigateToSettings = () => {
    navigation.navigate('NotificationSettings' as never);
  };

  const handleNotificationPress = (notification: ActivityNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.deepLink) {
      // Navigate to deep link
      // navigation.navigate(notification.deepLink);
    }

    if (notification.actionData) {
      interactWithNotification(notification.id, 'tap');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_follower':
        return '👥';
      case 'post_liked':
        return '❤️';
      case 'post_commented':
        return '💬';
      case 'post_shared':
        return '🔄';
      case 'mention':
        return '📢';
      case 'tip_received':
        return '💰';
      case 'tip_sent':
        return '💸';
      case 'vote_received':
        return '🗳️';
      case 'verification_complete':
        return '✅';
      case 'moderation_reward':
        return '🛡️';
      case 'social_milestone':
        return '🎉';
      case 'trending_post':
        return '🔥';
      case 'friend_activity':
        return '👫';
      case 'platform_update':
        return '📱';
      default:
        return '🔔';
    }
  };

  const getFilteredNotifications = () => {
    if (!notificationSystem?.notifications) {
      return [];
    }

    let filtered = Array.isArray(notificationSystem?.notifications) 
      ? notificationSystem.notifications 
      : [];

    switch (selectedTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'mentions':
        filtered = filtered.filter(n => n.type === 'mention');
        break;
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  if (isLoading && !notificationSystem) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading notifications...</Text>
      </SafeAreaView>
    );
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-semibold text-gray-900">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Text className="text-sm text-gray-600">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View className="flex-row space-x-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onPress={markAllAsRead}>
                  <CheckCircle2 size={16} color="#6B7280" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onPress={handleNavigateToSettings}>
                <Settings size={16} color="#6B7280" />
              </Button>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row">
            {[
              {
                id: 'all',
                label: 'All',
                count: notificationSystem?.notifications.length || 0,
              },
              {id: 'unread', label: 'Unread', count: unreadCount},
              {
                id: 'mentions',
                label: 'Mentions',
                count:
                  notificationSystem?.notifications.filter(
                    n => n.type === 'mention',
                  ).length || 0,
              },
            ].map(tab => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? 'default' : 'ghost'}
                className={cn(
                  'flex-1 rounded-none',
                  selectedTab === tab.id && 'border-b-2 border-blue-500',
                )}
                onPress={() => setSelectedTab(tab.id as any)}>
                <View className="items-center">
                  <Text
                    className={cn(
                      'text-sm',
                      selectedTab === tab.id
                        ? 'text-white font-medium'
                        : 'text-gray-600',
                    )}>
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <Badge
                      variant={selectedTab === tab.id ? 'secondary' : 'default'}
                      className={cn(
                        'mt-1 min-w-[24px] h-5',
                        selectedTab === tab.id && 'bg-white/20',
                      )}>
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          selectedTab === tab.id ? 'text-white' : 'text-white',
                        )}>
                        {tab.count > 99 ? '99+' : tab.count}
                      </Text>
                    </Badge>
                  )}
                </View>
              </Button>
            ))}
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {filteredNotifications.length > 0 ? (
            <View className="p-4 space-y-3">
              {filteredNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onDismiss={dismissNotification}
                  onInteract={interactWithNotification}
                  getIcon={getNotificationIcon}
                />
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center p-16">
              <BellOff size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-4 text-center text-lg">
                {selectedTab === 'unread'
                  ? 'No unread notifications'
                  : selectedTab === 'mentions'
                  ? 'No mentions yet'
                  : 'No notifications yet'}
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2">
                {selectedTab === 'all'
                  ? "You'll see updates about your posts, followers, and activity here"
                  : 'Check back later for updates'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Notification Card Component
const NotificationCard: React.FC<{
  notification: ActivityNotification;
  onPress: () => void;
  onDismiss: (id: string) => void;
  onInteract: (id: string, action: string) => void;
  getIcon: (type: NotificationType) => string;
}> = ({notification, onPress, onDismiss, onInteract, getIcon}) => {
  const timeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    return notificationDate.toLocaleDateString();
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-red-500';
      case 'high':
        return 'border-orange-500';
      case 'normal':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Card
      className={cn(
        'p-4 bg-white',
        !notification.read && `border-l-4 ${getPriorityColor()}`,
      )}>
      <Button
        variant="ghost"
        className="w-full p-0 h-auto justify-start"
        onPress={onPress}>
        <View className="flex-row items-start space-x-3 w-full">
          {/* Icon */}
          <View
            className={cn(
              'w-10 h-10 rounded-full items-center justify-center',
              !notification.read ? 'bg-blue-100' : 'bg-gray-100',
            )}>
            <Text className="text-lg">{getIcon(notification.type)}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text
              className={cn(
                'font-medium text-gray-900',
                !notification.read && 'font-semibold',
              )}>
              {notification.title}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              {notification.message}
            </Text>

            {/* Related user info */}
            {notification.relatedUserName && (
              <View className="flex-row items-center space-x-1 mt-1">
                <Text className="text-blue-600 text-sm font-medium">
                  @{notification.relatedUserName}
                </Text>
                {notification.groupCount && notification.groupCount > 1 && (
                  <Text className="text-gray-500 text-sm">
                    and {notification.groupCount - 1} others
                  </Text>
                )}
              </View>
            )}

            {/* Action button */}
            {notification.actionText && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 self-start"
                onPress={e => {
                  e.stopPropagation();
                  onInteract(notification.id, 'action');
                }}>
                <Text className="text-sm">{notification.actionText}</Text>
              </Button>
            )}

            {/* Timestamp */}
            <Text className="text-xs text-gray-500 mt-2">
              {timeAgo(notification.createdAt)}
            </Text>
          </View>

          {/* Actions */}
          <View className="items-center">
            <Button
              variant="ghost"
              size="sm"
              onPress={e => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              className="p-1">
              <X size={16} color="#6B7280" />
            </Button>
          </View>
        </View>
      </Button>
    </Card>
  );
};
