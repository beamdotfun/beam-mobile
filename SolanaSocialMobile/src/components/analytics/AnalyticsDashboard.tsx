import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import {Text, Button, Card, Skeleton} from '../ui';
import {
  Download,
  Calendar,
  TrendingUp,
  BarChart,
  Users,
  DollarSign,
  RefreshCw,
} from 'lucide-react-native';
import {useAnalyticsStore} from '../../store/analyticsStore';
import {useAuthStore} from '../../store/auth';
import {DATE_PRESETS} from '../../types/analytics';

// Sub-components (will be created next)
import {OverviewCards} from './OverviewCards';
import {EngagementChart} from './charts/EngagementChart';
import {EarningsChart} from './charts/EarningsChart';
import {ContentPerformance} from './ContentPerformance';
import {AudienceInsights} from './AudienceInsights';
import {RealtimeMetrics} from './RealtimeMetrics';

const {width: screenWidth} = Dimensions.get('window');

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const tabs: Tab[] = [
  {id: 'overview', label: 'Overview', icon: BarChart},
  {id: 'content', label: 'Content', icon: TrendingUp},
  {id: 'audience', label: 'Audience', icon: Users},
  {id: 'earnings', label: 'Earnings', icon: DollarSign},
];

export function AnalyticsDashboard() {
  const {user} = useAuthStore();
  const {
    analytics,
    loading,
    error,
    filters,
    comparisonEnabled,
    selectedTab,
    exportLoading,
    exportProgress,
    fetchAnalytics,
    setDateRange,
    toggleComparison,
    exportAnalytics,
    connectRealtime,
    disconnectRealtime,
    setSelectedTab,
    clearError,
  } = useAnalyticsStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.wallet) {
      fetchAnalytics(user.wallet);
      connectRealtime(user.wallet);
    }

    return () => {
      disconnectRealtime();
    };
  }, [user?.wallet]);

  const handleRefresh = async () => {
    if (!user?.wallet) {
      return;
    }

    setRefreshing(true);
    try {
      await fetchAnalytics(user.wallet);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDateRangeChange = (preset: keyof typeof DATE_PRESETS) => {
    setDateRange(preset);
  };

  const handleExport = async () => {
    try {
      const url = await exportAnalytics({
        format: 'pdf',
        sections: ['overview', 'content', 'audience', 'earnings'],
        includeCharts: true,
        includeRawData: false,
      });

      await Share.share({
        title: 'Analytics Report',
        url,
        message: `Analytics report for ${
          filters.dateRange.preset || 'custom'
        } period`,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export analytics report');
    }
  };

  const renderDateRangeSelector = () => (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2">Date Range</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {Object.entries(DATE_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant={filters.dateRange.preset === key ? 'default' : 'outline'}
              size="sm"
              onPress={() =>
                handleDateRangeChange(key as keyof typeof DATE_PRESETS)
              }>
              <Text
                className={`text-xs ${
                  filters.dateRange.preset === key
                    ? 'text-white'
                    : 'text-gray-700'
                }`}>
                {preset.label}
              </Text>
            </Button>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <View>
            <OverviewCards analytics={analytics} />
            <EngagementChart data={analytics?.timeSeries} />
          </View>
        );
      case 'content':
        return <ContentPerformance analytics={analytics?.contentPerformance} />;
      case 'audience':
        return <AudienceInsights analytics={analytics?.audienceInsights} />;
      case 'earnings':
        return <EarningsChart analytics={analytics?.earnings} />;
      default:
        return null;
    }
  };

  if (loading && !analytics) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 mb-4 text-center">{error}</Text>
        <Button
          onPress={() => {
            clearError();
            if (user?.wallet) {
              fetchAnalytics(user.wallet);
            }
          }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="p-4 border-b border-border bg-card">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold">Analytics</Text>

          <View className="flex-row gap-2">
            {/* Live indicator removed - using polling instead */}

            <Button size="sm" variant="outline" onPress={toggleComparison}>
              <Text className="text-xs">
                {comparisonEnabled ? 'Hide' : 'Show'} Compare
              </Text>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onPress={handleExport}
              disabled={exportLoading}>
              <Download className="h-4 w-4" />
              {exportLoading && (
                <Text className="text-xs ml-1">{exportProgress}%</Text>
              )}
            </Button>
          </View>
        </View>

        {renderDateRangeSelector()}
      </View>

      {/* Real-time Metrics */}
      <RealtimeMetrics />

      {/* Tab Navigation */}
      <View className="border-b border-border bg-card">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row px-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;

              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`mr-2 ${
                    isActive ? 'border-b-2 border-primary' : ''
                  }`}
                  onPress={() => setSelectedTab(tab.id)}>
                  <Icon
                    className={`h-4 w-4 mr-2 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <Text
                    className={
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    }>
                    {tab.label}
                  </Text>
                </Button>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <View className="p-4">{renderTabContent()}</View>
      </ScrollView>
    </View>
  );
}

// Loading skeleton component
function AnalyticsLoadingSkeleton() {
  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header skeleton */}
      <View className="p-4 border-b border-border">
        <Skeleton className="h-8 w-32 mb-4" />
        <View className="flex-row gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </View>
      </View>

      {/* Overview cards skeleton */}
      <View className="p-4">
        <View className="flex-row flex-wrap -mx-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <View key={i} className="w-1/2 px-2 mb-4">
              <Skeleton className="h-24 rounded-lg" />
            </View>
          ))}
        </View>

        {/* Chart skeleton */}
        <Skeleton className="h-64 w-full rounded-lg mb-6" />

        {/* Content skeleton */}
        <View className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
