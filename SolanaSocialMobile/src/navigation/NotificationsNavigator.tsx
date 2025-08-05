import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useThemeStore} from '../store/themeStore';

// Placeholder screen - will be replaced with actual notifications screen
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsHome: undefined;
  PostDetail: {
    postId: string;
  };
  UserProfile: {
    walletAddress: string;
  };
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export default function NotificationsNavigator() {
  const {colors} = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen name="NotificationsHome" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
