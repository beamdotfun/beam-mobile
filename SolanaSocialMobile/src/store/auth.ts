import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PublicKey} from '@solana/web3.js';
import {
  AuthState,
  AuthenticatedUser,
  SignInRequest,
  SignUpRequest,
  ProfileSetupData,
} from '@/types/auth';
import {authAPI} from '../services/api/auth';
import {socialAPI} from '../services/api/social';
import {setAuthToken} from '../services/api/client';
import {useWalletStore} from './wallet';
import {isJWTExpired, getJWTTimeUntilExpiry} from '../utils/jwtUtils';

interface AuthStore extends AuthState {
  // Rehydration state
  isRehydrated: boolean;
  
  // Authentication actions
  signInWithWallet: (walletAddress: string) => Promise<void>;
  completeWalletAuth: (
    walletAddress: string,
    signature: string,
    nonce: string,
    registrationData?: {
      displayName?: string;
      email?: string;
    },
  ) => Promise<void>;
  completeSIWSAuth: (
    user: any,
    token: string,
    refreshToken?: string,
  ) => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    referralCode?: string,
  ) => Promise<void>;
  signInWithGoogle: (idToken: string, userInfo?: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;

  // Profile setup
  completeProfileSetup: (data: ProfileSetupData) => Promise<void>;
  updateProfile: (data: Partial<ProfileSetupData>) => Promise<void>;

  // Verification
  verifyNFT: (mintAddress: string) => Promise<boolean>;
  verifySNS: (domain: string) => Promise<boolean>;

  // Onboarding
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;

  // Utilities
  generateSignInMessage: (walletAddress: string) => string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  setRehydrated: () => void;
}

