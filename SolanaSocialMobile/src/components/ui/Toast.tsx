import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {Check, X, AlertCircle, Info} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

export function Toast({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
  position = 'top',
}: ToastProps) {
  const {colors} = useThemeStore();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = '#FFFFFF';
    switch (type) {
      case 'success':
        return <Check size={iconSize} color={iconColor} />;
      case 'error':
        return <X size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success || '#10B981';
      case 'error':
        return colors.destructive || '#EF4444';
      case 'warning':
        return colors.warning || '#F59E0B';
      default:
        return colors.primary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      [position]: position === 'top' ? insets.top + 16 : insets.bottom + 16,
      left: 16,
      right: 16,
      zIndex: 9999,
      elevation: 9999,
    },
    toast: {
      backgroundColor: getBackgroundColor(),
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    text: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      lineHeight: 20,
    },
  });

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{translateY}],
        },
      ]}
      pointerEvents="none">
      <View style={styles.toast}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.text} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
