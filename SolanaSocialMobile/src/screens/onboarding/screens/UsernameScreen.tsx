import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {ChevronRight, User, Globe, Edit3} from 'lucide-react-native';

import {useWalletStore} from '../../../store/wallet';
import {useThemeStore} from '../../../store/themeStore';
import {socialAPI} from '../../../services/api/social';

interface UsernameScreenProps {
  onComplete: (username: string) => void;
  onSkip: () => void;
}

interface Domain {
  domain_name: string;
  verification_status: string;
  created_at: string;
}

export const UsernameScreen: React.FC<UsernameScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const {publicKey} = useWalletStore();
  const {colors, isDark} = useThemeStore();

  // Define styles at the top with colors available
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    cardContainer: {
      backgroundColor: colors.card + 'F2',
      borderRadius: 12,
      padding: 32,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      backdropFilter: 'blur(8px)',
      maxWidth: 400,
      width: '100%',
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
      fontFamily: 'Inter',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'Inter',
      fontWeight: '400',
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
      fontFamily: 'Inter',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    prefix: {
      fontSize: 16,
      color: colors.mutedForeground,
      paddingLeft: 12,
      fontFamily: 'Inter',
      fontWeight: '500',
    },
    input: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter',
    },
    inputError: {
      borderColor: '#ef4444',
    },
    inputValid: {
      borderColor: '#10b981',
    },
    inputFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    helperText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter',
    },
    errorText: {
      color: '#ef4444',
    },
    characterCount: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter',
    },
    exampleContainer: {
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
    },
    exampleTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 4,
      fontFamily: 'Inter',
    },
    exampleText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter',
    },
    continueButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    disabledButton: {
      backgroundColor: colors.muted,
      opacity: 0.6,
    },
    disabledOption: {
      backgroundColor: colors.muted,
      borderColor: colors.border,
      opacity: 0.7,
    },
    disabledText: {
      color: colors.mutedForeground,
    },
    continueButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter',
    },
    iconSpacer: {
      width: 8,
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    skipButtonText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontWeight: '400',
      fontFamily: 'Inter',
      textDecorationLine: 'underline',
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
      fontFamily: 'Inter',
    },
    optionsContainer: {
      width: '100%',
      marginBottom: 24,
    },
    optionButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 20,
      marginVertical: 8,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
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
      fontFamily: 'Inter',
      lineHeight: 20,
    },
    optionDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter',
      lineHeight: 18,
    },
    domainsContainer: {
      width: '100%',
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
      fontFamily: 'Inter',
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
      fontFamily: 'Inter',
    },
    backButton: {
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter',
    },
  });
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [showDomainChoice, setShowDomainChoice] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'domain' | 'username' | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserDomains();
  }, [publicKey]);

  const checkUserDomains = async () => {
    if (!publicKey) {
      setDomains([]);
      setLoadingDomains(false);
      return;
    }
    
    setLoadingDomains(true);
    try {
      const response = await socialAPI.getUserDomains(publicKey.toString());
      setDomains(response.domains || []);
    } catch (error) {
      console.error('Failed to check domains:', error);
      setDomains([]); // Set empty array on error
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

  const handleDomainSelection = (domainName: string) => {
    setSelectedDomain(domainName);
    onComplete(domainName); // Domain serves as verified username
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await socialAPI.checkUsernameAvailability(username);
      
      if (!response.available) {
        throw new Error(response.reason || 'This username is already taken');
      }

      onComplete(username);
    } catch (error) {
      console.error('Username validation failed:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to validate username. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterCount = () => {
    return `${username.length}/20`;
  };

  const isUsernameValid = username.length >= 3 && validateUsername(username);

  // Loading state while checking domains
  if (loadingDomains) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={isDark ? require('../../../assets/beam-banner-dark-mode.png') : require('../../../assets/beam-banner.png')}
          style={styles.backgroundImage}
          resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.content}>
              <View style={styles.cardContainer}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Checking for .sol domains...</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // This old conditional branch is now handled above
  // Show domain vs username choice for wallet users with domains
  if (false) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={isDark ? require('../../../assets/beam-banner-dark-mode.png') : require('../../../assets/beam-banner.png')}
          style={styles.backgroundImage}
          resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.content}>
              <View style={styles.cardContainer}>
                <View style={styles.headerContainer}>
                  <View style={styles.iconContainer}>
                    <User size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.title}>Choose your username</Text>
                  <Text style={styles.subtitle}>
                    We found {domains.length} .sol domain{domains.length > 1 ? 's' : ''} in your wallet. Choose an option:
                  </Text>
                </View>

                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setSelectedMode('domain')}
                    activeOpacity={0.8}>
                    <View style={styles.optionContent}>
                      <Globe size={32} color={colors.primary} />
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>Connect a .sol domain</Text>
                        <Text style={styles.optionDescription}>
                          Get a verified username from your domain
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setSelectedMode('username')}
                    activeOpacity={0.8}>
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

                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // Show domain selection if user chose domain option
  if (selectedMode === 'domain') {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={isDark ? require('../../../assets/beam-banner-dark-mode.png') : require('../../../assets/beam-banner.png')}
          style={styles.backgroundImage}
          resizeMode="cover">
          <View style={styles.overlay}>
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
                      activeOpacity={0.8}>
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
          </View>
        </ImageBackground>
      </View>
    );
  }

  // Show initial choice screen (domain vs username)
  if (!selectedMode) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={isDark ? require('../../../assets/beam-banner-dark-mode.png') : require('../../../assets/beam-banner.png')}
          style={styles.backgroundImage}
          resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.content}>
              <View style={styles.cardContainer}>
                <View style={styles.headerContainer}>
                  <View style={styles.iconContainer}>
                    <User size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.title}>Choose your username</Text>
                  <Text style={styles.subtitle}>
                    Select how you want to set up your username on Beam
                  </Text>
                </View>

                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      domains.length === 0 && styles.disabledOption
                    ]}
                    onPress={() => domains.length > 0 ? setSelectedMode('domain') : null}
                    activeOpacity={domains.length > 0 ? 0.8 : 1}
                    disabled={domains.length === 0}>
                    <View style={styles.optionContent}>
                      <Globe size={32} color={domains.length > 0 ? colors.primary : colors.mutedForeground} />
                      <View style={styles.optionText}>
                        <Text style={[
                          styles.optionTitle,
                          domains.length === 0 && styles.disabledText
                        ]}>
                          Connect a .sol domain
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          domains.length === 0 && styles.disabledText
                        ]}>
                          {domains.length === 0 ? '0 domains detected' : 'Get a verified username from your domain'}
                        </Text>
                      </View>
                      {domains.length > 0 && <ChevronRight size={20} color="#6b7280" />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setSelectedMode('username')}
                    activeOpacity={0.8}>
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

                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // Show username input (for custom username)
  if (selectedMode === 'username') {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={isDark ? require('../../../assets/beam-banner-dark-mode.png') : require('../../../assets/beam-banner.png')}
          style={styles.backgroundImage}
          resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.content}>
              <View style={styles.cardContainer}>
                <View style={styles.headerContainer}>
                  <View style={styles.iconContainer}>
                    <Edit3 size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.title}>Choose your username</Text>
                  <Text style={styles.subtitle}>
                    This will be your unique identifier on Beam. You can change it later in settings.
                  </Text>
                </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.prefix}>@</Text>
                    <TextInput
                      style={[
                        styles.input,
                        error && styles.inputError,
                        isUsernameValid && styles.inputValid,
                      ]}
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
                    <Text style={styles.characterCount}>{getCharacterCount()}</Text>
                  </View>
                </View>

                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleTitle}>Examples:</Text>
                  <Text style={styles.exampleText}>@john_doe, @crypto_trader, @beam_user</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!isUsernameValid || isLoading) && styles.disabledButton,
                ]}
                onPress={handleUsernameSubmit}
                disabled={!isUsernameValid || isLoading}
                activeOpacity={0.8}>
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                    <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>
                      Checking...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.continueButtonText}>
                      Continue
                    </Text>
                    <View style={styles.iconSpacer} />
                    <ChevronRight size={20} color={colors.primaryForeground} />
                  </>
                )}
              </TouchableOpacity>

              {selectedMode && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedMode(null)}>
                  <Text style={styles.backButtonText}>← Back to options</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
  }
};