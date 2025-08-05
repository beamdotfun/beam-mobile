import React, {useEffect, useState} from 'react';
import {View, FlatList, RefreshControl, TouchableOpacity} from 'react-native';
import {Text, Card, Badge, Button, Input, Skeleton} from '../../components/ui';
import {Search, Filter, TrendingUp, Clock, Eye} from 'lucide-react-native';
import {useNFTAuctionStore} from '../../store/nftAuctionStore';
import {useNavigation} from '@react-navigation/native';
import {NFTAuction} from '../../types/auctions';
import {AuctionCard} from '../../components/auctions/AuctionCard';

export function AuctionList() {
  const navigation = useNavigation();
  const {
    auctions,
    loading,
    refreshing,
    searchQuery,
    sortBy,
    watchlist,
    fetchAuctions,
    setSearchQuery,
    setSortBy,
    addToWatchlist,
    removeFromWatchlist,
  } = useNFTAuctionStore();

  const [showFilters, setShowFilters] = useState(false);

  const auctionList = Object.values(auctions);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleRefresh = async () => {
    await fetchAuctions();
  };

  const handleAuctionPress = (auction: NFTAuction) => {
    navigation.navigate(
      'AuctionDetail' as never,
      {auctionId: auction.id} as never,
    );
  };

  const handleWatchlist = async (auctionId: string) => {
    try {
      if (watchlist.includes(auctionId)) {
        await removeFromWatchlist(auctionId);
      } else {
        await addToWatchlist(auctionId);
      }
    } catch (error) {
      console.error('Watchlist action failed:', error);
    }
  };

  const renderHeader = () => (
    <View>
      {/* Featured Auctions */}
      <FeaturedAuctions onPress={handleAuctionPress} />

      {/* Search Bar */}
      <View className="px-4 mb-4">
        <View className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search NFT auctions..."
            className="pl-10"
          />
        </View>
      </View>

      {/* Sort and Filter Bar */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSortBy('ending_soon')}
            className={`px-3 py-1.5 rounded-full ${
              sortBy === 'ending_soon' ? 'bg-primary' : 'bg-muted'
            }`}>
            <Text
              className={
                sortBy === 'ending_soon'
                  ? 'text-primary-foreground text-sm'
                  : 'text-foreground text-sm'
              }>
              Ending Soon
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy('price_low')}
            className={`px-3 py-1.5 rounded-full ${
              sortBy === 'price_low' ? 'bg-primary' : 'bg-muted'
            }`}>
            <Text
              className={
                sortBy === 'price_low'
                  ? 'text-primary-foreground text-sm'
                  : 'text-foreground text-sm'
              }>
              Price ↑
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy('most_bids')}
            className={`px-3 py-1.5 rounded-full ${
              sortBy === 'most_bids' ? 'bg-primary' : 'bg-muted'
            }`}>
            <Text
              className={
                sortBy === 'most_bids'
                  ? 'text-primary-foreground text-sm'
                  : 'text-foreground text-sm'
              }>
              Hot 🔥
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          size="sm"
          variant="outline"
          onPress={() => setShowFilters(true)}>
          <Filter className="h-4 w-4" />
        </Button>
      </View>

      {/* Active Auctions Header */}
      <View className="px-4 mb-2">
        <Text className="font-semibold text-lg">Live NFT Auctions</Text>
      </View>
    </View>
  );

  const renderAuction = ({item}: {item: NFTAuction}) => (
    <AuctionCard
      auction={item}
      onPress={() => handleAuctionPress(item)}
      onWatchlist={() => handleWatchlist(item.id)}
    />
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center p-8">
      <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
      <Text className="text-lg font-medium mb-2">No active auctions</Text>
      <Text className="text-muted-foreground text-center">
        Check back soon for new NFT auctions
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={auctionList}
        renderItem={renderAuction}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? <LoadingSkeleton /> : renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{paddingBottom: 100}}
      />

      {/* TODO: Filters Sheet */}
      {/* <AuctionFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      /> */}
    </View>
  );
}

// Featured auctions carousel component
function FeaturedAuctions({onPress}: {onPress: (auction: NFTAuction) => void}) {
  const {auctions} = useNFTAuctionStore();

  // Get featured auctions (for now, just get first 3 active ones)
  const featuredAuctions = Object.values(auctions)
    .filter(auction => auction.status === 'active')
    .slice(0, 3);

  if (featuredAuctions.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="px-4 mb-3">
        <Text className="font-semibold text-lg">Featured Auctions</Text>
      </View>

      <FlatList
        data={featuredAuctions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => `featured-${item.id}`}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => onPress(item)}
            className="mr-4 first:ml-4 last:mr-4">
            <Card className="w-72 overflow-hidden">
              <View className="relative">
                <View className="w-full h-40 bg-muted" />
                <Badge className="absolute top-3 left-3">Featured</Badge>
              </View>
              <View className="p-3">
                <Text className="font-semibold mb-1" numberOfLines={1}>
                  {item.nft.name}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Current: {item.currentBid} SOL
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{paddingHorizontal: 0}}
      />
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View className="px-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="mb-4">
          <Skeleton className="w-full h-48" />
          <View className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <View className="flex-row justify-between">
              <View>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-6 w-24" />
              </View>
              <View className="items-end">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-20" />
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}
