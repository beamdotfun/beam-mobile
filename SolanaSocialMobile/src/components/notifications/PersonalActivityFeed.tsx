import React, {useEffect, useState} from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import {
  TrendingUp,
  Calendar,
  Target,
  Award,
  Users,
  BarChart3,
} from 'lucide-react-native';
import {useActivityNotificationStore} from '../../stores/activityNotificationStore';
import {
  PersonalActivityItem,
  PersonalActivityType,
  ActionItem,
} from '../../types/activity-notifications';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {Text} from '../ui/text';
import {Badge} from '../ui/badge';
import {LoadingSpinner} from '../ui/loading-spinner';
import {cn} from '../../lib/utils';

interface PersonalActivityFeedProps {
  variant?: 'full' | 'compact';
  maxItems?: number;
  showActions?: boolean;
  filterType?: PersonalActivityType | 'all';
}

export const PersonalActivityFeed: React.FC<PersonalActivityFeedProps> = ({
  variant = 'full',
  maxItems = 20,
  showActions = true,
  filterType = 'all',
}) => {
  const {notificationSystem, isLoading} = useActivityNotificationStore();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real implementation, this would fetch personal activity data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getActivityIcon = (type: PersonalActivityType) => {
    switch (type) {
      case 'engagement_summary': return '📊';
      case 'daily_activity': return '📅';
      case 'weekly_recap': return '📈';
      case 'achievement_unlocked': return '🏆';
      case 'goal_progress': return '🎯';
      case 'social_growth': return '👥';
      case 'content_performance': return '📝';
      default:
        return '⭐';
    }
  };

  const getActivityColor = (type: PersonalActivityType) => {
    switch (type) {
      case 'engagement_summary': return '#3B82F6';
      case 'daily_activity': return '#10B981';
      case 'weekly_recap': return '#8B5CF6';
      case 'achievement_unlocked': return '#F59E0B';
      case 'goal_progress': return '#EF4444';
      case 'social_growth': return '#06B6D4';
      case 'content_performance': return '#84CC16';
      default:
        return '#6B7280';
    }
  };

  const getImportanceColor = (importance: 'low' | 'medium' | 'high') => {
    switch (importance) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const formatMetric = (value: number | undefined, type: string): string => {
    if (value === undefined) {return "0";}

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return value.toString();
  };

  const getFilteredActivity = () => {
    if (!notificationSystem?.personalActivityFeed) {return [];}

    let filtered = notificationSystem.personalActivityFeed;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    return filtered
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, maxItems);
  };

  const filteredActivity = getFilteredActivity();

  if (variant === 'compact') {
    return (
      <View className="space-y-3">
        {filteredActivity.slice(0, 3).map(item => (
          <CompactActivityItem key={item.id} item={item} />
        ))}
        {filteredActivity.length > 3 && (
          <Button variant="outline" size="sm" className="self-center">
            <Text className="text-sm">View All Activity</Text>
          </Button>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center space-x-2">
          <TrendingUp size={20} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900">
            Your Activity
          </Text>
        </View>
        <Badge variant="secondary">
          <Text className="text-xs">{filteredActivity.length} items</Text>
        </Badge>
      </View>

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
            <Text className="mt-4 text-gray-600">Loading your activity...</Text>
          </View>
        ) : filteredActivity.length > 0 ? (
          <View className="space-y-4">
            {filteredActivity.map(item => (
              <FullActivityItem
                key={item.id}
                item={item}
                showActions={showActions}
              />
            ))}
          </View>
        ) : (
          <View className="items-center py-16">
            <BarChart3 size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4">No activity data yet</Text>
            <Text className="text-sm text-gray-500 text-center mt-2">
              Your personal activity insights will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Compact Activity Item
const CompactActivityItem: React.FC<{
  item: PersonalActivityItem;
}> = ({item}) => {
  const getActivityIcon = (type: PersonalActivityType) => {
    switch (type) {
      case 'engagement_summary': return '📊';
      case 'daily_activity': return '📅';
      case 'weekly_recap': return '📈';
      case 'achievement_unlocked': return '🏆';
      case 'goal_progress': return '🎯';
      case 'social_growth': return '👥';
      case 'content_performance': return '📝';
      default:
        return '⭐';
    }
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60),

    if (diffInHours < 1) {return "now";}
    if (diffInHours < 24) {return `${diffInHours}h ago`;}
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {return `${diffInDays}d ago`;}
    return activityDate.toLocaleDateString();
  };

  return (
    <Card className="p-3 bg-white">
      <View className="flex-row items-center space-x-3">
        <Text className="text-lg">{getActivityIcon(item.type)}</Text>

        <View className="flex-1">
          <Text className="font-medium text-gray-900" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {item.summary}
          </Text>
        </View>

        <View className="items-end">
          <Badge
            variant={item.importance === 'high' ? 'default' : 'secondary'}
            className="mb-1">
            <Text
              className={cn(
                'text-xs',
                item.importance === 'high' ? 'text-white' : 'text-gray-700',
              )}>
              {item.importance}
            </Text>
          </Badge>
          <Text className="text-xs text-gray-500">
            {timeAgo(item.occurredAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

// Full Activity Item
const FullActivityItem: React.FC<{
  item: PersonalActivityItem;
  showActions: boolean;
}> = ({item, showActions}) => {
  const getActivityIcon = (type: PersonalActivityType) => {
    switch (type) {
      case 'engagement_summary': return '📊';
      case 'daily_activity': return '📅';
      case 'weekly_recap': return '📈';
      case 'achievement_unlocked': return '🏆';
      case 'goal_progress': return '🎯';
      case 'social_growth': return '👥';
      case 'content_performance': return '📝';
      default:
        return '⭐';
    }
  };

  const getActivityColor = (type: PersonalActivityType) => {
    switch (type) {
      case 'engagement_summary': return '#3B82F6';
      case 'daily_activity': return '#10B981';
      case 'weekly_recap': return '#8B5CF6';
      case 'achievement_unlocked': return '#F59E0B';
      case 'goal_progress': return '#EF4444';
      case 'social_growth': return '#06B6D4';
      case 'content_performance': return '#84CC16';
      default:
        return '#6B7280';
    }
  };

  const getImportanceColor = (importance: 'low' | 'medium' | 'high') => {
    switch (importance) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-orange-500';
      case 'low': return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };

  const formatMetric = (value: number | undefined): string => {
    if (value === undefined) {return "0";}

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return value.toString();
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) {return "Just now";}
    if (diffInHours < 24) {return `${diffInHours} hours ago`;}
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {return `${diffInDays} days ago`;}
    return activityDate.toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        'p-4 bg-white',
        item.importance === 'high' && 'border-l-4 border-l-red-500',
      )}>
      <View className="space-y-4">
        {/* Header */}
        <View className="flex-row items-start space-x-3">
          {/* Activity Icon */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{backgroundColor: `${getActivityColor(item.type)}20`}}>
            <Text className="text-xl">{getActivityIcon(item.type)}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-gray-900">
                {item.title}
              </Text>
              <Badge
                variant={item.importance === 'high' ? 'default' : 'secondary'}
                <Text
                  className={cn(
                    'text-xs',
                    item.importance === 'high' ? 'text-white' : 'text-gray-700',
                  )}>
                  {item.importance}
                </Text>
              </Badge>
            </View>

            <Text className="text-gray-700 mb-2">{item.description}</Text>

            <Text className="text-sm text-gray-600">{item.summary}</Text>

            <Text className="text-xs text-gray-500 mt-2">
              {timeAgo(item.occurredAt)}
            </Text>
          </View>
        </View>

        {/* Metrics */}
        {item.metrics && (
          <View className="bg-gray-50 rounded-lg p-3">
            <Text className="text-sm font-medium text-gray-900 mb-2">
              Activity Metrics
            </Text>
            <View className="flex-row flex-wrap gap-4">
              {item.metrics.views !== undefined && (
                <View className="items-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {formatMetric(item.metrics.views)}
                  </Text>
                  <Text className="text-xs text-gray-600">Views</Text>
                </View>
              )}
              {item.metrics.likes !== undefined && (
                <View className="items-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {formatMetric(item.metrics.likes)}
                  </Text>
                  <Text className="text-xs text-gray-600">Likes</Text>
                </View>
              )}
              {item.metrics.comments !== undefined && (
                <View className="items-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {formatMetric(item.metrics.comments)}
                  </Text>
                  <Text className="text-xs text-gray-600">Comments</Text>
                </View>
              )}
              {item.metrics.followers !== undefined && (
                <View className="items-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {formatMetric(item.metrics.followers)}
                  </Text>
                  <Text className="text-xs text-gray-600">Followers</Text>
                </View>
              )}
              {item.metrics.engagement !== undefined && (
                <View className="items-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {(item.metrics.engagement * 100).toFixed(1)}%
                  </Text>
                  <Text className="text-xs text-gray-600">Engagement</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Related Items */}
        {item.relatedItems && item.relatedItems.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-900 mb-2">
              Related Content
            </Text>
            <View className="space-y-2">
              {item.relatedItems.slice(0, 3).map(relatedItem => (
                <View
                  key={relatedItem.id}
                  className="flex-row items-center space-x-2 p-2 bg-gray-50 rounded">
                  <View className="w-6 h-6 bg-blue-100 rounded items-center justify-center">
                    <Text className="text-xs">📄</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-medium text-gray-900"
                      numberOfLines={1}>
                      {relatedItem.title}
                    </Text>
                    {relatedItem.preview && (
                      <Text className="text-xs text-gray-600" numberOfLines={1}>
                        {relatedItem.preview}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {item.relatedItems.length > 3 && (
                <Text className="text-xs text-gray-500 text-center py-1">
                  +{item.relatedItems.length - 3} more items
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Items */}
        {showActions && item.actionItems && item.actionItems.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-900 mb-2">
              Suggested Actions
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {item.actionItems.slice(0, 3).map(action => (
                <ActionButton key={action.id} action={action} />
              ))}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
};

// Action Button Component
const ActionButton: React.FC<{
  action: ActionItem;
}> = ({action}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'navigate': return '🔗';
      case 'create': return '✏️';
      case 'interact': return '👍';
      case 'share': return '🔄';
      default:
        return '⚡';
    }
  };

  const getVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'default';
      case 'medium': return 'outline';
      case 'low': return 'ghost';
      default:
        return 'outline';
    }
  };

  return (
    <Button
      variant={getVariant(action.priority) as any}
      size="sm"
      className="flex-row items-center">
      <Text className="mr-1">{getActionIcon(action.actionType)}</Text>
      <Text className="text-sm">{action.title}</Text>
    </Button>
  );
};
