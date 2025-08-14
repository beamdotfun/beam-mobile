import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  StyleSheet,
  Animated,
  Linking,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  MapPin,
  ExternalLink,
  Calendar,
  Pin,
  Zap,
  Plus,
  Eye,
  DollarSign,
  ThumbsUp,
  Shield,
  ArrowUpRight,
} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {Button} from '../../components/ui/button';
import {PostCard} from '../../components/social/PostCard';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {StatusDot} from '../../components/ui/StatusDot';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {useNetworkStatus} from '../../hooks/useNetworkStatus';
import {useWalletStore} from '../../store/wallet';
import {useVoting} from '../../hooks/useBlockchainTransactions';
import {useWatchlist} from '../../hooks/useWatchlist';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {Post} from '../../types/social';
import {getAvatarFallback} from '../../lib/utils';
import {badgeAPI, BadgeResponse} from '../../services/api/badges';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {getProfilePictureUrl, getUserProfilePicture} from '../../utils/profileUtils';
import {logMemoryUsage, isMemoryUsageCritical, forceGarbageCollection} from '../../utils/memoryUtils';
import {ProfileSkeleton} from '../../components/loading/FeedSkeleton';
import {Skeleton} from '../../components/ui/Skeleton';
import {debouncedNavigate} from '../../utils/navigationUtils';
import {useScreenCleanup} from '../../hooks/useScreenCleanup';

const {width} = Dimensions.get('window');

// Note: Now using shared getProfilePictureUrl from utils/profileUtils.ts

interface ProfileScreenProps {
  navigation: any;
  route: {
    params?: {
      walletAddress?: string;
      profileVisitFrom?: string; // Track where the profile visit came from
    };
  };
}

