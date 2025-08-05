import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {useThemeStore} from '../../store/themeStore';
import {LoadingOverlay} from './LoadingOverlay';
import {SkeletonCard, Skeleton} from './Skeleton';

interface UniversalLoaderProps {
  type?: 'overlay' | 'skeleton' | 'inline' | 'mini';
  title?: string;
  message?: string;
  showSkeleton?: boolean;
  style?: ViewStyle;
}

export function UniversalLoader({
  type = 'inline',
  title = 'Loading...',
  message,
  showSkeleton = false,
  style,
}: UniversalLoaderProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    inlineContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    miniContainer: {
      paddingVertical: 8,
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginTop: 12,
    },
    message: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
      textAlign: 'center',
    },
    skeletonContainer: {
      width: '100%',
      paddingHorizontal: 16,
    },
  });

  if (type === 'overlay') {
    return (
      <LoadingOverlay
        visible={true}
        title={title}
        message={message}
      />
    );
  }

  if (type === 'skeleton' || showSkeleton) {
    return (
      <View style={[styles.skeletonContainer, style]}>
        <SkeletonCard showAvatar showImage={false} />
      </View>
    );
  }

  if (type === 'mini') {
    return (
      <View style={[styles.miniContainer, style]}>
        <Skeleton width={100} height={4} />
        <Text style={[styles.message, {marginTop: 8}]}>{title}</Text>
      </View>
    );
  }

  // Default inline loader
  return (
    <View style={[type === 'inline' ? styles.inlineContainer : styles.container, style]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

// Quick replacement components for common patterns
export function ScreenLoader({ title = 'Loading...', message }: { title?: string; message?: string }) {
  return <UniversalLoader type="skeleton" title={title} message={message} />;
}

export function InlineLoader({ title = 'Loading...', message }: { title?: string; message?: string }) {
  return <UniversalLoader type="inline" title={title} message={message} />;
}

export function MiniLoader({ title = 'Loading...' }: { title?: string }) {
  return <UniversalLoader type="mini" title={title} />;
}