import {Dimensions, PanResponder} from 'react-native';
import {GesturePattern, CustomGesture} from '../../types/mobile-optimizations';

/**
 * Gesture detection and handling utilities
 */
export class GestureHelper {
  private static readonly SWIPE_THRESHOLD = 50;
  private static readonly VELOCITY_THRESHOLD = 0.3;
  private static readonly DOUBLE_TAP_DELAY = 300;
  private static readonly LONG_PRESS_DELAY = 500;

  /**
   * Detect swipe direction from gesture state
   */
  static getSwipeDirection(
    gestureState: any,
  ): 'up' | 'down' | 'left' | 'right' | null {
    const {dx, dy, vx, vy} = gestureState;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const absVx = Math.abs(vx);
    const absVy = Math.abs(vy);

    // Check if gesture meets threshold requirements
    if (
      (absX < this.SWIPE_THRESHOLD && absY < this.SWIPE_THRESHOLD) ||
      (absVx < this.VELOCITY_THRESHOLD && absVy < this.VELOCITY_THRESHOLD)
    ) {
      return null;
    }

    // Determine primary direction
    if (absX > absY) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Calculate gesture velocity
   */
  static getGestureVelocity(gestureState: any): number {
    const {vx, vy} = gestureState;
    return Math.sqrt(vx * vx + vy * vy);
  }

  /**
   * Calculate distance between two points
   */
  static getDistance(
    point1: {x: number; y: number},
    point2: {x: number; y: number},
  ): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate pinch scale from two touch points
   */
  static getPinchScale(
    touch1: {pageX: number; pageY: number},
    touch2: {pageX: number; pageY: number},
    initialDistance: number,
  ): number {
    const currentDistance = this.getDistance(
      {x: touch1.pageX, y: touch1.pageY},
      {x: touch2.pageX, y: touch2.pageY},
    );
    return currentDistance / initialDistance;
  }

  /**
   * Check if gesture matches a pattern
   */
  static matchesPattern(gestureData: any, pattern: GesturePattern): boolean {
    switch (pattern.type) {
      case 'swipe':
        return this.matchesSwipePattern(gestureData, pattern);
      case 'tap':
        return this.matchesTapPattern(gestureData, pattern);
      case 'double_tap':
        return this.matchesDoubleTapPattern(gestureData, pattern);
      case 'long_press':
        return this.matchesLongPressPattern(gestureData, pattern);
      case 'pinch':
        return this.matchesPinchPattern(gestureData, pattern);
      default:
        return false;
    }
  }

  private static matchesSwipePattern(
    gestureData: any,
    pattern: GesturePattern,
  ): boolean {
    if (gestureData.type !== 'swipe') {return false;}

    if (pattern.direction && gestureData.direction !== pattern.direction) {
      return false;
    }

      pattern.fingerCount &&
      gestureData.fingerCount !== pattern.fingerCount
    ) {
      return false;
    }

    return true;
  }

  private static matchesTapPattern(
    gestureData: any,
    pattern: GesturePattern,
  ): boolean {
    return gestureData.type === 'tap';
  }

  private static matchesDoubleTapPattern(
    gestureData: any,
    pattern: GesturePattern,
  ): boolean {
    return gestureData.type === 'double_tap';
  }

  private static matchesLongPressPattern(
    gestureData: any,
    pattern: GesturePattern,
  ): boolean {
    if (gestureData.type !== 'long_press') {return false;}

    if (pattern.duration && gestureData.duration < pattern.duration) {
      return false;
    }

    return true;
  }

  private static matchesPinchPattern(
    gestureData: any,
    pattern: GesturePattern,
  ): boolean {
    if (gestureData.type !== 'pinch') {return false;}

      pattern.fingerCount &&
      gestureData.fingerCount !== pattern.fingerCount
    ) {
      return false;
    }

