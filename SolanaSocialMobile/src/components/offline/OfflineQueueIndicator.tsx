import React from 'react';
import {View, TouchableOpacity, Animated, ScrollView} from 'react-native';
import {Text} from '../ui/text';
import {Button} from '../ui/button';
import {QueueItem, QueueItemStatus} from '../../services/offline/queueStorage';

interface QueueStatus {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  isConnected: boolean;
}

interface OfflineQueueIndicatorProps {
  status: QueueStatus;
  items: QueueItem[];
  onRetryItem?: (id: string) => void;
  onCancelItem?: (id: string) => void;
  onClearCompleted?: () => void;
}

export function OfflineQueueIndicator({
  status,
  items,
  onRetryItem,
  onCancelItem,
  onClearCompleted,
}: OfflineQueueIndicatorProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (status.pending > 0 || status.processing > 0) {
      // Pulse animation when queue is active
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  // Don't show if connected and no pending/failed items
  if (status.isConnected && status.pending === 0 && status.failed === 0) {
    return null;
  }

  const handlePress = () => {
    setShowDetails(!showDetails);
  };

  if (showDetails) {
    return (
      <View className="absolute bottom-20 right-4 left-4 bg-white rounded-lg shadow-lg p-4 max-h-96">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold">Offline Queue</Text>
          <View className="flex-row items-center">
            {!status.isConnected && (
              <>
                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                <Text className="text-sm text-gray-500 mr-4">Offline</Text>
              </>
            )}
            <TouchableOpacity onPress={handlePress}>
              <Text className="text-blue-500 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-around mb-4">
          <View className="items-center">
            <Text className="text-2xl font-bold text-orange-500">
              {status.pending}
            </Text>
            <Text className="text-sm text-gray-500">Pending</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-500">
              {status.processing}
            </Text>
            <Text className="text-sm text-gray-500">Processing</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-red-500">
              {status.failed}
            </Text>
            <Text className="text-sm text-gray-500">Failed</Text>
          </View>
        </View>

        <ScrollView className="flex-1 max-h-48">
          {items.map(item => (
            <QueueItemCard
              key={item.id}
              item={item}
              onRetry={onRetryItem}
              onCancel={onCancelItem}
            />
          ))}
        </ScrollView>

        {status.completed > 0 && onClearCompleted && (
          <Button onPress={onClearCompleted} variant="outline" className="mt-4">
            <Text>Clear Completed ({status.completed})</Text>
          </Button>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="absolute bottom-20 right-4 bg-white rounded-full shadow-lg p-3">
      <Animated.View style={{transform: [{scale: pulseAnim}]}}>
        <View className="flex-row items-center">
          {!status.isConnected && (
            <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
          )}
          {status.pending > 0 && (
            <View className="bg-orange-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">
                {status.pending}
              </Text>
            </View>
          )}
          {status.failed > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-1 ml-1">
              <Text className="text-white text-xs font-bold">
                {status.failed}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface QueueItemCardProps {
  item: QueueItem;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

function QueueItemCard({item, onRetry, onCancel}: QueueItemCardProps) {
  const getStatusColor = (status: QueueItemStatus) => {
    switch (status) {
      case QueueItemStatus.PENDING:
        return 'text-orange-500';
      case QueueItemStatus.PROCESSING:
        return 'text-blue-500';
      case QueueItemStatus.FAILED:
        return 'text-red-500';
      case QueueItemStatus.COMPLETED:
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getItemDescription = (item: QueueItem) => {
    const data = item.data;

    switch (item.type) {
      case 'api_request':
        return `${data.method} ${data.endpoint}`;
      case 'blockchain_tx':
        return data.metadata?.description || 'Blockchain transaction';
      case 'media_upload':
        return `Upload ${data.fileName || 'media'}`;
      case 'sync_operation':
        return data.description || 'Sync operation';
      default:
        return 'Unknown operation';
    }
  };

  return (
    <View className="border border-gray-200 rounded-lg p-3 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-medium">{getItemDescription(item)}</Text>
          <Text className="text-sm text-gray-500 capitalize">
            {item.type.replace('_', ' ')}
          </Text>
        </View>
        <Text
          className={`text-sm font-medium capitalize ${getStatusColor(
            item.status,
          )}`}>
          {item.status}
        </Text>
      </View>

      {item.error && (
        <View className="bg-red-50 rounded p-2 mb-2">
          <Text className="text-sm text-red-600">{item.error}</Text>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-xs text-gray-500">
            Priority: {item.priority}
          </Text>
          {item.retryCount > 0 && (
            <Text className="text-xs text-gray-500 ml-4">
              Retries: {item.retryCount}/{item.maxRetries}
            </Text>
          )}
        </View>

        <View className="flex-row space-x-2">
          {item.status === QueueItemStatus.FAILED && onRetry && (
            <TouchableOpacity
              onPress={() => onRetry(item.id)}
              className="bg-blue-500 rounded px-3 py-1">
              <Text className="text-white text-xs">Retry</Text>
            </TouchableOpacity>
          )}
          {onCancel && item.status !== QueueItemStatus.COMPLETED && (
            <TouchableOpacity
              onPress={() => onCancel(item.id)}
              className="bg-gray-500 rounded px-3 py-1">
              <Text className="text-white text-xs">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
