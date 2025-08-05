import React from 'react';
import {View, ScrollView, Text, Image} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Card} from '../../../components/ui/card';
import {OnboardingStep} from '../../../types/onboarding';
import {Check, ArrowRight} from 'lucide-react-native';

interface ExplanationStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const ExplanationStep: React.FC<ExplanationStepProps> = ({
  step,
  onComplete,
  onSkip,
}) => {
  const {content} = step;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Media */}
        {content.image && (
          <View className="items-center mb-6">
            <Image
              source={{uri: content.image}}
              style={{
                width: 240,
                height: 240,
              }}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Content */}
        {content.heading && (
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {content.heading}
          </Text>
        )}

        {content.subheading && (
          <Text className="text-lg text-gray-700 mb-4">
            {content.subheading}
          </Text>
        )}

        {content.body && (
          <Text className="text-gray-600 leading-6 mb-6">{content.body}</Text>
        )}

        {/* Feature Points */}
        {content.interactiveElements &&
          content.interactiveElements.length > 0 && (
            <View className="mb-6">
              {content.interactiveElements.map((element, index) => (
                <Card key={index} className="p-4 mb-3">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Check size={16} className="text-green-600" />
                    </View>
                    <Text className="flex-1 text-gray-700">
                      {element.content}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}

        {/* Actions */}
        <View className="gap-3">
          <Button onPress={onComplete} size="lg" className="w-full">
            <Text className="text-white font-medium mr-2">
              {content.primaryAction.text}
            </Text>
            <ArrowRight size={20} className="text-white" />
          </Button>

          {content.skipAction && step.canSkip && (
            <Button
              onPress={onSkip}
              variant="ghost"
              size="lg"
              className="w-full">
              <Text className="text-gray-600">{content.skipAction.text}</Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
