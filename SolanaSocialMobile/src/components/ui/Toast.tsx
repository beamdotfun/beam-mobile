import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {useThemeStore} from '../../store/themeStore';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const {colors} = useThemeStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.destructive;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: insets.bottom + 16,
      left: 20,
      right: 20,
      backgroundColor: getBackgroundColor(),
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    text: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY}],
        },
      ]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}
