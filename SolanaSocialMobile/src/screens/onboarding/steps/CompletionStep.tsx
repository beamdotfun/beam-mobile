import React from 'react';
import {View, Text, Image} from 'react-native';
import {Button} from '../../../components/ui/button';
import {OnboardingStep} from '../../../types/onboarding';
import {CheckCircle, Sparkles, PartyPopper} from 'lucide-react-native';

interface CompletionStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  step,
  onComplete,
}) => {
  const {content} = step;

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      {/* Success Animation */}
      <View className="items-center mb-8">
        <View className="relative">
          <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center">
            <CheckCircle size={64} className="text-green-600" />
          </View>

          {/* Decorative elements */}
          <View className="absolute -top-2 -right-2">
            <Sparkles size={24} className="text-yellow-500" />
          </View>
          <View className="absolute -bottom-2 -left-2">
            <PartyPopper size={24} className="text-purple-500" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="items-center mb-8">
        {content.heading && (
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            {content.heading}
          </Text>
        )}

        {content.subheading && (
          <Text className="text-xl text-gray-600 text-center mb-4">
            {content.subheading}
          </Text>
        )}

        {content.body && (
          <Text className="text-gray-600 text-center leading-6">
            {content.body}
          </Text>
        )}
      </View>

      {/* Achievement Stats */}
      <View className="flex-row justify-center mb-8">
        <View className="items-center mx-4">
          <Text className="text-2xl font-bold text-gray-900">100%</Text>
          <Text className="text-sm text-gray-600">Complete</Text>
        </View>
        <View className="w-px h-12 bg-gray-300" />
        <View className="items-center mx-4">
          <Text className="text-2xl font-bold text-gray-900">Ready</Text>
          <Text className="text-sm text-gray-600">To Explore</Text>
        </View>
      </View>

      {/* Call to Action */}
      <View className="w-full max-w-sm">
        <Button onPress={onComplete} size="lg" className="w-full">
          <Text className="text-white font-medium text-lg">
            {content.primaryAction.text}
          </Text>
        </Button>
      </View>
    </View>
  );
};
