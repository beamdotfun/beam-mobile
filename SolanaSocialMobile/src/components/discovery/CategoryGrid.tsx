import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Hash, Users, TrendingUp, Star, Check} from 'lucide-react-native';
import {ContentCategory, Subcategory} from '../../types/discovery';
import {Card} from '../ui/card';
import {Button} from '../ui/button';
import {formatNumber} from '../../utils/formatting';
import {useDiscoveryStore} from '../../store/discoveryStore';

interface CategoryGridProps {
  categories: ContentCategory[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  loading,
  onRefresh,
}) => {
  const navigation = useNavigation();
  const {followCategory, unfollowCategory, recordInteraction} =
    useDiscoveryStore();

  const handleCategoryPress = (category: ContentCategory) => {
    recordInteraction({
      type: 'view',
      targetId: category.id,
      targetType: 'hashtag',
      timestamp: new Date().toISOString(),
    });

    navigation.navigate(
      'CategoryDetail' as never,
      {categoryId: category.id} as never,
    );
  };

  const handleFollowToggle = async (category: ContentCategory) => {
    if (category.userFollowing) {
      await unfollowCategory(category.id);
    } else {
      await followCategory(category.id);
      recordInteraction({
        type: 'follow',
        targetId: category.id,
        targetType: 'hashtag',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const iconMap: {[key: string]: any} = {
      hash: Hash,
      users: Users,
      trending: TrendingUp,
      star: Star,
    };

    const Icon = iconMap[iconName] || Hash;
    return Icon;
  };

  const renderSubcategories = (subcategories: Subcategory[]) => {
    if (subcategories.length === 0) {
      return null;
    }

    return (
      <View className="mt-3">
        <Text className="text-xs text-gray-500 mb-2">Subcategories</Text>
        <View className="flex-row flex-wrap">
          {subcategories.slice(0, 3).map(sub => (
            <View
              key={sub.id}
              className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2"
              style={{backgroundColor: sub.color + '20'}}>
              <Text className="text-xs" style={{color: sub.color}}>
                {sub.name} ({formatNumber(sub.postCount)})
              </Text>
            </View>
          ))}
          {subcategories.length > 3 && (
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-600">
                +{subcategories.length - 3} more
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEngagementBar = (engagement: number) => (
    <View className="mt-3">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs text-gray-500">Your Engagement</Text>
        <Text className="text-xs font-medium text-gray-700">{engagement}%</Text>
      </View>
      <View className="w-full h-2 bg-gray-200 rounded-full">
        <View
          className="h-full rounded-full"
          style={{
            width: `${engagement}%`,
            backgroundColor:
              engagement > 70
                ? '#10B981'
                : engagement > 40
                ? '#3B82F6'
                : '#6B7280',
          }}
        />
      </View>
    </View>
  );

  const renderTrendingPosts = (category: ContentCategory) => {
    if (category.trendingPosts.length === 0) {
      return null;
    }

    return (
      <View className="mt-3 p-3 bg-gray-50 rounded-lg">
        <Text className="text-xs text-gray-500 mb-2">
          Trending in {category.name}
        </Text>
        {category.trendingPosts.slice(0, 2).map((post, index) => (
          <View key={post.id} className={index > 0 ? 'mt-2' : ''}>
            <Text className="text-xs text-gray-700" numberOfLines={2}>
              {post.content}
            </Text>
            <View className="flex-row items-center mt-1">
              <TrendingUp size={10} className="text-orange-500" />
              <Text className="text-xs text-gray-500 ml-1">
                {formatNumber(post.voteScore)} votes
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCategoryItem = ({item}: {item: ContentCategory}) => {
    const Icon = getCategoryIcon(item.icon);

    return (
      <Card className="mb-4 overflow-hidden">
        <TouchableOpacity onPress={() => handleCategoryPress(item)}>
          <View
            className="h-24 p-4 justify-center"
            style={{backgroundColor: item.color + '20'}}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{backgroundColor: item.color}}>
                  <Icon size={24} className="text-white" />
                </View>
                <View className="ml-3">
                  <Text
                    className="text-lg font-semibold"
                    style={{color: item.color}}>
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-600" numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Button
                variant={item.userFollowing ? 'outline' : 'default'}
                size="sm"
                onPress={e => {
                  e.stopPropagation();
                  handleFollowToggle(item);
                }}>
                {item.userFollowing ? (
                  <Check size={16} className="text-gray-700" />
                ) : (
                  <Text className="text-white text-sm">Follow</Text>
                )}
              </Button>
            </View>
          </View>

          <View className="p-4">
            {/* Stats */}
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {formatNumber(item.postCount)}
                </Text>
                <Text className="text-xs text-gray-500">Posts</Text>
              </View>
              <View className="w-px h-12 bg-gray-200" />
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {formatNumber(item.activeUsers)}
                </Text>
                <Text className="text-xs text-gray-500">Active Users</Text>
              </View>
            </View>

            {/* Engagement Bar */}
            {renderEngagementBar(item.userEngagement)}

            {/* Subcategories */}
            {renderSubcategories(item.subcategories)}

            {/* Trending Posts */}
            {renderTrendingPosts(item)}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading categories...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Hash size={48} className="text-gray-300" />
        <Text className="mt-4 text-gray-600 text-center">
          No categories available
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          Check back later for content categories
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      renderItem={renderCategoryItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{padding: 16}}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={loading || false}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Explore Categories
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Discover content by topics you love
          </Text>
        </View>
      }
    />
  );
};
