import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Alert,
  Text,
  Pressable,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Shield,
  Smartphone,
  Key,
  Clock,
  AlertTriangle,
  Trash2,
  Download,
  Fingerprint,
  Lock,
  Eye,
  Server,
  Wifi,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import {usePrivacySecurityStore} from '../../store/privacySecurityStore';
import {useNavigation} from '@react-navigation/native';
import {formatRelativeTime} from '../../utils/formatting';

export const SecuritySettings: React.FC = () => {
  const navigation = useNavigation();
  const {
    securitySettings,
    loading,
    loadSettings,
    enableTwoFactor,
    disableTwoFactor,
    setupBiometric,
    disableBiometric,
    fetchActiveSessions,
    revokeSession,
    revokeAllSessions,
    revokeAppAccess,
    changePassword,
  } = usePrivacySecurityStore();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    loadSettings();
    fetchActiveSessions();
  }, []);

  const handleEnable2FA = async () => {
    try {
      const result = await enableTwoFactor('2fa_app');
      setQrCode(result.qrCode || '');
      setShow2FAModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await disableTwoFactor('2fa_app');
              Alert.alert('Success', '2FA has been disabled');
            } catch (error) {
              Alert.alert('Error', 'Failed to disable 2FA');
            }
          },
        }
      ],
    );
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await setupBiometric();
        if (!success) {
          Alert.alert('Error', 'Failed to setup biometric authentication');
        }
      } else {
        await disableBiometric();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric setting');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleRevokeSession = (sessionId: string, deviceName: string) => {
    Alert.alert('Revoke Session', `Remove access for ${deviceName}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => revokeSession(sessionId),
      },
    ]);
  };

  const handleRevokeAllSessions = () => {
    Alert.alert(
      'Revoke All Sessions',
      'This will sign you out of all devices except this one.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: revokeAllSessions,
        }
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

  const twoFactorEnabled = securitySettings.twoFactorMethods.some(
    m => m.enabled,
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold ml-2">Security Settings</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Authentication */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">Authentication</Text>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <Key size={20} color="#6B7280" className="mr-3" />
                  <View>
                    <Text className="font-medium">
                      Two-Factor Authentication
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Add extra security to your account
                    </Text>
                  </View>
                </View>
                {twoFactorEnabled ? (
                  <Pressable
                    onPress={handleDisable2FA}
                    className="bg-red-100 px-3 py-1 rounded-lg">
                    <Text className="text-red-600 font-medium">Disable</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleEnable2FA}
                    className="bg-blue-100 px-3 py-1 rounded-lg">
                    <Text className="text-blue-600 font-medium">Enable</Text>
                  </Pressable>
                )}
              </View>

              <View className="border-t border-gray-100" />

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <Fingerprint size={20} color="#6B7280" className="mr-3" />
                  <View>
                    <Text className="font-medium">
                      Biometric Authentication
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Use fingerprint or face unlock
                    </Text>
                  </View>
                </View>
                <Switch
                  value={securitySettings.biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{false: '#D1D5DB', true: '#3B82F6'}}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="border-t border-gray-100" />

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <Lock size={20} color="#6B7280" className="mr-3" />
                  <View>
                    <Text className="font-medium">Password</Text>
                    <Text className="text-sm text-gray-500">
                      Last changed:{' '}
                      {securitySettings.lastPasswordChange
                        ? formatRelativeTime(
                            securitySettings.lastPasswordChange,
                          )
                        : 'Never'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowPasswordModal(true)}
                  className="bg-gray-100 px-3 py-1 rounded-lg">
                  <Text className="text-gray-700 font-medium">Change</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Active Sessions */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold">Active Sessions</Text>
                <Pressable
                  onPress={handleRevokeAllSessions}
                  className="bg-gray-100 px-3 py-1 rounded-lg">
                  <Text className="text-gray-700 font-medium text-sm">
                    Revoke All
                  </Text>
                </Pressable>
              </View>

              {securitySettings.activeSessions.map((session, index) => (
                <View key={session.id}>
                  {index > 0 && <View className="border-t border-gray-100" />}
                  <View className="py-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-start flex-1">
                        <View className="mr-3 mt-1">
                          {session.deviceType === 'mobile' ? (
                            <Smartphone size={16} color="#6B7280" />
                          ) : (
                            <Server size={16} color="#6B7280" />
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="font-medium">
                              {session.deviceName}
                            </Text>
                            {session.isCurrent && (
                              <View className="bg-blue-100 px-2 py-0.5 rounded ml-2">
                                <Text className="text-xs text-blue-600">
                                  Current
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-sm text-gray-500">
                            {session.location} •{' '}
                            {formatRelativeTime(session.lastActive)}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {session.ipAddress}
                          </Text>
                        </View>
                      </View>
                      {!session.isCurrent && (
                        <Pressable
                          onPress={() =>
                            handleRevokeSession(session.id, session.deviceName)
                          }
                          className="p-1">
                          <Trash2 size={16} color="#6B7280" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Connected Apps */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">Connected Apps</Text>

              {securitySettings.allowedDapps.length > 0 ? (
                securitySettings.allowedDapps.map((app, index) => (
                  <View key={app.id}>
                    {index > 0 && <View className="border-t border-gray-100" />}
                    <View className="py-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          {app.iconUrl ? (
                            <Image
                              source={{uri: app.iconUrl}}
                              className="w-8 h-8 rounded mr-3"
                            />
                          ) : (
                            <View className="w-8 h-8 bg-gray-100 rounded items-center justify-center mr-3">
                              <Wifi size={16} color="#6B7280" />
                            </View>
                          )}
                          <View className="flex-1">
                            <Text className="font-medium">{app.name}</Text>
                            <Text className="text-sm text-gray-500">
                              Connected {formatRelativeTime(app.connectedAt)}
                            </Text>
                            <Text className="text-xs text-gray-400">
                              {app.permissions.join(', ')}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => revokeAppAccess(app.id)}
                          className="bg-red-100 px-3 py-1 rounded-lg">
                          <Text className="text-red-600 font-medium text-sm">
                            Revoke
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Wifi size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">No connected apps</Text>
                </View>
              )}
            </View>
          </View>

          {/* Security Options */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">
                Security Options

              <Pressable
                onPress={() => navigation.navigate('SecurityEvents')}
                className="flex-row items-center py-3">
                <AlertTriangle size={20} color="#6B7280" className="mr-3" />
                <View className="flex-1">
                  <Text className="font-medium">Security Events</Text>
                  <Text className="text-sm text-gray-500">
                    View recent security activity
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('BackupCodes')}
                className="flex-row items-center py-3">
                <Download size={20} color="#6B7280" className="mr-3" />
                <View className="flex-1">
                  <Text className="font-medium">Backup Codes</Text>
                  <Text className="text-sm text-gray-500">
                    Generate recovery codes
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold">Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View>
              <Text className="text-sm text-gray-600 mb-2">
                Current Password
              </Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                className="bg-gray-100 rounded-lg px-4 py-3 mb-4"
                placeholder="Enter current password"
              />

              <Text className="text-sm text-gray-600 mb-2">New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                className="bg-gray-100 rounded-lg px-4 py-3 mb-4"
                placeholder="Enter new password"
              />

              <Text className="text-sm text-gray-600 mb-2">
                Confirm New Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                className="bg-gray-100 rounded-lg px-4 py-3 mb-6"
                placeholder="Confirm new password"
              />
            </View>

            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg">
                <Text className="text-center text-gray-700 font-medium">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleChangePassword}
                className="flex-1 bg-blue-600 py-3 rounded-lg">
                <Text className="text-center text-white font-medium">
                  Change Password
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        visible={show2FAModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShow2FAModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold">
                Setup Two-Factor Authentication
              </Text>
              <Pressable onPress={() => setShow2FAModal(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View className="items-center py-4">
              <Text className="text-center mb-4">
                Scan this QR code with your authenticator app
              </Text>
              {qrCode && (
                <View className="w-48 h-48 bg-gray-200 items-center justify-center">
                  <Text className="text-gray-500">QR Code Placeholder</Text>
                </View>
              )}
              <Text className="text-xs text-gray-500 text-center mt-4">
                Can't scan? Enter the code manually in your app
              </Text>
            </View>

            <Pressable
              onPress={() => setShow2FAModal(false)}
              className="bg-blue-600 py-3 rounded-lg mt-4">
              <Text className="text-center text-white font-medium">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
