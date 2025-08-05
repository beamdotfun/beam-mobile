import React, {useEffect, useState} from 'react';
import {View, Text, Alert, ActivityIndicator} from 'react-native';
import {useMobileOptimizationStore} from '../../store/mobileOptimizationStore';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {BiometricOptions} from '../../types/mobile-optimizations';

interface SolanaMobileWalletProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
  autoConnect?: boolean;
}

export const SolanaMobileWallet: React.FC<SolanaMobileWalletProps> = ({
  onConnected,
  onDisconnected,
  autoConnect = false,
}) => {
  const {
    capabilities,
    solanaMobileFeatures,
    settings,
    connectMobileWallet,
    useBiometricAuth,
    initializeSolanaFeatures,
  } = useMobileOptimizationStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Solana features if not already done
    if (!solanaMobileFeatures && capabilities?.isSolanaPhone) {
      initializeSolanaFeatures();
    }

    // Auto-connect if enabled and on Solana phone
    if (autoConnect && capabilities?.isSolanaPhone && !isConnecting) {
      handleConnect();
    }
  }, [capabilities, solanaMobileFeatures, autoConnect]);

  const handleConnect = async () => {
    if (!capabilities?.isSolanaPhone) {
      setError('Solana Mobile features not available on this device');
      setConnectionStatus('error');
      return;
    }

    if (!solanaMobileFeatures?.mobileWalletAdapter.isAvailable) {
      setError('Mobile wallet adapter not available');
      setConnectionStatus('error');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);

    try {
      // Require biometric authentication if enabled
      if (
        settings.biometricAuthentication &&
        solanaMobileFeatures.biometrics.isAvailable
      ) {
        const biometricOptions: BiometricOptions = {
          title: 'Authenticate Wallet Connection',
          subtitle: 'Connect to Solana Mobile Wallet',
          description: 'Use your biometric to securely connect to your wallet',
          cancelLabel: 'Cancel',
        };

        const authenticated = await useBiometricAuth(biometricOptions);
        if (!authenticated) {
          setError('Biometric authentication failed');
          setConnectionStatus('error');
          return;
        }
      }

      // Connect to wallet
      await connectMobileWallet();
      setConnectionStatus('connected');
      onConnected?.();

      Alert.alert(
        'Wallet Connected',
        'Successfully connected to Solana Mobile Wallet',
        [{text: 'OK'}],
      );
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to connect wallet',
      );
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!solanaMobileFeatures?.mobileWalletAdapter) {return;}

    try {
      await solanaMobileFeatures.mobileWalletAdapter.disconnect();
      setConnectionStatus('disconnected');
      setError(null);
      onDisconnected?.();

      Alert.alert(
        'Wallet Disconnected',
        'Successfully disconnected from Solana Mobile Wallet',
        [{text: 'OK'}],
      );
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setError('Failed to disconnect wallet');
    }
  };

  const handleSignTransaction = async () => {
    if (
      !solanaMobileFeatures?.mobileWalletAdapter ||
      connectionStatus !== 'connected'
    ) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    try {
      // This would be called with actual transaction data
      const mockTransaction = {instruction: 'transfer', amount: 0.1};
      await solanaMobileFeatures.mobileWalletAdapter.signTransaction(
        mockTransaction,

      Alert.alert('Success', 'Transaction signed successfully');
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      Alert.alert('Error', 'Failed to sign transaction');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  if (!capabilities?.isSolanaPhone) {
    return (
      <Card className="p-4 bg-gray-50">
        <View className="items-center">
          <Text className="text-gray-600 text-center">
            Solana Mobile features are only available on Saga devices
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <View className="space-y-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-semibold text-gray-900">
            Solana Mobile Wallet
          </Text>
          <View className="flex-row items-center space-x-2">
            <View
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500'
                  : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            />
            <Text className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Device Info */}
        <View className="bg-blue-50 p-3 rounded-lg">
          <Text className="text-sm font-medium text-blue-900">
            Device Features
          </Text>
          <View className="mt-2 space-y-1">
            <Text className="text-xs text-blue-700">
              ✓ Saga Device Detected
            </Text>
            <Text className="text-xs text-blue-700">
              ✓ Secure Element Available
            </Text>
            <Text className="text-xs text-blue-700">✓ Seed Vault Support</Text>
            {capabilities.supportsBiometrics && (
              <Text className="text-xs text-blue-700">
                ✓ Biometric Authentication
              </Text>
            )}
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View className="bg-red-50 p-3 rounded-lg">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        )}

        {/* Wallet Connection Controls */}
        <View className="space-y-3">
          {connectionStatus === 'disconnected' && (
            <Button
              onPress={handleConnect}
              disabled={isConnecting}
              className="w-full">
              {isConnecting ? (
                <View className="flex-row items-center space-x-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white">Connecting...</Text>
                </View>
              ) : (
                <Text className="text-white">Connect Wallet</Text>
              )}
            </Button>
          )}

          {connectionStatus === 'connected' && (
            <>
              <Button
                variant="outline"
                onPress={handleSignTransaction}
                className="w-full">
                <Text className="text-gray-900">Test Transaction Signing</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={handleDisconnect}
                className="w-full">
                <Text className="text-white">Disconnect Wallet</Text>
              </Button>
            </>
          )}

          {connectionStatus === 'error' && (
            <Button
              variant="outline"
              onPress={handleConnect}
              className="w-full">
              <Text className="text-gray-900">Retry Connection</Text>
            </Button>
          )}
        </View>

        {/* Security Settings */}
        {settings.biometricAuthentication && (
          <View className="bg-green-50 p-3 rounded-lg">
            <Text className="text-sm font-medium text-green-900">
              Security Settings
            </Text>
            <Text className="text-xs text-green-700 mt-1">
              ✓ Biometric authentication enabled
            </Text>
            {settings.useSeedVault && (
              <Text className="text-xs text-green-700">
                ✓ Seed vault protection enabled
              </Text>
            )}
            {settings.enableSecureTransactions && (
              <Text className="text-xs text-green-700">
                ✓ Secure element transactions enabled
              </Text>
            )}
          </View>
        )}

        {/* Supported Wallets */}
        {solanaMobileFeatures?.mobileWalletAdapter.supportedWallets && (
          <View>
            <Text className="text-sm font-medium text-gray-900 mb-2">
              Supported Wallets
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {solanaMobileFeatures.mobileWalletAdapter.supportedWallets.map(
                wallet => (
                  <View key={wallet} className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="text-xs text-gray-700">{wallet}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
};
