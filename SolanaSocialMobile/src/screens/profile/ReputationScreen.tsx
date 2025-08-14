import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  Zap,
  Plus,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {SegmentedControl} from '../../components/ui/SegmentedControl';
import {SkeletonCard} from '../../components/ui/Skeleton';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {useVoting} from '../../hooks/useBlockchainTransactions';
import {useWalletConnection} from '../../hooks/useWalletConnection';
import {reputationAPI} from '../../services/api/reputation';
import {socialAPI} from '../../services/api/social';
import {ReputationData} from '../../services/api/types';
import {getAvatarFallback} from '../../lib/utils';
import {AppNavBar} from '../../components/navigation/AppNavBar';

interface ReputationScreenProps {
  navigation: any;
  route: {
    params: {
      walletAddress: string;
    };
  };
}

interface VoteUser {
  voteAddress: string;
  votedAt: string;
  walletAddress: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  isUsernameVerified: boolean;
  isProfileVerified: boolean;
  isBrand: boolean;
  isVerified: boolean;
  reputation: number;
}


type SortOption = 'reputation' | 'recent';

export default function ReputationScreen({navigation, route}: ReputationScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile, loadProfile} = useProfileStore();
  const {upvote, downvote, loading: votingLoading} = useVoting();
  const walletConnection = useWalletConnection();
  
  const walletAddress = route.params.walletAddress;
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('reputation');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Reputation data state
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Votes data state
  const [votesData, setVotesData] = useState<{upvoters: VoteUser[]; downvoters: VoteUser[]} | null>(null);
  const [votesLoading, setVotesLoading] = useState(true);
  const [votesError, setVotesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Voting state
  const [selectedVote, setSelectedVote] = useState<'upvote' | 'downvote' | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  
  const tabs = ['Upvotes', 'Downvotes'];
  
  // Load profile data on mount
  useEffect(() => {
    if (walletAddress) {
      console.log('🔍 ReputationScreen: Loading profile for wallet:', walletAddress);
      loadProfile(walletAddress);
    }
  }, [walletAddress, loadProfile]);
  
  // Load reputation data on mount
  useEffect(() => {
    const loadReputationData = async () => {
      console.log('🔍 ReputationScreen: Loading reputation data for:', walletAddress);
      setLoading(true);
      setError(null);
      
      try {
        const data = await reputationAPI.getUserReputation(walletAddress);
        console.log('🔍 ReputationScreen: Reputation data loaded:', data);
        setReputationData(data);
      } catch (err: any) {
        console.error('🚨 ReputationScreen: Error loading reputation:', err);
        setError(err.message || 'Failed to load reputation data');
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      loadReputationData();
    }
  }, [walletAddress]);
  
  // Load votes data on mount
  useEffect(() => {
    const loadVotesData = async () => {
      console.log('🔍 ReputationScreen: Loading votes data for:', walletAddress);
      setVotesLoading(true);
      setVotesError(null);
      
      try {
        const data = await socialAPI.getWalletVotes(walletAddress, 1, 50);
        console.log('🔍 ReputationScreen: Votes data loaded:', data);
        setVotesData({
          upvoters: data.upvoters || [],
          downvoters: data.downvoters || []
        });
      } catch (err: any) {
        console.error('🚨 ReputationScreen: Error loading votes:', err);
        setVotesError(err.message || 'Failed to load votes data');
        // Set empty data on error instead of keeping loading state
        setVotesData({
          upvoters: [],
          downvoters: []
        });
      } finally {
        setVotesLoading(false);
      }
    };

    if (walletAddress) {
      loadVotesData();
    }
  }, [walletAddress]);
  
  // Refresh handler to reload both reputation and votes data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Load reputation data
      const repData = await reputationAPI.getUserReputation(walletAddress);
      setReputationData(repData);
      
      // Load votes data
      const votesResponse = await socialAPI.getWalletVotes(walletAddress, 1, 50);
      setVotesData({
        upvoters: votesResponse.upvoters || [],
        downvoters: votesResponse.downvoters || []
      });
      
      // Reload profile
      await loadProfile(walletAddress);
    } catch (err: any) {
      console.error('🚨 ReputationScreen: Error during refresh:', err);
    } finally {
      setRefreshing(false);
    }
  }, [walletAddress, loadProfile]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading || votesLoading);
  }, [refreshing, loading, votesLoading, handleRefreshStateChange]);
  
  // Get profile data - combine currentProfile with reputation data
  const profileData = {
    displayName: currentProfile?.displayName,
    username: currentProfile?.username,
    walletAddress: walletAddress,
    profilePicture: currentProfile?.profilePicture,
    onChainReputation: currentProfile?.reputation || reputationData?.totalScore || 0,
    epochStreak: currentProfile?.postsThisEpoch || reputationData?.scoreThisEpoch || 0,
    upvotesReceived: currentProfile?.upvotesReceived || reputationData?.upvotesReceived || 0,
    downvotesReceived: currentProfile?.downvotesReceived || reputationData?.downvotesReceived || 0,
    reputationLevel: reputationData?.reputationLevel || 'newcomer',
    voteRatio: reputationData?.voteRatio || 0,
  };
  
  // Debug log to see what data we have
  console.log('🔍 ReputationScreen: Profile data:', {
    currentProfile,
    reputationData,
    profileData,
    reputation: currentProfile?.reputation,
    upvotesReceived: currentProfile?.upvotesReceived,
    downvotesReceived: currentProfile?.downvotesReceived,
    postsThisEpoch: currentProfile?.postsThisEpoch
  });

  // Get username display with fallback
  const getUsernameDisplay = () => {
    // Use displayName directly from the profile if it exists
    if (currentProfile?.displayName && currentProfile.displayName.trim()) {
      // If it's not a shortened wallet format, use it as-is
      if (!currentProfile.displayName.includes('...')) {
        return currentProfile.displayName;
      }
    }
    
    // If we have a username, use it
    if (currentProfile?.username && currentProfile.username.trim()) {
      return currentProfile.username;
    }
    
    // Fallback to wallet address (using the displayName if it's a shortened wallet)
    if (currentProfile?.displayName && currentProfile.displayName.includes('...')) {
      return currentProfile.displayName;
    }
    
    // Last resort: show wallet address
    if (walletAddress) {
      return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    }
    
    return 'Unknown User';
  };

  // Get display name for voter, avoiding shortened wallet addresses
  const getDisplayName = (user: VoteUser) => {
    // Check if displayName looks like a shortened wallet (e.g., "144g...Nqgm")
    if (user.displayName && user.displayName.includes('...')) {
      // If username exists and isn't empty, use it
      if (user.username && user.username.trim()) {
        return user.username;
      }
      // Otherwise show the shortened wallet
      return user.displayName;
    }
    
    // If we have a proper display name, use it
    if (user.displayName && user.displayName.trim()) {
      return user.displayName;
    }
    
    // Fallback to username
    if (user.username && user.username.trim()) {
      return user.username;
    }
    
    // Last resort: show shortened wallet
    return `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`;
  };

  // Sort data based on current sort option
  const sortData = useCallback((data: VoteUser[]) => {
    return [...data].sort((a, b) => {
      if (sortBy === 'reputation') {
        return b.reputation - a.reputation;
      } else {
        return new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime();
      }
    });
  }, [sortBy]);

  // Get current tab data and sort it
  const getCurrentTabData = (): VoteUser[] => {
    if (!votesData) return [];
    
    const rawData = selectedTab === 0 ? votesData.upvoters : votesData.downvoters;
    return sortData(rawData);
  };
  
  const currentData = getCurrentTabData();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setShowSortDropdown(false);
  };

  // Auto-dismiss status messages after 10 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Get wallet connection state
  const { 
    publicKey, 
    walletWarningType, 
    showWalletWarning,
    isPrimaryWalletConnected 
  } = walletConnection;
  const canVote = !showWalletWarning;

  // Don't show voting buttons for own profile
  const isOwnProfile = user?.walletAddress === walletAddress;

  const handleUpvote = useCallback(async () => {
    if (votingLoading || !canVote || isOwnProfile) return;
    
    setSelectedVote('upvote');
    setStatusMessage(null);
    
    try {
      console.log('🔄 Starting upvote transaction from reputation screen...');
      const result = await upvote(walletAddress);
      
      setStatusMessage({
        type: 'success',
        message: `Upvote recorded successfully! Transaction: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`
      });
      
      console.log('🎉 Profile upvote successful:', result.signature);
      
      // Refresh data after successful vote
      handleRefresh();
      
    } catch (error: any) {
      console.error('❌ Profile upvote failed:', error);
      setSelectedVote(null);
      
      let errorMessage = 'Failed to record upvote. Please try again.';
      let messageType: 'error' | 'info' = 'error';
      
      if (error.message?.includes('invalid count') || error.message?.includes('already voted')) {
        errorMessage = 'You have already voted for this user. You can only vote once per user.';
        messageType = 'info';
      } else if (error.message?.includes('at least one post')) {
        errorMessage = 'You must create at least one post before you can vote';
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Voting process not completed';
        messageType = 'info';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance to complete voting';
      }
      
      setStatusMessage({
        type: messageType,
        message: errorMessage
      });
    }
  }, [upvote, walletAddress, votingLoading, canVote, isOwnProfile, handleRefresh]);

  const handleDownvote = useCallback(async () => {
    if (votingLoading || !canVote || isOwnProfile) return;
    
    setSelectedVote('downvote');
    setStatusMessage(null);
    
    try {
      console.log('🔄 Starting downvote transaction from reputation screen...');
      const result = await downvote(walletAddress);
      
      setStatusMessage({
        type: 'success',
        message: `Downvote recorded successfully! Transaction: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`
      });
      
      console.log('🎉 Profile downvote successful:', result.signature);
      
      // Refresh data after successful vote
      handleRefresh();
      
    } catch (error: any) {
      console.error('❌ Profile downvote failed:', error);
      setSelectedVote(null);
      
      let errorMessage = 'Failed to record downvote. Please try again.';
      let messageType: 'error' | 'info' = 'error';
      
      if (error.message?.includes('invalid count') || error.message?.includes('already voted')) {
        errorMessage = 'You have already voted for this user. You can only vote once per user.';
        messageType = 'info';
      } else if (error.message?.includes('at least one post')) {
        errorMessage = 'You must create at least one post before you can vote';
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Voting process not completed';
        messageType = 'info';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance to complete voting';
      }
      
      setStatusMessage({
        type: messageType,
        message: errorMessage
      });
    }
  }, [downvote, walletAddress, votingLoading, canVote, isOwnProfile, handleRefresh]);

  const renderVoteUser = ({item}: {item: VoteUser}) => (
    <Pressable
      style={styles.userRow}
      onPress={() => navigation.navigate('UserProfile', {walletAddress: item.walletAddress})}>
      <Avatar
        src={item.profileImageUrl || undefined}
        fallback={getAvatarFallback(item)}
        size="md"
        showRing={item.isVerified}
        ringColor={colors.success}
      />
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{getDisplayName(item)}</Text>
          {item.isVerified && <Text style={styles.verifiedIcon}>✓</Text>}
        </View>
        <Text style={styles.userWallet}>
          {item.walletAddress.slice(0, 8)}...{item.walletAddress.slice(-8)}
        </Text>
        <Text style={styles.voteDate}>
          Voted {new Date(item.votedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.reputationContainer}>
        <View style={styles.reputationPill}>
          <Zap size={12} color={colors.success} />
          <Text style={styles.reputationText}>{item.reputation}</Text>
        </View>
      </View>
    </Pressable>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerRight: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createPostButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    createPostButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    profileSection: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
      padding: 16,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      zIndex: 1,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    profileInfo: {
      marginLeft: 12,
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    profileSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    reputationStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
    },
    reputationStatColumn: {
      flex: 1,
      alignItems: 'center',
    },
    reputationStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      marginBottom: 2,
    },
    reputationStatLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
      fontWeight: '500',
    },
    tabsAndSortContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      zIndex: 10,
    },
    tabsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    segmentedControlWrapper: {
      flex: 1,
      marginRight: 16,
    },
    sortContainer: {
      position: 'relative',
      zIndex: 20,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 6,
    },
    sortButtonText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    sortDropdown: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 15,
      zIndex: 100,
      minWidth: 150,
    },
    sortOption: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortOptionLast: {
      borderBottomWidth: 0,
    },
    sortOptionText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    sortOptionActive: {
      backgroundColor: colors.muted,
    },
    sortOptionActiveText: {
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    votesList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    verifiedIcon: {
      color: colors.success,
      fontSize: 16,
      marginLeft: 4,
    },
    userWallet: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    voteDate: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 1,
    },
    reputationContainer: {
      alignItems: 'flex-end',
    },
    reputationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.success,
      gap: 4,
    },
    reputationText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    // Loading and error states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 16,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.destructive,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    // Reputation level styles
    reputationLevelContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    reputationLevelBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 4,
    },
    reputationLevelText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    reputationLevelDescription: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    // Vote ratio styles
    voteRatioContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    voteRatioLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    voteRatioValue: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    // Voting buttons styles
    votingButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    voteButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    upvoteButton: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success + '30',
    },
    downvoteButton: {
      backgroundColor: colors.destructive + '15', 
      borderColor: colors.destructive + '30',
    },
    voteButtonDisabled: {
      opacity: 0.5,
    },
    voteButtonActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    statusMessage: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
    },
    statusMessageSuccess: {
      borderColor: colors.success,
      backgroundColor: colors.success + '10',
    },
    statusMessageError: {
      borderColor: colors.destructive,
      backgroundColor: colors.destructive + '10',
    },
    statusMessageInfo: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    statusMessageText: {
      fontSize: 12,
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

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reputation</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <FeedSkeleton itemCount={3} showImages={false} />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reputation</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        
        <EnhancedErrorState
          title="Can't load reputation data"
          subtitle="Check your connection and try again"
          onRetry={async () => {
            setError(null);
            setLoading(true);
            // Trigger reload by re-running the useEffect
            if (walletAddress) {
              try {
                const data = await reputationAPI.getUserReputation(walletAddress);
                setReputationData(data);
              } catch (err: any) {
                setError(err.message || 'Failed to load reputation data');
              } finally {
                setLoading(false);
              }
            }
          }}
          retryLabel="Try Again"
          retrying={loading}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Reputation"
        showBackButton={true}
        onBackPress={handleBack}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />

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

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <Avatar
            src={profileData.profilePicture}
            fallback={getAvatarFallback(profileData)}
            size="lg"
            showRing={false}
            ringColor={colors.success}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getUsernameDisplay()}</Text>
            <Text style={styles.profileSubtitle}>Reputation Overview</Text>
          </View>
          
          {/* Voting Buttons - Only show for other users' profiles */}
          {!isOwnProfile && (
            <View style={styles.votingButtonsContainer}>
              <Pressable
                style={[
                  styles.voteButton,
                  styles.upvoteButton,
                  (votingLoading || !canVote) && styles.voteButtonDisabled,
                  selectedVote === 'upvote' && styles.voteButtonActive,
                ]}
                onPress={handleUpvote}
                disabled={votingLoading || !canVote}
              >
                <ThumbsUp 
                  size={18} 
                  color={selectedVote === 'upvote' ? colors.primary : colors.success} 
                />
              </Pressable>
              
              <Pressable
                style={[
                  styles.voteButton,
                  styles.downvoteButton,
                  (votingLoading || !canVote) && styles.voteButtonDisabled,
                  selectedVote === 'downvote' && styles.voteButtonActive,
                ]}
                onPress={handleDownvote}
                disabled={votingLoading || !canVote}
              >
                <ThumbsDown 
                  size={18} 
                  color={selectedVote === 'downvote' ? colors.primary : colors.destructive} 
                />
              </Pressable>
            </View>
          )}
        </View>

        {/* Reputation Stats */}
        <View style={styles.reputationStatsGrid}>
          <View style={styles.reputationStatColumn}>
            <Text style={[
              styles.reputationStatValue,
              { color: profileData.epochStreak >= 0 ? colors.success : '#FF8C00' }
            ]}>
              {profileData.epochStreak}
            </Text>
            <Text style={styles.reputationStatLabel}>This Epoch</Text>
          </View>
          
          <View style={styles.reputationStatColumn}>
            <Text style={[
              styles.reputationStatValue,
              { color: profileData.onChainReputation >= 0 ? colors.success : '#FF8C00' }
            ]}>
              {profileData.onChainReputation || 0}
            </Text>
            <Text style={styles.reputationStatLabel}>All Time</Text>
          </View>
          
          <View style={styles.reputationStatColumn}>
            <Text style={styles.reputationStatValue}>
              {profileData.upvotesReceived || 0}
            </Text>
            <Text style={styles.reputationStatLabel}>Upvotes</Text>
          </View>
          
          <View style={styles.reputationStatColumn}>
            <Text style={styles.reputationStatValue}>
              {profileData.downvotesReceived || 0}
            </Text>
            <Text style={styles.reputationStatLabel}>Downvotes</Text>
          </View>
        </View>

      </View>

      {/* Tabs and Sort Container */}
      <View style={styles.tabsAndSortContainer}>
        <View style={styles.tabsRow}>
          <View style={styles.segmentedControlWrapper}>
            <SegmentedControl
              segments={tabs}
              selectedIndex={selectedTab}
              onSelectionChange={(index) => {
                console.log('Tab selection changed to:', index, tabs[index]);
                setSelectedTab(index);
              }}
            />
          </View>
          
          <View style={styles.sortContainer}>
            <Pressable 
              style={styles.sortButton}
              onPress={() => setShowSortDropdown(!showSortDropdown)}>
              <Text style={styles.sortButtonText}>
                {sortBy === 'reputation' ? 'By Reputation' : 'Most Recent'}
              </Text>
              <ChevronDown size={16} color={colors.foreground} />
            </Pressable>
            
            {showSortDropdown && (
              <View style={styles.sortDropdown}>
                <Pressable 
                  style={[
                    styles.sortOption,
                    sortBy === 'reputation' && styles.sortOptionActive
                  ]}
                  onPress={() => handleSortChange('reputation')}>
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === 'reputation' && styles.sortOptionActiveText
                  ]}>
                    By Reputation
                  </Text>
                </Pressable>
                <Pressable 
                  style={[
                    styles.sortOption,
                    styles.sortOptionLast,
                    sortBy === 'recent' && styles.sortOptionActive
                  ]}
                  onPress={() => handleSortChange('recent')}>
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === 'recent' && styles.sortOptionActiveText
                  ]}>
                    Most Recent
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Votes List */}
      <FlatList
        style={styles.votesList}
        data={currentData}
        renderItem={renderVoteUser}
        keyExtractor={(item) => item.voteAddress}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 20}}
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
        ListEmptyComponent={
          votesLoading && currentData.length === 0 ? (
            <FeedSkeleton itemCount={5} showImages={false} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {selectedTab === 0 ? 'No upvotes yet' : 'No downvotes yet'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}