import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useThemeStore} from '../store/themeStore';

// Placeholder screen - will be replaced with actual leaderboard screen
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';

export type LeaderboardStackParamList = {
  LeaderboardHome: undefined;
  UserProfile: {
    walletAddress: string;
  };
};

const Stack = createNativeStackNavigator<LeaderboardStackParamList>();

export default function LeaderboardNavigator() {
  const {colors} = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen name="LeaderboardHome" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}
