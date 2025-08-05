import React, {useState, useEffect} from 'react';
import {View, Text, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {Input} from '../../components/ui/input';
import {useWalletStore} from '../../store/wallet';
import {useAuthStore} from '../../store/auth';
import {authAPI} from '../../services/api/auth';
import {AuthStackScreenProps} from '../../types/navigation';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol';

type Props = AuthStackScreenProps<'ConnectWallet'>;

export default function ConnectWalletScreen({navigation}: Props) {
  const {connect, connecting, publicKey} = useWalletStore();
  const {signInWithEmail, completeWalletAuth, isLoading} = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [walletExists, setWalletExists] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  // Check if wallet exists when connected
  useEffect(() => {
    if (publicKey) {
      checkWalletExists();
    }
  }, [publicKey]);

  const checkWalletExists = async () => {
    if (!publicKey) {
      return;
    }

    try {
      const result = await authAPI.checkWalletExists(publicKey.toString());
      setWalletExists(result.exists);
    } catch (error) {
      console.error('Error checking wallet:', error);
      setError('Failed to verify wallet. Please try again.');
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet. Please try again.');
      Alert.alert(
        'Connection Error',
        'Failed to connect wallet. Please try again.',
      );
    }
  };

  const handleSignIn = async () => {
    if (!publicKey) {
      return;
    }

    try {
      setError(null);
      
      const walletAddress = publicKey.toString();
      
      // Step 1: Get authentication challenge from backend
      console.log('🔍 ConnectWallet: Getting wallet challenge for sign in...');
      const challengeResponse = await authAPI.getWalletChallenge(walletAddress);
      console.log('🔍 ConnectWallet: Got challenge:', challengeResponse.message);

      // Step 2: Sign the challenge message
      console.log('🔍 ConnectWallet: Signing challenge message...');
      const signature = await transact(async wallet => {
        const messageBytes = new TextEncoder().encode(challengeResponse.message);
        const signResult = await wallet.signMessages({
          payloads: [
            {
              message: messageBytes as any,
            },
          ],
        });

        // Convert signature to base64
        const signatureBytes = signResult.signed_payloads[0];
        return btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
      });

      // Step 3: Complete wallet authentication
      console.log('🔍 ConnectWallet: Verifying signature for sign in...');
      await completeWalletAuth(walletAddress, signature, challengeResponse.nonce);
      
      console.log('✅ ConnectWallet: Wallet sign in successful');
      // Navigation will be handled by AppNavigator when auth state changes
    } catch (error) {
      console.error('🚨 ConnectWallet: Sign in failed:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Sign in failed. Please try again.'
      );
    }
  };

  const handleSignUp = async () => {
    if (!publicKey) {
      return;
    }

    if (!displayName.trim()) {
      setError('Display name is required for new accounts.');
      return;
    }

    try {
      setError(null);

      const walletAddress = publicKey.toString();
      
      // Step 1: Get authentication challenge from backend
      console.log('🔍 ConnectWallet: Getting wallet challenge for sign up...');
      const challengeResponse = await authAPI.getWalletChallenge(walletAddress);
      console.log('🔍 ConnectWallet: Got challenge:', challengeResponse.message);

      // Step 2: Sign the challenge message
      console.log('🔍 ConnectWallet: Signing challenge message...');
      const signature = await transact(async wallet => {
        const messageBytes = new TextEncoder().encode(challengeResponse.message);
        const signResult = await wallet.signMessages({
          payloads: [
            {
              message: messageBytes as any,
            },
          ],
        });

        // Convert signature to base64
        const signatureBytes = signResult.signed_payloads[0];
        return btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
      });

      // Step 3: Complete wallet authentication for new user registration
      console.log('🔍 ConnectWallet: Verifying signature and creating account...');
      const authResponse = await authAPI.verifyWalletSignature(
        walletAddress,
        signature,
        challengeResponse.nonce,
      );

      if (authResponse.success && authResponse.user) {
        // Complete authentication in store
        await completeWalletAuth(
          walletAddress,
          signature,
          challengeResponse.nonce,
          {
            displayName: displayName.trim(),
            email: email.trim() || undefined,
          },
        );

        console.log('✅ ConnectWallet: Wallet registration successful');
        
        // Navigate to profile creation with additional details
        navigation.navigate('CreateProfile', {
          walletAddress: walletAddress,
          displayName: displayName.trim(),
          email: email.trim() || undefined,
        });
      } else {
        throw new Error('Wallet registration failed');
      }
    } catch (error) {
      console.error('🚨 ConnectWallet: Account creation failed:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Account creation failed. Please try again.'
      );
    }
  };

  if (!publicKey) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Text className="text-xl font-semibold text-center text-foreground">
                  Connect Your Solana Wallet
                </Text>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Text className="text-center text-muted-foreground">
                Connect your Solana Mobile wallet to access all features of the
                platform.
              </Text>

              {error && (
                <View className="bg-destructive/10 p-3 rounded-md">
                  <Text className="text-destructive text-sm text-center">
                    {error}
                  </Text>
                </View>
              )}

              <Button
                onPress={handleConnect}
                disabled={connecting}
                className="w-full"
                size="lg">
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>

              <Text className="text-xs text-muted-foreground text-center">
                Make sure you have a Solana Mobile compatible wallet installed.
              </Text>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (walletExists === null) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Checking wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (walletExists) {
    // Existing user - show sign in
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Text className="text-xl font-semibold text-center text-foreground">
                  Welcome Back!
                </Text>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Text className="text-center text-muted-foreground">
                We found an existing account for this wallet.
              </Text>

              <View className="bg-muted p-3 rounded-md">
                <Text className="text-foreground text-center text-sm">
                  {publicKey.toString().slice(0, 8)}...
                  {publicKey.toString().slice(-8)}
                </Text>
              </View>

              {error && (
                <View className="bg-destructive/10 p-3 rounded-md">
                  <Text className="text-destructive text-sm text-center">
                    {error}
                  </Text>
                </View>
              )}

              <Button
                onPress={handleSignIn}
                disabled={isLoading}
                className="w-full"
                size="lg">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // New user - show sign up form
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <Text className="text-xl font-semibold text-center text-foreground">
                Create Your Account
              </Text>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Text className="text-center text-muted-foreground">
              Let's set up your new Beam account.
            </Text>

            <View className="bg-muted p-3 rounded-md">
              <Text className="text-foreground text-center text-sm">
                {publicKey.toString().slice(0, 8)}...
                {publicKey.toString().slice(-8)}
              </Text>
            </View>

            <Input
              label="Display Name *"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              maxLength={50}
            />

            <Input
              label="Email (Optional)"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {error && (
              <View className="bg-destructive/10 p-3 rounded-md">
                <Text className="text-destructive text-sm text-center">
                  {error}
                </Text>
              </View>
            )}

            <Button
              onPress={handleSignUp}
              disabled={isLoading || !displayName.trim()}
              className="w-full"
              size="lg">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Text className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </Text>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}
