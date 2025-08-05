import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {AuctionStackScreenProps} from '../../types/navigation';

type Props = AuctionStackScreenProps<'CreateAuction'>;

export default function CreateAuctionScreen({}: Props) {
  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        Create Auction Screen - Coming Soon
      </Text>
    </Screen>
  );
}
