import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight, User, Globe, Edit3} from 'lucide-react-native';
import {ConsistentHeader} from '../../components/navigation/ConsistentHeader';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {useWalletStore} from '../../store/wallet';
import {socialAPI} from '../../services/api/social';

interface EditUsernameScreenProps {
  navigation: any;
  route: {
    params?: {
      currentUsername?: string;
    };
  };
}

interface Domain {
  domain_name: string;
  verification_status: string;
  created_at: string;
}

export default function EditUsernameScreen({
  navigation,
  route,
}: EditUsernameScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile, loadProfile} = useProfileStore();
  const {publicKey} = useWalletStore();

  const [selectedMode, setSelectedMode] = useState<
    'domain' | 'username' | null
  >(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current username from route params or profile data
  const currentUsername =
    route.params?.currentUsername ||
    currentProfile?.username ||
    (user as any)?.username;

  useEffect(() => {
    checkUserDomains();
  }, [publicKey]);

  const checkUserDomains = async () => {
    if (!publicKey) {
      setDomains([]);
      return;
    }

    setLoadingDomains(true);
    try {
      const response = await socialAPI.getUserDomains(publicKey.toString());
      setDomains(response.domains || []);
    } catch (error) {
      console.error('Failed to check domains:', error);
      setDomains([]);
    } finally {
      setLoadingDomains(false);
    }
  };

  const validateUsername = (text: string): boolean => {
    if (text.length < 3) return false;
    if (text.length > 20) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(text)) return false;
    return true;
  };

  const handleUsernameChange = (text: string) => {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanText);
    setError(null);
  };

  const handleDomainSelection = async (domainName: string) => {
    setIsLoading(true);
    try {
      await socialAPI.updateProfile({username: domainName});
      Alert.alert('Success', 'Username updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            loadProfile(); // Refresh profile data
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to update username:', error);
      Alert.alert('Error', 'Failed to update username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!validateUsername(username)) {
      setError(
        'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await socialAPI.checkUsernameAvailability(username);

      if (!response.available) {
        throw new Error(response.reason || 'This username is already taken');
      }

      await socialAPI.updateProfile({username});
      Alert.alert('Success', 'Username updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            loadProfile(); // Refresh profile data
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Username validation failed:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to validate username. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterCount = () => {
    return `${username.length}/20`;
  };

  const isUsernameValid = username.length >= 3 && validateUsername(username);

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
    cardContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 12,
      fontFamily: 'Inter-SemiBold',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    currentUsernameContainer: {
      backgroundColor: colors.muted,
      padding: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    currentUsernameLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      marginBottom: 4,
    },
    currentUsername: {
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    optionsContainer: {
      marginBottom: 24,
    },
    optionButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 20,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    disabledOption: {
      backgroundColor: colors.muted,
      opacity: 0.7,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      flex: 1,
      marginLeft: 16,
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
      fontFamily: 'Inter-SemiBold',
    },
    optionDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    disabledText: {
      color: colors.mutedForeground,
    },
    formContainer: {
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    inputValid: {
      borderColor: colors.success,
    },
    prefix: {
      fontSize: 16,
      color: colors.mutedForeground,
      paddingLeft: 12,
      fontFamily: 'Inter-Medium',
    },
    input: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    inputFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    helperText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    errorText: {
      color: colors.destructive,
    },
    characterCount: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    continueButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    disabledButton: {
      backgroundColor: colors.muted,
      opacity: 0.6,
    },
    continueButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginRight: 8,
    },
    backButton: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    domainsContainer: {
      marginBottom: 24,
    },
    domainButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      marginVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    domainContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    domainText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginRight: 12,
    },
    verifiedBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
  });

  // Loading state while checking domains
  if (loadingDomains) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ConsistentHeader
          title="Edit Username"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                Checking for .sol domains...
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show domain selection if user chose domain option
  if (selectedMode === 'domain') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ConsistentHeader
          title="Edit Username"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Globe size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>Select your .sol domain</Text>
              <Text style={styles.subtitle}>
                Choose a domain to use as your verified username
              </Text>
            </View>

            <View style={styles.domainsContainer}>
              {domains.map((domain, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.domainButton}
                  onPress={() => handleDomainSelection(domain.domain_name)}
                  disabled={isLoading}>
                  <View style={styles.domainContent}>
                    <Text style={styles.domainText}>@{domain.domain_name}</Text>
                    {domain.verification_status === 'verified' && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>VERIFIED</Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedMode(null)}>
              <Text style={styles.backButtonText}>← Back to options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show username input (for custom username)
  if (selectedMode === 'username') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ConsistentHeader
          title="Edit Username"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Edit3 size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>Choose your username</Text>
              <Text style={styles.subtitle}>
                This will be your unique identifier on Beam.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    error && styles.inputError,
                    isUsernameValid && styles.inputValid,
                  ]}>
                  <Text style={styles.prefix}>@</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="your_username"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    editable={!isLoading}
                  />
                </View>
                <View style={styles.inputFooter}>
                  <Text style={[styles.helperText, error && styles.errorText]}>
                    {error || 'Letters, numbers, and underscores only'}
                  </Text>
                  <Text style={styles.characterCount}>
                    {getCharacterCount()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                (!isUsernameValid || isLoading) && styles.disabledButton,
              ]}
              onPress={handleUsernameSubmit}
              disabled={!isUsernameValid || isLoading}>
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Updating...' : 'Update Username'}
              </Text>
              {!isLoading && (
                <ChevronRight size={20} color={colors.primaryForeground} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedMode(null)}>
              <Text style={styles.backButtonText}>← Back to options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show initial choice screen (domain vs username)
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ConsistentHeader
        title="Edit Username"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <View style={styles.cardContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <User size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Edit your username</Text>
            <Text style={styles.subtitle}>
              Select how you want to update your username on Beam
            </Text>
          </View>

          {currentUsername && (
            <View style={styles.currentUsernameContainer}>
              <Text style={styles.currentUsernameLabel}>Current username</Text>
              <Text style={styles.currentUsername}>{currentUsername}</Text>
            </View>
          )}

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                domains.length === 0 && styles.disabledOption,
              ]}
              onPress={() =>
                domains.length > 0 ? setSelectedMode('domain') : null
              }
              disabled={domains.length === 0}>
              <View style={styles.optionContent}>
                <Globe
                  size={32}
                  color={
                    domains.length > 0 ? colors.primary : colors.mutedForeground
                  }
                />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      domains.length === 0 && styles.disabledText,
                    ]}>
                    Connect a .sol domain
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      domains.length === 0 && styles.disabledText,
                    ]}>
                    {domains.length === 0
                      ? '0 domains detected'
                      : 'Get a verified username from your domain'}
                  </Text>
                </View>
                {domains.length > 0 && (
                  <ChevronRight size={20} color={colors.mutedForeground} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setSelectedMode('username')}>
              <View style={styles.optionContent}>
                <Edit3 size={32} color={colors.primary} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Choose a username</Text>
                  <Text style={styles.optionDescription}>
                    Create a custom username
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
