import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Award,
  Star,
  Trophy,
  Target,
  Zap,
  Crown,
  Shield,
  Flame,
} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {badgeAPI, BadgeResponse} from '../../services/api/badges';

interface BadgesSettingsScreenProps {
  navigation: any;
}

interface UIBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  earned: boolean;
  visible: boolean;
  category?: string;
  criteria?: string;
  iconUrl?: string;
}

// Default icon mapping for known badge types
const getDefaultBadgeIcon = (badgeName: string): React.ComponentType<any> => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Early Adopter': Star,
    'Top Contributor': Trophy,
    'Streak Master': Flame,
    'Community Builder': Target,
    'Power User': Zap,
    'Veteran': Crown,
    'Verified Creator': Shield,
  };
  return iconMap[badgeName] || Award;
};

// Default color mapping for known badge types
const getDefaultBadgeColor = (badgeName: string): string => {
  const colorMap: Record<string, string> = {
    'Early Adopter': '#F59E0B',
    'Top Contributor': '#10B981',
    'Streak Master': '#EF4444',
    'Community Builder': '#8B5CF6',
    'Power User': '#06B6D4',
    'Veteran': '#EC4899',
    'Verified Creator': '#3B82F6',
  };
  return colorMap[badgeName] || '#6B7280';
};

// Map API badge to UI badge format
const mapApiBadgeToUI = (apiBadge: BadgeResponse): UIBadge => {
  return {
    id: apiBadge.id.toString(),
    name: apiBadge.badge_name,
    description: apiBadge.badge_description,
    icon: getDefaultBadgeIcon(apiBadge.badge_name),
    iconColor: getDefaultBadgeColor(apiBadge.badge_name),
    earned: apiBadge.earned,
    visible: apiBadge.display_enabled,
    category: apiBadge.badge_category,
    criteria: apiBadge.badge_criteria,
    iconUrl: apiBadge.badge_icon,
  };
};

// Mock badge data (fallback when API fails)
const mockBadges: UIBadge[] = [
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Joined Beam in the first month',
    icon: Star,
    iconColor: '#F59E0B',
    earned: true,
    visible: true,
  },
  {
    id: 'top-contributor',
    name: 'Top Contributor',
    description: 'Earned 10,000+ reputation points',
    icon: Trophy,
    iconColor: '#10B981',
    earned: true,
    visible: false,
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintained a 30-day posting streak',
    icon: Flame,
    iconColor: '#EF4444',
    earned: true,
    visible: true,
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Helped 100+ users with helpful votes',
    icon: Target,
    iconColor: '#8B5CF6',
    earned: false,
    visible: false,
  },
  {
    id: 'power-user',
    name: 'Power User',
    description: 'Created 500+ high-quality posts',
    icon: Zap,
    iconColor: '#06B6D4',
    earned: false,
    visible: false,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Active member for over 1 year',
    icon: Crown,
    iconColor: '#EC4899',
    earned: false,
    visible: false,
  },
  {
    id: 'verified',
    name: 'Verified Creator',
    description: 'Completed identity verification',
    icon: Shield,
    iconColor: '#3B82F6',
    earned: true,
    visible: true,
  },
];

