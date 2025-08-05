import React, {useEffect, useState} from 'react';
import {View, ScrollView, Alert, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Target,
  Award,
} from 'lucide-react-native';
import {usePlatformStore} from '../stores/platformStore';
import {Platform, PlatformAnalytics} from '../types/platform';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {useFeatureFlag} from '../hooks/useFeatureFlag';
import {cn} from '../lib/utils';

interface PlatformAnalyticsScreenProps {
  route?: {
    params?: {
      platformId?: string;
    };
  };
}

export const PlatformAnalyticsScreen: React.FC<
  PlatformAnalyticsScreenProps
> = ({route}) => {
  const {
    platforms,
    selectedPlatform,
    platformAnalytics,
    isLoading,
    error,
    fetchPlatforms,
    fetchPlatformAnalytics,
    setSelectedPlatform,
    clearError,
  } = usePlatformStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'traffic' | 'performance'>('revenue');

  const platformAnalyticsEnabled = useFeatureFlag('platform_analytics_enabled');
  const advancedAnalyticsEnabled = useFeatureFlag('advanced_analytics_enabled');

  useEffect(() => {
    fetchPlatforms();

    // If platformId is provided in route params, select that platform
    const platformId = route?.params?.platformId;
    if (platformId && platforms.length > 0) {
      const platform = platforms.find(p => p.id === platformId);
      if (platform) {
        setSelectedPlatform(platform);
        fetchPlatformAnalytics(platform.id);
      }
    }
  }, [route?.params?.platformId, platforms.length]);

  useEffect(() => {
    if (selectedPlatform) {
      fetchPlatformAnalytics(selectedPlatform.id);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedPlatform) {
        await fetchPlatformAnalytics(selectedPlatform.id);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    fetchPlatformAnalytics(platform.id);
  };

  if (!platformAnalyticsEnabled) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <BarChart3 size={64} color="#9CA3AF" />
        <Text className="text-lg font-medium text-gray-500 mt-4">
          Analytics Unavailable
        </Text>
        <Text className="text-gray-400 text-center mt-2 px-8">
          Platform analytics are currently not available. Please try again
          later.
        </Text>
      </SafeAreaView>
    );
  }

  if (platforms.length === 0 && isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading platforms...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-semibold text-gray-900">
            Platform Analytics
          </Text>
          <Text className="text-sm text-gray-600">
            View detailed platform performance metrics
          </Text>
        </View>

        {!selectedPlatform ? (
          /* Platform Selection */
          <ScrollView className="flex-1 p-4">
            <Text className="text-lg font-semibold mb-4 text-gray-900">
              Select a Platform
            </Text>
            <View className="space-y-3">
              {platforms.map(platform => (
                <PlatformSelectionCard
                  key={platform.id}
                  platform={platform}
                  onSelect={() => handlePlatformSelect(platform)}
                />
              ))}
            </View>

            {platforms.length === 0 && (
              <View className="flex-1 justify-center items-center py-12">
                <BarChart3 size={48} color="#9CA3AF" />
                <Text className="text-lg font-medium text-gray-500 mt-4">
                  No Platforms Found
                </Text>
                <Text className="text-gray-400 text-center mt-2">
                  No platforms are available for analytics viewing
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          /* Analytics Dashboard */
          <>
            {/* Platform Header */}
            <View className="bg-white border-b border-gray-200 px-4 py-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-lg font-semibold text-gray-900">
                      {selectedPlatform.platformName}
                    </Text>
                    {selectedPlatform.isVerified && (
                      <Badge variant="success">
                        <Text className="text-xs font-medium">VERIFIED</Text>
                      </Badge>
                    )}
                  </View>
                  <Text className="text-sm text-gray-600">
                    {selectedPlatform.platformUrl}
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setSelectedPlatform(null)}>
                  <Text className="text-gray-700">Change Platform</Text>
                </Button>
              </View>
            </View>

            {/* Metric Tabs */}
            <View className="bg-white border-b border-gray-200 px-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2 py-2">
                  {[
                    {id: 'revenue', label: 'Revenue', icon: DollarSign},
                    {id: 'traffic', label: 'Traffic', icon: Eye},
                    {id: 'performance', label: 'Performance', icon: TrendingUp},
                  ].map(tab => (
                    <Button
                      key={tab.id}
                      variant={
                        selectedMetric === tab.id ? 'default' : 'outline'
                      }
                      size="sm"
                      className="flex-row items-center space-x-2"
                      onPress={() => setSelectedMetric(tab.id as any)}>
                      <tab.icon
                        size={16}
                        color={selectedMetric === tab.id ? 'white' : '#6B7280'}
                      />
                      <Text
                        className={cn(
                          'text-sm',
                          selectedMetric === tab.id
                            ? 'text-white'
                            : 'text-gray-700',
                        )}>
                        {tab.label}
                      </Text>
                    </Button>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Analytics Content */}
            <ScrollView
              className="flex-1 p-4"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }>
              {isLoading ? (
                <View className="flex-1 justify-center items-center py-12">
                  <LoadingSpinner size="large" />
                  <Text className="mt-4 text-gray-600">
                    Loading analytics...
                  </Text>
                </View>
              ) : platformAnalytics ? (
                <AnalyticsView
                  platform={selectedPlatform}
                  analytics={platformAnalytics}
                  selectedMetric={selectedMetric}
                  advancedEnabled={advancedAnalyticsEnabled}
                />
              ) : (
                <View className="flex-1 justify-center items-center py-12">
                  <BarChart3 size={48} color="#9CA3AF" />
                  <Text className="text-lg font-medium text-gray-500 mt-4">
                    No Analytics Data
                  </Text>
                  <Text className="text-gray-400 text-center mt-2">
                    Analytics data is not available for this platform
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// Platform Selection Card
const PlatformSelectionCard: React.FC<{
  platform: Platform;
  onSelect: () => void;
}> = ({platform, onSelect}) => (
  <Card className="p-4 bg-white">
    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <View className="flex-row items-center space-x-2 mb-1">
          <Text className="font-semibold text-gray-900">
            {platform.platformName}
          </Text>
          {platform.isVerified && (
            <Badge variant="success">
              <Text className="text-xs">VERIFIED</Text>
            </Badge>
          )}
        </View>
        <Text className="text-sm text-gray-600">{platform.platformUrl}</Text>

        <View className="flex-row space-x-4 mt-2">
          <View className="flex-row items-center">
            <Award size={14} color="#F59E0B" />
            <Text className="text-sm text-gray-600 ml-1">
              {platform.platformRating.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <BarChart3 size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {platform.totalAuctionsHosted} auctions
            </Text>
          </View>
        </View>
      </View>

      <Button variant="outline" onPress={onSelect}>
        <Text className="text-gray-700">View Analytics</Text>
      </Button>
    </View>
  </Card>
);

// Analytics View Component
const AnalyticsView: React.FC<{
  platform: Platform;
  analytics: PlatformAnalytics;
  selectedMetric: 'revenue' | 'traffic' | 'performance';
  advancedEnabled: boolean;
}> = ({platform, analytics, selectedMetric, advancedEnabled}) => {
  return (
    <View className="space-y-4">
      {/* Overview Cards */}
      <View className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={DollarSign}
          title="Total Revenue"
          value={`${(analytics.totalRevenue / 1000000000).toFixed(4)} SOL`}
          change={analytics.revenueGrowth}
          color="green"
        />
        <MetricCard
          icon={BarChart3}
          title="Total Auctions"
          value={analytics.totalAuctions.toString()}
          subtitle={`${analytics.activeAuctions} active`}
          color="blue"
        />
        <MetricCard
          icon={Award}
          title="Platform Rating"
          value={`${analytics.platformRating.toFixed(1)}/5.0`}
          change={analytics.ratingTrend}
          color="orange"
        />
        <MetricCard
          icon={Users}
          title="Advertisers"
          value={analytics.totalAdvertisers.toString()}
          subtitle={`${analytics.repeatAdvertisers} repeat`}
          color="purple"
        />
      </View>

      {/* Detailed Metrics Based on Selected Tab */}
      {selectedMetric === 'revenue' && (
        <RevenueMetrics
          analytics={analytics}
          advancedEnabled={advancedEnabled}
        />

      {selectedMetric === 'traffic' && (
        <TrafficMetrics
          analytics={analytics}
          advancedEnabled={advancedEnabled}
        />
      )}

      {selectedMetric === 'performance' && (
        <PerformanceMetrics
          analytics={analytics}
          advancedEnabled={advancedEnabled}
        />
      )}

      {/* Additional Insights */}
      {advancedEnabled && (
        <Card className="p-4 bg-white">
          <Text className="text-lg font-semibold mb-3 text-gray-900">
            Key Insights
          </Text>
          <View className="space-y-3">
            <InsightItem
              title="Revenue Growth"
              description={`${
                analytics.revenueGrowth > 0 ? 'Positive' : 'Negative'
              } revenue trend this month`}
              value={`${
                analytics.revenueGrowth > 0 ? '+' : ''
              }${analytics.revenueGrowth.toFixed(1)}%`}
              positive={analytics.revenueGrowth > 0}
            />
            <InsightItem
              title="Conversion Rate"
              description="Percentage of visitors who become advertisers"
              value={`${(analytics.conversionRate * 100).toFixed(2)}%`}
              positive={analytics.conversionRate > 0.02}
            />
            <InsightItem
              title="Advertiser Satisfaction"
              description="Average satisfaction rating from advertisers"
              value={`${analytics.advertiserSatisfaction.toFixed(1)}/5.0`}
              positive={analytics.advertiserSatisfaction > 4.0}
            />
          </View>
        </Card>
      )}
    </View>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  icon: any;
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  color: 'green' | 'blue' | 'orange' | 'purple';
}> = ({icon: Icon, title, value, subtitle, change, color}) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <Card className="p-4 bg-white">
      <View className="flex-row items-center space-x-2 mb-2">
        <View className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon
            size={20}
            color={
              color === 'green'
                ? '#059669'
                : color === 'blue'
                ? '#2563EB'
                : color === 'orange'
                ? '#D97706'
                : '#7C3AED'
            }
          />
        </View>
      </View>

      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-sm text-gray-600">{title}</Text>

      {subtitle && (
        <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
      )}

      {change !== undefined && (
        <View className="flex-row items-center mt-1">
          <Text
            className={cn(
              'text-xs font-medium',
              change > 0
                ? 'text-green-600'
                : change < 0
                ? 'text-red-600'
                : 'text-gray-600',
            )}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </Text>
          <Text className="text-xs text-gray-500 ml-1">vs last month</Text>
        </View>
      )}
    </Card>
  );
};

// Revenue Metrics Component
const RevenueMetrics: React.FC<{
  analytics: PlatformAnalytics;
  advancedEnabled: boolean;
}> = ({analytics, advancedEnabled}) => (
  <Card className="p-4 bg-white">
    <Text className="text-lg font-semibold mb-3 text-gray-900">
      Revenue Breakdown
    </Text>
    <View className="space-y-3">
      <MetricRow
        label="Total Revenue"
        value={`${(analytics.totalRevenue / 1000000000).toFixed(4)} SOL`}
        subValue={`≈ $${((analytics.totalRevenue / 1000000000) * 100).toFixed(
          2,
        )}`}
      />
      <MetricRow
        label="Monthly Revenue"
        value={`${(analytics.monthlyRevenue / 1000000000).toFixed(4)} SOL`}
        trend={analytics.revenueGrowth}
      />
      <MetricRow
        label="Average Auction Value"
        value={`${(analytics.averageAuctionValue / 1000000000).toFixed(4)} SOL`}
      />
      {advancedEnabled && (
        <>
          <MetricRow
            label="Revenue per Advertiser"
            value={`${(
              analytics.totalRevenue /
              analytics.totalAdvertisers /
              1000000000
            ).toFixed(4)} SOL`}
          />
          <MetricRow
            label="Monthly Growth Rate"
            value={`${analytics.revenueGrowth.toFixed(1)}%`}
            trend={analytics.revenueGrowth}
          />
        </>
      )}
    </View>
  </Card>
);

// Traffic Metrics Component
const TrafficMetrics: React.FC<{
  analytics: PlatformAnalytics;
  advancedEnabled: boolean;
}> = ({analytics, advancedEnabled}) => (
  <Card className="p-4 bg-white">
    <Text className="text-lg font-semibold mb-3 text-gray-900">
      Traffic & Engagement
    </Text>
    <View className="space-y-3">
      <MetricRow
        label="Total Views"
        value={analytics.totalViews.toLocaleString()}
        icon={Eye}
      />
      <MetricRow
        label="Unique Visitors"
        value={analytics.uniqueVisitors.toLocaleString()}
        icon={Users}
      />
      <MetricRow
        label="Click-through Rate"
        value={`${(analytics.clickThroughRate * 100).toFixed(2)}%`}
        icon={MousePointer}
      />
      {advancedEnabled && (
        <>
          <MetricRow
            label="Conversion Rate"
            value={`${(analytics.conversionRate * 100).toFixed(2)}%`}
            icon={Target}
          />
          <MetricRow
            label="Views per Visitor"
            value={(analytics.totalViews / analytics.uniqueVisitors).toFixed(1)}
          />
          <MetricRow
            label="Engagement Quality"
            value={
              analytics.clickThroughRate > 0.1
                ? 'High'
                : analytics.clickThroughRate > 0.05
                ? 'Medium'
                : 'Low'
            }
          />
        </>
      )}
    </View>
  </Card>
);

// Performance Metrics Component
const PerformanceMetrics: React.FC<{
  analytics: PlatformAnalytics;
  advancedEnabled: boolean;
}> = ({analytics, advancedEnabled}) => (
  <Card className="p-4 bg-white">
    <Text className="text-lg font-semibold mb-3 text-gray-900">
      Platform Performance
    </Text>
    <View className="space-y-3">
      <MetricRow
        label="Platform Rating"
        value={`${analytics.platformRating.toFixed(1)}/5.0`}
        trend={analytics.ratingTrend}
      />
      <MetricRow label="Total Votes" value={analytics.totalVotes.toString()} />
      <MetricRow
        label="Positive Vote Rate"
        value={`${analytics.positiveVotePercentage.toFixed(1)}%`}
      />
      {advancedEnabled && (
        <>
          <MetricRow
            label="Advertiser Satisfaction"
            value={`${analytics.advertiserSatisfaction.toFixed(1)}/5.0`}
          />
          <MetricRow
            label="Repeat Advertiser Rate"
            value={`${(
              (analytics.repeatAdvertisers / analytics.totalAdvertisers) *
              100
            ).toFixed(1)}%`}
          />
          <MetricRow
            label="Platform Health"
            value={
              analytics.platformRating > 4.5
                ? 'Excellent'
                : analytics.platformRating > 4.0
                ? 'Good'
                : analytics.platformRating > 3.5
                ? 'Fair'
                : 'Poor'
            }
          />
        </>
      )}
    </View>
  </Card>
);

// Metric Row Component
const MetricRow: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon?: any;
}> = ({label, value, subValue, trend, icon: Icon}) => (
  <View className="flex-row justify-between items-center">
    <View className="flex-row items-center flex-1">
      {Icon && <Icon size={16} color="#6B7280" className="mr-2" />}
      <Text className="text-gray-600">{label}</Text>
    </View>
    <View className="items-end">
      <Text className="font-medium text-gray-900">{value}</Text>
      {subValue && <Text className="text-xs text-gray-500">{subValue}</Text>}
      {trend !== undefined && (
        <Text
          className={cn(
            'text-xs',
            trend > 0
              ? 'text-green-600'
              : trend < 0
              ? 'text-red-600'
              : 'text-gray-600',
          )}>
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
        </Text>
      )}
    </View>
  </View>
);

// Insight Item Component
const InsightItem: React.FC<{
  title: string;
  description: string;
  value: string;
  positive: boolean;
}> = ({title, description, value, positive}) => (
  <View className="flex-row justify-between items-start">
    <View className="flex-1 mr-4">
      <Text className="font-medium text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
    <Text
      className={cn('font-bold', positive ? 'text-green-600' : 'text-red-600')}>
      {value}
    </Text>
  </View>
);
