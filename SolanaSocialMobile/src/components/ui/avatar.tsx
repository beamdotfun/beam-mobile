import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRing?: boolean;
  ringColor?: string;
  shape?: 'circle' | 'square';
}

export function Avatar({
  src,
  fallback,
  size = 'md',
  showRing = false,
  ringColor,
  shape = 'circle',
}: AvatarProps) {
  const {colors} = useThemeStore();

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 56;
      case 'xl':
        return 96;
      default:
        return 40;
    }
  };

  const avatarSize = getSize();
  const fontSize =
    size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 20 : 32;

  // Calculate border radius based on shape
  const borderRadius = shape === 'square' ? avatarSize * 0.2 : avatarSize / 2;
  const ringBorderRadius = shape === 'square' ? (avatarSize + 4) * 0.2 : (avatarSize + 4) / 2;

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: borderRadius,
      backgroundColor: src ? 'transparent' : colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: showRing ? 2 : 0,
      borderColor: colors.background,
    },
    ring: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: ringBorderRadius,
      borderWidth: 2,
      borderColor: ringColor || colors.success,
    },
    fallbackText: {
      color: colors.mutedForeground,
      fontSize,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {showRing && <View style={styles.ring} />}
      {src ? (
        <Image source={{uri: src}} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.fallbackText}>{fallback || 'U'}</Text>
        </View>
      )}
    </View>
  );
}
