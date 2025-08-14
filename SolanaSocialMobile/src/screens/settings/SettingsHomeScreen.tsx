import React, {useCallback, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ChevronRight,
  Settings,
  Mail,
  Lock,
  Home,
  Wallet,
  Coins,
  Award,
} from 'lucide-react-native';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';

interface SettingsHomeScreenProps {
  navigation: any;
}

interface SettingsCategory {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  screen: string;
  color: string;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'general',
    icon: Settings,
    label: 'General',
    screen: 'GeneralSettings',
    color: '#6B7280',
  },
  {
    id: 'email',
    icon: Mail,
    label: 'Email',
    screen: 'EmailSettings',
    color: '#3B82F6',
  },
  {
    id: 'password',
    icon: Lock,
    label: 'Password',
    screen: 'PasswordSettings',
    color: '#EF4444',
  },
  {
    id: 'feed',
    icon: Home,
    label: 'Feed',
    screen: 'FeedSettings',
    color: '#10B981',
  },
  {
    id: 'wallets',
    icon: Wallet,
    label: 'Wallets',
    screen: 'WalletSettings',
    color: '#8B5CF6',
  },
  {
    id: 'solana',
    icon: Coins,
    label: 'Solana',
    screen: 'SolanaSettings',
    color: '#F59E0B',
  },
  {
    id: 'badges',
    icon: Award,
    label: 'Badges',
    screen: 'BadgesSettings',
    color: '#EC4899',
  },
];

export default function SettingsHomeScreen({navigation}: SettingsHomeScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {loadProfile, currentProfile} = useProfileStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Load user profile when settings screen is accessed
  useEffect(() => {
    console.log('🔍 SettingsHomeScreen: useEffect triggered');
    console.log('  - full user object:', JSON.stringify(user, null, 2));
    console.log('  - user?.walletAddress:', user?.walletAddress);
    console.log('  - user?.primary_wallet_address:', user?.primary_wallet_address);
    console.log('  - user?.primaryWalletAddress:', user?.primaryWalletAddress);
    console.log('  - currentProfile exists:', !!currentProfile);
    
    // Try different wallet address fields
    const walletAddress = user?.walletAddress || user?.primary_wallet_address || user?.primaryWalletAddress;
    console.log('  - resolved walletAddress:', walletAddress);
    console.log('  - Should load profile:', !!(walletAddress && !currentProfile));
    
    if (walletAddress && !currentProfile) {
      console.log('🔍 SettingsHomeScreen: Loading profile for settings');
      loadProfile(walletAddress).catch(error => {
        console.error('Failed to load profile in settings:', error);
      });
    } else if (walletAddress && currentProfile) {
      console.log('🔍 SettingsHomeScreen: Profile already loaded, forcing refresh for settings');
      // Force reload to get fresh data for settings
      loadProfile(walletAddress).catch(error => {
        console.error('Failed to refresh profile in settings:', error);
      });
    } else {
      console.log('🔍 SettingsHomeScreen: No wallet address found or no user object');
    }
  }, [user, loadProfile]); // Watch the entire user object for changes

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

  const handleCategoryPress = useCallback((category: SettingsCategory) => {
    console.log('Navigate to:', category.screen);
    switch (category.screen) {
      case 'GeneralSettings':
        navigation.navigate('GeneralSettings');
        break;
      case 'EmailSettings':
        navigation.navigate('EmailSettings');
        break;
      case 'PasswordSettings':
        navigation.navigate('PasswordSettings');
        break;
      case 'FeedSettings':
        navigation.navigate('FeedSettings');
        break;
      case 'WalletSettings':
        navigation.navigate('WalletSettings');
        break;
      case 'SolanaSettings':
        navigation.navigate('SolanaSettings');
        break;
      case 'BadgesSettings':
        navigation.navigate('BadgesSettings');
        break;
      default:
        // For other screens, just log for now
        console.log(`${category.label} settings not implemented yet`);
    }
  }, [navigation]);


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    categoriesList: {
      flex: 1,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: 56,
      backgroundColor: colors.background,
    },
    categoryRowPressed: {
      backgroundColor: colors.muted,
    },
    categoryIcon: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    categoryLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      flex: 1,
    },
    chevronIcon: {
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 56, // Align with text
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar 
        title="Settings" 
        onProfilePress={() => setSidebarVisible(true)} 
      />

      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {settingsCategories.map((category, index) => (
          <View key={category.id}>
            <Pressable
              style={({pressed}) => [
                styles.categoryRow,
                pressed && styles.categoryRowPressed,
              ]}
              onPress={() => handleCategoryPress(category)}
              accessibilityRole="button"
              accessibilityLabel={`${category.label} settings`}>
              <View style={styles.categoryIcon}>
                <category.icon
                  size={20}
                  color={category.color}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <ChevronRight
                size={16}
                color={colors.mutedForeground}
                style={styles.chevronIcon}
              />
            </Pressable>
            {index < settingsCategories.length - 1 && (
              <View style={styles.divider} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Sidebar */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}