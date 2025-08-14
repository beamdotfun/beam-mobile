import {
  SignInRequest,
  SignUpRequest,
  AuthenticatedUser,
  ProfileSetupData,
} from '@/types/auth';
import api from './client';
import {getAuthToken} from './tokenManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {API_CONFIG} from '../../config/api';

// SHA-256 hashing function for passwords
export const sha256Hash = async (message: string): Promise<string> => {
  try {
    // For React Native, we'll use a simple approach and let backend handle hashing
    // The spec mentions backend accepts both plain text and SHA-256 pre-hashed
    // For now, sending plain text as it's more reliable across all environments
    return message;

    // TODO: Implement proper SHA-256 hashing with react-native-crypto or similar library
    // Example implementation would be:
    // const { createHash } = require('react-native-crypto');
    // return createHash('sha256').update(message).digest('hex');
  } catch (error) {
    console.warn('SHA-256 hashing failed, sending plain text:', error);
    return message;
  }
};

export interface AuthResponse {
  success: boolean;
  message?: string;
  expiresAt?: number;
  rememberMe?: boolean;
  authenticated?: boolean;
  userId?: number;  // New format for auth status
  user?: {         // Legacy format for login/registration
    id: number;
    email: string;
    role: string;
    walletAddress?: string;
    name?: string;
    profilePicture?: string;
    credits?: number;
  };
  token?: string;
  refreshToken?: string;
}

export interface WalletChallengeResponse {
  success: boolean;
  message: string;
  nonce: string;
  expiresAt: string;
}

