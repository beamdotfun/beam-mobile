import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, FlatList, RefreshControl, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Users,
} from 'lucide-react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Screen} from '../../components/layout/Screen';
import {Header} from '../../components/layout/Header';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Badge} from '../../components/ui/badge';
import {Card, CardContent} from '../../components/ui/card';
import {AuctionCard} from '../../components/auction/AuctionCard';
import {useThemeStore} from '../../store/themeStore';
import {useAuctionStore} from '../../store/auctionStore';
import {Auction, AuctionFilter, AuctionSort} from '../../types/auction';
import {AuctionStackScreenProps} from '../../types/navigation';

const Tab = createMaterialTopTabNavigator();

type Props = AuctionStackScreenProps<'AuctionHome'>;

export default function AuctionHomeScreen({navigation}: Props) {
  const {colors, isDark} = useThemeStore();

  const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 2,
        },
      }}>
      <Tab.Screen
        name="Featured"
        component={FeaturedTab}
        options={{title: 'Featured'}}
      />
      <Tab.Screen
        name="Active"
        component={ActiveTab}
        options={{title: 'Active'}}
      />
      <Tab.Screen
        name="EndingSoon"
        component={EndingSoonTab}
        options={{title: 'Ending Soon'}}
      />
      <Tab.Screen
        name="Trending"
        component={TrendingTab}
        options={{title: 'Trending'}}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistTab}
        options={{title: 'Watchlist'}}
      />
    </Tab.Navigator>
  );

  return (
    <Screen>
      <Header
        title="Auctions"
        rightComponent={
          <View className="flex-row space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('AuctionSearch')}>
              <Search size={20} color={colors.foreground} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('AuctionFilters')}>
              <Filter size={20} color={colors.foreground} />
            </Button>
          </View>
        }
      />

      <TabNavigator />
    </Screen>
  );
}

// Featured Auctions Tab
function FeaturedTab() {
  const {colors} = useThemeStore();
  const {auctions, isLoading, fetchAuctions, stats} = useAuctionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAuctions(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAuctions(true);
    setRefreshing(false);
  }, []);

  const handleAuctionPress = (auction: Auction) => {
    // Navigation would be handled here
    console.log('Navigate to auction:', auction.auctionId);
  };

  const renderStatsCard = () => (
    <Card className="mx-4 mb-4">
      <CardContent className="p-4">
        <Text className="text-lg font-semibold mb-3 text-foreground">
          Auction Stats
        </Text>

        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">
              {stats?.totalAuctions || 0}
            </Text>
            <Text className="text-xs text-muted-foreground">Total</Text>
          </View>

          <View className="items-center">
            <Text className="text-2xl font-bold text-success">
              {stats?.activeAuctions || 0}
            </Text>
            <Text className="text-xs text-muted-foreground">Active</Text>
          </View>

          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">
              {stats?.averageBidAmount?.toFixed(2) || '0.00'}
            </Text>
            <Text className="text-xs text-muted-foreground">Avg Bid</Text>
          </View>

          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">
              {((stats?.participationRate || 0) * 100).toFixed(1)}%
            </Text>
            <Text className="text-xs text-muted-foreground">Participation</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const renderAuction = ({item}: {item: Auction}) => (
    <AuctionCard auction={item} onPress={() => handleAuctionPress(item)} />
  );

  if (isLoading && auctions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-muted-foreground">
          Loading featured auctions...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={auctions}
      renderItem={renderAuction}
      keyExtractor={item => item.auctionId}
      ListHeaderComponent={renderStatsCard}
      contentContainerStyle={{paddingBottom: 20}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// Active Auctions Tab
function ActiveTab() {
  const {auctions, isLoading, setFilter} = useAuctionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setFilter({status: ['active']});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
    setRefreshing(false);
  }, []);

  const renderAuction = ({item}: {item: Auction}) => (
    <AuctionCard auction={item} />
  );

  if (isLoading && auctions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-muted-foreground">
          Loading active auctions...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={auctions.filter(a => a.status === 'active')}
      renderItem={renderAuction}
      keyExtractor={item => item.auctionId}
      contentContainerStyle={{padding: 16, paddingBottom: 20}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// Ending Soon Tab
function EndingSoonTab() {
  const {auctions, isLoading, setFilter} = useAuctionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setFilter({
      status: ['ending_soon', 'active'],
      timeRemaining: 'ending_soon',
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const renderAuction = ({item}: {item: Auction}) => (
    <AuctionCard auction={item} compact />
  );

  const endingSoonAuctions = auctions
    .filter(a => a.status === 'ending_soon' || a.status === 'active')
    .sort(
      (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
    );

  if (isLoading && endingSoonAuctions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Clock size={48} color="#666" />
        <Text className="text-muted-foreground mt-4">
          Loading ending soon auctions...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={endingSoonAuctions}
      renderItem={renderAuction}
      keyExtractor={item => item.auctionId}
      contentContainerStyle={{padding: 16, paddingBottom: 20}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// Trending Tab
function TrendingTab() {
  const {auctions, isLoading, setSort} = useAuctionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSort({field: 'totalBidders', direction: 'desc'});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const renderAuction = ({item}: {item: Auction}) => (
    <AuctionCard auction={item} />
  );

  const trendingAuctions = [...auctions].sort(
    (a, b) => b.totalBidders + b.totalBids - (a.totalBidders + a.totalBids),
  );

  if (isLoading && trendingAuctions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <TrendingUp size={48} color="#666" />
        <Text className="text-muted-foreground mt-4">
          Loading trending auctions...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trendingAuctions}
      renderItem={renderAuction}
      keyExtractor={item => item.auctionId}
      contentContainerStyle={{padding: 16, paddingBottom: 20}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// Watchlist Tab
function WatchlistTab() {
  const {auctions, watchlist, isLoading, fetchWatchlist} = useAuctionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWatchlist();
    setRefreshing(false);
  }, []);

  const renderAuction = ({item}: {item: Auction}) => (
    <AuctionCard auction={item} showWatchButton={false} />
  );

  // Filter auctions that are in the watchlist
  const watchedAuctions = auctions.filter(auction =>
    watchlist.some(item => item.auctionId === auction.auctionId),
  );

  if (isLoading && watchedAuctions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Star size={48} color="#666" />
        <Text className="text-muted-foreground mt-4">Loading watchlist...</Text>
      </View>
    );
  }

  if (watchedAuctions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Star size={64} color="#666" />
        <Text className="text-lg font-semibold text-foreground mt-4 mb-2">
          No Watched Auctions
        </Text>
        <Text className="text-muted-foreground text-center">
          Add auctions to your watchlist to track them here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={watchedAuctions}
      renderItem={renderAuction}
      keyExtractor={item => item.auctionId}
      contentContainerStyle={{padding: 16, paddingBottom: 20}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
