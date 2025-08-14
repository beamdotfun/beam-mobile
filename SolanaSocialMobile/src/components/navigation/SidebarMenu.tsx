import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import {
  X,
  User,
  Settings,
  FileText,
  Bookmark,
  Users,
  Star,
  HelpCircle,
  LogOut,
  Briefcase,
  ChevronRight,
  Wifi,
  WifiOff,
  Coins,
} from 'lucide-react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
// WebSocket implementation removed - using polling instead
import {getUserProfilePicture} from '../../utils/profileUtils';
import {getAvatarFallback} from '../../lib/utils';
import {socialAPI} from '../../services/api/social';

interface SidebarMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

const {width} = Dimensions.get('window');

export function SidebarMenu({visible, onClose, onNavigate}: SidebarMenuProps) {
  const {colors} = useThemeStore();
  const {user, signOut} = useAuthStore();
  const {loadProfile} = useProfileStore();
  // Realtime connection status removed - using polling instead
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const [ownProfile, setOwnProfile] = React.useState<any>(null);
  
  // Load comprehensive profile data when sidebar becomes visible
  React.useEffect(() => {
    let isMounted = true;
    
    if (visible && user) {
      console.log('🔍 SidebarMenu: Loading own comprehensive profile...');
      // Always load the authenticated user's own profile
      const loadOwnProfile = async () => {
        try {
          const profile = await socialAPI.getAuthenticatedUserProfile();
          if (isMounted) {
            console.log('🔍 SidebarMenu: Own profile loaded:', profile);
            setOwnProfile(profile);
          }
        } catch (error) {
          if (isMounted) {
            console.error('🔍 SidebarMenu: Failed to load own profile:', error);
          }
        }
      };
      loadOwnProfile();
    }
    
    return () => {
      isMounted = false;
    };
  }, [visible, user]);

  // Debug user data whenever it changes
  React.useEffect(() => {
    console.log('🔍 SidebarMenu: User data changed:', {
      hasUser: !!user,
      hasOwnProfile: !!ownProfile,
      walletAddress: user?.walletAddress || user?.primaryWalletAddress,
      primaryWalletAddress: user?.primaryWalletAddress,
      displayName: user?.displayName,
      profileDisplayName: ownProfile?.displayName,
      email: user?.email,
      isVerified: user?.isVerified,
      userKeys: user ? Object.keys(user) : 'no user',
      profileKeys: ownProfile ? Object.keys(ownProfile) : 'no profile',
    });
  }, [user, ownProfile]);

  const leftGutter = 20;

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.background,
      width: width * 0.8,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    safeAreaContainer: {
      flex: 1,
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 16,
    },
    header: {
      paddingHorizontal: leftGutter,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
    },
    closeButtonPressed: {
      backgroundColor: colors.muted,
    },
    accountHeader: {
      backgroundColor: colors.muted,
      paddingHorizontal: leftGutter,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 72,
    },
    accountHeaderPressed: {
      backgroundColor: colors.accent,
    },
    accountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profileInfo: {
      marginLeft: 12,
      flex: 1,
      justifyContent: 'center',
    },
    displayName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 18,
      marginBottom: 2,
    },
    email: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 16,
    },
    chevronButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullBleedDivider: {
      height: 1,
      backgroundColor: colors.border,
      width: '100%',
    },
    menuSection: {
      paddingVertical: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: leftGutter,
      paddingVertical: 14,
      minHeight: 52,
    },
    menuItemPressed: {
      backgroundColor: colors.muted,
    },
    menuItemActive: {
      backgroundColor: `${colors.primary}10`,
    },
    menuIconContainer: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    menuText: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      flex: 1,
    },
    menuTextActive: {
      color: colors.primary,
    },
    menuTextPressed: {
      color: colors.primary,
    },
    spacer: {
      flex: 1,
    },
    signOutSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
    },
    signOutText: {
      fontSize: 15,
      color: colors.destructive,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      flex: 1,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: leftGutter,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    connectionIcon: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    connectionText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.mutedForeground,
    },
    connectionTextConnected: {
      color: '#10B981', // Green for connected
    },
    connectionTextError: {
      color: colors.destructive,
    },
  });

  const getInitials = useCallback(() => {
    // Always use the authenticated user's own profile data
    const profileData = ownProfile || user;
    
    return getAvatarFallback({
      displayName: profileData?.displayName || (user as any)?.displayName,
      username: profileData?.username || (user as any)?.username,
      name: profileData?.name || (user as any)?.name,
      walletAddress: profileData?.walletAddress || profileData?.primaryWalletAddress || (user as any)?.walletAddress || (user as any)?.primaryWalletAddress
    });
  }, [ownProfile, user]);

  const getUserDisplayName = useCallback(() => {
    // Always use the authenticated user's own profile data
    const profileData = ownProfile || user;
    
    // First try displayName from comprehensive profile
    const displayName = profileData?.displayName || (user as any)?.displayName;
    if (displayName && displayName !== 'Anonymous') {
      return displayName;
    }
    
    // Fallback to username
    const username = profileData?.username || (user as any)?.username;
    if (username) {
      return username;
    }
    
    // Fallback to name
    const name = profileData?.name || (user as any)?.name;
    if (name && name !== 'user') {
      return name;
    }
    
    // Fallback to email (without @domain)
    if (profileData?.email) {
      return profileData.email.split('@')[0];
    }
    
    return 'User';
  }, [ownProfile, user]);

  const getUserWalletAddress = useCallback(() => {
    // Always use the authenticated user's own profile data
    const profileData = ownProfile || user;
    
    // Try walletAddress first (from AuthenticatedUser type), then fallbacks
    const walletAddress = profileData?.walletAddress || 
                         profileData?.primaryWalletAddress || 
                         profileData?.wallet_address || 
                         profileData?.userWallet || 
                         user?.walletAddress;
    
    if (walletAddress) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }
    
    return null;
  }, [ownProfile, user]);

  const coreActions = [
    {
      icon: User,
      label: 'Profile',
      onPress: () => {
        Vibration.vibrate(10);
        console.log('🔍 SidebarMenu: Profile button clicked');
        console.log('🔍 SidebarMenu: Full user object:', JSON.stringify(user, null, 2));
        
        // Get wallet address - AuthenticatedUser type uses 'walletAddress'
        const walletAddress = user?.walletAddress;
        
        console.log('🔍 SidebarMenu: Wallet address:', walletAddress);
        
        if (!walletAddress) {
          console.log('🔍 SidebarMenu: User has no wallet address, navigating to profile without wallet params');
          console.log('🔍 SidebarMenu: This is likely an admin user or user who hasnt connected a wallet');
          onNavigate('Profile', undefined);
          onClose();
          return;
        }
        
        const params = {walletAddress};
        console.log('🔍 SidebarMenu: Calling onNavigate with:', 'Profile', params);
        
        onNavigate('Profile', params);
        onClose();
      },
    },
    {
      icon: FileText,
      label: 'Posts',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Posts');
        onClose();
      },
    },
    {
      icon: Bookmark,
      label: 'Receipts',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Receipts');
        onClose();
      },
    },
    {
      icon: Users,
      label: 'Watchlist',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Watchlist');
        onClose();
      },
    },
    {
      icon: Coins,
      label: 'Tokens',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Tokens');
        onClose();
      },
    },
    {
      icon: Star,
      label: 'Points',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Points');
        onClose();
      },
    },
  ];

  const appUtilities = [
    {
      icon: Briefcase,
      label: 'Business',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Business');
        onClose();
      },
    },
    {
      icon: HelpCircle,
      label: 'Help Center',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('HelpCenter');
        onClose();
      },
    },
    {
      icon: Settings,
      label: 'Settings',
      onPress: () => {
        Vibration.vibrate(10);
        onNavigate('Settings');
        onClose();
      },
    },
  ];

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 125,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Vibration.vibrate(10);
    onClose();
  };

  const handleSignOut = async () => {
    Vibration.vibrate(20);
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Connection status removed - using polling instead

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}>

      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose}>

        {/* Animated Sidebar */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{translateX: slideAnim}],
            },
          ]}>
          <View style={styles.safeAreaContainer}>

            {/* Header with Close Button */}
            <View style={styles.header}>
              <Pressable
                style={({pressed}) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close menu">
                <X size={20} color={colors.foreground} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Account Header - Non-tappable */}
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <Avatar
                  src={getUserProfilePicture(ownProfile || user)}
                  fallback={getInitials()}
                  size="md"
                  showRing={(ownProfile || user)?.isVerified}
                  ringColor={colors.success}
                />

                <View style={styles.profileInfo}>
                  <Text style={styles.displayName}>{getUserDisplayName()}</Text>
                  <Text style={styles.email}>
                    {getUserWalletAddress() || 'No wallet connected'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Full Bleed Divider */}
            <View style={styles.fullBleedDivider} />

            <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
              {/* Core Actions Group */}
              <View style={styles.menuSection}>
                {coreActions.map((item, index) => (
                  <Pressable
                    key={`core-${index}`}
                    onPress={item.onPress}
                    style={({pressed}) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}>
                    {({pressed}) => (
                      <>
                        <View style={styles.menuIconContainer}>
                          <item.icon
                            size={20}
                            color={pressed ? colors.primary : '#6B7280'}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuText,
                            pressed && styles.menuTextPressed,
                          ]}>
                          {item.label}
                        </Text>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Full Bleed Divider */}
              <View style={styles.fullBleedDivider} />

              {/* App Utilities Group */}
              <View style={styles.menuSection}>
                {appUtilities.map((item, index) => (
                  <Pressable
                    key={`utility-${index}`}
                    onPress={item.onPress}
                    style={({pressed}) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}>
                    {({pressed}) => (
                      <>
                        <View style={styles.menuIconContainer}>
                          <item.icon
                            size={20}
                            color={pressed ? colors.primary : '#6B7280'}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuText,
                            pressed && styles.menuTextPressed,
                          ]}>
                          {item.label}
                        </Text>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Flex Spacer */}
              <View style={styles.spacer} />

              {/* Sign Out - Pinned to Bottom */}
              <View style={styles.signOutSection}>
                <Pressable
                  onPress={handleSignOut}
                  style={({pressed}) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out of your account">
                  {({pressed}) => (
                    <>
                      <View style={styles.menuIconContainer}>
                        <LogOut
                          size={20}
                          color={colors.destructive}
                          strokeWidth={2}
                        />
                      </View>
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>

            {/* WebSocket status removed - using polling instead */}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