export default function BadgesSettingsScreen({navigation}: BadgesSettingsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile} = useProfileStore();
  
  // Local state for new badge system
  const [showBadges, setShowBadges] = useState(true);
  const [badges, setBadges] = useState<UIBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load badges from new badge API
  useEffect(() => {
    console.log('🔍 BadgesSettingsScreen: Loading badges from new API');
    
    const loadBadges = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const badgesData = await badgeAPI.getUserBadges();
        
        console.log('🔍 BadgesSettingsScreen: Badge API response received');
        console.log('  - badges:', badgesData.badges);
        console.log('  - badges count:', badgesData.badges?.length || 0);
        console.log('  - badgesEnabled:', badgesData.badgesEnabled);
        console.log('  - raw badges:', JSON.stringify(badgesData.badges, null, 2));
        
        // Convert API badges to UI format, handle null/undefined badges array
        const badgesArray = badgesData.badges || [];
        const uiBadges = badgesArray.map(mapApiBadgeToUI);
        
        console.log('🔍 BadgesSettingsScreen: Converted to UI format');
        console.log('  - UI badges count:', uiBadges.length);
        console.log('  - earned badges:', uiBadges.filter(b => b.earned).map(b => b.name));
        
        setBadges(uiBadges);
        setShowBadges(badgesData.badgesEnabled);
        
      } catch (err) {
        console.error('🚨 BadgesSettingsScreen: Failed to load badges:', err);
        setError(err instanceof Error ? err.message : 'Failed to load badges');
        
        // Fallback to mock data or empty array
        console.log('🔍 BadgesSettingsScreen: Using fallback mock data');
        setBadges(mockBadges || []);
        
      } finally {
        setLoading(false);
      }
    };
    
    loadBadges();
  }, []);


  const handleShowBadgesToggle = useCallback(async (value: boolean) => {
    console.log('🔍 BadgesSettingsScreen: Toggling all badges:', value);
    
    try {
      setShowBadges(value); // Optimistic update
      await badgeAPI.toggleAllBadges(value);
      console.log('✅ BadgesSettingsScreen: All badges toggled successfully');
    } catch (err) {
      console.error('🚨 BadgesSettingsScreen: Failed to toggle all badges:', err);
      setShowBadges(!value); // Revert on error
      setError(err instanceof Error ? err.message : 'Failed to update badge settings');
    }
  }, []);

  const handleBadgeVisibilityToggle = useCallback(async (badgeId: string, visible: boolean) => {
    console.log('🔍 BadgesSettingsScreen: Toggling badge visibility:', { badgeId, visible });
    
    try {
      // Optimistic update
      setBadges(prev =>
        (prev || []).map(badge =>
          badge.id === badgeId ? { ...badge, visible } : badge
        )
      );
      
      await badgeAPI.toggleBadgeDisplay(parseInt(badgeId), visible);
      console.log('✅ BadgesSettingsScreen: Badge visibility toggled successfully');
    } catch (err) {
      console.error('🚨 BadgesSettingsScreen: Failed to toggle badge visibility:', err);
      
      // Revert on error
      setBadges(prev =>
        (prev || []).map(badge =>
          badge.id === badgeId ? { ...badge, visible: !visible } : badge
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to update badge visibility');
    }
  }, []);

  const earnedBadgesCount = badges?.filter(badge => badge.earned).length || 0;
  const visibleBadgesCount = badges?.filter(badge => badge.visible && badge.earned).length || 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      marginBottom: 24,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    masterSwitchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      marginBottom: 24,
    },
    masterSwitchInfo: {
      flex: 1,
    },
    masterSwitchLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    masterSwitchCaption: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    masterSwitchToggle: {
      marginLeft: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    subHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 16,
    },
    badgesList: {
      gap: 12,
      marginBottom: 32,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 72,
    },
    badgeRowEarned: {
      backgroundColor: colors.card,
      borderColor: colors.primary + '30',
    },
    badgeRowNotEarned: {
      backgroundColor: colors.muted + '50',
      borderColor: colors.border,
    },
    badgeIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    badgeInfo: {
      flex: 1,
    },
    badgeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    badgeName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      flex: 1,
      marginRight: 8,
    },
    statePillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    statePill: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    statePillEarned: {
      backgroundColor: colors.primary,
    },
    statePillNotEarned: {
      backgroundColor: colors.muted,
    },
    statePillText: {
      fontSize: 10,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    statePillTextEarned: {
      color: colors.primaryForeground,
    },
    statePillTextNotEarned: {
      color: colors.mutedForeground,
    },
    badgeDescription: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    badgeToggle: {
      marginLeft: 12,
    },
    statisticsSection: {
      marginTop: 16,
    },
    statisticsHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 16,
    },
    statisticsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statisticsCard: {
      width: 120,
      height: 72,
      borderRadius: 12,
      padding: 12,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statisticsCardEarned: {
      backgroundColor: colors.primary + '10',
    },
    statisticsCardVisible: {
      backgroundColor: colors.secondary + '10',
    },
    statisticsValue: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
      marginBottom: 2,
    },
    statisticsValueEarned: {
      color: colors.primary,
    },
    statisticsValueVisible: {
      color: colors.secondary,
    },
    statisticsLabel: {
      fontSize: 11,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      lineHeight: 14,
    },
    statisticsLabelEarned: {
      color: colors.primary,
    },
    statisticsLabelVisible: {
      color: colors.secondary,
    },
  });

  const renderBadgeRow = (badge: UIBadge) => {
    const isToggleDisabled = !badge.earned || !showBadges;
    
    return (
      <View
        key={badge.id}
        style={[
          styles.badgeRow,
          badge.earned ? styles.badgeRowEarned : styles.badgeRowNotEarned,
        ]}>
        <View style={styles.badgeIcon}>
          <badge.icon size={24} color={badge.iconColor} />
        </View>
        
        <View style={styles.badgeInfo}>
          <View style={styles.badgeHeader}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <View
              style={[
                styles.statePill,
                badge.earned ? styles.statePillEarned : styles.statePillNotEarned,
              ]}>
              <Text
                style={[
                  styles.statePillText,
                  badge.earned ? styles.statePillTextEarned : styles.statePillTextNotEarned,
                ]}>
                {badge.earned ? 'Earned' : 'Not Earned'}
              </Text>
            </View>
          </View>
          <Text style={styles.badgeDescription}>{badge.description}</Text>
        </View>

        <View style={styles.badgeToggle}>
          <Switch
            value={badge.visible}
            onValueChange={(value) => handleBadgeVisibilityToggle(badge.id, value)}
            disabled={isToggleDisabled}
            trackColor={{
              false: colors.muted,
              true: colors.primary + '40',
            }}
            thumbColor={badge.visible ? colors.primary : colors.mutedForeground}
          />
        </View>
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppNavBar
        title="Badge Settings"
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
          <FeedSkeleton itemCount={5} showImages={false} />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no badges loaded
  if (error && (!badges || badges.length === 0)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppNavBar
        title="Badge Settings"
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />
        <EnhancedErrorState
          title="Can't load badges"
          subtitle="Check your connection and try again"
          onRetry={async () => {
            setError(null);
            try {
              setLoading(true);
              const badgesData = await badgeAPI.getUserBadges();
              const badgesArray = badgesData.badges || [];
              const uiBadges = badgesArray.map(mapApiBadgeToUI);
              setBadges(uiBadges);
              setShowBadges(badgesData.badgesEnabled);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to load badges');
              setBadges(mockBadges || []);
            } finally {
              setLoading(false);
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
        title="Badge Settings"
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Badge Settings</Text>
            <Text style={styles.cardSubtitle}>
              Manage which badges are displayed on your profile
            </Text>
          </View>

          {/* Master Switch */}
          <View style={styles.masterSwitchRow}>
            <View style={styles.masterSwitchInfo}>
              <Text style={styles.masterSwitchLabel}>Show Badges on Profile</Text>
              <Text style={styles.masterSwitchCaption}>
                Display earned badges on your public profile
              </Text>
            </View>
            <View style={styles.masterSwitchToggle}>
              <Switch
                value={showBadges}
                onValueChange={handleShowBadgesToggle}
                trackColor={{
                  false: colors.muted,
                  true: colors.primary + '40',
                }}
                thumbColor={showBadges ? colors.primary : colors.mutedForeground}
              />
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={{
              backgroundColor: colors.destructive + '15',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{
                color: colors.destructive,
                fontSize: 14,
                fontFamily: 'Inter-Medium',
              }}>
                {error}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Individual Badge Settings */}
          <Text style={styles.subHeader}>Individual Badge Settings</Text>
          
          <View style={styles.badgesList}>
            {badges && badges.length > 0 ? (
              badges.map(renderBadgeRow)
            ) : (
              <View style={{
                alignItems: 'center',
                paddingVertical: 32,
                backgroundColor: colors.muted + '50',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Award size={32} color={colors.mutedForeground} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.foreground,
                  fontFamily: 'Inter-Medium',
                  marginTop: 8,
                  marginBottom: 4,
                }}>
                  No Badges Yet
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter-Regular',
                  textAlign: 'center',
                  paddingHorizontal: 16,
                }}>
                  Start participating in the community to earn badges that will appear here.
                </Text>
              </View>
            )}
          </View>

          {/* Badge Statistics */}
          <View style={styles.statisticsSection}>
            <Text style={styles.statisticsHeader}>Badge Statistics</Text>
            <View style={styles.statisticsGrid}>
              <View style={[styles.statisticsCard, styles.statisticsCardEarned]}>
                <Text style={[styles.statisticsValue, styles.statisticsValueEarned]}>
                  {earnedBadgesCount}
                </Text>
                <Text style={[styles.statisticsLabel, styles.statisticsLabelEarned]}>
                  Badges Earned
                </Text>
              </View>
              
              <View style={[styles.statisticsCard, styles.statisticsCardVisible]}>
                <Text style={[styles.statisticsValue, styles.statisticsValueVisible]}>
                  {visibleBadgesCount}
                </Text>
                <Text style={[styles.statisticsLabel, styles.statisticsLabelVisible]}>
                  Badges Set to Show
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Add some bottom spacing */}
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}