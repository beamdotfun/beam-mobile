import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Settings,
  Lightbulb,
  Target,
  BarChart3,
} from 'lucide-react-native';
import {useFeeAnalyticsStore} from '../../store/feeAnalyticsStore';
import {useNavigation} from '@react-navigation/native';
import {formatSOL} from '../../utils/formatting';
import {AnalyticsPeriod} from '../../types/fee-analytics';

// Sub-components
import {
  FeeSummaryCard,
  CategoryBreakdown,
  FeeInsights,
  FeeRecommendations,
  FeeOptimizationSettings,
  TransactionFeeList,
} from '@/components/analytics';

export const FeeAnalyticsDashboard: React.FC = () => {
  const navigation = useNavigation();
  const {
    analytics,
    currentPeriod,
    optimization,
    loading,
    refreshing,
    error,
    fetchAnalytics,
    fetchOptimization,
    setPeriod,
    refreshCurrentPeriod,
    exportData,
  } = useFeeAnalyticsStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [showOptimization, setShowOptimization] = useState(false);
  const [exporting, setExporting] = useState(false);

  const currentAnalytics = analytics[currentPeriod];

  useEffect(() => {
    fetchAnalytics(currentPeriod);
    fetchOptimization();
  }, []);

  const handleRefresh = async () => {
    await refreshCurrentPeriod();
    await fetchOptimization();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = await exportData({
        format: 'pdf',
        period: currentPeriod,
        includeCharts: true,
        categories: ['posting', 'voting', 'tipping', 'auction_bids'],
        groupBy: 'category',
      });

      // Handle download/share
      console.log('Export URL:', url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    trend,
    color,
  }: {
    icon: any;
    label: string;
    value: string;
    change?: number;
    trend?: string;
    color: string;
  }) => (
    <View className="flex-1 bg-white rounded-lg p-4 mr-2">
      <View className="flex-row items-center justify-between mb-2">
        <Icon size={20} color={color} />
        {change !== undefined && (
          <View className="flex-row items-center">
            {trend === 'up' ? (
              <TrendingUp size={12} color="#10B981" />
            ) : trend === 'down' ? (
              <TrendingDown size={12} color="#EF4444" />
            ) : null}
            <Text
              className={`text-xs ml-1 ${
                trend === 'up'
                  ? 'text-green-500'
                  : trend === 'down'
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold mb-1">{value}</Text>
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  );

  if (loading && !currentAnalytics) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Header */}
        <View className="p-4 border-b border-gray-200 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold">Fee Analytics</Text>
            <View className="flex-row">
              <Pressable
                onPress={() => setShowOptimization(true)}
                className="p-2 rounded-lg bg-gray-100 mr-2">
                <Settings size={20} color="#6B7280" />
              </Pressable>
              <Pressable
                onPress={handleExport}
                disabled={exporting}
                className="p-2 rounded-lg bg-gray-100">
                <Download size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Period Selector */}
          <View className="flex-row bg-gray-100 rounded-lg p-1">
            {(['24h', '7d', '30d', '90d', 'all'] as AnalyticsPeriod[]).map(
              period => (
                <Pressable
                  key={period}
                  onPress={() => setPeriod(period)}
                  className={`flex-1 py-2 rounded-md ${
                    currentPeriod === period ? 'bg-white' : ''
                  }`}>
                  <Text
                    className={`text-center text-sm font-medium ${
                      currentPeriod === period
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}>
                    {period === '24h'
                      ? '24H'
                      : period === '7d'
                      ? '7D'
                      : period === '30d'
                      ? '30D'
                      : period === '90d'
                      ? '90D'
                      : 'All'}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </View>

        {currentAnalytics && (
          <>
            {/* Summary Stats */}
            <View className="p-4">
              <View className="flex-row mb-2">
                <StatCard
                  icon={DollarSign}
                  label="Total Fees"
                  value={`${formatSOL(
                    currentAnalytics.summary.totalFeesPaid,
                  )} SOL`}
                  change={currentAnalytics.summary.trends.fees.change}
                  trend={currentAnalytics.summary.trends.fees.direction}
                  color="#EF4444"
                />
                <StatCard
                  icon={ArrowUpRight}
                  label="Tips Sent"
                  value={`${formatSOL(
                    currentAnalytics.summary.totalTipsSent,
                  )} SOL`}
                  change={currentAnalytics.summary.trends.tips.change}
                  trend={currentAnalytics.summary.trends.tips.direction}
                  color="#3B82F6"
                />
              </View>
              <View className="flex-row">
                <StatCard
                  icon={ArrowDownRight}
                  label="Tips Received"
                  value={`${formatSOL(
                    currentAnalytics.summary.totalTipsReceived,
                  )} SOL`}
                  color="#10B981"
                />
                <StatCard
                  icon={Target}
                  label="ROI"
                  value={`${currentAnalytics.summary.roi.toFixed(1)}%`}
                  color="#8B5CF6"
                />
              </View>
            </View>

            {/* Quick Insights */}
            {currentAnalytics.insights.length > 0 && (
              <View className="mx-4 mb-4 p-4 bg-white rounded-lg">
                <View className="flex-row items-center mb-2">
                  <Lightbulb size={20} color="#F59E0B" />
                  <Text className="font-medium ml-2">Key Insights</Text>
                </View>
                <View>
                  {currentAnalytics.insights.slice(0, 2).map(insight => (
                    <View
                      key={insight.id}
                      className="bg-gray-50 rounded-lg p-3 mb-2">
                      <Text className="font-medium text-sm">
                        {insight.title}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {insight.description}
                      </Text>
                      {insight.potentialSavings && (
                        <Text className="text-xs text-green-600 mt-1">
                          Potential savings:{' '}
                          {formatSOL(insight.potentialSavings)} SOL
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Content Tabs */}
            <View className="flex-1 bg-white">
              <View className="flex-row border-b border-gray-200">
                {['overview', 'breakdown', 'insights', 'transactions'].map(
                  tab => (
                    <Pressable
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      className={`flex-1 py-3 border-b-2 ${
                        activeTab === tab
                          ? 'border-blue-600'
                          : 'border-transparent'
                      }`}>
                      <Text
                        className={`text-center text-sm font-medium capitalize ${
                          activeTab === tab ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                        {tab}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>

              {/* Tab Content */}
              <View className="p-4">
                {activeTab === 'overview' && (
                  <FeeSummaryCard
                    summary={currentAnalytics.summary}
                    comparison={currentAnalytics.comparison}
                  />
                )}

                {activeTab === 'breakdown' && (
                  <CategoryBreakdown categories={currentAnalytics.byCategory} />
                )}

                {activeTab === 'insights' && (
                  <View>
                    <FeeInsights insights={currentAnalytics.insights} />
                    <FeeRecommendations
                      recommendations={currentAnalytics.recommendations}
                    />
                  </View>
                )}

                {activeTab === 'transactions' && (
                  <TransactionFeeList
                    transactions={currentAnalytics.byTransaction}
                  />
                )}
              </View>
            </View>
          </>
        )}

        {error && (
          <View className="p-4">
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Optimization Settings Sheet */}
      <FeeOptimizationSettings
        visible={showOptimization}
        onClose={() => setShowOptimization(false)}
        optimization={optimization}
      />
    </SafeAreaView>
  );
};
