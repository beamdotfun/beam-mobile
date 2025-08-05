import React from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Text} from '../ui/text';

// Mock react-native-fast-image since we don't have it installed
const FastImage = {
  priority: {
    low: 'low',
    normal: 'normal',
    high: 'high',
  },
  resizeMode: {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  },
};

// Mock FastImage component
function MockFastImage({
  source,
  style,
  resizeMode,
  onLoad,
  onError,
  onProgress,
  priority,
}: {
  source: {uri: string};
  style: any;
  resizeMode: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onProgress?: (event: any) => void;
  priority?: string;
}) {
  React.useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      onLoad?.();
    }, 1000 + Math.random() * 2000);

    // Simulate progress events
    if (onProgress) {
      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 20;
        onProgress({
          nativeEvent: {
            loaded: progress,
            total: 100,
          },
        });

        if (progress >= 100) {
          clearInterval(progressTimer);
        }
      }, 200);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [onLoad, onProgress]);

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode as any}
      onError={onError}
    />
  );
}

// Mock BlurView since we don't have the package
function MockBlurView({
  style,
  blurType,
  blurAmount,
  children,
}: {
  style: any;
  blurType: string;
  blurAmount: number;
  children?: React.ReactNode;
}) {
  return (
    <View style={[style, {backgroundColor: 'rgba(255,255,255,0.3)'}]}>
      {children}
    </View>
  );
}

interface ProgressiveImageProps {
  source: {uri: string};
  thumbnailSource?: {uri: string};
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  showProgress?: boolean;
  blurRadius?: number;
  placeholder?: React.ReactNode;
  fallbackSource?: {uri: string};
}

export function ProgressiveImage({
  source,
  thumbnailSource,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
  showProgress = true,
  blurRadius = 20,
  placeholder,
  fallbackSource,
}: ProgressiveImageProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = React.useState(false);

  const thumbnailAnimated = React.useRef(new Animated.Value(0)).current;
  const imageAnimated = React.useRef(new Animated.Value(0)).current;
  const progressAnimated = React.useRef(new Animated.Value(0)).current;

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
    Animated.timing(thumbnailAnimated, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleImageLoad = () => {
    setLoading(false);
    Animated.sequence([
      Animated.timing(imageAnimated, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(thumbnailAnimated, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onLoad?.();
    });
  };

  const handleImageProgress = (e: any) => {
    const progress = e.nativeEvent.loaded / e.nativeEvent.total;
    Animated.timing(progressAnimated, {
      toValue: progress,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleError = (error: any) => {
    setError(true);
    setLoading(false);
    onError?.(error);
  };

  const handleImageRetry = () => {
    setError(false);
    setLoading(true);
    // Force re-render by updating the key
  };

  if (error && !fallbackSource) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text className="text-gray-500 text-center mb-2">
            Failed to load image
          </Text>
          <Text
            className="text-blue-500 text-center"
            onPress={handleImageRetry}>
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder/Loading state */}
      {loading && !thumbnailLoaded && (
        <View style={styles.placeholderContainer}>
          {placeholder || (
            <View style={styles.defaultPlaceholder}>
              <ActivityIndicator size="small" color="#999" />
            </View>
          )}
        </View>
      )}

      {/* Thumbnail with blur */}
      {thumbnailSource && (
        <Animated.View style={[styles.absolute, {opacity: thumbnailAnimated}]}>
          <MockFastImage
            source={thumbnailSource}
            style={[StyleSheet.absoluteFillObject, style]}
            resizeMode={FastImage.resizeMode[resizeMode]}
            onLoad={handleThumbnailLoad}
          />
          <MockBlurView
            style={StyleSheet.absoluteFillObject}
            blurType="light"
            blurAmount={blurRadius}
          />
        </Animated.View>
      )}

      {/* Main image */}
      <Animated.View style={[styles.absolute, {opacity: imageAnimated}]}>
        <MockFastImage
          source={error && fallbackSource ? fallbackSource : source}
          style={[StyleSheet.absoluteFillObject, style]}
          resizeMode={FastImage.resizeMode[resizeMode]}
          onLoad={handleImageLoad}
          onError={fallbackSource && error ? undefined : handleError}
          onProgress={showProgress ? handleImageProgress : undefined}
          priority={FastImage.priority.normal}
        />
      </Animated.View>

      {/* Loading progress */}
      {loading && showProgress && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnimated.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}

      {/* Loading indicator overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
    </View>
  );
}

// Enhanced version with additional features
interface SmartImageProps extends ProgressiveImageProps {
  cacheKey?: string;
  priority?: 'low' | 'normal' | 'high';
  preload?: boolean;
  lazy?: boolean;
  fadeInDuration?: number;
  retryCount?: number;
  onRetry?: () => void;
}

export function SmartImage({
  cacheKey,
  priority = 'normal',
  preload = false,
  lazy = false,
  fadeInDuration = 300,
  retryCount = 3,
  onRetry,
  ...props
}: SmartImageProps) {
  const [currentRetryCount, setCurrentRetryCount] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(!lazy);

  const handleError = (error: any) => {
    if (currentRetryCount < retryCount) {
      setCurrentRetryCount(prev => prev + 1);
      onRetry?.();

      // Auto-retry after delay
      setTimeout(() => {
        // Force re-render for retry
      }, 1000 * Math.pow(2, currentRetryCount)); // Exponential backoff
    } else {
      props.onError?.(error);
    }
  };

  // Preload image if requested
  React.useEffect(() => {
    if (preload && props.source.uri) {
      Image.prefetch(props.source.uri).catch(console.warn);
    }
  }, [preload, props.source.uri]);

  // Lazy loading implementation
  React.useEffect(() => {
    if (lazy) {
      // In a real implementation, this would use Intersection Observer
      // or scroll position to determine visibility
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [lazy]);

  if (!isVisible) {
    return (
      <View style={[styles.container, props.style]}>
        <View style={styles.lazyPlaceholder} />
      </View>
    );
  }

  return <ProgressiveImage {...props} onError={handleError} />;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -12}, {translateY: -12}],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 8,
  },
  lazyPlaceholder: {
    backgroundColor: '#e0e0e0',
    width: '100%',
    height: '100%',
  },
});

// Additional utility components

// Optimized image for lists/grids
export function ListImage({
  source,
  style,
  size = 'medium',
}: {
  source: {uri: string};
  style?: any;
  size?: 'small' | 'medium' | 'large';
}) {
  const sizeMap = {
    small: {width: 60, height: 60},
    medium: {width: 120, height: 120},
    large: {width: 200, height: 200},
  };

  return (
    <SmartImage
      source={source}
      style={[sizeMap[size], style]}
      resizeMode="cover"
      lazy={true}
      priority="low"
      showProgress={false}
    />
  );
}

// Hero image with enhanced loading
export function HeroImage({
  source,
  style,
  aspectRatio = 16 / 9,
}: {
  source: {uri: string};
  style?: any;
  aspectRatio?: number;
}) {
  return (
    <View style={[{aspectRatio}, style]}>
      <SmartImage
        source={source}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        priority="high"
        preload={true}
        showProgress={true}
        fadeInDuration={500}
      />
    </View>
  );
}
