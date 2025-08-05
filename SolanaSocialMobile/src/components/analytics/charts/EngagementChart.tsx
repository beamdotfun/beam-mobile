import React, {useMemo} from 'react';
import {View, Dimensions} from 'react-native';
import {Text, Card} from '../../ui';
import {LineChart} from 'react-native-chart-kit';
import {TimeSeriesPoint} from '../../../types/analytics';
import {CHART_COLORS} from '../../../types/analytics';

const {width: screenWidth} = Dimensions.get('window');

interface EngagementChartProps {
  data?: {
    period: string;
    data: TimeSeriesPoint[];
  };
  showComparison?: boolean;
  comparisonData?: TimeSeriesPoint[];
}

export function EngagementChart({
  data,
  showComparison,
  comparisonData,
}: EngagementChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return null;
    }

    // Take last 7 data points for better readability
    const recentData = data.data.slice(-7);

    const labels = recentData.map(point => {
      const date = new Date(point.timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    });

    const views = recentData.map(point => point.metrics.views);
    const engagement = recentData.map(point => point.metrics.engagement);

    const datasets = [
      {
        data: views,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue
        strokeWidth: 2,
      },
      {
        data: engagement,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // green
        strokeWidth: 2,
      },
    ];

    // Add comparison data if available
    if (showComparison && comparisonData) {
      const comparisonViews = comparisonData
        .slice(-7)
        .map(point => point.metrics.views);
      const comparisonEngagement = comparisonData
        .slice(-7)
        .map(point => point.metrics.engagement);

      datasets.push(
        {
          data: comparisonViews,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity * 0.5})`, // faded blue
          strokeWidth: 1,
        },
        {
          data: comparisonEngagement,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity * 0.5})`, // faded green
          strokeWidth: 1,
        },
      );
    }

    return {
      labels,
      datasets,
      legend: showComparison
        ? ['Views', 'Engagement', 'Views (Previous)', 'Engagement (Previous)']
        : ['Views', 'Engagement'],
    };
  }, [data, showComparison, comparisonData]);

  const chartStats = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return null;
    }

    const recentData = data.data.slice(-7);
    const totalViews = recentData.reduce(
      (sum, point) => sum + point.metrics.views,
      0,
    );
    const totalEngagement = recentData.reduce(
      (sum, point) => sum + point.metrics.engagement,
      0,
    );
    const avgViews = Math.round(totalViews / recentData.length);
    const avgEngagement = Math.round(totalEngagement / recentData.length);

    // Calculate trends
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

    const firstHalfAvgViews =
      firstHalf.reduce((sum, p) => sum + p.metrics.views, 0) / firstHalf.length;
    const secondHalfAvgViews =
      secondHalf.reduce((sum, p) => sum + p.metrics.views, 0) /
      secondHalf.length;
    const viewsTrend =
      ((secondHalfAvgViews - firstHalfAvgViews) / firstHalfAvgViews) * 100;

    const firstHalfAvgEng =
      firstHalf.reduce((sum, p) => sum + p.metrics.engagement, 0) /
      firstHalf.length;
    const secondHalfAvgEng =
      secondHalf.reduce((sum, p) => sum + p.metrics.engagement, 0) /
      secondHalf.length;
    const engagementTrend =
      ((secondHalfAvgEng - firstHalfAvgEng) / firstHalfAvgEng) * 100;

    return {
      avgViews,
      avgEngagement,
      viewsTrend: isFinite(viewsTrend) ? viewsTrend : 0,
      engagementTrend: isFinite(engagementTrend) ? engagementTrend : 0,
    };
  }, [data]);

  if (!chartData) {
    return (
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Engagement Trends</Text>
        <View className="h-48 justify-center items-center bg-muted/20 rounded-lg">
          <Text className="text-center text-muted-foreground">
            No data available for the selected period
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold">Engagement Trends</Text>
        {chartStats && (
          <View className="flex-row gap-4">
            <View className="items-center">
              <Text className="text-xs text-muted-foreground">Avg Views</Text>
              <Text className="font-medium">
                {chartStats.avgViews.toLocaleString()}
              </Text>
              <Text
                className={`text-xs ${
                  chartStats.viewsTrend >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                {chartStats.viewsTrend >= 0 ? '+' : ''}
                {chartStats.viewsTrend.toFixed(1)}%
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-muted-foreground">
                Avg Engagement
              </Text>
              <Text className="font-medium">
                {chartStats.avgEngagement.toLocaleString()}
              </Text>
              <Text
                className={`text-xs ${
                  chartStats.engagementTrend >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                {chartStats.engagementTrend >= 0 ? '+' : ''}
                {chartStats.engagementTrend.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      <LineChart
        data={chartData}
        width={screenWidth - 48}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: CHART_COLORS.primary,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        withVerticalLabels
        withHorizontalLabels
        withDots
        withShadow={false}
        withInnerLines={false}
      />

      {/* Legend */}
      <View className="flex-row justify-center flex-wrap gap-4 mt-4">
        {chartData.legend.map((label, index) => {
          let color = CHART_COLORS.muted;
          if (index === 0) {
            color = CHART_COLORS.primary;
          } else if (index === 1) {
            color = CHART_COLORS.secondary;
          } else if (index === 2) {
            color = `${CHART_COLORS.primary}80`;
          } else if (index === 3) {
            color = `${CHART_COLORS.secondary}80`;
          }

          return (
            <View key={label} className="flex-row items-center gap-2">
              <View
                className="w-3 h-3 rounded-full"
                style={{backgroundColor: color}}
              />
              <Text className="text-sm text-muted-foreground">{label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
