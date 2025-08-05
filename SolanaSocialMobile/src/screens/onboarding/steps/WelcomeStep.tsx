import React from 'react';
import {View, ScrollView, Text, Image} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Avatar} from '../../../components/ui/avatar';
import {OnboardingStep} from '../../../types/onboarding';

interface WelcomeStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  step,
  onComplete,
  onSkip,
}) => {
  const {content} = step;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
      <View className="items-center px-6">
        {/* Hero Media */}
        {content.image && (
          <Image
            source={{uri: content.image}}
            style={{
              width: 280,
              height: 280,
              marginBottom: 32,
            }}
            resizeMode="contain"
          />
        )}

        {/* Content */}
        {content.heading && (
          <Text className="text-4xl font-bold text-center mb-4 text-gray-900">
            {content.heading}
          </Text>
        )}

        {content.subheading && (
          <Text className="text-xl text-center text-gray-600 mb-6">
            {content.subheading}
          </Text>
        )}

        {content.body && (
          <Text className="text-center text-gray-600 mb-8 leading-6">
            {content.body}
          </Text>
        )}

        {/* Call to Action */}
        <View className="w-full max-w-sm gap-3">
          <Button onPress={onComplete} size="lg" className="w-full">
            <Text className="text-white font-medium">
              {content.primaryAction.text}
            </Text>
          </Button>

          {content.secondaryAction && (
            <Button
              onPress={onSkip}
              variant="outline"
              size="lg"
              className="w-full">
              <Text className="text-gray-700">
                {content.secondaryAction.text}
              </Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
