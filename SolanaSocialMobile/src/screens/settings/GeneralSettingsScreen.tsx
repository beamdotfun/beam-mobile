import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Check,
  Edit3,
  Camera,
} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {useWalletStore} from '../../store/wallet';
import {AppNavBar} from '../../components/navigation/AppNavBar';

interface GeneralSettingsScreenProps {
  navigation: any;
}

export default function GeneralSettingsScreen({navigation}: GeneralSettingsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile, loadProfile} = useProfileStore();
  const {publicKey} = useWalletStore();
  
  // Get the most complete profile data available
  const profileData = currentProfile || user;
  
  // DETAILED LOGGING: Log all available user data
  console.log('🔍 GeneralSettingsScreen: Data available:');
  console.log('  - user from auth store:', JSON.stringify(user, null, 2));
  console.log('  - currentProfile from profile store:', JSON.stringify(currentProfile, null, 2));
  console.log('  - final profileData:', JSON.stringify(profileData, null, 2));
  
  // Local state for form fields with proper prepopulation
  const [description, setDescription] = useState(
    currentProfile?.description || user?.description || user?.bio || ''
  );
  const [location, setLocation] = useState(
    currentProfile?.location || user?.location || ''
  );
  const [website, setWebsite] = useState(
    currentProfile?.website || user?.website || ''
  );
  const [timeFunLink, setTimeFunLink] = useState(
    currentProfile?.timefun || user?.timefun || ''
  );

  // Load comprehensive profile data on mount
  useEffect(() => {
    console.log('🔍 GeneralSettingsScreen: Loading comprehensive profile...');
    loadProfile(); // This will load the current user's comprehensive profile
  }, [loadProfile]);

  // Update form fields when profile data loads/changes OR when user data is available
  useEffect(() => {
    console.log('🔍 GeneralSettingsScreen: useEffect triggered');
    console.log('  - currentProfile exists:', !!currentProfile);
    console.log('  - user exists:', !!user);
    
    // Use currentProfile data if available, otherwise fall back to user data
    const newDescription = currentProfile?.description || user?.description || user?.bio || '';
    const newLocation = currentProfile?.location || user?.location || '';
    const newWebsite = currentProfile?.website || user?.website || '';
    const newTimeFunLink = currentProfile?.timefun || user?.timefun || '';
    
    console.log('🔍 GeneralSettingsScreen: Setting form values from', currentProfile ? 'currentProfile' : 'user data');
    console.log('  - description:', newDescription);
    console.log('  - location:', newLocation);
    console.log('  - website:', newWebsite);
    console.log('  - timeFunLink:', newTimeFunLink);
    
    setDescription(newDescription);
    setLocation(newLocation);
    setWebsite(newWebsite);
    setTimeFunLink(newTimeFunLink);
  }, [currentProfile, user?.description, user?.bio, user?.location, user?.website, user?.timefun]);

  const handleVerifyProfile = useCallback(() => {
    // Get the user's wallet address and display name for verification screen
    const walletAddress = publicKey?.toString() || profileData?.primaryWalletAddress || profileData?.walletAddress;
    const displayName = profileData?.displayName || profileData?.name || 'Your Profile';
    
    if (!walletAddress) {
      // If no wallet address available, still navigate but let the verification screen handle the error
      navigation.navigate('Verification', {
        targetWallet: '',
        targetName: displayName,
      });
      return;
    }
    
    // Navigate to the verification screen with user's own wallet details for self-verification
    navigation.navigate('Verification', {
      targetWallet: walletAddress,
      targetName: displayName,
    });
  }, [navigation, publicKey, profileData]);

  const handleEditAvatar = useCallback(() => {
    navigation.navigate('EditProfilePicture');
  }, [navigation]);

  const handleEditUsername = useCallback(() => {
    // Navigate to username editing screen
    navigation.navigate('EditUsername', {
      currentUsername: profileData?.username || (user as any)?.username,
    });
  }, [navigation, profileData?.username, user]);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  const {updateProfile} = useProfileStore();

  const handleSaveChanges = useCallback(async () => {
    if (saving) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      await updateProfile({
        description,
        location,
        website,
        timefun: timeFunLink,
      });
      
      setSaveMessage('Profile updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save profile changes:', error);
      setSaveMessage('Failed to save changes. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  }, [description, location, website, timeFunLink, updateProfile, saving]);

  const getUserHandle = () => {
    console.log('🔍 getUserHandle - profileData available fields:', Object.keys(profileData || {}));
    console.log('🔍 getUserHandle - user available fields:', Object.keys(user || {}));
    
    // Helper function to ensure @ prefix without duplication
    const ensureAtPrefix = (value: string) => {
      return value.startsWith('@') ? value : `@${value}`;
    };
    
    // The comprehensive endpoint provides a computed displayName that handles all the logic
    // Priority: verified SNS domain > traditional name > truncated wallet > "Anonymous"
    const displayName = profileData?.displayName || (user as any)?.displayName;
    if (displayName && displayName !== 'Anonymous') {
      console.log('✅ Found displayName from comprehensive endpoint:', displayName);
      return ensureAtPrefix(displayName);
    }
    
    // Fallback: check for username field (SNS domain)
    const username = profileData?.username || (user as any)?.username;
    if (username) {
      console.log('✅ Found username field:', username);
      return ensureAtPrefix(username);
    }
    
    // Fallback: check for traditional name
    const name = profileData?.name || (user as any)?.name;
    if (name && name !== 'user') {
      console.log('✅ Found name field:', name);
      return ensureAtPrefix(name);
    }
    
    // Final fallback: truncated wallet address (no @ for wallet addresses)
    const walletAddress = profileData?.primaryWalletAddress || profileData?.wallet_address || 
                          profileData?.userWallet || profileData?.walletAddress || 
                          user?.walletAddress;
    if (walletAddress) {
      console.log('✅ Found wallet address for fallback:', walletAddress);
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }
    
    console.log('❌ No display data found, using @user fallback');
    return '@user';
  };

  const getUserDomain = () => {
    const displayName = profileData?.displayName || 'user';
    return `${displayName}@social.sol`;
  };

  const getMemberSinceDate = () => {
    // Check the correct date fields from comprehensive endpoint
    const joinedDate = profileData?.joinedDate || profileData?.date_joined || 
                      (user as any)?.joinedDate || user?.joinedAt;
    
    console.log('🔍 getMemberSinceDate - checking date fields:', {
      'profileData.joinedDate': profileData?.joinedDate,
      'profileData.date_joined': profileData?.date_joined,
      'user.joinedDate': (user as any)?.joinedDate,
      'user.joinedAt': user?.joinedAt,
    });
    
    if (joinedDate) {
      try {
        const date = new Date(joinedDate);
        const options: Intl.DateTimeFormatOptions = { 
          year: 'numeric', 
          month: 'long' 
        };
        return `Member since ${date.toLocaleDateString('en-US', options)}`;
      } catch (error) {
        console.error('Error formatting member date:', error);
      }
    }
    
    return 'Member since recently';
  };

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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    cardHeaderInfo: {
      flex: 1,
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
    verifyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
    },
    verifyButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginLeft: 6,
    },
    avatarSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 16,
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    userInfo: {
      flex: 1,
      paddingTop: 8,
    },
    userHandle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    memberSince: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginBottom: 4,
    },
    profileStatus: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    usernameSection: {
      marginBottom: 24,
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    usernamePill: {
      backgroundColor: colors.muted,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      marginRight: 12,
    },
    usernameText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    usernameButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    usernameButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      height: 36,
      justifyContent: 'center',
    },
    usernameButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    usernameSubtext: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    formSection: {
      gap: 12,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      height: 44,
    },
    textArea: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      minHeight: 96,
      textAlignVertical: 'top',
    },
    saveButtonContainer: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bottomContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    saveButtonDisabled: {
      backgroundColor: colors.muted,
    },
    saveMessage: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveMessageSuccess: {
      backgroundColor: colors.success + '20',
    },
    saveMessageError: {
      backgroundColor: colors.destructive + '20',
    },
    saveMessageText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    saveMessageTextSuccess: {
      color: colors.success,
    },
    saveMessageTextError: {
      color: colors.destructive,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppNavBar 
        title="General Settings" 
        showBackButton={true} 
        onBackPress={() => navigation.navigate('Settings')} 
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                <Text style={styles.cardSubtitle}>
                  Manage your public profile details
                </Text>
              </View>
              <Pressable style={styles.verifyButton} onPress={handleVerifyProfile}>
                <Check size={16} color={colors.foreground} />
                <Text style={styles.verifyButtonText}>Verify</Text>
              </Pressable>
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Avatar
                  src={profileData?.profilePicture}
                  fallback={profileData?.displayName?.charAt(0) || profileData?.userWallet?.slice(0, 2) || profileData?.walletAddress?.slice(0, 2) || 'U'}
                  size="xl"
                  showRing={profileData?.isVerified || profileData?.isVerifiedCreator}
                  ringColor={colors.success}
                />
                <Pressable style={styles.avatarEditButton} onPress={handleEditAvatar}>
                  <Camera size={16} color={colors.primaryForeground} />
                </Pressable>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userHandle}>{getUserHandle()}</Text>
                <Text style={styles.memberSince}>{getMemberSinceDate()}</Text>
                <Text style={styles.profileStatus}>Profile picture: Unverified</Text>
              </View>
            </View>

            {/* Section Divider */}
            <View style={styles.sectionDivider} />

            {/* Username Section */}
            <View style={styles.usernameSection}>
              <Text style={styles.usernameSubtext}>
                Your unique username on the Beam social network
              </Text>
              <View style={styles.usernameButtons}>
                <Pressable style={styles.usernameButton} onPress={handleEditUsername}>
                  <Text style={styles.usernameButtonText}>Edit Username</Text>
                </Pressable>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={280}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Where are you located?"
                  placeholderTextColor={colors.mutedForeground}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Website</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://your-website.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={website}
                  onChangeText={setWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Time.fun Link</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://time.fun/your-profile"
                  placeholderTextColor={colors.mutedForeground}
                  value={timeFunLink}
                  onChangeText={setTimeFunLink}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Save Button Section */}
            <View style={styles.saveButtonContainer}>
              {/* Save Message */}
              {saveMessage && (
                <View style={[
                  styles.saveMessage,
                  saveMessage.includes('successfully') ? styles.saveMessageSuccess : styles.saveMessageError
                ]}>
                  <Text style={[
                    styles.saveMessageText,
                    saveMessage.includes('successfully') ? styles.saveMessageTextSuccess : styles.saveMessageTextError
                  ]}>
                    {saveMessage}
                  </Text>
                </View>
              )}
              
              <Pressable 
                style={[
                  styles.saveButton,
                  saving && styles.saveButtonDisabled
                ]} 
                onPress={handleSaveChanges}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Add some bottom spacing */}
          <View style={{height: 100}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}