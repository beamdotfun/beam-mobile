import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface StatusDotProps {
  status: 'online' | 'offline' | 'connecting';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StatusDot({
  status,
  showLabel = false,
  size = 'sm',
}: StatusDotProps) {
  const {colors} = useThemeStore();

  const getDotSize = () => (size === 'sm' ? 6 : 8);
  const dotSize = getDotSize();

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return colors.success || '#10B981';
      case 'connecting':
        return colors.warning || '#F59E0B';
      case 'offline':
        return colors.destructive || '#EF4444';
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Live';
      case 'connecting':
        return 'Connecting';
      case 'offline':
        return 'Offline';
      default:
        return '';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: getStatusColor(),
      marginRight: showLabel ? 6 : 0,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      {showLabel && <Text style={styles.label}>{getStatusLabel()}</Text>}
    </View>
  );
}
