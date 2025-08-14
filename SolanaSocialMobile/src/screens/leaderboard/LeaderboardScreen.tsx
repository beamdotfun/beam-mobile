import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Trophy, TrendingUp, Crown, Plus, Medal, Award} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {StatusDot} from '../../components/ui/StatusDot';
import {SegmentedControl} from '../../components/ui/SegmentedControl';
import {ErrorState} from '../../components/ui/ErrorState';
import {EnhancedRefreshControl} from '../../components/ui/EnhancedRefreshControl';
import {SkeletonCard} from '../../components/ui/Skeleton';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {getAvatarFallback} from '../../lib/utils';
import {useWalletStore} from '../../store/wallet';
import {useDiscoveryStore} from '../../store/discovery';
import {LeaderboardEntry} from '../../types/discovery';

interface LeaderboardScreenProps {
  navigation: any;
}

// Map tab indices to leaderboard types
const leaderboardTypes = ['reputation', 'reputation'] as const; // Both tabs show reputation for now

export default function LeaderboardScreen({navigation}: LeaderboardScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {connected} = useWalletStore();
  const {isAuthenticated, isRehydrated} = useAuthStore();
  const {
    reputationLeaderboard,
    epochLeaderboard,
    leaderboardLoading,
    loadLeaderboard,
    error
  } = useDiscoveryStore();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(0); // 0: This Epoch, 1: All Time
  const [refreshing, setRefreshing] = useState(false);

  const periods = ['This Epoch', 'All Time'];

  const handleRefresh = async () => {
    console.log('Pull-to-refresh triggered on leaderboard');
    if (!isAuthenticated) return;
    
    setRefreshing(true);
    try {
      const leaderboardType = selectedPeriod === 0 ? 'epoch' : 'reputation';
      const period = selectedPeriod === 1 ? 'all' : undefined;
      await loadLeaderboard(leaderboardType, period);
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || leaderboardLoading);
  }, [refreshing, leaderboardLoading, handleRefreshStateChange]);

  // Load leaderboard data on mount and tab change, but only when authenticated
  useEffect(() => {
    if (isRehydrated && isAuthenticated) {
      const leaderboardType = selectedPeriod === 0 ? 'epoch' : 'reputation';
      const period = selectedPeriod === 1 ? 'all' : undefined;
      loadLeaderboard(leaderboardType, period);
    }
  }, [selectedPeriod, loadLeaderboard, isAuthenticated, isRehydrated]);

  const handleUserPress = useCallback(
    (userIdentifier: string) => {
      console.log('🔍 LeaderboardScreen: handleUserPress called with userIdentifier:', userIdentifier);
      
      if (!userIdentifier) {
        console.error('🚨 LeaderboardScreen: No user identifier provided!');
        return;
      }
      
      // Navigate to Feed tab first, then to UserProfile screen 
      const parent = navigation.getParent()?.getParent(); // Need to go up two levels: LeaderboardStack -> TabNavigator
      
      if (parent) {
        // Always pass as walletAddress since the leaderboard API provides wallet addresses
        const params = { walletAddress: userIdentifier };
          
        console.log('🔍 LeaderboardScreen: Navigating to Feed -> UserProfile with params:', params);
        parent.navigate('Feed', {
          screen: 'UserProfile',  // Changed from 'Profile' to 'UserProfile' to view other users
          params
        });
        console.log('🔍 LeaderboardScreen: Navigation call completed');
      } else {
        console.error('🚨 LeaderboardScreen: No parent navigator found!');
      }
    },
    [navigation],
  );

  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false); // Close sidebar first
    
    // Screens that exist in Feed tab
    const feedTabScreens = [
      'Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
      'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
      'Posts', 'Receipts', 'Watchlist', 'Tokens', 'Points', 'Business', 'HelpCenter'
    ];
    
    if (feedTabScreens.includes(screen)) {
      // Navigate to Feed tab first, then to the specific screen - need to go up two levels
      const parent = navigation.getParent()?.getParent(); // LeaderboardStack -> TabNavigator
      if (parent) {
        parent.navigate('Feed', {
          screen: screen,
          params: params
        });
      }
    } else if (screen === 'Profile') {
      // Navigate to Feed tab, then to UserProfile screen
      const parent = navigation.getParent()?.getParent(); // LeaderboardStack -> TabNavigator
      if (parent) {
        parent.navigate('Feed', {
          screen: 'UserProfile',
          params: params
        });
      }
    } else {
      console.log(`Navigate to ${screen}`, params);
    }
  }, [navigation]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Text style={styles.medalIcon}>🥇</Text>; // Gold medal
      case 2:
        return <Text style={styles.medalIcon}>🥈</Text>; // Silver medal
      case 3:
        return <Text style={styles.medalIcon}>🥉</Text>; // Bronze medal
      default:
        return (
          <View style={styles.rankBadgePill}>
            <Text style={styles.rankBadgeText}>
              #{rank}
            </Text>
          </View>
        );
    }
  };

  const getChangeIndicator = (change?: number) => {
    if (!change || change === 0) return null;
    
    const isPositive = change > 0;
    return (
      <View style={[
        styles.changeIndicator,
        {backgroundColor: isPositive ? colors.success : colors.destructive}
      ]}>
        <Text style={styles.changeText}>
          {isPositive ? '+' : ''}{change}
        </Text>
      </View>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
    titleSection: {
      alignItems: 'center',
      paddingVertical: 24,
      backgroundColor: colors.background,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    titleIcon: {
      marginRight: 8,
    },
    titleText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    subtitleText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    stickySegmentedRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      height: 48,
      justifyContent: 'center',
    },
    segmentedRow: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    leaderboardContainer: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    leaderboardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 8,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    rankSection: {
      minWidth: 45,
      alignItems: 'center',
      marginRight: 8,
    },
    medalIcon: {
      fontSize: 24,
    },
    rankBadgePill: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      minWidth: 40,
      alignItems: 'center',
    },
    rankBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.mutedForeground,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
    },
    avatarSection: {
      marginRight: 12,
    },
    userInfoSection: {
      flex: 1,
      justifyContent: 'center',
    },
    handleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    userHandle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 20,
    },
    metaLine: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scorePill: {
      backgroundColor: colors.success + '20',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    scoreText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    // Legacy styles (can be removed later)
    leaderboardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.muted,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerIcon: {
      marginRight: 8,
    },
    headerText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      flex: 1,
    },
    leaderboardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    rankContainer: {
      width: 40,
      alignItems: 'center',
      marginRight: 12,
    },
    rankNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    userAvatar: {
      marginRight: 12,
    },
    userDetails: {
      flex: 1,
    },
    userDisplayName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    userUsername: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    statsContainer: {
      alignItems: 'flex-end',
    },
    primaryStat: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    secondaryStat: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    changeIndicator: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginTop: 4,
    },
    changeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        showTitle={false}
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />

      {/* Centered Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Trophy size={24} color={colors.primary} style={styles.titleIcon} />
          <Text style={styles.titleText}>Leaderboard</Text>
        </View>
        <Text style={styles.subtitleText}>Top users ranked by reputation scores</Text>
      </View>

      {/* Sticky Tab Navigation */}
      <View style={styles.stickySegmentedRow}>
        <SegmentedControl
          segments={periods}
          selectedIndex={selectedPeriod}
          onSelectionChange={setSelectedPeriod}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || leaderboardLoading}
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
        onScroll={({nativeEvent}) => {
          // Infinite scroll stub - log when near bottom
          const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            console.log('Infinite scroll triggered - load more leaderboard entries');
          }
        }}
        scrollEventThrottle={400}>

        {/* Leaderboard List Container with proper spacing */}
        <View style={styles.leaderboardContainer}>
          {!isRehydrated ? (
            <FeedSkeleton itemCount={8} showImages={false} />
          ) : !isAuthenticated ? (
            <View style={styles.emptyState}>
              <Trophy size={32} color={colors.mutedForeground} />
              <Text style={styles.emptyStateText}>
                Please sign in to view the leaderboard.
              </Text>
            </View>
          ) : error ? (
            <EnhancedErrorState
              title="Can't load leaderboard"
              subtitle="Check your connection and try again"
              onRetry={() => {
                if (isAuthenticated) {
                  const leaderboardType = selectedPeriod === 0 ? 'epoch' : 'reputation';
                  const period = selectedPeriod === 1 ? 'all' : undefined;
                  loadLeaderboard(leaderboardType, period);
                }
              }}
              retryLabel="Try Again"
              retrying={leaderboardLoading}
            />
          ) : (() => {
            const currentLeaderboard = selectedPeriod === 0 ? epochLeaderboard : reputationLeaderboard;
            
            if (currentLeaderboard.length > 0) {
              return currentLeaderboard.map((entry, index) => {
                // Debug: Log what fields are available in each entry
                if (index === 0) {
                  console.log('🔍 LeaderboardScreen: First entry structure:', {
                    hasOwner: !!entry.owner,
                    hasWalletAddress: !!entry.walletAddress,
                    hasAddress: !!entry.address,
                    hasPrimaryWalletAddress: !!entry.primaryWalletAddress,
                    hasUsername: !!entry.username,
                    hasWallet: !!entry.wallet,
                    actualFields: Object.keys(entry),
                    owner: entry.owner,
                    walletAddress: entry.walletAddress,
                    wallet: entry.wallet,
                    username: entry.username
                  });
                }
                
                // Get wallet address from the API response (it's in walletAddress field)
                const userWalletAddress = entry.walletAddress || entry.wallet || entry.owner || entry.address || entry.primaryWalletAddress;
                
                // Skip entries that have no wallet address
                if (!userWalletAddress) {
                  console.warn('🚨 LeaderboardScreen: Skipping entry with no wallet address:', entry.displayName || 'Unknown');
                  return null;
                }
                
                const userIdentifier = userWalletAddress;
                
                return (
                <Pressable
                  key={entry.id || `leaderboard-${selectedPeriod}-${index}-${userIdentifier}`}
                  style={styles.leaderboardCard}
                  onPress={() => handleUserPress(userIdentifier)}>
                  
                  {/* Rank Medal/Badge */}
                  <View style={styles.rankSection}>
                    {getRankIcon(entry.rank)}
                  </View>

                  {/* Avatar - 32dp */}
                  <View style={styles.avatarSection}>
                    <Avatar
                      src={entry.avatar}
                      fallback={getAvatarFallback(entry)}
                      size="md"
                    />
                  </View>

                  {/* User Info Section */}
                  <View style={styles.userInfoSection}>
                    <View style={styles.handleRow}>
                      <Text style={styles.userHandle} numberOfLines={1}>
                        {entry.displayName || entry.username || 'Unknown User'}
                        {entry.isVerified && ' ✓'}
                      </Text>
                    </View>
                    <Text style={styles.metaLine}>
                      🔥 {entry.postStreak || 0} Epoch Streak
                    </Text>
                  </View>

                  {/* Right Section - Single Score Pill based on selected period */}
                  <View style={styles.rightSection}>
                    <View style={styles.scorePill}>
                      <Text style={styles.scoreText}>
                        {selectedPeriod === 0 
                          ? `+${formatNumber(entry.gainThisEpoch || 0)}`
                          : `⚡ ${formatNumber(entry.totalReputation || 0)}`
                        }
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
              }).filter(Boolean);
            } else if (leaderboardLoading) {
              return <FeedSkeleton itemCount={8} showImages={false} />;
            } else {
              return (
                <View style={styles.emptyState}>
                  <Trophy size={32} color={colors.mutedForeground} />
                  <Text style={styles.emptyStateText}>
                    No leaderboard data available yet.
                  </Text>
                </View>
              );
            }
          })()}
        </View>
      </ScrollView>

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}