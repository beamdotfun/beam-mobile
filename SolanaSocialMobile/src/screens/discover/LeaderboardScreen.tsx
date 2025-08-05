import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {DiscoverStackScreenProps} from '../../types/navigation';

type Props = DiscoverStackScreenProps<'Leaderboard'>;

export default function LeaderboardScreen({route}: Props) {
  const {type} = route.params;

  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        {type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard
      </Text>
      <Text className="text-muted-foreground text-center mt-4">
        Coming Soon
      </Text>
    </Screen>
  );
}
