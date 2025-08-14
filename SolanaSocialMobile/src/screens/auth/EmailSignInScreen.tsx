import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
  Image,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {AuthStackScreenProps} from '../../types/navigation';
import {Button} from '../../components/ui/button';
import {PasswordInput} from '../../components/ui/PasswordInput';
import {authAPI} from '../../services/api/auth';
import {extractErrorMessage} from '../../utils/errorMessages';

type Props = AuthStackScreenProps<'EmailSignIn'>;

export default function EmailSignInScreen({navigation}: Props) {
  const {colors, isDark} = useThemeStore();
  const {signInWithEmail} = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    header: {
      marginBottom: 0,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      width: 160,
      height: 112,
    },
    backButton: {
      marginBottom: 16,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter',
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Inter',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 24,
      fontFamily: 'Inter',
    },
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 32,
      marginBottom: 24,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      backdropFilter: 'blur(8px)',
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
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.foreground,
      backgroundColor: colors.card,
      fontFamily: 'Inter',
    },
    inputFocused: {
      borderColor: '#3b82f6',
      backgroundColor: colors.card,
    },
    signInButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
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
      marginTop: 16,
      marginBottom: 16,
    },
    signInButtonDisabled: {
      opacity: 0.6,
    },
    signInButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter',
    },
    forgotPassword: {
      alignSelf: 'center',
      marginTop: 16,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '500',
      fontFamily: 'Inter',
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    signUpText: {
      color: colors.mutedForeground,
      fontSize: 13,
      fontFamily: 'Inter',
    },
    signUpLink: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 4,
      fontFamily: 'Inter',
    },
    errorContainer: {
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.destructive + '10',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.destructive + '20',
    },
    errorText: {
      color: colors.destructive,
      fontSize: 14,
      fontFamily: 'Inter',
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const handleEmailSignIn = async () => {
    // Clear previous errors
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // Use auth store to handle login and navigation
      await signInWithEmail(email.trim().toLowerCase(), password, false);

      // Success! Navigation will happen automatically via AppNavigator
      console.log('User signed in successfully, navigating to feed...');
    } catch (error) {
      console.error('Email sign in error:', error);
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        translucent={true}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <ImageBackground
        source={isDark ? require('../../assets/splash-dark-mode.png') : require('../../assets/beam-banner.png')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Form Card */}
            <View style={styles.formContainer}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                  <Image
                    source={isDark ? require('../../assets/logo-dark-mode.png') : require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <PasswordInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Enter your password"
                autoComplete="password"
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                labelStyle={styles.label}
              />

              <TouchableOpacity
                style={[
                  styles.signInButton,
                  loading && styles.signInButtonDisabled,
                ]}
                onPress={handleEmailSignIn}
                disabled={loading}>
                <Text style={styles.signInButtonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EmailSignUp')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}
