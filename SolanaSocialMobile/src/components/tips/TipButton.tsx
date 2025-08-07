import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Heart, DollarSign, Zap } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { TipButtonProps } from '../../types/tips';

export function TipButton({
  targetWallet,
  targetType,
  targetId,
  disabled = false,
  variant = 'default',
  showAmount = false,
  onTipSent,
}: TipButtonProps) {
  const { colors } = useThemeStore();
  const navigation = useNavigation();
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const handleButtonPress = () => {
    if (disabled) {
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to SendTip screen
    console.log('📝 TipButton: Navigating to SendTip screen for', targetWallet);
    navigation.navigate('SendTip', {
      recipientWallet: targetWallet,
      recipientName: targetId, // Use targetId as name fallback
      recipientAvatar: undefined,
    });
  };

  const renderButton = () => {
    const baseClasses = 'flex-row items-center justify-center rounded-full';

    if (variant === 'compact') {
      return (
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleButtonPress}
            disabled={disabled}
            className={`${baseClasses} px-3 py-2`}
            style={{
              backgroundColor: disabled ? colors.muted : colors.primary,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Heart size={16} color={colors.primaryForeground} />
            {showAmount && (
              <Text
                className="ml-1 text-xs font-medium"
                style={{ color: colors.primaryForeground }}
              >
                Tip
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (variant === 'floating') {
      return (
        <Animated.View
          style={{
            transform: [{ scale: buttonScaleAnim }],
            position: 'absolute',
            right: 16,
            bottom: 16,
            shadowColor: colors.foreground,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleButtonPress}
            disabled={disabled}
            className={`${baseClasses} w-14 h-14`}
            style={{
              backgroundColor: disabled ? colors.muted : colors.primary,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Zap size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Default variant
    return (
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <TouchableOpacity
          onPress={handleButtonPress}
          disabled={disabled}
          className={`${baseClasses} px-4 py-3`}
          style={{
            backgroundColor: disabled ? colors.muted : colors.primary,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Heart size={20} color={colors.primaryForeground} />
          <Text
            className="ml-2 text-sm font-medium"
            style={{ color: colors.primaryForeground }}
          >
            Send Tip
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return renderButton();
}