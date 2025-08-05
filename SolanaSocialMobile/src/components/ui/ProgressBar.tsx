import React, {useEffect, useRef} from 'react';
import {View, Animated, Text, StyleSheet, ViewStyle} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  indeterminate?: boolean;
  style?: ViewStyle;
  label?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  backgroundColor,
  progressColor,
  showPercentage = false,
  animated = true,
  indeterminate = false,
  style,
  label,
}: ProgressBarProps) {
  const {colors} = useThemeStore();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const indeterminateAnim = useRef(new Animated.Value(0)).current;

  const finalBackgroundColor = backgroundColor || colors.muted;
  const finalProgressColor = progressColor || colors.primary;

  useEffect(() => {
    if (indeterminate) {
      // Indeterminate animation
      const indeterminateAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(indeterminateAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      indeterminateAnimation.start();

      return () => indeterminateAnimation.stop();
    } else {
      // Normal progress animation
      if (animated) {
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        progressAnim.setValue(progress);
      }
    }
  }, [progress, animated, indeterminate, progressAnim, indeterminateAnim]);

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
    },
    label: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginBottom: 8,
    },
    progressContainer: {
      height,
      backgroundColor: finalBackgroundColor,
      borderRadius: height / 2,
      overflow: 'hidden',
      position: 'relative',
    },
    progressBar: {
      height: '100%',
      backgroundColor: finalProgressColor,
      borderRadius: height / 2,
    },
    indeterminateBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '30%',
      backgroundColor: finalProgressColor,
      borderRadius: height / 2,
    },
    percentageContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    percentage: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
  });

  const progressWidth = indeterminate 
    ? '100%' 
    : progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      });

  const indeterminateLeft = indeterminateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.progressContainer}>
        {indeterminate ? (
          <Animated.View
            style={[
              styles.indeterminateBar,
              {
                left: indeterminateLeft,
              },
            ]}
          />
        ) : (
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        )}
      </View>

      {showPercentage && !indeterminate && (
        <View style={styles.percentageContainer}>
          <Text style={styles.percentage}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}

// Circular progress component
export function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 4,
  backgroundColor,
  progressColor,
  showPercentage = true,
  animated = true,
  indeterminate = false,
  style,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  indeterminate?: boolean;
  style?: ViewStyle;
}) {
  const {colors} = useThemeStore();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const finalBackgroundColor = backgroundColor || colors.muted;
  const finalProgressColor = progressColor || colors.primary;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (indeterminate) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    } else {
      if (animated) {
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 500,
          useNativeDriver: false,
        }).start();
      } else {
        progressAnim.setValue(progress);
      }
    }
  }, [progress, animated, indeterminate, progressAnim, rotateAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    },
    svg: {
      position: 'absolute',
      transform: [{rotate: '-90deg'}],
    },
    backgroundCircle: {
      stroke: finalBackgroundColor,
      strokeWidth,
      fill: 'transparent',
    },
    progressCircle: {
      stroke: finalProgressColor,
      strokeWidth,
      fill: 'transparent',
      strokeLinecap: 'round',
    },
    percentageText: {
      fontSize: size * 0.2,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.svg,
          indeterminate && {
            transform: [{rotate: rotation}, {rotate: '-90deg'}],
          },
        ]}>
        {/* Background circle */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: finalBackgroundColor,
          }}
        />
        
        {/* Progress circle */}
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: finalProgressColor,
            borderTopColor: indeterminate ? finalProgressColor : 'transparent',
            borderRightColor: indeterminate ? finalProgressColor : 'transparent',
            borderBottomColor: indeterminate ? 'transparent' : 'transparent',
            borderLeftColor: indeterminate ? 'transparent' : 'transparent',
            transform: indeterminate ? [] : [
              {
                rotate: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        />
      </Animated.View>

      {showPercentage && !indeterminate && (
        <Text style={styles.percentageText}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
}