export interface TokenResponse {
  success: boolean;
  message?: string;
  data?: {
    user: any;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

export interface VerificationResponse {
  verified: boolean;
  metadata?: any;
}

class AuthAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      this.accessToken = await AsyncStorage.getItem('accessToken');
      this.refreshToken = await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async saveTokens(access: string, refresh: string) {
    try {
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      this.accessToken = access;
      this.refreshToken = refresh;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private async clearTokens() {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async register(
    email: string,
    password: string,
    referralCode?: string,
  ): Promise<AuthResponse> {
    try {
      const hashedPassword = await sha256Hash(password);

      const response = await fetch(`${API_CONFIG.BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          'X-Mobile-App': 'true',
          'X-App-Platform': Platform.OS,
          'X-Client-Type': 'react-native',
        },
        body: JSON.stringify({
          email,
          password: hashedPassword,
          referralCode,
          source: 'mobile_app',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save tokens if provided (new mobile response format)
      if (data.accessToken && data.refreshToken) {
        await this.saveTokens(data.accessToken, data.refreshToken);
      }

      // Save user data
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }

      // Save CSRF token if provided
      if (data.csrfToken) {
        await AsyncStorage.setItem('csrfToken', data.csrfToken);
      }

      return {
        success: data.success,
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        message: data.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<AuthResponse> {
    try {
      const hashedPassword = await sha256Hash(password);

      // Use session login endpoint for mobile to get tokens in response body
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/session/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Beam-Mobile/${Platform.OS}`,
            'X-Mobile-App': 'true',
            'X-App-Platform': Platform.OS,
            'X-Client-Type': 'react-native',
          },
          body: JSON.stringify({
            email,
            password: hashedPassword,
            rememberMe,
          }),
        },
      );

      const data: TokenResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Save tokens and user data
      if (data.data) {
        await this.saveTokens(data.data.accessToken, data.data.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

        return {
          success: true,
          user: data.data.user,
          token: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresAt: Date.now() + data.data.expiresIn * 1000,
          rememberMe,
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async googleSignIn(
    idToken: string,
    accessToken?: string,
    userInfo?: any,
  ): Promise<AuthResponse> {
    try {
      // Use session-based OAuth endpoint for mobile to get tokens in response body
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/session/oauth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          'X-Mobile-App': 'true',
          'X-App-Platform': Platform.OS,
          'X-Client-Type': 'react-native',
        },
        body: JSON.stringify({
          idToken,
          accessToken,
          email: userInfo?.email,
          name: userInfo?.name,
          picture: userInfo?.picture,
          googleId: userInfo?.id,
        }),
      });

      const data: TokenResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Google sign in failed');
      }

      // For OAuth session endpoint, the response structure should include data with tokens
      if (data.data?.user) {
        // Save tokens if provided
        if (data.data.accessToken && data.data.refreshToken) {
          await this.saveTokens(data.data.accessToken, data.data.refreshToken);
        }
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

        return {
          success: true,
          user: data.data.user,
          token: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresAt: Date.now() + (data.data.expiresIn || 86400) * 1000,
        };
      }

      throw new Error('Invalid Google OAuth response format');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async getWalletChallenge(
    walletAddress: string,
  ): Promise<WalletChallengeResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/wallet/challenge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Beam-Mobile/${Platform.OS}`,
          },
          body: JSON.stringify({walletAddress}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get challenge');
      }

      return data;
    } catch (error) {
      console.error('Wallet challenge error:', error);
      throw error;
    }
  }

  async verifyWalletSignature(
    walletAddress: string,
    signature: string,
    nonce: string,
    registrationData?: {
      displayName?: string;
      email?: string;
    },
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/wallet/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Beam-Mobile/${Platform.OS}`,
          },
          body: JSON.stringify({
            walletAddress,
            signature,
            nonce,
            ...registrationData,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Wallet verification failed');
      }

      // For wallet auth, response includes token and user directly
      if (data.token && data.user) {
        // Store the JWT token (use it for both access and refresh for simplicity)
        await this.saveTokens(data.token, data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        return {
          success: true,
          user: data.user,
          token: data.token,
        };
      }

      throw new Error('Invalid wallet verification response format');
    } catch (error) {
      console.error('Wallet verification error:', error);
      throw error;
    }
  }

  async signIn(data: SignInRequest): Promise<AuthResponse> {
    return this.login(data.email, data.password, data.rememberMe);
  }

  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    return this.register(data.email, data.password, data.referralCode);
  }

  async signOut(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`${API_CONFIG.BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Beam-Mobile/${Platform.OS}`,
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
      await AsyncStorage.removeItem('user');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
        },
        body: JSON.stringify({
          refreshToken: refreshToken || this.refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        await this.clearTokens();
        throw new Error('Token refresh failed');
      }

      if (data.data?.accessToken) {
        this.accessToken = data.data.accessToken;
        await AsyncStorage.setItem('accessToken', this.accessToken);
        return {
          success: true,
          user: data.data.user,
          token: data.data.accessToken,
        };
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async checkAuthStatus(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      return data;
    } catch (error) {
      console.error('Auth status error:', error);
      throw error;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async completeProfileSetup(
    data: ProfileSetupData,
  ): Promise<AuthenticatedUser> {
    const response = await api.post<{user: AuthenticatedUser}>(
      '/auth/profile-setup',
      data,
    );

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Profile setup failed',
      );
    }

    return (response.data as {user: AuthenticatedUser}).user;
  }

  async updateProfile(
    data: Partial<ProfileSetupData>,
  ): Promise<AuthenticatedUser> {
    const response = await api.put<{user: AuthenticatedUser}>(
      '/auth/profile',
      data,
    );

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Profile update failed',
      );
    }

    return (response.data as {user: AuthenticatedUser}).user;
  }

  async verifyNFT(mintAddress: string): Promise<VerificationResponse> {
    const response = await api.post<VerificationResponse>('/auth/verify-nft', {
      mintAddress,
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'NFT verification failed',
      );
    }

    return response.data as VerificationResponse;
  }

  async verifySNS(domain: string): Promise<VerificationResponse> {
    const response = await api.post<VerificationResponse>('/auth/verify-sns', {
      domain,
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'SNS verification failed',
      );
    }

    return response.data as VerificationResponse;
  }

  async checkWalletExists(walletAddress: string): Promise<{exists: boolean}> {
    const response = await api.get<{exists: boolean}>(
      `/auth/check-wallet/${walletAddress}`,
    );

    if (!response.ok) {
      throw new Error('Wallet check failed');
    }

    return response.data as {exists: boolean};
  }

  // Wallet Linking Methods (new from updated guide)
  async linkWalletToAccount(walletAddress: string): Promise<{
    success: boolean;
    requestId: number;
    message: string;
    nonce: string;
    expiresAt: string;
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/wallet/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({walletAddress}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate wallet linking');
      }

      return data;
    } catch (error) {
      console.error('Wallet linking initiation error:', error);
      throw error;
    }
  }

  async verifyWalletLinking(
    requestId: number,
    signature: string,
  ): Promise<{
    success: boolean;
    message: string;
    user: any;
  }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/wallet/link/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Beam-Mobile/${Platform.OS}`,
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            requestId,
            signature,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Wallet linking verification failed');
      }

      return data;
    } catch (error) {
      console.error('Wallet linking verification error:', error);
      throw error;
    }
  }

  async unlinkPrimaryWallet(): Promise<{
    success: boolean;
    message: string;
    user: any;
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/wallet/link`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Wallet unlinking failed');
      }

