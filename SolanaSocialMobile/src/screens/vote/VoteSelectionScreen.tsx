import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Settings } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useWalletStore } from '../../store/wallet';
import { useAuthStore } from '../../store/auth';
import { useProfileStore } from '../../store/profileStore';
import { useVoting } from '../../hooks/useBlockchainTransactions';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { FeedStackScreenProps } from '../../types/navigation';

type VoteSelectionScreenProps = FeedStackScreenProps<'VoteSelection'>;

export default function VoteSelectionScreen({ navigation, route }: VoteSelectionScreenProps) {
  const { targetWallet, targetName } = route.params;
  const { colors } = useThemeStore();
  const { connected, connecting, connect } = useWalletStore();
  const { user } = useAuthStore();
  const { currentProfile } = useProfileStore();
  const { upvote, downvote, loading: votingLoading } = useVoting();
  const [selectedVote, setSelectedVote] = useState<'upvote' | 'downvote' | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const walletConnection = useWalletConnection();

  // Use the centralized wallet connection logic
  const { 
    publicKey, 
    walletWarningType, 
    showWalletWarning,
    isPrimaryWalletConnected 
  } = walletConnection;
  const canVote = !showWalletWarning;
  const isConnecting = connecting;

  // Auto-dismiss status messages after 10 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpvote = useCallback(async () => {
    if (votingLoading || !canVote) return;
    
    setSelectedVote('upvote');
    setStatusMessage(null); // Clear any previous status messages
    
    try {
      console.log('🔄 Starting upvote transaction...');
      const result = await upvote(targetWallet);
      
      setStatusMessage({
        type: 'success',
        message: `Upvote recorded successfully! Transaction: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`
      });
      
      console.log('🎉 Profile upvote successful:', result.signature);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Profile upvote failed:', error);
      setSelectedVote(null);
      
      let errorMessage = 'Failed to record upvote. Please try again.';
      let messageType: 'error' | 'info' = 'error';
      
      if (error.message?.includes('at least one post')) {
        errorMessage = 'You must create at least one post before you can vote';
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled') || error.message?.includes('User rejected')) {
        errorMessage = 'Voting process not completed';
        messageType = 'info';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance to complete voting';
      } else if (error.message?.includes('build')) {
        errorMessage = 'Failed to prepare vote transaction. Please try again.';
      } else if (error.message?.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet and try again.';
      }
      
      setStatusMessage({
        type: messageType,
        message: errorMessage
      });
    }
  }, [upvote, targetWallet, targetName, navigation, votingLoading, canVote]);

  const handleDownvote = useCallback(async () => {
    if (votingLoading || !canVote) return;
    
    setSelectedVote('downvote');
    setStatusMessage(null); // Clear any previous status messages
    
    try {
      console.log('🔄 Starting downvote transaction...');
      const result = await downvote(targetWallet);
      
      setStatusMessage({
        type: 'success',
        message: `Downvote recorded successfully! Transaction: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`
      });
      
      console.log('🎉 Profile downvote successful:', result.signature);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Profile downvote failed:', error);
      setSelectedVote(null);
      
      let errorMessage = 'Failed to record downvote. Please try again.';
      let messageType: 'error' | 'info' = 'error';
      
      if (error.message?.includes('at least one post')) {
        errorMessage = 'You must create at least one post before you can vote';
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled') || error.message?.includes('User rejected')) {
        errorMessage = 'Voting process not completed';
        messageType = 'info';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance to complete voting';
      } else if (error.message?.includes('build')) {
        errorMessage = 'Failed to prepare vote transaction. Please try again.';
      } else if (error.message?.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet and try again.';
      }
      
      setStatusMessage({
        type: messageType,
        message: errorMessage
      });
    }
  }, [downvote, targetWallet, targetName, navigation, votingLoading, canVote]);

  const handleWalletSettings = useCallback(() => {
    // Navigate to wallet settings
    navigation.navigate('WalletSettings');
  }, [navigation]);

  const handleConnectWallet = useCallback(async () => {
    try {
      console.log('📱 Connect wallet button pressed from vote screen');
      await connect();
      console.log('✅ Wallet connected successfully from vote screen');
    } catch (error: any) {
      console.error('❌ Wallet connection failed from vote screen:', error);
      
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.message?.includes('rejected')) {
        errorMessage = 'Wallet connection was rejected. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Wallet connection timed out. Please try again.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'No compatible wallet found. Please install a Solana wallet app.';
      }
      
      Alert.alert('Connection Failed', errorMessage);
    }
  }, [connect]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      padding: 8,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    description: {
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      lineHeight: 24,
      marginBottom: 8,
    },
    subDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      marginBottom: 32,
    },
    voteOptionsContainer: {
      gap: 16,
    },
    voteOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: colors.border,
    },
    voteOptionPressed: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    voteOptionDisabled: {
      opacity: 0.5,
    },
    voteOptionSelected: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    voteIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    upvoteIcon: {
      backgroundColor: colors.success + '15',
    },
    downvoteIcon: {
      backgroundColor: colors.destructive + '15',
    },
    voteContent: {
      flex: 1,
    },
    voteTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    voteSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    disclaimer: {
      marginTop: 32,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    disclaimerText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 18,
    },
    loadingText: {
      fontSize: 16,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
      marginTop: 8,
    },
    walletInfoCard: {
      backgroundColor: colors.warning + '15',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.warning + '30',
    },
    walletInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    walletInfoText: {
      fontSize: 14,
      color: colors.warning,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      flex: 1,
    },
    walletActionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    walletActionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    walletActionButtonDisabled: {
      opacity: 0.6,
    },
    statusMessage: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    statusMessageSuccess: {
      borderColor: colors.success,
      backgroundColor: colors.success + '10', // 10% opacity
    },
    statusMessageError: {
      borderColor: colors.destructive,
      backgroundColor: colors.destructive + '10', // 10% opacity
    },
    statusMessageInfo: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10', // 10% opacity
    },
    statusMessageText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      textAlign: 'center',
    },
    statusMessageTextSuccess: {
      color: colors.success,
    },
    statusMessageTextError: {
      color: colors.destructive,
    },
    statusMessageTextInfo: {
      color: colors.primary,
    },
  });

  const isLoading = votingLoading || selectedVote !== null || isConnecting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            onPress={handleBack} 
            style={styles.backButton}
            disabled={isLoading}
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Vote on User</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Description */}
        <Text style={styles.description}>
          Vote on {targetName || 'this user'}
        </Text>
        <Text style={styles.subDescription}>
          You're voting on {targetName ? `${targetName}'s` : 'this user\'s'} overall profile and contributions to the platform. This will affect their reputation score and be recorded on the Solana blockchain.
        </Text>

        {/* Status Message */}
        {statusMessage && (
          <View style={[
            styles.statusMessage,
            statusMessage.type === 'success' && styles.statusMessageSuccess,
            statusMessage.type === 'error' && styles.statusMessageError,
            statusMessage.type === 'info' && styles.statusMessageInfo,
          ]}>
            <Text style={[
              styles.statusMessageText,
              statusMessage.type === 'success' && styles.statusMessageTextSuccess,
              statusMessage.type === 'error' && styles.statusMessageTextError,
              statusMessage.type === 'info' && styles.statusMessageTextInfo,
            ]}>
              {statusMessage.message}
            </Text>
          </View>
        )}

        {/* Wallet Connection Info - Show when wallet issues exist */}
        {showWalletWarning && (
          <View style={styles.walletInfoCard}>
            <View style={styles.walletInfoRow}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.walletInfoText}>
                {walletWarningType === 'setup' ? 'Set up your wallet to vote' : 'Connect your wallet to vote'}
              </Text>
            </View>
            {walletWarningType === 'setup' ? (
              <Pressable 
                style={styles.walletActionButton}
                onPress={handleWalletSettings}
              >
                <Settings size={16} color={colors.primaryForeground} />
                <Text style={styles.walletActionButtonText}>Wallet Settings</Text>
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.walletActionButton, isConnecting && styles.walletActionButtonDisabled]}
                onPress={handleConnectWallet}
                disabled={isConnecting}
              >
                <Text style={styles.walletActionButtonText}>
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Loading indicator when transaction is processing */}
        {isLoading && (
          <Text style={styles.loadingText}>
            {selectedVote === 'upvote' ? 'Processing upvote...' : 'Processing downvote...'}
          </Text>
        )}

        {/* Vote Options */}
        <View style={styles.voteOptionsContainer}>
          {/* Upvote Option */}
          <Pressable
            style={({ pressed }) => [
              styles.voteOption,
              pressed && styles.voteOptionPressed,
              (isLoading || !canVote) && styles.voteOptionDisabled,
              selectedVote === 'upvote' && styles.voteOptionSelected,
            ]}
            onPress={handleUpvote}
            disabled={isLoading || !canVote}
          >
            <View style={[styles.voteIcon, styles.upvoteIcon]}>
              <ThumbsUp size={28} color={colors.success} />
            </View>
            <View style={styles.voteContent}>
              <Text style={styles.voteTitle}>Upvote</Text>
              <Text style={styles.voteSubtitle}>
                This user provides value and positive contributions to the community
              </Text>
            </View>
          </Pressable>

          {/* Downvote Option */}
          <Pressable
            style={({ pressed }) => [
              styles.voteOption,
              pressed && styles.voteOptionPressed,
              (isLoading || !canVote) && styles.voteOptionDisabled,
              selectedVote === 'downvote' && styles.voteOptionSelected,
            ]}
            onPress={handleDownvote}
            disabled={isLoading || !canVote}
          >
            <View style={[styles.voteIcon, styles.downvoteIcon]}>
              <ThumbsDown size={28} color={colors.destructive} />
            </View>
            <View style={styles.voteContent}>
              <Text style={styles.voteTitle}>Downvote</Text>
              <Text style={styles.voteSubtitle}>
                This user's behavior or content detracts from the community
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Votes are recorded on the Solana blockchain and will affect the user's reputation score. Transaction fees may apply and this action cannot be undone.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}