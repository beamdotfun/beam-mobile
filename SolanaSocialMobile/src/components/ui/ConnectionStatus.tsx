import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  showText?: boolean;
}

export function ConnectionStatus({
  status,
  showText = false,
}: ConnectionStatusProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: showText ? 6 : 0,
    },
    text: {
      fontSize: 12,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
  });

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return colors.success || '#10B981';
      case 'connecting':
        return colors.warning || '#F59E0B';
      case 'disconnected':
        return colors.destructive || '#EF4444';
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.dot, {backgroundColor: getStatusColor()}]} />
      {showText && (
        <Text style={[styles.text, {color: getStatusColor()}]}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
}
