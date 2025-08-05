import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Search, X, TrendingUp, Grid, Users, Hash} from 'lucide-react-native';
import {useDiscoveryStore} from '../../store/discoveryStore';
import {TrendingTimeframe} from '../../types/discovery';
import {Button} from '../../components/ui/button';
import {Card} from '../../components/ui/card';
import {TrendingPosts} from '../../components/discovery/TrendingPosts';
import {PopularCreators} from '../../components/discovery/PopularCreators';
import {CategoryGrid} from '../../components/discovery/CategoryGrid';
import {TrendingHashtags} from '../../components/discovery/TrendingHashtags';
import {SearchResultsNew} from '../../components/discovery/SearchResultsNew';

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    discoveryFeed,
    searchResults,
    searchHistory,
    loading,
    refreshing,
    searching,
    error,
    currentSearchQuery,
    currentTrendingTimeframe,
    fetchDiscoveryFeed,
    refreshDiscoveryFeed,
    search,
    clearSearch,
    setTrendingTimeframe,
    clearError,
  } = useDiscoveryStore();

  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'trending' | 'categories' | 'creators' | 'hashtags'
  >('trending');

  useEffect(() => {
    fetchDiscoveryFeed();
  }, []);

  useEffect(() => {
    if (error) {
      // Handle error
      console.error('Discovery error:', error);
      clearError();
    }
  }, [error]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      search(searchQuery.trim());
      setShowSearchHistory(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
    setShowSearchHistory(false);
  };

  const handleSearchHistorySelect = (query: string) => {
    setSearchQuery(query);
    search(query);
    setShowSearchHistory(false);
  };

  const handleTimeframeChange = (timeframe: TrendingTimeframe) => {
    setTrendingTimeframe(timeframe);
  };

  if (loading && !discoveryFeed) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Discovering content...</Text>
      </SafeAreaView>
    );
  }

  const renderSearchBar = () => (
    <View className="px-4 py-3 bg-white border-b border-gray-200">
      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
        <Search className="text-gray-400" size={20} />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Search posts, users, hashtags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          onFocus={() => setShowSearchHistory(true)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <X className="text-gray-400" size={20} />
          </TouchableOpacity>
        )}
      </View>

      {showSearchHistory && searchHistory.length > 0 && (
        <View className="absolute top-14 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {searchHistory.map((query, index) => (
            <TouchableOpacity
              key={index}
              className="px-4 py-3 border-b border-gray-100"
              onPress={() => handleSearchHistorySelect(query)}>
              <Text className="text-gray-700">{query}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View className="bg-white border-b border-gray-200">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-2">
        {[
          {key: 'trending', label: 'Trending', icon: TrendingUp},
          {key: 'categories', label: 'Categories', icon: Grid},
          {key: 'creators', label: 'Creators', icon: Users},
          {key: 'hashtags', label: 'Hashtags', icon: Hash},
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedTab(tab.key as any)}
              className={`flex-row items-center px-4 py-3 mr-2 ${
                isSelected ? 'border-b-2 border-blue-500' : ''
              }`}>
              <Icon
                size={18}
                className={isSelected ? 'text-blue-500' : 'text-gray-500'}
              />
              <Text
                className={`ml-2 font-medium ${
                  isSelected ? 'text-blue-500' : 'text-gray-600'
                }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTimeframePicker = () => (
    <View className="bg-white px-4 py-2 border-b border-gray-100">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['1h', '6h', '24h', '7d'] as TrendingTimeframe[]).map(timeframe => (
          <Button
            key={timeframe}
            variant={
              currentTrendingTimeframe === timeframe ? 'default' : 'outline'
            }
            size="sm"
            onPress={() => handleTimeframeChange(timeframe)}
            className="mr-2">
            <Text
              className={
                currentTrendingTimeframe === timeframe
                  ? 'text-white'
                  : 'text-gray-700'
              }>
              {timeframe === '1h' && '1 Hour'}
              {timeframe === '6h' && '6 Hours'}
              {timeframe === '24h' && '24 Hours'}
              {timeframe === '7d' && '7 Days'}
            </Text>
          </Button>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (searching) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Searching...</Text>
        </View>
      );
    }

    if (searchResults) {
      return (
        <SearchResultsNew
          results={searchResults}
          query={currentSearchQuery}
          loading={searching}
        />
      );
    }

    switch (selectedTab) {
      case 'trending':
        return (
          <View className="flex-1">
            {renderTimeframePicker()}
            <TrendingPosts
              posts={discoveryFeed?.trending.posts || []}
              loading={loading}
              onRefresh={refreshDiscoveryFeed}
            />
          </View>
        );

      case 'categories':
        return (
          <CategoryGrid
            categories={discoveryFeed?.categories || []}
            loading={loading}
            onRefresh={refreshDiscoveryFeed}
          />
        );

      case 'creators':
        return (
          <PopularCreators
            creators={discoveryFeed?.creators || []}
            loading={loading}
            onRefresh={refreshDiscoveryFeed}
          />
        );

      case 'hashtags':
        return (
          <TrendingHashtags
            hashtags={discoveryFeed?.trending.hashtags || []}
            loading={loading}
            onRefresh={refreshDiscoveryFeed}
          />
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-semibold text-gray-900">Explore</Text>
        </View>

        {/* Search Bar */}
        {renderSearchBar()}

        {/* Tabs */}
        {!searchResults && renderTabs()}

        {/* Content */}
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};
