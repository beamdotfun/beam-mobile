import React, {useState} from 'react';
import {View, ScrollView, Text, Alert} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Card} from '../../../components/ui/card';
import {OnboardingStep} from '../../../types/onboarding';
import {Wallet, Shield, Key, CheckCircle2} from 'lucide-react-native';

interface WalletSetupStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const WalletSetupStep: React.FC<WalletSetupStepProps> = ({
  step,
  onComplete,
  onSkip,
}) => {
  const {content} = step;
  const [walletConnected, setWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);

    // Simulate wallet connection
    setTimeout(() => {
      setWalletConnected(true);
      setIsConnecting(false);
      Alert.alert('Success', 'Wallet connected successfully!');
    }, 2000);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
            <Wallet size={40} className="text-purple-600" />
          </View>

          {content.heading && (
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              {content.heading}
            </Text>
          )}

          {content.subheading && (
            <Text className="text-gray-600 text-center">
              {content.subheading}
            </Text>
          )}
        </View>

        {/* Wallet Benefits */}
        <View className="mb-6">
          <Card className="p-4 mb-3">
            <View className="flex-row items-start">
              <Shield size={24} className="text-green-600 mr-3 mt-1" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900 mb-1">
                  Secure & Decentralized
                </Text>
                <Text className="text-sm text-gray-600">
                  Your wallet is your identity. Only you control your assets and
                  data.
                </Text>
              </View>
            </View>
          </Card>

          <Card className="p-4 mb-3">
            <View className="flex-row items-start">
              <Key size={24} className="text-blue-600 mr-3 mt-1" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900 mb-1">
                  Your Keys, Your Control
                </Text>
                <Text className="text-sm text-gray-600">
                  No passwords needed. Your wallet provides secure
                  authentication.
                </Text>
              </View>
            </View>
          </Card>

          <Card className="p-4">
            <View className="flex-row items-start">
              <CheckCircle2 size={24} className="text-purple-600 mr-3 mt-1" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900 mb-1">
                  One-Click Actions
                </Text>
                <Text className="text-sm text-gray-600">
                  Sign transactions, tip creators, and vote on content
                  seamlessly.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Wallet Status */}
        {walletConnected && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <View className="flex-row items-center">
              <CheckCircle2 size={24} className="text-green-600 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-green-900">
                  Wallet Connected!
                </Text>
                <Text className="text-sm text-green-700 mt-1">
                  You're ready to explore the decentralized social network
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View className="gap-3">
          {!walletConnected ? (
            <>
              <Button
                onPress={handleConnectWallet}
                size="lg"
                className="w-full"
                disabled={isConnecting}>
                <Wallet size={20} className="text-white mr-2" />
                <Text className="text-white font-medium">
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Text>
              </Button>

              {step.canSkip && (
                <Button
                  onPress={onSkip}
                  variant="outline"
                  size="lg"
                  className="w-full">
                  <Text className="text-gray-700">I'll connect later</Text>
                </Button>
              )}
            </>
          ) : (
            <Button onPress={onComplete} size="lg" className="w-full">
              <Text className="text-white font-medium">
                {content.primaryAction.text}
              </Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
