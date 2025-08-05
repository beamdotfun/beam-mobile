import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useThemeStore} from '../store/themeStore';

// Search screens
import SearchScreen from '../screens/search/SearchScreen';
import SearchResultsScreen from '../screens/discover/SearchResultsScreen';

// Shared screens that can be accessed from search
import PostDetailScreen from '../screens/post/PostDetailScreen';
import ThreadDetailsScreen from '../screens/thread/ThreadDetailsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';

export type SearchStackParamList = {
  SearchHome: undefined;
  SearchResults: {
    query: string;
  };
  PostDetail: {
    postId: string;
    post?: any;
  };
  ThreadDetails: {
    threadId: string;
    post?: any;
  };
  Profile: {
    walletAddress: string;
  };
  CreatePost: {
    quotedPost?: any;
  };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  const {colors} = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen name="SearchHome" component={SearchScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="ThreadDetails" component={ThreadDetailsScreen} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
    </Stack.Navigator>
  );
}
