import React, {useEffect, useState} from 'react';
import {
  View,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import {Button} from '../../components/ui/button';
import {Card} from '../../components/ui/card';
import {X, ChevronLeft, ChevronRight, Check, Star} from 'lucide-react-native';
import {useOnboardingStore} from '../../store/onboardingStore';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

// Step components
import {WelcomeStep} from './steps/WelcomeStep';
import {ExplanationStep} from './steps/ExplanationStep';
import {InteractiveTutorialStep} from './steps/InteractiveTutorialStep';
import {FormInputStep} from './steps/FormInputStep';
import {WalletSetupStep} from './steps/WalletSetupStep';
import {PermissionRequestStep} from './steps/PermissionRequestStep';
import {FeatureIntroductionStep} from './steps/FeatureIntroductionStep';
import {CompletionStep} from './steps/CompletionStep';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export const OnboardingFlow: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentFlow,
    currentStep,
    isActive,
    calculateProgress,
    completeStep,
    skipStep,
    goToPreviousStep,
    goToNextStep,
    abandonFlow,
    completeFlow,
    trackInteraction,
  } = useOnboardingStore();

  const [slideAnimation] = useState(new Animated.Value(0));
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    // Animate step transitions
    if (currentStep) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: currentStep.animation?.duration || 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep]);

  useEffect(() => {
    // Track step view
    if (currentStep) {
      trackInteraction('step_viewed', {
        stepId: currentStep.id,
        stepType: currentStep.type,
      });
    }
  }, [currentStep?.id]);

  if (!isActive || !currentFlow || !currentStep) {
    return null;
  }

  const progress = calculateProgress();
  const canGoBack =
    currentStep.canGoBack && !!useOnboardingStore.getState().getPreviousStep();
  const canSkip = currentStep.canSkip;

  const handleNext = async () => {
    try {
      await completeStep(currentStep.id);
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await skipStep(currentStep.id, 'user_skipped');
    } catch (error) {
      console.error('Failed to skip step:', error);
    }
  };

  const handleBack = async () => {
    try {
      await goToPreviousStep();
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = async () => {
    try {
      await abandonFlow('user_exited');
      setShowExitModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to abandon flow:', error);
    }
  };

  const renderStep = () => {
    const stepProps = {
      step: currentStep,
      onComplete: handleNext,
      onSkip: handleSkip,
    };

    switch (currentStep.type) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />;
      case 'explanation':
        return <ExplanationStep {...stepProps} />;
      case 'interactive_tutorial':
        return <InteractiveTutorialStep {...stepProps} />;
      case 'form_input':
        return <FormInputStep {...stepProps} />;
      case 'wallet_setup':
        return <WalletSetupStep {...stepProps} />;
      case 'permission_request':
        return <PermissionRequestStep {...stepProps} />;
      case 'feature_introduction':
        return <FeatureIntroductionStep {...stepProps} />;
      case 'completion':
        return <CompletionStep {...stepProps} />;
      default:
        return <ExplanationStep {...stepProps} />;
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: currentStep.layout.backgroundColor || '#ffffff',
      }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background Image */}
      {currentStep.layout.backgroundImage && (
        <Image
          source={{uri: currentStep.layout.backgroundImage}}
          className="absolute inset-0"
          resizeMode="cover"
        />
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between p-4">
        {/* Back Button */}
        <Button
          size="sm"
          variant="ghost"
          onPress={handleBack}
          disabled={!canGoBack}
          className={`${!canGoBack ? 'opacity-30' : 'opacity-60'}`}>
          <ChevronLeft size={20} className="text-gray-700" />
        </Button>

        {/* Progress */}
        {currentStep.layout.showProgress && (
          <View className="flex-1 mx-4">
            <View className="h-2 bg-gray-200 rounded-full">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{width: `${progress}%`}}
              />
            </View>
            <Text className="text-xs text-center mt-1 text-gray-600">
              {Math.round(progress)}% Complete
            </Text>
          </View>
        )}

        {/* Close Button */}
        <Button
          size="sm"
          variant="ghost"
          onPress={handleExit}
          className="opacity-60">
          <X size={20} className="text-gray-700" />
        </Button>
      </View>

      {/* Step Content */}
      <Animated.View
        className="flex-1"
        style={{
          opacity: slideAnimation,
          transform: [
            {
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}>
        {renderStep()}
      </Animated.View>

      {/* Navigation Footer */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row items-center justify-between">
          {/* Skip Button */}
          {canSkip && currentStep.layout.showSkip && (
            <Button variant="ghost" onPress={handleSkip}>
              <Text className="text-gray-600">Skip</Text>
            </Button>
          )}

          <View className="flex-1" />

          {/* Primary Action */}
          <Button onPress={handleNext} className="min-w-24">
            <Text className="text-white">
              {currentStep.content.primaryAction.text}
            </Text>
          </Button>
        </View>
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <Card className="w-full max-w-sm p-6">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
                <Star size={32} className="text-orange-500" />
              </View>
              <Text className="text-xl font-bold text-center mb-2 text-gray-900">
                Are you sure you want to exit?
              </Text>
              <Text className="text-gray-600 text-center">
                Your progress will be saved, but you'll miss out on important
                features.
              </Text>
            </View>

            <View className="gap-3">
              <Button onPress={() => setShowExitModal(false)} variant="outline">
                <Text className="text-gray-700">Continue Tutorial</Text>
              </Button>
              <Button onPress={confirmExit} className="bg-red-500">
                <Text className="text-white">Exit Tutorial</Text>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
