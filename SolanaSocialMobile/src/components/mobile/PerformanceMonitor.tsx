import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useMobileOptimizationStore} from '../../store/mobileOptimizationStore';
import {Card} from '../ui/card';
import {Button} from '../ui/button';
import {Switch} from '../ui/switch';
import {PerformanceAlert} from '../../types/mobile-optimizations';

interface PerformanceMonitorProps {
  showOverlay?: boolean;
  compactMode?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showOverlay = false,
  compactMode = false,
}) => {
  const {
    performanceMetrics,
    performanceAlerts,
    settings,
    isLowPerformanceMode,
    isLowBatteryMode,
    isLowMemoryMode,
    isSlowNetwork,
    updateSettings,
    enablePerformanceMode,
    disablePerformanceMode,
    clearPerformanceAlerts,
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
  } = useMobileOptimizationStore();

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (settings.enablePerformanceMonitoring) {
      startPerformanceMonitoring();
    }

    return () => {
      if (!settings.enablePerformanceMonitoring) {
        stopPerformanceMonitoring();
      }
    };
  }, [settings.enablePerformanceMonitoring]);

  const getPerformanceStatus = () => {
    if (!performanceMetrics) {
      return {status: 'unknown', color: 'text-gray-500'};
    }

    const {frameRate, batteryLevel, thermalState} = performanceMetrics;

    if (frameRate < 30 || batteryLevel < 0.15 || thermalState === 'critical') {
      return {status: 'poor', color: 'text-red-600'};
    }

    if (frameRate < 45 || batteryLevel < 0.3 || thermalState === 'serious') {
      return {status: 'fair', color: 'text-yellow-600'};
    }

    return {status: 'good', color: 'text-green-600'};
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getAlertColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const {status, color} = getPerformanceStatus();

  if (showOverlay && performanceMetrics) {
    return (
      <View className="absolute top-12 right-4 bg-black bg-opacity-75 p-2 rounded z-50">
        <Text className="text-white text-xs font-mono">
          FPS: {Math.round(performanceMetrics.frameRate)}
        </Text>
        <Text className="text-white text-xs font-mono">
          BAT: {formatPercentage(performanceMetrics.batteryLevel)}
        </Text>
        <Text className="text-white text-xs font-mono">
          CPU: {formatPercentage(performanceMetrics.cpuUsage)}
        </Text>
      </View>
    );
  }

  if (compactMode) {
    return (
      <Card className="p-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-medium text-gray-900">Performance</Text>
          <Text className={`text-sm font-medium ${color}`}>
            {status.toUpperCase()}
          </Text>
        </View>
        {performanceMetrics && (
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs text-gray-600">
              FPS: {Math.round(performanceMetrics.frameRate)}
            </Text>
            <Text className="text-xs text-gray-600">
              Battery: {formatPercentage(performanceMetrics.batteryLevel)}
            </Text>
            <Text className="text-xs text-gray-600">
              CPU: {formatPercentage(performanceMetrics.cpuUsage)}
            </Text>
          </View>
        )}
      </Card>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 space-y-4">
      {/* Performance Overview */}
      <Card className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            Performance Monitor
          </Text>
          <View className="flex-row items-center space-x-2">
            <Text className="text-sm text-gray-600">Enable Monitoring</Text>
            <Switch
              value={settings.enablePerformanceMonitoring}
              onValueChange={value =>
                updateSettings({enablePerformanceMonitoring: value})
              }
            />
          </View>
        </View>

        {performanceMetrics && (
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">Overall Status</Text>
              <Text className={`text-sm font-medium ${color}`}>
                {status.toUpperCase()}
              </Text>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View className="space-y-2">
                <Text className="text-xs text-gray-500">Frame Rate</Text>
                <Text className="text-lg font-medium text-gray-900">
                  {Math.round(performanceMetrics.frameRate)} FPS
                </Text>
              </View>

              <View className="space-y-2">
                <Text className="text-xs text-gray-500">Battery Level</Text>
                <Text className="text-lg font-medium text-gray-900">
                  {formatPercentage(performanceMetrics.batteryLevel)}
                </Text>
              </View>

              <View className="space-y-2">
                <Text className="text-xs text-gray-500">CPU Usage</Text>
                <Text className="text-lg font-medium text-gray-900">
                  {formatPercentage(performanceMetrics.cpuUsage)}
                </Text>
              </View>

              <View className="space-y-2">
                <Text className="text-xs text-gray-500">Thermal State</Text>
                <Text className="text-lg font-medium text-gray-900">
                  {performanceMetrics.thermalState}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!performanceMetrics && (
          <Text className="text-gray-500 text-center py-4">
            Enable performance monitoring to see metrics
          </Text>
        )}
      </Card>

      {/* System Status */}
      <Card className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          System Status
        </Text>
        <View className="space-y-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Low Performance Mode</Text>
            <View
              className={`w-2 h-2 rounded-full ${
                isLowPerformanceMode ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Low Battery Mode</Text>
            <View
              className={`w-2 h-2 rounded-full ${
                isLowBatteryMode ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Low Memory Mode</Text>
            <View
              className={`w-2 h-2 rounded-full ${
                isLowMemoryMode ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Slow Network</Text>
            <View
              className={`w-2 h-2 rounded-full ${
                isSlowNetwork ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            />
          </View>
        </View>
      </Card>

      {/* Performance Alerts */}
      {performanceAlerts.length > 0 && (
        <Card className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Performance Alerts
            </Text>
            <Button
              size="sm"
              variant="outline"
              onPress={clearPerformanceAlerts}>
              <Text className="text-gray-900 text-xs">Clear All</Text>
            </Button>
          </View>

          <View className="space-y-2">
            {performanceAlerts.map(alert => (
              <View
                key={alert.id}
                className={`p-3 rounded border ${getAlertColor(
                  alert.severity,
                )}`}>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-sm font-medium">{alert.message}</Text>
                    <Text className="text-xs opacity-75 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text className="text-xs font-medium uppercase">
                    {alert.severity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Optimization Controls */}
      <Card className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Optimization Controls
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900">
                Performance Mode
              </Text>
              <Text className="text-xs text-gray-600">
                Optimize for maximum performance
              </Text>
            </View>
            <Button
              size="sm"
              variant={settings.enablePerformanceMode ? 'default' : 'outline'}
              onPress={() =>
                settings.enablePerformanceMode
                  ? disablePerformanceMode()
                  : enablePerformanceMode()
              }>
              <Text
                className={
                  settings.enablePerformanceMode
                    ? 'text-white text-xs'
                    : 'text-gray-900 text-xs'
                }>
                {settings.enablePerformanceMode ? 'Enabled' : 'Enable'}
              </Text>
            </Button>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900">
                Performance Overlay
              </Text>
              <Text className="text-xs text-gray-600">
                Show real-time metrics overlay
              </Text>
            </View>
            <Switch
              value={settings.showPerformanceOverlay}
              onValueChange={value =>
                updateSettings({showPerformanceOverlay: value})
              }
            />
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900">
                Adaptive Image Quality
              </Text>
              <Text className="text-xs text-gray-600">
                Automatically adjust image quality
              </Text>
            </View>
            <Switch
              value={settings.adaptiveImageQuality}
              onValueChange={value =>
                updateSettings({adaptiveImageQuality: value})
              }
            />
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900">
                Reduced Animations
              </Text>
              <Text className="text-xs text-gray-600">
                Reduce animations for better performance
              </Text>
            </View>
            <Switch
              value={settings.reducedAnimations}
              onValueChange={value =>
                updateSettings({reducedAnimations: value})
              }
            />
          </View>
        </View>
      </Card>

      {/* Detailed Metrics */}
      {performanceMetrics && (
        <Card className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Detailed Metrics
            </Text>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setShowDetails(!showDetails)}>
              <Text className="text-gray-900 text-xs">
                {showDetails ? 'Hide' : 'Show'} Details
              </Text>
            </Button>
          </View>

          {showDetails && (
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-900 mb-2">
                  Memory Usage
                </Text>
                <View className="space-y-1">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">JS Heap Size</Text>
                    <Text className="text-xs text-gray-900">
                      {formatBytes(performanceMetrics.jsHeapSize)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">Native Heap</Text>
                    <Text className="text-xs text-gray-900">
                      {formatBytes(performanceMetrics.nativeHeapSize)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">Image Memory</Text>
                    <Text className="text-xs text-gray-900">
                      {formatBytes(performanceMetrics.imageMemory)}
                    </Text>
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-900 mb-2">
                  Rendering Performance
                </Text>
                <View className="space-y-1">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">
                      Dropped Frames
                    </Text>
                    <Text className="text-xs text-gray-900">
                      {performanceMetrics.droppedFrames}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">Render Time</Text>
                    <Text className="text-xs text-gray-900">
                      {performanceMetrics.renderTime.toFixed(2)}ms
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">
                      Cache Hit Ratio
                    </Text>
                    <Text className="text-xs text-gray-900">
                      {formatPercentage(performanceMetrics.cacheHitRatio)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
};
