import React, {useEffect, useState} from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Shield,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import {useEnhancedVerificationStore} from '../stores/enhancedVerificationStore';
import {
  OnboardingStep,
  VerificationType,
  PreparationItem, 
} from '../types/enhanced-verification';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Progress} from '../components/ui/progress';
import {Badge} from '../components/ui/badge';
import {cn} from '../lib/utils';

export const VerificationOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    onboarding,
    isLoading,
    error,
    startOnboarding,
    completeOnboardingStep,
    selectVerificationType,
    fetchAvailableVerifications,
    clearError,
    resetOnboarding,
  } = useEnhancedVerificationStore();

  const [selectedType, setSelectedType] = useState<VerificationType | null>(
    null,
  );

  useEffect(() => {
    if (!onboarding) {
      startOnboarding();
    }
    fetchAvailableVerifications();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleNext = async () => {
    if (!onboarding) {return;}

    try {
      await completeOnboardingStep(onboarding.currentStep);

      // Navigate to specific verification screen if complete
      if (onboarding.currentStep === 'prepare' && selectedType) {
        if (selectedType === 'nft') {
          navigation.navigate('NFTVerification' as never);
        } else if (selectedType === 'sns') {
          navigation.navigate('SNSVerification' as never);
        } else if (selectedType === 'both') {
          navigation.navigate('CombinedVerification' as never);
        }
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const handleSelectType = (type: VerificationType) => {
    setSelectedType(type);
    selectVerificationType(type);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Verification?',
      'You can always complete verification later from your profile settings.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Skip',
          onPress: () => {
            resetOnboarding();
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (isLoading && !onboarding) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading onboarding...</Text>
      </SafeAreaView>
    );
  }

  const renderStepContent = () => {
    if (!onboarding) {return null;}

    switch (onboarding.currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'select_type':
        return (
          <SelectTypeStep
            selectedType={selectedType}
            onSelectType={handleSelectType}
          />
        );
      case 'choose_method':
        return <ChooseMethodStep selectedType={selectedType} />;
      case 'prepare':
        return <PrepareStep items={onboarding.preparationItems} />;
      default:
        return null;
    }
  };

  const getProgress = () => {
    if (!onboarding) {return 0;}
    const steps: OnboardingStep[] = ['welcome', 'select_type', 'choose_method', 'prepare'];
    const currentIndex = steps.indexOf(onboarding.currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-semibold text-gray-900">
              Verification Setup
            </Text>
            <Button variant="ghost" size="sm" onPress={handleSkip}>
              <X size={20} color="#6B7280" />
            </Button>
          </View>

          {/* Progress Bar */}
          <View className="mt-3">
            <Progress value={getProgress()} className="h-2" />
            <Text className="text-xs text-gray-500 mt-1">
              Step {onboarding?.completedSteps.length + 1} of 4
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 py-4">
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row space-x-3">
            {onboarding?.currentStep !== 'welcome' && (
              <Button
                variant="outline"
                onPress={() => navigation.goBack()}
                className="flex-1">
                <Text>Back</Text>
              </Button>
            )}

            <Button
              onPress={handleNext}
              disabled={
                (onboarding?.currentStep === 'select_type' && !selectedType) ||
                (onboarding?.currentStep === 'prepare' && !onboarding.readyToStart)
              }
              className="flex-1">
              <Text className="text-white">
                {onboarding?.currentStep === 'prepare' ? 'Start Verification' : 'Next'}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" className="ml-2" />
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC = () => {
  return (
    <View className="space-y-4">
      <Card className="p-6 bg-white items-center">
        <Shield size={64} color="#3B82F6" />
        <Text className="text-2xl font-bold text-gray-900 mt-4">
          Welcome to Profile Verification
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Build trust and unlock exclusive features by verifying your profile
        </Text>
      </Card>

      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Why Verify?
        </Text>
        <View className="space-y-3">
          <BenefitItem
            icon="🛡️"
            title="Build Trust"
            description="Show other users you're a verified member"
          />
          <BenefitItem
            icon="🎯"
            title="Unlock Features"
            description="Access exclusive features and content"
          />
          <BenefitItem
            icon="💰"
            title="Reduced Fees"
            description="Get discounts on transaction fees"
          />
          <BenefitItem
            icon="⚡"
            title="Priority Support"
            description="Get faster response times from support"
          />
        </View>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <View className="flex-row items-start space-x-3">
          <Info size={20} color="#2563EB" />
          <View className="flex-1">
            <Text className="font-medium text-blue-900">Quick & Easy</Text>
            <Text className="text-sm text-blue-700 mt-1">
              The verification process takes just a few minutes and can be
              completed entirely on your mobile device.
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

// Select Type Step Component
const SelectTypeStep: React.FC<{
  selectedType: VerificationType | null;
  onSelectType: (type: VerificationType) => void;
}> = ({selectedType, onSelectType}) => {
  return (
    <View className="space-y-4">
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Choose Verification Type
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          Select how you'd like to verify your profile
        </Text>

        <View className="space-y-3">
          <VerificationOption
            type="nft"
            title="NFT Verification"
            description="Verify ownership of an NFT in your wallet"
            icon="🖼️"
            selected={selectedType === 'nft'}
            onSelect={() => onSelectType('nft')}
          />

          <VerificationOption
            type="sns"
            title="SNS Domain Verification"
            description="Verify ownership of a .sol domain"
            icon="🌐"
            selected={selectedType === 'sns'}
            onSelect={() => onSelectType('sns')}
          />

          <VerificationOption
            type="both"
            title="Full Verification"
            description="Verify both NFT and SNS domain for maximum benefits"
            icon="⭐"
            selected={selectedType === 'both'}
            onSelect={() => onSelectType('both')}
            recommended
          />
        </View>
      </Card>

      {selectedType && (
        <Card className="p-4 bg-green-50 border-green-200">
          <View className="flex-row items-start space-x-3">
            <Check size={20} color="#059669" />
            <View className="flex-1">
              <Text className="font-medium text-green-900">
                {selectedType === 'both' ? 'Excellent Choice!' : 'Good Choice!'}
              </Text>
              <Text className="text-sm text-green-700 mt-1">
                {selectedType === 'both' 
                  ? 'Full verification unlocks all features and maximum benefits'
                  : `${selectedType.toUpperCase()} verification will unlock exclusive features`}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
};

// Choose Method Step Component
const ChooseMethodStep: React.FC<{
  selectedType: VerificationType | null;
}> = ({selectedType}) => {
  return (
    <View className="space-y-4">
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Verification Method
        </Text>

        {selectedType === 'nft' && (
          <View className="space-y-3">
            <Text className="text-sm text-gray-600 mb-2">
              We'll verify NFT ownership through your connected wallet
            </Text>
            <MethodOption
              title="Wallet Signature"
              description="Sign a message to prove NFT ownership"
              time="2 minutes"
              difficulty="Easy"
            />
          </View>
        )}

        {selectedType === 'sns' && (
          <View className="space-y-3">
            <Text className="text-sm text-gray-600 mb-2">
              We'll verify your .sol domain ownership
            </Text>
            <MethodOption
              title="Domain Signature"
              description="Sign a message with your domain owner wallet"
              time="3 minutes"
              difficulty="Easy"
            />
          </View>
        )}

        {selectedType === 'both' && (
          <View className="space-y-3">
            <Text className="text-sm text-gray-600 mb-2">
              We'll verify both your NFT and .sol domain
            </Text>
            <MethodOption
              title="Combined Verification"
              description="Verify both NFT and domain in one process"
              time="5 minutes"
              difficulty="Easy"
            />
          </View>
        )}
      </Card>

      <Card className="p-4 bg-gray-50">
        <Text className="font-medium text-gray-900 mb-2">Requirements</Text>
        <View className="space-y-2">
          <RequirementItem text="Connected Solana wallet" completed />
          {(selectedType === 'nft' || selectedType === 'both') && (
            <RequirementItem text="NFT in your wallet" />
          )}
          {(selectedType === 'sns' || selectedType === 'both') && (
            <RequirementItem text=".sol domain ownership" />
          )}
          <RequirementItem text="Small gas fee (< 0.01 SOL)" />
        </View>
      </Card>
    </View>
  );
};

// Prepare Step Component
const PrepareStep: React.FC<{
  items: PreparationItem[];
}> = ({items}) => {
  return (
    <View className="space-y-4">
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Final Checklist
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          Make sure you have everything ready before starting
        </Text>

        <View className="space-y-3">
          {items.map(item => (
            <View key={item.id} className="flex-row items-start space-x-3">
              <View
                className={cn(
                  'w-5 h-5 rounded-full items-center justify-center mt-0.5',
                  item.completed ? 'bg-green-100' : 'bg-gray-200',
                )}>
                {item.completed ? (
                  <Check size={12} color="#059669" />
                ) : (
                  <View className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={cn(
                    'font-medium',
                    item.completed ? 'text-green-700' : 'text-gray-900',
                  )}>
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.description}
                </Text>
                {item.required && !item.completed && (
                  <Badge variant="destructive" className="mt-1 w-fit">
                    <Text className="text-xs">Required</Text>
                  </Badge>
                )}
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <View className="flex-row items-start space-x-3">
          <AlertCircle size={20} color="#D97706" />
          <View className="flex-1">
            <Text className="font-medium text-yellow-900">Important</Text>
            <Text className="text-sm text-yellow-700 mt-1">
              The verification process will require a small transaction fee
              (less than 0.01 SOL) to record on the blockchain.
            </Text>
          </View>
        </View>
      </Card>

      <Card className="p-4 bg-green-50 border-green-200">
        <View className="flex-row items-start space-x-3">
          <Shield size={20} color="#059669" />
          <View className="flex-1">
            <Text className="font-medium text-green-900">Ready to Verify!</Text>
            <Text className="text-sm text-green-700 mt-1">
              Click "Start Verification" to begin the process. You can cancel at
              any time.
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

// Helper Components
const BenefitItem: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({icon, title, description}) => (
  <View className="flex-row items-start space-x-3">
    <Text className="text-2xl">{icon}</Text>
    <View className="flex-1">
      <Text className="font-medium text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
  </View>
);

const VerificationOption: React.FC<{
  type: VerificationType;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
  recommended?: boolean;
}> = ({title, description, icon, selected, onSelect, recommended}) => (
  <Button
    variant={selected ? 'default' : 'outline'}
    className="h-auto py-3"
    onPress={onSelect}>
    <View className="flex-row items-center justify-between w-full">
      <View className="flex-row items-center space-x-3">
        <Text className="text-2xl">{icon}</Text>
        <View className="flex-1">
          <View className="flex-row items-center space-x-2">
            <Text
              className={cn(
                'font-medium',
                selected ? 'text-white' : 'text-gray-900',
              )}>
              {title}
            </Text>
            {recommended && (
              <Badge
                variant={selected ? 'secondary' : 'default'}
                className={selected ? 'bg-white/20' : ''}
                <Text
                  className={cn(
                    'text-xs',
                    selected ? 'text-white' : 'text-white',
                  )}>
                  Recommended
                </Text>
              </Badge>
            )}
          </View>
          <Text
            className={cn(
              'text-sm',
              selected ? 'text-white/80' : 'text-gray-600',
            )}>
            {description}
          </Text>
        </View>
      </View>
      <View
        className={cn(
          'w-5 h-5 rounded-full border-2',
          selected ? 'bg-white border-white' : 'border-gray-300',
        )}>
        {selected && (
          <View className="w-full h-full items-center justify-center">
            <View className="w-2 h-2 bg-blue-600 rounded-full" />
          </View>
        )}
      </View>
    </View>
  </Button>
);

const MethodOption: React.FC<{
  title: string;
  description: string;
  time: string;
  difficulty: string;
}> = ({title, description, time, difficulty}) => (
  <View className="p-3 bg-gray-50 rounded-lg">
    <Text className="font-medium text-gray-900">{title}</Text>
    <Text className="text-sm text-gray-600 mt-1">{description}</Text>
    <View className="flex-row items-center space-x-3 mt-2">
      <Badge variant="secondary">
        <Text className="text-xs">{time}</Text>
      </Badge>
      <Badge variant="secondary">
        <Text className="text-xs">{difficulty}</Text>
      </Badge>
    </View>
  </View>
);

const RequirementItem: React.FC<{
  text: string;
  completed?: boolean;
}> = ({text, completed}) => (
  <View className="flex-row items-center space-x-2">
    {completed ? (
      <Check size={16} color="#059669" />
    ) : (
      <View className="w-4 h-4 rounded border border-gray-300" />
    )}
    <Text
      className={cn('text-sm', completed ? 'text-green-700' : 'text-gray-700')}>
      {text}
    </Text>
  </View>
);
