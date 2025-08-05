import React from 'react';
import {View, ScrollView, Text, Image} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Card} from '../../../components/ui/card';
import {OnboardingStep} from '../../../types/onboarding';
import {MessageCircle, Heart, Send, TrendingUp} from 'lucide-react-native';

interface FeatureIntroductionStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const FeatureIntroductionStep: React.FC<
  FeatureIntroductionStepProps
> = ({step, onComplete, onSkip}) => {
  const {content} = step;

  const features = [
    {
      icon: MessageCircle,
      title: 'Join Conversations',
      description: 'Engage with communities through comments and discussions',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Heart,
      title: 'Vote & Support',
      description: 'Upvote quality content and tip your favorite creators',
      color: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      icon: Send,
      title: 'Share Your Voice',
      description: 'Create posts, share media, and build your following',
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Earn Rewards',
      description: 'Get rewarded for creating engaging content',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        {content.heading && (
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {content.heading}
          </Text>
        )}

        {content.subheading && (
          <Text className="text-gray-600 mb-6">{content.subheading}</Text>
        )}

        {/* Feature Cards */}
        <View className="mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card key={index} className="p-4 mb-3">
                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 ${feature.color} rounded-full items-center justify-center mr-4`}>
                    <Icon size={24} className={feature.iconColor} />
                  </View>

                  <View className="flex-1">
                    <Text className="font-medium text-gray-900 mb-1">
                      {feature.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Call to Action */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <View className="items-center">
            <Text className="text-lg font-medium text-gray-900 mb-2 text-center">
              Ready to explore?
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              Your decentralized social journey starts now
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View className="gap-3">
          <Button onPress={onComplete} size="lg" className="w-full">
            <Text className="text-white font-medium">
              {content.primaryAction.text}
            </Text>
          </Button>

          {step.canSkip && (
            <Button
              onPress={onSkip}
              variant="ghost"
              size="lg"
              className="w-full">
              <Text className="text-gray-600">Explore on my own</Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
