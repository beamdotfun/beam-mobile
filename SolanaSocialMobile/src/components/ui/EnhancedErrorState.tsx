import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  AlertCircle,
  Wifi,
  RefreshCw,
  CloudOff,
  AlertTriangle,
  XCircle,
} from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import {useThemeStore} from '../../store/themeStore';
import {AnimatedButton} from './AnimatedButton';

const {width} = Dimensions.get('window');

interface EnhancedErrorStateProps {
  type?: 'network' | 'server' | 'auth' | 'generic' | 'empty';
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  showRetryButton?: boolean;
  illustration?: React.ReactNode;
  actions?: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

export function EnhancedErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  retrying = false,
  showRetryButton = true,
  illustration,
  actions,
}: EnhancedErrorStateProps) {
  const {colors} = useThemeStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [fadeAnim, slideAnim, pulseAnim]);

  const triggerShake = () => {
    HapticFeedback.trigger('notificationError');
    
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: <Wifi size={48} color={colors.destructive} />,
          defaultTitle: 'No Internet Connection',
          defaultMessage: 'Please check your internet connection and try again.',
          color: colors.destructive,
        };
      case 'server':
        return {
          icon: <CloudOff size={48} color={colors.warning || '#F59E0B'} />,
          defaultTitle: 'Server Error',
          defaultMessage: 'Our servers are experiencing issues. Please try again later.',
          color: colors.warning || '#F59E0B',
        };
      case 'auth':
        return {
          icon: <XCircle size={48} color={colors.destructive} />,
          defaultTitle: 'Authentication Error',
          defaultMessage: 'Please sign in again to continue.',
          color: colors.destructive,
        };
      case 'empty':
        return {
          icon: <AlertCircle size={48} color={colors.mutedForeground} />,
          defaultTitle: 'No Data Found',
          defaultMessage: 'There\'s nothing here yet.',
          color: colors.mutedForeground,
        };
      default:
        return {
          icon: <AlertTriangle size={48} color={colors.warning || '#F59E0B'} />,
          defaultTitle: 'Something went wrong',
          defaultMessage: 'An unexpected error occurred. Please try again.',
          color: colors.warning || '#F59E0B',
        };
    }
  };

  const errorConfig = getErrorConfig();
  const finalTitle = title || errorConfig.defaultTitle;
  const finalMessage = message || errorConfig.defaultMessage;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    illustration: {
      marginBottom: 24,
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: errorConfig.color + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 32,
      maxWidth: width * 0.8,
    },
    actionsContainer: {
      width: '100%',
      maxWidth: 280,
      gap: 12,
    },
    retryContainer: {
      marginTop: 8,
    },
  });

  const handleRetry = () => {
    if (retrying) return;
    
    triggerShake();
    onRetry?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {translateY: slideAnim},
            {translateX: shakeAnim},
          ],
        },
      ]}>
      
      {/* Illustration */}
      <View style={styles.illustration}>
        {illustration || (
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{scale: pulseAnim}],
              },
            ]}>
            {errorConfig.icon}
          </Animated.View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{finalTitle}</Text>

      {/* Message */}
      <Text style={styles.message}>{finalMessage}</Text>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {actions?.map((action, index) => (
          <AnimatedButton
            key={index}
            title={action.label}
            onPress={action.onPress}
            variant={action.variant || 'primary'}
            size="lg"
          />
        ))}

        {/* Retry Button */}
        {showRetryButton && onRetry && (
          <View style={styles.retryContainer}>
            <AnimatedButton
              title={retryLabel}
              loading={retrying}
              loadingText="Retrying..."
              onPress={handleRetry}
              variant="secondary"
              size="lg"
              icon={<RefreshCw size={16} color={colors.foreground} />}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// Inline error component for smaller spaces
export function InlineError({
  message,
  onRetry,
  retrying = false,
  compact = false,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}) {
  const {colors} = useThemeStore();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    HapticFeedback.trigger('impactLight');
    
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRetry = () => {
    if (retrying) return;
    triggerShake();
    onRetry?.();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: compact ? 'row' : 'column',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.destructive + '10',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.destructive + '30',
      gap: compact ? 12 : 8,
    },
    icon: {
      marginRight: compact ? 0 : 0,
    },
    message: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: 'Inter-Regular',
      flex: compact ? 1 : 0,
      textAlign: compact ? 'left' : 'center',
    },
    retryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.destructive,
      borderRadius: 6,
      minWidth: compact ? 60 : 80,
    },
    retryButtonText: {
      fontSize: 12,
      color: colors.background,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateX: shakeAnim}],
        },
      ]}>
      <AlertCircle 
        size={16} 
        color={colors.destructive} 
        style={styles.icon}
      />
      
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <AnimatedButton
          title={retrying ? 'Retrying...' : 'Retry'}
          loading={retrying}
          onPress={handleRetry}
          variant="danger"
          size="sm"
        />
      )}
    </Animated.View>
  );
}