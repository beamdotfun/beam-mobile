import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ArrowLeft} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {getUserProfilePicture} from '../../utils/profileUtils';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onMenuPress: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  showBackButton = true,
  onMenuPress,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile} = useProfileStore();

  const handleBack = () => {
    // Always navigate back to Feed when back button is pressed
    // Reset the navigation stack to ensure we go to Feed
    navigation.reset({
      index: 0,
      routes: [{name: 'Feed', params: {screen: 'FeedHome'}}],
    });
  };

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

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    avatarButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back to feed">
            <ArrowLeft size={20} color={colors.foreground} />
          </Pressable>
        )}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <Pressable
        style={styles.avatarButton}
        onPress={onMenuPress}
        accessibilityLabel="Open profile menu">
        <Avatar
          src={getProfilePicture()}
          fallback={getFallbackText()}
          size="sm"
          showRing={currentProfile?.isVerified || currentProfile?.isVerifiedCreator || user?.isVerified}
          ringColor={colors.success}
        />
      </Pressable>
    </View>
  );
}