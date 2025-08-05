import React from 'react';
import {View, Text, FlatList} from 'react-native';
import {
  MessageSquare,
  ThumbsUp,
  DollarSign,
  Gavel,
  Building,
  Users,
  Settings,
  HelpCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import {CategoryBreakdown as CategoryData} from '../../types/fee-analytics';
import {formatSOL} from '../../utils/formatting';

interface CategoryBreakdownProps {
  categories: CategoryData[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
}) => {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      posting: MessageSquare,
      voting: ThumbsUp,
      tipping: DollarSign,
      auction_bids: Gavel,
      auction_creation: Building,
      group_operations: Users,
      profile_updates: Settings,
      other: HelpCircle,
    };
    return icons[category] || HelpCircle;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      posting: 'Posts',
      voting: 'Voting',
      tipping: 'Tips',
      auction_bids: 'Auction Bids',
      auction_creation: 'Auction Creation',
      group_operations: 'Group Operations',
      profile_updates: 'Profile Updates',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#EF4444'; // red-500
      case 'down':
        return '#10B981'; // green-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const maxAmount = Math.max(...categories.map(c => c.amount));

  const renderCategory = ({item}: {item: CategoryData}) => {
    const Icon = getCategoryIcon(item.category);
    const TrendIcon =
      item.trend === 'up'
        ? TrendingUp
        : item.trend === 'down'
        ? TrendingDown
        : null;

    return (
      <View className="mb-3 p-4 bg-white rounded-lg">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
              <Icon size={20} color="#6B7280" />
            </View>
            <View className="ml-3">
              <Text className="font-medium">
                {getCategoryLabel(item.category)}
              </Text>
              <Text className="text-sm text-gray-500">
                {item.transactionCount} transactions
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="font-semibold">{formatSOL(item.amount)} SOL</Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500">
                {item.percentage.toFixed(1)}%
              </Text>
              {TrendIcon && (
                <View className="flex-row items-center ml-2">
                  <TrendIcon size={12} color={getTrendColor(item.trend)} />
                  <Text
                    className="text-xs ml-0.5"
                    style={{color: getTrendColor(item.trend)}}>
                    {Math.abs(item.trendPercentage).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-2">
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{width: `${(item.amount / maxAmount) * 100}%`}}
            />
          </View>
        </View>

        {/* Additional Metrics */}
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-500">
            Avg: {formatSOL(item.averageFee)} SOL
          </Text>
          <Text className="text-xs text-gray-500">
            {(
              (item.amount / categories.reduce((sum, c) => sum + c.amount, 0)) *
              100
            ).toFixed(1)}
            % of total
          </Text>
        </View>
      </View>
    );
  };

  const sortedCategories = [...categories].sort((a, b) => b.amount - a.amount);

  return (
    <View>
      <Text className="text-lg font-semibold mb-3">Spending by Category</Text>
      <FlatList
        data={sortedCategories}
        renderItem={renderCategory}
        keyExtractor={item => item.category}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
