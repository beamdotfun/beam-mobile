import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import {ChevronRight, Coins, DollarSign} from 'lucide-react-native';

import {useWalletStore} from '../../../store/wallet';
import {useThemeStore} from '../../../store/themeStore';
import {BlockchainTransactionService} from '../../../services/blockchain/transactionService';
import {API_CONFIG} from '../../../config/api';
import {SolanaMobileWalletAdapter} from '../../../services/wallet/adapter';

interface DepositScreenProps {
  onCreateAccount: () => void;
  onSkip: () => void;
}

export const DepositScreen: React.FC<DepositScreenProps> = ({
  onCreateAccount,
  onSkip,
}) => {
  const {publicKey} = useWalletStore();
  const {isDark} = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  // Initialize blockchain service
  const walletAdapter = new SolanaMobileWalletAdapter();
  const blockchainService = new BlockchainTransactionService(walletAdapter, API_CONFIG.BASE_URL);

  useEffect(() => {
    if (publicKey) {
      estimateCreateAccountFee();
    }
  }, [publicKey]);

  const estimateCreateAccountFee = async () => {
    if (!publicKey) return;

    try {
      // Estimate fee for create-user transaction
      // Since there's no specific fee estimation for create-user, we'll use a reasonable estimate
      setEstimatedFee(0.002); // Approximately 0.002 SOL based on typical transaction costs
    } catch (error) {
      console.warn('Failed to estimate fee:', error);
      setEstimatedFee(0.002); // Fallback estimate
    }
  };

  const handleCreateAccount = async () => {
    if (!publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Creating blockchain account for user...');
      
      // Create user account on blockchain
      const result = await blockchainService.createUser({
        userWallet: publicKey.toString(),
        computeUnits: 400000,
        priorityFee: 1000, // Slightly higher priority fee for smoother experience
      });

      console.log('✅ User account created successfully:', result.signature);
      
      Alert.alert(
        'Account Created!',
        `Your blockchain account has been created successfully. Transaction: ${result.signature.slice(0, 8)}...`,
        [
          {
            text: 'Continue',
            onPress: onCreateAccount,
          },
        ]
      );
    } catch (error) {
      console.error('❌ Failed to create user account:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.'
      );

      Alert.alert(
        'Account Creation Failed',
        'There was an error creating your blockchain account. You can skip this step and create your account later from the settings.',
        [
          {
            text: 'Try Again',
            style: 'default',
            onPress: () => setError(null),
          },
          {
            text: 'Skip for Now',
            style: 'cancel',
            onPress: onSkip,
          },
        ]
      );
    } finally {
      setLoading(false);
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
              <View style={styles.headerContainer}>
                <View style={styles.iconContainer}>
                  <Coins size={48} color="#3b82f6" />
                </View>
                <Text style={styles.title}>Reserve your space</Text>
                <Text style={styles.subtitle}>
                  Make a one-time, refundable deposit to finish setting up your account
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>What this does:</Text>
                <Text style={styles.infoText}>
                  • Creates your permanent profile on the Solana blockchain
                </Text>
                <Text style={styles.infoText}>
                  • Reserves your username and social identity
                </Text>
                <Text style={styles.infoText}>
                  • Enables all blockchain features (posting, voting, tipping)
                </Text>
                <Text style={styles.infoText}>
                  • Deposit is refundable if you delete your account
                </Text>
                
                {estimatedFee && (
                  <View style={styles.feeContainer}>
                    <DollarSign size={16} color="#3b82f6" />
                    <Text style={styles.feeText}>
                      Estimated fee: ~{estimatedFee} SOL
                    </Text>
                  </View>
                )}
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledButton]}
                onPress={handleCreateAccount}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.createButtonText}>Create Account</Text>
                    <View style={styles.iconSpacer} />
                    <ChevronRight size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                disabled={loading}>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  feeText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 6,
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
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  iconSpacer: {
    width: 8,
  },
  skipButton: {
    alignItems: 'center',
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