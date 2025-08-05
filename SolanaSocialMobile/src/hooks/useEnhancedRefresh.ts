import { useCallback, useRef, useEffect } from 'react';
import HapticFeedback from 'react-native-haptic-feedback';
import { useThemeStore } from '../store/themeStore';

interface UseEnhancedRefreshOptions {
  onRefresh: () => void;
  tintColor?: string;
}

export function useEnhancedRefresh({ onRefresh, tintColor }: UseEnhancedRefreshOptions) {
  const { colors } = useThemeStore();
  const wasRefreshing = useRef(false);
  const finalTintColor = tintColor || colors.primary;

  const enhancedOnRefresh = useCallback(() => {
    try {
      HapticFeedback.trigger('impactMedium');
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
    onRefresh();
  }, [onRefresh]);

  const handleRefreshStateChange = useCallback((refreshing: boolean) => {
    if (!refreshing && wasRefreshing.current) {
      // Finished refreshing
      try {
        HapticFeedback.trigger('impactLight');
      } catch (error) {
        console.log('Haptic feedback not available:', error);
      }
      wasRefreshing.current = false;
    } else if (refreshing) {
      wasRefreshing.current = true;
    }
  }, []);

  return {
    enhancedOnRefresh,
    tintColor: finalTintColor,
    colors: [finalTintColor],
    handleRefreshStateChange,
  };
}