import React, {useEffect, useState} from 'react';
import {View, ScrollView, Alert, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  BellOff,
  Moon,
  Volume2,
  VolumeX,
  Shield,
  Eye,
  Settings2,
  Clock,
  Users,
  Filter,
  Save,
} from 'lucide-react-native';
import {useActivityNotificationStore} from '../stores/activityNotificationStore';
import {
  NotificationSettings,
  NotificationType,
  NotificationTypeSettings,
  QuietHours, 
} from '../types/activity-notifications';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {cn} from '../lib/utils';

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    notificationSystem,
    isLoading,
    error,
    updateNotificationSettings,
    toggleNotificationType,
    updateQuietHours,
    clearError,
  } = useActivityNotificationStore();

  const [localSettings, setLocalSettings] =
    useState<NotificationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (notificationSystem?.notificationSettings) {
      setLocalSettings({...notificationSystem.notificationSettings});
    }
  }, [notificationSystem?.notificationSettings]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleSaveSettings = async () => {
    if (!localSettings || !hasChanges) {return;}

    setSaving(true);
    try {
      await updateNotificationSettings(localSettings);
      setHasChanges(false);
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalSettings = (updates: Partial<NotificationSettings>) => {
    if (!localSettings) {return;}

    setLocalSettings({...localSettings, ...updates});
    setHasChanges(true);
  };

  const updateTypeSettings = (
    type: NotificationType,
    updates: Partial<NotificationTypeSettings>,
  ) => {
    if (!localSettings) {return;}

    const updatedTypeSettings = localSettings.typeSettings.map(ts =>
      ts.type === type ? {...ts, ...updates} : ts,
    );

    updateLocalSettings({typeSettings: updatedTypeSettings});
  };

  const updateQuietHoursLocal = (updates: Partial<QuietHours>) => {
    if (!localSettings) {return;}

    updateLocalSettings({
      quietHours: {...localSettings.quietHours, ...updates},
    });
  };

  const getNotificationTypeLabel = (type: NotificationType): string => {
    const labels: Record<NotificationType, string> = {
      'new_follower': 'New Followers',
      'post_liked': 'Post Likes',
      'post_commented': 'Post Comments',
      'post_shared': 'Post Shares',
      'mention': 'Mentions',
      'tip_received': 'Tips Received',
      'tip_sent': 'Tips Sent',
      'vote_received': 'Votes Received',
      'verification_complete': 'Verification Complete',
      'moderation_reward': 'Moderation Rewards',
      'platform_update': 'Platform Updates',
      'social_milestone': 'Social Milestones',
      'trending_post': 'Trending Posts',
      'friend_activity': 'Friend Activity'
    };
    return labels[type] || type;
  };

  const getNotificationTypeIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      'new_follower': '👥',
      'post_liked': '❤️',
      'post_commented': '💬',
      'post_shared': '🔄',
      'mention': '📢',
      'tip_received': '💰',
      'tip_sent': '💸',
      'vote_received': '🗳️',
      'verification_complete': '✅',
      'moderation_reward': '🛡️',
      'platform_update': '📱',
      'social_milestone': '🎉',
      'trending_post': '🔥',
      'friend_activity': '👫'
    };
    return icons[type] || '🔔';
  };

  if (isLoading || !localSettings) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-semibold text-gray-900">
                Notification Settings
              </Text>
              <Text className="text-sm text-gray-600">
                Customize how you receive notifications
              </Text>
            </View>
            {hasChanges && (
              <Button
                variant="default"
                size="sm"
                onPress={handleSaveSettings}
                disabled={saving}>
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save size={16} color="white" />
                    <Text className="text-white ml-2">Save</Text>
                  </>
                )}
              </Button>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Global Settings */}
          <View className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Global Settings

            <Card className="p-4 mb-4 bg-white">
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Bell
                      size={20}
                      color={
                        localSettings.globalEnabled ? '#3B82F6' : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        All Notifications
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Enable or disable all notifications
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.globalEnabled}
                    onValueChange={value =>
                      updateLocalSettings({globalEnabled: value})
                    }
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Shield
                      size={20}
                      color={
                        localSettings.pushNotifications ? '#3B82F6' : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Push Notifications
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Receive notifications when app is closed
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.pushNotifications}
                    onValueChange={value =>
                      updateLocalSettings({pushNotifications: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Volume2
                      size={20}
                      color={localSettings.soundEnabled ? '#3B82F6' : '#9CA3AF'}
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">Sound</Text>
                      <Text className="text-sm text-gray-600">
                        Play sound for notifications
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.soundEnabled}
                    onValueChange={value =>
                      updateLocalSettings({soundEnabled: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Settings2
                      size={20}
                      color={
                        localSettings.vibrationEnabled ? '#3B82F6' : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Vibration
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Vibrate for notifications
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.vibrationEnabled}
                    onValueChange={value =>
                      updateLocalSettings({vibrationEnabled: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>
              </View>
            </Card>
          </View>

          {/* Quiet Hours */}
          <View className="px-4 pb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Quiet Hours

            <Card className="p-4 mb-4 bg-white">
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Moon
                      size={20}
                      color={
                        localSettings.quietHours.enabled ? '#3B82F6' : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Enable Quiet Hours
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Reduce notifications during specific hours
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.quietHours.enabled}
                    onValueChange={value =>
                      updateQuietHoursLocal({enabled: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>

                {localSettings.quietHours.enabled && (
                  <>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-3">
                        <Clock size={20} color="#6B7280" />
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">
                            Time Range
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {localSettings.quietHours.startTime} -{' '}
                            {localSettings.quietHours.endTime}
                          </Text>
                        </View>
                      </View>
                      <Button variant="outline" size="sm">
                        <Text className="text-sm">Edit</Text>
                      </Button>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-3">
                        <Shield
                          size={20}
                          color={
                            localSettings.quietHours.allowHighPriority
                              ? '#3B82F6'
                              : '#9CA3AF'
                          }
                        />
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">
                            Allow High Priority
                          </Text>
                          <Text className="text-sm text-gray-600">
                            Still receive urgent notifications
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={localSettings.quietHours.allowHighPriority}
                        onValueChange={value =>
                          updateQuietHoursLocal({allowHighPriority: value})
                        }
                      />
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-3">
                        <Users
                          size={20}
                          color={
                            localSettings.quietHours.allowFollowers
                              ? '#3B82F6'
                              : '#9CA3AF'
                          }
                        />
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">
                            Allow Followers
                          </Text>
                          <Text className="text-sm text-gray-600">
                            Allow notifications from people you follow
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={localSettings.quietHours.allowFollowers}
                        onValueChange={value =>
                          updateQuietHoursLocal({allowFollowers: value})
                        }
                      />
                    </View>
                  </>
                )}
              </View>
            </Card>
          </View>

          {/* Privacy Settings */}
          <View className="px-4 pb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Privacy

            <Card className="p-4 mb-4 bg-white">
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Eye
                      size={20}
                      color={
                        localSettings.showPreviewInLockScreen
                          ? '#3B82F6'
                          : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Lock Screen Preview
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Show notification content on lock screen
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.showPreviewInLockScreen}
                    onValueChange={value =>
                      updateLocalSettings({showPreviewInLockScreen: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Users
                      size={20}
                      color={
                        localSettings.showSenderInPreview
                          ? '#3B82F6'
                          : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Show Sender
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Show who sent the notification
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.showSenderInPreview}
                    onValueChange={value =>
                      updateLocalSettings({showSenderInPreview: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-3">
                    <Filter
                      size={20}
                      color={
                        localSettings.groupSimilarNotifications
                          ? '#3B82F6'
                          : '#9CA3AF'
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Group Similar
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Group similar notifications together
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localSettings.groupSimilarNotifications}
                    onValueChange={value =>
                      updateLocalSettings({groupSimilarNotifications: value})
                    }
                    disabled={!localSettings.globalEnabled}
                  />
                </View>
              </View>
            </Card>
          </View>

          {/* Notification Types */}
          <View className="px-4 pb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Notification Types

            <View className="space-y-3">
              {localSettings.typeSettings.map(typeSettings => (
                <Card key={typeSettings.type} className="p-4 bg-white">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-3 flex-1">
                      <Text className="text-xl">
                        {getNotificationTypeIcon(typeSettings.type)}
                      </Text>
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">
                          {getNotificationTypeLabel(typeSettings.type)}
                        </Text>
                        <View className="flex-row items-center space-x-2 mt-1">
                          <Badge
                            variant={
                              typeSettings.priority === 'high'
                                ? 'default'
                                : 'secondary'
                            }
                            className="py-0.5">
                            <Text
                              className={cn(
                                'text-xs',
                                typeSettings.priority === 'high'
                                  ? 'text-white'
                                  : 'text-gray-700',
                              )}>
                              {typeSettings.priority}
                            </Text>
                          </Badge>
                          {typeSettings.soundEnabled && (
                            <Badge variant="secondary" className="py-0.5">
                              <Volume2 size={10} color="#6B7280" />
                              <Text className="text-xs text-gray-700 ml-1">
                                sound
                              </Text>
                            </Badge>
                          )}
                        </View>
                      </View>
                    </View>
                    <Switch
                      value={typeSettings.enabled}
                      onValueChange={value =>
                        updateTypeSettings(typeSettings.type, {enabled: value})
                      }
                      disabled={!localSettings.globalEnabled}
                    />
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
