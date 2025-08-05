import React, {useEffect} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Text, StatusBar, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from './src/components/providers/ThemeProvider';
import {MaintenanceWrapper} from './src/components/maintenance/MaintenanceWrapper';
import {useOfflineStore} from './src/store/offlineStore';
import {usePerformanceStore} from './src/store/performance';
import {useAuthStore} from './src/store/auth';
import {cleanExpiredAuthTokens} from './src/utils/authStorage';
// import {PerformanceOverlay} from './src/components/performance'; // Removed - was causing debug bar
import {ToastManager} from './src/components/ui/ToastManager';
import AppNavigator from './src/navigation/AppNavigator';
import {defaultTextStyle} from './src/styles/globalStyles';
import {configureDemoMode, getQueryClientLogger} from './src/utils/demoMode';
// WebSocket implementation removed - using polling instead

// Configure demo mode for clean recordings
configureDemoMode();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
  // Use demo mode logger configuration
  logger: getQueryClientLogger(),
});

function AppContent() {
  const {initializeOfflineSupport} = useOfflineStore();
  const {isMonitoringEnabled, setMonitoring} = usePerformanceStore();
  const authState = useAuthStore();

  useEffect(() => {
    // Only log on first mount
    if (__DEV__) {
      console.log('App starting, auth state:', {
        isAuthenticated: authState.isAuthenticated,
        hasCompletedOnboarding: authState.hasCompletedOnboarding,
        isRehydrated: authState.isRehydrated,
        hasToken: !!authState.token,
      });
    }

    // Clean expired auth tokens before app initialization
    cleanExpiredAuthTokens().then(() => {
      if (__DEV__) {
        console.log('Auth token cleanup completed');
      }
    });

    // Initialize offline support when app starts
    initializeOfflineSupport();

    // Enable performance monitoring in development
    if (__DEV__ && !isMonitoringEnabled) {
      setMonitoring(true);
    }

    // Disable iOS network activity indicator that causes gray "downloading" bar
    if (Platform.OS === 'ios') {
      StatusBar.setNetworkActivityIndicatorVisible(false);
    }
  }, []); // Empty dependency array - only run once on mount

  return (
    <>
      <AppNavigator />
      {/* PerformanceOverlay removed - was causing gray debug bar */}
      {/* <ToastManager /> */}
      {/* WebSocketMonitor removed - using polling instead */}
    </>
  );
}

export default function App() {
  // Set default font for all Text components
  if (Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  Text.defaultProps.style = [defaultTextStyle, Text.defaultProps.style];

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MaintenanceWrapper>
            <AppContent />
          </MaintenanceWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
