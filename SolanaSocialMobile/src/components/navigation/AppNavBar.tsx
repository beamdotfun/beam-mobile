import React from 'react';
import {View, Text, Pressable, StyleSheet, Vibration} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Plus} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {getUserProfilePicture} from '../../utils/profileUtils';

interface AppNavBarProps {
  /** Title displayed in center. Hidden if showTitle is false */
  title?: string;
  /** Whether to show the title in center. Default: true */
  showTitle?: boolean;
  /** Show back arrow instead of profile pic. For settings pages */
  showBackButton?: boolean;
  /** Back button press handler */
  onBackPress?: () => void;
  /** Profile menu button press handler */
  onProfilePress?: () => void;
  /** New post button press handler */
  onNewPostPress?: () => void;
  /** Custom right component (overrides new post button) */
  rightComponent?: React.ReactNode;
  /** Custom subtitle/content below title */
  subtitle?: string | React.ReactNode;
}

export function AppNavBar({
  title,
  showTitle = true,
  showBackButton = false,
  onBackPress,
  onProfilePress,
  onNewPostPress,
  rightComponent,
  subtitle,
}: AppNavBarProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    leftSide: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    center: {
      flex: 2,
      alignItems: 'center',
    },
    rightSide: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginTop: 2,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newPostButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    newPostButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
  });

  // Get profile picture from authenticated user only (not visited profiles)
  const getProfilePicture = () => {
    return getUserProfilePicture(user);
  };

  // Get fallback text using authenticated user data only
  const getFallbackText = () => {
    // First try displayName from user
    const displayName = (user as any)?.displayName;
    if (displayName && displayName !== 'Anonymous') {
      return displayName.charAt(0).toUpperCase();
    }
    
    // Fallback to username
    const username = (user as any)?.username;
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    
    // Fallback to name
    const name = (user as any)?.name;
    if (name && name !== 'user') {
      return name.charAt(0).toUpperCase();
    }
    
    // Fallback to email
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    // Final fallback to wallet address
    const walletAddress = user?.walletAddress || 
                          (user as any)?.primaryWalletAddress || 
                          (user as any)?.primary_wallet_address;
    if (walletAddress) {
      return walletAddress.slice(0, 1).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <View style={styles.container}>
      {/* Left Side */}
      <View style={styles.leftSide}>
        {showBackButton ? (
          <Pressable
            onPress={onBackPress}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button">
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              Vibration.vibrate(10);
              onProfilePress?.();
            }}
            style={styles.avatarButton}
            accessibilityLabel="Open profile menu"
            accessibilityRole="button">
            <Avatar
              src={getProfilePicture()}
              fallback={getFallbackText()}
              size="md"
              showRing={user?.isVerified || (user as any)?.is_verified}
              ringColor={colors.success}
            />
          </Pressable>
        )}
      </View>

      {/* Center */}
      <View style={styles.center}>
        {showTitle && title && (
          <>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              typeof subtitle === 'string' ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : (
                subtitle
              )
            )}
          </>
        )}
      </View>

      {/* Right Side */}
      <View style={styles.rightSide}>
        {rightComponent ? (
          rightComponent
        ) : (
          onNewPostPress && (
            <Pressable
              onPress={() => {
                Vibration.vibrate(10);
                onNewPostPress();
              }}
              style={styles.newPostButton}
              accessibilityLabel="Create new post"
              accessibilityRole="button">
              <Plus size={14} color={colors.primary} />
              <Text style={styles.newPostButtonText}>NEW POST</Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}