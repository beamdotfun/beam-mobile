import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, Dimensions} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Heart,
  Share,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {useThemeStore} from '../../store/themeStore';
import {useBrandManagementStore} from '../../store/brandManagement';
import {
  BrandAnalytics as BrandAnalyticsType,
  TimeSeriesData,
} from '../../types/brand';
import {formatDistanceToNow} from 'date-fns';

interface BrandAnalyticsProps {
  brandId: string;
}

export function BrandAnalytics({brandId}: BrandAnalyticsProps) {
  const {colors} = useThemeStore();
  const {brandAnalytics, isLoading, fetchBrandAnalytics, exportAnalytics} =
    useBrandManagementStore();
  const [timeframe, setTimeframe] = useState<string>('7d');

  const timeframes = [
    {value: '7d', label: '7 Days'},
    {value: '30d', label: '30 Days'},
    {value: '90d', label: '90 Days'},
    {value: '1y', label: '1 Year'},
  ];

  useEffect(() => {
    fetchBrandAnalytics(brandId, timeframe);
  }, [brandId, timeframe]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await exportAnalytics(brandId, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    suffix = '',
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    suffix?: string;
  }) => (
    <Card className="flex-1">
      <CardContent className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Icon size={20} color={colors.primary} />
          {change !== undefined && (
            <View className="flex-row items-center">
              {change > 0 ? (
                <TrendingUp size={14} color={colors.success} />
              ) : change < 0 ? (
                <TrendingDown size={14} color={colors.destructive} />
              ) : null}
              <Text
                className={`text-xs ml-1 ${
                  change > 0
                    ? 'text-success'
                    : change < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}>
                {change > 0 ? '+' : ''}
                {change}%
              </Text>
            </View>
          )}
        </View>
        <Text className="text-2xl font-bold text-foreground">
          {value.toLocaleString()}
          {suffix}
        </Text>
        <Text className="text-xs text-muted-foreground">{title}</Text>
      </CardContent>
    </Card>
  );

  const EngagementBreakdown = () => {
    if (!brandAnalytics?.engagementBreakdown) {
      return null;
    }

    const {likes, comments, shares, votes, tips} =
      brandAnalytics.engagementBreakdown;
    const total = likes + comments + shares + votes + tips;

    const engagementTypes = [
      {type: 'Likes', count: likes, icon: Heart, color: colors.destructive},
      {
        type: 'Comments',
        count: comments,
        icon: MessageSquare,
        color: colors.primary,
      },
      {type: 'Shares', count: shares, icon: Share, color: colors.success},
      {type: 'Votes', count: votes, icon: TrendingUp, color: colors.warning},
      {type: 'Tips', count: tips, icon: TrendingUp, color: colors.tip},
    ];

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Engagement Breakdown
          </Text>
          <View className="space-y-3">
            {engagementTypes.map(({type, count, icon: Icon, color}) => {
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <View key={type} className="flex-row items-center">
                  <Icon size={16} color={color} />
                  <Text className="text-foreground ml-2 flex-1">{type}</Text>
                  <Text className="text-muted-foreground text-sm">
                    {count} ({percentage.toFixed(1)}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </CardContent>
      </Card>
    );
  };

  const TopPosts = () => {
    if (!brandAnalytics?.topPosts?.length) {
      return null;
    }

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Top Performing Posts
          </Text>
          <View className="space-y-3">
            {brandAnalytics.topPosts.slice(0, 5).map((post, index) => (
              <View key={post.id} className="flex-row">
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3">
                  <Text className="text-primary-foreground text-xs font-bold">
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm" numberOfLines={2}>
                    {post.content}
                  </Text>
                  <View className="flex-row items-center mt-1 space-x-3">
                    <Text className="text-muted-foreground text-xs">
                      {post.engagement} engagements
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    );
  };

  const AudienceInsights = () => {
    if (!brandAnalytics?.audienceInsights?.length) {
      return null;
    }

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Audience Insights
          </Text>
          <View className="space-y-3">
            {brandAnalytics.audienceInsights.map((insight, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between">
                <Text className="text-foreground">{insight.metric}</Text>
                <View className="flex-row items-center">
                  <Text className="text-muted-foreground mr-2">
                    {insight.value}
                  </Text>
                  <Text className="text-primary text-sm">
                    {insight.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    );
  };

  const ContentCategories = () => {
    if (!brandAnalytics?.contentCategories?.length) {
      return null;
    }

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Content Performance by Category
          </Text>
          <View className="space-y-3">
            {brandAnalytics.contentCategories.map(category => (
              <View
                key={category.category}
                className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground capitalize">
                    {category.category}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {category.count} posts
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-foreground font-medium">
                    {category.engagement} engagements
                  </Text>
                  <Badge
                    variant={
                      category.performance > 80
                        ? 'success'
                        : category.performance > 60
                        ? 'default'
                        : 'secondary'
                    }>
                    <Text className="text-xs">
                      {category.performance.toFixed(0)}% performance
                    </Text>
                  </Badge>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && !brandAnalytics) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-muted-foreground">Loading analytics...</Text>
      </View>
    );
  }

  if (!brandAnalytics) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <TrendingUp size={48} color={colors.mutedForeground} />
        <Text className="text-muted-foreground text-center mt-4">
          No analytics data available for this timeframe
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      {/* Timeframe Selector */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {timeframes.map(tf => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'default' : 'outline'}
                size="sm"
                onPress={() => setTimeframe(tf.value)}>
                <Text
                  className={
                    timeframe === tf.value
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                  }>
                  {tf.label}
                </Text>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Key Metrics */}
      <View className="flex-row space-x-2 mb-4">
        <MetricCard
          title="Followers"
          value={
            brandAnalytics.followerGrowth[
              brandAnalytics.followerGrowth.length - 1
            ]?.value || 0
          }
          change={
            brandAnalytics.followerGrowth[
              brandAnalytics.followerGrowth.length - 1
            ]?.change
          }
          icon={Users}
        />
        <MetricCard
          title="Engagement Rate"
          value={brandAnalytics.averageEngagement}
          icon={Heart}
          suffix="%"
        />
      </View>

      <View className="flex-row space-x-2 mb-4">
        <MetricCard
          title="Posts"
          value={
            brandAnalytics.contentGrowth[
              brandAnalytics.contentGrowth.length - 1
            ]?.value || 0
          }
          change={
            brandAnalytics.contentGrowth[
              brandAnalytics.contentGrowth.length - 1
            ]?.change
          }
          icon={MessageSquare}
        />
        <MetricCard
          title="Posting Frequency"
          value={brandAnalytics.posting_frequency}
          icon={TrendingUp}
          suffix="/week"
        />
      </View>

      {/* Engagement Breakdown */}
      <EngagementBreakdown />

      {/* Top Posts */}
      <TopPosts />

      {/* Audience Insights */}
      <AudienceInsights />

      {/* Content Categories */}
      <ContentCategories />

      {/* Best Posting Times */}
      {brandAnalytics.bestPostingTimes.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4 text-foreground">
              Best Posting Times
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {brandAnalytics.bestPostingTimes.map((time, index) => (
                <Badge key={index} variant="secondary">
                  <Text className="text-xs">{time}</Text>
                </Badge>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Export Analytics
          </Text>
          <View className="flex-row space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onPress={() => handleExport('csv')}>
              <Text className="text-muted-foreground">Export CSV</Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onPress={() => handleExport('json')}>
              <Text className="text-muted-foreground">Export JSON</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
