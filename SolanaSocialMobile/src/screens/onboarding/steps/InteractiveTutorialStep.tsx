import React, {useState} from 'react';
import {View, ScrollView, Text, TouchableOpacity} from 'react-native';
import {Button} from '../../../components/ui/button';
import {Card} from '../../../components/ui/card';
import {OnboardingStep} from '../../../types/onboarding';
import {ChevronRight, Circle, CheckCircle, Play} from 'lucide-react-native';

interface InteractiveTutorialStepProps {
  step: OnboardingStep;
  onComplete: () => void;
  onSkip: () => void;
}

export const InteractiveTutorialStep: React.FC<
  InteractiveTutorialStepProps
> = ({step, onComplete, onSkip}) => {
  const {content} = step;
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const handleActionComplete = (actionId: string) => {
    setCompletedActions([...completedActions, actionId]);
  };

  const allActionsCompleted = step.requiredActions.every(action =>
    completedActions.includes(action),
  );

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

        {/* Interactive Demo Area */}
        <Card className="p-6 mb-6 bg-gray-50">
          <View className="items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Play size={32} className="text-blue-600" />
            </View>
            <Text className="text-lg font-medium text-gray-900 mb-2">
              Interactive Demo
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              Follow the steps below to complete this tutorial
            </Text>
          </View>
        </Card>

        {/* Tutorial Steps */}
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-3">
            Complete these actions:
          </Text>

          {step.requiredActions.map((action, index) => {
            const isCompleted = completedActions.includes(action);

            return (
              <TouchableOpacity
                key={index}
                onPress={() => !isCompleted && handleActionComplete(action)}
                disabled={isCompleted}>
                <Card
                  className={`p-4 mb-3 ${isCompleted ? 'bg-green-50' : ''}`}>
                  <View className="flex-row items-center">
                    {isCompleted ? (
                      <CheckCircle size={24} className="text-green-600 mr-3" />
                    ) : (
                      <Circle size={24} className="text-gray-400 mr-3" />
                    )}
                    <Text
                      className={`flex-1 ${
                        isCompleted ? 'text-green-700' : 'text-gray-700'
                      }`}>
                      {action}
                    </Text>
                    {!isCompleted && (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress Indicator */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Progress</Text>
            <Text className="text-sm text-gray-600">
              {completedActions.length} of {step.requiredActions.length}
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${
                  (completedActions.length / step.requiredActions.length) * 100
                }%`,
              }}
            />
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Button
            onPress={onComplete}
            size="lg"
            className="w-full"
            disabled={!allActionsCompleted}>
            <Text className="text-white font-medium">
              {allActionsCompleted
                ? content.primaryAction.text
                : 'Complete all actions'}
            </Text>
          </Button>

          {step.canSkip && (
            <Button
              onPress={onSkip}
              variant="ghost"
              size="lg"
              className="w-full">
              <Text className="text-gray-600">Skip Tutorial</Text>
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
