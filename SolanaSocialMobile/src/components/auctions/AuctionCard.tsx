import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {Text, Card, Badge, Avatar} from '../ui';
import {Eye, Users, Clock, Heart} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {NFTAuction, NFT_AUCTION_STATUSES} from '../../types/auctions';
import {AuctionCountdown} from './AuctionCountdown';
import {formatSOL} from '../../utils/formatting';

interface AuctionCardProps {
  auction: NFTAuction;
  onPress: () => void;
  onWatchlist?: () => void;
}

export function AuctionCard({auction, onPress, onWatchlist}: AuctionCardProps) {
  const statusConfig = NFT_AUCTION_STATUSES[auction.status];

  return (
    <TouchableOpacity onPress={onPress} className="mb-4 mx-4">
      <Card className="overflow-hidden">
        {/* NFT Image */}
        <View className="relative">
          <FastImage
            source={{uri: auction.nft.image}}
            className="w-full h-48"
            resizeMode="cover"
          />

          {/* Status Badge */}
          <View className="absolute top-3 left-3">
            <Badge
              variant={
                auction.status === 'active' ? 'default' :
                  : auction.status === 'ending'
                  ? 'destructive'
                  : 'secondary'
              }>
              {statusConfig.label}
            </Badge>
          </View>

          {/* Watchlist Button */}
          {onWatchlist && (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                onWatchlist();
              }}
              className="absolute top-3 right-3 bg-background/80 rounded-full p-2">
              <Heart
                className={`h-4 w-4 ${
                  auction.isWatching
                    ? 'fill-red-500 text-red-500'
                    : 'text-foreground'
                }`}
              />
            </TouchableOpacity>
          )}

          {/* Buy Now Indicator */}
          {auction.buyNowPrice && (
            <View className="absolute bottom-3 right-3">
              <Badge variant="outline" className="bg-background/90">
                Buy Now: {formatSOL(auction.buyNowPrice)} SOL
              </Badge>
            </View>
          )}
        </View>

        {/* Auction Info */}
        <View className="p-4">
          {/* Title */}
          <Text className="text-lg font-semibold mb-2" numberOfLines={2}>
            {auction.nft.name}
          </Text>

          {/* Brand */}
          <View className="flex-row items-center gap-2 mb-3">
            <Avatar source={{uri: auction.brand.logo}} size="sm" />
            <Text className="text-sm text-muted-foreground">
              {auction.brand.name}
            </Text>
            {auction.brand.verified && (
              <View className="w-1 h-1 rounded-full bg-primary" />
            )}
          </View>

          {/* Current Bid */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-sm text-muted-foreground">Current Bid</Text>
              <Text className="text-xl font-bold">
                {formatSOL(auction.currentBid)} SOL
              </Text>
            </View>

            {/* Time Left */}
            <View className="items-end">
              <Text className="text-sm text-muted-foreground">
                {auction.status === 'active' ? 'Ends in' : 'Ended'}
              </Text>
              {auction.status === 'active' || auction.status === 'ending' ? (
                <AuctionCountdown
                  endTime={auction.endTime}
                  className="text-base"
                />
              ) : (
                <Text className="text-base font-medium text-muted-foreground">
                  Auction ended
                </Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row items-center justify-between pt-3 border-t border-border">
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  {auction.bidCount}
                </Text>
              </View>

              <View className="flex-row items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  {auction.watcherCount}
                </Text>
              </View>

              <View className="flex-row items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  {auction.viewCount}
                </Text>
              </View>
            </View>

            {/* Bid Increment */}
            <Text className="text-xs text-muted-foreground">
              Min bid: {formatSOL(auction.currentBid + auction.bidIncrement)}{' '}
              SOL
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
