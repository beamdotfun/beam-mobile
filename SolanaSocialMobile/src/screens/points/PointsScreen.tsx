import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Star,
  Trophy,
  Zap,
  Target,
  Flame,
  FileText,
  ThumbsUp,
  Users,
  Twitter,
  MessageCircle,
  Share2,
  Heart,
  Plus,
  Award,
  Gift,
  TrendingUp,
} from 'lucide-react-native';
import {SegmentedControl} from '../../components/ui/SegmentedControl';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {useThemeStore} from '../../store/themeStore';

interface PointsScreenProps {
  navigation: any;
}

interface MetricTile {
  id: string;
  icon: React.ComponentType<any>;
  value: string;
  label: string;
  color?: string;
}

interface EarnMethod {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  points: string;
  color: string;
}

interface Activity {
  id: string;
  icon: React.ComponentType<any>;
  action: string;
  time: string;
  points: number;
  color: string;
}

// Mock data
const mockMetrics: MetricTile[] = [
  {
    id: 'my-points',
    icon: Star,
    value: '2,847',
    label: 'My Points',
    color: '#F59E0B',
  },
  {
    id: 'total-points',
    icon: Trophy,
    value: '15.2K',
    label: 'Total Points',
    color: '#6366F1',
  },
  {
    id: 'multiplier',
    icon: Zap,
    value: '2.4x',
    label: 'Reputation Multiplier',
    color: '#EC4899',
  },
  {
    id: 'rank',
    icon: Target,
    value: '#127',
    label: 'Current Rank',
    color: '#10B981',
  },
  {id: 'streak', icon: Flame, value: '14', label: 'Streak', color: '#F97316'},
  {id: 'posts', icon: FileText, value: '89', label: 'Posts', color: '#8B5CF6'},
  {id: 'votes', icon: ThumbsUp, value: '432', label: 'Votes', color: '#06B6D4'},
  {
    id: 'referrals',
    icon: Users,
    value: '12',
    label: 'Referrals',
    color: '#84CC16',
  },
];

const mockEarnMethods: EarnMethod[] = [
  {
    id: 'share-twitter',
    icon: Twitter,
    title: 'Share on Twitter',
    subtitle: 'Share posts and earn points',
    points: '+25 pts',
    color: '#1DA1F2',
  },
  {
    id: 'refer-friends',
    icon: Users,
    title: 'Refer Friends',
    subtitle: 'Invite friends to join',
    points: '+100 pts',
    color: '#10B981',
  },
  {
    id: 'daily-post',
    icon: FileText,
    title: 'Daily Post',
    subtitle: 'Post content every day',
    points: '+50 pts',
    color: '#6366F1',
  },
  {
    id: 'engage',
    icon: Heart,
    title: 'Engage with Posts',
    subtitle: 'Vote and comment',
    points: '+10 pts',
    color: '#EC4899',
  },
  {
    id: 'share-content',
    icon: Share2,
    title: 'Share Content',
    subtitle: 'Share interesting posts',
    points: '+15 pts',
    color: '#F59E0B',
  },
  {
    id: 'complete-profile',
    icon: Star,
    title: 'Complete Profile',
    subtitle: 'Fill out your bio',
    points: '+200 pts',
    color: '#8B5CF6',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    icon: Twitter,
    action: 'Shared post on Twitter',
    time: '2 min ago',
    points: 25,
    color: '#1DA1F2',
  },
  {
    id: '2',
    icon: ThumbsUp,
    action: 'Voted on 5 posts',
    time: '1 hour ago',
    points: 50,
    color: '#10B981',
  },
  {
    id: '3',
    icon: FileText,
    action: 'Published a new post',
    time: '3 hours ago',
    points: 100,
    color: '#6366F1',
  },
  {
    id: '4',
    icon: Users,
    action: 'Friend joined via referral',
    time: '1 day ago',
    points: 500,
    color: '#F59E0B',
  },
  {
    id: '5',
    icon: Flame,
    action: 'Maintained 14-day streak',
    time: '1 day ago',
    points: 200,
    color: '#F97316',
  },
];

const {width} = Dimensions.get('window');
const cardWidth = (width - 16 * 2 - 12) / 2; // 16dp gutters, 12dp gap

