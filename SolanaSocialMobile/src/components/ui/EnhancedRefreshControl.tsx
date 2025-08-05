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

// Alternative pull-to-refresh component with custom gesture handling
export function CustomPullToRefresh({
  children,
  onRefresh,
  refreshing,
  threshold = 80,
}: {
  children: React.ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
  threshold?: number;
}) {
  const {colors} = useThemeStore();
  const pullAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const hasTriggered = useRef(false);

  const onScroll = Animated.event(
    [{nativeEvent: {contentOffset: {y: pullAnim}}}],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        
        if (scrollY < -threshold && !refreshing && !hasTriggered.current) {
          hasTriggered.current = true;
          HapticFeedback.trigger('impactMedium');
          onRefresh();
        } else if (scrollY >= 0) {
          hasTriggered.current = false;
        }

        // Rotate arrow based on pull distance
        const rotation = Math.min(Math.abs(scrollY / threshold), 1) * 180;
        Animated.timing(rotateAnim, {
          toValue: rotation,
          duration: 100,
          useNativeDriver: true,
        }).start();
      },
    }
  );

  const pullDistance = pullAnim.interpolate({
    inputRange: [-threshold * 2, -threshold, 0],
    outputRange: [threshold, threshold * 0.5, 0],
    extrapolate: 'clamp',
  });

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const indicatorOpacity = pullAnim.interpolate({
    inputRange: [-threshold, -20, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    pullIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: threshold,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      zIndex: 1,
    },
    arrow: {
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pullIndicator,
          {
            transform: [{translateY: pullDistance}],
            opacity: indicatorOpacity,
          },
        ]}>
        <Animated.View
          style={[
            styles.arrow,
            {
              transform: [{rotate: arrowRotation}],
            },
          ]}>
          <ChevronDown size={24} color={colors.primary} />
        </Animated.View>
      </Animated.View>
      
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={true}
        style={{flex: 1}}>
        {children}
      </Animated.ScrollView>
    </View>
  );
}