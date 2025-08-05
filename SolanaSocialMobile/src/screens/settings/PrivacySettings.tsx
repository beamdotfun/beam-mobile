import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Alert,
  Text,
  Switch,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Eye,
  EyeOff,
  MessageSquare,
  Bell,
  Search,
  Activity,
  Shield,
  Download,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import {usePrivacySecurityStore} from '../../store/privacySecurityStore';
import {useNavigation} from '@react-navigation/native';
import {PrivacySettings as PrivacySettingsType} from '../../types/privacy-security';

export const PrivacySettings: React.FC = () => {
  const navigation = useNavigation();
  const {
    privacySettings,
    loading,
    saving,
    loadSettings,
    updatePrivacySettings,
    exportUserData,
    downloadDataReport,
  } = usePrivacySecurityStore();

  const [localSettings, setLocalSettings] =
    useState<PrivacySettingsType | null>(privacySettings);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setLocalSettings(privacySettings);
  }, [privacySettings]);

  const handleSettingChange = async (
    key: keyof PrivacySettingsType,
    value: any,
  ) => {
    if (!localSettings) {return;}

    const newSettings = {...localSettings, [key]: value};
    setLocalSettings(newSettings);

    try {
      await updatePrivacySettings({[key]: value});
    } catch (error) {
      // Revert on error
      setLocalSettings(privacySettings);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      "Your data will be exported and you'll receive a download link via email.",
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Export',
          onPress: async () => {
            try {
              await exportUserData();
              Alert.alert(
                'Success',
                "Data export has been initiated. You'll receive an email with the download link.",
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to initiate data export');
            }
          },
        }
      ],
    );
  };

  const handleDownloadReport = async () => {
    try {
      const reportUrl = await downloadDataReport();
      Alert.alert('Success', 'Privacy report generated successfully');
      // Handle opening the report URL
    } catch (error) {
      Alert.alert('Error', 'Failed to generate privacy report');
    }
  };

  if (loading || !localSettings) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    value,
    onValueChange,
    type = 'switch', 
  }: {
    icon: any;
    title: string;
    description: string;
    value: any;
    onValueChange: (value: any) => void;
    type?: 'switch' | 'select';
  }) => (
    <View className="flex-row items-center justify-between py-4">
      <View className="flex-row items-start flex-1">
        <Icon size={20} color="#6B7280" className="mt-0.5 mr-3" />
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-500 mt-1">{description}</Text>
        </View>
      </View>

      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{false: '#D1D5DB', true: '#3B82F6'}}
          thumbColor="#FFFFFF"
          disabled={saving}
        />
      )}

      {type === 'select' && (
        <Pressable
          onPress={() => {
            /* Handle select */
          }}
          className="flex-row items-center bg-gray-100 px-3 py-1 rounded-lg">
          <Text className="text-sm text-gray-700 capitalize mr-1">{value}</Text>
          <ChevronRight size={14} color="#6B7280" />
        </Pressable>
      )}
    </View>
  );

  const PermissionSelect = ({
    value,
    onValueChange,
    title, 
  }: {
    value: string;
    onValueChange: (value: string) => void;
    title: string;
  }) => (
    <View className="flex-row items-center justify-between py-4">
      <View className="flex-row items-start flex-1">
        <MessageSquare size={20} color="#6B7280" className="mt-0.5 mr-3" />
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Who can {title.toLowerCase()}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => {
          /* Handle permission select */
        }}
        className="flex-row items-center bg-gray-100 px-3 py-1 rounded-lg">
        <Text className="text-sm text-gray-700 capitalize mr-1">{value}</Text>
        <ChevronRight size={14} color="#6B7280" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold ml-2">Privacy Settings</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Profile Privacy */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">
                Profile Privacy

              <SettingRow
                icon={Eye}
                title="Profile Visibility"
                description="Who can see your profile"
                value={localSettings.profileVisibility}
                onValueChange={value =>
                  handleSettingChange('profileVisibility', value)
                }
                type="select"
              />

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Activity}
                title="Show Activity"
                description="Display your recent activity on your profile"
                value={localSettings.showActivity}
                onValueChange={value =>
                  handleSettingChange('showActivity', value)
                }

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Eye}
                title="Show Voting History"
                description="Allow others to see your voting activity"
                value={localSettings.showVotingHistory}
                onValueChange={value =>
                  handleSettingChange('showVotingHistory', value)
                }

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Activity}
                title="Show Following/Followers"
                description="Display your connections publicly"
                value={localSettings.showFollowing}
                onValueChange={value =>
                  handleSettingChange('showFollowing', value)
                }
              />
            </View>
          </View>

          {/* Communication Settings */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">Communication</Text>

              <PermissionSelect
                title="Direct Messages"
                value={localSettings.allowDirectMessages}
                onValueChange={value =>
                  handleSettingChange('allowDirectMessages', value)
                }
              />

              <View className="border-t border-gray-100" />

              <PermissionSelect
                title="Mentions"
                value={localSettings.allowMentions}
                onValueChange={value =>
                  handleSettingChange('allowMentions', value)
                }
              />

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Bell}
                title="Push Notifications"
                description="Receive push notifications for activity"
                value={localSettings.allowPushNotifications}
                onValueChange={value =>
                  handleSettingChange('allowPushNotifications', value)
                }
              />
            </View>

          {/* Discovery Settings */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">
                Discovery & Search

              <SettingRow
                icon={Search}
                title="Discoverable by Username"
                description="Allow others to find you by username"
                value={localSettings.discoverableByUsername}
                onValueChange={value =>
                  handleSettingChange('discoverableByUsername', value)
                }
              />

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Search}
                title="Show in Suggestions"
                description="Appear in user suggestion lists"
                value={localSettings.showInSuggestions}
                onValueChange={value =>
                  handleSettingChange('showInSuggestions', value)
                }
              />

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Activity}
                title="Allow Analytics"
                description="Help improve the platform with usage data"
                value={localSettings.allowAnalytics}
                onValueChange={value =>
                  handleSettingChange('allowAnalytics', value)
                }
              />
            </View>

          {/* Blockchain Privacy */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">
                Blockchain Privacy

              <SettingRow
                icon={EyeOff}
                title="Hide Transaction History"
                description="Keep your transaction history private"
                value={localSettings.hideTransactionHistory}
                onValueChange={value =>
                  handleSettingChange('hideTransactionHistory', value)
                }

              <View className="border-t border-gray-100" />

              <SettingRow
                icon={Shield}
                title="Anonymous Voting"
                description="Vote anonymously when possible"
                value={localSettings.anonymousVoting}
                onValueChange={value =>
                  handleSettingChange('anonymousVoting', value)
                }
              />
            </View>
          </View>

          {/* Data Management */}
          <View className="mb-4 bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">
                Data Management

              <View className="space-y-3">
                <Pressable
                  onPress={handleExportData}
                  className="flex-row items-center justify-center bg-gray-100 p-3 rounded-lg">
                  <Download size={16} color="#374151" />
                  <Text className="ml-2 text-gray-700 font-medium">
                    Export My Data
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDownloadReport}
                  className="flex-row items-center justify-center bg-gray-100 p-3 rounded-lg">
                  <Activity size={16} color="#374151" />
                  <Text className="ml-2 text-gray-700 font-medium">
                    Privacy Report
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('DataAudit')}
                  className="flex-row items-center justify-center bg-gray-100 p-3 rounded-lg">
                  <Search size={16} color="#374151" />
                  <Text className="ml-2 text-gray-700 font-medium">
                    View Data Audit
                  </Text>

                <Pressable
                  onPress={() => navigation.navigate('DeleteAccount')}
                  className="flex-row items-center justify-center bg-red-100 p-3 rounded-lg">
                  <Trash2 size={16} color="#DC2626" />
                  <Text className="ml-2 text-red-600 font-medium">
                    Delete Account
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Additional Options */}
          <View className="bg-white rounded-lg">
            <View className="p-4">
              <Text className="text-lg font-semibold mb-4">
                Additional Options

              <View className="space-y-3">
                <Pressable
                  onPress={() => navigation.navigate('SecuritySettings')}
                  className="bg-gray-100 p-3 rounded-lg">
                  <Text className="text-center text-gray-700 font-medium">
                    Security Settings
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('BlockedUsers')}
                  className="bg-gray-100 p-3 rounded-lg">
                  <Text className="text-center text-gray-700 font-medium">
                    Blocked Users
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                  className="bg-gray-100 p-3 rounded-lg">
                  <Text className="text-center text-gray-700 font-medium">
                    Privacy Policy
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