    return true;
  }

  /**
   * Create a swipe gesture recognizer
   */
  static createSwipeGestureRecognizer(
    onSwipe: (direction: string) => void,
    threshold: number = this.SWIPE_THRESHOLD,
  ) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const direction = this.getSwipeDirection(gestureState);
        if (
          direction &&
          this.getGestureVelocity(gestureState) > this.VELOCITY_THRESHOLD
        ) {
          onSwipe(direction);
        }
      },
    });
  }

  /**
   * Create a tap gesture recognizer
   */
  static createTapGestureRecognizer(
    onTap: () => void,
    onDoubleTap?: () => void,
  ) {
    let lastTap = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const {dx, dy} = gestureState;

        // Check if it's a tap (minimal movement)
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          const now = Date.now();

          if (onDoubleTap && now - lastTap < this.DOUBLE_TAP_DELAY) {
            onDoubleTap();
            lastTap = 0;
          } else {
            onTap();
            lastTap = now;
          }
        }
      },
    });
  }

  /**
   * Create a long press gesture recognizer
   */
  static createLongPressGestureRecognizer(
    onLongPress: () => void,
    delay: number = this.LONG_PRESS_DELAY,
  ) {
    let longPressTimer: NodeJS.Timeout | null = null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        longPressTimer = setTimeout(() => {
          onLongPress();
        }, delay);
      },
      onPanResponderMove: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      },
    });
  }

  /**
   * Create a pinch gesture recognizer
   */
  static createPinchGestureRecognizer(
    onPinch: (scale: number) => void,
    onPinchEnd?: (scale: number) => void,
  ) {
    let initialDistance = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: evt => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: evt => evt.nativeEvent.touches.length === 2,
      onPanResponderGrant: evt => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          initialDistance = this.getDistance(
            {x: touch1.pageX, y: touch1.pageY},
            {x: touch2.pageX, y: touch2.pageY},
          );
        }
      },
      onPanResponderMove: evt => {
        if (evt.nativeEvent.touches.length === 2 && initialDistance > 0) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const scale = this.getPinchScale(touch1, touch2, initialDistance);
          onPinch(scale);
        }
      },
      onPanResponderRelease: evt => {
        if (
          evt.nativeEvent.touches.length === 1 &&
          onPinchEnd &&
          initialDistance > 0
        ) {
          // Calculate final scale when one finger is lifted
          const touch1 = evt.nativeEvent.touches[0];
          // Use last known position for the released finger
          const scale = 1; // Would need to track this properly
          onPinchEnd(scale);
        }
        initialDistance = 0;
      },
    });
  }

  /**
   * Combine multiple gesture recognizers
   */
  static combineGestureRecognizers(...recognizers: any[]) {
    return {
      onStartShouldSetPanResponder: (evt: any, gestureState: any) => {
        return recognizers.some(r =>
          r.onStartShouldSetPanResponder?.(evt, gestureState),
        );
      },
      onMoveShouldSetPanResponder: (evt: any, gestureState: any) => {
        return recognizers.some(r =>
          r.onMoveShouldSetPanResponder?.(evt, gestureState),
        );
      },
      onPanResponderGrant: (evt: any, gestureState: any) => {
        recognizers.forEach(r => r.onPanResponderGrant?.(evt, gestureState));
      },
      onPanResponderMove: (evt: any, gestureState: any) => {
        recognizers.forEach(r => r.onPanResponderMove?.(evt, gestureState));
      },
      onPanResponderRelease: (evt: any, gestureState: any) => {
        recognizers.forEach(r => r.onPanResponderRelease?.(evt, gestureState));
      },
      onPanResponderTerminate: (evt: any, gestureState: any) => {
        recognizers.forEach(r =>
          r.onPanResponderTerminate?.(evt, gestureState),
        );
      },
    };
  }
}

/**
 * Screen zone helpers for gesture recognition
 */
export class ScreenZoneHelper {
  private static screenDimensions = Dimensions.get('window');

  /**
   * Check if point is in a specific screen zone
   */
  static isInZone(
    point: {x: number; y: number},
    zone: 'top' | 'bottom' | 'left' | 'right' | 'center'
  ): boolean {
    const {width, height} = this.screenDimensions;
    const zoneSize = 0.2; // 20% of screen dimension

    switch (zone) {
      case 'top':
        return point.y < height * zoneSize;
      case 'bottom':
        return point.y > height * (1 - zoneSize);
      case 'left':
        return point.x < width * zoneSize;
      case 'right':
        return point.x > width * (1 - zoneSize);
      case 'center':
        return (
          point.x > width * zoneSize &&
          point.x < width * (1 - zoneSize) &&
          point.y > height * zoneSize &&
          point.y < height * (1 - zoneSize)
        );
      default:
        return false;
    }
  }

  /**
   * Get the screen zone for a point
   */
  static getZone(point: {x: number; y: number}): string {
    if (this.isInZone(point, 'top')) {return "top";}
    if (this.isInZone(point, 'bottom')) {return "bottom";}
    if (this.isInZone(point, 'left')) {return "left";}
    if (this.isInZone(point, 'right')) {return "right";}
    return 'center';
  }

  /**
   * Check if gesture is in safe area (avoiding system UI)
   */
  static isInSafeArea(
    point: {x: number; y: number},
    safeAreaInsets: {top: number; bottom: number; left: number; right: number},
  ): boolean {
    const {width, height} = this.screenDimensions;

    return (
      point.x >= safeAreaInsets.left &&
      point.x <= width - safeAreaInsets.right &&
      point.y >= safeAreaInsets.top &&
      point.y <= height - safeAreaInsets.bottom
    );
  }
}

/**
 * Gesture accessibility helpers
 */
export class GestureAccessibilityHelper {
  /**
   * Check if gesture is accessible (large enough touch targets)
   */
  static isAccessibleGesture(
    touchArea: {width: number; height: number},
    minimumSize: number = 44,
  ): boolean {
    return touchArea.width >= minimumSize && touchArea.height >= minimumSize;
  }

  /**
   * Get recommended touch target size
   */
  static getRecommendedTouchTargetSize(): {width: number; height: number} {
    return {width: 44, height: 44}; // iOS HIG and Material Design guidelines
  }

  /**
   * Adjust gesture sensitivity for accessibility
   */
  static getAccessibilityAdjustedThresholds(
    baseThreshold: number,
    accessibilitySettings: {largeText: boolean; reducedMotion: boolean},
  ): number {
    let adjustedThreshold = baseThreshold;

    if (accessibilitySettings.largeText) {
      adjustedThreshold *= 1.3; // Increase threshold for large text users
    }

    if (accessibilitySettings.reducedMotion) {
      adjustedThreshold *= 0.8; // Reduce threshold for reduced motion users
    }

    return adjustedThreshold;
  }
}
