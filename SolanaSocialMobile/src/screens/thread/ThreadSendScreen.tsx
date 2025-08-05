import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Zap,
  Clock,
  AlertCircle,
  Send,
  Wallet,
} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useWalletStore} from '../../store/wallet';
import {useWalletConnection} from '../../hooks/useWalletConnection';
import {socialAPI} from '../../services/api/social';
import {LoadingOverlay} from '../../components/ui/LoadingOverlay';

interface ThreadSendScreenProps {
  navigation: any;
  route: {
    params: {
      threadPosts: Array<{
        id: string;
        content: string;
        order: number;
      }>;
      threadTitle?: string;
    };
  };
}

export default function ThreadSendScreen({navigation, route}: ThreadSendScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {blockchainService} = useWalletStore();
  const walletConnection = useWalletConnection();
  
  const {threadPosts, threadTitle} = route.params;
  const [sending, setSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<'now' | 'cooldown' | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  const { 
    publicKey, 
    isPrimaryWalletConnected, 
    getWalletWarningType,
  } = walletConnection;

  // Check wallet balance when primary wallet is properly connected
  useEffect(() => {
    const checkWalletBalance = async () => {
      if (!isPrimaryWalletConnected || !publicKey) {
        setWalletBalance(null);
        return;
      }

      setBalanceLoading(true);
      
      try {
        const balanceData = await socialAPI.getWalletBalance(publicKey.toString());
        setWalletBalance(balanceData.balanceSOL);
      } catch (error) {
        console.error('Failed to check wallet balance:', error);
        setWalletBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    checkWalletBalance();
  }, [isPrimaryWalletConnected, publicKey]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSendNow = useCallback(async () => {
    // Check wallet connection first
    if (!isPrimaryWalletConnected || !publicKey) {
      Alert.alert(
        'Wallet Not Connected',
        'Please connect your wallet to send posts.',
        [{text: 'OK'}]
      );
      return;
    }

    setSending(true);
    setSendingStatus('Preparing to send thread...');
    
    try {
      let previousTransactionSignature: string | null = null;
      
      for (let i = 0; i < threadPosts.length; i++) {
        const post = threadPosts[i];
        setSendingStatus(`Sending post ${i + 1} of ${threadPosts.length}...`);
        
        // Add thread markdown to all posts except the first
        let content = post.content;
        if (previousTransactionSignature && i > 0) {
          content = `<<thread>>${previousTransactionSignature}<</thread>>\n\n${content}`;
        }
        
        // Create the post using blockchain service
        console.log('🚀 Creating blockchain post for thread...');
        const result = await blockchainService.createPost({
          userWallet: publicKey.toString(),
          message: content.trim(),
          // TODO: Add media support when available
          // mediaUrls: post.mediaUrls,
        });
        
        if (!result || !result.signature) {
          throw new Error(`Failed to send post ${i + 1}`);
        }
        
        previousTransactionSignature = result.signature;
        console.log(`✅ Post ${i + 1} sent with signature: ${result.signature}`);
        
        // Small delay between posts even in "send now" mode to ensure proper ordering
        if (i < threadPosts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }
      
      setSendingStatus('Thread sent successfully!');
      setTimeout(() => {
        navigation.navigate('FeedHome');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error sending thread:', error);
      
      let errorMessage = 'Failed to send thread. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient SOL balance for transaction fees.';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Transaction timed out. Please try again.';
        }
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{text: 'OK', onPress: () => navigation.goBack()}]
      );
    } finally {
      setSending(false);
    }
  }, [threadPosts, isPrimaryWalletConnected, publicKey, blockchainService, navigation]);

  const handleSendWithCooldown = useCallback(async () => {
    // Check wallet connection first
    if (!isPrimaryWalletConnected || !publicKey) {
      Alert.alert(
        'Wallet Not Connected',
        'Please connect your wallet to send posts.',
        [{text: 'OK'}]
      );
      return;
    }

    setSending(true);
    setSendingStatus('Preparing to send thread with cooldowns...');
    
    try {
      let previousTransactionSignature: string | null = null;
      
      for (let i = 0; i < threadPosts.length; i++) {
        const post = threadPosts[i];
        setSendingStatus(`Sending post ${i + 1} of ${threadPosts.length}...`);
        
        // Add thread markdown to all posts except the first
        let content = post.content;
        if (previousTransactionSignature && i > 0) {
          content = `<<thread>>${previousTransactionSignature}<</thread>>\n\n${content}`;
        }
        
        // Create the post using blockchain service
        console.log('🚀 Creating blockchain post for thread (with cooldown)...');
        const result = await blockchainService.createPost({
          userWallet: publicKey.toString(),
          message: content.trim(),
          // TODO: Add media support when available
          // mediaUrls: post.mediaUrls,
        });
        
        if (!result || !result.signature) {
          throw new Error(`Failed to send post ${i + 1}`);
        }
        
        previousTransactionSignature = result.signature;
        console.log(`✅ Post ${i + 1} sent with signature: ${result.signature}`);
        
        // Wait 30 seconds between posts to avoid cooldown fees
        if (i < threadPosts.length - 1) {
          setSendingStatus(`Waiting for cooldown... (30 seconds)`);
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
        }
      }
      
      setSendingStatus('Thread sent successfully!');
      setTimeout(() => {
        navigation.navigate('FeedHome');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error sending thread:', error);
      
      let errorMessage = 'Failed to send thread. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient SOL balance for transaction fees.';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Transaction timed out. Please try again.';
        }
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{text: 'OK', onPress: () => navigation.goBack()}]
      );
    } finally {
      setSending(false);
    }
  }, [threadPosts, isPrimaryWalletConnected, publicKey, blockchainService, navigation]);

  const handleOptionSelect = useCallback((option: 'now' | 'cooldown') => {
    // Check if any warnings are active
    const warningType = getWalletWarningType();
    const hasWalletWarning = warningType === 'setup' || warningType === 'connect';
    const hasBalanceWarning = isPrimaryWalletConnected && walletBalance !== null && walletBalance < 0.001;
    
    if (hasWalletWarning || hasBalanceWarning) {
      return; // Don't proceed if there are warnings
    }
    
    setSelectedOption(option);
    
    if (option === 'now') {
      handleSendNow();
    } else {
      handleSendWithCooldown();
    }
  }, [handleSendNow, handleSendWithCooldown, getWalletWarningType, isPrimaryWalletConnected, walletBalance]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
      borderRadius: 8,
    },
    backButtonPressed: {
      backgroundColor: colors.muted,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    walletWarning: {
      backgroundColor: colors.warning + '15' || '#F59E0B15',
      borderWidth: 1,
      borderColor: colors.warning || '#F59E0B',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    walletWarningText: {
      color: colors.warning || '#F59E0B',
      fontSize: 14,
      flex: 1,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    infoSection: {
      marginBottom: 24,
    },
    infoTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    optionsContainer: {
      gap: 16,
    },
    optionCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionCardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    optionCardPressed: {
      backgroundColor: colors.muted,
      borderColor: colors.primary,
    },
    optionCardDisabled: {
      opacity: 0.5,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    optionIconNow: {
      backgroundColor: colors.primary + '20',
    },
    optionIconCooldown: {
      backgroundColor: colors.success + '20',
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    optionSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    optionDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      marginTop: 8,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.destructive + '10',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
    },
    warningIcon: {
      marginRight: 8,
      marginTop: 2,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      color: colors.destructive,
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
    },
    benefitContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.success + '10',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
    },
    benefitIcon: {
      marginRight: 8,
      marginTop: 2,
    },
    benefitText: {
      flex: 1,
      fontSize: 12,
      color: colors.success,
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
    },
  });

  // Helper to check if any warning boxes are active
  const hasActiveWarnings = () => {
    const warningType = getWalletWarningType();
    const hasWalletWarning = warningType === 'setup' || warningType === 'connect';
    const hasBalanceWarning = isPrimaryWalletConnected && walletBalance !== null && walletBalance < 0.001;
    
    return hasWalletWarning || hasBalanceWarning;
  };

  if (sending) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay
          isLoading={true}
          title="Sending Thread"
          subtitle={sendingStatus}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={handleBack}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Send Thread</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet warnings */}
        {getWalletWarningType() === 'setup' && (
          <View style={styles.walletWarning}>
            <Wallet size={20} color={colors.warning || '#F59E0B'} />
            <Text style={styles.walletWarningText}>
              You must set up a primary Solana wallet in order to send threads
            </Text>
          </View>
        )}

        {getWalletWarningType() === 'connect' && (
          <View style={styles.walletWarning}>
            <Wallet size={20} color={colors.warning || '#F59E0B'} />
            <Text style={styles.walletWarningText}>
              Please connect your primary Solana wallet to send threads
            </Text>
          </View>
        )}

        {isPrimaryWalletConnected && walletBalance !== null && walletBalance < 0.001 && (
          <Pressable 
            style={styles.walletWarning}
            onPress={() => navigation.navigate('BuySOL')}>
            <AlertCircle size={20} color={colors.warning || '#F59E0B'} />
            <Text style={styles.walletWarningText}>
              No SOL. Please purchase more.
            </Text>
          </Pressable>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>
            {threadTitle || `Thread with ${threadPosts.length} posts`}
          </Text>
          <Text style={styles.infoText}>
            Choose how you'd like to send your thread. Each option has different benefits and considerations.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Send All Now Option */}
          <Pressable
            style={({pressed}) => [
              styles.optionCard,
              selectedOption === 'now' && styles.optionCardSelected,
              pressed && !hasActiveWarnings() && styles.optionCardPressed,
              hasActiveWarnings() && styles.optionCardDisabled,
            ]}
            onPress={() => handleOptionSelect('now')}
            disabled={hasActiveWarnings()}>
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, styles.optionIconNow]}>
                <Zap size={24} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Send All Now</Text>
                <Text style={styles.optionSubtitle}>Post all at once</Text>
              </View>
            </View>
            
            <Text style={styles.optionDescription}>
              Posts your entire thread immediately with minimal delay between posts.
            </Text>

            <View style={styles.warningContainer}>
              <AlertCircle size={16} color={colors.destructive} style={styles.warningIcon} />
              <Text style={styles.warningText}>
                May incur cooldown fees if posting multiple times within 69 slots (~30 seconds)
              </Text>
            </View>
          </Pressable>

          {/* Wait for Cooldowns Option */}
          <Pressable
            style={({pressed}) => [
              styles.optionCard,
              selectedOption === 'cooldown' && styles.optionCardSelected,
              pressed && !hasActiveWarnings() && styles.optionCardPressed,
              hasActiveWarnings() && styles.optionCardDisabled,
            ]}
            onPress={() => handleOptionSelect('cooldown')}
            disabled={hasActiveWarnings()}>
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, styles.optionIconCooldown]}>
                <Clock size={24} color={colors.success} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Wait for Cooldowns</Text>
                <Text style={styles.optionSubtitle}>Automatically spaced posts</Text>
              </View>
            </View>
            
            <Text style={styles.optionDescription}>
              Posts your thread with 30-second intervals to avoid cooldown fees.
            </Text>

            <View style={styles.benefitContainer}>
              <Send size={16} color={colors.success} style={styles.benefitIcon} />
              <Text style={styles.benefitText}>
                No cooldown fees - posts are properly spaced to avoid additional charges
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}