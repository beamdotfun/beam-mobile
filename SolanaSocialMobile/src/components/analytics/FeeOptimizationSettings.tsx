import React, {useState} from 'react';
import {View, Text, Modal, Pressable, Switch, TextInput} from 'react-native';
import {X, Settings, Info} from 'lucide-react-native';
import {FeeOptimization} from '../../types/fee-analytics';
import {useFeeAnalyticsStore} from '../../store/feeAnalyticsStore';
import {formatSOL} from '../../utils/formatting';

interface FeeOptimizationSettingsProps {
  visible: boolean;
  onClose: () => void;
  optimization: FeeOptimization | null;
}

export function FeeOptimizationSettings({
  visible,
  onClose,
  optimization,
}: FeeOptimizationSettingsProps) {
  const {updateOptimizationSettings} = useFeeAnalyticsStore();

  const [autoOptimize, setAutoOptimize] = useState(
    optimization?.currentSettings.autoOptimize || false,
  );
  const [priorityFee, setPriorityFee] = useState(
    optimization?.currentSettings.defaultPriorityFee.toString() || '0.00001',
  );
  const [maxFeeLimit, setMaxFeeLimit] = useState(
    optimization?.currentSettings.maxFeeLimit.toString() || '0.1',
  );

  const handleSave = async () => {
    try {
      await updateOptimizationSettings({
        autoOptimize,
        defaultPriorityFee: parseFloat(priorityFee),
        maxFeeLimit: parseFloat(maxFeeLimit),
      });
      onClose();
    } catch (error) {
      console.error('Failed to update optimization settings:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Settings size={24} color="#374151" />
              <Text className="text-xl font-bold ml-2">Fee Optimization</Text>
            </View>
            <Pressable onPress={onClose}>
              <X size={24} color="#6B7280" />
            </Pressable>
          </View>

          {optimization && (
            <>
              {/* Recommendation Box */}
              {optimization.recommendedSettings && (
                <View className="bg-blue-50 rounded-lg p-4 mb-6">
                  <View className="flex-row items-start">
                    <Info size={16} color="#3B82F6" className="mt-0.5 mr-2" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-blue-900 mb-1">
                        Recommended Settings
                      </Text>
                      <Text className="text-xs text-blue-700 mb-2">
                        {optimization.recommendedSettings.reasoning}
                      </Text>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-blue-600">
                          Priority Fee:{' '}
                          {formatSOL(
                            optimization.recommendedSettings.defaultPriorityFee,
                          )}
                        </Text>
                        <Text className="text-xs text-blue-600">
                          Max Limit:{' '}
                          {formatSOL(
                            optimization.recommendedSettings.maxFeeLimit,
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Settings */}
              <View className="space-y-4">
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-1">
                    <Text className="font-medium">Auto-Optimize Fees</Text>
                    <Text className="text-sm text-gray-500">
                      Automatically adjust fees based on network conditions
                    </Text>
                  </View>
                  <Switch
                    value={autoOptimize}
                    onValueChange={setAutoOptimize}
                    trackColor={{false: '#D1D5DB', true: '#3B82F6'}}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View className="border-t border-gray-200" />

                <View>
                  <Text className="font-medium mb-2">
                    Default Priority Fee (SOL)
                  </Text>
                  <TextInput
                    value={priorityFee}
                    onChangeText={setPriorityFee}
                    keyboardType="numeric"
                    className="bg-gray-100 rounded-lg px-4 py-3"
                    placeholder="0.00001"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Added to base fee for faster confirmation
                  </Text>
                </View>

                <View>
                  <Text className="font-medium mb-2">
                    Maximum Fee Limit (SOL)
                  </Text>
                  <TextInput
                    value={maxFeeLimit}
                    onChangeText={setMaxFeeLimit}
                    keyboardType="numeric"
                    className="bg-gray-100 rounded-lg px-4 py-3"
                    placeholder="0.1"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Transactions exceeding this limit will require confirmation
                  </Text>
                </View>
              </View>

              {/* History */}
              {optimization.optimizationHistory.length > 0 && (
                <View className="mt-6">
                  <Text className="font-medium mb-2">Recent Optimizations</Text>
                  <View className="bg-gray-50 rounded-lg p-3">
                    {optimization.optimizationHistory
                      .slice(0, 3)
                      .map((record, index) => (
                        <View
                          key={index}
                          className="flex-row justify-between py-1">
                          <Text className="text-xs text-gray-600">
                            {record.action}
                          </Text>
                          <Text className="text-xs text-green-600">
                            Saved {formatSOL(record.actualSavings)} (
                            {record.effectiveness.toFixed(0)}%)
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Actions */}
          <View className="flex-row space-x-3 mt-6">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-gray-100 py-3 rounded-lg">
              <Text className="text-center text-gray-700 font-medium">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 bg-blue-600 py-3 rounded-lg">
              <Text className="text-center text-white font-medium">
                Save Settings
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
