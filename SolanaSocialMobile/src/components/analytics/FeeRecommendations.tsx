import React from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {Target} from 'lucide-react-native';
import {FeeRecommendation} from '../../types/fee-analytics';
import {formatSOL} from '../../utils/formatting';
import {useFeeAnalyticsStore} from '../../store/feeAnalyticsStore';

interface FeeRecommendationsProps {
  recommendations: FeeRecommendation[];
}

export function FeeRecommendations({recommendations}: FeeRecommendationsProps) {
  const {implementRecommendation} = useFeeAnalyticsStore();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleImplement = async (recommendationId: string) => {
    try {
      await implementRecommendation(recommendationId);
    } catch (error) {
      console.error('Failed to implement recommendation:', error);
    }
  };

  if (recommendations.length === 0) {
    return (
      <View className="bg-white rounded-lg p-4 mt-4">
        <Text className="text-gray-500 text-center">
          No recommendations available
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg p-4 mt-4">
      <View className="flex-row items-center mb-4">
        <Target size={20} color="#8B5CF6" />
        <Text className="text-lg font-semibold ml-2">Recommendations</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {recommendations.map(recommendation => (
          <View
            key={recommendation.id}
            className="border border-gray-200 rounded-lg p-3 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="font-medium text-sm mb-1">
                  {recommendation.title}
                </Text>
                <View className="flex-row items-center space-x-2">
                  <View
                    className={`px-2 py-1 rounded ${getPriorityColor(
                      recommendation.priority,
                    )}`}>
                    <Text className="text-xs font-medium capitalize">
                      {recommendation.priority} Priority
                    </Text>
                  </View>
                  <Text
                    className={`text-xs ${getEffortColor(
                      recommendation.implementationEffort,
                    )}`}>
                    {recommendation.implementationEffort} to implement
                  </Text>
                </View>
              </View>
              <View className="bg-green-50 px-2 py-1 rounded">
                <Text className="text-xs text-green-700 font-medium">
                  Save {formatSOL(recommendation.estimatedSavings)}/mo
                </Text>
              </View>
            </View>

            <Text className="text-sm text-gray-600 mb-2">
              {recommendation.description}
            </Text>

            {recommendation.tags.length > 0 && (
              <View className="flex-row flex-wrap mb-2">
                {recommendation.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 px-2 py-1 rounded mr-2 mb-1">
                    <Text className="text-xs text-gray-600">{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {recommendation.steps.length > 0 && (
              <View className="mb-2">
                <Text className="text-xs font-medium text-gray-700 mb-1">
                  Steps:
                </Text>
                {recommendation.steps.map((step, index) => (
                  <Text key={index} className="text-xs text-gray-600 ml-2">
                    • {step}
                  </Text>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => handleImplement(recommendation.id)}
              className="bg-blue-600 rounded p-2">
              <Text className="text-white text-center text-xs font-medium">
                Implement Recommendation
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
