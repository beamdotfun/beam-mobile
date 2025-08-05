import React, {useState} from 'react';
import {View, FlatList, TouchableOpacity, Image} from 'react-native';
import {Text, Card, Badge, Button} from '../ui';
import {
  TrendingUp,
  MessageSquare,
  Heart,
  DollarSign,
  Clock,
  Hash,
  Flame,
  BarChart3,
  Calendar,
  Share,
} from 'lucide-react-native';
import {ContentAnalytics, PostPerformance} from '../../types/analytics';

interface ContentPerformanceProps {
  analytics?: ContentAnalytics;
}

export function ContentPerformance({analytics}: ContentPerformanceProps) {
  const [activeTab, setActiveTab] = useState<
    'top' | 'recent' | 'hashtags' | 'times'
  >('top');

  if (!analytics) {
    return (
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-2">Content Performance</Text>
        <View className="h-48 justify-center items-center bg-muted/20 rounded-lg">
          <Text className="text-center text-muted-foreground">
            No content data available
          </Text>
        </View>
      </Card>
    );
  }

  const tabs = [
    {id: 'top', label: 'Top Posts', icon: TrendingUp},
    {id: 'recent', label: 'Recent', icon: Calendar},
    {id: 'hashtags', label: 'Hashtags', icon: Hash},
    {id: 'times', label: 'Best Times', icon: Clock},
  ] as const;

  const renderPostItem = ({item}: {item: PostPerformance}) => (
    <Card className="p-4 mb-3">
      <View className="flex-row">
        {item.thumbnail && (
          <Image
            source={{uri: item.thumbnail}}
            className="w-16 h-16 rounded-lg mr-3"
            resizeMode="cover"
          />
        )}

        <View className="flex-1">
          <Text className="font-medium mb-2" numberOfLines={2}>
            {item.content}
          </Text>

          {/* Metrics Row */}
          <View className="flex-row items-center flex-wrap gap-4 mb-3">
            <View className="flex-row items-center gap-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                {item.metrics.views.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Heart className="h-4 w-4 text-pink-500" />
              <Text className="text-sm text-muted-foreground">
                {item.metrics.upvotes}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <Text className="text-sm text-muted-foreground">
                {item.metrics.comments}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Share className="h-4 w-4 text-green-500" />
              <Text className="text-sm text-muted-foreground">
                {item.metrics.shares}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <Text className="text-sm text-muted-foreground">
                {item.metrics.tipAmount.toFixed(3)}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            <Badge
              variant={
                item.trend === 'viral'
                  ? 'default'
                  : item.trend === 'rising'
                  ? 'secondary'
                  : 'outline'
              }
              className={`${
                item.trend === 'viral'
                  ? 'bg-red-500'
                  : item.trend === 'rising'
                  ? 'bg-orange-500'
                  : item.trend === 'steady'
                  ? 'bg-blue-500'
                  : 'bg-gray-500'
              }`}>
              <View className="flex-row items-center">
                {item.trend === 'viral' && <Flame className="h-3 w-3 mr-1" />}
                <Text className="text-xs text-white capitalize">
                  {item.trend}
                </Text>
              </View>
            </Badge>

            <Text className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Virality Score */}
          {item.viralityScore > 50 && (
            <View className="mt-2 p-2 bg-orange-50 rounded-lg">
              <Text className="text-xs text-orange-700">
                Virality Score: {item.viralityScore.toFixed(0)}/100
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  const renderHashtagItem = ({item}: {item: any}) => (
    <Card className="p-3 mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-medium">#{item.tag}</Text>
          <Text className="text-sm text-muted-foreground">
            {item.uses} uses • {item.totalViews.toLocaleString()} views
          </Text>
        </View>
        <View className="items-end">
          <Badge
            variant="outline"
            className={`${
              item.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
            <Text className="text-xs">
              {item.growth >= 0 ? '+' : ''}
              {item.growth.toFixed(1)}%
            </Text>
          </Badge>
          <Text className="text-xs text-muted-foreground mt-1">
            {item.avgEngagement.toFixed(1)} avg engagement
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderBestTimesContent = () => (
    <View>
      {/* Best Posting Times */}
      <Card className="p-4 mb-4">
        <Text className="font-semibold mb-3">Best Times to Post</Text>
        <View className="space-y-3">
          {analytics.bestPostingTimes.slice(0, 5).map((time, index) => (
            <View
              key={`${time.day}-${time.hour}`}
              className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full">
                  <Text className="text-xs">#{index + 1}</Text>
                </Badge>
                <View>
                  <Text className="font-medium">
                    {time.day} at {time.hour}:00
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {time.averageViews.toLocaleString()} avg views
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="font-semibold text-green-600">
                  {(time.engagementRate * 100).toFixed(1)}%
                </Text>
                <Text className="text-xs text-muted-foreground">
                  engagement
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Content Type Performance */}
      <Card className="p-4">
        <Text className="font-semibold mb-3">Performance by Content Type</Text>
        <View className="space-y-4">
          {Object.entries(analytics.byType).map(([type, metrics]) => (
            <View key={type} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium capitalize">{type}</Text>
                <Text className="text-sm text-muted-foreground">
                  {metrics.count} posts • {metrics.totalViews.toLocaleString()}{' '}
                  views
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-semibold">
                  {metrics.avgEngagement.toFixed(1)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  avg engagement
                </Text>
                <Badge variant={metrics.trend > 0 ? 'default' : 'secondary'}>
                  <Text className="text-xs">
                    {metrics.trend > 0 ? '+' : ''}
                    {metrics.trend.toFixed(1)}%
                  </Text>
                </Badge>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'top':
        return (
          <FlatList
            data={analytics.topPosts}
            renderItem={renderPostItem}
            keyExtractor={item => item.postId}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text className="text-center text-muted-foreground py-8">
                No posts available
              </Text>
            }
          />
        );

      case 'recent':
        return (
          <FlatList
            data={analytics.topPosts.slice().reverse()}
            renderItem={renderPostItem}
            keyExtractor={item => item.postId}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text className="text-center text-muted-foreground py-8">
                No recent posts
              </Text>
            }
          />
        );

      case 'hashtags':
        return (
          <FlatList
            data={analytics.topHashtags}
            renderItem={renderHashtagItem}
            keyExtractor={item => item.tag}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text className="text-center text-muted-foreground py-8">
                No hashtag data available
              </Text>
            }
          />
        );

      case 'times':
        return renderBestTimesContent();

      default:
        return null;
    }
  };

  return (
    <View>
      {/* Content Stats Summary */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        <Card className="flex-1 p-4 min-w-[140px]">
          <View className="flex-row items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <Text className="text-sm font-medium">Total Views</Text>
          </View>
          <Text className="text-2xl font-bold text-blue-600">
            {analytics.topPosts
              .reduce((sum, post) => sum + post.metrics.views, 0)
              .toLocaleString()}
          </Text>
        </Card>

        <Card className="flex-1 p-4 min-w-[140px]">
          <View className="flex-row items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <Text className="text-sm font-medium">Total Likes</Text>
          </View>
          <Text className="text-2xl font-bold text-pink-600">
            {analytics.topPosts
              .reduce((sum, post) => sum + post.metrics.upvotes, 0)
              .toLocaleString()}
          </Text>
        </Card>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row mb-4">
        <View className="flex-row bg-muted rounded-lg p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`mr-1 ${isActive ? '' : 'bg-transparent'}`}
                onPress={() => setActiveTab(tab.id)}>
                <Icon className="h-4 w-4 mr-1" />
                <Text
                  className={`text-xs ${
                    isActive ? 'text-white' : 'text-muted-foreground'
                  }`}>
                  {tab.label}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
}
