import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {DiscoverStackScreenProps} from '../../types/navigation';

type Props = DiscoverStackScreenProps<'TrendingTopics'>;

export default function TrendingTopicsScreen({}: Props) {
  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        Trending Topics Screen - Coming Soon
      </Text>
    </Screen>
  );
}