const createSignMessage = (
  walletAddress: string,
  timestamp: string,
): string => {
  return `Welcome to Beam!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

// Log when store is created
// console.log('Creating auth store...');

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      hasCompletedOnboarding: false,
      isRehydrated: false,

      // Sign in with wallet
      signInWithWallet: async (walletAddress: string) => {
        set({isLoading: true, error: null});

        try {
          // This should be handled by the calling component since it needs wallet interaction
          // For now, just set an error to indicate the wallet flow needs to be completed externally
          throw new Error(
            'Wallet authentication must be completed in the UI component',
          );
        } catch (error) {
          console.error('Wallet authentication setup failed:', error);
          set({
            isLoading: false,
            error: 'Wallet authentication failed. Please try again.',
          });
          throw error;
        }
      },

      // Complete wallet authentication after signature
      completeWalletAuth: async (
        walletAddress: string,
        signature: string,
        nonce: string,
        registrationData?: {
          displayName?: string;
          email?: string;
        },
      ) => {
        set({isLoading: true, error: null});

        try {
          const authResponse = await authAPI.verifyWalletSignature(
            walletAddress,
            signature,
            nonce,
            registrationData,
          );

          if (authResponse.success && authResponse.user) {
            // Set the access token in the API client
            if (authResponse.token) {
              setAuthToken(authResponse.token);
            }

            // Check if this is a new user who needs onboarding
            const user = authResponse.user;
            const isNewUser = user.isNewUser || 
                             !user.displayName || 
                             !user.name || 
                             user.profileCompletionScore === 0;
            
            console.log('🔍 AuthStore: Wallet user onboarding check:', {
              isNewUser,
              hasDisplayName: !!user.displayName,
              hasName: !!user.name,
              profileCompletionScore: user.profileCompletionScore,
              shouldShowOnboarding: isNewUser
            });

            set({
              isAuthenticated: true,
              user: authResponse.user,
              token: authResponse.token,
              refreshToken: authResponse.refreshToken,
              isLoading: false,
              hasCompletedOnboarding: !isNewUser, // New wallet users need onboarding
            });
          } else {
            throw new Error('Wallet authentication failed');
          }
        } catch (error) {
          console.error('Wallet authentication failed:', error);
          set({
            isLoading: false,
            error: 'Wallet authentication failed. Please try again.',
          });
          throw error;
        }
      },

      // Complete SIWS authentication (bypasses old challenge/verify flow)
      completeSIWSAuth: async (
        user: any,
        token: string,
        refreshToken?: string,
      ) => {
        set({isLoading: true, error: null});

        try {
          console.log('🔍 AuthStore: Completing SIWS authentication...');
          
          // Set the access token in the API client
          setAuthToken(token);

          // Check actual onboarding status from backend
          let hasCompletedOnboarding = true; // Default to true in case of API failure
          try {
            console.log('🔍 AuthStore: Checking onboarding status from backend...');
            const onboardingStatus = await authAPI.getOnboardingStatus();
            hasCompletedOnboarding = !!onboardingStatus.completedAt;
            console.log('🔍 AuthStore: Onboarding status check result:', {
              hasCompletedOnboarding,
              completedAt: onboardingStatus.completedAt,
              status: onboardingStatus.status,
              skipped: onboardingStatus.skipped
            });
          } catch (onboardingError) {
            console.warn('⚠️ AuthStore: Failed to check onboarding status, assuming completed:', onboardingError);
            // If the user has profile fields filled, assume they completed onboarding
            hasCompletedOnboarding = !!(user.displayName || user.name);
          }

          set({
            isAuthenticated: true,
            user: user,
            token: token,
            refreshToken: refreshToken,
            isLoading: false,
            hasCompletedOnboarding,
            error: null,
          });
          
          console.log('✅ AuthStore: SIWS authentication completed successfully');
        } catch (error) {
          console.error('❌ AuthStore: SIWS authentication failed:', error);
          set({
            isLoading: false,
            error: 'SIWS authentication failed. Please try again.',
          });
          throw error;
        }
      },

      // Sign in with email
      signInWithEmail: async (
        email: string,
        password: string,
        rememberMe: boolean = false,
      ) => {
        set({isLoading: true, error: null});

        try {
          const authResponse = await authAPI.login(email, password, rememberMe);

          if (authResponse.success && authResponse.user) {
            // Set the access token in the API client
            if (authResponse.token) {
              setAuthToken(authResponse.token);
            }

            set({
              isAuthenticated: true,
              user: authResponse.user,
              token: authResponse.token,
              refreshToken: authResponse.refreshToken,
              isLoading: false,
              hasCompletedOnboarding: true, // For email users, consider them onboarded
            });
          } else {
            throw new Error(authResponse.message || 'Sign in failed');
          }
        } catch (error) {
          console.error('Email sign in failed:', error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Sign in failed. Please try again.',
          });
          throw error;
        }
      },

      // Sign up with email
      signUpWithEmail: async (
        email: string,
        password: string,
        referralCode?: string,
      ) => {
        set({isLoading: true, error: null});

        try {
          const authResponse = await authAPI.register(
            email,
            password,
            referralCode,
          );

          if (authResponse.success && authResponse.user) {
            // Set the token in the API client
            if (authResponse.token) {
              setAuthToken(authResponse.token);
            }

            set({
              isAuthenticated: true,
              user: authResponse.user,
              token: authResponse.token,
              refreshToken: authResponse.refreshToken,
              isLoading: false,
              hasCompletedOnboarding: false, // New users need onboarding
            });
          } else {
            throw new Error(authResponse.message || 'Registration failed');
          }
        } catch (error) {
          console.error('Email registration failed:', error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Registration failed. Please try again.',
          });
          throw error;
        }
      },

      // Sign in with Google
      signInWithGoogle: async (idToken: string, userInfo?: any) => {
        set({isLoading: true, error: null});

        try {
          const authResponse = await authAPI.googleSignIn(
            idToken,
            undefined,
            userInfo,
          );

          if (authResponse.success && authResponse.user) {
            // Set the access token in the API client
            if (authResponse.token) {
              setAuthToken(authResponse.token);
            }

            set({
              isAuthenticated: true,
              user: authResponse.user,
              token: authResponse.token,
              refreshToken: authResponse.refreshToken,
              isLoading: false,
              hasCompletedOnboarding: true, // OAuth users considered onboarded
            });
          } else {
            throw new Error(authResponse.message || 'Google sign in failed');
          }
        } catch (error) {
          console.error('Google sign in failed:', error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Google sign in failed. Please try again.',
          });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          const {token} = get();
          if (token) {
            await authAPI.signOut();
          }

          // Clear the token from the API client
          setAuthToken(null);
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          get().clearAuth();

          // Also disconnect wallet
          const {disconnect} = useWalletStore.getState();
          await disconnect();
        }
      },

      // Refresh authentication
      refreshAuth: async () => {
        try {
          const {refreshToken} = get();
          
          // First try to refresh the token if we have a refresh token
          if (refreshToken) {
            try {
              console.log('Refreshing auth token...');
              const authResponse = await authAPI.refreshToken(refreshToken);
              
              if (authResponse.success && authResponse.token) {
                // Update token in API client
                setAuthToken(authResponse.token);
                
                set({
                  isAuthenticated: true,
                  user: authResponse.user || get().user,
                  token: authResponse.token,
                });
                
                console.log('Token refresh successful');
                return;
              }
            } catch (refreshError: any) {
              // Only log if it's not a normal auth failure
              const errorMessage = refreshError?.message?.toLowerCase() || '';
              if (!errorMessage.includes('not authenticated') && !errorMessage.includes('unauthorized')) {
                console.warn('Token refresh failed, trying auth status check:', refreshError);
              }
            }
          }
          
          // Fall back to checking auth status with current token
          const authResponse = await authAPI.checkAuthStatus();

          if (authResponse.success && authResponse.authenticated) {
            // New API format returns userId instead of user object
            // We need to preserve existing user data or fetch it separately if needed
            const currentUser = get().user;
            
            set({
              isAuthenticated: true,
              user: currentUser || {
                id: (authResponse as any).userId,
                email: '', // Will need to fetch from /user/profile if needed
                role: 'user',
              },
            });
          } else {
            get().clearAuth();
          }
        } catch (error) {
          console.error('Auth refresh failed:', error);
          get().clearAuth();
          throw error;
        }
      },

      // Complete profile setup
      completeProfileSetup: async (data: ProfileSetupData) => {
        set({isLoading: true, error: null});

        try {
          const updatedUser = await authAPI.completeProfileSetup(data);

          set({
            user: updatedUser,
            isLoading: false,
            hasCompletedOnboarding: true,
          });
          
          // Fetch updated profile data using new endpoint
          try {
            const profileResponse = await socialAPI.getAuthenticatedUserProfile();
            if (profileResponse) {
              // Update user with additional profile fields
              set(state => ({
                user: state.user ? {
                  ...state.user,
                  displayName: profileResponse.displayName,
                  profilePicture: profileResponse.profilePicture,
                } : null
              }));
            }
          } catch (profileError) {
            console.warn('Failed to fetch updated profile:', profileError);
          }
        } catch (error) {
          console.error('Profile setup failed:', error);
          set({
            isLoading: false,
            error: 'Profile setup failed. Please try again.',
          });
          throw error;
        }
      },

      // Update profile - use new endpoint
      updateProfile: async (data: Partial<ProfileSetupData>) => {
        try {
          // Use the new profile update endpoint
          const response = await socialAPI.updateProfile(data);
          
          // Update local user state with response data
          if (response) {
            const updatedData = response.userData || response;
            set(state => ({
              user: state.user ? {
                ...state.user,
                displayName: updatedData.displayName,
                profilePicture: updatedData.profilePicture,
                name: updatedData.displayName, // Keep backward compatibility
              } : null
            }));
          }
        } catch (error) {
          console.error('Profile update failed:', error);
          throw error;
        }
      },

      // Verify NFT ownership
      verifyNFT: async (mintAddress: string) => {
        try {
          const verificationResult = await authAPI.verifyNFT(mintAddress);

          if (verificationResult.verified) {
            set(state => ({
              user: state.user
                ? {
                    ...state.user,
                    hasVerifiedNFT: true,
                    profileCompletionScore:
                      state.user.profileCompletionScore + 20,
                  }
                : null,
            }));
          }

          return verificationResult.verified;
        } catch (error) {
          console.error('NFT verification failed:', error);
          throw error;
        }
      },

      // Verify SNS domain
      verifySNS: async (domain: string) => {
        try {
          const verificationResult = await authAPI.verifySNS(domain);

          if (verificationResult.verified) {
            set(state => ({
              user: state.user
                ? {
                    ...state.user,
                    hasVerifiedSNS: true,
                    profileCompletionScore:
                      state.user.profileCompletionScore + 20,
                  }
                : null,
            }));
          }

          return verificationResult.verified;
        } catch (error) {
          console.error('SNS verification failed:', error);
          throw error;
        }
      },

      // Complete onboarding
      completeOnboarding: async () => {
        set({isLoading: true, error: null});
        
        try {
          console.log('🔄 Completing onboarding...');
          const {token, isAuthenticated, user} = get();
          console.log('🔍 Auth Store State:', {
            hasToken: !!token,
            isAuthenticated,
            hasUser: !!user,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
          });
          
          const onboardingResult = await authAPI.completeOnboarding(false);
          console.log('✅ Onboarding completed successfully:', onboardingResult.status);
          
          set({
            hasCompletedOnboarding: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('❌ Failed to complete onboarding:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to complete onboarding',
          });
          throw error;
        }
      },

      // Skip onboarding
      skipOnboarding: async () => {
        set({isLoading: true, error: null});
        
        try {
          console.log('🔄 Skipping onboarding...');
          const onboardingResult = await authAPI.completeOnboarding(true);
          console.log('✅ Onboarding skipped successfully:', onboardingResult.status);
          
          set({
            hasCompletedOnboarding: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('❌ Failed to skip onboarding:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to skip onboarding',
          });
          throw error;
        }
      },

      // Generate sign-in message
      generateSignInMessage: (walletAddress: string) => {
        const timestamp = new Date().toISOString();
        return createSignMessage(walletAddress, timestamp);
      },

      // Utilities
      setLoading: (loading: boolean) => set({isLoading: loading}),
      setError: (error: string | null) => set({error}),

      clearAuth: () => {
        // Clear the token from the API client
        setAuthToken(null);

        set((state) => ({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          hasCompletedOnboarding: false,
          error: null,
          // IMPORTANT: Preserve rehydration state
          isRehydrated: state.isRehydrated,
        }));
      },
      
      // Manual rehydration completion - called after persist rehydration
      setRehydrated: () => set({isRehydrated: true}),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      onRehydrateStorage: () => {
        // console.log('Auth store rehydration callback starting...');
        
        return (state, error) => {
          // console.log('Auth store rehydrating from storage, has token:', !!state?.token);
          
          if (error) {
            console.error('Rehydration error:', error);
            // Manually set rehydrated even on error
            setTimeout(() => {
              useAuthStore.getState().setRehydrated();
            }, 0);
            return;
          }
          
          // Check if token exists and is not expired
          if (state?.token) {
            const isExpired = isJWTExpired(state.token);
            const timeUntilExpiry = getJWTTimeUntilExpiry(state.token);
            
            // console.log('Token expiry check:', { isExpired, timeUntilExpiry });
            
            if (isExpired) {
              console.warn('Stored token is expired, clearing auth state');
              // Clear expired auth state immediately
              setAuthToken(null);
              
              // Clear the state and mark as rehydrated
              setTimeout(() => {
                const store = useAuthStore.getState();
                store.clearAuth();
                store.setRehydrated();
                console.log('Post-rehydration state:', { 
                  isAuthenticated: store.isAuthenticated, 
                  hasCompletedOnboarding: store.hasCompletedOnboarding,
                  isRehydrated: store.isRehydrated 
                });
              }, 0);
              return;
            }
            
            console.log('Setting valid auth token in API client');
            setAuthToken(state.token);

            // Background validation for token health
            setTimeout(async () => {
              try {
                const store = useAuthStore.getState();
                // Skip validation if already cleared or not authenticated
                if (!store.token || !store.isAuthenticated) {
                  return;
                }
                
                if (timeUntilExpiry < 300) {
                  console.log('Token expires soon, validating immediately...');
                } else {
                  console.log('Background token validation...');
                }
                
                await store.refreshAuth();
                console.log('Token validation successful');
              } catch (error: any) {
                // Only log actual unexpected errors
                const errorMessage = error?.message?.toLowerCase() || '';
                const isAuthError = errorMessage.includes('not authenticated') || 
                                   errorMessage.includes('unauthorized') ||
                                   errorMessage.includes('401') ||
                                   errorMessage.includes('invalid token');
                
                if (!isAuthError) {
                  console.warn('Token validation encountered an error:', error);
                } else {
                  // Silent clear for normal auth failures
                  console.log('Token validation failed - clearing invalid session');
                }
                
                const store = useAuthStore.getState();
                store.clearAuth();
              }
            }, timeUntilExpiry < 300 ? 100 : 2000);
          } else {
            // console.log('No token found in storage');
          }
          
          // Always manually set rehydrated flag
          setTimeout(() => {
            const store = useAuthStore.getState();
            store.setRehydrated();
            // console.log('Manually set isRehydrated to true');
          }, 0);
        };
      },
    },
  ),
);

