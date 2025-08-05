import React from 'react';
import {View, FlatList} from 'react-native';
import {Text, Card, Avatar, Badge} from '../ui';
import {TrendingUp, Crown, Clock} from 'lucide-react-native';
import {Bid, BID_STATUSES} from '../../types/auctions';
import {formatDistanceToNow} from 'date-fns';
import {formatSOL} from '../../utils/formatting';

interface BidHistoryProps {
  bids: Bid[];
  currentBid: number;
}

export function BidHistory({bids, currentBid}: BidHistoryProps) {
  const renderBid = ({item: bid, index}: {item: Bid; index: number}) => {
    const statusConfig = BID_STATUSES[bid.status];
    const isHighestBid = index === 0 && bid.status === 'confirmed';

    return (
      <Card className={`mb-3 p-4 ${isHighestBid ? 'border-primary' : ''}`}>
        <View className="flex-row items-center justify-between">
          {/* Bidder Info */}
          <View className="flex-row items-center gap-3 flex-1">
            <Avatar
              source={bid.bidder.avatar ? {uri: bid.bidder.avatar} : undefined}
              size="sm"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-medium" numberOfLines={1}>
                  {bid.bidder.displayName}
                </Text>
                {isHighestBid && <Crown className="h-4 w-4 text-yellow-500" />}
                {bid.isAutoBid && (
                  <Badge variant="outline" className="text-xs">
                    Auto
                  </Badge>
                )}
              </View>
              <Text className="text-sm text-muted-foreground">
                Reputation: {bid.bidder.reputation}
              </Text>
            </View>
          </View>

          {/* Bid Amount and Status */}
          <View className="items-end">
            <Text className="text-lg font-bold">
              {formatSOL(bid.amount)} SOL
            </Text>
            <View className="flex-row items-center gap-1">
              <Badge
                variant={
                  bid.status === 'confirmed' ? 'default' :
                    : bid.status === 'won'
                    ? 'default'
                    : bid.status === 'outbid'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-xs">
                {statusConfig.label}
              </Badge>
            </View>
          </View>
        </View>

        {/* Timestamp */}
        <View className="flex-row items-center gap-1 mt-3 pt-3 border-t border-border">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <Text className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(bid.timestamp), {addSuffix: true})}
          </Text>

          {bid.confirmedAt && (
            <>
              <Text className="text-xs text-muted-foreground mx-1">•</Text>
              <Text className="text-xs text-muted-foreground">
                Confirmed{' '}
                {formatDistanceToNow(new Date(bid.confirmedAt), {
                  addSuffix: true,
                })}
              </Text>
            </>
          )}
        </View>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-12">
      <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
      <Text className="text-lg font-semibold mb-2">No bids yet</Text>
      <Text className="text-center text-muted-foreground px-8">
        Be the first to place a bid on this NFT auction!
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View className="mb-4">
      <Text className="text-lg font-semibold mb-2">Bid History</Text>
      <View className="flex-row items-center justify-between p-3 bg-muted/50 rounded-lg">
        <Text className="text-sm text-muted-foreground">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
        </Text>
        <Text className="text-sm font-medium">
          Current: {formatSOL(currentBid)} SOL
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <FlatList
        data={bids}
        renderItem={renderBid}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
