export interface AuthState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
}

export interface AuthenticatedUser {
  walletAddress: string;
  displayName?: string;
  profilePicture?: string;
  email?: string;
  isVerified: boolean;
  onChainReputation: number;
  joinedAt: string;
  lastLoginAt: string;

  // Profile completion status
  hasBasicProfile: boolean;
  hasVerifiedNFT: boolean;
  hasVerifiedSNS: boolean;
  profileCompletionScore: number;
}

export interface SignInRequest {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: string;
}

export interface SignUpRequest {
  walletAddress: string;
  signature: string;
  message: string;
  displayName?: string;
  email?: string;
  referralCode?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
}

export interface ProfileSetupData {
  displayName: string;
  bio?: string;
  profilePicture?: string;
  email?: string;
  isPrivate: boolean;
  allowDirectMessages: boolean;
  showActivity: boolean;

  // Verification attempts
  nftMintAddress?: string;
  snsDomain?: string;
}
