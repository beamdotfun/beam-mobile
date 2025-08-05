import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useThemeStore} from '../store/themeStore';

// Placeholder screen - will be replaced with actual messages screen
import MessagesScreen from '../screens/messages/MessagesScreen';

export type MessagesStackParamList = {
  MessagesHome: undefined;
  Conversation: {
    conversationId: string;
    recipientWallet?: string;
  };
  NewMessage: undefined;
  UserProfile: {
    walletAddress: string;
  };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesNavigator() {
  const {colors} = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen name="MessagesHome" component={MessagesScreen} />
    </Stack.Navigator>
  );
}
