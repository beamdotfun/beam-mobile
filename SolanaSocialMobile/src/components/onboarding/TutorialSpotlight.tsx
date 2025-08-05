import React, {useEffect, useRef} from 'react';
import {
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {X, ArrowRight} from 'lucide-react-native';
import {TutorialSpotlight as SpotlightType} from '../../types/onboarding';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface TutorialSpotlightProps {
  spotlight: SpotlightType;
  onDismiss: () => void;
  onAction: () => void;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  spotlight,
  onDismiss,
  onAction,
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const spotlightScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(spotlightScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance if configured
    if (spotlight.autoAdvance && spotlight.delay > 0) {
      const timer = setTimeout(() => {
        onAction();
      }, spotlight.delay);

      return () => clearTimeout(timer);
    }
  }, []);

  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(spotlightScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleDismiss = () => {
    if (spotlight.dismissible) {
      animateOut(onDismiss);
    }
  };

  const handleAction = () => {
    animateOut(onAction);
  };

  // Calculate spotlight position
  // In a real implementation, you'd measure the target element
  const spotlightX = screenWidth / 2 - 100;
  const spotlightY = screenHeight / 2 - 100;
  const spotlightWidth = 200;
  const spotlightHeight = 200;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    switch (spotlight.position) {
      case 'top':
        return {
          bottom: screenHeight - spotlightY + 20,
          left: spotlightX,
          width: spotlightWidth,
        };
      case 'bottom':
        return {
          top: spotlightY + spotlightHeight + 20,
          left: spotlightX,
          width: spotlightWidth,
        };
      case 'left':
        return {
          top: spotlightY,
          right: screenWidth - spotlightX + 20,
          width: 200,
        };
      case 'right':
        return {
          top: spotlightY,
          left: spotlightX + spotlightWidth + 20,
          width: 200,
        };
      default:
        return {
          top: spotlightY + spotlightHeight + 20,
          left: spotlightX,
          width: spotlightWidth,
        };
    }
  };

  return (
    <Modal visible transparent animationType="none">
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: overlayOpacity,
        }}>
        {/* Dismiss overlay */}
        <TouchableOpacity
          style={{flex: 1}}
          onPress={handleDismiss}
          activeOpacity={1}
        />

        {/* Spotlight hole */}
        <View
          style={{
            position: 'absolute',
            left: spotlightX,
            top: spotlightY,
            width: spotlightWidth,
            height: spotlightHeight,
            borderRadius: spotlight.borderRadius,
            borderWidth: 4,
            borderColor: spotlight.highlightColor,
            backgroundColor: 'transparent',
          }}
        />

        {/* Tooltip */}
        <Animated.View
          style={{
            position: 'absolute',
            ...getTooltipPosition(),
            transform: [{scale: spotlightScale}],
          }}>
          <Card className="p-4">
            {/* Close button */}
            {spotlight.dismissible && (
              <TouchableOpacity
                onPress={handleDismiss}
                className="absolute top-2 right-2 z-10">
                <X size={16} className="text-gray-500" />
              </TouchableOpacity>
            )}

            {/* Content */}
            <Text className="font-semibold mb-2 pr-6 text-gray-900">
              {spotlight.title}
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              {spotlight.description}
            </Text>

            {/* Actions */}
            <View className="flex-row gap-2">
              {spotlight.secondaryAction && (
                <Button
                  size="sm"
                  variant="outline"
                  onPress={handleDismiss}
                  className="flex-1">
                  <Text className="text-gray-700">
                    {spotlight.secondaryAction.text}
                  </Text>
                </Button>
              )}

              {spotlight.primaryAction && (
                <Button size="sm" onPress={handleAction} className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white mr-1">
                      {spotlight.primaryAction.text}
                    </Text>
                    <ArrowRight size={16} className="text-white" />
                  </View>
                </Button>
              )}
            </View>
          </Card>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
