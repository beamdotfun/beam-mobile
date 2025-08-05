import React, {useEffect, useState} from 'react';
import {View, ScrollView, TouchableOpacity, Share, Alert} from 'react-native';
import {
  Text,
  Button,
  Card,
  Badge,
  Avatar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from '../../components/ui';
import {
  Clock,
  Eye,
  Heart,
  Share2,
  Shield,
  AlertCircle,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import {useNFTAuctionStore} from '../../store/nftAuctionStore';
import {useAuthStore} from '../../store/auth';
import {useNavigation} from '@react-navigation/native';
import {formatDistanceToNow} from 'date-fns';
import FastImage from 'react-native-fast-image';
import {formatSOL} from '../../utils/formatting';

// Sub-components
import {BidHistory} from '../../components/auctions/BidHistory';
import {NFTDetails} from '../../components/auctions/NFTDetails';
import {AuctionCountdown} from '../../components/auctions/AuctionCountdown';
import {PlaceBidModal} from '../../components/auctions/PlaceBidModal';

interface AuctionDetailProps {
  route: {
    params: {
      auctionId: string;
    };
  };
}

export function AuctionDetail({route}: AuctionDetailProps) {
  const {auctionId} = route.params;
  const navigation = useNavigation();
  const {user} = useAuthStore();
  const {
    auctions,
    bids,
    watchlist,
    myBids,
    fetchAuction,
    fetchBids,
    placeBid,
    buyNow,
    addToWatchlist,
    removeFromWatchlist,
    subscribeToAuction,
    unsubscribeFromAuction,
  } = useNFTAuctionStore();

  const [showBidModal, setShowBidModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const auction = auctions[auctionId];
  const auctionBids = bids[auctionId] || [];
  const isWatching = watchlist.includes(auctionId);
  const myHighestBid = myBids[auctionId];
  const isHighestBidder = auction?.highestBidder === user?.wallet;

  useEffect(() => {
    fetchAuction(auctionId);
    fetchBids(auctionId);

    return () => {
      unsubscribeFromAuction(auctionId);
    };
  }, [auctionId, fetchAuction, fetchBids, unsubscribeFromAuction]);

  const handleBid = async (amount: number) => {
    try {
      await placeBid(auctionId, amount);
      setShowBidModal(false);
      Alert.alert('Success', 'Your bid has been placed!');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to place bid',
      );
    }
  };

  const handleBuyNow = () => {
    if (!auction?.buyNowPrice) {
      return;
    }

    Alert.alert(
      'Buy Now',
      `Purchase this NFT for ${formatSOL(auction.buyNowPrice)} SOL?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Buy Now',
          onPress: async () => {
            try {
              await buyNow(auctionId);
              Alert.alert('Success', 'NFT purchased successfully!');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Failed to purchase NFT',
              );
            }
          },
        },
      ],
    );
  };

  const handleWatchlist = async () => {
    try {
      if (isWatching) {
        await removeFromWatchlist(auctionId);
      } else {
        await addToWatchlist(auctionId);
      }
    } catch (error) {
      console.error('Watchlist action failed:', error);
    }
  };

  const handleShare = async () => {
    if (!auction) {
      return;
    }

    try {
      await Share.share({
        message: `Check out this NFT auction: ${auction.nft.name}`,
        url: `https://solanachat.app/auction/${auctionId}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (!auction) {
    return <LoadingSkeleton />;
  }

  const canBid = auction.status === 'active' && !isHighestBidder;
  const canBuyNow = auction.buyNowPrice && auction.status === 'active';

  return (
    <View className="flex-1 bg-background">
      <ScrollView>
        {/* NFT Image */}
        <View className="relative">
          <FastImage
            source={{uri: auction.nft.image}}
            className="w-full h-96"
            resizeMode="cover"
          />

          {/* Action Buttons */}
          <View className="absolute top-4 right-4 flex-row gap-2">
            <TouchableOpacity
              onPress={handleWatchlist}
              className="bg-background/80 rounded-full p-2">
              <Heart
                className={`h-5 w-5 ${
                  isWatching ? 'fill-red-500 text-red-500' : ''
                }`}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              className="bg-background/80 rounded-full p-2">
              <Share2 className="h-5 w-5" />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View className="absolute top-4 left-4">
            <Badge
              variant={
                auction.status === 'active'
                  ? 'default'
                  : auction.status === 'ending'
                  ? 'destructive'
                  : 'secondary'
              }>
              {auction.status === 'ending' ? 'Ending Soon!' : auction.status}
            </Badge>
          </View>
        </View>

        <View className="p-4">
          {/* Title and Brand */}
          <Text className="text-2xl font-bold mb-2">{auction.nft.name}</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'BrandProfile' as never,
                {brandId: auction.brandId} as never,
              )
            }
            className="flex-row items-center gap-2 mb-4">
            <Avatar source={{uri: auction.brand.logo}} size="sm" />
            <Text className="text-muted-foreground">{auction.brand.name}</Text>
            {auction.brand.verified && (
              <Badge variant="outline" className="text-xs">
                Verified
              </Badge>
            )}
          </TouchableOpacity>

          {/* Auction Info Card */}
          <Card className="mb-4 p-4">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">
                  Current Bid
                </Text>
                <Text className="text-3xl font-bold">
                  {formatSOL(auction.currentBid)} SOL
                </Text>
                {myHighestBid && (
                  <Text className="text-sm text-muted-foreground mt-1">
                    Your bid: {formatSOL(myHighestBid.amount)} SOL
                  </Text>
                )}
              </View>

              <View className="items-end">
                <Text className="text-sm text-muted-foreground mb-1">
                  {auction.status === 'active' ? 'Ends in' : 'Ended'}
                </Text>
                {auction.status === 'active' ? (
                  <AuctionCountdown endTime={auction.endTime} />
                ) : (
                  <Text className="text-lg font-medium">
                    {formatDistanceToNow(new Date(auction.endTime), {
                      addSuffix: true,
                    })}
                  </Text>
                )}
              </View>
            </View>

            {/* Bid Stats */}
            <View className="flex-row justify-around pt-4 border-t border-border">
              <View className="items-center">
                <Text className="text-2xl font-semibold">
                  {auction.bidCount}
                </Text>
                <Text className="text-sm text-muted-foreground">Bids</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-semibold">
                  {auction.watcherCount}
                </Text>
                <Text className="text-sm text-muted-foreground">Watching</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-semibold">
                  {auction.viewCount}
                </Text>
                <Text className="text-sm text-muted-foreground">Views</Text>
              </View>
            </View>
          </Card>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mb-4">
            {canBid && (
              <Button onPress={() => setShowBidModal(true)} className="flex-1">
                Place Bid
              </Button>
            )}

            {canBuyNow && (
              <Button
                onPress={handleBuyNow}
                variant="outline"
                className="flex-1">
                Buy Now • {formatSOL(auction.buyNowPrice!)} SOL
              </Button>
            )}

            {isHighestBidder && (
              <View className="flex-1 bg-primary/10 rounded-lg p-3 items-center">
                <Text className="text-primary font-medium">
                  You're the highest bidder! 🎉
                </Text>
              </View>
            )}
          </View>

          {/* Minimum bid info */}
          {canBid && (
            <View className="mb-4 p-3 bg-muted/50 rounded-lg">
              <Text className="text-sm text-muted-foreground">
                Minimum bid:{' '}
                {formatSOL(auction.currentBid + auction.bidIncrement)} SOL
              </Text>
            </View>
          )}

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="bids" className="flex-1">
                Bids ({auction.bidCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <NFTDetails nft={auction.nft} />
            </TabsContent>

            <TabsContent value="bids">
              <BidHistory bids={auctionBids} currentBid={auction.currentBid} />
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>

      {/* Place Bid Modal */}
      <PlaceBidModal
        visible={showBidModal}
        onClose={() => setShowBidModal(false)}
        currentBid={auction.currentBid}
        minIncrement={auction.bidIncrement}
        onBid={handleBid}
      />
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <Skeleton className="w-full h-96" />
      <View className="p-4">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <View className="flex-row gap-2">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </View>
      </View>
    </View>
  );
}
