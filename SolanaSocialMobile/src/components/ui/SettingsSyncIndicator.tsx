import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface SettingsSyncIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onRetryPress?: () => void;
}

export function SettingsSyncIndicator({ 
  size = 'md', 
  showText = true, 
  onRetryPress 
}: SettingsSyncIndicatorProps) {
  const { colors } = useThemeStore();
  const { syncStatus, lastUpdated, lastError, retryFailedUpdates } = useSettingsStore();
  const { isOnline } = useNetworkStatus();

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const textSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  const handleRetry = async () => {
    try {
      if (onRetryPress) {
        onRetryPress();
      } else {
        await retryFailedUpdates();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const getSyncIcon = () => {
    if (!isOnline) {
      return <WifiOff size={iconSize} color={colors.mutedForeground} />;
    }

    switch (syncStatus) {
      case 'synced':
        return <CheckCircle size={iconSize} color={colors.success} />;
      case 'syncing':
        return <ActivityIndicator size={iconSize} color={colors.primary} />;
      case 'error':
        return <AlertCircle size={iconSize} color={colors.destructive} />;
      case 'pending':
        return <RefreshCw size={iconSize} color={colors.warning} />;
      default:
        return <CheckCircle size={iconSize} color={colors.mutedForeground} />;
    }
  };

  const getSyncText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (syncStatus) {
      case 'synced':
        return lastUpdated 
          ? `Synced ${new Date(lastUpdated).toLocaleTimeString()}`
          : 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return lastError ? lastError.message : 'Sync failed';
      case 'pending':
        return 'Pending sync';
      default:
        return 'Unknown status';
    }
  };

  const getSyncColor = () => {
    if (!isOnline) {
      return colors.mutedForeground;
    }

    switch (syncStatus) {
      case 'synced':
        return colors.success;
      case 'syncing':
        return colors.primary;
      case 'error':
        return colors.destructive;
      case 'pending':
        return colors.warning;
      default:
        return colors.mutedForeground;
    }
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8 
    }}>
      {getSyncIcon()}
      
      {showText && (
        <Text 
          style={{ 
            fontSize: textSize, 
            color: getSyncColor(),
            fontFamily: 'Inter-Medium',
            fontWeight: '500'
          }}
        >
          {getSyncText()}
        </Text>
      )}

      {syncStatus === 'error' && (
        <Pressable 
          onPress={handleRetry}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: colors.muted
          }}
        >
          <Text 
            style={{ 
              fontSize: textSize - 2, 
              color: colors.primary,
              fontFamily: 'Inter-Medium',
              fontWeight: '500'
            }}
          >
            Retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Mini version for use in headers or compact spaces
export function SettingsSyncStatus() {
  const { colors } = useThemeStore();
  const { syncStatus } = useSettingsStore();
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.mutedForeground
      }} />
    );
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return colors.success;
      case 'syncing':
        return colors.primary;
      case 'error':
        return colors.destructive;
      case 'pending':
        return colors.warning;
      default:
        return colors.mutedForeground;
    }
  };

  return (
    <View style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: getStatusColor()
    }} />
  );
}