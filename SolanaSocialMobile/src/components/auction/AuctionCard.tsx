import React, {useState, useEffect} from 'react';
import {View, Text, Pressable, Alert} from 'react-native';
import {Clock, Eye, TrendingUp, Users, Star, Heart} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {useThemeStore} from '../../store/themeStore';
import {useAuctionStore} from '../../store/auctionStore';
import {Auction} from '../../types/auction';
import {formatDistanceToNow} from 'date-fns';
import FastImage from 'react-native-fast-image';

interface AuctionCardProps {
  auction: Auction;
  onPress?: () => void;
  showWatchButton?: boolean;
  showBidButton?: boolean;
  compact?: boolean;
}

export function AuctionCard({
  auction,
  onPress,
  showWatchButton = true,
  showBidButton = true,
  compact = false,
}: AuctionCardProps) {
  const {colors} = useThemeStore();
  const {addToWatchlist, removeFromWatchlist, isLoading} = useAuctionStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isWatching, setIsWatching] = useState(auction.userIsWatching);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const endTime = new Date(auction.endTime).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  const formatTimeRemaining = (ms: number): string => {
    if (ms === 0) {
      return 'Ended';
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = () => {
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

  const getStatusText = () => {
    switch (auction.status) {
      case 'ending_soon':
        return 'Ending Soon';
      case 'active':
        return 'Active';
      case 'ended':
        return 'Ended';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Starting Soon';
      default:
        return auction.status;
    }
  };

  const handleWatchToggle = async () => {
    try {
      if (isWatching) {
        await removeFromWatchlist(auction.auctionId);
        setIsWatching(false);
      } else {
        await addToWatchlist(auction.auctionId);
        setIsWatching(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  const handleQuickBid = () => {
    // This would open a quick bid modal or navigate to bid screen
    Alert.alert('Quick Bid', `Place a bid on "${auction.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Bid', onPress: () => onPress?.()},
    ]);
  };

  return (
    <Card className={`mb-3 ${compact ? 'mx-2' : ''}`}>
      <Pressable onPress={onPress} className="active:opacity-80">
        <CardContent className={`p-${compact ? '3' : '4'}`}>
          {/* Header with Brand and Status */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              {auction.brandLogo && (
                <FastImage
                  source={{uri: auction.brandLogo}}
                  className="w-8 h-8 rounded-full mr-2"
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}
              <View className="flex-1">
                <Text
                  className="font-semibold text-foreground"
                  numberOfLines={1}>
                  {auction.brandName}
                </Text>
                <Text
                  className="text-xs text-muted-foreground"
                  numberOfLines={1}>
                  {auction.title}
                </Text>
              </View>
            </View>

            <Badge
              variant="secondary"
              style={{backgroundColor: `${getStatusColor()}20`}}>
              <Text className="text-xs" style={{color: getStatusColor()}}>
                {getStatusText()}
              </Text>
            </Badge>
          </View>

          {/* Ad Content Preview */}
          {auction.adContent.imageUrl && !compact && (
            <View className="mb-3">
              <FastImage
                source={{uri: auction.adContent.imageUrl}}
                className="w-full h-32 rounded-lg"
                resizeMode={FastImage.resizeMode.cover}
              />
            </View>
          )}

          {/* Auction Description */}
          <Text
            className="text-foreground mb-3"
            numberOfLines={compact ? 2 : 3}>
            {auction.description}
          </Text>

          {/* Bid Information */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {auction.currentBid.toFixed(3)} SOL
              </Text>
              <Text className="text-xs text-muted-foreground">Current Bid</Text>
            </View>

            <View className="items-end">
              <View className="flex-row items-center">
                <Clock size={14} color={colors.mutedForeground} />
                <Text className="text-sm text-muted-foreground ml-1">
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </View>
              {auction.isExtended && (
                <Text className="text-xs text-warning mt-1">
                  Extended {auction.extensionCount}x
                </Text>
              )}
            </View>
          </View>

          {/* Auction Stats */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <Users size={14} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground ml-1">
                  {auction.totalBidders}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TrendingUp size={14} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground ml-1">
                  {auction.totalBids} bids
                </Text>
              </View>

              <View className="flex-row items-center">
                <Star size={14} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground ml-1">
                  {auction.qualityScore}/10
                </Text>
              </View>
            </View>

            {/* Payout Info */}
            <Text className="text-xs text-success">
              +{auction.userPayout.toFixed(3)} SOL reward
            </Text>
          </View>

          {/* Target Audience Tags */}
          {!compact && (
            <View className="flex-row flex-wrap gap-1 mb-3">
              {auction.targetAudience.verifiedUsersOnly && (
                <Badge variant="secondary" className="px-2 py-1">
                  <Text className="text-xs">Verified Only</Text>
                </Badge>
              )}
              {auction.targetAudience.nftHoldersOnly && (
                <Badge variant="secondary" className="px-2 py-1">
                  <Text className="text-xs">NFT Holders</Text>
                </Badge>
              )}
              {auction.targetAudience.snsOwnersOnly && (
                <Badge variant="secondary" className="px-2 py-1">
                  <Text className="text-xs">SNS Owners</Text>
                </Badge>
              )}
              {auction.targetAudience.minReputation && (
                <Badge variant="secondary" className="px-2 py-1">
                  <Text className="text-xs">
                    Rep {auction.targetAudience.minReputation}+
                  </Text>
                </Badge>
              )}
            </View>
          )}

          {/* User Status Indicators */}
          {(auction.userHasBid || auction.userIsWatching) && (
            <View className="flex-row space-x-2 mb-3">
              {auction.userHasBid && (
                <Badge variant="success" className="px-2 py-1">
                  <Text className="text-xs">You Bid</Text>
                </Badge>
              )}
              {auction.currentWinner === 'user' && (
                <Badge variant="default" className="px-2 py-1">
                  <Text className="text-xs">Winning</Text>
                </Badge>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-2">
            {showBidButton && auction.status === 'active' && (
              <Button
                className="flex-1"
                onPress={handleQuickBid}
                disabled={isLoading}>
                <Text className="text-primary-foreground">
                  Bid {(auction.currentBid + auction.bidIncrement).toFixed(3)}{' '}
                  SOL
                </Text>
              </Button>
            )}

            {showWatchButton && (
              <Button
                variant={isWatching ? 'secondary' : 'outline'}
                size="sm"
                onPress={handleWatchToggle}
                disabled={isLoading}
                className="px-3">
                {isWatching ? (
                  <Heart
                    size={16}
                    color={colors.primary}
                    fill={colors.primary}
                  />
                ) : (
                  <Eye size={16} color={colors.mutedForeground} />
                )}
              </Button>
            )}
          </View>

          {/* Expected Reach */}
          {!compact && (
            <View className="mt-3 pt-3 border-t border-border">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">
                  Expected Reach: {auction.expectedReach.toLocaleString()} users
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Est. {auction.estimatedImpressions.toLocaleString()}{' '}
                  impressions
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Pressable>
    </Card>
  );
}
