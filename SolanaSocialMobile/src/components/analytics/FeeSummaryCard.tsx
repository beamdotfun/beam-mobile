import React from 'react';
import {View, Text} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
} from 'lucide-react-native';
import {FeeSummary, PeriodComparison} from '../../types/fee-analytics';
import {formatSOL} from '../../utils/formatting';

interface FeeSummaryCardProps {
  summary: FeeSummary;
  comparison?: PeriodComparison;
}

export function FeeSummaryCard({summary, comparison}: FeeSummaryCardProps) {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = (direction: string, isGood: boolean = false) => {
    if (direction === 'stable') {
      return 'text-gray-500';
    }

    const isPositive = direction === 'up';
    if (isGood) {
      return isPositive ? 'text-green-500' : 'text-red-500';
    } else {
      return isPositive ? 'text-red-500' : 'text-green-500';
    }
  };

  const MetricRow = ({
    icon: Icon,
    label,
    value,
    trend,
    change,
    isRevenue = false,
  }: {
    icon: any;
    label: string;
    value: string;
    trend?: any;
    change?: number;
    isRevenue?: boolean;
  }) => {
    const TrendIcon = trend ? getTrendIcon(trend.direction) : null;
    const trendColor = trend ? getTrendColor(trend.direction, isRevenue) : '';

    return (
      <View className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center">
          <Icon size={16} color="#6B7280" className="mr-3" />
          <Text className="font-medium">{label}</Text>
        </View>
        <View className="items-end">
          <Text className="font-semibold">{value}</Text>
          {trend && TrendIcon && (
            <View className="flex-row items-center">
              <TrendIcon size={12} color={trendColor} />
              <Text className={`text-xs ml-1 ${trendColor}`}>
                {Math.abs(trend.change).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="bg-white rounded-lg p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold">Fee Summary</Text>
        <View className="bg-gray-100 px-2 py-1 rounded">
          <Text className="text-xs text-gray-600">
            {summary.period.toUpperCase()}
          </Text>
        </View>
      </View>

      <View>
        <MetricRow
          icon={DollarSign}
          label="Total Fees Paid"
          value={`${formatSOL(summary.totalFeesPaid)}`}
          trend={summary.trends.fees}
        />

        <MetricRow
          icon={ArrowUpRight}
          label="Tips Sent"
          value={`${formatSOL(summary.totalTipsSent)}`}
          trend={summary.trends.tips}
        />

        <MetricRow
          icon={ArrowDownRight}
          label="Tips Received"
          value={`${formatSOL(summary.totalTipsReceived)}`}
          trend={summary.trends.tips}
          isRevenue
        />

        <View className="border-t border-gray-200 pt-2 mt-2">
          <MetricRow
            icon={Target}
            label="Net Spending"
            value={`${formatSOL(summary.netSpending)}`}
          />

          <MetricRow
            icon={Activity}
            label="Total Transactions"
            value={summary.totalTransactions.toString()}
          />

          <MetricRow
            icon={TrendingUp}
            label="ROI"
            value={`${summary.roi.toFixed(1)}%`}
            isRevenue
          />
        </View>
      </View>

      {/* Period Comparison */}
      {comparison && (
        <View className="mt-4 pt-4 border-t border-gray-200">
          <Text className="font-medium mb-2">vs. Previous Period</Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 p-2">
              <Text className="text-xs text-gray-500">Fees</Text>
              <Text
                className={`text-sm font-medium ${
                  comparison.changes.totalFees > 0
                    ? 'text-red-500'
                    : 'text-green-500'
                }`}>
                {comparison.changes.totalFees > 0 ? '+' : ''}
                {comparison.changes.totalFees.toFixed(1)}%
              </Text>
            </View>

            <View className="w-1/2 p-2">
              <Text className="text-xs text-gray-500">ROI</Text>
              <Text
                className={`text-sm font-medium ${
                  comparison.changes.roi > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                {comparison.changes.roi > 0 ? '+' : ''}
                {comparison.changes.roi.toFixed(1)}%
              </Text>
            </View>

            <View className="w-1/2 p-2">
              <Text className="text-xs text-gray-500">Revenue</Text>
              <Text
                className={`text-sm font-medium ${
                  comparison.changes.totalRevenue > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                {comparison.changes.totalRevenue > 0 ? '+' : ''}
                {comparison.changes.totalRevenue.toFixed(1)}%
              </Text>
            </View>

            <View className="w-1/2 p-2">
              <Text className="text-xs text-gray-500">Efficiency</Text>
              <Text
                className={`text-sm font-medium ${
                  comparison.changes.efficiency < 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                {comparison.changes.efficiency > 0 ? '+' : ''}
                {comparison.changes.efficiency.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
