import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Image, Shield, ChevronRight} from 'lucide-react-native';
import {ConsistentHeader} from '../../components/navigation/ConsistentHeader';
import {useThemeStore} from '../../store/themeStore';
import {Avatar} from '../../components/ui/avatar';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';

interface EditProfilePictureScreenProps {
  navigation: any;
}

export default function EditProfilePictureScreen({navigation}: EditProfilePictureScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile} = useProfileStore();
  
  const [isLoading, setIsLoading] = useState(false);

  // Get current profile picture from comprehensive profile or user data
  const currentProfilePicture = currentProfile?.profilePicture || 
                               currentProfile?.profile_image_url || 
                               user?.profilePicture;

  // Get display name for avatar fallback
  const displayName = currentProfile?.displayName || 
                      (user as any)?.displayName || 
                      user?.displayName;

  const handleUnverifiedUpload = () => {
    // TODO: Implement image picker and upload
    Alert.alert(
      'Coming Soon', 
      'Image upload functionality will be implemented soon.',
      [{text: 'OK'}]
    );
  };

  const handleVerifiedNFT = () => {
    // TODO: Navigate to NFT selection screen
    Alert.alert(
      'Coming Soon', 
      'NFT profile picture selection will be implemented soon.',
      [{text: 'OK'}]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    currentAvatarContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Inter-SemiBold',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    optionsContainer: {
      gap: 16,
    },
    optionCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    optionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      flex: 1,
    },
    recommendedBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    recommendedText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    optionDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    disabledCard: {
      opacity: 0.6,
      backgroundColor: colors.muted,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ConsistentHeader title="Update Profile Picture" onBack={() => navigation.goBack()} />
      
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={styles.currentAvatarContainer}>
            <Avatar
              src={currentProfilePicture}
              fallback={displayName?.charAt(0) || 'U'}
              size="xl"
              showRing={currentProfile?.isVerified || user?.isVerified}
              ringColor={colors.success}
            />
          </View>
          
          <Text style={styles.title}>Update Profile Picture</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to set your profile picture
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Unverified Profile Picture Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleUnverifiedUpload}
            disabled={isLoading}>
            <View style={styles.optionHeader}>
              <View style={styles.optionHeaderLeft}>
                <View style={styles.optionIcon}>
                  <Image size={24} color={colors.primary} />
                </View>
                <Text style={styles.optionTitle}>Unverified Profile Picture</Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </View>
            <Text style={styles.optionDescription}>
              Upload any image from your device
            </Text>
          </TouchableOpacity>

          {/* Verified Profile Picture Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleVerifiedNFT}
            disabled={isLoading}>
            <View style={styles.optionHeader}>
              <View style={styles.optionHeaderLeft}>
                <View style={styles.optionIcon}>
                  <Shield size={24} color={colors.success} />
                </View>
                <Text style={styles.optionTitle}>Verified Profile Picture</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </View>
            <Text style={styles.optionDescription}>
              Select an NFT from your wallet as a verified avatar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}