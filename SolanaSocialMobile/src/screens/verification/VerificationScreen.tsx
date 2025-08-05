import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react-native';
import { FeedSkeleton } from '../../components/loading/FeedSkeleton';
import { EnhancedErrorState } from '../../components/ui/EnhancedErrorState';
import { useEnhancedRefresh } from '../../hooks/useEnhancedRefresh';
import { useThemeStore } from '../../store/themeStore';
import { useWalletStore } from '../../store/wallet';
import { useAuthStore } from '../../store/auth';
import { useProfileStore } from '../../store/profileStore';
import { useBlockchainTransactions } from '../../hooks/useBlockchainTransactions';
import { socialAPI } from '../../services/api/social';
import { FeedStackScreenProps } from '../../types/navigation';

type VerificationScreenProps = FeedStackScreenProps<'Verification'>;

interface VerificationStatus {
  hasSolDomain: boolean;
  solDomainName?: string;
  solDomainVerified: boolean; // Mapped from isUsernameVerified
  hasNftPfp: boolean;
  nftMint?: string;
  nftName?: string;
  nftVerified: boolean; // Mapped from isProfileVerified
  profileData?: any; // Store the full profile data
}

export default function VerificationScreen({ navigation, route }: VerificationScreenProps) {
  const { targetWallet, targetName } = route.params;
  const { colors } = useThemeStore();
  const { publicKey, connected } = useWalletStore();
  const { user } = useAuthStore();
  const { currentProfile } = useProfileStore();
  const { updateVerification, loading: transactionLoading } = useBlockchainTransactions();
  
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Determine if this is the user's own profile
  const userWalletAddress = currentProfile?.primaryWalletAddress || 
                           currentProfile?.wallet_address || 
                           currentProfile?.userWallet || 
                           currentProfile?.walletAddress || 
                           user?.walletAddress;
  const isOwnProfile = targetWallet === userWalletAddress;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Load verification status function  
  const loadVerificationStatus = useCallback(async () => {
    if (!refreshing) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('🔍 VerificationScreen: Loading profile data for wallet:', targetWallet);
      
      let profileData;
      
      // If this is the user's own profile, use current profile data or load comprehensive profile
      if (isOwnProfile) {
        if (currentProfile) {
          profileData = currentProfile;
        } else {
          // Load comprehensive profile for own profile
          profileData = await socialAPI.getAuthenticatedUserProfile();
        }
      } else {
        // Load public profile for other users
        profileData = await socialAPI.getUserProfile(targetWallet);
      }
      
      console.log('🔍 VerificationScreen: Profile data loaded:', {
        isUsernameVerified: profileData?.isUsernameVerified,
        isProfileVerified: profileData?.isProfileVerified,
        username: profileData?.username,
        profilePicture: profileData?.profilePicture || profileData?.profileImageUrl,
        displayName: profileData?.displayName
      });
      
      // Map the API response to our verification status interface
      const status: VerificationStatus = {
        hasSolDomain: !!(profileData?.username || profileData?.displayName !== profileData?.walletAddress),
        solDomainName: profileData?.username || profileData?.displayName,
        solDomainVerified: profileData?.isUsernameVerified || false,
        hasNftPfp: !!(profileData?.profilePicture || profileData?.profileImageUrl),
        nftMint: undefined, // We don't have NFT mint info in the current API
        nftName: 'Profile Picture', // Generic name since we don't have specific NFT data
        nftVerified: profileData?.isProfileVerified || false,
        profileData: profileData
      };
      
      setVerificationStatus(status);
    } catch (error: any) {
      console.error('Failed to load verification status:', error);
      setError(error?.message || 'Failed to load verification status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, targetWallet, isOwnProfile, currentProfile]);

  // Load verification status on mount
  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVerificationStatus();
  }, [loadVerificationStatus]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading);
  }, [refreshing, loading, handleRefreshStateChange]);

  // Auto-dismiss status messages after 10 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleVerify = useCallback(async () => {
    if (!connected || !publicKey) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to verify.');
      return;
    }

    if (!verificationStatus) {
      Alert.alert('Error', 'Verification status not loaded');
      return;
    }

    setVerifying(true);
    setStatusMessage(null); // Clear any previous status messages
    try {
      // Determine verification type based on what the user has
      let verificationType: 'nft' | 'sns' | 'both' = 'both';
      if (verificationStatus.hasSolDomain && !verificationStatus.hasNftPfp) {
        verificationType = 'sns';
      } else if (!verificationStatus.hasSolDomain && verificationStatus.hasNftPfp) {
        verificationType = 'nft';
      }
      
      const verificationParams = {
        callerWallet: publicKey.toString(),
        targetUser: targetWallet,
        verificationType: verificationType,
        domainName: verificationStatus.solDomainName || undefined,
        // Note: We don't have NFT mint/metadata info from the current API response
        // This will need to be enhanced when the backend provides this data
      };
      
      console.log('🔄 Starting verification transaction...');
      console.log('🔍 Verification parameters:', verificationParams);
      console.log('🔍 Connected wallet:', publicKey.toString());
      console.log('🔍 Target wallet:', targetWallet);
      console.log('🔍 Verification type:', verificationType);
      console.log('🔍 Domain name:', verificationStatus.solDomainName);
      console.log('🔍 Is own profile:', isOwnProfile);
      
      // Check current auth status
      console.log('🔍 Auth check from useAuthStore:');
      console.log('  - user exists:', !!user);
      console.log('  - user id:', user?.id);
      console.log('  - user email:', user?.email);
      
      // Call the blockchain transaction for update-verification
      const result = await updateVerification(verificationParams);
      
      setStatusMessage({
        type: 'success',
        message: `Verification completed successfully! Transaction: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`
      });
      
      console.log('✅ Verification transaction completed successfully:', result.signature);
      
    } catch (error: any) {
      console.error('❌ Verification transaction failed:', error);
      console.error('❌ Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      
      let errorMessage = 'Failed to verify profile. Please try again.';
      let messageType: 'error' | 'info' = 'error';
      
      if (error.message?.includes('rejected') || error.message?.includes('cancelled') || error.message?.includes('User rejected')) {
        errorMessage = 'Verification not completed';
        messageType = 'info';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance to complete verification. Please add funds to your wallet.';
      } else if (error.message?.includes('not authorized')) {
        errorMessage = 'You are not authorized to verify this user.';
      } else if (error.message?.includes('already verified')) {
        errorMessage = 'User is already verified on the blockchain.';
        messageType = 'info';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Verification service unavailable. Please try again later.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error during verification. Please try again later.';
      } else if (error.message) {
        // Show a user-friendly version of the error
        errorMessage = `Verification failed: ${error.message}`;
      }
      
      setStatusMessage({
        type: messageType,
        message: errorMessage
      });
    } finally {
      setVerifying(false);
    }
  }, [connected, publicKey, verificationStatus, navigation]);

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
      padding: 16,
    },
    profileInfo: {
      alignItems: 'center',
      marginBottom: 32,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    profileSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    verificationSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    verificationSectionDisabled: {
      opacity: 0.5,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionIcon: {
      marginRight: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      flex: 1,
    },
    statusIcon: {
      marginLeft: 8,
    },
    sectionContent: {
      marginLeft: 36,
    },
    itemName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginBottom: 4,
    },
    itemStatus: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    itemStatusVerified: {
      color: colors.success,
    },
    itemStatusUnverified: {
      color: colors.warning,
    },
    noItemsText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      fontStyle: 'italic',
    },
    nothingToVerifyContainer: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
    },
    nothingToVerifyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginTop: 16,
    },
    verifyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
    },
    verifyButtonDisabled: {
      opacity: 0.5,
    },
    verifyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
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
            <Text style={styles.headerTitle}>Verification</Text>
          </View>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
          <FeedSkeleton itemCount={3} showImages={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !verificationStatus) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
            <Text style={styles.headerTitle}>Verification</Text>
          </View>
        </View>
        <EnhancedErrorState
          title="Can't load verification status"
          subtitle="Check your connection and try again"
          onRetry={async () => {
            setError(null);
            await loadVerificationStatus();
          }}
          retryLabel="Try Again"
          retrying={loading}
        />
      </SafeAreaView>
    );
  }

  const hasVerifiableItems = verificationStatus.hasSolDomain || verificationStatus.hasNftPfp;
  const canVerify = hasVerifiableItems && connected;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
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
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {targetName || 'User'}
          </Text>
          <Text style={styles.profileSubtitle}>
            {isOwnProfile ? 'Your Profile' : 'Profile Verification'}
          </Text>
        </View>

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

        {/* SOL Domain Section */}
        <View style={[
          styles.verificationSection,
          !verificationStatus.hasSolDomain && styles.verificationSectionDisabled
        ]}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.foreground} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>.sol Domain</Text>
            {verificationStatus.hasSolDomain && (
              <View style={styles.statusIcon}>
                {verificationStatus.solDomainVerified ? (
                  <CheckCircle size={20} color={colors.success} />
                ) : (
                  <AlertCircle size={20} color={colors.warning} />
                )}
              </View>
            )}
            {!verificationStatus.hasSolDomain && (
              <XCircle size={20} color={colors.mutedForeground} style={styles.statusIcon} />
            )}
          </View>
          <View style={styles.sectionContent}>
            {verificationStatus.hasSolDomain ? (
              <>
                <Text style={styles.itemName}>{verificationStatus.solDomainName}</Text>
                <Text style={[
                  styles.itemStatus,
                  verificationStatus.solDomainVerified ? styles.itemStatusVerified : styles.itemStatusUnverified
                ]}>
                  {verificationStatus.solDomainVerified ? 'Verified' : 'Not verified'}
                </Text>
              </>
            ) : (
              <Text style={styles.noItemsText}>Does not have .sol domain</Text>
            )}
          </View>
        </View>

        {/* NFT Profile Picture Section */}
        <View style={[
          styles.verificationSection,
          !verificationStatus.hasNftPfp && styles.verificationSectionDisabled
        ]}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.foreground} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>NFT Profile Picture</Text>
            {verificationStatus.hasNftPfp && (
              <View style={styles.statusIcon}>
                {verificationStatus.nftVerified ? (
                  <CheckCircle size={20} color={colors.success} />
                ) : (
                  <AlertCircle size={20} color={colors.warning} />
                )}
              </View>
            )}
            {!verificationStatus.hasNftPfp && (
              <XCircle size={20} color={colors.mutedForeground} style={styles.statusIcon} />
            )}
          </View>
          <View style={styles.sectionContent}>
            {verificationStatus.hasNftPfp ? (
              <>
                <Text style={styles.itemName}>{verificationStatus.nftName}</Text>
                <Text style={[
                  styles.itemStatus,
                  verificationStatus.nftVerified ? styles.itemStatusVerified : styles.itemStatusUnverified
                ]}>
                  {verificationStatus.nftVerified ? 'Verified' : 'Not verified'}
                </Text>
              </>
            ) : (
              <Text style={styles.noItemsText}>Does not have NFT profile picture</Text>
            )}
          </View>
        </View>

        {/* Nothing to Verify State */}
        {!hasVerifiableItems && (
          <View style={styles.nothingToVerifyContainer}>
            <XCircle size={48} color={colors.mutedForeground} />
            <Text style={styles.nothingToVerifyText}>
              User has nothing to verify
            </Text>
          </View>
        )}

        {/* Verify Button */}
        {hasVerifiableItems && (
          <Pressable
            style={[
              styles.verifyButton,
              (!canVerify || verifying || transactionLoading) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={!canVerify || verifying || transactionLoading}
          >
            <Shield size={20} color={colors.primaryForeground} />
            <Text style={styles.verifyButtonText}>
              {verifying ? 'Verifying...' : !connected ? 'Connect Wallet to Verify' : 'Verify Profile'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}