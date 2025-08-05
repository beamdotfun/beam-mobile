import {
  GoogleSignin,
  statusCodes,
  User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Google OAuth Client IDs from configuration
const ANDROID_CLIENT_ID = '92357246846-s5kmms0p7d20tuvl45p39ni2ev9k2i44.apps.googleusercontent.com';
const API_CLIENT_ID = '92357246846-fu1upqugs8e8j89mof3t59mvrquobbo4.apps.googleusercontent.com';

export interface GoogleSignInResult {
  idToken: string;
  user: GoogleUser;
  accessToken?: string | null;
}

class GoogleSignInService {
  private configured = false;

  /**
   * Configure Google Sign-In with the appropriate client IDs
   */
  async configure() {
    if (this.configured) {
      return;
    }

    try {
      GoogleSignin.configure({
        // Use the API client ID for web client (required for ID token)
        webClientId: API_CLIENT_ID,
        
        // Android configuration without google-services.json
        // The Android client ID is used automatically by the native SDK
        ...(Platform.OS === 'android' && {
          offlineAccess: false,
          hostedDomain: '',
          forceCodeForRefreshToken: false,
          // Explicitly set Android client ID if needed
          // androidClientId: ANDROID_CLIENT_ID,
        }),
        
        // iOS configuration
        ...(Platform.OS === 'ios' && {
          iosClientId: API_CLIENT_ID, // Use web client ID for iOS too
        }),
        
        // Request profile and email scopes
        scopes: ['profile', 'email'],
      });

      this.configured = true;
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<GoogleSignInResult> {
    try {
      // Ensure configuration
      await this.configure();

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Perform sign in
      const userInfo = await GoogleSignin.signIn();
      
      // Get the ID token
      const tokens = await GoogleSignin.getTokens();
      
      if (!tokens.idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      console.log('✅ Google Sign-In successful');
      console.log('👤 User:', userInfo.user.email);

      return {
        idToken: tokens.idToken,
        user: userInfo,
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        throw new Error('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        throw new Error('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        throw new Error('Google Play Services not available');
      } else {
        // Some other error happened
        console.error('❌ Google Sign-In error:', error);
        throw new Error(error.message || 'Failed to sign in with Google');
      }
    }
  }

  /**
   * Sign out from Google
   */
  async signOut() {
    try {
      await this.configure();
      await GoogleSignin.signOut();
      console.log('✅ Google Sign-Out successful');
    } catch (error) {
      console.error('❌ Google Sign-Out error:', error);
      // Don't throw - signing out should be graceful
    }
  }

  /**
   * Check if user is currently signed in
   */
  async isSignedIn(): Promise<boolean> {
    try {
      await this.configure();
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('❌ Error checking Google Sign-In status:', error);
      return false;
    }
  }

  /**
   * Get current user if signed in
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      await this.configure();
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser;
    } catch (error) {
      console.error('❌ Error getting current Google user:', error);
      return null;
    }
  }

  /**
   * Silently sign in (without showing UI)
   */
  async signInSilently(): Promise<GoogleSignInResult> {
    try {
      await this.configure();
      
      const userInfo = await GoogleSignin.signInSilently();
      const tokens = await GoogleSignin.getTokens();
      
      if (!tokens.idToken) {
        throw new Error('No ID token received from silent sign-in');
      }

      console.log('✅ Google Silent Sign-In successful');

      return {
        idToken: tokens.idToken,
        user: userInfo,
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        // User has not signed in yet
        throw new Error('Sign in required');
      } else {
        console.error('❌ Google Silent Sign-In error:', error);
        throw new Error(error.message || 'Failed to sign in silently');
      }
    }
  }
}

// Export singleton instance
export const googleSignInService = new GoogleSignInService();