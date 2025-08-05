import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/auth';
import {useThemeStore} from '../store/themeStore';
import {RootStackParamList} from '../types/navigation';
import {OfflineIndicator} from '../components/offline/OfflineIndicator';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import {SimpleOnboardingFlow} from '../screens/onboarding/SimpleOnboardingFlow';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const {isAuthenticated, hasCompletedOnboarding, isRehydrated} = useAuthStore();
  const themeStore = useThemeStore();
  const colors = themeStore?.colors || {
    primary: '#3B82F6',
    background: '#FFFFFF',
    card: '#F8FAFC',
    foreground: '#0F172A',
    border: '#E2E8F0',
    destructive: '#EF4444'
  };
  const [forceRender, setForceRender] = useState(0);

  // Force re-render when auth state changes
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [isAuthenticated, hasCompletedOnboarding, isRehydrated]);

  // Debug log only on meaningful changes
  // console.log('Nav state:', { isRehydrated, isAuthenticated, hasCompletedOnboarding });


  const navigationTheme = {
    dark: false,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.destructive,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: 'normal' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: 'bold' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800' as const,
      },
    },
  };

  return (
    <View style={{flex: 1}}>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {!isRehydrated ? (
            <Stack.Screen 
              name="Loading" 
              component={LoadingScreen}
            />
          ) : !isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : !hasCompletedOnboarding ? (
            <Stack.Screen name="Onboarding" component={SimpleOnboardingFlow} />
          ) : (
            <Stack.Screen name="Main" component={TabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Global Offline Indicator */}
      <OfflineIndicator position="top" showDetails={true} />
    </View>
  );
}
