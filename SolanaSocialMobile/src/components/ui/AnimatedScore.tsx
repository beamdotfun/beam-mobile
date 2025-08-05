import React, { useEffect, useRef } from 'react';
import { Text, Animated } from 'react-native';

interface AnimatedScoreProps {
  value: number;
  style?: any;
  duration?: number;
}

export function AnimatedScore({ value, style, duration = 500 }: AnimatedScoreProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const displayValue = useRef(value);

  useEffect(() => {
    // Create listener to update display value during animation
    const listenerId = animatedValue.addListener(({ value: animValue }) => {
      displayValue.current = Math.round(animValue);
    });

    // Animate to new value
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // We need to access the value
    }).start();

    // Cleanup listener
    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration]);

  return (
    <Animated.View>
      <Text style={style}>
        {displayValue.current}
      </Text>
    </Animated.View>
  );
}

// Hook version for more complex use cases
export function useAnimatedScore(initialValue: number, duration = 500) {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const [displayValue, setDisplayValue] = React.useState(initialValue);

  const animateTo = React.useCallback((newValue: number) => {
    Animated.timing(animatedValue, {
      toValue: newValue,
      duration,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, duration]);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  return { displayValue, animateTo };
}