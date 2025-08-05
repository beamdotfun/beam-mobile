import React, {useEffect, useState} from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import {Activity, Users, Zap, Filter, Eye} from 'lucide-react-native';
import {useActivityNotificationStore} from '../../stores/activityNotificationStore';
import {
  LiveActivityItem,
  ActivityType,
} from '../../types/activity-notifications';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {Text} from '../ui/text';
import {Badge} from '../ui/badge';
import {LoadingSpinner} from '../ui/loading-spinner';
import {Avatar} from '../ui/avatar';
import {cn} from '../../lib/utils';

interface LiveActivityFeedProps {
  variant?: 'full' | 'compact';
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  variant = 'full',
  maxItems = 50,
  showFilters = true,
  autoRefresh = true,
}) => {
  const {notificationSystem, isLoading, fetchLiveActivity} =
    useActivityNotificationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'relevant' | 'following'>('all');

  useEffect(() => {
    fetchLiveActivity();

    if (autoRefresh) {
      const interval = setInterval(fetchLiveActivity, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveActivity();
    setRefreshing(false);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'post_created': return '📝';
      case 'post_voted': return '🗳️';
      case 'user_tipped': return '💰';
      case 'user_followed': return '👥';
      case 'achievement_earned': return '🏆';
      case 'verification_completed': return '✅';
      case 'milestone_reached': return '🎯';
      case 'platform_joined': return '🎉';
      default:
        return '⚡';
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'post_created': return '#3B82F6';
      case 'post_voted': return '#8B5CF6';
      case 'user_tipped': return '#10B981';
      case 'user_followed': return '#F59E0B';
      case 'achievement_earned': return '#EF4444';
      case 'verification_completed': return '#059669';
      case 'milestone_reached': return '#DC2626';
      case 'platform_joined': return '#7C3AED';
      default:
        return '#6B7280';
    }
  };

  const getFilteredActivity = () => {
    if (!notificationSystem?.liveActivityFeed) {return [];}

    let filtered = notificationSystem.liveActivityFeed;

    switch (selectedFilter) {
      case 'relevant':
        filtered = filtered.filter(item => item.isRelevantToUser);
        break;
      case 'following':
        // In a real implementation, this would filter by users the current user follows
        filtered = filtered.filter(item => item.userVerified);
        break;
    }

    return filtered.slice(0, maxItems);
  };

  const filteredActivity = getFilteredActivity();

  if (variant === 'compact') {
    return (
      <View className="space-y-2">
        {filteredActivity.slice(0, 5).map(item => (
          <CompactActivityItem key={item.id} item={item} />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center space-x-2">
          <Activity size={20} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900">
            Live Activity
          </Text>
          <View className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </View>

        {showFilters && (
          <View className="flex-row items-center space-x-2">
            <Badge variant="secondary">
              <Eye size={12} />
              <Text className="text-xs ml-1">{filteredActivity.length}</Text>
            </Badge>
            <Button variant="outline" size="sm">
              <Filter size={14} />
            </Button>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      {showFilters && (
        <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
          {[
            {id: 'all', label: 'All Activity'},
            {id: 'relevant', label: 'For You'},
            {id: 'following', label: 'Following'},
          ].map(filter => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onPress={() => setSelectedFilter(filter.id as any)}>
              <Text
                className={cn(
                  'text-sm',
                  selectedFilter === filter.id ? 'text-white' : 'text-gray-600',
                )}>
                {filter.label}
              </Text>
            </Button>
          ))}
        </View>
      )}

      {/* Activity Feed */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {isLoading && filteredActivity.length === 0 ? (
          <View className="items-center py-8">
            <LoadingSpinner size="large" />
            <Text className="mt-4 text-gray-600">Loading live activity...</Text>
          </View>
        ) : filteredActivity.length > 0 ? (
          <View className="space-y-3">
            {filteredActivity.map(item => (
              <FullActivityItem key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View className="items-center py-16">
            <Activity size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4">No activity right now</Text>
            <Text className="text-sm text-gray-500 text-center mt-2">
              Check back in a few minutes for new updates
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Compact Activity Item
const CompactActivityItem: React.FC<{
  item: LiveActivityItem;
}> = ({item}) => {
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60),

    if (diffInMinutes < 1) {return "now";}
    if (diffInMinutes < 60) {return `${diffInMinutes}m`;}
    if (diffInMinutes < 1440) {return `${Math.floor(diffInMinutes / 60)}h`;}
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Card className="p-3 bg-white">
      <View className="flex-row items-center space-x-3">
        <Avatar
          src={item.userAvatar}
          fallback={item.userName.slice(0, 1).toUpperCase()}
          size="sm"
        />

        <View className="flex-1">
          <View className="flex-row items-center space-x-1">
            <Text className="font-medium text-gray-900" numberOfLines={1}>
              {item.userName}
            </Text>
            {item.userVerified && (
              <View className="w-3 h-3 bg-blue-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {item.action} {item.description}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-lg">{item.activityIcon}</Text>
          <Text className="text-xs text-gray-500">
            {timeAgo(item.timestamp)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

// Full Activity Item
const FullActivityItem: React.FC<{
  item: LiveActivityItem;
}> = ({item}) => {
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) {return "Just now";}
    if (diffInMinutes < 60) {return `${diffInMinutes} minutes ago`;}
    if (diffInHours < 24) {return `${diffInHours} hours ago`;}
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        'p-4 bg-white',
        item.isRelevantToUser && 'border-l-4 border-l-blue-500',
      )}>
      <View className="flex-row items-start space-x-3">
        {/* Activity Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{backgroundColor: `${item.activityColor}20`}}>
          <Text className="text-lg">{item.activityIcon}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center space-x-2 mb-1">
            <Avatar
              src={item.userAvatar}
              fallback={item.userName.slice(0, 1).toUpperCase()}
              size="xs"
            />
            <Text className="font-medium text-gray-900">{item.userName}</Text>
            {item.userVerified && (
              <View className="w-4 h-4 bg-blue-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
            <Text className="text-xs text-gray-500">
              {timeAgo(item.timestamp)}
            </Text>
          </View>

          <Text className="text-gray-700 mb-2">
            {item.action} {item.description}
          </Text>

          {/* Content Preview */}
          {item.contentPreview && (
            <View className="p-3 bg-gray-50 rounded-lg mb-2">
              <Text className="text-sm text-gray-600" numberOfLines={2}>
                {item.contentPreview}
              </Text>
            </View>
          )}

          {/* Interaction Button */}
          {item.userCanInteract && (
            <Button variant="outline" size="sm" className="self-start">
              <Text className="text-sm">View</Text>
            </Button>
          )}
        </View>

        {/* Relevance Indicator */}
        {item.isRelevantToUser && (
          <Badge variant="secondary" className="bg-blue-100">
            <Text className="text-xs text-blue-700">For You</Text>
          </Badge>
        )}
      </View>
    </Card>
  );
};
