import React from 'react';
import {Vibration} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Home, Search, Trophy, Bell, MessageSquare} from 'lucide-react-native';
import {useThemeStore} from '../store/themeStore';
import {MainTabParamList} from '../types/navigation';

// Stack Navigators
import FeedNavigator from './FeedNavigator';
import SearchNavigator from './SearchNavigator';
import LeaderboardNavigator from './LeaderboardNavigator';
import NotificationsNavigator from './NotificationsNavigator';
import MessagesNavigator from './MessagesNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Extract tab bar icon rendering outside component
const getTabBarIcon = (routeName: string, iconColor: string) => {
  const iconSize = 24;

  switch (routeName) {
    case 'Feed':
      return <Home size={iconSize} color={iconColor} />;
    case 'Search':
      return <Search size={iconSize} color={iconColor} />;
    case 'Leaderboard':
      return <Trophy size={iconSize} color={iconColor} />;
    case 'Notifications':
      return <Bell size={iconSize} color={iconColor} />;
    case 'Messages':
      return <MessageSquare size={iconSize} color={iconColor} />;
    default:
      return null;
  }
};

export default function TabNavigator() {
  const {colors} = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({focused}) => {
          const iconColor = focused ? colors.primary : colors.mutedForeground;
          return getTabBarIcon(route.name, iconColor);
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          // Floating card style
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          borderRadius: 20,
          // Shadow for iOS
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          // Shadow for Android
          elevation: 5,
        },
      })}>
      <Tab.Screen 
        name="Feed" 
        component={FeedNavigator}
        listeners={({navigation}) => ({
          tabPress: (e) => {
            Vibration.vibrate(10);
            // Navigate to the first screen of the stack when tab is pressed
            navigation.navigate('Feed', {
              screen: 'FeedHome',
            });
          },
        })}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchNavigator}
        listeners={() => ({
          tabPress: () => {
            Vibration.vibrate(10);
          },
        })}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardNavigator}
        listeners={() => ({
          tabPress: () => {
            Vibration.vibrate(10);
          },
        })}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsNavigator}
        listeners={() => ({
          tabPress: () => {
            Vibration.vibrate(10);
          },
        })}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesNavigator}
        listeners={() => ({
          tabPress: () => {
            Vibration.vibrate(10);
          },
        })}
      />
    </Tab.Navigator>
  );
}
