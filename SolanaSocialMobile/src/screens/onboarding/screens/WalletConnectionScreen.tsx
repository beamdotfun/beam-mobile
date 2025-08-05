import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import {Wallet, ChevronRight} from 'lucide-react-native';

import {useWalletStore} from '../../../store/wallet';
import {useAuthStore} from '../../../store/auth';
import {useThemeStore} from '../../../store/themeStore';
import {authAPI} from '../../../services/api/auth';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol';

interface WalletConnectionScreenProps {
  onWalletConnected: () => void;
  onSkip: () => void;
}

export const WalletConnectionScreen: React.FC<WalletConnectionScreenProps> = ({
  onWalletConnected,
  onSkip,
}) => {
  const {connect, connecting, publicKey} = useWalletStore();
  const {completeWalletAuth, isLoading} = useAuthStore();
  const {isDark} = useThemeStore();
  const [error, setError] = useState<string | null>(null);
  const [walletExists, setWalletExists] = useState<boolean | null>(null);

  // Check if wallet exists when connected
  useEffect(() => {
    if (publicKey) {
      checkWalletExists();
    }
  }, [publicKey]);

  const checkWalletExists = async () => {
    if (!publicKey) {
      return;
    }

    try {
      const result = await authAPI.checkWalletExists(publicKey.toString());
      setWalletExists(result.exists);
      
      // If wallet exists, immediately proceed with linking
      if (result.exists) {
        await handleLinkWallet();
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      setError('Failed to verify wallet. Please try again.');
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet. Please try again.');
      Alert.alert(
        'Connection Error',
        'Failed to connect wallet. Please try again.',
      );
    }
  };

  const handleLinkWallet = async () => {
    if (!publicKey) {
      return;
    }

    try {
      setError(null);
      
      const walletAddress = publicKey.toString();
      
      // Step 1: Get authentication challenge from backend
      console.log('🔍 Onboarding: Getting wallet challenge for linking...');
      const challengeResponse = await authAPI.getWalletChallenge(walletAddress);
      console.log('🔍 Onboarding: Got challenge:', challengeResponse.message);

      // Step 2: Sign the challenge message
      console.log('🔍 Onboarding: Signing challenge message...');
      const signature = await transact(async wallet => {
        const messageBytes = new TextEncoder().encode(challengeResponse.message);
        const signResult = await wallet.signMessages({
          payloads: [
            {
              message: messageBytes as any,
            },
          ],
        });

        // Convert signature to base64
        const signatureBytes = signResult.signed_payloads[0];
        return btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
      });

      // Step 3: Complete wallet authentication (linking to existing email account)
      console.log('🔍 Onboarding: Verifying signature and linking wallet...');
      await completeWalletAuth(walletAddress, signature, challengeResponse.nonce);
      
      console.log('✅ Onboarding: Wallet linking successful');
      onWalletConnected();
    } catch (error) {
      console.error('🚨 Onboarding: Wallet linking failed:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Wallet linking failed. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={isDark ? require('../../../assets/beam-banner-dark-mode.png') : require('../../../assets/beam-banner.png')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.content}>
            {/* Main Content Card */}
            <View style={styles.cardContainer}>
              <View style={styles.textContent}>
                <Text style={styles.title}>Connect</Text>
                <Text style={styles.description}>
                  A Solana wallet is required to verify your identity and use most features
                </Text>
              </View>

              {/* Wallet Options */}
              <View style={styles.optionsContainer}>
              {!publicKey ? (
                // Connect wallet options
                <>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleConnect}
                    disabled={connecting}
                    activeOpacity={0.8}>
                    <View style={styles.optionContent}>
                      <Wallet size={32} color="#3b82f6" />
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>Connect Your Own Wallet</Text>
                        <Text style={styles.optionDescription}>
                          Use your existing Solana Mobile wallet
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#6b7280" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, styles.disabledOption]}
                    disabled={true}
                    activeOpacity={0.6}>
                    <View style={styles.optionContent}>
                      <Wallet size={32} color="#9ca3af" />
                      <View style={styles.optionText}>
                        <Text style={[styles.optionTitle, styles.disabledText]}>
                          Beam Managed Wallet
                        </Text>
                        <Text style={[styles.optionDescription, styles.disabledText]}>
                          Coming soon - secure wallet managed by Beam
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                // Wallet connected, show status
                <View style={styles.connectedContainer}>
                  <View style={styles.walletInfo}>
                    <Wallet size={24} color="#10b981" />
                    <Text style={styles.walletAddress}>
                      {publicKey.toString().slice(0, 8)}...
                      {publicKey.toString().slice(-8)}
                    </Text>
                  </View>
                  
                  {walletExists === null ? (
                    <Text style={styles.statusText}>Verifying wallet...</Text>
                  ) : walletExists ? (
                    <Text style={styles.statusText}>Linking existing wallet...</Text>
                  ) : (
                    <Text style={styles.statusText}>Wallet connected successfully!</Text>
                  )}
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              </View>

              {/* Skip Button */}
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    backdropFilter: 'blur(8px)',
    maxWidth: 400,
    width: '100%',
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledOption: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    opacity: 0.7,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  disabledText: {
    color: '#9ca3af',
  },
  connectedContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter',
    textDecorationLine: 'underline',
  },
});