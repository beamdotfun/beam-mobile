import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Key,
  Download,
  Copy,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import {usePrivacySecurityStore} from '../../store/privacySecurityStore';
import {useNavigation} from '@react-navigation/native';
import {Clipboard} from 'react-native';

export const BackupCodes: React.FC = () => {
  const navigation = useNavigation();
  const {securitySettings, loading, loadSettings} = usePrivacySecurityStore();
  const [showCodes, setShowCodes] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await Clipboard.setString(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code to clipboard');
    }
  };

  const handleCopyAll = async () => {
    if (!securitySettings?.backupCodes) {
      return;
    }

    try {
      const allCodes = securitySettings.backupCodes.join('\n');
      await Clipboard.setString(allCodes);
      Alert.alert('Success', 'All backup codes copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy codes to clipboard');
    }
  };

  const handleShare = async () => {
    if (!securitySettings?.backupCodes) {
      return;
    }

    try {
      const codesText = `Beam Backup Codes\n\nKeep these codes safe and secure:\n\n${securitySettings.backupCodes.join(
        '\n',
      )}\n\nEach code can only be used once.`;

      await Share.share({
        message: codesText,
        title: 'Backup Codes',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share codes');
    }
  };

  const handleRegenerateCodes = () => {
    Alert.alert(
      'Regenerate Backup Codes',
      'This will invalidate all existing backup codes and generate new ones. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              // In a real app, this would call an API to regenerate codes
              await new Promise(resolve => setTimeout(resolve, 1500));
              Alert.alert('Success', 'New backup codes have been generated');
              setShowCodes(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate backup codes');
            } finally {
              setRegenerating(false);
            }
          },
        },
      ],
    );
  };

  if (loading || !securitySettings) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  const backupCodes = securitySettings.backupCodes || [];
  const hasBackupCodes = backupCodes.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold ml-2">Backup Codes</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Information Card */}
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Shield size={20} color="#2563EB" className="mt-0.5" />
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-blue-900 mb-1">
                  What are backup codes?
                </Text>
                <Text className="text-sm text-blue-700">
                  Backup codes allow you to access your account if you lose
                  access to your two-factor authentication device. Each code can
                  only be used once.
                </Text>
              </View>
            </View>
          </View>

          {/* Warning Card */}
          <View className="bg-amber-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <AlertTriangle size={20} color="#F59E0B" className="mt-0.5" />
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-amber-900 mb-1">
                  Important Security Notice
                </Text>
                <Text className="text-sm text-amber-700">
                  Store these codes in a safe place. Anyone with access to these
                  codes can access your account.
                </Text>
              </View>
            </View>
          </View>

          {hasBackupCodes ? (
            <>
              {/* Codes Display */}
              <View className="bg-white rounded-lg p-4 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold">
                    Your Backup Codes
                  </Text>
                  <Pressable
                    onPress={() => setShowCodes(!showCodes)}
                    className="flex-row items-center">
                    {showCodes ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                    <Text className="text-sm text-gray-600 ml-1">
                      {showCodes ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>

                <View className="space-y-2">
                  {backupCodes.map((code, index) => (
                    <View
                      key={index}
                      className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3">
                      <Text
                        className={`font-mono text-gray-900 ${
                          !showCodes ? 'opacity-0' : ''
                        }`}>
                        {showCodes ? code : '••••-••••-••••'}
                      </Text>
                      <Pressable
                        onPress={() => handleCopyCode(code, index)}
                        disabled={!showCodes}
                        className="p-2">
                        {copiedIndex === index ? (
                          <CheckCircle size={16} color="#10B981" />
                        ) : (
                          <Copy
                            size={16}
                            color={showCodes ? '#6B7280' : '#D1D5DB'}
                          />
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>

                <Text className="text-xs text-gray-500 mt-4 text-center">
                  {backupCodes.length} codes remaining
                </Text>
              </View>

              {/* Actions */}
              <View className="space-y-3">
                <Pressable
                  onPress={handleCopyAll}
                  disabled={!showCodes}
                  className={`flex-row items-center justify-center p-3 rounded-lg ${
                    showCodes ? 'bg-gray-100' : 'bg-gray-50'
                  }`}>
                  <Copy size={16} color={showCodes ? '#374151' : '#D1D5DB'} />
                  <Text
                    className={`ml-2 font-medium ${
                      showCodes ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                    Copy All Codes
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleShare}
                  disabled={!showCodes}
                  className={`flex-row items-center justify-center p-3 rounded-lg ${
                    showCodes ? 'bg-gray-100' : 'bg-gray-50'
                  }`}>
                  <Download
                    size={16}
                    color={showCodes ? '#374151' : '#D1D5DB'}
                  />
                  <Text
                    className={`ml-2 font-medium ${
                      showCodes ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                    Share Codes
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleRegenerateCodes}
                  disabled={regenerating}
                  className="flex-row items-center justify-center bg-red-100 p-3 rounded-lg">
                  {regenerating ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <>
                      <RefreshCw size={16} color="#DC2626" />
                      <Text className="ml-2 text-red-600 font-medium">
                        Regenerate Codes
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            /* No Codes State */
            <View className="bg-white rounded-lg p-8 items-center">
              <Key size={48} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">
                No Backup Codes Generated
              </Text>
              <Text className="text-gray-500 text-center mt-2 mb-6">
                Generate backup codes to ensure you can always access your
                account
              </Text>
              <Pressable
                onPress={handleRegenerateCodes}
                disabled={regenerating}
                className="bg-blue-600 px-6 py-3 rounded-lg">
                {regenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-medium">
                    Generate Backup Codes
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Tips */}
          <View className="bg-gray-50 rounded-lg p-4 mt-4">
            <Text className="font-semibold text-gray-900 mb-2">
              Security Tips
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-start">
                <Text className="text-gray-500 mr-2">•</Text>
                <Text className="text-sm text-gray-600 flex-1">
                  Store backup codes in a secure location like a password
                  manager
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-gray-500 mr-2">•</Text>
                <Text className="text-sm text-gray-600 flex-1">
                  Don't store codes on the same device you use for 2FA
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-gray-500 mr-2">•</Text>
                <Text className="text-sm text-gray-600 flex-1">
                  Generate new codes if you suspect they've been compromised
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-gray-500 mr-2">•</Text>
                <Text className="text-sm text-gray-600 flex-1">
                  Each code can only be used once for account recovery
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
