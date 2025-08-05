import React from 'react';
import {View} from 'react-native';
import {Text, Card} from '../ui';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Star,
  DollarSign,
  Heart,
  MessageSquare,
} from 'lucide-react-native';
import {UserAnalytics} from '../../types/analytics';

interface OverviewCardsProps {
  analytics: UserAnalytics | null;
}

interface OverviewCard {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

export function OverviewCards({analytics}: OverviewCardsProps) {
  if (!analytics) {
    return (
      <View className="mb-6">
        <View className="flex-row flex-wrap -mx-2">
          {[1, 2, 3, 4].map(i => (
            <View key={i} className="w-1/2 px-2 mb-4">
              <Card className="p-4 h-24">
                <View className="h-full justify-center items-center bg-muted/20 rounded">
                  <Text className="text-xs text-muted-foreground">
                    Loading...
                  </Text>
                </View>
              </Card>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const cards: OverviewCard[] = [
    {
      title: 'Followers',
      value: analytics.overview.followers.toLocaleString(),
      change: '+12%', // This would be calculated from comparison data
      trend: 'up',
      icon: Users,
      color: 'text-blue-500',
      description: 'Total followers',
    },
    {
      title: 'Total Posts',
      value: analytics.overview.totalPosts.toLocaleString(),
      change: '+8',
      trend: 'up',
      icon: FileText,
      color: 'text-green-500',
      description: 'Published posts',
    },
    {
      title: 'Engagement',
      value: analytics.overview.totalEngagement.toLocaleString(),
      change: '+15%',
      trend: 'up',
      icon: Heart,
      color: 'text-pink-500',
      description: 'Total interactions',
    },
    {
      title: 'Reputation',
      value: analytics.overview.reputationScore.toLocaleString(),
      change: '+5%',
      trend: 'up',
      icon: Star,
      color: 'text-yellow-500',
      description: 'Community score',
    },
    {
      title: 'Earnings',
      value: `${analytics.overview.totalEarned.toFixed(3)} SOL`,
      change: '+25%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-500',
      description: 'Total earned',
    },
    {
      title: 'Avg Engagement',
      value:
        analytics.overview.totalPosts > 0
          ? (
              analytics.overview.totalEngagement / analytics.overview.totalPosts
            ).toFixed(1)
          : '0',
      change: '+3%',
      trend: 'up',
      icon: MessageSquare,
      color: 'text-indigo-500',
      description: 'Per post',
    },
  ];

  // Calculate engagement rate
  const engagementRate =
    analytics.overview.followers > 0
      ? (
          (analytics.overview.totalEngagement / analytics.overview.followers) *
          100
        ).toFixed(1)
      : '0';

  return (
    <View className="mb-6">
      {/* Main Stats Grid */}
      <View className="flex-row flex-wrap -mx-2 mb-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon =
            card.trend === 'up'
              ? TrendingUp
              : card.trend === 'down'
              ? TrendingDown
              : null;

          return (
            <View key={card.title} className="w-1/2 px-2 mb-4">
              <Card className="p-4 h-[120px]">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${card.color}`} />
                  {card.change && TrendIcon && (
                    <View className="flex-row items-center">
                      <TrendIcon
                        className={`h-4 w-4 ${
                          card.trend === 'up'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      />
                      <Text
                        className={`text-xs ml-1 font-medium ${
                          card.trend === 'up'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}>
                        {card.change}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Value */}
                <Text className="text-xl font-bold mb-1" numberOfLines={1}>
                  {card.value}
                </Text>

                {/* Title and Description */}
                <Text className="text-sm font-medium text-foreground mb-1">
                  {card.title}
                </Text>
                {card.description && (
                  <Text className="text-xs text-muted-foreground">
                    {card.description}
                  </Text>
                )}
              </Card>
            </View>
          );
        })}
      </View>

      {/* Additional Metrics */}
      <View className="flex-row gap-4">
        {/* Engagement Rate Card */}
        <Card className="flex-1 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium">Engagement Rate</Text>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </View>
          <Text className="text-2xl font-bold text-green-600">
            {engagementRate}%
          </Text>
          <Text className="text-xs text-muted-foreground">
            Engagement per follower
          </Text>
        </Card>

        {/* Posts Per Day Card */}
        <Card className="flex-1 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium">Posts/Day</Text>
            <FileText className="h-4 w-4 text-blue-500" />
          </View>
          <Text className="text-2xl font-bold text-blue-600">
            {(analytics.overview.totalPosts / 30).toFixed(1)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Average (30 days)
          </Text>
        </Card>
      </View>

      {/* Performance Summary */}
      <Card className="p-4 mt-4">
        <Text className="font-semibold mb-3">Performance Summary</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">
              Content Creation
            </Text>
            <View className="flex-row items-center">
              <View className="w-20 h-2 bg-muted rounded-full mr-2">
                <View
                  className="h-full bg-green-500 rounded-full"
                  style={{width: '85%'}}
                />
              </View>
              <Text className="text-sm font-medium">85%</Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">
              Audience Growth
            </Text>
            <View className="flex-row items-center">
              <View className="w-20 h-2 bg-muted rounded-full mr-2">
                <View
                  className="h-full bg-blue-500 rounded-full"
                  style={{width: '72%'}}
                />
              </View>
              <Text className="text-sm font-medium">72%</Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">
              Engagement Quality
            </Text>
            <View className="flex-row items-center">
              <View className="w-20 h-2 bg-muted rounded-full mr-2">
                <View
                  className="h-full bg-purple-500 rounded-full"
                  style={{width: '91%'}}
                />
              </View>
              <Text className="text-sm font-medium">91%</Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Monetization</Text>
            <View className="flex-row items-center">
              <View className="w-20 h-2 bg-muted rounded-full mr-2">
                <View
                  className="h-full bg-yellow-500 rounded-full"
                  style={{width: '68%'}}
                />
              </View>
              <Text className="text-sm font-medium">68%</Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}
