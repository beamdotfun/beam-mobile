import React, {useEffect, useState} from 'react';
import {View, ScrollView, TextInput, Alert, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  TrendingUp,
  Star,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
} from 'lucide-react-native';
import {usePlatformStore} from '../stores/platformStore';
import {
  Platform,
  PlatformDiscoveryFilters,
  PlatformCategory,
  PlatformVote,
  PlatformRankingEntry,
} from '../types/platform';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {useFeatureFlag} from '../hooks/useFeatureFlag';
import {cn} from '../lib/utils';

export const PlatformDiscoveryScreen: React.FC = () => {
  const {
    platforms,
    platformRankings,
    platformStatistics,
    userVotes,
    recommendations,
    isLoading,
    isVoting,
    error,
    fetchPlatforms,
    fetchPlatformRankings,
    fetchPlatformStatistics,
    fetchUserVotes,
    fetchRecommendations,
    votePlatform,
    setSelectedPlatform,
    clearError,
    refreshAll,
  } = usePlatformStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PlatformDiscoveryFilters>({});
  const [selectedTab, setSelectedTab] = useState<'discover' | 'rankings' | 'stats'>('discover');
  const [refreshing, setRefreshing] = useState(false);

  const platformRankingsEnabled = useFeatureFlag('platform_rankings_enabled');
  const platformStatsEnabled = useFeatureFlag('platform_stats_enabled');

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchPlatforms(),
        platformRankingsEnabled && fetchPlatformRankings(),
        platformStatsEnabled && fetchPlatformStatistics(),
        fetchUserVotes(),
        fetchRecommendations(),
      ]);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleSearch = () => {
    fetchPlatforms({...filters, search: searchQuery});
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const handleVote = async (
    platformId: string,
    voteType: 'upvote' | 'downvote',
  ) => {
    try {
      await votePlatform(platformId, voteType);
      Alert.alert('Success', 'Vote submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const getUserVote = (platformId: string): PlatformVote | undefined => {
    return userVotes.find(vote => vote.platformId === platformId);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    fetchPlatforms();
  };

  const applyFilters = () => {
    fetchPlatforms({...filters, search: searchQuery});
    setShowFilters(false);
  };

  if (isLoading && platforms.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading platforms...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-semibold text-gray-900">
            Platform Discovery
          </Text>
          <Text className="text-sm text-gray-600">
            Find and vote on advertising platforms
          </Text>

          {/* Quick Stats */}
          {platformStatistics && (
            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
              <View className="items-center">
                <Text className="text-lg font-bold text-blue-600">
                  {platformStatistics.totalPlatforms}
                </Text>
                <Text className="text-xs text-gray-500">Total</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-green-600">
                  {platformStatistics.activePlatforms}
                </Text>
                <Text className="text-xs text-gray-500">Active</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-purple-600">
                  {platformStatistics.verifiedPlatforms}
                </Text>
                <Text className="text-xs text-gray-500">Verified</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-orange-600">
                  {platformStatistics.averageRating.toFixed(1)}
                </Text>
                <Text className="text-xs text-gray-500">Avg Rating</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View className="bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row px-4">
              {[
                {id: 'discover', label: 'Discover', icon: Search},
                ...(platformRankingsEnabled
                  ? [{id: 'rankings', label: 'Rankings', icon: TrendingUp}]
                  : []),
                ...(platformStatsEnabled
                  ? [{id: 'stats', label: 'Statistics', icon: Star}]
                  : []),
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? 'default' : 'ghost'}
                  className={cn(
                    'mr-2 flex-row items-center space-x-2 px-4 py-2',
                    selectedTab === tab.id && 'border-b-2 border-blue-500',
                  )}
                  onPress={() => setSelectedTab(tab.id as any)}>
                  <tab.icon
                    size={16}
                    color={selectedTab === tab.id ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    className={cn(
                      'text-sm',
                      selectedTab === tab.id
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600',
                    )}>
                    {tab.label}
                  </Text>
                </Button>
              ))}
            </View>
          </ScrollView>
        </View>

        {selectedTab === 'discover' && (
          <>
            {/* Search and Filters */}
            <View className="bg-white border-b border-gray-200 p-4">
              <View className="flex-row space-x-2 mb-3">
                <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <Search size={20} color="#6B7280" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search platforms..."
                    className="flex-1 ml-2 text-base"
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setShowFilters(!showFilters)}
                  className={cn(
                    'px-3',
                    Object.keys(filters).length > 0 &&
                      'bg-blue-50 border-blue-200',
                  )}>
                  <Filter size={16} color="#6B7280" />
                  {Object.keys(filters).length > 0 && (
                    <Badge className="ml-1 h-5 w-5 bg-blue-500">
                      <Text className="text-xs text-white">
                        {Object.keys(filters).length}
                      </Text>
                    </Badge>
                  )}
                </Button>
              </View>

              {/* Filter Options */}
              {showFilters && (
                <View className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* Category Filter */}
                  <View>
                    <Text className="text-sm font-medium mb-2 text-gray-700">
                      Category
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}>
                      <View className="flex-row space-x-2">
                        {[
                          'gaming', 'defi', 'nft', 'social', 'entertainment',
                          'education', 'ecommerce', 'other'
                        ].map(category => (
                          <Button
                            key={category}
                            variant={
                              filters.category === category
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onPress={() =>
                              setFilters(prev => ({
                                ...prev,
                                category:
                                  prev.category === category
                                    ? undefined
                                    : (category as PlatformCategory),
                              }))
                            }>
                            <Text
                              className={cn(
                                'capitalize text-sm',
                                filters.category === category
                                  ? 'text-white'
                                  : 'text-gray-700',
                              )}>
                              {category}
                            </Text>
                          </Button>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Numeric Filters */}
                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium mb-1 text-gray-700">
                        Min Rating
                      </Text>
                      <TextInput
                        value={filters.minRating?.toString() || ''}
                        onChangeText={text =>
                          setFilters(prev => ({
                            ...prev,
                            minRating: text ? parseFloat(text) : undefined,
                          }))
                        }
                        placeholder="0-5"
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium mb-1 text-gray-700">
                        Max Fee (SOL)
                      </Text>
                      <TextInput
                        value={filters.maxFee?.toString() || ''}
                        onChangeText={text =>
                          setFilters(prev => ({
                            ...prev,
                            maxFee: text ? parseFloat(text) : undefined,
                          }))
                        }
                        placeholder="e.g. 0.01"
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                      />
                    </View>
                  </View>

                  {/* Boolean Filters */}
                  <View className="flex-row space-x-4">
                    <Button
                      variant={
                        filters.verified === true ? 'default' : 'outline'
                      }
                      size="sm"
                      onPress={() =>
                        setFilters(prev => ({
                          ...prev,
                          verified: prev.verified === true ? undefined : true,
                        }))
                      }>
                      <Text
                        className={cn(
                          'text-sm',
                          filters.verified === true
                            ? 'text-white'
                            : 'text-gray-700',
                        )}>
                        Verified Only
                      </Text>
                    </Button>
                    <Button
                      variant={filters.active === true ? 'default' : 'outline'}
                      size="sm"
                      onPress={() =>
                        setFilters(prev => ({
                          ...prev,
                          active: prev.active === true ? undefined : true,
                        }))
                      }>
                      <Text
                        className={cn(
                          'text-sm',
                          filters.active === true
                            ? 'text-white'
                            : 'text-gray-700',
                        )}>
                        Active Only
                      </Text>
                    </Button>
                  </View>

                  {/* Sort Options */}
                  <View>
                    <Text className="text-sm font-medium mb-2 text-gray-700">
                      Sort By
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}>
                      <View className="flex-row space-x-2">
                        {[
                          {id: 'rating', label: 'Rating'},
                          {id: 'revenue', label: 'Revenue'},
                          {id: 'auctions', label: 'Auctions'},
                          {id: 'created', label: 'Newest'},
                          {id: 'fee_low', label: 'Fee: Low to High'},
                          {id: 'fee_high', label: 'Fee: High to Low'},
                        ].map(sort => (
                          <Button
                            key={sort.id}
                            variant={
                              filters.sortBy === sort.id ? 'default' : 'outline'
                            }
                            size="sm"
                            onPress={() =>
                              setFilters(prev => ({
                                ...prev,
                                sortBy:
                                  prev.sortBy === sort.id
                                    ? undefined
                                    : (sort.id as any),
                              }))
                            }>
                            <Text
                              className={cn(
                                'text-sm',
                                filters.sortBy === sort.id
                                  ? 'text-white'
                                  : 'text-gray-700',
                              )}>
                              {sort.label}
                            </Text>
                          </Button>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Filter Actions */}
                  <View className="flex-row space-x-3 pt-2">
                    <Button onPress={applyFilters} className="flex-1">
                      <Text className="text-white font-medium">
                        Apply Filters
                      </Text>
                    </Button>
                    <Button
                      variant="outline"
                      onPress={clearFilters}
                      className="flex-1">
                      <Text className="text-gray-700 font-medium">
                        Clear All
                      </Text>
                    </Button>
                  </View>
                </View>
              )}
            </View>

            {/* Recommendations Section */}
            {recommendations.length > 0 &&
              !searchQuery &&
              Object.keys(filters).length === 0 && (
                <View className="bg-white border-b border-gray-200 p-4">
                  <Text className="text-lg font-semibold mb-3 text-gray-900">
                    Recommended for You
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-3">
                      {recommendations.map(rec => (
                        <RecommendationCard
                          key={rec.platform.id}
                          recommendation={rec}
                          onPress={() => setSelectedPlatform(rec.platform)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

            {/* Platform List */}
            <ScrollView
              className="flex-1 p-4"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }>
              <View className="space-y-4">
                {platforms.map(platform => {
                  const userVote = getUserVote(platform.id);
                  return (
                    <PlatformCard
                      key={platform.id}
                      platform={platform}
                      userVote={userVote}
                      onVote={handleVote}
                      onPress={() => setSelectedPlatform(platform)}
                      isVoting={isVoting}
                    />
                  );
                })}

                {platforms.length === 0 && !isLoading && (
                  <View className="flex-1 justify-center items-center py-12">
                    <Search size={48} color="#9CA3AF" />
                    <Text className="text-lg font-medium text-gray-500 mt-4">
                      No platforms found
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                      Try adjusting your search terms or filters
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </>
        )}

        {selectedTab === 'rankings' && platformRankingsEnabled && (
          <ScrollView
            className="flex-1 p-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            <View className="space-y-4">
              {platformRankings?.platforms.map(entry => (
                <RankingCard
                  key={entry.platform.id}
                  entry={entry}
                  onPress={() => setSelectedPlatform(entry.platform)}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {selectedTab === 'stats' && platformStatsEnabled && (
          <ScrollView
            className="flex-1 p-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            {platformStatistics && (
              <StatisticsView statistics={platformStatistics} />
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

// Platform Card Component
const PlatformCard: React.FC<{
  platform: Platform;
  userVote?: PlatformVote;
  onVote: (platformId: string, voteType: 'upvote' | 'downvote') => void;
  onPress: () => void;
  isVoting: boolean;
}> = ({platform, userVote, onVote, onPress, isVoting}) => {
  return (
    <Card className="p-4 bg-white">
      <View className="space-y-3">
        {/* Header */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row items-center space-x-2 mb-1">
              <Text className="font-semibold text-lg text-gray-900">
                {platform.platformName}
              </Text>
              {platform.isVerified && (
                <Star size={16} color="#3B82F6" fill="#3B82F6" />
              )}
              <Badge
                variant={
                  platform.activityStatus === 'active' ? 'success' : 'secondary'
                }
                className="ml-2">
                <Text className="text-xs font-medium">
                  {platform.activityStatus.toUpperCase()}
                </Text>
              </Badge>
            </View>
            <Text className="text-sm text-gray-600">
              {platform.platformUrl}
            </Text>
            {platform.description && (
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                {platform.description}
              </Text>
            )}

            {/* Tags */}
            {platform.tags && platform.tags.length > 0 && (
              <View className="flex-row flex-wrap mt-2">
                {platform.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="mr-1 mb-1">
                    <Text className="text-xs">{tag}</Text>
                  </Badge>
                ))}
              </View>
            )}
          </View>

          <View className="items-end ml-4">
            <Text className="text-lg font-bold text-green-600">
              {(platform.platformFee / 1000000).toFixed(3)} SOL
            </Text>
            <Text className="text-xs text-gray-500">Platform Fee</Text>
          </View>
        </View>

        {/* Metrics */}
        <View className="flex-row justify-between py-2 border-t border-gray-100">
          <View className="items-center">
            <View className="flex-row items-center">
              <Star size={14} color="#FCD34D" fill="#FCD34D" />
              <Text className="font-medium ml-1">
                {platform.platformRating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">Rating</Text>
          </View>
          <View className="items-center">
            <Text className="font-medium">{platform.totalVotes}</Text>
            <Text className="text-xs text-gray-500">Votes</Text>
          </View>
          <View className="items-center">
            <Text className="font-medium">{platform.totalAuctionsHosted}</Text>
            <Text className="text-xs text-gray-500">Auctions</Text>
          </View>
          <View className="items-center">
            <Text className="font-medium">
              {(platform.totalRevenueGenerated / 1000000000).toFixed(2)} SOL
            </Text>
            <Text className="text-xs text-gray-500">Revenue</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
          <Button variant="outline" onPress={onPress} className="flex-1 mr-3">
            <Text className="text-gray-700">View Details</Text>
          </Button>

          <View className="flex-row space-x-2">
            <Button
              variant={userVote?.voteType === 'upvote' ? 'default' : 'outline'}
              size="sm"
              onPress={() => onVote(platform.id, 'upvote')}
              disabled={isVoting}
              className={cn(
                'px-3',
                userVote?.voteType === 'upvote' && 'bg-green-500 border-green-500'
              )}>
              <ThumbsUp
                size={16}
                color={userVote?.voteType === 'upvote' ? 'white' : '#6B7280'}
              />
            </Button>
            <Button
              variant={
                userVote?.voteType === 'downvote' ? 'default' : 'outline'
              }
              size="sm"
              onPress={() => onVote(platform.id, 'downvote')}
              disabled={isVoting}
              className={cn(
                'px-3',
                userVote?.voteType === 'downvote' && 'bg-red-500 border-red-500'
              )}>
              <ThumbsDown
                size={16}
                color={userVote?.voteType === 'downvote' ? 'white' : '#6B7280'}
              />
            </Button>
          </View>
        </View>
      </View>
    </Card>
  );
};

// Ranking Card Component
const RankingCard: React.FC<{
  entry: PlatformRankingEntry;
  onPress: () => void;
}> = ({entry, onPress}) => {
  const getTrendIcon = () => {
    switch (entry.trend) {
      case 'up':
        return {icon: '↗', color: '#10B981', bgColor: '#D1FAE5'};
      case 'down':
        return {icon: '↘', color: '#EF4444', bgColor: '#FEE2E2'};
      default:
        return {icon: '→', color: '#6B7280', bgColor: '#F3F4F6'};
    }
  };

  const trend = getTrendIcon();

  return (
    <Card className="p-4 bg-white">
      <View className="flex-row items-center space-x-4">
        {/* Rank */}
        <View className="items-center">
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-blue-600">
              #{entry.rank}
            </Text>
            {entry.previousRank && (
              <View
                className="ml-2"
                style={{backgroundColor: trend.bgColor}}
                className="px-1 rounded">
                <Text
                  style={{color: trend.color}}
                  className="text-sm font-medium">
                  {trend.icon}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-gray-500">
            Score: {entry.score.toFixed(1)}
          </Text>
        </View>

        {/* Platform Info */}
        <View className="flex-1">
          <View className="flex-row items-center space-x-2">
            <Text className="font-semibold text-gray-900">
              {entry.platform.platformName}
            </Text>
            {entry.platform.isVerified && (
              <Star size={14} color="#3B82F6" fill="#3B82F6" />
            )}
          </View>
          <Text className="text-sm text-gray-600">
            {entry.platform.category}

          <View className="flex-row space-x-4 mt-1">
            <Text className="text-xs text-gray-500">
              Rating: {entry.scoreComponents.rating.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500">
              Volume: {entry.scoreComponents.volume.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500">
              Activity: {entry.scoreComponents.activity.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Action */}
        <Button variant="outline" size="sm" onPress={onPress}>
          <Text className="text-gray-700">View</Text>
        </Button>
      </View>
    </Card>
  );
};

// Recommendation Card Component
const RecommendationCard: React.FC<{
  recommendation: any;
  onPress: () => void;
}> = ({recommendation, onPress}) => {
  return (
    <Card className="p-3 bg-white w-64">
      <View className="space-y-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {recommendation.platform.platformName}
          </Text>
          <Badge variant="secondary">
            <Text className="text-xs">{recommendation.category}</Text>
          </Badge>
        </View>

        <Text className="text-sm text-gray-600" numberOfLines={2}>
          {recommendation.platform.description || 'No description available'}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Star size={12} color="#FCD34D" fill="#FCD34D" />
            <Text className="text-sm font-medium ml-1">
              {recommendation.platform.platformRating.toFixed(1)}
            </Text>
          </View>
          <Text className="text-sm text-blue-600 font-medium">
            {recommendation.score.toFixed(0)}% match
          </Text>
        </View>

          variant="outline"
          size="sm"
          onPress={onPress}
          className="w-full">
          <Text className="text-gray-700">Learn More</Text>
        </Button>
      </View>
    </Card>
  );
};

// Statistics View Component
const StatisticsView: React.FC<{
  statistics: any;
}> = ({statistics}) => {
  return (
    <View className="space-y-4">
      {/* Overview Cards */}
      <View className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-white">
          <Text className="text-2xl font-bold text-blue-600">
            {statistics.totalPlatforms}
          </Text>
          <Text className="text-sm text-gray-600">Total Platforms</Text>
        </Card>
        <Card className="p-4 bg-white">
          <Text className="text-2xl font-bold text-green-600">
            {statistics.activePlatforms}
          </Text>
          <Text className="text-sm text-gray-600">Active Platforms</Text>
        </Card>
      </View>

      {/* Category Distribution */}
      <Card className="p-4 bg-white">
        <Text className="text-lg font-semibold mb-3 text-gray-900">
          Category Distribution
        </Text>
        <View className="space-y-2">
          {Object.entries(statistics.categoryCounts).map(
            ([category, count]) => (
              <View
                key={category}
                className="flex-row justify-between items-center">
                <Text className="capitalize text-gray-700">{category}</Text>
                <View className="flex-row items-center">
                  <View
                    className="bg-blue-200 rounded-full mr-2"
                    style={{
                      width: Math.max(20, (count as number) * 10),
                      height: 8,
                    }}
                  />
                  <Text className="font-medium text-gray-900">
                    {count as number}
                  </Text>
                </View>
              </View>
            ),
          )}
        </View>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-4 bg-white">
        <Text className="text-lg font-semibold mb-3 text-gray-900">
          Platform Performance
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Average Rating</Text>
            <Text className="font-medium text-gray-900">
              {statistics.averageRating.toFixed(1)}/5.0
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Total Revenue</Text>
            <Text className="font-medium text-gray-900">
              {(statistics.totalRevenue / 1000000000).toFixed(2)} SOL
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Total Auctions</Text>
            <Text className="font-medium text-gray-900">
              {statistics.totalAuctions}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};
