import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface SimpleRefreshControlProps extends Omit<RefreshControlProps, 'tintColor'> {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
}

export const SimpleRefreshControl = React.forwardRef<RefreshControl, SimpleRefreshControlProps>(
  ({ refreshing, onRefresh, tintColor, ...restProps }, ref) => {
    const { colors } = useThemeStore();
    const finalTintColor = tintColor || colors.primary;

    console.log('🔍 SimpleRefreshControl: Rendering with forwardRef:', { refreshing, finalTintColor });

    return (
      <RefreshControl
        ref={ref}
        refreshing={refreshing}
        onRefresh={() => {
          console.log('🔍 SimpleRefreshControl: onRefresh called with forwardRef');
          onRefresh();
        }}
        tintColor={finalTintColor}
        colors={[finalTintColor]}
        {...restProps}
      />
    );
  }
);