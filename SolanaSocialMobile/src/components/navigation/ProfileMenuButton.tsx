import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {Menu} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {getUserProfilePicture} from '../../utils/profileUtils';

interface ProfileMenuButtonProps {
  onPress: () => void;
}

export function ProfileMenuButton({onPress}: ProfileMenuButtonProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile} = useProfileStore();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      paddingLeft: 16,
      paddingRight: 8,
      paddingTop: Math.max(insets.top, 8),
      paddingBottom: 8,
      minHeight: 44,
      justifyContent: 'center',
    },
    avatarContainer: {
      position: 'relative',
    },
    menuIndicator: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.background,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  });

  // Get profile picture from comprehensive profile data
  const getProfilePicture = () => {
    return getUserProfilePicture(currentProfile || user);
  };

  // Get fallback text using comprehensive profile logic
  const getFallbackText = () => {
    // First try displayName from comprehensive profile
    const displayName = currentProfile?.displayName || (user as any)?.displayName;
    if (displayName && displayName !== 'Anonymous') {
      return displayName.charAt(0).toUpperCase();
    }
    
    // Fallback to username
    const username = currentProfile?.username || (user as any)?.username;
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    
    // Fallback to name
    const name = currentProfile?.name || (user as any)?.name;
    if (name && name !== 'user') {
      return name.charAt(0).toUpperCase();
    }
    
    // Fallback to email
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    // Final fallback to wallet address
    const walletAddress = currentProfile?.primaryWalletAddress || 
                          currentProfile?.wallet_address || 
                          currentProfile?.userWallet || 
                          currentProfile?.walletAddress || 
                          user?.walletAddress;
    if (walletAddress) {
      return walletAddress.slice(0, 1).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityLabel="Open profile menu"
      accessibilityRole="button">
      <View style={styles.avatarContainer}>
        <Avatar
          src={getProfilePicture()}
          fallback={getFallbackText()}
          size="md"
          showRing={currentProfile?.isVerified || currentProfile?.isVerifiedCreator || user?.isVerified}
          ringColor={colors.success}
        />

        <View style={styles.menuIndicator}>
          <Menu size={8} color={colors.mutedForeground} />
        </View>
      </View>
    </Pressable>
  );
}
