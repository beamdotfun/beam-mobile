import React, {useRef, useEffect} from 'react';
import {View, PanResponder, Dimensions, Animated} from 'react-native';
import {useMobileOptimizationStore} from '../../store/mobileOptimizationStore';
import {CustomGesture, GesturePattern} from '../../types/mobile-optimizations';

interface MobileGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinchZoom?: (scale: number) => void;
  onPullToRefresh?: () => void;
  enableCustomGestures?: boolean;
  style?: any;
}

export const MobileGestureHandler: React.FC<MobileGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  onPinchZoom,
  onPullToRefresh,
  enableCustomGestures = true,
  style,
}) => {
  const {settings, registeredGestures, capabilities} =
    useMobileOptimizationStore();

  const panRef = useRef(new Animated.ValueXY()).current;
  const scaleRef = useRef(new Animated.Value(1)).current;
  const lastTap = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Gesture configuration based on settings
  const swipeThreshold = settings?.enableSwipeGestures
    ? capabilities?.screenSize.width * 0.25 || 100
    : 999999; // Disable if not enabled

  const longPressDelay = settings?.enableLongPress ? 500 : 999999;
  const doubleTapDelay = settings?.enableDoubleTap ? 300 : 999999;

  const handleCustomGesture = (gestureData: any) => {
    if (!enableCustomGestures) {
      return;
    }

    registeredGestures.forEach(gesture => {
      if (!gesture.enabled) {
        return;
      }

      const matches = matchesGesturePattern(gestureData, gesture.pattern);
      if (matches) {
        console.log(`Custom gesture triggered: ${gesture.action}`);
        // Execute custom gesture action
        executeGestureAction(gesture.action);
      }
    });
  };

  const matchesGesturePattern = (
    gestureData: any,
    pattern: GesturePattern,
  ): boolean => {
    const {type, direction, fingerCount, duration} = pattern;

    switch (type) {
      case 'swipe':
        return (
          gestureData.type === 'swipe' &&
          (!direction || gestureData.direction === direction) &&
          (!fingerCount || gestureData.fingerCount === fingerCount)
        );
      case 'tap':
        return gestureData.type === 'tap';
      case 'double_tap':
        return gestureData.type === 'double_tap';
      case 'long_press':
        return (
          gestureData.type === 'long_press' &&
          (!duration || gestureData.duration >= duration)
        );
      case 'pinch':
        return gestureData.type === 'pinch';
      default:
        return false;
    }
  };

  const executeGestureAction = (action: string) => {
    // This would execute predefined actions or custom callbacks
    switch (action) {
      case 'refresh':
        onPullToRefresh?.();
        break;
      case 'back':
        // Navigate back
        break;
      case 'menu':
        // Open menu
        break;
      default:
        console.log(`Unknown gesture action: ${action}`);
    }
  };

  const getSwipeDirection = (gestureState: any) => {
    const {dx, dy} = gestureState;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX > absY) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only handle gestures if movement is significant
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },

    onPanResponderGrant: (evt, gestureState) => {
      // Handle touch start
      const now = Date.now();
      isLongPress.current = false;

      // Check for double tap
      if (now - lastTap.current < doubleTapDelay && onDoubleTap) {
        onDoubleTap();
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      // Start long press timer
      if (onLongPress && settings?.enableLongPress) {
        longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          onLongPress();

          // Custom gesture handling
          handleCustomGesture({
            type: 'long_press',
            duration: longPressDelay,
            x: evt.nativeEvent.pageX,
            y: evt.nativeEvent.pageY,
          });
        }, longPressDelay);
      }

      // Set initial pan value
      panRef.setOffset({
        x: panRef.x._value,
        y: panRef.y._value,
      });
      panRef.setValue({x: 0, y: 0});
    },

    onPanResponderMove: (evt, gestureState) => {
      // Clear long press timer on movement
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Handle pinch-to-zoom for multi-touch
      if (
        evt.nativeEvent.touches.length === 2 &&
        onPinchZoom &&
        settings?.enablePinchZoom
      ) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];

        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2),
        );

        // Calculate scale (simplified implementation)
        const scale = distance / 200; // Normalize to reasonable scale
        const clampedScale = Math.max(0.5, Math.min(3, scale));

        scaleRef.setValue(clampedScale);
        onPinchZoom(clampedScale);

        // Custom gesture handling
        handleCustomGesture({
          type: 'pinch',
          scale: clampedScale,
          fingerCount: 2,
        });

        return;
      }

      // Handle pan gestures
      if (settings?.enableSwipeGestures) {
        Animated.event([null, {dx: panRef.x, dy: panRef.y}], {
          useNativeDriver: false,
        })(evt, gestureState);
      }

      // Handle pull-to-refresh
      if (
        gestureState.dy > 50 &&
        gestureState.dy > Math.abs(gestureState.dx) &&
        onPullToRefresh
      ) {
        // Only trigger if pulling down from near the top
        if (evt.nativeEvent.pageY < screenHeight * 0.2) {
          handleCustomGesture({
            type: 'swipe',
            direction: 'down',
            distance: gestureState.dy,
          });
        }
      }
    },

    onPanResponderRelease: (evt, gestureState) => {
      // Clear timers
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Don't handle swipe if it was a long press
      if (isLongPress.current) {
        panRef.flattenOffset();
        return;
      }

      const {dx, dy} = gestureState;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Handle swipe gestures
      if (
        (absX > swipeThreshold || absY > swipeThreshold) &&
        settings?.enableSwipeGestures
      ) {
        const direction = getSwipeDirection(gestureState);

        switch (direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            // Check for pull-to-refresh
            if (dy > 100 && evt.nativeEvent.pageY < screenHeight * 0.3) {
              onPullToRefresh?.();
            }
            break;
        }

        // Custom gesture handling
        handleCustomGesture({
          type: 'swipe',
          direction,
          distance: Math.max(absX, absY),
          fingerCount: 1,
        });
      } else if (absX < 10 && absY < 10) {
        // Handle tap
        handleCustomGesture({
          type: 'tap',
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        });
      }

      // Reset pan values
      panRef.flattenOffset();

      // Animate back to original position
      Animated.spring(panRef, {
        toValue: {x: 0, y: 0},
        useNativeDriver: false,
      }).start();

      // Reset scale
      Animated.spring(scaleRef, {
        toValue: 1,
        useNativeDriver: false,
      }).start();
    },

    onPanResponderTerminate: () => {
      // Clean up on gesture termination
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      panRef.flattenOffset();
    },
  });

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // If gestures are disabled, just render children without gesture handling
  if (
    !settings?.enableSwipeGestures &&
    !settings?.enableLongPress &&
    !settings?.enableDoubleTap
  ) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {translateX: panRef.x},
            {translateY: panRef.y},
            {scale: scaleRef},
          ],
        },
      ]}
      {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
};

// Hook for registering custom gestures
export const useCustomGesture = (gesture: CustomGesture) => {
  const {registerGesture, unregisterGesture} = useMobileOptimizationStore();

  useEffect(() => {
    registerGesture(gesture);

    return () => {
      unregisterGesture(gesture.id);
    };
  }, [gesture.id]);
};
