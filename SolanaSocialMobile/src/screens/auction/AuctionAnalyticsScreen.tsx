import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {AuctionStackScreenProps} from '../../types/navigation';

type Props = AuctionStackScreenProps<'AuctionAnalytics'>;

export default function AuctionAnalyticsScreen({}: Props) {
  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        Auction Analytics Screen - Coming Soon
      </Text>
    </Screen>
  );
}
