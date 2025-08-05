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
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  UserPlus,
  UserCheck,
} from 'lucide-react-native';
import {PopularCreator} from '../../types/discovery';
import {Card} from '../ui/card';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {formatNumber, formatCurrency} from '../../utils/formatting';
import {useDiscoveryStore} from '../../store/discoveryStore';

interface PopularCreatorsProps {
  creators: PopularCreator[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const PopularCreators: React.FC<PopularCreatorsProps> = ({
  creators,
  loading,
  onRefresh,
}) => {
  const navigation = useNavigation();
  const {followCreator, unfollowCreator, recordInteraction} =
    useDiscoveryStore();

  const handleCreatorPress = (creator: PopularCreator) => {
    recordInteraction({
      type: 'view',
      targetId: creator.wallet,
      targetType: 'user',
      timestamp: new Date().toISOString(),
    });

    navigation.navigate(
      'UserProfile' as never,
      {wallet: creator.wallet} as never,
    );
  };

  const handleFollowToggle = async (creator: PopularCreator) => {
    if (creator.userFollowing) {
      await unfollowCreator(creator.wallet);
    } else {
      await followCreator(creator.wallet);
      recordInteraction({
        type: 'follow',
        targetId: creator.wallet,
        targetType: 'user',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const renderGrowthIndicator = (growth: number) => {
    if (growth === 0) {
      return null;
    }

    const isPositive = growth > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <View className="flex-row items-center">
        <Icon size={14} className={color} />
        <Text className={`text-xs ${color} ml-1`}>
          {isPositive ? '+' : ''}
          {growth}%
        </Text>
      </View>
    );
  };

  const renderCreatorBadges = (creator: PopularCreator) => {
    const badges = [];

    if (creator.isVerified) {
      badges.push(
        <Badge key="verified" variant="default" className="mr-1">
          <Text className="text-xs text-white">Verified</Text>
        </Badge>,
      );
    }

    if (creator.reputationScore >= 90) {
      badges.push(
        <Badge key="top" variant="secondary" className="mr-1">
          <Text className="text-xs">Top Creator</Text>
        </Badge>,
      );
    }

    if (creator.badges.length > 0) {
      badges.push(
        ...creator.badges.slice(0, 2).map((badge, index) => (
          <Badge key={`badge-${index}`} variant="outline" className="mr-1">
            <Text className="text-xs">{badge}</Text>
          </Badge>
        )),
      );
    }

    return badges;
  };

  const renderCreatorItem = ({
    item,
    index,
  }: {
    item: PopularCreator;
    index: number;
  }) => (
    <Card className="mb-4 p-4">
      <TouchableOpacity onPress={() => handleCreatorPress(item)}>
        <View className="flex-row items-start">
          {/* Rank */}
          <View className="w-8 items-center mr-3">
            <Text className="text-lg font-bold text-gray-700">{index + 1}</Text>
          </View>

          {/* Avatar */}
          <Avatar
            source={{uri: item.avatar}}
            fallback={item.displayName[0]}
            size="lg"
          />

          {/* Creator Info */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900 text-lg">
                {item.displayName}
              </Text>
              {item.isVerified && (
                <View className="ml-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </View>

            <Text className="text-sm text-gray-600">@{item.username}</Text>

            {/* Badges */}
            <View className="flex-row flex-wrap mt-2">
              {renderCreatorBadges(item)}
            </View>

            {/* Stats */}
            <View className="flex-row items-center mt-3 space-x-4">
              <View>
                <Text className="text-xs text-gray-500">Followers</Text>
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900">
                    {formatNumber(item.followerCount)}
                  </Text>
                  {renderGrowthIndicator(item.followerGrowth)}
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-500">Total Tips</Text>
                <Text className="font-semibold text-gray-900">
                  {formatCurrency(item.totalTips)}
                </Text>
              </View>

              <View>
                <Text className="text-xs text-gray-500">Engagement</Text>
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900">
                    {item.avgEngagement}%
                  </Text>
                  {renderGrowthIndicator(item.engagementGrowth)}
                </View>
              </View>
            </View>

            {/* Reputation Score */}
            <View className="mt-3 bg-gray-100 rounded-lg p-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-600">Reputation Score</Text>
                <View className="flex-row items-center">
                  <Star size={14} className="text-yellow-500" fill="#EAB308" />
                  <Text className="font-bold text-gray-900 ml-1">
                    {item.reputationScore}
                  </Text>
                </View>
              </View>
              <View className="w-full h-2 bg-gray-200 rounded-full mt-1">
                <View
                  className="h-full bg-yellow-500 rounded-full"
                  style={{width: `${item.reputationScore}%`}}
                />
              </View>
            </View>

            {/* Primary Category & Tags */}
            <View className="mt-3">
              <Text className="text-xs text-gray-500">
                {item.primaryCategory}
              </Text>
              <View className="flex-row flex-wrap mt-1">
                {item.tags.slice(0, 3).map(tag => (
                  <Text key={tag} className="text-xs text-blue-500 mr-2">
                    #{tag}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Follow Button */}
          <Button
            variant={item.userFollowing ? 'outline' : 'default'}
            size="sm"
            onPress={() => handleFollowToggle(item)}
            className="ml-3">
            {item.userFollowing ? (
              <UserCheck size={16} className="text-gray-700" />
            ) : (
              <UserPlus size={16} className="text-white" />
            )}
            <Text
              className={`ml-1 text-sm ${
                item.userFollowing ? 'text-gray-700' : 'text-white'
              }`}>
              {item.userFollowing ? 'Following' : 'Follow'}
            </Text>
          </Button>
        </View>

        {/* Recent Top Post Preview */}
        {item.topPost && (
          <View className="mt-4 p-3 bg-gray-50 rounded-lg">
            <Text className="text-xs text-gray-500 mb-1">Top Post</Text>
            <Text className="text-sm text-gray-700" numberOfLines={2}>
              {item.topPost.content}
            </Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-xs text-gray-500">
                {formatNumber(item.topPost.voteScore)} votes
              </Text>
              <Text className="text-xs text-gray-400 mx-2">•</Text>
              <Text className="text-xs text-gray-500">
                {formatNumber(item.topPost.commentCount)} comments
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );

  if (loading && creators.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading popular creators...</Text>
      </View>
    );
  }

  if (creators.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Award size={48} className="text-gray-300" />
        <Text className="mt-4 text-gray-600 text-center">
          No popular creators found
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          Check back later for popular creators
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={creators}
      renderItem={renderCreatorItem}
      keyExtractor={item => item.wallet}
      contentContainerStyle={{padding: 16}}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={loading || false}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Popular Creators
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Top creators based on engagement and growth
          </Text>
        </View>
      }
    />
  );
};
