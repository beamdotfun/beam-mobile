import React, {useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {WelcomeScreen} from './screens/WelcomeScreen';
import {WalletConnectionScreen} from './screens/WalletConnectionScreen';
import {DepositScreen} from './screens/DepositScreen';
import {UsernameScreen} from './screens/UsernameScreen';
import {useAuthStore} from '../../store/auth';
import {useWalletStore} from '../../store/wallet';
import {useThemeStore} from '../../store/themeStore';
import {socialAPI} from '../../services/api/social';

export type OnboardingStep = 'welcome' | 'wallet' | 'deposit' | 'username';

export const SimpleOnboardingFlow: React.FC = () => {
  const {colors} = useThemeStore();
  const {connected: isWalletConnected} = useWalletStore();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    completionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    completionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      maxWidth: 320,
      width: '100%',
    },
    completionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 8,
      fontFamily: 'Inter',
    },
    completionSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'Inter',
    },
  });
  
  // If user came from SIWS auth, they already have wallet connected, skip to username
  const getInitialStep = (): OnboardingStep => {
    if (isWalletConnected) {
      return 'username'; // Skip welcome and wallet connection for SIWS users
    }
    return 'welcome';
  };
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(getInitialStep());
  const [walletConnected, setWalletConnected] = useState(isWalletConnected);
  const [username, setUsername] = useState<string>('');
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const {completeOnboarding} = useAuthStore();
  
  console.log('🔍 SimpleOnboardingFlow: Starting onboarding flow', {
    isWalletConnected,
    initialStep: getInitialStep(),
    currentStep,
    walletConnected
  });

  const handleStepComplete = (nextStep?: OnboardingStep) => {
    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      // Onboarding complete
      completeOnboarding();
    }
  };

  const handleWalletConnected = () => {
    setWalletConnected(true);
    setCurrentStep('deposit');
  };

  const handleDepositComplete = () => {
    setCurrentStep('username');
  };

  const handleUsernameComplete = async (selectedUsername: string) => {
    setUsername(selectedUsername);
    console.log('Username selected:', selectedUsername);
    
    setIsCompletingOnboarding(true);
    
    try {
      // Save username to backend first
      console.log('🔄 Saving username to profile...');
      await socialAPI.updateProfile({ username: selectedUsername });
      console.log('✅ Username saved successfully');
      
      // Then complete onboarding
      try {
        await completeOnboarding();
        console.log('✅ Onboarding completed successfully via API');
      } catch (apiError) {
        console.error('⚠️ Failed to complete onboarding via API, but allowing user to proceed:', apiError);
        
        // If API fails, still mark onboarding as completed locally
        // This ensures the user isn't stuck in the onboarding flow
        try {
          // Access the store's setState function directly
          useAuthStore.setState({hasCompletedOnboarding: true});
          console.log('✅ Onboarding marked as completed locally');
        } catch (localError) {
          console.error('❌ Failed to mark onboarding as completed locally:', localError);
          setIsCompletingOnboarding(false);
          throw localError;
        }
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompletingOnboarding(false);
      // Handle error if needed - the auth store will show error state
    }
  };

  const handleSkipOnboarding = async () => {
    console.log('🔄 User skipping onboarding...');
    try {
      await completeOnboarding();
      console.log('✅ Onboarding skipped successfully via API');
    } catch (apiError) {
      console.error('⚠️ Failed to skip onboarding via API, but allowing user to proceed:', apiError);
      
      // If API fails, still mark onboarding as completed locally
      // This ensures the user isn't stuck in the onboarding flow
      try {
        // Access the store's setState function directly
        useAuthStore.setState({hasCompletedOnboarding: true});
        console.log('✅ Onboarding marked as completed locally');
      } catch (localError) {
        console.error('❌ Failed to mark onboarding as completed locally:', localError);
      }
    }
  };

  const renderCurrentStep = () => {
    // Show completion loading screen
    if (isCompletingOnboarding) {
      return (
        <View style={styles.completionContainer}>
          <View style={styles.completionCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.completionTitle}>Setting up your profile...</Text>
            <Text style={styles.completionSubtitle}>
              We're saving your username and completing your setup
            </Text>
          </View>
        </View>
      );
    }

    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            onContinue={() => handleStepComplete('wallet')}
          />
        );
      case 'wallet':
        return (
          <WalletConnectionScreen
            onWalletConnected={handleWalletConnected}
            onSkip={() => setCurrentStep('username')}
          />
        );
      case 'deposit':
        return (
          <DepositScreen
            onCreateAccount={handleDepositComplete}
            onSkip={() => setCurrentStep('username')}
          />
        );
      case 'username':
        return (
          <UsernameScreen
            onComplete={handleUsernameComplete}
            onSkip={handleSkipOnboarding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderCurrentStep()}
    </SafeAreaView>
  );
};