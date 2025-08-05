import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  BarChart,
  Download,
  RefreshCw,
} from 'lucide-react-native';
import {formatDistanceToNow} from 'date-fns';
import {useEnhancedProfileStore} from '../../store/profile-enhanced';
import {useThemeStore} from '../../store/themeStore';
import {formatNumber} from '../../utils/formatting';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {cn} from '../../utils/cn';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

// Simple segmented control component
function SegmentedControl({
  values,
  selectedValue,
  onValueChange,
  className,
}: {
  values: {label: string; value: string}[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const {colors} = useThemeStore();

  return (
    <View className={cn('flex-row bg-muted rounded-lg p-1', className)}>
      {values.map(item => (
        <Pressable
          key={item.value}
          onPress={() => onValueChange(item.value)}
          className={cn(
            'flex-1 py-2 px-3 rounded-md',
            selectedValue === item.value && 'bg-background',
          )}>
          <Text
            className={cn(
              'text-center text-sm font-medium',
              selectedValue === item.value
                ? 'text-foreground'
                : 'text-muted-foreground',
            )}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Simple line chart component
function SimpleLineChart({
  data,
  height = 200,
  color,
}: {
  data: {timestamp: string; value: number}[];
  height?: number;
  color: string;
}) {
  if (data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <View style={{height}} className="flex-row items-end">
      {data.map((item, index) => {
        const barHeight = ((item.value - minValue) / range) * height * 0.8;
        return (
          <View
            key={index}
            className="flex-1 items-center justify-end"
            style={{height}}>
            <View
              style={{
                height: barHeight,
                backgroundColor: color,
                opacity: 0.8,
              }}
              className="w-full mx-0.5 rounded-t"
            />
            <Text className="text-xs text-muted-foreground mt-1">
              {new Date(item.timestamp).getDate()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProfileAnalytics() {
  const {colors} = useThemeStore();
  const navigation = useNavigation();
  const {
    analytics,
    isLoadingAnalytics,
    analyticsError,
    loadAnalytics,
    exportAnalytics,
    refreshAnalytics,
    getProfileInsights,
  } = useEnhancedProfileStore();

  const [selectedPeriod, setSelectedPeriod] = useState<
    '24h' | '7d' | '30d' | 'all'
  >('7d');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const url = await exportAnalytics(format);
      // Handle download URL - in a real app, this would open the download
      console.log('Export URL:', url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const insights = getProfileInsights();

  if (isLoadingAnalytics && !analytics) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (analyticsError) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-destructive mb-4">{analyticsError}</Text>
        <Button onPress={() => loadAnalytics(selectedPeriod)}>
          <Text className="text-primary-foreground">Retry</Text>
        </Button>
      </View>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">Analytics</Text>
          <View className="flex-row space-x-2">
            <Pressable
              onPress={refreshAnalytics}
              className="p-2"
              disabled={isLoadingAnalytics}>
              <RefreshCw
                size={20}
                color={colors.foreground}
                className={isLoadingAnalytics ? 'animate-spin' : ''}
              />
            </Pressable>
            <Pressable
              onPress={() => handleExport('pdf')}
              className="p-2"
              disabled={isExporting}>
              <Download size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* Period Selector */}
        <SegmentedControl
          values={[
            {label: '24h', value: '24h'},
            {label: '7 days', value: '7d'},
            {label: '30 days', value: '30d'},
            {label: 'All time', value: 'all'},
          ]}
          selectedValue={selectedPeriod}
          onValueChange={value => setSelectedPeriod(value as any)}
          className="mb-6"
        />

        {/* Overview Cards */}
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Eye size={20} color={colors.primary} />
                {analytics.overview.reputationTrend === 'up' ? (
                  <TrendingUp size={16} color={colors.success} />
                ) : analytics.overview.reputationTrend === 'down' ? (
                  <TrendingDown size={16} color={colors.destructive} />
                ) : null}
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {formatNumber(analytics.overview.totalViews)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Profile Views
              </Text>
            </Card>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Users size={20} color={colors.primary} />
                <Text
                  className={cn(
                    'text-sm',
                    analytics.overview.followerGrowth > 0
                      ? 'text-success'
                      : 'text-destructive',
                  )}>
                  {analytics.overview.followerGrowth > 0 ? '+' : ''}
                  {analytics.overview.followerGrowth}%
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {formatNumber(analytics.overview.uniqueVisitors)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Unique Visitors
              </Text>
            </Card>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Heart size={20} color={colors.primary} />
                <BarChart size={16} color={colors.muted} />
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {analytics.overview.engagementRate}%
              </Text>
              <Text className="text-sm text-muted-foreground">
                Engagement Rate
              </Text>
            </Card>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <TrendingUp size={20} color={colors.primary} />
                <Text className="text-sm text-muted-foreground">
                  Best: {analytics.content.bestPostingTime}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {formatNumber(analytics.content.contentReach)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Content Reach
              </Text>
            </Card>
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Insights
            </Text>
            {insights.map((insight, index) => (
              <Card key={index} className="p-4 mb-3">
                <View className="flex-row items-start">
                  <View
                    className={cn(
                      'w-2 h-2 rounded-full mt-2 mr-3',
                      insight.type === 'positive'
                        ? 'bg-success'
                        : insight.type === 'negative'
                        ? 'bg-destructive'
                        : 'bg-muted',
                    )}
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground mb-1">
                      {insight.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {insight.description}
                    </Text>
                    {insight.value && (
                      <Text className="text-lg font-bold text-foreground mt-2">
                        {insight.value}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Follower Growth Chart */}
        {analytics.metrics.followers.length > 0 && (
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Follower Growth
            </Text>
            <SimpleLineChart
              data={analytics.metrics.followers.slice(-7)}
              height={200}
              color={colors.primary}
            />
          </Card>
        )}

        {/* Top Posts */}
        {analytics.content.topPosts.length > 0 && (
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Top Performing Posts
            </Text>
            {analytics.content.topPosts.slice(0, 5).map((post, index) => (
              <Pressable
                key={post.postId}
                onPress={() =>
                  navigation.navigate('PostDetail' as any, {
                    postId: post.postId,
                  })
                }
                className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
                <View className="flex-1 mr-4">
                  <Text className="text-sm text-foreground" numberOfLines={2}>
                    {post.content}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(post.timestamp), {
                      addSuffix: true,
                    })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-foreground">
                    {formatNumber(post.engagement)} engagements
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatNumber(post.views)} views
                  </Text>
                </View>
              </Pressable>
            ))}
          </Card>
        )}

        {/* Audience Insights */}
        {analytics.audience && (
          <Card className="p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Audience Insights
            </Text>

            {/* Top Locations */}
            {analytics.audience.topLocations.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Top Locations
                </Text>
                {analytics.audience.topLocations
                  .slice(0, 5)
                  .map((location, index) => (
                    <View
                      key={index}
                      className="flex-row items-center justify-between py-2">
                      <Text className="text-sm text-foreground">
                        {location.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {location.percentage}%
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Common Interests */}
            {analytics.audience.commonInterests.length > 0 && (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Common Interests
                </Text>
                <View className="flex-row flex-wrap">
                  {analytics.audience.commonInterests.map((interest, index) => (
                    <View
                      key={index}
                      className="bg-muted rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-xs text-foreground">
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
