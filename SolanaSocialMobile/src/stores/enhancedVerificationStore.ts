import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnhancedVerificationSystem,
  UserVerificationStatus,
  VerificationAttempt,
  VerificationDashboard,
  VerificationOnboarding,
  VerificationType,
  OnboardingStep,
  VerificationMethod,
  VerificationBenefit,
} from '../types/enhanced-verification';
import {analyticsService} from '../services/analytics/analyticsService';
import {API_CONFIG} from '../config/api';

// Use centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface EnhancedVerificationStore {
  // State
  verificationSystem: EnhancedVerificationSystem | null;
  userVerification: UserVerificationStatus | null;
  verificationDashboard: VerificationDashboard | null;
  onboarding: VerificationOnboarding | null;

  // Loading states
  isLoading: boolean;
  isVerifying: boolean;
  error: string | null;

  // Cache management
  lastFetchTime: number;
  cacheExpiration: number; // 5 minutes

  // Verification actions
  startNFTVerification: (nftMint: string) => Promise<void>;
  startSNSVerification: (domain: string) => Promise<void>;
  startBothVerification: (nftMint: string, domain: string) => Promise<void>;

  // Verification management
  checkVerificationStatus: () => Promise<void>;
  refreshVerification: (type: VerificationType) => Promise<void>;
  revokeVerification: (type: VerificationType) => Promise<void>;

  // Onboarding flow
  startOnboarding: () => Promise<void>;
  completeOnboardingStep: (step: OnboardingStep) => Promise<void>;
  selectVerificationType: (type: VerificationType) => void;
  selectVerificationMethod: (method: VerificationMethod) => void;

  // Data fetching
  fetchVerificationDashboard: () => Promise<void>;
  fetchVerificationHistory: () => Promise<void>;
  fetchVerificationBenefits: () => Promise<void>;
  fetchAvailableVerifications: () => Promise<void>;

  // Benefits and features
  claimVerificationBenefit: (benefitId: string) => Promise<void>;
  updateVerificationPreferences: (preferences: any) => Promise<void>;

  // UI state
  clearError: () => void;
  resetOnboarding: () => void;
  clearCache: () => void;
}

