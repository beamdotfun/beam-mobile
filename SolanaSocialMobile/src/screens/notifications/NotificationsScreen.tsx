import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Bell, Plus} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {StatusDot} from '../../components/ui/StatusDot';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {getAvatarFallback} from '../../lib/utils';
import {useWalletStore} from '../../store/wallet';

interface NotificationsScreenProps {
  navigation: any;
}

export default function NotificationsScreen({navigation}: NotificationsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {connectionStatus} = useWalletStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false); // Close sidebar first
    
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
      // Navigate to Feed tab first, then to UserProfile screen
      const parent = navigation.getParent();
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
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    iconContainer: {
      marginBottom: 24,
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
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Notifications"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Bell size={32} color={colors.foreground} />
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Text style={styles.message}>
          We're working on bringing push notifications and activity updates to the platform. Check back
          soon.
        </Text>
      </View>

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}