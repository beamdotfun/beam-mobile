import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share, MoreHorizontal, Send, ChevronDown, AlertTriangle } from 'lucide-react-native';
import { FeedSkeleton } from '../../components/loading/FeedSkeleton';
import { EnhancedErrorState } from '../../components/ui/EnhancedErrorState';
import { useEnhancedRefresh } from '../../hooks/useEnhancedRefresh';
import { Avatar } from '../../components/ui/avatar';
import { TokenPickerModal } from '../../components/tips/TokenPickerModal';
import { useThemeStore } from '../../store/themeStore';
import { useWalletStore } from '../../store/wallet';
import { useAuthStore } from '../../store/auth';
import { useProfileStore } from '../../store/profileStore';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { tipsAPI, TokenInfo } from '../../services/api/tips';
import { useTipping } from '../../hooks/useBlockchainTransactions';
import { FeedStackScreenProps } from '../../types/navigation';

const { width: screenWidth } = Dimensions.get('window');

type SendTipScreenProps = FeedStackScreenProps<'SendTip'>;

const QUICK_AMOUNTS = [1, 5, 10, 25]; // USD amounts

export default function SendTipScreen({ navigation, route }: SendTipScreenProps) {
  const { colors } = useThemeStore();
  const { connected, connecting, connect, balance } = useWalletStore();
  const { user } = useAuthStore();
  const { currentProfile } = useProfileStore();
  const { sendTip, loading: tippingLoading, error: tippingError, resetError } = useTipping();
  const { recipientWallet, recipientName, recipientAvatar } = route.params;
  const walletConnection = useWalletConnection();

  // Use the centralized wallet connection logic with balance checking
  const { 
    publicKey, 
    isPrimaryWalletConnected, 
    getWalletWarningType 
  } = walletConnection;

  const hasBalance = balance !== null && balance > 0;
  const walletWarningType = getWalletWarningType({ requireBalance: true, balance });
  const showWalletWarning = walletWarningType !== null;
  const canUseTipForm = !showWalletWarning;

  // State
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Load available tokens function
  const loadTokens = useCallback(async () => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    if (!refreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔍 SendTipScreen: Loading available tokens...');
      const tokens = await tipsAPI.getAvailableTokens(publicKey.toString());
      setAvailableTokens(tokens);
      
      // Auto-select SOL if available, otherwise select the first token
      const solToken = tokens.find(token => token.symbol === 'SOL' || token.isNative);
      if (solToken) {
        setSelectedToken(solToken);
      } else if (tokens.length > 0) {
        setSelectedToken(tokens[0]);
      }
      
      console.log('✅ SendTipScreen: Loaded', tokens.length, 'tokens');
    } catch (error: any) {
      console.error('❌ SendTipScreen: Failed to load tokens:', error);
      setError(error?.message || 'Failed to load available tokens');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [connected, publicKey, refreshing]);

  // Load available tokens on mount
  useEffect(() => {
    loadTokens();
  }, [connected, publicKey]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTokens();
  }, [loadTokens]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading || tippingLoading);
  }, [refreshing, loading, tippingLoading, handleRefreshStateChange]);

  // Handlers
  const handleBack = useCallback(() => {
    console.log('📝 SendTipScreen: Back button pressed');
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(() => {
    console.log('📝 SendTipScreen: Share button pressed');
    // TODO: Implement share functionality
  }, []);

  const handleMore = useCallback(() => {
    console.log('📝 SendTipScreen: More button pressed');
    // TODO: Implement more options
  }, []);

  const handleTokenSelect = useCallback(() => {
    console.log('📝 SendTipScreen: Token selector pressed');
    setShowTokenPicker(true);
  }, []);

  const handleTokenPicked = useCallback((token: TokenInfo) => {
    console.log('📝 SendTipScreen: Token selected:', token.symbol);
    setSelectedToken(token);
    setAmount(''); // Reset amount when changing tokens
  }, []);

  const handleCloseTokenPicker = useCallback(() => {
    setShowTokenPicker(false);
  }, []);

  const handleQuickAmount = useCallback((usdAmount: number) => {
    if (!selectedToken) return;
    
    console.log('📝 SendTipScreen: Quick amount selected:', usdAmount, 'USD');
    
    // Convert USD to token amount
    const tokenAmount = tipsAPI.usdToTokenAmount(
      usdAmount,
      selectedToken.usdPrice,
      selectedToken.decimals
    );
    
    const formattedAmount = tipsAPI.formatTokenAmount(tokenAmount, selectedToken.decimals);
    setAmount(formattedAmount);
  }, [selectedToken]);

  const handleAmountChange = useCallback((value: string) => {
    console.log('📝 SendTipScreen: Amount changed:', value);
    setAmount(value);
  }, []);

  const handleMessageChange = useCallback((value: string) => {
    console.log('📝 SendTipScreen: Message changed:', value.length, 'characters');
    setMessage(value);
  }, []);

  const handleSendTip = useCallback(async () => {
    if (!connected || !publicKey || !selectedToken || !isValidAmount) {
      Alert.alert('Error', 'Please ensure wallet is connected and amount is valid');
      return;
    }

    console.log('📝 SendTipScreen: Send tip pressed');
    console.log('Recipient:', recipientWallet);
    console.log('Token:', selectedToken?.symbol);
    console.log('Amount:', amount);
    console.log('Message:', message);
    
    // Show confirmation dialog
    Alert.alert(
      'Send Tip',
      `Send ${amount} ${selectedToken?.symbol} to ${recipientName || recipientWallet}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async () => {
            try {
              resetError();
              console.log('✅ SendTipScreen: Tip confirmed, starting blockchain transaction...');
              
              // Convert amount to token's base units (considering token decimals)
              const amountInBaseUnits = Math.floor(parseFloat(amount) * Math.pow(10, selectedToken.decimals));
              
              // Determine if this is SOL or an SPL token
              const tokenMint = selectedToken.isNative ? undefined : selectedToken.mint;
              
              // Send tip using the hook
              const result = await sendTip(
                recipientWallet,
                amountInBaseUnits,
                tokenMint,
                selectedToken.symbol,
                message.trim() || undefined,
                'user',
                recipientWallet
              );
              
              // Show success message
              Alert.alert(
                'Tip Sent Successfully!',
                `Your tip of ${amount} ${selectedToken.symbol} has been sent to ${recipientName || recipientWallet}.\n\nTransaction: ${result.signature}`,
                [
                  {
                    text: 'Done',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
              
              console.log('🎉 Tip transaction completed:', result.signature);
              
            } catch (error: any) {
              console.error('❌ SendTipScreen: Tip transaction failed:', error);
              
              // Handle specific error types
              let errorMessage = `Failed to send ${selectedToken.symbol} tip. Please try again.`;
              
              if (error.message?.includes('insufficient')) {
                errorMessage = `Insufficient ${selectedToken.symbol} balance to complete this tip.`;
              } else if (error.message?.includes('rejected')) {
                errorMessage = 'Transaction was rejected. Please try again.';
              } else if (error.message?.includes('timeout')) {
                errorMessage = 'Transaction timed out. Please check your network connection.';
              } else if (error.message?.includes('build')) {
                errorMessage = `Failed to prepare ${selectedToken.symbol} transaction. Please try again.`;
              } else if (error.message?.includes('Wallet not connected')) {
                errorMessage = 'Please connect your wallet and try again.';
              } else if (error.message?.includes('must be greater than 0')) {
                errorMessage = `${selectedToken.symbol} tip amount must be greater than 0.`;
              } else if (error.message?.includes('token account')) {
                errorMessage = `Unable to find ${selectedToken.symbol} token account. Please try again.`;
              } else if (error.message?.includes('mint')) {
                errorMessage = `Invalid ${selectedToken.symbol} token. Please select a different token.`;
              }
              
              Alert.alert('Transaction Failed', errorMessage);
            }
          }
        },
      ]
    );
  }, [recipientWallet, recipientName, selectedToken, amount, message, connected, publicKey, isValidAmount, navigation, sendTip, resetError]);

  // Validation
  const numericAmount = parseFloat(amount) || 0;
  const maxAmount = selectedToken ? selectedToken.amount / Math.pow(10, selectedToken.decimals) : 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= maxAmount;
  
  // Use tipping loading state for button
  const isTransactionLoading = tippingLoading || loading;

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
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerButton: {
      padding: 8,
    },
    subtitle: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 32, // Space for bottom nav bar
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
      marginTop: 16,
    },
    sectionHeaderFirst: {
      marginTop: 0,
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionCaption: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    recipientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    recipientInfo: {
      flex: 1,
    },
    recipientName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    recipientWallet: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    tokenSelector: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    tokenSelectorPressed: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    tokenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tokenLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    tokenIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
    },
    tokenInfo: {
      flex: 1,
    },
    tokenName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    tokenRight: {
      alignItems: 'flex-end',
    },
    tokenBalance: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      textAlign: 'right',
      maxWidth: 120,
      flexShrink: 1,
    },
    tokenUsdValue: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'right',
      marginTop: 2,
    },
    quickAmounts: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    quickAmountPill: {
      backgroundColor: colors.muted,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    quickAmountText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    amountInput: {
      height: 44,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: 16,
      paddingRight: 60, // Leave space for the token symbol
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      textAlign: 'right',
    },
    amountInputContainer: {
      position: 'relative',
    },
    amountLabel: {
      position: 'absolute',
      right: 16,
      top: 14,
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      pointerEvents: 'none',
    },
    messageInput: {
      height: 120,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      textAlignVertical: 'top',
    },
    messageInputContainer: {
      position: 'relative',
    },
    characterCounter: {
      position: 'absolute',
      bottom: 12,
      right: 16,
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    bottomContainer: {
      paddingTop: 24,
      paddingBottom: 16,
    },
    sendButton: {
      backgroundColor: colors.primary,
      height: 48,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    footerCaption: {
      textAlign: 'center',
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    walletInfoCard: {
      backgroundColor: colors.warning + '15',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      marginBottom: 16,
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
    connectButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
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
    tokenSelectorDisabled: {
      opacity: 0.5,
    },
    disabledText: {
      color: colors.mutedForeground,
      opacity: 0.6,
    },
    disabledInput: {
      backgroundColor: colors.muted,
      opacity: 0.6,
    },
    quickAmountPillDisabled: {
      opacity: 0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 12,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
            <Text style={styles.headerTitle}>Send Tip</Text>
          </View>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
          <FeedSkeleton itemCount={3} showImages={false} />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if failed to load tokens
  if (error && availableTokens.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
            <Text style={styles.headerTitle}>Send Tip</Text>
          </View>
        </View>
        <EnhancedErrorState
          title="Can't load wallet balance"
          subtitle="Check your connection and try again"
          onRetry={async () => {
            setError(null);
            await loadTokens();
          }}
          retryLabel="Try Again"
          retrying={loading}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
            <Text style={styles.headerTitle}>Send Tip</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={handleShare} style={styles.headerButton}>
              <Share size={20} color={colors.mutedForeground} />
            </Pressable>
            <Pressable onPress={handleMore} style={styles.headerButton}>
              <MoreHorizontal size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>


        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={enhancedOnRefresh}
              tintColor={colors.primary} // iOS spinner color
              colors={[colors.primary, colors.secondary]} // Android spinner colors  
              progressBackgroundColor={colors.card} // Android background
              progressViewOffset={0} // Normal positioning
              size="default"
              title="Pull to refresh" // iOS title
              titleColor={colors.mutedForeground} // iOS title color
            />
          }
        >
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
                  {walletWarningType === 'setup' ? 'Set up your wallet to send tips' : 
                   walletWarningType === 'connect' ? 'Connect your wallet to send tips' :
                   'Add SOL to your wallet to send tips'}
                </Text>
              </View>
              {walletWarningType === 'setup' ? (
                <Pressable 
                  style={styles.connectButton}
                  onPress={() => navigation.navigate('WalletSettings')}
                >
                  <Text style={styles.connectButtonText}>Wallet Settings</Text>
                </Pressable>
              ) : walletWarningType === 'connect' ? (
                <Pressable 
                  style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
                  onPress={async () => {
                    try {
                      console.log('📱 Connect wallet button pressed from tip screen');
                      await connect();
                      console.log('✅ Wallet connected successfully from tip screen');
                    } catch (error: any) {
                      console.error('❌ Wallet connection failed from tip screen:', error);
                      
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
                  }}
                  disabled={connecting}
                >
                  <Text style={styles.connectButtonText}>
                    {connecting ? 'Connecting...' : 'Connect Wallet'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable 
                  style={styles.connectButton}
                  onPress={() => navigation.navigate('BuySOL')}
                >
                  <Text style={styles.connectButtonText}>Add SOL</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Sending To Card */}
          <View style={styles.card}>
            <Text style={[styles.sectionHeader, styles.sectionHeaderFirst]}>Sending to:</Text>
            <View style={styles.recipientRow}>
              <Avatar
                src={recipientAvatar}
                fallback={recipientName?.charAt(0) || 'U'}
                size="md"
              />
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>
                  {recipientName || 'Unknown User'}
                </Text>
                <Text style={styles.recipientWallet} numberOfLines={1} ellipsizeMode="middle">
                  {recipientWallet}
                </Text>
              </View>
            </View>
          </View>

          {/* Select Token Section - Only show when wallet is ready */}
          {canUseTipForm && (
            <View style={styles.sectionHeaderRight}>
              <Text style={styles.sectionHeader}>Select Token</Text>
              <Text style={styles.sectionCaption}>
                {availableTokens.length} token{availableTokens.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          )}

          {/* Token Selector - Only show when wallet is ready */}
          {canUseTipForm && (
            <>
              {connected && selectedToken && (
                <Pressable 
                  style={({ pressed }) => [
                    styles.tokenSelector,
                    pressed && styles.tokenSelectorPressed,
                  ]}
                  onPress={handleTokenSelect}
                >
                  <View style={styles.tokenRow}>
                    <View style={styles.tokenLeft}>
                      <View style={styles.tokenIcon} />
                      <View style={styles.tokenInfo}>
                        <Text style={styles.tokenName}>
                          {selectedToken.symbol}  |  {selectedToken.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tokenRight}>
                      <Text style={styles.tokenBalance}>
                        {tipsAPI.formatTokenAmount(selectedToken.amount, selectedToken.decimals)}
                      </Text>
                      <Text style={styles.tokenUsdValue}>
                        {tipsAPI.formatUsdValue(selectedToken.usdValue)}
                      </Text>
                    </View>
                    {availableTokens.length > 1 && (
                      <ChevronDown size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
                    )}
                  </View>
                </Pressable>
              )}
            </>
          )}

          {/* Rest of form - Only show when wallet is ready */}
          {canUseTipForm && (
            <>
              {/* Amount Section */}
              <View style={styles.sectionHeaderRight}>
                <Text style={styles.sectionHeader}>Amount</Text>
                <Text style={styles.sectionCaption}>
                  Available: {connected && selectedToken ? tipsAPI.formatTokenAmount(selectedToken.amount, selectedToken.decimals) : '--'} {connected && selectedToken ? selectedToken.symbol : 'SOL'}
                </Text>
              </View>

              {/* Quick Amounts */}
              <View style={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((usdAmount) => (
                  <Pressable
                    key={usdAmount}
                    style={styles.quickAmountPill}
                    onPress={() => handleQuickAmount(usdAmount)}
                  >
                    <Text style={styles.quickAmountText}>${usdAmount}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Amount Input */}
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                {selectedToken && (
                  <Text style={styles.amountLabel}>{selectedToken.symbol}</Text>
                )}
              </View>

              {/* Message Section */}
              <Text style={styles.sectionHeader}>Message (Optional)</Text>
              <View style={styles.messageInputContainer}>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={handleMessageChange}
                  placeholder="Add a message with your tip…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={280}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCounter}>
                  {message.length}/280
                </Text>
              </View>

              {/* Send Button Section */}
              <View style={styles.bottomContainer}>
                <Pressable
                  style={[
                    styles.sendButton,
                    (!isValidAmount || isTransactionLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendTip}
                  disabled={!isValidAmount || isTransactionLoading}
                >
                  <Send size={20} color={colors.primaryForeground} />
                  <Text style={styles.sendButtonText}>
                    {isTransactionLoading ? 'Sending...' : 'Send Tip'}
                  </Text>
                </Pressable>
                <Text style={styles.footerCaption}>
                  Transaction fees may apply. This action cannot be undone.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Token Picker Modal */}
      <TokenPickerModal
        visible={showTokenPicker}
        tokens={availableTokens}
        selectedToken={selectedToken}
        onSelectToken={handleTokenPicked}
        onClose={handleCloseTokenPicker}
      />
    </SafeAreaView>
  );
}