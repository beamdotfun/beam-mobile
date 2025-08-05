import React, {useState} from 'react';
import {View, Text, ScrollView, Alert, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Bell,
  Smartphone,
  Mail,
  Volume2,
  Vibrate,
  Users,
  AtSign,
  MessageCircle,
  Heart,
  DollarSign,
  TrendingUp,
  Gavel,
  AlertCircle,
} from 'lucide-react-native';
import {Header} from '../../components/layout/Header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {useSettingsStore} from '../../store/settingsStore';
import {useThemeStore} from '../../store/themeStore';
import {ProfileStackScreenProps} from '../../types/navigation';

type Props = ProfileStackScreenProps<'NotificationSettings'>;

export default function NotificationSettingsScreen({navigation}: Props) {
  const {colors} = useThemeStore();
  const {settings, updateSettings} = useSettingsStore();
  const [saving, setSaving] = useState(false);

  const notificationSettings = settings?.notifications || {
    push: {
      enabled: true,
      newFollowers: true,
      mentions: true,
      comments: true,
      votes: true,
      tips: true,
      brandUpdates: false,
      auctionUpdates: true,
      systemAlerts: true,
    },
    email: {
      enabled: false,
      dailyDigest: false,
      weeklyReport: false,
      promotionalEmails: false,
    },
    inApp: {
      showBadges: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  };

  const handlePushToggle = async (
    key: keyof typeof notificationSettings.push,
    value: boolean,
  ) => {
    setSaving(true);
    try {
      await updateSettings('notifications', {
        push: {
          ...notificationSettings.push,
          [key]: value,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToggle = async (
    key: keyof typeof notificationSettings.email,
    value: boolean,
  ) => {
    setSaving(true);
    try {
      await updateSettings('notifications', {
        email: {
          ...notificationSettings.email,
          [key]: value,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInAppToggle = async (
    key: keyof typeof notificationSettings.inApp,
    value: boolean,
  ) => {
    setSaving(true);
    try {
      await updateSettings('notifications', {
        inApp: {
          ...notificationSettings.inApp,
          [key]: value,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update in-app settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Notifications"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Smartphone size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Push Notifications
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Master Toggle */}
            <View className="flex-row items-center justify-between py-3 mb-4 border-b border-border">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Enable Push Notifications
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Allow notifications to be sent to your device
                </Text>
              </View>
              <Switch
                value={notificationSettings.push?.enabled}
                onValueChange={value => handlePushToggle('enabled', value)}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>

            {/* Individual Push Settings */}
            {notificationSettings.push?.enabled && (
              <>
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <Users size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">New Followers</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.newFollowers}
                    onValueChange={value =>
                      handlePushToggle('newFollowers', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <AtSign size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">Mentions</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.mentions}
                    onValueChange={value => handlePushToggle('mentions', value)}
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <MessageCircle size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">Comments</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.comments}
                    onValueChange={value => handlePushToggle('comments', value)}
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <Heart size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">Votes</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.votes}
                    onValueChange={value => handlePushToggle('votes', value)}
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <DollarSign size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">Tips</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.tips}
                    onValueChange={value => handlePushToggle('tips', value)}
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <TrendingUp size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">Brand Updates</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.brandUpdates}
                    onValueChange={value =>
                      handlePushToggle('brandUpdates', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <Gavel size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">
                      Auction Updates
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.auctionUpdates}
                    onValueChange={value =>
                      handlePushToggle('auctionUpdates', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center flex-1">
                    <AlertCircle size={16} color={colors.mutedForeground} />
                    <Text className="text-foreground ml-3">System Alerts</Text>
                  </View>
                  <Switch
                    value={notificationSettings.push?.systemAlerts}
                    onValueChange={value =>
                      handlePushToggle('systemAlerts', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Mail size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Email Notifications
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Enable Email Notifications
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Receive notifications via email
                </Text>
              </View>
              <Switch
                value={notificationSettings.email?.enabled}
                onValueChange={value => handleEmailToggle('enabled', value)}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>

            {notificationSettings.email?.enabled && (
              <>
                <View className="flex-row items-center justify-between py-3 border-t border-border">
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">
                      Daily Digest
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      Summary of daily activity
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.email?.dailyDigest}
                    onValueChange={value =>
                      handleEmailToggle('dailyDigest', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3 border-t border-border">
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">
                      Weekly Report
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      Weekly platform insights
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.email?.weeklyReport}
                    onValueChange={value =>
                      handleEmailToggle('weeklyReport', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>

                <View className="flex-row items-center justify-between py-3 border-t border-border">
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">
                      Promotional Emails
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      Updates about new features
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.email?.promotionalEmails}
                    onValueChange={value =>
                      handleEmailToggle('promotionalEmails', value)
                    }
                    trackColor={{true: colors.primary, false: colors.muted}}
                    thumbColor={colors.foreground}
                    disabled={saving}
                  />
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* In-App Settings */}
        <Card className="mx-4 mb-8">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Bell size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  In-App Settings
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <Bell size={16} color={colors.mutedForeground} />
                <View className="ml-3 flex-1">
                  <Text className="text-foreground font-medium">
                    Show Badges
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Display notification badges on tabs
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.inApp?.showBadges}
                onValueChange={value => handleInAppToggle('showBadges', value)}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-t border-border">
              <View className="flex-row items-center flex-1">
                <Volume2 size={16} color={colors.mutedForeground} />
                <View className="ml-3 flex-1">
                  <Text className="text-foreground font-medium">
                    Sound Enabled
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Play sounds for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.inApp?.soundEnabled}
                onValueChange={value =>
                  handleInAppToggle('soundEnabled', value)
                }
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-t border-border">
              <View className="flex-row items-center flex-1">
                <Vibrate size={16} color={colors.mutedForeground} />
                <View className="ml-3 flex-1">
                  <Text className="text-foreground font-medium">
                    Vibration Enabled
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Vibrate for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.inApp?.vibrationEnabled}
                onValueChange={value =>
                  handleInAppToggle('vibrationEnabled', value)
                }
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
