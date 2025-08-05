import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Users, Search, Zap, Plus} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {SkeletonCard} from '../../components/ui/Skeleton';
import {StatusDot} from '../../components/ui/StatusDot';
import {ErrorState} from '../../components/ui/ErrorState';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {SwipeableUserCard} from '../../components/watchlist/SwipeableUserCard';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useWalletStore} from '../../store/wallet';
import {useWatchlist} from '../../hooks/useWatchlist';
import {getAvatarFallback} from '../../lib/utils';

interface WatchlistUser {
  walletAddress: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  isVerified: boolean;
  reputation: number;
  postCount?: number;
  postsThisEpoch?: number;
  streak?: number;
}

interface WatchlistScreenProps {
  navigation: any;
}

export default function WatchlistScreen({navigation}: WatchlistScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {connected} = useWalletStore();
  const {
    followingList,
    followingCount,
    loading,
    error,
    loadWatchlistMembers,
    refreshWatchlist,
  } = useWatchlist();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  // Local state for optimistic updates
  const [localFollowingList, setLocalFollowingList] = useState<WatchlistUser[]>([]);

  // Load watchlist users on mount - use setTimeout to not block initial render
  useEffect(() => {
    console.log('🔄 WatchlistScreen: Loading watchlist members on mount');
    // Defer data loading to next tick to allow UI to render first
    setTimeout(() => {
      loadWatchlistMembers();
    }, 0);
  }, []); // Remove dependency to prevent re-runs

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWatchlist();
    } catch (err) {
      console.error('Failed to refresh watchlist:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshWatchlist]);

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


  const handleUserPress = useCallback(
    (walletAddress: string) => {
      navigation.navigate('UserProfile', {walletAddress});
    },
    [navigation],
  );

  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false); // Close sidebar first
    
    // Screens that exist in Feed tab
    const feedTabScreens = [
      'Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
      'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
      'Posts', 'Receipts', 'Watchlist', 'Points', 'Business', 'HelpCenter'
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
      navigation.navigate('UserProfile', params);
    } else {
      console.log(`Navigate to ${screen}`, params);
    }
  }, [navigation]);

  const handleCreatePost = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  const handleFindPeople = useCallback(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Search');
    }
  }, [navigation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
    headerSide: {
      flex: 1,
      flexDirection: 'row',
    },
    headerSideRight: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
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
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
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
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    userCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    userCardPressed: {
      backgroundColor: colors.muted,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    leftColumn: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    metaLine: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    rightColumn: {
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
    },
    reputationPill: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    reputationText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
      paddingTop: 60, // Add top padding to push content down from header
    },
    emptyStateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    emptyStateIcon: {
      marginRight: 12,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      lineHeight: 24,
      marginBottom: 24,
    },
    emptyStateButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyStateButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    loadingState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 16,
    },
    statusMessage: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
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

  const renderUserCard = ({item}: {item: WatchlistUser}) => {
    return (
      <SwipeableUserCard
        item={item}
        onPress={handleUserPress}
        onDelete={() => {
          // Optimistically remove from local state
          const updatedList = followingList.filter(user => user.walletAddress !== item.walletAddress);
          // Update the store's following list
          useWatchlist.setState({
            followingList: updatedList,
            followingCount: updatedList.length
          });
        }}
        statusMessage={setStatusMessage}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateHeader}>
        <View style={styles.emptyStateIcon}>
          <Users size={32} color={colors.foreground} />
        </View>
        <Text style={styles.emptyStateTitle}>Your watchlist is empty</Text>
      </View>
      <Text style={styles.emptyStateText}>
        Discover people to follow in the Search tab
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <FeedSkeleton itemCount={8} showImages={false} />
  );

  if (error && !localFollowingList.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppNavBar
          title="Watchlist"
          onProfilePress={() => setSidebarVisible(true)}
          onNewPostPress={handleCreatePost}
        />

        <EnhancedErrorState
          title="Can't load watchlist"
          subtitle="Check your connection and try again"
          onRetry={() => loadWatchlistMembers()}
          retryLabel="Try Again"
          retrying={loading}
        />

        <SidebarMenu
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onNavigate={handleSidebarNavigate}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Watchlist"
        subtitle={localFollowingList.length > 0 ? 
          `${localFollowingList.length} ${localFollowingList.length === 1 ? 'person' : 'people'}` : 
          undefined
        }
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={handleCreatePost}
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

      <FlatList
        style={styles.content}
        data={followingList}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.walletAddress}
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          followingList.length === 0 
            ? (loading ? renderLoadingState : renderEmptyState)
            : null
        }
        contentContainerStyle={
          followingList.length === 0 ? {flex: 1} : {paddingTop: 16, paddingBottom: 16}
        }
      />

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}