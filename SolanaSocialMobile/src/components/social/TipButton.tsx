import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {Coins} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface TipButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizePadding = {
  sm: {paddingHorizontal: 8, paddingVertical: 4},
  md: {paddingHorizontal: 12, paddingVertical: 8},
  lg: {paddingHorizontal: 16, paddingVertical: 12},
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function TipButton({
  onPress,
  disabled = false,
  size = 'md',
}: TipButtonProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      backgroundColor: colors.warning ? colors.warning + '20' : '#F59E0B20',
      opacity: disabled ? 0.5 : 1,
      ...sizePadding[size],
    },
    text: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      marginLeft: 4,
      color: colors.warning || '#F59E0B',
    },
  });

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.button}>
      <Coins size={iconSizes[size]} color={colors.warning || '#F59E0B'} />
      <Text style={styles.text}>Tip</Text>
    </Pressable>
  );
}
