import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Wallet,
  Copy,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {Clipboard} from 'react-native';
import {authAPI} from '../../services/api/auth';

interface WalletSettingsScreenProps {
  navigation: any;
}

export default function WalletSettingsScreen({navigation}: WalletSettingsScreenProps) {
  const {colors} = useThemeStore();
  const {user, updateProfile} = useAuthStore();
  const {currentProfile, updateCurrentProfile} = useProfileStore();
  const {
    connected,
    connecting,
    publicKey,
    walletLabel,
    balance,
    connect,
    disconnect,
    fetchBalance,
    signMessage,
  } = useWalletStore();
  
  const [error, setError] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  
  // Use the primary wallet address from profile/user data, not the connected wallet
  const primaryWalletAddress = currentProfile?.primaryWalletAddress || 
                              currentProfile?.userWallet ||
                              user?.primaryWalletAddress ||
                              user?.walletAddress;
                              
  const walletAddress = publicKey?.toString();
  
  console.log('🔍 WalletSettings: Wallet addresses:');
  console.log('  - primaryWalletAddress from profile:', currentProfile?.primaryWalletAddress);
  console.log('  - primaryWalletAddress from user:', user?.primaryWalletAddress);
  console.log('  - connected walletAddress:', walletAddress);
  console.log('  - final primaryWalletAddress:', primaryWalletAddress);
  console.log('🔍 WalletSettings: Store data:');
  console.log('  - currentProfile exists:', !!currentProfile);
  console.log('  - user exists:', !!user);
  console.log('  - currentProfile.primaryWalletAddress:', currentProfile?.primaryWalletAddress);
  console.log('  - user.primaryWalletAddress:', user?.primaryWalletAddress);
  console.log('🔍 WalletSettings: Should show Connect button?', !primaryWalletAddress);


  const handleConnectWallet = useCallback(async () => {
    console.log('🔍 WalletSettings: Starting primary wallet linking flow');
    setError(null);
    setIsLinking(true);
    
    try {
      // Step 1: Connect to wallet if not already connected
      if (!connected) {
        console.log('🔍 WalletSettings: Connecting to wallet first...');
        await connect();
        console.log('✅ WalletSettings: Wallet connected successfully');
      }
      
      // Step 2: Start wallet linking process
      const walletAddress = publicKey?.toString();
      if (!walletAddress) {
        throw new Error('No wallet address available');
      }
      
      console.log('🔍 WalletSettings: Starting wallet link for:', walletAddress);
      const linkResponse = await authAPI.linkPrimaryWallet(walletAddress);
      
      if (!linkResponse.success) {
        throw new Error(linkResponse.message || 'Failed to start wallet linking');
      }
      
      const { requestId, message } = linkResponse;
      console.log('🔍 WalletSettings: Got challenge message, signing...');
      
      // Step 3: Sign the challenge message
      const messageBytes = new TextEncoder().encode(message);
      const signedMessage = await signMessage(messageBytes);
      
      if (!signedMessage) {
        throw new Error('Failed to sign message');
      }
      
      // Convert signature to base64
      const signature = Buffer.from(signedMessage).toString('base64');
      console.log('🔍 WalletSettings: Message signed, verifying...');
      
      // Step 4: Verify the signature
      const verifyResponse = await authAPI.verifyPrimaryWalletLink(requestId, signature);
      
      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || 'Failed to verify wallet ownership');
      }
      
      console.log('✅ WalletSettings: Primary wallet linked successfully!');
      
      // Update local state with the new primary wallet
      if (verifyResponse.user) {
        // Update profile store with the new primary wallet
        updateCurrentProfile({
          primaryWalletAddress: walletAddress
        });
      }
      
      // Fetch balance for the newly linked wallet
      await fetchBalance();
      
      // Show success feedback
      Alert.alert(
        'Success',
        'Your wallet has been successfully linked as your primary wallet address.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      const error = err as Error;
      console.error('❌ WalletSettings: Failed to link primary wallet:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to link wallet';
      if (error.message.includes('cancelled')) {
        errorMessage = 'Wallet linking cancelled';
      } else if (error.message.includes('already linked')) {
        errorMessage = 'This wallet is already linked to another account';
      } else if (error.message.includes('sign')) {
        errorMessage = 'Failed to sign verification message';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLinking(false);
    }
  }, [connect, connected, publicKey, signMessage, fetchBalance, updateCurrentProfile]);

  const handleDisconnectWallet = useCallback(async () => {
    console.log('🔍 WalletSettings: Disconnecting wallet');
    setError(null);
    
    try {
      await disconnect();
      console.log('✅ WalletSettings: Wallet disconnected successfully');
    } catch (err) {
      console.error('🚨 WalletSettings: Wallet disconnect failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
    }
  }, [disconnect]);

  const handleCopyAddress = useCallback(async () => {
    if (!primaryWalletAddress) return;
    
    try {
      await Clipboard.setString(primaryWalletAddress);
      setShowCopySuccess(true);
      console.log('✅ WalletSettings: Primary wallet address copied to clipboard');
      
      // Hide success indicator after 2 seconds
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('🚨 WalletSettings: Failed to copy address:', err);
      Alert.alert(
        'Copy Failed',
        'Unable to copy address to clipboard.',
        [{text: 'OK'}]
      );
    }
  }, [primaryWalletAddress]);
  
  // Load balance when wallet is connected
  useEffect(() => {
    if (connected && !balance) {
      fetchBalance();
    }
  }, [connected, balance, fetchBalance]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      marginBottom: 24,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 16,
    },
    walletPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    walletIconContainer: {
      marginRight: 12,
    },
    walletInfo: {
      flex: 1,
    },
    walletStatus: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginBottom: 4,
    },
    walletStatusConnected: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    walletCaption: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    walletActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    connectButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      width: 120,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    connectButtonDisabled: {
      opacity: 0.6,
    },
    copyButtonSuccess: {
      backgroundColor: colors.success + '20',
    },
    copyButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.muted,
    },
    disconnectButton: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disconnectButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    infoBanner: {
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    infoBannerText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      flex: 1,
    },
    errorBanner: {
      backgroundColor: colors.destructive + '15',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    errorBannerText: {
      fontSize: 14,
      color: colors.destructive,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      flex: 1,
    },
    spacer: {
      height: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Wallet Settings"
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Wallet Settings</Text>
            <Text style={styles.cardSubtitle}>
              Manage your primary wallet and linked accounts
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorBanner}>
              <View style={styles.infoIcon}>
                <AlertCircle size={20} color={colors.destructive} />
              </View>
              <Text style={styles.errorBannerText}>
                {error}
              </Text>
            </View>
          )}

          {/* Primary Wallet */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Primary Wallet</Text>
            
            <View style={styles.walletPill}>
              <View style={styles.walletIconContainer}>
                <Wallet 
                  size={20} 
                  color={connected ? colors.primary : colors.mutedForeground} 
                />
              </View>
              
              <View style={styles.walletInfo}>
                {primaryWalletAddress ? (
                  <>
                    <Text style={styles.walletStatusConnected}>
                      {truncateAddress(primaryWalletAddress)}
                    </Text>
                    <Text style={styles.walletCaption}>
                      {connected ? `Connected • ${balance !== null ? `${balance.toFixed(2)} SOL` : 'Loading balance...'}` : 'Primary wallet on file'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.walletStatus}>
                      {connecting ? 'Connecting...' : isLinking ? 'Linking wallet...' : 'No primary wallet on file'}
                    </Text>
                    <Text style={styles.walletCaption}>
                      {connecting 
                        ? 'Please check your wallet app to authorize the connection'
                        : isLinking
                        ? 'Signing verification message...'
                        : 'Connect your wallet to set as primary wallet'
                      }
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.walletActions}>
                {primaryWalletAddress ? (
                  // If primary wallet exists, only show copy button
                  <Pressable 
                    style={[styles.copyButton, showCopySuccess && styles.copyButtonSuccess]}
                    onPress={handleCopyAddress}>
                    {showCopySuccess ? (
                      <CheckCircle size={16} color={colors.success} />
                    ) : (
                      <Copy size={16} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                ) : (
                  // If no primary wallet, show connect/disconnect buttons
                  <>
                    {connected ? (
                      <Pressable 
                        style={styles.disconnectButton}
                        onPress={handleDisconnectWallet}
                        disabled={connecting}>
                        <Text style={styles.disconnectButtonText}>
                          Disconnect
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable 
                        style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
                        onPress={handleConnectWallet}
                        disabled={connecting}>
                        {connecting ? (
                          <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                          <Text style={styles.connectButtonText}>
                            Connect
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Linked Wallets */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Linked Wallets</Text>
            
            <View style={styles.infoBanner}>
              <View style={styles.infoIcon}>
                <AlertCircle size={20} color={colors.primary} />
              </View>
              <Text style={styles.infoBannerText}>
                Advanced linked-wallet management is only available on the desktop site — visit Beam.fun on desktop to add or remove wallets.
              </Text>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={styles.spacer} />
        </View>

        {/* Add some bottom spacing */}
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}