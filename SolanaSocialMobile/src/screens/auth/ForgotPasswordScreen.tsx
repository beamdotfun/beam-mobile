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
import {AuthStackScreenProps} from '../../types/navigation';
import {authAPI} from '../../services/api/auth';
import {Button} from '../../components/ui/button';

type Props = AuthStackScreenProps<'ForgotPassword'>;

export default function ForgotPasswordScreen({navigation}: Props) {
  const {colors, isDark} = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    resetButton: {
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
    resetButtonDisabled: {
      opacity: 0.6,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter',
    },
    successContainer: {
      backgroundColor: colors.success + '10',
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.success,
    },
    successText: {
      fontSize: 14,
      color: colors.success,
      textAlign: 'center',
      fontFamily: 'Inter',
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    signInText: {
      fontSize: 14,
      color: colors.mutedForeground,
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

  const handlePasswordReset = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Call password reset API
      await authAPI.requestPasswordReset(email.trim().toLowerCase());
      
      // Show success state
      setEmailSent(true);
      
      // Show success alert
      Alert.alert(
        'Email Sent!',
        'Check your email for password reset instructions. The link will expire in 30 minutes.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to sign in after 2 seconds
              setTimeout(() => {
                navigation.navigate('EmailSignIn');
              }, 2000);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send reset email. Please try again.';

      if (errorMessage.includes('not found')) {
        Alert.alert(
          'Email Not Found',
          'No account found with this email address. Please check your email or sign up.',
        );
      } else if (errorMessage.includes('Too many')) {
        Alert.alert(
          'Too Many Attempts',
          'Too many reset attempts. Please try again later.',
        );
      } else {
        Alert.alert('Reset Failed', errorMessage);
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
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email to receive password reset instructions
                </Text>
              </View>

              {/* Success Message */}
              {emailSent && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>
                    ✓ Password reset email sent successfully!
                  </Text>
                </View>
              )}

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
                  editable={!emailSent}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.resetButton,
                  loading && styles.resetButtonDisabled,
                ]}
                onPress={handlePasswordReset}
                disabled={loading || emailSent}>
                <Text style={styles.resetButtonText}>
                  {loading ? 'Sending...' : emailSent ? 'Email Sent' : 'Send Reset Email'}
                </Text>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Remember your password?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EmailSignIn')}>
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