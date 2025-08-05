import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {AuctionStackScreenProps} from '../../types/navigation';

type Props = AuctionStackScreenProps<'BidHistory'>;

export default function BidHistoryScreen({route}: Props) {
  const {auctionId} = route.params;

  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        Bid History Screen
      </Text>
      <Text className="text-muted-foreground text-center mt-4">
        Auction ID: {auctionId}
      </Text>
      <Text className="text-muted-foreground text-center mt-4">
        Coming Soon
      </Text>
    </Screen>
  );
}
