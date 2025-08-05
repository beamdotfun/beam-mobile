import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {cn} from '../../lib/utils';
import {useThemeStore} from '../../store/themeStore';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color,
  className,
}) => {
  const {colors} = useThemeStore();
  const spinnerColor = color || colors.primary;
  
  return (
    <View className={cn('items-center justify-center', className)}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
};
