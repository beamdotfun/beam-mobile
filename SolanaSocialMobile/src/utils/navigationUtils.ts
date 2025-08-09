// Navigation utilities to prevent rapid navigation and memory issues

interface NavigationState {
  lastNavigation: number;
  lastRoute: string;
  lastParams: any;
}

const navigationState: NavigationState = {
  lastNavigation: 0,
  lastRoute: '',
  lastParams: null,
};

const NAVIGATION_DEBOUNCE_MS = 300; // Minimum time between navigations
const SAME_ROUTE_DEBOUNCE_MS = 1000; // Longer debounce for same route

/**
 * Debounced navigation to prevent rapid navigation that causes memory issues
 * @param navigation - React Navigation navigation object
 * @param routeName - Name of the route to navigate to
 * @param params - Navigation parameters
 * @returns boolean - true if navigation was allowed, false if debounced
 */
export function debouncedNavigate(
  navigation: any,
  routeName: string,
  params?: any
): boolean {
  const now = Date.now();
  const timeSinceLastNav = now - navigationState.lastNavigation;
  
  // Check if trying to navigate to the same route with same params too quickly
  const isSameRoute = navigationState.lastRoute === routeName;
  const isSameParams = JSON.stringify(navigationState.lastParams) === JSON.stringify(params);
  
  if (isSameRoute && isSameParams) {
    // Same exact navigation - use longer debounce
    if (timeSinceLastNav < SAME_ROUTE_DEBOUNCE_MS) {
      console.log(`⚠️ Navigation debounced: Same route ${routeName} within ${SAME_ROUTE_DEBOUNCE_MS}ms`);
      return false;
    }
  } else if (timeSinceLastNav < NAVIGATION_DEBOUNCE_MS) {
    // Different navigation but too fast
    console.log(`⚠️ Navigation debounced: Too rapid (${timeSinceLastNav}ms since last)`);
    return false;
  }
  
  // Update state and allow navigation
  navigationState.lastNavigation = now;
  navigationState.lastRoute = routeName;
  navigationState.lastParams = params;
  
  console.log(`✅ Navigation allowed to ${routeName} with params:`, params);
  
  try {
    navigation.navigate(routeName, params);
    return true;
  } catch (error) {
    console.error(`❌ Navigation failed to ${routeName}:`, error);
    return false;
  }
}

/**
 * Reset navigation state (useful for cleanup)
 */
export function resetNavigationState() {
  navigationState.lastNavigation = 0;
  navigationState.lastRoute = '';
  navigationState.lastParams = null;
}