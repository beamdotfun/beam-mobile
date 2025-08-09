import React from 'react';
import {
  RefreshControl,
} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface EnhancedRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
  size?: 'small' | 'large';
  progressViewOffset?: number;
}

export function EnhancedRefreshControl({
  refreshing,
  onRefresh,
  tintColor,
  size = 'large',
  progressViewOffset = 0,
}: EnhancedRefreshControlProps) {
  const {colors} = useThemeStore();
  const finalTintColor = tintColor || colors.primary;

  console.log('🔍 EnhancedRefreshControl: Rendering with:', { refreshing, finalTintColor });

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        console.log('🔍 EnhancedRefreshControl: onRefresh called');
        onRefresh();
      }}
      tintColor={finalTintColor}
      colors={[finalTintColor]}
      size={size}
      progressViewOffset={progressViewOffset}
    />
  );
}