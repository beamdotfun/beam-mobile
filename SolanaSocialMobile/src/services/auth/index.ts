import {SolanaMobileWalletAdapter} from '../wallet/adapter';
import api, {setAuthToken, getAuthToken} from '../api/client';
import {AuthRequest, AuthResponse, ApiResponse} from '../api/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export class AuthService {
  private walletAdapter: SolanaMobileWalletAdapter;

  constructor() {
    this.walletAdapter = new SolanaMobileWalletAdapter();
  }

  async connectWallet(): Promise<AuthResponse> {
    try {
      // Connect to wallet and get authorization
      const walletAuth = await this.walletAdapter.connect();

      // Create authentication request
      const authRequest: AuthRequest = {
        walletAddress: walletAuth.publicKey.toString(),
      };

      // Send authentication request to backend
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/wallet',
        authRequest,
      );

      if (!response.ok) {
        throw new Error(response.problem || 'Authentication failed');
      }

      const authData = response.data!.data;

      // Store authentication data
      await this.storeAuthData(authData);
      setAuthToken(authData.token);

      return authData;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async signMessage(_message: string): Promise<string> {
    if (!this.walletAdapter.connected) {
      throw new Error('Wallet not connected');
    }

    // For now, return a placeholder signature
    // In a real implementation, this would use the wallet adapter to sign the message
    return 'signature_placeholder';
  }

  async authenticateWithSignature(
    walletAddress: string,
    message: string,
    signature: string,
  ): Promise<AuthResponse> {
    const authRequest: AuthRequest = {
      walletAddress,
      message,
      signature,
    };

    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/verify',
      authRequest,
    );

    if (!response.ok) {
      throw new Error(response.problem || 'Signature verification failed');
    }

    const authData = response.data!.data;

    // Store authentication data
    await this.storeAuthData(authData);
    setAuthToken(authData.token);

    return authData;
  }

  async logout(): Promise<void> {
    try {
      // Disconnect wallet
      if (this.walletAdapter.connected) {
        await this.walletAdapter.disconnect();
      }

      // Clear stored authentication data
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      setAuthToken(null);

      // Optionally call logout endpoint
      if (getAuthToken()) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Continue with local cleanup even if server logout fails
    }
  }

  async refreshToken(): Promise<AuthResponse | null> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/refresh',
      );

      if (!response.ok) {
        return null;
      }

      const authData = response.data!.data;
      await this.storeAuthData(authData);
      setAuthToken(authData.token);

      return authData;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async loadStoredAuth(): Promise<AuthResponse | null> {
    try {
      const [tokenString, userString] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (!tokenString || !userString) {
        return null;
      }

      const user = JSON.parse(userString);
      const token = tokenString;

      // Verify token is still valid
      setAuthToken(token);
      const response = await api.get<ApiResponse<any>>('/auth/verify-token');

      if (!response.ok) {
        // Token is invalid, clear stored data
        await this.clearStoredAuth();
        return null;
      }

      return {
        token,
        user,
        expiresAt: '', // Will be updated from server response if needed
      };
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await this.clearStoredAuth();
      return null;
    }
  }

  async clearStoredAuth(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
    setAuthToken(null);
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.token),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user)),
    ]);
  }

  get isWalletConnected(): boolean {
    return this.walletAdapter.connected;
  }

  get walletPublicKey(): string | null {
    return this.walletAdapter.publicKey?.toString() || null;
  }

  get adapter(): SolanaMobileWalletAdapter {
    return this.walletAdapter;
  }
}

export const authService = new AuthService();

// Export Google Sign-In service
export * from './googleSignIn';
