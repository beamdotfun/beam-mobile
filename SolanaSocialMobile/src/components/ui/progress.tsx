import React from 'react';
import {View, Animated} from 'react-native';
import {cn} from '../../lib/utils';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showPercentage?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
}) => {
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  return (
    <View
      className={cn('h-2 bg-gray-200 rounded-full overflow-hidden', className)}>
      <View
        className={cn('h-full bg-blue-500 rounded-full', indicatorClassName)}
        style={{width: `${percentage}%`}}
      />
    </View>
  );
};

interface AnimatedProgressProps extends ProgressProps {
  duration?: number;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  duration = 300,
}) => {
  const animatedValue = new Animated.Value(0);
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration,
      useNativeDriver: false,
    }).start();
  }, [percentage, duration]);

  return (
    <View
      className={cn('h-2 bg-gray-200 rounded-full overflow-hidden', className)}>
      <Animated.View
        className={cn('h-full bg-blue-500 rounded-full', indicatorClassName)}
        style={{
          width: animatedValue.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          }),
        }}
      />
    </View>
  );
};
