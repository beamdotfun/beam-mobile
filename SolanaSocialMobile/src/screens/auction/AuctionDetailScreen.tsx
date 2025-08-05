import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  Users,
  TrendingUp,
  Heart,
  Share,
  MessageSquare,
  Star,
  Eye,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import {Screen} from '../../components/layout/Screen';
import {Header} from '../../components/layout/Header';
import {Card, CardContent} from '../../components/ui/card';
import {Button} from '../../components/ui/button';
import {Badge} from '../../components/ui/badge';
import {BiddingInterface} from '../../components/auction/BiddingInterface';
import {useThemeStore} from '../../store/themeStore';
import {useAuctionStore} from '../../store/auctionStore';
import {Auction, Bid, AuctionActivity} from '../../types/auction';
import {AuctionStackScreenProps} from '../../types/navigation';
import {formatDistanceToNow, format} from 'date-fns';
import FastImage from 'react-native-fast-image';

type Props = AuctionStackScreenProps<'AuctionDetail'>;

export default function AuctionDetailScreen({route, navigation}: Props) {
  const {auctionId} = route.params;
  const {colors} = useThemeStore();
  const {
    auctionDetails,
    recentBids,
    activities,
    isLoading,
    fetchAuctionDetails,
    addToWatchlist,
    removeFromWatchlist,
  } = useAuctionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showBiddingInterface, setShowBiddingInterface] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const auction = auctionDetails[auctionId];
  const auctionBids = recentBids[auctionId] || [];
  const auctionActivities = activities[auctionId] || [];

  useEffect(() => {
    fetchAuctionDetails(auctionId);
  }, [auctionId]);

  useEffect(() => {
    if (auction) {
      setIsWatching(auction.userIsWatching);

      // Calculate time remaining
      const calculateTimeRemaining = () => {
        const endTime = new Date(auction.endTime).getTime();
        const now = new Date().getTime();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(remaining);
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [auction]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuctionDetails(auctionId);
    setRefreshing(false);
  };

  const handleWatchToggle = async () => {
    try {
      if (isWatching) {
        await removeFromWatchlist(auctionId);
        setIsWatching(false);
      } else {
        await addToWatchlist(auctionId);
        setIsWatching(true);
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    if (ms === 0) {
      return 'Ended';
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = () => {
    if (!auction) {
      return colors.mutedForeground;
    }

    switch (auction.status) {
      case 'ending_soon':
        return colors.warning;
      case 'active':
        return colors.success;
      case 'ended':
        return colors.mutedForeground;
      case 'cancelled':
        return colors.destructive;
      default:
        return colors.primary;
    }
  };

  if (isLoading && !auction) {
    return (
      <Screen>
        <Header
          title="Auction Details"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">
            Loading auction details...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!auction) {
    return (
      <Screen>
        <Header
          title="Auction Details"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View className="flex-1 justify-center items-center p-8">
          <AlertTriangle size={64} color={colors.destructive} />
          <Text className="text-lg font-semibold text-foreground mt-4 mb-2">
            Auction Not Found
          </Text>
          <Text className="text-muted-foreground text-center">
            This auction may have been removed or does not exist
          </Text>
        </View>
      </Screen>
    );
  }

  const BidItem = ({bid}: {bid: Bid}) => (
    <View className="flex-row items-center justify-between py-3 border-b border-border">
      <View className="flex-row items-center flex-1">
        {bid.bidderAvatar && (
          <FastImage
            source={{uri: bid.bidderAvatar}}
            className="w-8 h-8 rounded-full mr-3"
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        <View className="flex-1">
          <Text className="font-medium text-foreground" numberOfLines={1}>
            {bid.bidderName}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(bid.timestamp), {addSuffix: true})}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="font-bold text-foreground">
          {bid.amount.toFixed(3)} SOL
        </Text>
        {bid.isAutoBid && (
          <Badge variant="secondary" className="mt-1">
            <Text className="text-xs">Auto</Text>
          </Badge>
        )}
      </View>
    </View>
  );

  const ActivityItem = ({activity}: {activity: AuctionActivity}) => (
    <View className="flex-row items-start py-3 border-b border-border">
      <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
        {activity.type === 'bid_placed' && (
          <TrendingUp size={14} color={colors.primary} />
        )}
        {activity.type === 'auction_extended' && (
          <Clock size={14} color={colors.warning} />
        )}
        {activity.type === 'auction_ended' && (
          <Star size={14} color={colors.success} />
        )}
        {activity.type === 'payout_distributed' && (
          <Zap size={14} color={colors.success} />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-foreground" numberOfLines={2}>
          {activity.type === 'bid_placed' &&
            `${
              activity.userName
            } placed a bid of ${activity.data.amount?.toFixed(3)} SOL`}
          {activity.type === 'auction_extended' &&
            `Auction extended by ${activity.data.extensionMinutes} minutes`}
          {activity.type === 'auction_ended' &&
            `Auction ended. Winner payout: ${activity.data.winnerPayout?.toFixed(
              3,
            )} SOL`}
          {activity.type === 'payout_distributed' &&
            'Payouts distributed to participants'}
        </Text>
        <Text className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), {addSuffix: true})}
        </Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <Header
        title={auction.title}
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View className="flex-row space-x-2">
            <Button variant="ghost" size="sm" onPress={handleWatchToggle}>
              {isWatching ? (
                <Heart size={20} color={colors.primary} fill={colors.primary} />
              ) : (
                <Eye size={20} color={colors.mutedForeground} />
              )}
            </Button>
            <Button variant="ghost" size="sm" onPress={() => {}}>
              <Share size={20} color={colors.mutedForeground} />
            </Button>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Auction Header */}
        <Card className="m-4 mb-2">
          <CardContent className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                {auction.brandLogo && (
                  <FastImage
                    source={{uri: auction.brandLogo}}
                    className="w-12 h-12 rounded-full mr-3"
                    resizeMode={FastImage.resizeMode.cover}
                  />
                )}
                <View className="flex-1">
                  <Text
                    className="text-lg font-bold text-foreground"
                    numberOfLines={1}>
                    {auction.brandName}
                  </Text>
                  <Text className="text-muted-foreground" numberOfLines={1}>
                    {auction.title}
                  </Text>
                </View>
              </View>

              <Badge
                variant="secondary"
                style={{backgroundColor: `${getStatusColor()}20`}}>
                <Text className="text-xs" style={{color: getStatusColor()}}>
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </Badge>
            </View>

            <Text className="text-foreground mb-4" numberOfLines={3}>
              {auction.description}
            </Text>

            {/* Current Bid */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-3xl font-bold text-foreground">
                  {auction.currentBid.toFixed(3)} SOL
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Current Bid
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-lg font-semibold text-success">
                  +{auction.userPayout.toFixed(3)} SOL
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Your reward
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between mb-4">
              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">
                  {auction.totalBidders}
                </Text>
                <Text className="text-xs text-muted-foreground">Bidders</Text>
              </View>

              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">
                  {auction.totalBids}
                </Text>
                <Text className="text-xs text-muted-foreground">Bids</Text>
              </View>

              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">
                  {auction.qualityScore}/10
                </Text>
                <Text className="text-xs text-muted-foreground">Quality</Text>
              </View>

              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">
                  {auction.expectedReach.toLocaleString()}
                </Text>
                <Text className="text-xs text-muted-foreground">Reach</Text>
              </View>
            </View>

            {/* User Status */}
            {(auction.userHasBid || auction.currentWinner === 'user') && (
              <View className="flex-row space-x-2 mb-4">
                {auction.userHasBid && (
                  <Badge variant="success">
                    <Text className="text-xs">You Bid</Text>
                  </Badge>
                )}
                {auction.currentWinner === 'user' && (
                  <Badge variant="default">
                    <Text className="text-xs">Winning</Text>
                  </Badge>
                )}
              </View>
            )}

            {/* Action Button */}
            {auction.status === 'active' && (
              <Button
                onPress={() => setShowBiddingInterface(true)}
                className="w-full">
                <Zap size={20} color={colors.primaryForeground} />
                <Text className="text-primary-foreground ml-2 font-semibold">
                  Place Bid -{' '}
                  {(auction.currentBid + auction.bidIncrement).toFixed(3)} SOL
                </Text>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Ad Content Preview */}
        {auction.adContent.imageUrl && (
          <Card className="mx-4 mb-2">
            <CardContent className="p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Ad Preview
              </Text>
              <FastImage
                source={{uri: auction.adContent.imageUrl}}
                className="w-full h-48 rounded-lg mb-3"
                resizeMode={FastImage.resizeMode.cover}
              />
              <Text className="text-foreground font-medium mb-1">
                {auction.adContent.title}
              </Text>
              <Text className="text-muted-foreground text-sm mb-3">
                {auction.adContent.description}
              </Text>
              <Button variant="outline" size="sm">
                <Text className="text-muted-foreground">
                  {auction.adContent.callToAction}
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Bids */}
        <Card className="mx-4 mb-2">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Recent Bids ({auctionBids.length})
            </Text>

            {auctionBids.length > 0 ? (
              <View>
                {auctionBids.slice(0, 10).map(bid => (
                  <BidItem key={bid.bidId} bid={bid} />
                ))}

                {auctionBids.length > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onPress={() =>
                      navigation.navigate('BidHistory', {auctionId})
                    }>
                    <Text className="text-primary">View All Bids</Text>
                  </Button>
                )}
              </View>
            ) : (
              <Text className="text-muted-foreground text-center py-4">
                No bids yet. Be the first to bid!
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="mx-4 mb-6">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Activity Feed
            </Text>

            {auctionActivities.length > 0 ? (
              <View>
                {auctionActivities.slice(0, 5).map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </View>
            ) : (
              <Text className="text-muted-foreground text-center py-4">
                No activity yet
              </Text>
            )}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Bidding Interface Modal */}
      <BiddingInterface
        auction={auction}
        isVisible={showBiddingInterface}
        onClose={() => setShowBiddingInterface(false)}
        onBidPlaced={success => {
          if (success) {
            fetchAuctionDetails(auctionId);
          }
        }}
      />
    </Screen>
  );
}
