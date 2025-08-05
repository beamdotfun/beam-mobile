import React, {useEffect, useState} from 'react';
import {View, Animated} from 'react-native';
import {Text, Card} from '../ui';
import {
  Eye,
  Heart,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
} from 'lucide-react-native';
import {useAnalyticsStore} from '../../store/analyticsStore';

interface RealtimeMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  icon: React.ComponentType<any>;
  color: string;
  formatter: (value: number) => string;
}

export function RealtimeMetrics() {
  // Realtime metrics removed - component disabled
  const realtimeConnected = false;
  const [animatedValues] = useState(() => ({
    views: new Animated.Value(0),
    engagement: new Animated.Value(0),
    earnings: new Animated.Value(0),
    followers: new Animated.Value(0),
  }));

  const [previousValues, setPreviousValues] = useState({
    views: 0,
    engagement: 0,
    earnings: 0,
    followers: 0,
  });

  useEffect(() => {
    // Animate changes in real-time metrics
    Object.entries(realtimeMetrics).forEach(([key, value]) => {
      if (value !== previousValues[key as keyof typeof previousValues]) {
        Animated.spring(animatedValues[key as keyof typeof animatedValues], {
          toValue: value,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    });

    setPreviousValues(realtimeMetrics);
  }, [realtimeMetrics]);

  const metrics: RealtimeMetric[] = [
    {
      id: 'views',
      label: 'Views',
      value: realtimeMetrics.views,
      previousValue: previousValues.views,
      icon: Eye,
      color: 'text-blue-500',
      formatter: value => value.toLocaleString(),
    },
    {
      id: 'engagement',
      label: 'Engagement',
      value: realtimeMetrics.engagement,
      previousValue: previousValues.engagement,
      icon: Heart,
      color: 'text-pink-500',
      formatter: value => value.toLocaleString(),
    },
    {
      id: 'earnings',
      label: 'Earnings',
      value: realtimeMetrics.earnings,
      previousValue: previousValues.earnings,
      icon: DollarSign,
      color: 'text-purple-500',
      formatter: value => `${value.toFixed(3)} SOL`,
    },
    {
      id: 'followers',
      label: 'Followers',
      value: realtimeMetrics.followers,
      previousValue: previousValues.followers,
      icon: Users,
      color: 'text-green-500',
      formatter: value => value.toLocaleString(),
    },
  ];

  const renderMetricCard = (metric: RealtimeMetric) => {
    const Icon = metric.icon;
    const change = metric.value - metric.previousValue;
    const hasChange = change !== 0;
    const isPositive = change > 0;

    return (
      <Card key={metric.id} className="flex-1 p-3 mx-1">
        <View className="flex-row items-center justify-between mb-2">
          <Icon className={`h-4 w-4 ${metric.color}`} />
          {hasChange && (
            <View className="flex-row items-center">
              <TrendingUp
                className={`h-3 w-3 ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              />
              <Text
                className={`text-xs ml-1 font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                {isPositive ? '+' : ''}
                {change}
              </Text>
            </View>
          )}
        </View>

        <Animated.View>
          <Text className="text-lg font-bold mb-1" numberOfLines={1}>
            {metric.formatter(metric.value)}
          </Text>
        </Animated.View>

        <Text className="text-xs text-muted-foreground">{metric.label}</Text>

        {/* Pulse animation for active metrics */}
        {hasChange && <PulseIndicator color={metric.color} />}
      </Card>
    );
  };

  if (!realtimeConnected) {
    return (
      <Card className="mx-4 mb-4 p-4">
        <View className="flex-row items-center justify-center">
          <Activity className="h-4 w-4 text-muted-foreground mr-2" />
          <Text className="text-sm text-muted-foreground">
            Real-time metrics have been disabled - using polling instead
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View className="px-4 mb-4">
      {/* Connection Status */}
      <Card className="p-3 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2">
              <PulseIndicator color="text-green-500" size="small" />
            </View>
            <Text className="text-sm font-medium">Live Analytics</Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            Updated {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </Card>

      {/* Real-time Metrics */}
      <View className="flex-row -mx-1">{metrics.map(renderMetricCard)}</View>

      {/* Quick Insights */}
      <Card className="p-3 mt-3">
        <Text className="text-sm font-medium mb-2">Live Insights</Text>
        <View className="space-y-1">
          {getQuickInsights(metrics).map((insight, index) => (
            <Text key={index} className="text-xs text-muted-foreground">
              • {insight}
            </Text>
          ))}
        </View>
      </Card>
    </View>
  );
}

// Pulse animation component
function PulseIndicator({
  color,
  size = 'normal',
}: {
  color: string;
  size?: 'small' | 'normal';
}) {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  const sizeClass = size === 'small' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <Animated.View
      className={`absolute top-0 right-0 ${sizeClass} rounded-full opacity-20`}
      style={{
        transform: [{scale: pulseAnim}],
        backgroundColor: color.replace('text-', '').replace('-500', ''),
      }}
    />
  );
}

// Generate quick insights based on metric changes
function getQuickInsights(metrics: RealtimeMetric[]): string[] {
  const insights: string[] = [];

  // Check for significant changes
  metrics.forEach(metric => {
    const change = metric.value - metric.previousValue;
    const changePercent =
      metric.previousValue > 0 ? (change / metric.previousValue) * 100 : 0;

    if (Math.abs(changePercent) > 10) {
      const direction = change > 0 ? 'increased' : 'decreased';
      insights.push(
        `${metric.label} ${direction} by ${Math.abs(changePercent).toFixed(
          1,
        )}%`,
      );
    }
  });

  // Add engagement insights
  const viewsMetric = metrics.find(m => m.id === 'views');
  const engagementMetric = metrics.find(m => m.id === 'engagement');

  if (viewsMetric && engagementMetric && viewsMetric.value > 0) {
    const engagementRate = (engagementMetric.value / viewsMetric.value) * 100;
    if (engagementRate > 5) {
      insights.push(`High engagement rate: ${engagementRate.toFixed(1)}%`);
    }
  }

  // Add earnings insights
  const earningsMetric = metrics.find(m => m.id === 'earnings');
  if (
    earningsMetric &&
    earningsMetric.value - earningsMetric.previousValue > 0
  ) {
    insights.push('New earnings received!');
  }

  // Add follower insights
  const followersMetric = metrics.find(m => m.id === 'followers');
  if (
    followersMetric &&
    followersMetric.value - followersMetric.previousValue > 0
  ) {
    const newFollowers = followersMetric.value - followersMetric.previousValue;
    insights.push(
      `+${newFollowers} new follower${newFollowers > 1 ? 's' : ''}`,
    );
  }

  // Default insights if no significant changes
  if (insights.length === 0) {
    insights.push('Metrics are stable');
    insights.push('Keep creating great content!');
  }

  return insights.slice(0, 3); // Limit to 3 insights
}
