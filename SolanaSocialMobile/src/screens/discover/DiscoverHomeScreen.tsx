import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, RefreshControl} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Screen} from '../../components/layout/Screen';
import {Header} from '../../components/layout/Header';
import {SearchBar} from '../../components/discovery/SearchBar';
import {SearchResults} from '../../components/discovery/SearchResults';
import {TrendingSection} from '../../components/discovery/TrendingSection';
import {LeaderboardSection} from '../../components/discovery/LeaderboardSection';
import {RecommendationsSection} from '../../components/discovery/RecommendationsSection';
import {useDiscoveryStore} from '../../store/discovery';
import {useThemeStore} from '../../store/themeStore';
import {DiscoverStackScreenProps} from '../../types/navigation';
import {TrendingTopic} from '../../types/discovery';

type Props = DiscoverStackScreenProps<'DiscoverHome'>;

const Tab = createMaterialTopTabNavigator();

function DiscoverTab({navigation}: {navigation: any}) {
  const {
    discoverySections,
    discoveryLoading,
    loadDiscoveryContent,
    loadRecommendations,
  } = useDiscoveryStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDiscoveryContent();
    loadRecommendations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDiscoveryContent(), loadRecommendations()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserPress = (walletAddress: string) => {
    // Navigate to Feed tab first, then to UserProfile screen
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Feed', {
        screen: 'UserProfile',
        params: {walletAddress},
      });
    }
  };

  const handleBrandPress = (brandAddress: string) => {
    // Navigate to brand detail screen when implemented
    console.log('Navigate to brand:', brandAddress);
  };

  const handleTopicPress = (topic: TrendingTopic | string) => {
    // Navigate to topic search results
    const searchTerm = typeof topic === 'string' ? topic : topic.hashtag;
    console.log('Search for topic:', searchTerm);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      <RecommendationsSection
        onUserPress={handleUserPress}
        onBrandPress={handleBrandPress}
        onTopicPress={handleTopicPress}
      />
      <TrendingSection onTopicPress={handleTopicPress} />

      {discoverySections.map(section => (
        <View key={section.id} className="mb-6">
          <Text className="text-lg font-bold text-foreground px-4 mb-3">
            {section.title}
          </Text>
          {/* Section items can be rendered here based on section.type */}
        </View>
      ))}
    </ScrollView>
  );
}

function TrendingTab({navigation}: {navigation: any}) {
  const handleTopicPress = (topic: TrendingTopic) => {
    // Navigate to topic search results
    console.log('Search for topic:', topic.hashtag);
  };

  return <TrendingSection showAll onTopicPress={handleTopicPress} />;
}

function ControversialTab() {
  // TODO: Implement controversial posts feed
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
      <Text style={{fontSize: 16, fontWeight: '600'}}>Controversial Posts</Text>
      <Text style={{fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8}}>
        Posts that spark debate and discussion will appear here.
      </Text>
    </View>
  );
}

function LeaderboardTab({navigation}: {navigation: any}) {
  const handleUserPress = (walletAddress: string) => {
    // Navigate to Feed tab first, then to UserProfile screen
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Feed', {
        screen: 'UserProfile',
        params: {walletAddress},
      });
    }
  };

  return <LeaderboardSection onUserPress={handleUserPress} />;
}

export default function DiscoverHomeScreen({navigation}: Props) {
  const {colors} = useThemeStore();
  const {searchQuery, clearSearch} = useDiscoveryStore();
  const [searchFocused, setSearchFocused] = useState(false);

  const handleUserPress = (walletAddress: string) => {
    // Navigate to Feed tab first, then to UserProfile screen
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Feed', {
        screen: 'UserProfile',
        params: {walletAddress},
      });
    }
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate('SocialStack' as any, {
      screen: 'PostDetail',
      params: {postId},
    });
  };

  const handleBrandPress = (brandAddress: string) => {
    // Navigate to brand detail screen when implemented
    console.log('Navigate to brand:', brandAddress);
  };

  const handleSearchSubmit = () => {
    setSearchFocused(false);
  };

  if (searchQuery || searchFocused) {
    return (
      <Screen>
        <View className="px-4 py-3">
          <SearchBar
            onBlur={() => setSearchFocused(false)}
            onSearchSubmit={handleSearchSubmit}
            autoFocus={searchFocused}
          />
        </View>

        <SearchResults
          onUserPress={handleUserPress}
          onPostPress={handlePostPress}
          onBrandPress={handleBrandPress}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Discover" />

      <View className="px-4 py-3 border-b border-border">
        <SearchBar
          onFocus={() => setSearchFocused(true)}
          placeholder="Search users, posts, brands..."
        />
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarIndicatorStyle: {backgroundColor: colors.primary},
          tabBarStyle: {backgroundColor: colors.background},
          tabBarLabelStyle: {fontSize: 14, fontWeight: '600'},
        }}>
        <Tab.Screen
          name="Discover"
          children={() => <DiscoverTab navigation={navigation} />}
        />
        <Tab.Screen
          name="Trending"
          children={() => <TrendingTab navigation={navigation} />}
        />
        <Tab.Screen
          name="Controversial"
          children={() => <ControversialTab />}
        />
        <Tab.Screen
          name="Leaderboard"
          children={() => <LeaderboardTab navigation={navigation} />}
        />
      </Tab.Navigator>
    </Screen>
  );
}
