import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Image, Shield, ChevronRight} from 'lucide-react-native';
import {
  launchImageLibrary,
  ImagePickerResponse,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import {ConsistentHeader} from '../../components/navigation/ConsistentHeader';
import {useThemeStore} from '../../store/themeStore';
import {Avatar} from '../../components/ui/avatar';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {Toast} from '../../components/ui/Toast';

interface EditProfilePictureScreenProps {
  navigation: any;
}

export default function EditProfilePictureScreen({navigation}: EditProfilePictureScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile, uploadProfilePicture} = useProfileStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Get current profile picture from comprehensive profile or user data
  const currentProfilePicture = currentProfile?.profilePicture || 
                               currentProfile?.profile_image_url || 
                               user?.profilePicture;

  // Get display name for avatar fallback
  const displayName = currentProfile?.displayName || 
                      (user as any)?.displayName || 
                      user?.displayName;

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast(prev => ({...prev, visible: false}));
  };

  const validateFile = (file: any): { valid: boolean; error?: string } => {
    // Size check (5MB max)
    if (file.fileSize && file.fileSize > 5 * 1024 * 1024) {
      return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }
    
    // Type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.type && !allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, or WebP.' };
    }
    
    return { valid: true };
  };

  const handleUnverifiedUpload = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 0.9,
    };

    launchImageLibrary(options, async (response: ImagePickerResponse) => {
      if (response.didCancel || !response.assets || response.assets.length === 0) {
        return;
      }

      if (response.errorMessage) {
        showToast(response.errorMessage, 'error');
        return;
      }

      const asset = response.assets[0];
      
      // Validate file
      const validation = validateFile(asset);
      if (!validation.valid) {
        showToast(validation.error!, 'error');
        return;
      }

      // Show loading state
      setIsLoading(true);

      try {
        // Upload the image
        const newProfilePictureUrl = await uploadProfilePicture(asset);
        
        // Show success message and navigate back after a short delay
        showToast('Profile picture updated successfully!', 'success');
        
        // Navigate back after toast is shown
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
        
      } catch (error: any) {
        console.error('Upload error:', error);
        showToast(
          error.message || 'Failed to upload profile picture. Please try again.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleVerifiedNFT = () => {
    navigation.navigate('NFTSelection');
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
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.foreground,
      marginTop: 12,
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ConsistentHeader title="Update Profile Picture" onBack={() => navigation.goBack()} />
      
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Uploading profile picture...</Text>
          </View>
        </View>
      )}
      
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