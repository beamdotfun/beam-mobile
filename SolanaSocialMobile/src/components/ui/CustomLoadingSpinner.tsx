import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface CustomLoadingSpinnerProps {
  size?: number;
  color?: string;
  style?: any;
}

export function CustomLoadingSpinner({
  size = 32,
  color,
  style,
}: CustomLoadingSpinnerProps) {
  const {colors} = useThemeStore();
  const finalColor = color || colors.primary;
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    console.log('🔄 CustomLoadingSpinner: Starting animation');
    
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 } // Infinite loop
    );

    animation.start();

    return () => {
      console.log('🔄 CustomLoadingSpinner: Stopping animation');
      animation.stop();
      spinValue.setValue(0);
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerStyle = StyleSheet.create({
    spinner: {
      width: size,
      height: size,
      borderWidth: size * 0.1, // 10% of size - original elegant proportion
      borderRadius: size / 2,
      borderColor: finalColor, // Solid color for base
      borderTopColor: 'transparent', // Creates the clean spinning effect
    },
  });

  return (
    <View style={[{alignItems: 'center', justifyContent: 'center'}, style]}>
      <Animated.View 
        style={[
          spinnerStyle.spinner, 
          { transform: [{ rotate: spin }] }
        ]} 
      />
    </View>
  );
}