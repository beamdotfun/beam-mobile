import { useWalletStore } from '../store/wallet';
import { useAuthStore } from '../store/auth';
import { useProfileStore } from '../store/profileStore';

export type WalletWarningType = 'setup' | 'connect' | 'balance' | null;

export interface WalletConnectionState {
  // Core connection state
  publicKey: any;
  isWalletConnected: boolean;
  isPrimaryWalletConnected: boolean;
  
  // Wallet setup state
  primaryWalletAddress: string | null;
  hasPrimaryWalletSetup: boolean;
  
  // SIWS authentication state
  isSIWSAuthenticated: boolean;
  
  // Warning state
  walletWarningType: WalletWarningType;
  showWalletWarning: boolean;
  
  // Helper functions
  getWalletWarningType: (options?: { requireBalance?: boolean, balance?: number }) => WalletWarningType;
}

/**
 * Hook to handle wallet connection state consistently across the app.
 * Provides proper SIWS authentication support and eliminates the need for
 * complex primary wallet matching for authenticated users.
 */
export function useWalletConnection(): WalletConnectionState {
  const { publicKey } = useWalletStore();
  const { user } = useAuthStore();
  const { currentProfile } = useProfileStore();

  // Get primary wallet address from profile or user data
  const primaryWalletAddress = currentProfile?.primaryWalletAddress || 
                              currentProfile?.wallet_address || 
                              currentProfile?.userWallet || 
                              currentProfile?.walletAddress || 
                              user?.walletAddress || 
                              null;

  // Core wallet connection state
  const isWalletConnected = !!publicKey;
  const hasPrimaryWalletSetup = !!primaryWalletAddress;
  
  // For SIWS users: if they're authenticated and wallet is connected, they're good to go
  // This avoids the complex primary wallet matching for users who signed in with Solana
  const isSIWSAuthenticated = !!(user && publicKey);
  
  const isPrimaryWalletConnected = isSIWSAuthenticated || 
                                   (publicKey && primaryWalletAddress && 
                                    publicKey.toString() === primaryWalletAddress);

  // Function to determine what wallet warning to show
  const getWalletWarningType = (options?: { requireBalance?: boolean, balance?: number }): WalletWarningType => {
    const { requireBalance = false, balance = null } = options || {};
    
    // If user is authenticated via SIWS and has wallet connected
    if (isSIWSAuthenticated) {
      // Only check balance if required
      if (requireBalance && (balance === null || balance <= 0)) {
        return 'balance';
      }
      return null; // No warning needed
    }
    
    // Otherwise use traditional logic for non-SIWS users
    if (!hasPrimaryWalletSetup) return 'setup'; // No primary wallet set up
    if (!isWalletConnected || !isPrimaryWalletConnected) return 'connect'; // Need to connect
    
    // Check balance if required
    if (requireBalance && (balance === null || balance <= 0)) {
      return 'balance';
    }
    
    return null; // No warning needed
  };

  const walletWarningType = getWalletWarningType();
  const showWalletWarning = walletWarningType !== null;

  return {
    // Core connection state
    publicKey,
    isWalletConnected,
    isPrimaryWalletConnected,
    
    // Wallet setup state
    primaryWalletAddress,
    hasPrimaryWalletSetup,
    
    // SIWS authentication state
    isSIWSAuthenticated,
    
    // Warning state
    walletWarningType,
    showWalletWarning,
    
    // Helper functions
    getWalletWarningType,
  };
}