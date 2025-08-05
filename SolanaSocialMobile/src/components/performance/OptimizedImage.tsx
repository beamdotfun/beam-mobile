import React, {useState, useEffect, useRef, memo} from 'react';
import {
  Image,
  View,
  Animated,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import FastImage, {
  FastImageProps,
  Priority,
  ResizeMode,
} from 'react-native-fast-image';
import {usePerformanceStore} from '../../store/performance';
import {useThemeStore} from '../../store/themeStore';

interface OptimizedImageProps extends Omit<FastImageProps, 'source'> {
  source: {uri: string} | number;
  placeholder?: {uri: string} | number;
  enableProgressive?: boolean;
  enableLazyLoad?: boolean;
  threshold?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  fallbackSource?: {uri: string} | number;
  showLoadingIndicator?: boolean;
  loadingIndicatorSize?: 'small' | 'large';
  fadeInDuration?: number;
  priority?: Priority;
}

export const OptimizedImage = memo(
  ({
    source,
    placeholder,
    enableProgressive = true,
    enableLazyLoad = true,
    threshold = 300,
    onLoadStart,
    onLoadEnd,
    onError,
    fallbackSource,
    showLoadingIndicator = true,
    loadingIndicatorSize = 'small',
    fadeInDuration = 300,
    priority = FastImage.priority.normal,
    style,
    ...props
  }: OptimizedImageProps) => {
    const {config} = usePerformanceStore();
    const {colors} = useThemeStore();

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(!enableLazyLoad);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const viewRef = useRef<View>(null);
    const isMounted = useRef(true);

    useEffect(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    useEffect(() => {
      if (!enableLazyLoad) {
        return;
      }

      const checkInView = () => {
        if (!viewRef.current || !isMounted.current) {
          return;
        }

        viewRef.current.measure((_x, _y, _width, _height, pageX, pageY) => {
          if (!isMounted.current) {
            return;
          }

          // Simple viewport check
          const screenHeight = 800; // You might want to get actual screen dimensions
          const isVisible =
            pageY < screenHeight + threshold && pageY + _height > -threshold;

          if (isVisible && !isInView) {
            setIsInView(true);
          }
        });
      };

      // Check immediately
      checkInView();

      // Check on scroll (you might want to debounce this in a real app)
      const interval = setInterval(checkInView, 1000);
      return () => clearInterval(interval);
    }, [enableLazyLoad, threshold, isInView]);

    const handleLoadStart = () => {
      if (!isMounted.current) {
        return;
      }
      setIsLoading(true);
      onLoadStart?.();
    };

    const handleLoadEnd = () => {
      if (!isMounted.current) {
        return;
      }

      setIsLoading(false);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }).start();

      onLoadEnd?.();
    };

    const handleError = (error: any) => {
      if (!isMounted.current) {
        return;
      }

      setIsLoading(false);
      setHasError(true);
      onError?.(error);
    };

    // Determine which source to use
    const imageSource = hasError && fallbackSource ? fallbackSource : source;
    const isRemoteImage =
      typeof imageSource === 'object' && 'uri' in imageSource;

    // Build FastImage props
    const fastImageProps: FastImageProps = {
      ...props,
      source: imageSource as any,
      priority,
      onLoadStart: handleLoadStart,
      onLoadEnd: handleLoadEnd,
      onError: handleError,
      style: [
        style,
        {
          opacity: fadeAnim,
        },
      ] as any,
    };

    // Add progressive loading if enabled
    if (enableProgressive && isRemoteImage && config.images.enableProgressive) {
      // FastImage handles progressive loading automatically for JPEG images
    }

    // Apply compression quality if configured
    if (isRemoteImage && config.images.compressionQuality < 1) {
      // This would typically be handled server-side
      // But you could modify the URI to request a lower quality version
    }

    const containerStyle: ViewStyle = {
      ...(StyleSheet.flatten(style) || {}),
    };

    return (
      <View ref={viewRef} style={containerStyle}>
        {isInView ? (
          <>
            {/* Placeholder while loading */}
            {isLoading && placeholder && (
              <View style={[StyleSheet.absoluteFill, {zIndex: 1}]}>
                <Image
                  source={placeholder}
                  style={[
                    StyleSheet.absoluteFill,
                    {width: '100%', height: '100%'},
                  ]}
                  resizeMode={props.resizeMode || 'cover'}
                />
              </View>
            )}

            {/* Loading indicator */}
            {isLoading && showLoadingIndicator && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2,
                  },
                ]}>
                <ActivityIndicator
                  size={loadingIndicatorSize}
                  color={colors.primary}
                />
              </View>
            )}

            {/* Main image */}
            <Animated.View style={{opacity: fadeAnim}}>
              <FastImage {...fastImageProps} />
            </Animated.View>
          </>
        ) : (
          // Show placeholder when not in view
          placeholder && (
            <Image
              source={placeholder}
              style={[style, {width: '100%', height: '100%'}]}
              resizeMode={props.resizeMode || 'cover'}
            />
          )
        )}
      </View>
    );
  },
);

OptimizedImage.displayName = 'OptimizedImage';

// Helper function to preload images
export const preloadImages = (sources: string[]) => {
  const uris = sources.map(uri => ({uri}));
  FastImage.preload(uris);
};

// Helper function to clear image cache
export const clearImageCache = () => {
  return FastImage.clearMemoryCache() && FastImage.clearDiskCache();
};
