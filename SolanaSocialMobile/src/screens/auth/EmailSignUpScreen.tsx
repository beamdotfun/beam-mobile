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

type Props = AuthStackScreenProps<'EmailSignUp'>;

export default function EmailSignUpScreen({navigation}: Props) {
  const {colors, isDark} = useThemeStore();
  const {signUpWithEmail} = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

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
    optionalLabel: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: 'Inter',
    },
    passwordHelper: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 4,
      fontFamily: 'Inter',
    },
    createAccountButton: {
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
    createAccountButtonDisabled: {
      opacity: 0.6,
    },
    createAccountButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter',
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    signInText: {
      color: colors.mutedForeground,
      fontSize: 13,
      fontFamily: 'Inter',
    },
    signInLink: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 4,
      fontFamily: 'Inter',
    },
  });

  const handleEmailSignUp = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Use auth store to handle registration and navigation
      await signUpWithEmail(
        email.trim().toLowerCase(),
        password,
        referralCode.trim() || undefined,
      );

      // Success! Navigation will happen automatically via AppNavigator
      console.log('User registered successfully, navigating to feed...');
    } catch (error) {
      console.error('Email registration error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';

      // Handle specific error cases
      if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('already registered')
      ) {
        Alert.alert(
          'Registration Failed',
          'An account with this email already exists. Please try signing in instead.',
        );
      } else if (errorMessage.includes('Too many')) {
        Alert.alert(
          'Too Many Attempts',
          'Too many registration attempts. Please try again later.',
        );
      } else {
        Alert.alert('Registration Failed', errorMessage);
      }
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
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
                onChangeText={setPassword}
                placeholder="Create a password"
                autoComplete="new-password"
                helperText="Must be at least 8 characters long"
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                labelStyle={styles.label}
              />

              <PasswordInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                autoComplete="new-password"
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                labelStyle={styles.label}
              />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Referral Code{' '}
                  <Text style={styles.optionalLabel}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Enter referral code"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.createAccountButton,
                  loading && styles.createAccountButtonDisabled,
                ]}
                onPress={handleEmailSignUp}
                disabled={loading}>
                <Text style={styles.createAccountButtonText}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}