export default function PointsScreen({navigation}: PointsScreenProps) {
  const {colors} = useThemeStore();
  const [selectedTab, setSelectedTab] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const tabs = ['Overview', 'Share & Earn', 'Refer Friends'];

  const handleMetricPress = useCallback((metricId: string) => {
    console.log('Metric pressed:', metricId);
  }, []);

  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false);
    // Navigate based on the screen
    if (screen === 'Profile') {
      // Navigate to Profile screen (with params if provided, otherwise user's own profile)
      navigation.navigate('Profile', params);
    } else if (['Settings', 'GeneralSettings', 'EmailSettings', 'PasswordSettings', 
                'FeedSettings', 'WalletSettings', 'SolanaSettings', 'BadgesSettings',
                'Posts', 'Receipts', 'Watchlist', 'Tokens', 'Points', 'Business', 'HelpCenter'].includes(screen)) {
      navigation.navigate(screen, params);
    } else {
      navigation.navigate('FeedHome');
    }
  }, [navigation]);

  const handleEarnMethodPress = useCallback((methodId: string) => {
    console.log('Earn method pressed:', methodId);
  }, []);

  const handleActivityPress = useCallback((activityId: string) => {
    console.log('Activity pressed:', activityId);
  }, []);

  const tabsElevation = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 4],
    extrapolate: 'clamp',
  });

  const renderMetricTile = (metric: MetricTile, index: number) => (
    <Pressable
      key={metric.id}
      style={[
        styles.metricTile,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          width: cardWidth,
        },
      ]}
      onPress={() => handleMetricPress(metric.id)}>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <View style={styles.metricIconContainer}>
            <metric.icon size={20} color={metric.color || colors.primary} />
          </View>
        </View>
        <Text style={[styles.metricValue, {color: colors.foreground}]}>
          {metric.value}
        </Text>
        <Text style={[styles.metricLabel, {color: colors.mutedForeground}]}>
          {metric.label}
        </Text>
      </View>
    </Pressable>
  );

  const renderEarnMethodCard = ({item}: {item: EarnMethod}) => (
    <Pressable
      style={[
        styles.earnMethodCard,
        {backgroundColor: colors.card, borderColor: colors.border},
      ]}
      onPress={() => handleEarnMethodPress(item.id)}>
      <View
        style={[styles.earnMethodIcon, {backgroundColor: item.color + '20'}]}>
        <item.icon size={24} color={item.color} />
      </View>
      <View style={styles.earnMethodContent}>
        <Text style={[styles.earnMethodTitle, {color: colors.foreground}]}>
          {item.title}
        </Text>
        <Text
          style={[styles.earnMethodSubtitle, {color: colors.mutedForeground}]}>
          {item.subtitle}
        </Text>
        <Text style={[styles.earnMethodPoints, {color: item.color}]}>
          {item.points}
        </Text>
      </View>
    </Pressable>
  );

  const renderActivityItem = ({item}: {item: Activity}) => (
    <Pressable
      style={styles.activityItem}
      onPress={() => handleActivityPress(item.id)}>
      <View style={styles.activityLeft}>
        <View
          style={[styles.activityIcon, {backgroundColor: item.color + '20'}]}>
          <item.icon size={16} color={item.color} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={[styles.activityAction, {color: colors.foreground}]}>
            {item.action}
          </Text>
          <Text style={[styles.activityTime, {color: colors.mutedForeground}]}>
            {item.time}
          </Text>
        </View>
      </View>
      <Text style={[styles.activityPoints, {color: '#10B981'}]}>
        +{item.points} pts
      </Text>
    </Pressable>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    metricsGrid: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      marginTop: 20,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    metricTile: {
      borderRadius: 12,
      borderWidth: 1,
    },
    metricContent: {
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    metricHeader: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
    metricIconContainer: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    tabsContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 16,
    },
    earnMethodsList: {
      paddingRight: 16,
    },
    earnMethodCard: {
      width: 160,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      borderWidth: 1,
    },
    earnMethodIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    earnMethodContent: {
      flex: 1,
    },
    earnMethodTitle: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    earnMethodSubtitle: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
      marginBottom: 8,
    },
    earnMethodPoints: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    activityList: {
      flex: 1,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activityInfo: {
      flex: 1,
    },
    activityAction: {
      fontSize: 15,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    activityTime: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    activityPoints: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 16,
    },
    contentContainer: {
      paddingBottom: 100, // Space for bottom navigation
    },
  });

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: // Overview
        return (
          <>
            {/* Metrics Grid - Stats Cards */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                {renderMetricTile(mockMetrics[0], 0)}
                {renderMetricTile(mockMetrics[1], 1)}
              </View>
              <View style={styles.metricsRow}>
                {renderMetricTile(mockMetrics[2], 2)}
                {renderMetricTile(mockMetrics[3], 3)}
              </View>
              <View style={styles.metricsRow}>
                {renderMetricTile(mockMetrics[4], 4)}
                {renderMetricTile(mockMetrics[5], 5)}
              </View>
              <View style={styles.metricsRow}>
                {renderMetricTile(mockMetrics[6], 6)}
                {renderMetricTile(mockMetrics[7], 7)}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <FlatList
                  data={mockActivities.slice(0, 3)}
                  renderItem={renderActivityItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{height: 0}} />}
                />
              </View>
            </View>
          </>
        );

      case 1: // Share & Earn
        return (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>How to Earn Points</Text>
              <FlatList
                data={mockEarnMethods}
                renderItem={renderEarnMethodCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.earnMethodsList}
              />
            </View>
          </View>
        );

      case 2: // Refer Friends
        return (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <View style={styles.emptyState}>
                <Users size={32} color={colors.mutedForeground} />
                <Text style={styles.emptyStateText}>
                  Invite friends to join Beam and earn bonus points for each
                  referral.
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Coming Soon UI
  const comingSoonStyles = StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    message: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
      fontFamily: 'Inter-Regular',
      paddingHorizontal: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Points"
        onProfilePress={() => setSidebarVisible(true)}
      />

      <View style={comingSoonStyles.content}>
        <View style={comingSoonStyles.titleContainer}>
          <Trophy size={32} color={colors.foreground} />
          <Text style={comingSoonStyles.title}>Points</Text>
        </View>
        <Text style={comingSoonStyles.message}>
          You're early! Our points program is coming soon.
        </Text>
      </View>

      {/* Sidebar */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );

  // Original implementation (preserved for future use)
  /*
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar title="Points" onProfilePress={() => setSidebarVisible(true)} />

      // Tab Navigation - Sticky
      <Animated.View 
        style={[
          styles.tabsContainer,
          {
            shadowOpacity: tabsElevation.interpolate({
              inputRange: [0, 4],
              outputRange: [0, 0.1],
            }),
            elevation: tabsElevation,
          }
        ]}>
        <SegmentedControl
          segments={tabs}
          selectedIndex={selectedTab}
          onSelectionChange={setSelectedTab}
        />
      </Animated.View>

      // Scrollable Content
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false}
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        
        {renderTabContent()}
      </ScrollView>

    </SafeAreaView>
  );
  */
}
