import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function reset(routeName: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{name: routeName as never}],
    });
  }
}

// Deep linking helpers
export function handleDeepLink(url: string) {
  // Parse URL and navigate to appropriate screen
  // This will be expanded based on app requirements
  console.log('Handling deep link:', url);
}

// Navigation analytics helpers
export function trackScreenView(screenName: string, params?: any) {
  // Track screen views for analytics
  console.log('Screen view:', screenName, params);
}
