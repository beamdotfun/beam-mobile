import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {X, ChevronLeft, ChevronRight, Check} from 'lucide-react-native';
import {FeatureIntroduction as FeatureIntroductionType} from '../../types/onboarding';
import {useOnboardingStore} from '../../store/onboardingStore';

interface FeatureIntroductionProps {
  feature: FeatureIntroductionType;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export const FeatureIntroduction: React.FC<FeatureIntroductionProps> = ({
  feature,
  onComplete,
  onDismiss,
}) => {
  const {dismissFeatureIntroduction, trackInteraction} = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleDismiss = () => {
    dismissFeatureIntroduction(feature.featureId);
    trackInteraction('feature_intro_dismissed', {featureId: feature.featureId});
    onDismiss?.();
  };

  const handleComplete = () => {
    dismissFeatureIntroduction(feature.featureId);
    trackInteraction('feature_intro_completed', {featureId: feature.featureId});
    onComplete?.();
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps([...completedSteps, stepId]);
    trackInteraction('tutorial_step_completed', {
      stepId,
      featureId: feature.featureId,
    });
  };

  const handleNextStep = () => {
    if (currentStep < feature.tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTutorialStep = feature.tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / feature.tutorialSteps.length) * 100;

  return (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 bg-black/50">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                {feature.title}
              </Text>
              {feature.dismissible && (
                <TouchableOpacity onPress={handleDismiss}>
                  <X size={24} className="text-gray-500" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView className="max-h-96">
              <View className="p-6">
                {/* Feature Overview */}
                {currentStep === 0 && (
                  <View>
                    {/* Screenshots */}
                    {feature.screenshots.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4">
                        {feature.screenshots.map((screenshot, index) => (
                          <Image
                            key={index}
                            source={{uri: screenshot}}
                            className="w-64 h-48 rounded-lg mr-3"
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    )}

                    {/* Description */}
                    <Text className="text-gray-600 mb-4">
                      {feature.description}
                    </Text>

                    {/* Benefits */}
                    <View className="mb-4">
                      <Text className="font-medium text-gray-900 mb-2">
                        What you'll get:
                      </Text>
                      {feature.benefits.map((benefit, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                          <Check
                            size={16}
                            className="text-green-600 mr-2 mt-0.5"
                          />
                          <Text className="flex-1 text-sm text-gray-700">
                            {benefit}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tutorial Steps */}
                {currentStep > 0 && currentTutorialStep && (
                  <View>
                    <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
                      <Text className="font-medium text-blue-900 mb-2">
                        Step {currentStep} of {feature.tutorialSteps.length}
                      </Text>
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        {currentTutorialStep.title}
                      </Text>
                      <Text className="text-gray-700">
                        {currentTutorialStep.instruction}
                      </Text>
                    </Card>

                    {/* Action Button */}
                    {currentTutorialStep.action && (
                      <Button
                        onPress={() =>
                          handleStepComplete(currentTutorialStep.id)
                        }
                        className="w-full mb-4"
                        disabled={completedSteps.includes(
                          currentTutorialStep.id,
                        )}>
                        <Text className="text-white">
                          {completedSteps.includes(currentTutorialStep.id)
                            ? 'Completed'
                            : currentTutorialStep.action}
                        </Text>
                      </Button>
                    )}
                  </View>
                )}

                {/* Progress Bar */}
                <View className="mb-4">
                  <View className="h-2 bg-gray-200 rounded-full">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{width: `${progress}%`}}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 text-center mt-1">
                    {Math.round(progress)}% Complete
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Navigation */}
            <View className="p-4 border-t border-gray-200">
              <View className="flex-row items-center justify-between">
                <Button
                  variant="ghost"
                  onPress={handlePreviousStep}
                  disabled={currentStep === 0}>
                  <ChevronLeft size={20} className="text-gray-700 mr-1" />
                  <Text className="text-gray-700">Back</Text>
                </Button>

                <Button onPress={handleNextStep}>
                  <Text className="text-white mr-1">
                    {currentStep === feature.tutorialSteps.length
                      ? 'Complete'
                      : currentStep === 0
                      ? 'Start Tutorial'
                      : 'Next'}
                  </Text>
                  <ChevronRight size={20} className="text-white" />
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
