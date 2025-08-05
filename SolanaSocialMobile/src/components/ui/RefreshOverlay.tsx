import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {CustomLoadingSpinner} from './CustomLoadingSpinner';
import {useThemeStore} from '../../store/themeStore';

interface RefreshOverlayProps {
  visible: boolean;
  color?: string;
}

export function RefreshOverlay({visible, color}: RefreshOverlayProps) {
  const {colors} = useThemeStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  
  console.log('🔄 RefreshOverlay: visible =', visible);

  useEffect(() => {
    if (visible) {
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out and scale down
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 50, // Position where the default spinner appears
      left: 0,
      right: 0,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 12, // More generous padding like original
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1, // Subtle shadow like original
      shadowRadius: 4,
      elevation: 4,
    },
  });

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay, 
        {
          opacity: opacity,
          transform: [{scale: scale}],
        }
      ]}
    >
      <View style={styles.container}>
        <CustomLoadingSpinner size={28} color={color || colors.primary} />
      </View>
    </Animated.View>
  );
}