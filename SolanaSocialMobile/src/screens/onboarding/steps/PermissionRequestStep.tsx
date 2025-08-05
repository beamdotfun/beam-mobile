import React, {useState} from 'react';
import {View, ScrollView, Text, Switch} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Card} from '../../../components/ui/card';
import {OnboardingStep} from '../../../types/onboarding';
import {Bell, Camera, MapPin, Shield} from 'lucide-react-native';

interface PermissionRequestStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: any;
  required: boolean;
  enabled: boolean;
}

export const PermissionRequestStep: React.FC<PermissionRequestStepProps> = ({
  step,
  onComplete,
  onSkip,
}) => {
  const {content} = step;

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Get notified about new messages, tips, and interactions',
      icon: Bell,
      required: false,
      enabled: true,
    },
    {
      id: 'camera',
      title: 'Camera Access',
      description: 'Take photos and videos to share with your community',
      icon: Camera,
      required: false,
      enabled: false,
    },
    {
      id: 'location',
      title: 'Location Services',
      description: 'Find local communities and events near you',
      icon: MapPin,
      required: false,
      enabled: false,
    },
  ]);

  const togglePermission = (id: string) => {
    setPermissions(
      permissions.map(perm =>
        perm.id === id ? {...perm, enabled: !perm.enabled} : perm,
      ),
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Shield size={40} className="text-blue-600" />
          </View>

          {content.heading && (
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              {content.heading}
            </Text>
          )}

          {content.subheading && (
            <Text className="text-gray-600 text-center">
              {content.subheading}
            </Text>
          )}
        </View>

        {/* Permissions List */}
        <View className="mb-6">
          {permissions.map(permission => {
            const Icon = permission.icon;

            return (
              <Card key={permission.id} className="p-4 mb-3">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                    <Icon size={20} className="text-gray-600" />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-medium text-gray-900">
                        {permission.title}
                      </Text>
                      <Switch
                        value={permission.enabled}
                        onValueChange={() => togglePermission(permission.id)}
                        trackColor={{false: '#E5E7EB', true: '#3B82F6'}}
                        thumbColor={permission.enabled ? '#FFFFFF' : '#F3F4F6'}
                      />
                    </View>
                    <Text className="text-sm text-gray-600">
                      {permission.description}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Privacy Note */}
        <Card className="p-4 mb-6 bg-gray-50">
          <Text className="text-sm text-gray-600">
            We respect your privacy. You can change these permissions anytime in
            Settings. We only use permissions to enhance your experience.
          </Text>
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
              variant="outline"
              size="lg"
              className="w-full">
              <Text className="text-gray-700">Decide later</Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
