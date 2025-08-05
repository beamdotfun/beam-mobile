import React, {useState} from 'react';
import {View, ScrollView, Text, TextInput} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Card} from '../../../components/ui/card';
import {OnboardingStep} from '../../../types/onboarding';
import {User, AtSign, Info} from 'lucide-react-native';

interface FormInputStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const FormInputStep: React.FC<FormInputStepProps> = ({
  step,
  onComplete,
  onSkip,
}) => {
  const {content} = step;
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const isFormValid =
    displayName.trim().length > 0 && username.trim().length > 0;

  const handleComplete = () => {
    if (isFormValid) {
      onComplete();
    }
  };

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

        {/* Form Fields */}
        <View className="mb-6">
          {/* Display Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Display Name
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
              <User size={20} className="text-gray-400 mr-3" />
              <TextInput
                className="flex-1 text-gray-900"
                placeholder="John Doe"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Username */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Username
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
              <AtSign size={20} className="text-gray-400 mr-3" />
              <TextInput
                className="flex-1 text-gray-900"
                placeholder="johndoe"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              This will be your unique identifier on the platform
            </Text>
          </View>

          {/* Bio (Optional) */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Bio (Optional)
            </Text>
            <View className="bg-gray-50 rounded-lg px-4 py-3">
              <TextInput
                className="text-gray-900"
                placeholder="Tell us about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Info Card */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <View className="flex-row items-start">
            <Info size={20} className="text-blue-600 mr-3 mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm text-blue-900">
                You can always change these details later in your profile
                settings.
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View className="gap-3">
          <Button
            onPress={handleComplete}
            size="lg"
            className="w-full"
            disabled={!isFormValid}>
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
              <Text className="text-gray-600">Skip for now</Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