export default function ProfileScreen({navigation, route}: ProfileScreenProps) {
  console.log('🔍 ProfileScreen: ================================');
  console.log('🔍 ProfileScreen: Component rendered with route params:', JSON.stringify(route.params, null, 2));
  console.log('🔍 ProfileScreen: Route name:', route.name);
  console.log('🔍 ProfileScreen: Navigation available:', !!navigation);
  console.log('🔍 ProfileScreen: Component mount timestamp:', new Date().toISOString());
  
  // Automatic memory cleanup on unmount
  const isMountedRef = useScreenCleanup('ProfileScreen');
  const loadingInProgressRef = useRef(false);
  
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {isOnline} = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userBadges, setUserBadges] = useState<BadgeResponse[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {connectionStatus} = useWalletStore();
  
  // Use profileStore for profile data
  const {
    currentProfile,
    userPosts,
    socialStats,
    loading,
    postsLoading,
    error,
    loadProfile,
    loadUserPosts,
    followUser,
    unfollowUser,
    clearForNavigation,
  } = useProfileStore();

  // Backend uses primary_wallet_address, try multiple field names for compatibility
  const userWalletAddress = user?.primary_wallet_address || 
                           user?.primaryWalletAddress || 
                           user?.walletAddress ||
                           user?.wallet_address; // Add wallet_address for compatibility with PostCard
  
  // Get wallet address from route params (use username as fallback if no walletAddress provided)
  const routeWalletAddress = route.params?.walletAddress || route.params?.username;
  
  // Add effect to log param changes
  React.useEffect(() => {
    console.log('🔍 ProfileScreen: Route params changed:', {
      walletAddress: route.params?.walletAddress,
      username: route.params?.username,
      allParams: route.params
    });
  }, [route.params?.walletAddress, route.params?.username]);
  
  // Debug the route params types and values
  console.log('🔍 ProfileScreen DEBUG: Raw route params types:', {
    'typeof walletAddress': typeof route.params?.walletAddress,
    'walletAddress value': route.params?.walletAddress,
    'walletAddress length': route.params?.walletAddress?.length,
    'typeof username': typeof route.params?.username,
    'username value': route.params?.username,
    'resolved routeWalletAddress': routeWalletAddress
  });
  
  // Fixed logic: Show own profile if no route param OR if wallet addresses match
  // This properly handles both direct navigation to Profile tab and clicking other users
  const isOwnProfile = !routeWalletAddress || routeWalletAddress === userWalletAddress;
  
  // Target wallet address - use route param if provided, otherwise own wallet
  // CRITICAL FIX: Don't use empty string as wallet address - it causes API crashes
  const targetWalletAddress = routeWalletAddress || userWalletAddress || null;
  
  // Blockchain interactions
  const {upvote, downvote, loading: votingLoading, error: votingError} = useVoting();
  const {toggleFollow, isFollowing, loading: watchlistLoading, error: watchlistError} = useWatchlist();
  
  // State for following status
  const [following, setFollowing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isOnline) return;
    
    setRefreshing(true);
    try {
      // Reload profile data with tracking parameter
      await loadProfile(routeWalletAddress, route.params?.profileVisitFrom);
      
      // Reload user posts
      if (targetWalletAddress) {
        await loadUserPosts(targetWalletAddress, true);
        // Reload badges
        await loadUserBadges(targetWalletAddress);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, routeWalletAddress, targetWalletAddress, loadProfile, loadUserPosts, loadUserBadges]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || loading);
  }, [refreshing, loading, handleRefreshStateChange]);
    
  console.log('🔍 ProfileScreen: Calculated values:');
  console.log('🔍 ProfileScreen: route.params:', route.params);
  console.log('🔍 ProfileScreen: routeWalletAddress:', routeWalletAddress);
  console.log('🔍 ProfileScreen: Wallet address fields check:');
  console.log('  - user?.primary_wallet_address:', user?.primary_wallet_address);
  console.log('  - user?.primaryWalletAddress:', user?.primaryWalletAddress);
  console.log('  - user?.walletAddress:', user?.walletAddress);
  console.log('  - user?.wallet_address:', user?.wallet_address);
  console.log('  - userWalletAddress (resolved):', userWalletAddress);
  console.log('🔍 ProfileScreen: targetWalletAddress:', targetWalletAddress);
  console.log('🔍 ProfileScreen: isOwnProfile logic:');
  console.log('  - No route params?:', !routeWalletAddress);
  console.log('  - Addresses match?:', routeWalletAddress === userWalletAddress);
  console.log('  - Final isOwnProfile:', isOwnProfile);
  console.log('🔍 ProfileScreen: user object exists:', !!user);
  console.log('🔍 ProfileScreen: Full user object keys:', user ? Object.keys(user) : 'no user');
  if (user) {
    console.log('🔍 ProfileScreen: User object details:', JSON.stringify(user, null, 2));
  }
  console.log('  - currentProfile:', currentProfile ? 'exists' : 'null');
  if (currentProfile) {
    console.log('🔍 ProfileScreen: currentProfile details:', {
      userWallet: currentProfile.userWallet,
      displayName: currentProfile.displayName,
      description: currentProfile.description
    });
  }
  console.log('  - loading:', loading);
  console.log('  - error:', error);

  // Get profile data from store or use logged-in user data
  // Important: Don't fall back to user data when loading another user's profile
  const profileData = currentProfile || (isOwnProfile && !routeWalletAddress && user && userWalletAddress ? {
    userWallet: userWalletAddress,
    displayName: user.displayName || user.name || 'Unknown',
    description: user.bio || '',
    profilePicture: user.profilePicture || user.avatar_url,
    bannerImage: undefined,
    isVerifiedCreator: user.isVerified || false,
    postCount: 0,
    followerCount: 0,
    followingCount: 0,
    onChainReputation: user.onChainReputation || user.reputation || 0,
    tipsSentCount: 0,
    tipsSentTotal: 0,
    tipsReceivedCount: 0,
    tipsReceivedTotal: 0,
    lastActiveSlot: 0,
    joinedAt: user.joinedAt || new Date().toISOString(),
    isActive: true,
    nftVerified: user.hasVerifiedNFT || false,
    snsVerified: user.hasVerifiedSNS || false,
    isPrivate: false,
    allowDirectMessages: true,
    showActivity: true,
    epochStreak: user.epochStreak || 0,
    reputation: user.reputation || user.onChainReputation || 0,
    showBadgesOnProfile: true,
  } : null);

  // Display name as-is from backend (backend handles all formatting)
  const getUsernameDisplay = () => {
    if (!profileData) return 'Unknown';
    
    // Backend handles all display name formatting, prefixes, and suffixes
    // Just show displayName as-is
    if (profileData.displayName) {
      return profileData.displayName;
    }
    
    // Fallback to abbreviated wallet address only if no displayName
    if (profileData.userWallet || targetWalletAddress) {
      const wallet = profileData.userWallet || targetWalletAddress;
      return `${wallet.slice(0, 5)}...${wallet.slice(-5)}`;
    }
    
    return 'Unknown';
  };

  // Load user badges function
  const loadUserBadges = useCallback(async (targetWalletAddress: string | null) => {
    if (!targetWalletAddress) {
      console.log('🔍 ProfileScreen: No wallet address for badges');
      return;
    }
    console.log('🔍 ProfileScreen: Loading badges for user:', targetWalletAddress);
    setBadgesLoading(true);
    
    try {
      let badges: BadgeResponse[] = [];
      
      if (isOwnProfile) {
        // For own profile, use authenticated endpoint
        console.log('🔍 ProfileScreen: Loading own badges via authenticated endpoint');
        const badgesData = await badgeAPI.getUserBadges();
        // Limit badges to prevent memory issues
        badges = badgesData.badges
          .filter(badge => badge.earned && badge.display_enabled)
          .slice(0, 10); // Limit to 10 badges max
      } else {
        // For other users, use public endpoint
        console.log('🔍 ProfileScreen: Loading public badges for:', targetWalletAddress);
        const publicBadgesData = await badgeAPI.getPublicBadges(targetWalletAddress);
        // Limit badges to prevent memory issues
        badges = publicBadgesData.badges.slice(0, 10); // Limit to 10 badges max
      }
      
      console.log('🔍 ProfileScreen: Badges loaded successfully');
      console.log('  - badges count:', badges.length);
      console.log('  - badge names:', badges.map(b => b.badge_name));
      
      setUserBadges(badges);
      
    } catch (error) {
      console.error('🚨 ProfileScreen: Failed to load badges:', error);
      // Don't crash on badge loading errors - just show no badges
      setUserBadges([]);
    } finally {
      setBadgesLoading(false);
    }
  }, [isOwnProfile]);

  // Immediate profile clearing when switching users - runs synchronously before render
  useEffect(() => {
    // Clear profile data IMMEDIATELY when routeWalletAddress changes to prevent flash
    if (routeWalletAddress && currentProfile && currentProfile.userWallet !== routeWalletAddress) {
      console.log('🚨 ProfileScreen: IMMEDIATE clear - switching from', currentProfile.userWallet, 'to', routeWalletAddress);
      clearForNavigation();
    }
  }, [routeWalletAddress, clearForNavigation]); // Only depend on routeWalletAddress changes

  useEffect(() => {
    console.log('🔍 ProfileScreen useEffect: Running with params:', {routeWalletAddress, targetWalletAddress, isOwnProfile});
    logMemoryUsage('ProfileScreen - Component Mount');
    
    // Check memory before loading data
    if (isMemoryUsageCritical()) {
      console.warn('⚠️ ProfileScreen: Memory usage is critical - forcing cleanup');
      forceGarbageCollection();
    }
    
    let isCancelled = false;
    
    const loadProfileData = async () => {
      // Prevent duplicate loads
      if (loadingInProgressRef.current) {
        console.log('⚠️ ProfileScreen: Load already in progress, skipping duplicate');
        return;
      }
      
      loadingInProgressRef.current = true;
      
      try {
        // Clear immediately when switching to a different user to prevent flash
        if (routeWalletAddress && !isOwnProfile) {
          console.log('🔍 ProfileScreen: Clearing profile data IMMEDIATELY before loading new user');
          if (isMountedRef.current) {
            clearForNavigation(); // Use new method that sets loading state immediately
          }
        }
        
        // Load profile data with tracking parameter
        const profileVisitFrom = route.params?.profileVisitFrom;
        if (profileVisitFrom) {
          console.log('📊 ProfileScreen: Loading profile with visit tracking from post:', profileVisitFrom);
        }
        
        // Load profile first - use targetWalletAddress which correctly resolves the address
        if (!isCancelled && isMountedRef.current && targetWalletAddress) {
          console.log('🔍 ProfileScreen: Loading profile for targetWalletAddress:', targetWalletAddress);
          await loadProfile(targetWalletAddress, profileVisitFrom);
          console.log('🔍 ProfileScreen: loadProfile completed successfully');
        }
        
        // Only load additional data if profile loaded successfully
        if (targetWalletAddress && !isCancelled && isMountedRef.current) {
          // Add small delay to prevent memory overload
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('🔍 ProfileScreen: Loading user posts for walletAddress:', targetWalletAddress);
          await loadUserPosts(targetWalletAddress, true);
          console.log('🔍 ProfileScreen: loadUserPosts completed successfully');
          
          // Load badges with another small delay
          if (!isCancelled && isMountedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            await loadUserBadges(targetWalletAddress);
          }
        }
      } catch (error) {
        if (!isCancelled && isMountedRef.current) {
          console.error('🚨 ProfileScreen: Error loading profile data:', error);
          // Set a user-friendly error instead of crashing
          useProfileStore.setState({ 
            error: 'Unable to load profile. Please try again.', 
            loading: false 
          });
        }
      } finally {
        loadingInProgressRef.current = false;
      }
    };
    
    loadProfileData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isCancelled = true;
      isMountedRef.current = false;
      loadingInProgressRef.current = false;
      logMemoryUsage('ProfileScreen - Component Cleanup');
      
      // Clear posts to free memory when leaving profile
      if (!isOwnProfile) {
        console.log('🧹 ProfileScreen: Clearing posts on unmount to free memory');
        useProfileStore.setState({ userPosts: [] });
      }
    };
  }, [routeWalletAddress, targetWalletAddress, isOwnProfile, clearForNavigation]);

  // Check following status when component mounts or wallet changes
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!isOwnProfile && targetWalletAddress) {
        try {
          console.log('🔍 ProfileScreen: Checking watch status for:', targetWalletAddress);
          const followingStatus = await isFollowing(targetWalletAddress);
          console.log('👁️ ProfileScreen: Watch status result:', followingStatus, 'current state:', following);
          if (followingStatus !== following) {
            console.log(`🔄 ProfileScreen: Updating watch state from ${following} to ${followingStatus}`);
            setFollowing(followingStatus);
          } else {
            console.log('✅ ProfileScreen: Watch status matches current state, no update needed');
          }
        } catch (err) {
          console.warn('Failed to check watch status:', err);
        }
      }
    };

    if (targetWalletAddress) {
      checkFollowingStatus();
    }
  }, [targetWalletAddress, isOwnProfile, isFollowing]);

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

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
    avatarButton: {
      position: 'relative',
    },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerSide: {
      flex: 1,
      flexDirection: 'row',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerSideRight: {
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
    animatedHeader: {
      position: 'absolute',
      top: insets.top + 56, // Below the FeedHeader
      left: 0,
      right: 0,
      height: 56,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      zIndex: 10,
    },
    scrollContent: {
      flex: 1,
    },
    animatedHeaderTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    animatedEnergyChip: {
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
    scrollContainer: {
      paddingTop: 16, // No need for insets.top since FeedHeader handles it
      paddingBottom: insets.bottom + 72,
    },
    headerCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      paddingTop: 12,
      paddingHorizontal: 0,
      paddingBottom: 16,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    headerContent: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingTop: 4,
      alignItems: 'flex-start',
    },
    avatarContainer: {
      marginRight: 12,
    },
    profileInfo: {
      flex: 1,
      paddingRight: 12,
    },
    bioSection: {
      paddingLeft: 12,
      paddingRight: 12,
      marginTop: 12,
      marginBottom: 12,
    },
    reputationStatsSection: {
      backgroundColor: '#EBF8FF',
      borderWidth: 1,
      borderColor: '#BEE3F8',
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 0,
      borderRadius: 8,
      padding: 12,
    },
    reputationStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    locationText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    websiteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    websiteText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    linkText: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    energyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.success,
      gap: 4,
      alignSelf: 'flex-start',
    },
    energyText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    userNameSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    displayName: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
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
    profileMoreButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#BBF7D0',
      backgroundColor: '#ECFDF5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaStatsRow: {
      marginTop: 4,
    },
    verifiedText: {
      color: colors.success,
      fontSize: 17,
      fontWeight: '600',
    },
    bio: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: '#6B7280',
      fontFamily: 'Inter-Regular',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    statText: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    clickableStatText: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    statDivider: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginHorizontal: 8,
    },
    badgeSection: {
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 4,
      minHeight: 24,
    },
    noBadgesText: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      paddingVertical: 2,
    },
    badgeScrollView: {
      paddingRight: 8,
    },
    badge: {
      backgroundColor: colors.muted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
    },
    badgeText: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    actionButtonGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 80,
    },
    moreButton: {
      height: 44,
      width: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    moreButtonText: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 16,
    },
    pinnedPostContainer: {
      marginBottom: 8,
    },
    historySection: {
      flex: 1,
    },
    offlineOverlay: {
      opacity: isOnline ? 1 : 0.6,
    },
  });

  const handleAvatarPress = () => {
    if (isOwnProfile) {
      // Open avatar picker
      console.log('Open avatar picker');
    }
  };

  const handleWebsitePress = () => {
    if (profileData.website) {
      Linking.openURL(profileData.website);
    }
  };

  const handleActionPress = (action: string) => {
    if (!isOnline) {
      console.log('User is offline - action disabled');
      return;
    }

    console.log(`${action} pressed`);
  };

  const handlePostPress = useCallback((post: Post) => {
    // Check if this is a thread root post and route appropriately
    if (post.threadData || post.isThreadRoot || post.threadPostCount > 0) {
      console.log('🧵 ProfileScreen.handlePostPress: Navigating to thread details for post:', post.id);
      navigation.navigate('ThreadDetails', {
        threadId: post.signature || post.transactionHash || post.id?.toString(),
        post: post
      });
    } else {
      console.log('📄 ProfileScreen.handlePostPress: Navigating to post details for regular post:', post.id);
      navigation.navigate('PostDetail', {postId: post.transaction_hash || post.signature || post.id, post});
    }
  }, [navigation]);

  const handleVote = useCallback(() => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please check your connection and try again.');
      return;
    }

    if (isOwnProfile) {
      Alert.alert('Invalid Action', 'You cannot vote for yourself.');
      return;
    }

    if (!targetWalletAddress) {
      Alert.alert('Error', 'Unable to determine user to vote for.');
      return;
    }

    // Navigate to vote selection screen
    navigation.navigate('VoteSelection', {
      targetWallet: targetWalletAddress,
      targetName: profileData?.displayName,
    });
  }, [isOnline, isOwnProfile, targetWalletAddress, navigation, profileData?.displayName]);

  const handleTip = useCallback(() => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please check your connection and try again.');
      return;
    }

    if (isOwnProfile) {
      Alert.alert('Invalid Action', 'You cannot tip yourself.');
      return;
    }

    if (!targetWalletAddress) {
      Alert.alert('Error', 'Unable to determine user to tip.');
      return;
    }

    // Navigate to tip screen
    navigation.navigate('SendTip', {
      recipientWallet: targetWalletAddress,
      recipientName: profileData?.displayName,
      recipientAvatar: getProfilePictureUrl(profileData?.profilePicture),
    });
  }, [isOnline, isOwnProfile, targetWalletAddress, navigation, profileData?.displayName, profileData?.profilePicture]);

  const handleWatch = useCallback(async () => {
    if (!isOnline) {
      setStatusMessage({
        type: 'error',
        message: 'You are currently offline. Please check your connection and try again.'
      });
      return;
    }

    if (isOwnProfile) {
      setStatusMessage({
        type: 'info',
        message: 'You cannot watch yourself.'
      });
      return;
    }

    if (!targetWalletAddress) {
      setStatusMessage({
        type: 'error',
        message: 'Unable to determine user to watch.'
      });
      return;
    }

    setStatusMessage(null); // Clear any previous status messages

    // Haptic feedback
    ReactNativeHapticFeedback.trigger('impactLight');

    // Optimistic update - toggle the following state immediately
    const newFollowingState = !following;
    console.log(`🚀 ProfileScreen: Optimistic update - changing from ${following} to ${newFollowingState}`);
    setFollowing(newFollowingState);
    
    // Show success message immediately for better UX
    const actionText = newFollowingState ? 'watching' : 'no longer watching';
    setStatusMessage({
      type: 'success',
      message: `You are now ${actionText} ${profileData?.displayName || 'this user'}.`
    });

    try {
      console.log(`🔄 Toggling follow status for: ${targetWalletAddress}`);
      const result = await toggleFollow(targetWalletAddress);
      
      // Verify the backend state matches our optimistic update
      const actualFollowingState = result.action === 'followed';
      console.log(`🔍 ProfileScreen: Backend returned action '${result.action}', actualState: ${actualFollowingState}, optimisticState: ${newFollowingState}`);
      
      if (actualFollowingState !== newFollowingState) {
        console.log(`⚠️ ProfileScreen: Mismatch detected! Correcting state from ${newFollowingState} to ${actualFollowingState}`);
        // Backend state doesn't match - revert to actual state
        setFollowing(actualFollowingState);
        const actualActionText = actualFollowingState ? 'watching' : 'no longer watching';
        setStatusMessage({
          type: 'success',
          message: `You are now ${actualActionText} ${profileData?.displayName || 'this user'}.`
        });
      } else {
        console.log(`✅ ProfileScreen: Backend state matches optimistic update - keeping state as ${newFollowingState}`);
      }
      
      console.log(`✅ Successfully ${result.action} user: ${targetWalletAddress}`);
    } catch (err: any) {
      console.error(`❌ Failed to toggle follow for: ${targetWalletAddress}`, err);
      
      // Revert the optimistic update on error
      setFollowing(!newFollowingState);
      
      let errorMessage = 'Failed to update watch status. Please try again.';
      
      if (err.message?.includes("hasn't posted yet")) {
        errorMessage = "This user hasn't posted yet and can't be watched. They need to make their first post before you can watch them.";
      } else if (err.message?.includes('already following')) {
        errorMessage = 'You are already watching this user.';
      } else if (err.message?.includes('not following')) {
        errorMessage = 'You are not watching this user.';
      }
      
      setStatusMessage({
        type: 'error',
        message: errorMessage
      });
    }
  }, [isOnline, isOwnProfile, targetWalletAddress, toggleFollow, profileData?.displayName, following]);

  const handleUserPress = (userId: number | undefined | null, walletAddress: string) => {
    console.log('🔍 ProfileScreen.handleUserPress: Called with userId and walletAddress:', {userId, walletAddress});
    console.log('🔍 ProfileScreen.handleUserPress: Current userWalletAddress:', userWalletAddress);
    console.log('🔍 ProfileScreen.handleUserPress: Are they the same?', walletAddress === userWalletAddress);
    console.log('🔍 ProfileScreen.handleUserPress: Types:', {
      'typeof userId': typeof userId,
      'typeof walletAddress': typeof walletAddress,
      'walletAddress length': walletAddress?.length
    });
    
    // Use wallet-based navigation (userId endpoint not available)
    if (walletAddress) {
      console.log('🔍 ProfileScreen.handleUserPress: Navigating with walletAddress:', walletAddress);
      navigation.navigate('UserProfile', {walletAddress});
    } else {
      console.error('🚨 ProfileScreen.handleUserPress: No walletAddress provided');
    }
  };

  const handleQuotePress = (post: Post) => {
    navigation.navigate('CreatePost', {
      quotedPost: post,
    });
  };

  const handleThreadPress = useCallback(
    (post: Post) => {
      navigation.navigate('ThreadDetails', {
        threadId: post.signature || post.transactionHash || post.id?.toString(),
        post: post
      });
    },
    [navigation],
  );

  const handleQuotedPostPress = useCallback(
    (quotedPost: any) => {
      navigation.navigate('PostDetail', {
        postId: quotedPost.postSignature || quotedPost.signature,
        post: null
      });
    },
    [navigation],
  );

  const renderBadge = ({item}: {item: BadgeResponse}) => (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{item.badge_name}</Text>
    </View>
  );

  const renderPost = ({item}: {item: Post}) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item)}
      onUserPress={handleUserPress}
      onQuotePress={handleQuotePress}
      onThreadPress={handleThreadPress}
      onQuotedPostPress={handleQuotedPostPress}
    />
  );


  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false); // Close sidebar first
    
    if (screen === 'Profile' && params?.walletAddress === userWalletAddress) {
      // Already viewing own profile, nothing to do
      return;
    }
    
    // Screens that exist in Feed tab
    const feedTabScreens = [
      'Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
      'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
      'Posts', 'Receipts', 'Watchlist', 'Tokens', 'Points', 'Business', 'HelpCenter'
    ];
    
    if (feedTabScreens.includes(screen)) {
      // Navigate to Feed tab first, then to the specific screen
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Feed', {
          screen: screen,
          params: params
        });
      }
    } else if (screen === 'Profile') {
      // Navigate to current user's profile
      console.log('🔍 ProfileScreen.handleSidebarNavigate: Profile clicked');
      console.log('🔍 ProfileScreen.handleSidebarNavigate: Params received:', params);
      console.log('🔍 ProfileScreen.handleSidebarNavigate: Current route params:', route.params);
      
      // Check if we need to navigate to own profile
      const targetWallet = params?.walletAddress;
      const currentWallet = route.params?.walletAddress;
      
      console.log('🔍 ProfileScreen.handleSidebarNavigate: Target wallet:', targetWallet);
      console.log('🔍 ProfileScreen.handleSidebarNavigate: Current wallet:', currentWallet);
      
      if (targetWallet && targetWallet !== currentWallet) {
        // Different wallet, navigate to it
        console.log('🔍 ProfileScreen.handleSidebarNavigate: Navigating to different profile');
        // Use popToTop to clear the stack and then navigate
        navigation.popToTop();
        setTimeout(() => {
          navigation.navigate('UserProfile', params);
        }, 100);
      } else if (!targetWallet && currentWallet) {
        // No target wallet but we're on someone else's profile, go to own profile
        console.log('🔍 ProfileScreen.handleSidebarNavigate: Navigating to own profile (no wallet in params)');
        navigation.popToTop();
        setTimeout(() => {
          navigation.navigate('Profile');
        }, 100);
      } else {
        console.log('🔍 ProfileScreen.handleSidebarNavigate: Same profile, no navigation needed');
      }
    } else {
      console.log(`Navigate to ${screen}`, params);
    }
  }, [navigation, user]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Profile"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            opacity: headerOpacity,
          },
        ]}>
        <Text style={styles.animatedHeaderTitle}>
          {profileData?.displayName || 'Profile'}
        </Text>
        {profileData && profileData.onChainReputation > 0 && (
          <View style={styles.animatedEnergyChip}>
            <Zap size={12} color={colors.success} />
            <Text
              style={{fontSize: 12, fontWeight: '600', color: colors.success}}>
              {profileData.onChainReputation}
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
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
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}
        scrollEventThrottle={16}>
        {/* Show loading state if profile data is not loaded yet */}
        {loading && !profileData ? (
          <ProfileSkeleton />
        ) : profileData ? (
          <>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.avatarContainer}
              onPress={handleAvatarPress}>
              <Avatar
                src={getProfilePictureUrl(profileData?.profilePicture)}
                fallback={getAvatarFallback({
                  displayName: profileData?.displayName,
                  username: profileData?.username,
                  walletAddress: profileData?.walletAddress || profileData?.userWallet || walletAddress
                })}
                size="xl"
                showRing={profileData?.isVerifiedCreator || profileData?.nftVerified || profileData?.snsVerified}
                ringColor={colors.success}
                shape={profileData?.brandAddress ? 'square' : 'circle'}
              />
            </Pressable>

            <View style={styles.profileInfo}>
              <View style={styles.userNameRow}>
                <View style={styles.userNameSection}>
                  <Text style={styles.displayName}>
                    {getUsernameDisplay()}
                  </Text>
                  {(profileData?.isVerifiedCreator || profileData?.nftVerified || profileData?.snsVerified) && (
                    <Text style={styles.verifiedText}> ✓</Text>
                  )}
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  {/* Edit Profile button for own profile */}
                  {isOwnProfile && (
                    <Pressable
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      }}
                      onPress={() => {
                        console.log('🔍 ProfileScreen: Edit Profile button pressed');
                        console.log('🔍 ProfileScreen: Navigating to GeneralSettings screen');
                        navigation.navigate('GeneralSettings');
                      }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: colors.foreground,
                        fontFamily: 'Inter-Medium',
                      }}>
                        Edit
                      </Text>
                    </Pressable>
                  )}

                  
                  {/* Reputation pill - always show if data exists */}
                  {profileData && (profileData.onChainReputation > 0 || profileData.reputation > 0) && (
                    <View style={styles.reputationPill}>
                      <Zap size={12} color={colors.success} />
                      <Text style={styles.reputationText}>{profileData.onChainReputation || profileData.reputation || 0}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.metaRow}>
                {/* Only show SNS domain if it's different from the display name to avoid duplication */}
                {profileData?.snsDomain && profileData.snsDomain !== profileData.displayName && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>{profileData.snsDomain}</Text>
                  </View>
                )}
                {/* Only show brand name if it's different from the display name to avoid duplication */}
                {profileData?.brandName && profileData.brandName !== profileData.displayName && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>{profileData.brandName}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Calendar size={12} color="#6B7280" />
                  <Text style={styles.metaText}>
                    Joined {profileData?.joinedAt ? new Date(profileData.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                  </Text>
                </View>
              </View>
              
              {/* Stats Row - Right under the joined date */}
              <View style={styles.metaStatsRow}>
                <Text style={styles.metaText}>{profileData?.postCount || 0} posts • 🔥 {profileData?.epochStreak || 0} epoch streak</Text>
              </View>

              {/* Location Row - Inside profileInfo container */}
              {profileData?.location && (
                <View style={[styles.metaItem, {marginTop: 4}]}>
                  <MapPin size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{profileData.location}</Text>
                </View>
              )}

              {/* Website Row - Inside profileInfo container */}
              {profileData?.website && (
                <Pressable style={[styles.metaItem, {marginTop: 4}]} onPress={handleWebsitePress}>
                  <ExternalLink size={12} color="#6B7280" />
                  <Text style={[styles.metaText, styles.linkText]}>
                    {profileData.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Removed standalone energy chip since it's now in the top right */}
          </View>

          {/* Bio Section - Full Width */}
          {(profileData?.description || profileData?.bio) && (
            <View style={styles.bioSection}>
              <Text style={styles.bio} numberOfLines={3} ellipsizeMode="tail">
                {profileData.description || profileData.bio}
              </Text>
            </View>
          )}

          {/* Badge Section - Below bio, above reputation stats */}
          {/* Show badges if user has badges enabled in settings */}
          {(profileData?.showBadgesOnProfile ?? true) && (
            <View style={styles.badgeSection}>
              {userBadges.length > 0 || profileData?.nftVerified || profileData?.snsVerified || profileData?.brandName ? (
                <FlatList
                  data={[
                    ...userBadges,
                    // Include verification badges as legacy display
                    ...(profileData?.nftVerified && profileData.nftMetadata ? [{
                      id: -1,
                      badge_name: `NFT: ${profileData.nftMetadata.name}`,
                      badge_description: 'NFT Verified',
                      earned: true,
                      display_enabled: true
                    } as BadgeResponse] : []),
                    ...(profileData?.snsVerified && profileData.snsDomain ? [{
                      id: -2,
                      badge_name: `SNS: ${profileData.snsDomain}`,
                      badge_description: 'SNS Verified',
                      earned: true,
                      display_enabled: true
                    } as BadgeResponse] : []),
                    ...(profileData?.brandName ? [{
                      id: -3,
                      badge_name: `Brand: ${profileData.brandName}`,
                      badge_description: 'Brand Verified',
                      earned: true,
                      display_enabled: true
                    } as BadgeResponse] : []),
                  ]}
                  renderItem={renderBadge}
                  keyExtractor={item => item?.id?.toString() || `badge-${Math.random()}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.badgeScrollView}
                  snapToAlignment="start"
                  snapToInterval={100}
                  decelerationRate="fast"
                />
              ) : (
                <Text style={styles.noBadgesText}>No badges to display</Text>
              )}
              {badgesLoading && (
                <View style={{ marginLeft: 12 }}>
                  <Skeleton width={20} height={20} borderRadius={10} />
                </View>
              )}
            </View>
          )}

          {/* Reputation Metrics Grid */}
          <Pressable 
            style={{
              backgroundColor: colors.muted,
              marginHorizontal: 16,
              marginTop: 24,
              marginBottom: 16,
              borderRadius: 12,
              shadowColor: colors.foreground,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
              overflow: 'hidden',
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              console.log('Navigate to Reputation screen for user:', targetWalletAddress);
              navigation.navigate('Reputation', { walletAddress: targetWalletAddress });
            }}>
            
            {/* 2x2 Grid */}
            <View style={{
              flexDirection: 'column',
            }}>
              {/* First Row */}
              <View style={{
                flexDirection: 'row',
              }}>
                {/* This Epoch */}
                <View style={{
                  flex: 1,
                  height: 72,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: (profileData?.gainThisEpoch || profileData?.scoreThisEpoch || 0) >= 0 
                      ? colors.success 
                      : '#FF8C00', // Orange color for negative values
                    fontFamily: 'Inter-Bold',
                  }}>
                    {profileData?.gainThisEpoch || profileData?.scoreThisEpoch || 0}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter-Medium',
                    marginTop: 4,
                  }}>
                    This Epoch
                  </Text>
                </View>
                
                {/* All Time - with arrow icon */}
                <View style={{
                  flex: 1,
                  height: 72,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  position: 'relative',
                }}>
                  {/* Arrow icon in upper-right corner */}
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: 0.6,
                  }}>
                    <ArrowUpRight size={14} color={colors.mutedForeground} />
                  </View>
                  
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: (profileData?.totalReputation || profileData?.onChainReputation || profileData?.reputation || 0) >= 0 
                      ? colors.success 
                      : '#FF8C00', // Orange color for negative values
                    fontFamily: 'Inter-Bold',
                  }}>
                    {profileData?.totalReputation || profileData?.onChainReputation || profileData?.reputation || 0}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter-Medium',
                    marginTop: 4,
                  }}>
                    All Time
                  </Text>
                </View>
              </View>
              
              {/* Second Row */}
              <View style={{
                flexDirection: 'row',
              }}>
                {/* Upvotes */}
                <View style={{
                  flex: 1,
                  height: 72,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRightWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: colors.foreground,
                    fontFamily: 'Inter-Bold',
                  }}>
                    {profileData?.upvotesReceived || 0}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter-Medium',
                    marginTop: 4,
                  }}>
                    Upvotes
                  </Text>
                </View>
                
                {/* Downvotes */}
                <View style={{
                  flex: 1,
                  height: 72,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: colors.foreground,
                    fontFamily: 'Inter-Bold',
                  }}>
                    {profileData?.downvotesReceived || 0}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter-Medium',
                    marginTop: 4,
                  }}>
                    Downvotes
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>


        </View>

        {/* Status Message */}
        {statusMessage && (
          <View style={{
            backgroundColor: statusMessage.type === 'success' ? colors.success + '10' : 
                            statusMessage.type === 'error' ? colors.destructive + '10' : 
                            colors.primary + '10',
            borderColor: statusMessage.type === 'success' ? colors.success : 
                         statusMessage.type === 'error' ? colors.destructive : 
                         colors.primary,
            borderWidth: 1,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 12,
            padding: 16,
          }}>
            <Text style={{
              color: statusMessage.type === 'success' ? colors.success : 
                     statusMessage.type === 'error' ? colors.destructive : 
                     colors.primary,
              fontSize: 14,
              lineHeight: 20,
              textAlign: 'center',
              fontFamily: 'Inter-Regular',
            }}>
              {statusMessage.message}
            </Text>
          </View>
        )}

        {/* Action Bar - Only show for other users */}
        {!isOwnProfile && (
          <View style={{
            backgroundColor: colors.card,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 12,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            shadowColor: colors.foreground,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {/* Watch */}
              <Pressable
                onPress={handleWatch}
                disabled={isOwnProfile}
                style={({pressed}) => ({
                  alignItems: 'center',
                  flex: 1,
                  opacity: (pressed || isOwnProfile) ? 0.5 : 1,
                })}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: following ? colors.success : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  <Eye size={18} color="#FFFFFF" />
                </View>
                <Text style={{
                  fontSize: 13,
                  color: colors.foreground,
                  fontWeight: '500',
                  fontFamily: 'Inter-Medium',
                  textAlign: 'center',
                }} numberOfLines={1}>
                  {following ? 'Watching' : 'Watch'}
                </Text>
              </Pressable>

              {/* Vote */}
              <Pressable
                onPress={handleVote}
                disabled={votingLoading || isOwnProfile}
                style={({pressed}) => ({
                  alignItems: 'center',
                  flex: 1,
                  opacity: (pressed || votingLoading || isOwnProfile) ? 0.5 : 1,
                })}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  <ThumbsUp size={18} color="#FFFFFF" />
                </View>
                <Text style={{
                  fontSize: 13,
                  color: colors.foreground,
                  fontWeight: '500',
                  fontFamily: 'Inter-Medium',
                  textAlign: 'center',
                }} numberOfLines={1}>
                  {votingLoading ? 'Voting...' : 'Vote'}
                </Text>
              </Pressable>

              {/* Tip */}
              <Pressable
                onPress={handleTip}
                disabled={isOwnProfile}
                style={({pressed}) => ({
                  alignItems: 'center',
                  flex: 1,
                  opacity: (pressed || isOwnProfile) ? 0.5 : 1,
                })}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  <DollarSign size={18} color="#FFFFFF" />
                </View>
                <Text style={{
                  fontSize: 13,
                  color: colors.foreground,
                  fontWeight: '500',
                  fontFamily: 'Inter-Medium',
                  textAlign: 'center',
                }} numberOfLines={1}>
                  Tip
                </Text>
              </Pressable>

              {/* Verify */}
              <Pressable
                onPress={() => {
                  console.log('🔍 ProfileScreen: Verify button pressed', {
                    targetWallet: targetWalletAddress,
                    targetName: profileData?.displayName,
                    isOwnProfile: isOwnProfile
                  });
                  navigation.navigate('Verification', {
                    targetWallet: targetWalletAddress,
                    targetName: profileData?.displayName,
                  });
                }}
                style={({pressed}) => ({
                  alignItems: 'center',
                  flex: 1,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  <Shield size={18} color="#FFFFFF" />
                </View>
                <Text style={{
                  fontSize: 13,
                  color: colors.foreground,
                  fontWeight: '500',
                  fontFamily: 'Inter-Medium',
                  textAlign: 'center',
                }} numberOfLines={1}>
                  Verify
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Pinned Post Section */}
        {userPosts.some(post => post.isPinned) && (
          <>
            <Text style={styles.sectionHeader}>Pinned Post</Text>
            {userPosts.filter(post => post.isPinned).map(post => (
              <View key={post.id} style={styles.pinnedPostContainer}>
                <PostCard
                  post={post}
                  onPress={() => handlePostPress(post)}
                  onUserPress={handleUserPress}
                  onQuotePress={handleQuotePress}
                  onThreadPress={handleThreadPress}
                  onQuotedPostPress={handleQuotedPostPress}
                />
              </View>
            ))}
          </>
        )}

        {/* History Section */}
        <Text style={styles.sectionHeader}>History</Text>
        <View style={[styles.historySection, styles.offlineOverlay]}>
          {postsLoading && userPosts.length === 0 ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: colors.mutedForeground, fontFamily: 'Inter-Regular'}}>
                Loading posts...
              </Text>
            </View>
          ) : error ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: colors.destructive, fontFamily: 'Inter-Regular', textAlign: 'center'}}>
                {error}
              </Text>
            </View>
          ) : userPosts.length === 0 ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: colors.mutedForeground, fontFamily: 'Inter-Regular'}}>
                No posts yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={Array.isArray(userPosts) ? userPosts.filter(post => !post.isPinned) : []}
              renderItem={renderPost}
              keyExtractor={(item, index) => item?.id ? `${item.id}-${index}` : `post-${index}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              nestedScrollEnabled={true}
            />
          )}
        </View>
        </>
        ) : (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100}}>
            <Text style={{color: colors.mutedForeground, fontFamily: 'Inter-Regular'}}>
              Unable to load profile
            </Text>
          </View>
        )}
      </Animated.ScrollView>


      {/* Profile skeleton for smooth loading transitions */}
      {(loading && !currentProfile) && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}>
          <ProfileSkeleton />
        </View>
      )}

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}
