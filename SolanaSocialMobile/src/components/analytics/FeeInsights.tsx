import React from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {Lightbulb, X} from 'lucide-react-native';
import {FeeInsight} from '../../types/fee-analytics';
import {formatSOL} from '../../utils/formatting';
import {useFeeAnalyticsStore} from '../../store/feeAnalyticsStore';

interface FeeInsightsProps {
  insights: FeeInsight[];
}

export function FeeInsights({insights}: FeeInsightsProps) {
  const {dismissInsight} = useFeeAnalyticsStore();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleDismiss = async (insightId: string) => {
    try {
      await dismissInsight(insightId);
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  if (insights.length === 0) {
    return (
      <View className="bg-white rounded-lg p-4">
        <Text className="text-gray-500 text-center">
          No insights available for this period
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg p-4">
      <View className="flex-row items-center mb-4">
        <Lightbulb size={20} color="#F59E0B" />
        <Text className="text-lg font-semibold ml-2">Fee Insights</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {insights.map(insight => (
          <View key={insight.id} className="bg-gray-50 rounded-lg p-3 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View
                    className={`px-2 py-1 rounded ${getImpactColor(
                      insight.impact,
                    )}`}>
                    <Text
                      className={`text-xs font-medium capitalize ${
                        getImpactColor(insight.impact).split(' ')[0]
                      }`}>
                      {insight.impact} Impact
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500 ml-2">
                    {insight.category}
                  </Text>
                </View>
                <Text className="font-medium text-sm">{insight.title}</Text>
              </View>
              <Pressable
                onPress={() => handleDismiss(insight.id)}
                className="p-1">
                <X size={16} color="#6B7280" />
              </Pressable>
            </View>

            <Text className="text-sm text-gray-600 mb-2">
              {insight.description}
            </Text>

            {insight.potentialSavings && (
              <View className="bg-green-50 rounded p-2 mb-2">
                <Text className="text-xs text-green-700">
                  Potential savings: {formatSOL(insight.potentialSavings)} SOL
                </Text>
              </View>
            )}

            {insight.actionable && insight.actionText && (
              <Pressable className="bg-blue-100 rounded p-2">
                <Text className="text-xs text-blue-700 text-center font-medium">
                  {insight.actionText}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
