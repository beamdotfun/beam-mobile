import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Pressable,
  PanResponder,
} from 'react-native';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import {useThemeStore} from '../../store/themeStore';

const {width: screenWidth} = Dimensions.get('window');

export interface ToastProps {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: (id: string) => void;
}

export function AnimatedToast({
  id,
  title,
  message,
  type = 'info',
  duration = 4000,
  position = 'top',
  action,
  onDismiss,
}: ToastProps) {
  const {colors} = useThemeStore();
  const translateY = useRef(new Animated.Value(position === 'top' ? -200 : 200)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback
    switch (type) {
      case 'success':
        HapticFeedback.trigger('notificationSuccess');
        break;
      case 'error':
        HapticFeedback.trigger('notificationError');
        break;
      case 'warning':
        HapticFeedback.trigger('notificationWarning');
        break;
      default:
        HapticFeedback.trigger('impactLight');
        break;
    }

    // Auto dismiss
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -200 : 200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.(id);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const {dx, vx} = gestureState;
        
        if (Math.abs(dx) > screenWidth * 0.3 || Math.abs(vx) > 0.5) {
          // Dismiss with swipe
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: dx > 0 ? screenWidth : -screenWidth,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onDismiss?.(id);
          });
        } else {
          // Spring back
          Animated.spring(translateX, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success || '#10B981',
          borderColor: colors.success || '#10B981',
          icon: <CheckCircle size={20} color={colors.background} />,
        };
      case 'error':
        return {
          backgroundColor: colors.destructive,
          borderColor: colors.destructive,
          icon: <AlertCircle size={20} color={colors.background} />,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning || '#F59E0B',
          borderColor: colors.warning || '#F59E0B',
          icon: <AlertTriangle size={20} color={colors.background} />,
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          icon: <Info size={20} color={colors.background} />,
        };
    }
  };

  const typeStyles = getTypeStyles();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 1000,
      ...(position === 'top' ? {top: 60} : {bottom: 100}),
    },
    toast: {
      backgroundColor: typeStyles.backgroundColor,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    iconContainer: {
      marginRight: 12,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
      marginBottom: message ? 4 : 0,
    },
    message: {
      fontSize: 14,
      color: colors.background,
      fontFamily: 'Inter-Regular',
      opacity: 0.9,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 6,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.toast,
          {
            transform: [
              {translateY},
              {translateX},
              {scale},
            ],
            opacity,
          },
        ]}>
        <View style={styles.iconContainer}>
          {typeStyles.icon}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {action && (
            <Pressable 
              style={styles.actionButton}
              onPress={action.onPress}>
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          )}
          
          <Pressable 
            style={styles.closeButton}
            onPress={handleDismiss}>
            <X size={16} color={colors.background} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}