      return data;
    } catch (error) {
      console.error('Wallet unlinking error:', error);
      throw error;
    }
  }

  // Linked Wallets Management Methods (new from updated guide)
  async getLinkedWallets(): Promise<{
    success: boolean;
    data: {
      wallets: Array<{
        address: string;
        isPrimary: boolean;
        isVerified: boolean;
      }>;
    };
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/wallets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get linked wallets');
      }

      return data;
    } catch (error) {
      console.error('Get linked wallets error:', error);
      throw error;
    }
  }

  async addLinkedWallet(walletAddress: string): Promise<{
    success: boolean;
    requestId: number;
    message: string;
    nonce: string;
    expiresAt: string;
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/wallets/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({walletAddress}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add linked wallet');
      }

      return data;
    } catch (error) {
      console.error('Add linked wallet error:', error);
      throw error;
    }
  }

  async verifyLinkedWallet(
    requestId: number,
    signature: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      walletAddress: string;
      linkedWallets: string[];
    };
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/wallets/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Beam-Mobile/${Platform.OS}`,
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          requestId,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Linked wallet verification failed');
      }

      return data;
    } catch (error) {
      console.error('Verify linked wallet error:', error);
      throw error;
    }
  }

  async removeLinkedWallet(walletAddress: string): Promise<{
    success: boolean;
    message: string;
    data: {
      linkedWallets: string[];
    };
  }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/user/wallets/${walletAddress}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `Beam-Mobile/${Platform.OS}`,
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove linked wallet');
      }

      return data;
    } catch (error) {
      console.error('Remove linked wallet error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<{message: string}> {
    const response = await api.post<{message: string}>('/auth/forgot-password', {
      email,
    });

    if (!response.ok) {
      throw new Error(
        (response.data as any)?.message || 'Failed to send reset email',
      );
    }

    return response.data as {message: string};
  }

  async getOnboardingStatus(): Promise<{
    id: number;
    userId: number;
    questionsAnswered: number;
    creditsAwarded: number;
    completedAt: string | null;
    skipped: boolean;
    status: string;
  }> {
    try {
      const token = getAuthToken();
      console.log('🔍 GetOnboardingStatus - Token available:', !!token);
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Use minimal headers similar to web client
      const fullUrl = `${API_CONFIG.BASE_URL}/user/onboarding/status`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      console.log('🔍 GetOnboardingStatus - Making request to:', fullUrl);
      console.log('🔍 GetOnboardingStatus - FIXED: Now using /user/onboarding/status endpoint');
      console.log('🔍 GetOnboardingStatus - Request method:', 'GET');
      console.log('🔍 GetOnboardingStatus - Request headers:', requestHeaders);
      console.log('🔍 GetOnboardingStatus - Token preview:', token.substring(0, 30) + '...');
      console.log('🔍 GetOnboardingStatus - Token length:', token.length);
      console.log('🔍 GetOnboardingStatus - API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: requestHeaders,
      });

      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      
      console.log('🔍 GetOnboardingStatus - Response status:', response.status);
      console.log('🔍 GetOnboardingStatus - Response statusText:', response.statusText);
      console.log('🔍 GetOnboardingStatus - Response ok:', response.ok);
      console.log('🔍 GetOnboardingStatus - Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔍 GetOnboardingStatus - Response text length:', responseText.length);
      console.log('🔍 GetOnboardingStatus - Full response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔍 GetOnboardingStatus - Failed to parse JSON response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 200) + '...'
        });
        throw new Error(`API returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok || !data.success) {
        console.error('🔍 GetOnboardingStatus - API error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || 'Failed to get onboarding status');
      }

      return data.data;
    } catch (error) {
      console.error('Get onboarding status error:', error);
      throw error;
    }
  }

  async completeOnboarding(skip: boolean = false): Promise<{
    id: number;
    userId: number;
    questionsAnswered: number;
    creditsAwarded: number;
    completedAt: string;
    skipped: boolean;
    status: string;
  }> {
    try {
      const token = getAuthToken();
      console.log('🔍 CompleteOnboarding - Token available:', !!token);
      console.log('🔍 CompleteOnboarding - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Use minimal headers similar to web client
      const fullUrl = `${API_CONFIG.BASE_URL}/user/onboarding/complete`;
      const requestBody = JSON.stringify({ skip });
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      console.log('🔍 CompleteOnboarding - Making request to:', fullUrl);
      console.log('🔍 CompleteOnboarding - FIXED: Now using /user/onboarding/complete endpoint');
      console.log('🔍 CompleteOnboarding - Request method:', 'POST');
      console.log('🔍 CompleteOnboarding - Request headers:', requestHeaders);
      console.log('🔍 CompleteOnboarding - Request body:', requestBody);
      console.log('🔍 CompleteOnboarding - Token preview:', token.substring(0, 30) + '...');
      console.log('🔍 CompleteOnboarding - Token length:', token.length);
      console.log('🔍 CompleteOnboarding - API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });

      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      
      console.log('🔍 CompleteOnboarding - Response status:', response.status);
      console.log('🔍 CompleteOnboarding - Response statusText:', response.statusText);
      console.log('🔍 CompleteOnboarding - Response ok:', response.ok);
      console.log('🔍 CompleteOnboarding - Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔍 CompleteOnboarding - Response text length:', responseText.length);
      console.log('🔍 CompleteOnboarding - Full response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔍 CompleteOnboarding - Failed to parse JSON response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 200) + '...',
          skip
        });
        throw new Error(`API returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok || !data.success) {
        console.error('🔍 CompleteOnboarding - API error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          skip
        });
        throw new Error(data.message || 'Onboarding completion failed');
      }

      return data.data;
    } catch (error) {
      console.error('Onboarding completion error:', error);
      throw error;
    }
  }
}

export const authAPI = new AuthAPI();
