import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {WifiOff} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface ErrorStateProps {
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  retryText?: string;
  loading?: boolean;
}

export function ErrorState({
  title,
  subtitle,
  onRetry,
  retryText = 'Retry',
  loading = false,
}: ErrorStateProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    content: {
      alignItems: 'center',
      maxWidth: 280,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Inter-SemiBold',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 28,
      fontFamily: 'Inter-Regular',
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 32,
      alignItems: 'center',
      minWidth: 120,
      opacity: loading ? 0.6 : 1,
    },
    retryButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <WifiOff size={24} color={colors.mutedForeground} />
        </View>

        <Text style={styles.title}>{title}</Text>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {onRetry && (
          <Pressable
            style={styles.retryButton}
            onPress={onRetry}
            disabled={loading}>
            <Text style={styles.retryButtonText}>
              {loading ? 'Loading...' : retryText}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
