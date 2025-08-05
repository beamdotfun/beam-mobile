import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Activity,
} from 'lucide-react-native';
import {TrendingHashtag} from '../../types/discovery';
import {Card} from '../ui/card';
import {Badge} from '../ui/badge';
import {formatNumber} from '../../utils/formatting';
import {useDiscoveryStore} from '../../store/discoveryStore';

interface TrendingHashtagsProps {
  hashtags: TrendingHashtag[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({
  hashtags,
  loading,
  onRefresh,
}) => {
  const navigation = useNavigation();
  const {recordInteraction} = useDiscoveryStore();

  const handleHashtagPress = (hashtag: TrendingHashtag) => {
    recordInteraction({
      type: 'view',
      targetId: hashtag.tag,
      targetType: 'hashtag',
      timestamp: new Date().toISOString(),
    });

    navigation.navigate(
      'HashtagDetail' as never,
      {hashtag: hashtag.tag} as never,
    );
  };

  const getTrendIcon = (score: number) => {
    if (score > 20) {
      return {icon: TrendingUp, color: 'text-green-600'};
    }
    if (score < -20) {
      return {icon: TrendingDown, color: 'text-red-600'};
    }
    return {icon: Minus, color: 'text-gray-500'};
  };

  const getCategoryColor = (category: string) => {
    const colors: {[key: string]: string} = {
      crypto: '#F59E0B',
      nft: '#8B5CF6',
      defi: '#3B82F6',
      gaming: '#10B981',
      art: '#EC4899',
      music: '#6366F1',
      tech: '#14B8A6',
      news: '#EF4444',
      default: '#6B7280',
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  const renderHashtagItem = ({
    item,
    index,
  }: {
    item: TrendingHashtag;
    index: number;
  }) => {
    const {icon: TrendIcon, color: trendColor} = getTrendIcon(
      item.trendingScore,
    );
    const categoryColor = getCategoryColor(item.category);

    return (
      <Card className="mb-4">
        <TouchableOpacity onPress={() => handleHashtagPress(item)}>
          <View className="p-4">
            {/* Header */}
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center flex-1">
                {/* Rank */}
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <Text className="font-bold text-gray-700">{index + 1}</Text>
                </View>

                {/* Hashtag */}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Hash size={20} className="text-blue-500" />
                    <Text className="text-lg font-semibold text-gray-900 ml-1">
                      {item.tag}
                    </Text>
                  </View>

                  {item.description && (
                    <Text
                      className="text-sm text-gray-600 mt-1"
                      numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>

                {/* Trend indicator */}
                <View className="flex-row items-center ml-2">
                  <TrendIcon size={20} className={trendColor} />
                  <Text className={`text-sm font-medium ${trendColor} ml-1`}>
                    {Math.abs(item.trendingScore)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Category */}
            <View className="mt-3">
              <Badge variant="outline" style={{borderColor: categoryColor}}>
                <Text style={{color: categoryColor}} className="text-xs">
                  {item.category}
                </Text>
              </Badge>
            </View>

            {/* Stats */}
            <View className="flex-row items-center mt-3 space-x-4">
              <View className="flex-row items-center">
                <Activity size={16} className="text-gray-500" />
                <Text className="ml-1 text-sm text-gray-700">
                  {formatNumber(item.postCount)} posts
                </Text>
              </View>
              <View className="flex-row items-center">
                <Users size={16} className="text-gray-500" />
                <Text className="ml-1 text-sm text-gray-700">
                  {formatNumber(item.totalEngagement)} engagement
                </Text>
              </View>
            </View>

            {/* Related tags */}
            {item.relatedTags.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-500 mb-2">Related tags</Text>
                <View className="flex-row flex-wrap">
                  {item.relatedTags.slice(0, 4).map(tag => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => handleHashtagPress({...item, tag})}
                      className="mr-2 mb-2">
                      <View className="bg-gray-100 rounded-full px-3 py-1">
                        <Text className="text-sm text-blue-500">#{tag}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {item.relatedTags.length > 4 && (
                    <View className="bg-gray-100 rounded-full px-3 py-1">
                      <Text className="text-sm text-gray-600">
                        +{item.relatedTags.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading && hashtags.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading trending hashtags...</Text>
      </View>
    );
  }

  if (hashtags.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Hash size={48} className="text-gray-300" />
        <Text className="mt-4 text-gray-600 text-center">
          No trending hashtags available
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          Check back later for trending topics
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={hashtags}
      renderItem={renderHashtagItem}
      keyExtractor={item => item.tag}
      contentContainerStyle={{padding: 16}}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={loading || false}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Trending Hashtags
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Discover what everyone's talking about
          </Text>
        </View>
      }
    />
  );
};
