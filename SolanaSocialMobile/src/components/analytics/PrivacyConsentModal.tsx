import React, {useState} from 'react';
import {View, Modal, ScrollView, TouchableOpacity} from 'react-native';
import {Text} from '../ui/text';
import {Button} from '../ui/button';
import {
  privacyManager,
  PrivacyLevel,
} from '../../services/analytics/privacyManager';

interface PrivacyConsentModalProps {
  visible: boolean;
  onConsent: (level: PrivacyLevel) => void;
  onDecline: () => void;
  userRegion?: string;
}

export function PrivacyConsentModal({
  visible,
  onConsent,
  onDecline,
  userRegion,
}: PrivacyConsentModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<PrivacyLevel>(
    PrivacyLevel.FULL,
  );
  const [showDetails, setShowDetails] = useState(false);

  const handleAccept = () => {
    onConsent(selectedLevel);
  };

  const handleDecline = () => {
    onDecline();
  };

  const privacyLevels = [
    {
      level: PrivacyLevel.FULL,
      title: 'All Features',
      description:
        'Enable all analytics and personalization features for the best experience.',
      features: [
        'Usage analytics to improve the app',
        'Crash reporting for stability',
        'Performance monitoring',
        'Personalized content and recommendations',
        'Error tracking for bug fixes',
      ],
    },
    {
      level: PrivacyLevel.ANONYMOUS,
      title: 'Anonymous Analytics',
      description: 'Help improve the app without personal identification.',
      features: [
        'Anonymous usage analytics',
        'Crash reporting (anonymized)',
        'Performance monitoring',
        'Error tracking (anonymized)',
      ],
    },
    {
      level: PrivacyLevel.ESSENTIAL,
      title: 'Essential Only',
      description: 'Only collect data necessary for app functionality.',
      features: ['Basic crash reporting', 'Essential error tracking'],
    },
    {
      level: PrivacyLevel.NONE,
      title: 'No Data Collection',
      description: 'Disable all data collection and analytics.',
      features: ['No data collection whatsoever'],
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 py-8 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Privacy & Data Collection
          </Text>
          <Text className="text-gray-600">
            Choose how we can use your data to improve your experience.
          </Text>
        </View>

        <ScrollView className="flex-1">
          {/* Privacy Levels */}
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Select your privacy preference:
            </Text>

            {privacyLevels.map(option => (
              <TouchableOpacity
                key={option.level}
                onPress={() => setSelectedLevel(option.level)}
                className={`p-4 border rounded-lg mb-3 ${
                  selectedLevel === option.level
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}>
                <View className="flex-row items-center mb-2">
                  <View
                    className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedLevel === option.level
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                    {selectedLevel === option.level && (
                      <View className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </View>
                  <Text className="text-lg font-medium text-gray-900">
                    {option.title}
                  </Text>
                </View>

                <Text className="text-gray-600 mb-3 ml-7">
                  {option.description}
                </Text>

                <View className="ml-7">
                  {option.features.map((feature, index) => (
                    <Text key={index} className="text-sm text-gray-500 mb-1">
                      • {feature}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Detailed Information */}
          <View className="px-6 pb-6">
            <TouchableOpacity
              onPress={() => setShowDetails(!showDetails)}
              className="mb-4">
              <Text className="text-blue-500 font-medium">
                {showDetails ? 'Hide' : 'Show'} detailed information
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <View className="bg-gray-50 p-4 rounded-lg">
                <Text className="font-semibold text-gray-900 mb-3">
                  What data do we collect?
                </Text>

                <Text className="text-sm text-gray-600 mb-3">
                  <Text className="font-medium">Analytics:</Text> App usage
                  patterns, feature interactions, and performance metrics to
                  improve the app.
                </Text>

                <Text className="text-sm text-gray-600 mb-3">
                  <Text className="font-medium">Crash Reports:</Text> Technical
                  information about app crashes to fix bugs and improve
                  stability.
                </Text>

                <Text className="text-sm text-gray-600 mb-3">
                  <Text className="font-medium">Personalization:</Text> User
                  preferences and behavior to customize your experience.
                </Text>

                <Text className="text-sm text-gray-600 mb-3">
                  We never collect personal wallet information, private keys, or
                  transaction details without your explicit consent.
                </Text>

                <Text className="text-sm text-gray-600">
                  You can change these settings anytime in the app's privacy
                  settings.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Actions */}
        <View className="p-6 border-t border-gray-200">
          <View className="gap-3">
            <Button onPress={handleAccept} className="bg-blue-500">
              <Text className="text-white font-semibold">
                Accept Selected Settings
              </Text>
            </Button>

            <Button onPress={handleDecline} variant="outline">
              <Text className="text-gray-800 font-semibold">Decline All</Text>
            </Button>
          </View>

          <Text className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our privacy practices as described.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// Simplified consent banner for quick decisions
export function PrivacyConsentBanner({
  visible,
  onAccept,
  onDecline,
  onCustomize,
}: {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCustomize: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <Text className="text-sm text-gray-900 font-medium mb-2">
        Privacy & Data Collection
      </Text>
      <Text className="text-xs text-gray-600 mb-4">
        We use analytics to improve your experience. You can customize your
        privacy settings.
      </Text>

      <View className="flex-row gap-2">
        <Button onPress={onAccept} className="flex-1 bg-blue-500">
          <Text className="text-white font-medium text-sm">Accept</Text>
        </Button>

        <Button onPress={onCustomize} variant="outline" className="flex-1">
          <Text className="text-gray-800 font-medium text-sm">Customize</Text>
        </Button>

        <Button onPress={onDecline} variant="outline" className="flex-1">
          <Text className="text-gray-800 font-medium text-sm">Decline</Text>
        </Button>
      </View>
    </View>
  );
}
