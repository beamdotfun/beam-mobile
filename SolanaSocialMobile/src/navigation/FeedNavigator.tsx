import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {FeedStackParamList} from '../types/navigation';

// Placeholder screens - will be implemented in future tasks
import FeedHomeScreen from '../screens/feed/FeedHomeScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import ThreadDetailsScreen from '../screens/thread/ThreadDetailsScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import ReputationScreen from '../screens/profile/ReputationScreen';
// Sidebar menu screens
import PostsScreen from '../screens/posts/PostsScreen';
import ReceiptsScreen from '../screens/receipts/ReceiptsScreen';
import PointsScreen from '../screens/points/PointsScreen';
import HelpScreen from '../screens/help/HelpScreen';
import SettingsHomeScreen from '../screens/settings/SettingsHomeScreen';
import BusinessScreen from '../screens/business/BusinessScreen';
import WatchlistScreen from '../screens/watchlist/WatchlistScreen';
// Settings sub-screens
import GeneralSettingsScreen from '../screens/settings/GeneralSettingsScreen';
import EmailSettingsScreen from '../screens/settings/EmailSettingsScreen';
import PasswordSettingsScreen from '../screens/settings/PasswordSettingsScreen';
import FeedSettingsScreen from '../screens/settings/FeedSettingsScreen';
import WalletSettingsScreen from '../screens/settings/WalletSettingsScreen';
import SolanaSettingsScreen from '../screens/settings/SolanaSettingsScreen';
import BadgesSettingsScreen from '../screens/settings/BadgesSettingsScreen';
import EditUsernameScreen from '../screens/settings/EditUsernameScreen';
import EditProfilePictureScreen from '../screens/settings/EditProfilePictureScreen';
import NFTSelectionScreen from '../screens/settings/NFTSelectionScreen';
import SendTipScreen from '../screens/tips/SendTipScreen';
import VoteSelectionScreen from '../screens/vote/VoteSelectionScreen';
import VerificationScreen from '../screens/verification/VerificationScreen';
import BuySOLScreen from '../screens/feed/BuySOLScreen';
import ThreadSendScreen from '../screens/thread/ThreadSendScreen';
import { TransferDemoScreen } from '../screens/TransferDemoScreen';
import TokensHomeScreen from '../screens/tokens/TokensHomeScreen';

const Stack = createNativeStackNavigator<FeedStackParamList>();

export default function FeedNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="FeedHome" component={FeedHomeScreen} />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ThreadDetails"
        component={ThreadDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        options={{
          headerShown: false,
        }}
      >
        {(props) => (
          <ErrorBoundary>
            <ProfileScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Profile"
        options={{
          headerShown: false,
        }}
      >
        {(props) => (
          <ErrorBoundary>
            <ProfileScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="CreatePost"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      >
        {(props) => (
          <ErrorBoundary>
            <CreatePostScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Reputation"
        component={ReputationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SendTip"
        component={SendTipScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="VoteSelection"
        component={VoteSelectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* Sidebar menu screens */}
      <Stack.Screen
        name="Posts"
        component={PostsScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="Points"
        component={PointsScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="Business"
        component={BusinessScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsHomeScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      <Stack.Screen
        name="Tokens"
        component={TokensHomeScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
        }}
      />
      {/* Settings sub-screens */}
      <Stack.Screen
        name="GeneralSettings"
        component={GeneralSettingsScreen}
        options={{
          headerShown: false,
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen
        name="EmailSettings"
        component={EmailSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PasswordSettings"
        component={PasswordSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FeedSettings"
        component={FeedSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WalletSettings"
        component={WalletSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SolanaSettings"
        component={SolanaSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BadgesSettings"
        component={BadgesSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditUsername"
        component={EditUsernameScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfilePicture"
        component={EditProfilePictureScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NFTSelection"
        component={NFTSelectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BuySOL"
        component={BuySOLScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ThreadSend"
        component={ThreadSendScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="TransferDemo"
        component={TransferDemoScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
