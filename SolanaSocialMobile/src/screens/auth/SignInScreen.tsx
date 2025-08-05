import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ImageBackground,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useAuthStore} from '../../store/auth';
import {AuthStackScreenProps} from '../../types/navigation';
import {AnimatedButton} from '../../components/ui/AnimatedButton';
import {googleSignInService} from '../../services/auth/googleSignIn';
import {extractErrorMessage} from '../../utils/errorMessages';

type Props = AuthStackScreenProps<'SignIn'>;

export default function SignInScreen({navigation}: Props) {
  // console.log('SignInScreen rendering');
  const {colors, isDark} = useThemeStore();
  const {connect, connecting, connected, publicKey} = useWalletStore();
  const {completeSIWSAuth, signInWithGoogle, isLoading: authLoading} = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);
  const [googleSignInLoading, setGoogleSignInLoading] = React.useState(false);

  // Check if user is already authenticated with wallet
  useEffect(() => {
    if (connected && publicKey) {
      // User is already authenticated, could navigate to main app
      console.log(
        'User already authenticated with wallet:',
        publicKey.toString(),
      );
      // TODO: Navigate to main app or set authentication state
    }
  }, [connected, publicKey]);

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
    logoContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      width: 160,
      height: 112,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 32,
      marginHorizontal: 8,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Inter',
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 24,
      fontFamily: 'Inter',
    },
    authButtonsContainer: {
      gap: 12,
      marginBottom: 24,
    },
    authButton: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e5e7eb',
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
    },
    authButtonPressed: {
      backgroundColor: '#f9fafb',
      borderColor: '#3b82f6',
    },
    authButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
      fontFamily: 'Inter',
    },
    authButtonIcon: {
      marginRight: 8,
      fontSize: 16,
    },
    solanaIcon: {
      fontSize: 28,
      marginRight: 8,
      marginTop: -4,
    },
    solanaButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      marginBottom: 16,
      minHeight: 56, // Fixed height to prevent shrinking
      justifyContent: 'center',
    },
    cleanAuthButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      minHeight: 56, // Fixed height for consistency
      justifyContent: 'center',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      paddingHorizontal: 16,
      color: colors.mutedForeground,
      fontSize: 12,
      fontWeight: '500',
      fontFamily: 'Inter',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
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

  const handleEmailSignIn = () => {
    navigation.navigate('EmailSignIn');
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setGoogleSignInLoading(true);
      
      console.log('🔍 SignInScreen: Starting Google Sign-In...');
      
      // Perform Google Sign-In
      const googleResult = await googleSignInService.signIn();
      
      console.log('🔍 SignInScreen: Google Sign-In successful, authenticating with backend...');
      
      // Authenticate with our backend using the Google ID token
      await signInWithGoogle(googleResult.idToken, googleResult.user);
      
      // Success! Navigation will happen automatically via AppNavigator
      console.log('✅ SignInScreen: Google authentication successful, navigating to feed...');
    } catch (error: any) {
      console.error('❌ SignInScreen: Google Sign-In error:', error);
      setError(extractErrorMessage(error));
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  const handleSolanaSignIn = async () => {
    try {
      console.log('🔍 SignInScreen: Starting Solana wallet authentication...');

      // Use the SIWS (Sign in with Solana) flow from wallet adapter
      const walletAuth = await connect();

      // Check if wallet connection was successful and we have user data
      if (!walletAuth.publicKey || !walletAuth.user) {
        throw new Error('Failed to authenticate with wallet or get user data');
      }

      const walletAddress = walletAuth.publicKey.toString();
      console.log(
        '🔍 SignInScreen: SIWS authentication completed for:',
        walletAddress,
      );
      console.log('🔍 SignInScreen: User data:', walletAuth.user);

      // The wallet adapter has already handled backend verification through SIWS
      // Now complete the authentication using our new SIWS method (no challenge/verify)

      console.log(
        '🔍 SignInScreen: Completing SIWS authentication in auth store...',
      );

      const authToken = walletAuth.user?.token;
      const refreshToken = walletAuth.user?.refreshToken;

      if (!authToken) {
        throw new Error('No authentication token received from SIWS');
      }

      // Use the new SIWS completion method (bypasses old challenge/verify flow)
      await completeSIWSAuth(walletAuth.user, authToken, refreshToken);

      // Success! Navigation will happen automatically via AppNavigator
      console.log(
        '✅ SignInScreen: Wallet authentication successful, navigating to feed...',
      );
    } catch (error: any) {
      console.error('❌ SignInScreen: Wallet authentication error:', error);
      setError(extractErrorMessage(error));
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
            {/* Sign In Card */}
            <View style={styles.card}>
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <Image
                  source={isDark ? require('../../assets/logo-dark-mode.png') : require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Solana Button */}
              <View style={styles.authButtonsContainer}>
                <AnimatedButton
                  title="Solana"
                  loading={connecting || authLoading}
                  loadingText={connecting ? 'Connecting...' : 'Authenticating...'}
                  onPress={() => {
                    setError(null); // Clear any previous errors
                    handleSolanaSignIn();
                  }}
                  variant="ghost"
                  size="lg"
                  icon={
                    <Text style={styles.solanaIcon}>◎</Text>
                  }
                  style={styles.solanaButton}
                  textStyle={{color: colors.foreground, fontWeight: '600'}}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email and Google Auth Buttons */}
              <View style={styles.authButtonsContainer}>
                <AnimatedButton
                  title="Email"
                  onPress={handleEmailSignIn}
                  variant="ghost"
                  size="md"
                  icon={<Text style={styles.authButtonIcon}>✉️</Text>}
                  style={styles.cleanAuthButton}
                  textStyle={{color: colors.foreground, fontWeight: '600'}}
                />

                <AnimatedButton
                  title="Google"
                  loading={googleSignInLoading}
                  loadingText="Signing in..."
                  onPress={() => {
                    setError(null);
                    handleGoogleSignIn();
                  }}
                  variant="ghost"
                  size="md"
                  icon={<Text style={styles.authButtonIcon}>G</Text>}
                  style={styles.cleanAuthButton}
                  textStyle={{color: colors.foreground, fontWeight: '600'}}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}
