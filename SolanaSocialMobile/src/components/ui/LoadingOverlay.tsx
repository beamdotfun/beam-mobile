import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface LoadingOverlayProps {
  visible: boolean;
  title?: string;
  message?: string;
  progress?: number; // 0-1 for progress bar
  showProgress?: boolean;
  transparent?: boolean;
}

const {width, height} = Dimensions.get('window');

export function LoadingOverlay({
  visible,
  title = 'Loading...',
  message,
  progress = 0,
  showProgress = false,
  transparent = false,
}: LoadingOverlayProps) {
  const {colors} = useThemeStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress, progressAnim]);

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: transparent ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)',
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      minWidth: 200,
      maxWidth: width * 0.8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
    spinner: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
      marginBottom: message ? 8 : 0,
    },
    message: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: showProgress ? 16 : 0,
    },
    progressContainer: {
      width: '100%',
      marginTop: 16,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.muted,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
      marginTop: 8,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent>
      <Animated.View 
        style={[
          styles.modal,
          {
            opacity: fadeAnim,
          },
        ]}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {scale: scaleAnim},
              ],
            },
          ]}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={styles.spinner}
          />
          
          <Text style={styles.title}>{title}</Text>
          
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}