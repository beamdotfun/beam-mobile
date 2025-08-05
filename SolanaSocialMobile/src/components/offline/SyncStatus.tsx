import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Wifi,
} from 'lucide-react-native';
import {useOfflineStore} from '../../store/offlineStore';
import {useThemeStore} from '../../store/themeStore';
import {cn} from '../../utils/cn';

interface SyncStatusProps {
  showDetails?: boolean;
  onRetryPress?: () => void;
}

export function SyncStatus({
  showDetails = true,
  onRetryPress,
}: SyncStatusProps) {
  const {colors} = useThemeStore();
  const {
    isOnline,
    pendingOperations,
    syncQueue,
    lastSyncTimestamp,
    retryFailedOperations,
  } = useOfflineStore();

  const failedOperations = syncQueue.filter(
    item => item.status === 'failed',
  ).length;
  const syncingOperations = syncQueue.filter(
    item => item.status === 'syncing',
  ).length;

  const handleRetry = async () => {
    if (onRetryPress) {
      onRetryPress();
    } else {
      await retryFailedOperations();
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <Wifi size={16} color={colors.mutedForeground} />;
    }

    if (syncingOperations > 0) {
      return (
        <RefreshCw size={16} color={colors.primary} className="animate-spin" />
      );

    if (failedOperations > 0) {
      return <XCircle size={16} color={colors.destructive} />;
    }

    if (pendingOperations > 0) {
      return <Clock size={16} color={colors.warning} />;
    }

    return <CheckCircle size={16} color={colors.success} />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    if (syncingOperations > 0) {
      return `Syncing ${syncingOperations} items...`;
    }

    if (failedOperations > 0) {
      return `${failedOperations} failed to sync`;
    }

    if (pendingOperations > 0) {
      return `${pendingOperations} pending sync`;
    }

    const lastSync = lastSyncTimestamp
      ? new Date(lastSyncTimestamp).toLocaleTimeString()
      : 'Never';
    return `Synced at ${lastSync}`;
  };

  const getStatusColor = () => {
    if (!isOnline) {return colors.mutedForeground;}
    if (syncingOperations > 0) {return colors.primary;}
    if (failedOperations > 0) {return colors.destructive;}
    if (pendingOperations > 0) {return colors.warning;}
    return colors.success;
  };

  return (
    <View className="flex-row items-center justify-between p-3 border-b border-border">
      <View className="flex-row items-center space-x-2 flex-1">
        {getStatusIcon()}
        <View className="flex-1">
          <Text
            className="text-sm font-medium"
            style={{color: getStatusColor()}}>
            {getStatusText()}
          </Text>
          {showDetails && (
            <Text className="text-xs text-muted-foreground">
              {isOnline ? 'Connected' : 'Working offline'}
            </Text>
          )}
        </View>
      </View>

      {failedOperations > 0 && isOnline && (
        <Pressable
          onPress={handleRetry}
          className="bg-destructive/10 px-3 py-1 rounded-full flex-row items-center space-x-1">
          <RefreshCw size={12} color={colors.destructive} />
          <Text
            className="text-xs font-medium"
            style={{color: colors.destructive}}>
            Retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}
