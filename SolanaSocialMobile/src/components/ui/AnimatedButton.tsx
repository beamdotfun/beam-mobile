import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  StyleSheet,
  PressableProps,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AnimatedButton({
  title,
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  icon,
  hapticFeedback = true,
  style,
  textStyle,
  onPress,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const {colors} = useThemeStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isDisabled ? 0.6 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isDisabled, opacityAnim]);

  const handlePressIn = () => {
    if (isDisabled) return;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (isDisabled) return;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = (event: any) => {
    if (isDisabled || !onPress) return;
    
    // Trigger haptic feedback on successful press
    if (hapticFeedback) {
      Vibration.vibrate(10);
    }
    
    onPress(event);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
        };
      case 'danger':
        return {
          backgroundColor: colors.destructive,
          borderColor: colors.destructive,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primaryForeground;
      case 'secondary':
        return colors.foreground;
      case 'danger':
        return colors.background;
      case 'ghost':
        return colors.foreground;
      default:
        return colors.primaryForeground;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          iconSize: 14,
        };
      case 'md':
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 14,
          iconSize: 16,
        };
      case 'lg':
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          iconSize: 18,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 14,
          iconSize: 16,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      ...variantStyles,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
    },
    text: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: textColor,
      fontSize: sizeStyles.fontSize,
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  // Use TouchableOpacity when disabled to avoid pressed state visual feedback
  if (isDisabled) {
    return (
      <Animated.View
        style={[
          {
            transform: [{scale: scaleAnim}],
            opacity: opacityAnim,
          },
        ]}>
        <TouchableOpacity
          style={[styles.button, style]}
          activeOpacity={1}
          disabled={true}>
          {loading ? (
            <View style={styles.iconContainer}>
              <ActivityIndicator 
                size="small" 
                color={textColor}
              />
            </View>
          ) : icon ? (
            <View style={styles.iconContainer}>
              {icon}
            </View>
          ) : null}
          
          <Text style={[styles.text, textStyle]}>
            {loading && loadingText ? loadingText : title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Normal Pressable when not disabled
  return (
    <Animated.View
      style={[
        {
          transform: [{scale: scaleAnim}],
          opacity: opacityAnim,
        },
      ]}>
      <Pressable
        style={[styles.button, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={false}
        android_disableSound={false}
        {...props}>
        {icon ? (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        ) : null}
        
        <Text style={[styles.text, textStyle]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}