import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share, MoreHorizontal, Send, ChevronDown, AlertTriangle, X } from 'lucide-react-native';
import { Image } from 'react-native';
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
  const { connected, connecting, connect, balance, fetchBalance } = useWalletStore();
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

  // State - moved to top to avoid hoisting issues
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<{
    amount: string;
    token: string;
    recipient: string;
    message?: string;
  } | null>(null);

  // Get SOL balance from available tokens instead of wallet store
  // Only check balance after tokens are loaded to avoid undefined issues
  const solToken = Array.isArray(availableTokens) ? 
    availableTokens.find(token => token.symbol === 'SOL' || token.isNative) : 
    null;
  const solBalance = solToken?.amount || 0;
  const hasBalance = solBalance > 0;
  
  console.log('🔍 SendTipScreen: Balance check:', {
    walletStoreBalance: balance,
    solTokenBalance: solBalance,
    hasBalance,
    connected,
    publicKey: publicKey?.toString().slice(0, 8) + '...',
    availableTokensType: typeof availableTokens,
    availableTokensIsArray: Array.isArray(availableTokens),
    tokenCount: Array.isArray(availableTokens) ? availableTokens.length : 0,
    loading
  });
  
  // Only check wallet warning if we have loaded tokens or are not connected
  const shouldCheckBalance = !connected || !loading;
  const walletWarningType = shouldCheckBalance ? 
    getWalletWarningType({ requireBalance: true, balance: solBalance }) : 
    null;
  const showWalletWarning = walletWarningType !== null;
  const canUseTipForm = !showWalletWarning;

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
      console.log('🔍 SendTipScreen: Tokens API response:', {
        tokenCount: tokens.length,
        tokens: tokens.map(t => ({
          symbol: t.symbol,
          amount: t.amount,
          isNative: t.isNative,
          logoUri: t.logoUri,
          hasLogo: !!t.logoUri
        }))
      });
      
      setAvailableTokens(Array.isArray(tokens) ? tokens : []);
      
      // Auto-select SOL if available, otherwise select the first token
      const solToken = tokens.find(token => token.symbol === 'SOL' || token.isNative);
      if (solToken) {
        setSelectedToken(solToken);
        console.log('✅ SendTipScreen: SOL token found with balance:', solToken.amount);
      } else if (tokens.length > 0) {
        setSelectedToken(tokens[0]);
        console.log('⚠️ SendTipScreen: No SOL token found, selected:', tokens[0].symbol);
      } else {
        console.log('⚠️ SendTipScreen: No tokens available');
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

  // Load available tokens on mount and fetch balance
  useEffect(() => {
    if (connected && publicKey) {
      loadTokens();
      fetchBalance();
    }
  }, [connected, publicKey, loadTokens, fetchBalance]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadTokens(),
      fetchBalance()
    ]);
  }, [loadTokens, fetchBalance]);

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
      setStatusMessage({
        type: 'error',
        message: 'Please ensure wallet is connected and amount is valid'
      });
      return;
    }

    console.log('📝 SendTipScreen: Send tip pressed');
    console.log('Recipient:', recipientWallet);
    console.log('Token:', selectedToken?.symbol);
    console.log('Amount:', amount);
    console.log('Message:', message);
    
    // Show styled confirmation screen
    setConfirmationDetails({
      amount,
      token: selectedToken?.symbol || '',
      recipient: recipientName || recipientWallet,
      message: message.trim() || undefined,
    });
    setShowConfirmation(true);
  }, [recipientWallet, recipientName, selectedToken, amount, message, connected, publicKey, isValidAmount]);

  const handleConfirmSend = useCallback(async () => {
    if (!selectedToken || !confirmationDetails) return;
    
    try {
      resetError();
      setShowConfirmation(false);
      console.log('✅ SendTipScreen: Tip confirmed, starting blockchain transaction...');
      console.log('📝 Tip details:', {
        amount: confirmationDetails.amount,
        token: selectedToken.symbol,
        decimals: selectedToken.decimals,
        recipient: recipientWallet,
        message: confirmationDetails.message
      });
      
      // For SOL, convert to lamports (9 decimals)
      // selectedToken.decimals should be 9 for SOL
      const amountInBaseUnits = Math.floor(parseFloat(confirmationDetails.amount) * Math.pow(10, selectedToken.decimals));
      
      console.log('💰 Converted amount:', {
        displayAmount: confirmationDetails.amount,
        baseUnits: amountInBaseUnits,
        decimals: selectedToken.decimals,
        calculation: `${confirmationDetails.amount} * 10^${selectedToken.decimals} = ${amountInBaseUnits}`
      });
      
      // Determine if this is SOL or an SPL token
      const tokenMint = selectedToken.isNative ? undefined : selectedToken.mint;
      
      // Send tip using the hook - only pass the required parameters
      const result = await sendTip(
        recipientWallet,
        amountInBaseUnits,
        tokenMint,
        selectedToken.symbol,
        confirmationDetails.message
      );
      
      console.log('🎉 Tip transaction completed:', result);
      console.log('📝 Transaction signature:', result.signature);
      
      // Show success status message instead of alert
      setStatusMessage({
        type: 'success',
        message: `Tip sent successfully! ${result.signature.slice(0, 8)}...`
      });
      
      // Auto-navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ SendTipScreen: Tip transaction failed:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Reset confirmation state so user can see the form again
      setShowConfirmation(false);
      
      // Handle specific error types
      let errorMessage = `Failed to send ${selectedToken.symbol} tip. Please try again.`;
      
      if (error.message?.includes('SPL token tips are not yet supported')) {
        errorMessage = 'Only SOL tips are currently supported. Please select SOL.';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = `Insufficient ${selectedToken.symbol} balance to complete this tip.`;
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please check your network connection.';
      } else if (error.message?.includes('build')) {
        errorMessage = `Failed to prepare ${selectedToken.symbol} transaction. Please try again.`;
      } else if (error.message?.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet and try again.';
      } else if (error.message?.includes('must be greater than 0')) {
        errorMessage = `${selectedToken.symbol} tip amount must be greater than 0.`;
      } else if (error.message?.includes('Failed to build create-tip transaction')) {
        // Backend error - log more details
        console.error('Backend error building transaction:', error.message);
        errorMessage = 'Failed to build transaction. Please try again.';
      }
      
      setStatusMessage({
        type: 'error',
        message: errorMessage
      });
    }
  }, [selectedToken, confirmationDetails, recipientWallet, sendTip, resetError, navigation]);

  const handleCancelConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setConfirmationDetails(null);
  }, []);

  // Validation
  const numericAmount = parseFloat(amount) || 0;
  // API already returns display amounts (e.g., 0.138 SOL), so no need to divide by decimals
  const maxAmount = selectedToken ? selectedToken.amount : 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= maxAmount;
  
  console.log('🔍 SendTipScreen: Amount validation:', {
    inputAmount: amount,
    numericAmount,
    maxAmount,
    isValidAmount,
    tokenAmount: selectedToken?.amount,
    tokenDecimals: selectedToken?.decimals
  });
  
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
      flex: 1,
    },
    tokenIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
    },
    tokenIconPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
    },
    tokenIconText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
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
      justifyContent: 'center',
      minWidth: 120,
      maxWidth: 140,
    },
    tokenBalance: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      textAlign: 'right',
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
    confirmationOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 1000,
    },
    confirmationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    confirmationContent: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    confirmationCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    confirmationTokenImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginBottom: 16,
    },
    confirmationTokenImagePlaceholder: {
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmationTokenImageText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    confirmationAmount: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    confirmationToken: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginBottom: 16,
    },
    confirmationRecipient: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
      marginBottom: 8,
    },
    confirmationWallet: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    confirmationMessage: {
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
    },
    confirmationMessageText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    confirmationActions: {
      marginTop: 24,
      marginBottom: 32,
      gap: 12,
    },
    confirmationButton: {
      height: 48,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
    },
    confirmationButtonPrimary: {
      backgroundColor: colors.primary,
    },
    confirmationButtonSecondary: {
      backgroundColor: colors.secondary,
    },
    confirmationButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    confirmationButtonTextPrimary: {
      color: colors.primaryForeground,
    },
    confirmationButtonTextSecondary: {
      color: colors.secondaryForeground,
    },
    statusMessage: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
    },
    statusMessageSuccess: {
      backgroundColor: colors.success + '10',
      borderColor: colors.success,
    },
    statusMessageError: {
      backgroundColor: colors.destructive + '10',
      borderColor: colors.destructive,
    },
    statusMessageInfo: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    statusMessageText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
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
                      {selectedToken.logoUri ? (
                        <Image 
                          source={{ uri: selectedToken.logoUri }} 
                          style={styles.tokenIcon}
                          onError={() => console.log('Failed to load token image:', selectedToken.logoUri)}
                        />
                      ) : (
                        <View style={[styles.tokenIcon, styles.tokenIconPlaceholder]}>
                          <Text style={styles.tokenIconText}>
                            {selectedToken.symbol.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tokenInfo}>
                        <Text style={styles.tokenName}>
                          {selectedToken.symbol}  |  {selectedToken.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tokenRight}>
                      <Text style={styles.tokenBalance}>
                        {selectedToken.amount.toFixed(6)} {selectedToken.symbol}
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
                  Available: {connected && selectedToken ? selectedToken.amount.toFixed(6) : '--'} {connected && selectedToken ? selectedToken.symbol : 'SOL'}
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

      {/* Confirmation Screen Overlay */}
      {showConfirmation && confirmationDetails && (
        <View style={styles.confirmationOverlay}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            {/* Header */}
            <View style={styles.confirmationHeader}>
              <Text style={styles.headerTitle}>Confirm Tip</Text>
              <Pressable onPress={handleCancelConfirmation} style={styles.headerButton}>
                <X size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={styles.confirmationContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Tip Details Card */}
              <View style={styles.confirmationCard}>
                {/* Token Image */}
                {selectedToken?.logoUri ? (
                  <Image 
                    source={{ uri: selectedToken.logoUri }} 
                    style={styles.confirmationTokenImage}
                  />
                ) : (
                  <View style={[styles.confirmationTokenImage, styles.confirmationTokenImagePlaceholder]}>
                    <Text style={styles.confirmationTokenImageText}>
                      {confirmationDetails.token.charAt(0)}
                    </Text>
                  </View>
                )}
                
                <Text style={styles.confirmationAmount}>
                  {confirmationDetails.amount} {confirmationDetails.token}
                </Text>
                <Text style={styles.confirmationToken}>
                  {selectedToken && (tipsAPI.formatUsdValue(parseFloat(confirmationDetails.amount) * selectedToken.usdPrice))}
                </Text>
                
                <View style={{ width: '100%', marginTop: 20 }}>
                  <Text style={styles.confirmationRecipient}>
                    Sending to
                  </Text>
                  <Text style={[styles.confirmationRecipient, { fontWeight: '700', marginTop: 4 }]}>
                    {confirmationDetails.recipient}
                  </Text>
                  {confirmationDetails.recipient !== recipientWallet && (
                    <Text style={styles.confirmationWallet} numberOfLines={1} ellipsizeMode="middle">
                      {recipientWallet}
                    </Text>
                  )}
                </View>

                {confirmationDetails.message && (
                  <View style={styles.confirmationMessage}>
                    <Text style={styles.confirmationMessageText}>
                      "{confirmationDetails.message}"
                    </Text>
                  </View>
                )}
              </View>

              {/* Warning */}
              <Text style={styles.footerCaption}>
                This transaction cannot be undone. Make sure the recipient address is correct.
              </Text>

              {/* Action Buttons - Full width, stacked */}
              <View style={styles.confirmationActions}>
                <Pressable 
                  style={[styles.confirmationButton, styles.confirmationButtonPrimary]}
                  onPress={handleConfirmSend}
                  disabled={tippingLoading}
                >
                  <Send size={20} color={colors.primaryForeground} />
                  <Text style={[styles.confirmationButtonText, styles.confirmationButtonTextPrimary]}>
                    {tippingLoading ? 'Sending...' : 'Confirm & Send'}
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.confirmationButton, styles.confirmationButtonSecondary]}
                  onPress={handleCancelConfirmation}
                >
                  <Text style={[styles.confirmationButtonText, styles.confirmationButtonTextSecondary]}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}