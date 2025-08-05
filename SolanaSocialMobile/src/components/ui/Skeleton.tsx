import React, {useEffect, useRef} from 'react';
import {View, Animated, StyleSheet, ViewStyle} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}: SkeletonProps) {
  const {colors} = useThemeStore();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim, animated]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: colors.muted,
      width,
      height,
      borderRadius,
      overflow: 'hidden',
    },
    shimmerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={[styles.skeleton, style]}>
      {animated && (
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              opacity: shimmerOpacity,
            },
          ]}
        />
      )}
    </View>
  );
}

// Preset skeleton components
export function SkeletonText({
  lines = 1,
  spacing = 8,
  lastLineWidth = '75%',
  style,
}: {
  lines?: number;
  spacing?: number;
  lastLineWidth?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({length: lines}).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={16}
          style={{marginBottom: index < lines - 1 ? spacing : 0}}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({
  size = 40,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

export function SkeletonCard({
  showAvatar = true,
  showImage = false,
  imageHeight = 200,
  style,
}: {
  showAvatar?: boolean;
  showImage?: boolean;
  imageHeight?: number;
  style?: ViewStyle;
}) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    userInfo: {
      flex: 1,
      marginLeft: showAvatar ? 12 : 0,
    },
    content: {
      marginBottom: showImage ? 12 : 0,
    },
    image: {
      marginBottom: 12,
      borderRadius: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        {showAvatar && <SkeletonAvatar size={40} />}
        <View style={styles.userInfo}>
          <Skeleton width="60%" height={16} style={{marginBottom: 4}} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>

      <View style={styles.content}>
        <SkeletonText lines={3} />
      </View>

      {showImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          borderRadius={8}
          style={styles.image}
        />
      )}

      <View style={styles.footer}>
        <Skeleton width={60} height={14} />
        <Skeleton width={80} height={14} />
        <Skeleton width={40} height={14} />
      </View>
    </View>
  );
}