export const useEnhancedVerificationStore = create<EnhancedVerificationStore>()(
  persist(
    (set, get) => ({
      verificationSystem: null,
      userVerification: null,
      verificationDashboard: null,
      onboarding: null,
      isLoading: false,
      isVerifying: false,
      error: null,
      lastFetchTime: 0,
      cacheExpiration: 5 * 60 * 1000, // 5 minutes

      startNFTVerification: async nftMint => {
        set({isVerifying: true, error: null});

        try {
          // Mock NFT verification
          const mockAttempt: VerificationAttempt = {
            id: `attempt-${Date.now()}`,
            type: 'nft',
            initiatedAt: new Date().toISOString(),
            status: 'processing',
            verificationMethod: 'ownership_proof',
            evidence: [
              {
                type: 'ownership_proof',
                data: nftMint,
                timestamp: new Date().toISOString(),
                verified: false,
              },
            ],
            success: false,
            retryable: true,
            maxRetries: 3,
            retryCount: 0,
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Update verification status
          const currentVerification = get().userVerification;
          if (currentVerification) {
            const updatedVerification: UserVerificationStatus = {
              ...currentVerification,
              isVerifiedNFT: true,
              nftVerification: {
                nftMint,
                nftName: 'Mock NFT',
                nftSymbol: 'MNFT',
                collectionName: 'Mock Collection',
                collectionVerified: true,
                verificationMethod: 'ownership_proof',
                verifiedAt: new Date().toISOString(),
                status: 'verified',
                lastChecked: new Date().toISOString(),
                autoVerify: true,
              },
              nftVerifiedAt: new Date().toISOString(),
              isFullyVerified: currentVerification.isVerifiedSNS,
              verificationLevel: currentVerification.isVerifiedSNS
                ? 'fully_verified'
                : 'nft_verified',
              verificationScore: currentVerification.verificationScore + 25,
            };

            set({
              userVerification: updatedVerification,
              isVerifying: false,
            });
          }

          // Track analytics
          analyticsService.trackEvent('verification_nft_started', {
            nft_mint: nftMint,
            method: 'ownership_proof',
          });

          // Refresh dashboard
          await get().fetchVerificationDashboard();
        } catch (error) {
          set({
            isVerifying: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to start NFT verification',
          });
          throw error;
        }
      },

      startSNSVerification: async domain => {
        set({isVerifying: true, error: null});

        try {
          // Mock SNS verification
          const mockAttempt: VerificationAttempt = {
            id: `attempt-${Date.now()}`,
            type: 'sns',
            initiatedAt: new Date().toISOString(),
            status: 'processing',
            verificationMethod: 'domain_signature',
            evidence: [
              {
                type: 'ownership_proof',
                data: domain,
                timestamp: new Date().toISOString(),
                verified: false,
              },
            ],
            success: false,
            retryable: true,
            maxRetries: 3,
            retryCount: 0,
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Update verification status
          const currentVerification = get().userVerification;
          if (currentVerification) {
            const updatedVerification: UserVerificationStatus = {
              ...currentVerification,
              isVerifiedSNS: true,
              snsVerification: {
                domain,
                fullDomain: `${domain}.sol`,
                domainOwner: currentVerification.userWallet,
                verificationMethod: 'domain_signature',
                verifiedAt: new Date().toISOString(),
                status: 'verified',
                lastChecked: new Date().toISOString(),
                autoRenew: true,
              },
              snsVerifiedAt: new Date().toISOString(),
              isFullyVerified: currentVerification.isVerifiedNFT,
              verificationLevel: currentVerification.isVerifiedNFT
                ? 'fully_verified'
                : 'sns_verified',
              verificationScore: currentVerification.verificationScore + 25,
            };

            set({
              userVerification: updatedVerification,
              isVerifying: false,
            });
          }

          // Track analytics
          analyticsService.trackEvent('verification_sns_started', {
            domain,
            method: 'domain_signature',
          });

          // Refresh dashboard
          await get().fetchVerificationDashboard();
        } catch (error) {
          set({
            isVerifying: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to start SNS verification',
          });
          throw error;
        }
      },

      startBothVerification: async (nftMint, domain) => {
        set({isVerifying: true, error: null});

        try {
          // Start both verifications
          await Promise.all([
            get().startNFTVerification(nftMint),
            get().startSNSVerification(domain),
          ]);

          set({isVerifying: false});
        } catch (error) {
          set({
            isVerifying: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to start combined verification',
          });
          throw error;
        }
      },

      checkVerificationStatus: async () => {
        const state = get();
        const now = Date.now();

        // Check cache validity
        if (
          state.userVerification &&
          now - state.lastFetchTime < state.cacheExpiration
        ) {
          return;
        }

        set({isLoading: true, error: null});

        try {
          // Mock user verification status
          const mockVerification: UserVerificationStatus = {
            userId: 'user123',
            userWallet: 'UserWallet111111111111111111111111111111',
            isVerifiedNFT: false,
            isVerifiedSNS: false,
            isFullyVerified: false,
            verificationLevel: 'unverified',
            verificationScore: 0,
            lastVerificationCheck: new Date().toISOString(),
            onChainVerified: false,
            unlockedFeatures: [],
            verificationBadges: [],
          };

          set({
            userVerification: mockVerification,
            isLoading: false,
            lastFetchTime: now,
          });

          analyticsService.trackEvent('verification_status_checked', {
            level: mockVerification.verificationLevel,
            score: mockVerification.verificationScore,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch verification status',
          });
        }
      },

      refreshVerification: async type => {
        set({isLoading: true, error: null});

        try {
          // Simulate refresh
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Refresh verification status
          await get().checkVerificationStatus();

          set({isLoading: false});

          analyticsService.trackEvent('verification_refreshed', {
            type,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : `Failed to refresh ${type} verification`,
          });
          throw error;
        }
      },

      revokeVerification: async type => {
        set({isLoading: true, error: null});

        try {
          // Simulate revocation
          await new Promise(resolve => setTimeout(resolve, 1000));

          const currentVerification = get().userVerification;
          if (currentVerification) {
            const updatedVerification = {...currentVerification};

            if (type === 'nft') {
              updatedVerification.isVerifiedNFT = false;
              updatedVerification.nftVerification = undefined;
              updatedVerification.nftVerifiedAt = undefined;
            } else if (type === 'sns') {
              updatedVerification.isVerifiedSNS = false;
              updatedVerification.snsVerification = undefined;
              updatedVerification.snsVerifiedAt = undefined;
            }

            updatedVerification.isFullyVerified =
              updatedVerification.isVerifiedNFT &&
              updatedVerification.isVerifiedSNS;
            updatedVerification.verificationLevel =
              updatedVerification.isFullyVerified
                ? 'fully_verified'
                : updatedVerification.isVerifiedNFT
                ? 'nft_verified'
                : updatedVerification.isVerifiedSNS
                ? 'sns_verified'
                : 'unverified';
            updatedVerification.verificationScore = Math.max(
              0,
              updatedVerification.verificationScore - 25,
            );

            set({
              userVerification: updatedVerification,
              isLoading: false,
            });
          }

          analyticsService.trackEvent('verification_revoked', {
            type,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : `Failed to revoke ${type} verification`,
          });
          throw error;
        }
      },

      fetchVerificationDashboard: async () => {
        set({isLoading: true, error: null});

        try {
          // Mock dashboard data
          const mockDashboard: VerificationDashboard = {
            verificationSummary: {
              verificationLevel:
                get().userVerification?.verificationLevel || 'unverified',
              completionPercentage:
                get().userVerification?.verificationScore || 0,
              nextMilestone: 'Complete SNS verification',
              benefitsUnlocked: 3,
              credibilityScore: 75,
            },
            quickActions: [
              {
                id: 'verify-nft',
                title: 'Verify NFT Ownership',
                description: 'Connect your NFT to unlock features',
                icon: '🖼️',
                action: 'startNFTVerification',
                priority: 'high',
                available: true,
              },
              {
                id: 'verify-sns',
                title: 'Verify SNS Domain',
                description: 'Connect your .sol domain',
                icon: '🌐',
                action: 'startSNSVerification',
                priority: 'high',
                available: true,
              },
              {
                id: 'claim-badge',
                title: 'Claim Verification Badge',
                description: 'Display your verified status',
                icon: '🏅',
                action: 'claimBadge',
                priority: 'medium',
                available: false,
              },
            ],
            recentAttempts: [],
            recentlyUnlocked: [],
            progressMetrics: [
              {
                name: 'Verification Score',
                current: get().userVerification?.verificationScore || 0,
                target: 100,
                unit: 'points',
                trend: 'up',
              },
              {
                name: 'Features Unlocked',
                current: get().userVerification?.unlockedFeatures.length || 0,
                target: 10,
                unit: 'features',
                trend: 'up',
              },
            ],
            upcomingExpiration: [],
            recommendations: [
              {
                id: 'rec-1',
                title: 'Complete Full Verification',
                description: 'Verify both NFT and SNS to unlock all features',
                benefit: 'Unlock premium features and reduced fees',
                difficulty: 'easy',
                estimatedTime: '5 minutes',
                priority: 1,
                category: 'verification',
              },
            ],
            suggestedActions: [],
          };

          set({verificationDashboard: mockDashboard, isLoading: false});
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch dashboard',
          });
        }
      },

      startOnboarding: async () => {
        set({isLoading: true, error: null});

        try {
          // Mock onboarding data
          const mockOnboarding: VerificationOnboarding = {
            currentStep: 'welcome',
            completedSteps: [],
            totalSteps: 7,
            selectedVerificationType: null,
            selectedMethod: null,
            preparationItems: [
              {
                id: 'prep-1',
                title: 'Connect your wallet',
                description: 'Ensure your Solana wallet is connected',
                completed: true,
                required: true,
              },
              {
                id: 'prep-2',
                title: 'Have your NFT ready',
                description: 'Know which NFT you want to verify',
                completed: false,
                required: false,
              },
              {
                id: 'prep-3',
                title: 'SNS domain ownership',
                description: 'Ensure you own a .sol domain',
                completed: false,
                required: false,
              },
            ],
            readyToStart: true,
            tutorials: [],
            faqs: [],
            supportOptions: [],
          };

          set({onboarding: mockOnboarding, isLoading: false});

          analyticsService.trackEvent('verification_onboarding_started', {});
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to start onboarding',
          });
        }
      },

      completeOnboardingStep: async step => {
        const currentOnboarding = get().onboarding;
        if (!currentOnboarding) {
          return;
        }

        try {
          const updatedOnboarding: VerificationOnboarding = {
            ...currentOnboarding,
            completedSteps: [...currentOnboarding.completedSteps, step],
            currentStep: getNextStep(step),
          };

          set({onboarding: updatedOnboarding});

          analyticsService.trackEvent(
            'verification_onboarding_step_completed',
            {
              step,
              next_step: updatedOnboarding.currentStep,
            },
          );
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to complete step',
          });
          throw error;
        }
      },

      selectVerificationType: type => {
        set(state => ({
          onboarding: state.onboarding
            ? {
                ...state.onboarding,
                selectedVerificationType: type,
              }
            : null,
        }));
      },

      selectVerificationMethod: method => {
        set(state => ({
          onboarding: state.onboarding
            ? {
                ...state.onboarding,
                selectedMethod: method,
              }
            : null,
        }));
      },

      claimVerificationBenefit: async benefitId => {
        set({isLoading: true, error: null});

        try {
          // Simulate claiming benefit
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Refresh dashboard to show updated benefits
          await get().fetchVerificationDashboard();

          set({isLoading: false});

          analyticsService.trackEvent('verification_benefit_claimed', {
            benefit_id: benefitId,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to claim benefit',
          });
          throw error;
        }
      },

      fetchVerificationHistory: async () => {
        try {
          // Mock history data
          const mockHistory: VerificationAttempt[] = [
            {
              id: 'attempt-1',
              type: 'nft',
              initiatedAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              completedAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000,
              ).toISOString(),
              status: 'completed',
              verificationMethod: 'ownership_proof',
              evidence: [],
              success: true,
              retryable: false,
              maxRetries: 3,
              retryCount: 0,
            },
          ];

          set(state => ({
            verificationSystem: state.verificationSystem
              ? {
                  ...state.verificationSystem,
                  verificationHistory: mockHistory,
                }
              : {
                  userVerification: state.userVerification!,
                  verificationHistory: mockHistory,
                  availableVerifications: [],
                  verificationRequirements: [],
                  verificationStats: {} as any,
                  verificationBenefits: [],
                },
          }));
        } catch (error) {
          console.error('Failed to fetch verification history:', error);
        }
      },

      fetchVerificationBenefits: async () => {
        try {
          // Mock benefits data
          const mockBenefits: VerificationBenefit[] = [
            {
              id: 'benefit-1',
              name: 'Reduced Transaction Fees',
              description: 'Get 50% off all transaction fees',
              requiredLevel: 'fully_verified',
              requiredNFT: true,
              requiredSNS: true,
              benefitType: 'reduced_fees',
              value: '50% discount',
              permanent: true,
              available: true,
              unlocked: false,
              icon: '💰',
              color: '#10B981',
              priority: 1,
            },
            {
              id: 'benefit-2',
              name: 'Priority Support',
              description: 'Get faster response times from support',
              requiredLevel: 'nft_verified',
              requiredNFT: true,
              requiredSNS: false,
              benefitType: 'priority_support',
              value: '24h response',
              permanent: true,
              available: true,
              unlocked: false,
              icon: '🚀',
              color: '#3B82F6',
              priority: 2,
            },
          ];

          set(state => ({
            verificationSystem: state.verificationSystem
              ? {
                  ...state.verificationSystem,
                  verificationBenefits: mockBenefits,
                }
              : null,
          }));
        } catch (error) {
          console.error('Failed to fetch verification benefits:', error);
        }
      },

      fetchAvailableVerifications: async () => {
        try {
          // Mock available verifications
          const mockMethods: VerificationMethod[] = [
            {
              id: 'method-nft-1',
              type: 'nft',
              name: 'NFT Ownership Verification',
              description: 'Verify ownership of an NFT in your wallet',
              requirements: ['Connected wallet', 'NFT in wallet'],
              estimatedTime: '2 minutes',
              difficulty: 'easy',
              supportedWallets: ['Phantom', 'Solflare', 'Backpack'],
              available: true,
              deprecated: false,
              beta: false,
            },
            {
              id: 'method-sns-1',
              type: 'sns',
              name: 'SNS Domain Verification',
              description: 'Verify ownership of a .sol domain',
              requirements: ['Connected wallet', '.sol domain'],
              estimatedTime: '3 minutes',
              difficulty: 'easy',
              supportedWallets: ['Phantom', 'Solflare', 'Backpack'],
              supportedDomains: ['.sol'],
              available: true,
              deprecated: false,
              beta: false,
            },
          ];

          set(state => ({
            verificationSystem: state.verificationSystem
              ? {
                  ...state.verificationSystem,
                  availableVerifications: mockMethods,
                }
              : null,
          }));
        } catch (error) {
          console.error('Failed to fetch available verifications:', error);
        }
      },

      updateVerificationPreferences: async preferences => {
        try {
          // Mock update preferences
          await new Promise(resolve => setTimeout(resolve, 500));

          analyticsService.trackEvent('verification_preferences_updated', {
            preferences,
          });
        } catch (error) {
          throw error;
        }
      },

      clearError: () => set({error: null}),
      resetOnboarding: () => set({onboarding: null}),
      clearCache: () => set({lastFetchTime: 0}),
    }),
    {
      name: 'enhanced-verification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        userVerification: state.userVerification,
        lastFetchTime: state.lastFetchTime,
      }),
    },
  ),
);

// Helper function to get auth token
function getAuthToken(): string {
  // In a real app, this would get the token from secure storage
  return 'mock-auth-token';
}

// Helper function to determine next onboarding step
function getNextStep(currentStep: OnboardingStep): OnboardingStep {
  const steps: OnboardingStep[] = [
    'welcome',
    'select_type',
    'choose_method',
    'prepare',
    'verify',
    'confirm',
    'complete',
  ];

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex < steps.length - 1) {
    return steps[currentIndex + 1];
  }
  return 'complete';
}
