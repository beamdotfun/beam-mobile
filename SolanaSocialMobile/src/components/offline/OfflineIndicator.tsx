import React, {useEffect, useState} from 'react';
import {View, Text, Animated, Pressable} from 'react-native';
import {WifiOff, Cloud, CloudOff, RefreshCw} from 'lucide-react-native';
import {useOfflineStore} from '../../store/offlineStore';
import {useThemeStore} from '../../store/themeStore';
import {cn} from '../../utils/cn';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export function OfflineIndicator({
  position = 'top',
  showDetails = true,
}: OfflineIndicatorProps) {
  const {colors} = useThemeStore();
  const {isOnline, networkInfo, pendingOperations, syncPendingOperations} =
    useOfflineStore();

  const [slideAnim] = useState(new Animated.Value(-100));
  const [isVisible, setIsVisible] = useState(!isOnline);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [isOnline, slideAnim]);

  const handleSync = async () => {
    if (isOnline && pendingOperations > 0 && !isSyncing) {
      setIsSyncing(true);
      try {
        await syncPendingOperations();
      } finally {
        setIsSyncing(false);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      className={cn(
        'absolute left-0 right-0 z-50',
        position === 'top' ? 'top-0' : 'bottom-0',
      )}
      style={{
        transform: [
          {
            translateY:
              position === 'top' ? slideAnim : Animated.multiply(slideAnim, -1),
          },
        ],
      }}>
      <View className="bg-destructive/90 backdrop-blur-sm">
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3">
              <WifiOff size={20} color="white" />
              <View>
                <Text className="text-white font-semibold">You're Offline</Text>
                {showDetails && (
                  <Text className="text-white/80 text-xs">
                    {pendingOperations > 0
                      ? `${pendingOperations} actions pending sync`
                      : 'Some features may be limited'}
                  </Text>
                )}
              </View>
            </View>

            {pendingOperations > 0 && isOnline && (
              <Pressable
                onPress={handleSync}
                disabled={isSyncing}
                className={cn(
                  'bg-white/20 rounded-full p-2',
                  isSyncing && 'opacity-50',
                )}>
                <RefreshCw
                  size={16}
                  color="white"
                  className={isSyncing ? 'animate-spin' : ''}
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
