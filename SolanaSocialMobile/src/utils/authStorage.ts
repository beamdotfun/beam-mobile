/**
 * Authentication storage utilities
 * Handles cleaning up expired tokens from AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {isJWTExpired} from './jwtUtils';

const AUTH_STORAGE_KEY = 'auth-storage';

/**
 * Clean expired tokens from AsyncStorage
 * This should be called on app startup to prevent loading expired auth state
 */
export async function cleanExpiredAuthTokens(): Promise<void> {
  try {
    const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedData) {
      return;
    }

    const parsed = JSON.parse(storedData);
    const authState = parsed?.state;

    // Check if token exists and is either expired or malformed
    if (authState?.token) {
      const isExpired = isJWTExpired(authState.token);
      
      // Also check if token is malformed (can't be decoded)
      const isMalformed = authState.token && authState.token.split('.').length !== 3;
      
      if (isExpired || isMalformed) {
        if (isMalformed) {
          console.log('Found malformed token in storage, clearing auth state');
        } else {
          console.log('Found expired token in storage, clearing auth state');
        }
        
        // Clear the auth state but preserve onboarding status
        const clearedState = {
          ...parsed,
          state: {
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
            error: null,
            hasCompletedOnboarding: authState.hasCompletedOnboarding || false,
            isRehydrated: false, // This will be set to true by the rehydration callback
          },
        };

        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clearedState));
        console.log('Cleared invalid auth state from storage');
      }
    }
  } catch (error) {
    console.error('Error cleaning expired auth tokens:', error);
  }
}

/**
 * Check if stored auth state has valid token
 */
export async function hasValidStoredToken(): Promise<boolean> {
  try {
    const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedData) {
      return false;
    }

    const parsed = JSON.parse(storedData);
    const token = parsed?.state?.token;

    return token && !isJWTExpired(token);
  } catch (error) {
    console.error('Error checking stored token:', error);
    return false;
  }
}

/**
 * Force clear all auth data (useful for debugging)
 */
export async function forceClearAuthData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('Force cleared all auth data');
  } catch (error) {
    console.error('Error force clearing auth data:', error);
  }
}