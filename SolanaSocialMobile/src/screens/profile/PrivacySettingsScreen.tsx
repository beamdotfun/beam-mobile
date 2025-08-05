import React, {useState} from 'react';
import {View, Text, ScrollView, Alert, Pressable, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Lock,
  Eye,
  MessageCircle,
  AtSign,
  UserX,
  Volume2,
  ChevronRight,
} from 'lucide-react-native';
import {Header} from '../../components/layout/Header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {Button} from '../../components/ui/button';
import {useSettingsStore} from '../../store/settingsStore';
import {useThemeStore} from '../../store/themeStore';
import {ProfileStackScreenProps} from '../../types/navigation';
import {cn} from '../../utils/cn';

type Props = ProfileStackScreenProps<'PrivacySettings'>;

export default function PrivacySettingsScreen({navigation}: Props) {
  const {colors} = useThemeStore();
  const {settings, updateSettings, blockedUsers, mutedUsers} =
    useSettingsStore();
  const [saving, setSaving] = useState(false);

  const privacySettings = settings?.privacy || {
    profileVisibility: 'public',
    showOnlineStatus: true,
    shareTypingIndicators: true,
    showActivity: true,
    allowDirectMessages: 'everyone',
    allowMentions: 'everyone',
    mutedWords: [],
  };

  const handleToggle = async (
    key: keyof typeof privacySettings,
    value: boolean,
  ) => {
    setSaving(true);
    try {
      await updateSettings('privacy', {[key]: value});
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = async (visibility: string) => {
    setSaving(true);
    try {
      await updateSettings('privacy', {profileVisibility: visibility});
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile visibility');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Privacy & Security"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Visibility */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Eye size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Profile Visibility
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {['public', 'followers', 'private'].map(visibility => (
              <Pressable
                key={visibility}
                onPress={() => handleVisibilityChange(visibility)}
                className="flex-row items-center justify-between py-3">
                <View>
                  <Text className="text-foreground font-medium capitalize">
                    {visibility}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {visibility === 'public' && 'Anyone can see your profile'}
                    {visibility === 'followers' &&
                      'Only followers can see your profile'}
                    {visibility === 'private' &&
                      'Only you can see your profile'}
                  </Text>
                </View>

                <View
                  className={cn(
                    'w-5 h-5 rounded-full border-2',
                    privacySettings.profileVisibility === visibility
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground',
                  )}>
                  {privacySettings.profileVisibility === visibility && (
                    <View className="w-2 h-2 bg-white rounded-full m-auto" />
                  )}
                </View>
              </Pressable>
            ))}
          </CardContent>
        </Card>

        {/* Activity Settings */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <Text className="text-lg font-semibold text-foreground">
                Activity
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Show Activity Status
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Let others see when you're online
                </Text>
              </View>
              <Switch
                value={privacySettings.showOnlineStatus}
                onValueChange={value => handleToggle('showOnlineStatus', value)}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-t border-border">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Share Typing Indicators
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Show when you're typing in chats
                </Text>
              </View>
              <Switch
                value={privacySettings.shareTypingIndicators}
                onValueChange={value =>
                  handleToggle('shareTypingIndicators', value)
                }
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-t border-border">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Show Activity
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Display your activity in your profile
                </Text>
              </View>
              <Switch
                value={privacySettings.showActivity}
                onValueChange={value => handleToggle('showActivity', value)}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>
          </CardContent>
        </Card>

        {/* Communication Settings */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <MessageCircle size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Communication
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Direct Messages */}
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">
                Direct Messages
              </Text>
              {['everyone', 'followers', 'none'].map(option => (
                <Pressable
                  key={option}
                  onPress={() =>
                    updateSettings('privacy', {allowDirectMessages: option})
                  }
                  className="flex-row items-center justify-between py-2">
                  <Text className="text-foreground capitalize">{option}</Text>
                  <View
                    className={cn(
                      'w-5 h-5 rounded-full border-2',
                      privacySettings.allowDirectMessages === option
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground',
                    )}>
                    {privacySettings.allowDirectMessages === option && (
                      <View className="w-2 h-2 bg-white rounded-full m-auto" />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Mentions */}
            <View className="pt-4 border-t border-border">
              <Text className="text-foreground font-medium mb-2">Mentions</Text>
              {['everyone', 'followers', 'none'].map(option => (
                <Pressable
                  key={option}
                  onPress={() =>
                    updateSettings('privacy', {allowMentions: option})
                  }
                  className="flex-row items-center justify-between py-2">
                  <Text className="text-foreground capitalize">{option}</Text>
                  <View
                    className={cn(
                      'w-5 h-5 rounded-full border-2',
                      privacySettings.allowMentions === option
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground',
                    )}>
                    {privacySettings.allowMentions === option && (
                      <View className="w-2 h-2 bg-white rounded-full m-auto" />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Blocked & Muted Users */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <UserX size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Blocked & Muted
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Pressable
              onPress={() => navigation.navigate('BlockedUsers' as any)}
              className="flex-row items-center justify-between py-3">
              <Text className="text-foreground">Blocked Users</Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2">
                  {blockedUsers.size}
                </Text>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('MutedUsers' as any)}
              className="flex-row items-center justify-between py-3 border-t border-border">
              <Text className="text-foreground">Muted Users</Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2">
                  {mutedUsers.size}
                </Text>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('MutedWords' as any)}
              className="flex-row items-center justify-between py-3 border-t border-border">
              <Text className="text-foreground">Muted Words</Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2">
                  {privacySettings.mutedWords?.length || 0}
                </Text>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
            </Pressable>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="mx-4 mb-8">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Lock size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Security
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Two-Factor Authentication
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {settings?.account.twoFactorEnabled
                    ? 'Enabled - Extra security for your account'
                    : 'Add an extra layer of security'}
                </Text>
              </View>
              <Button
                variant={
                  settings?.account.twoFactorEnabled ? 'outline' : 'default'
                }
                size="sm"
                onPress={() => navigation.navigate('TwoFactorAuth' as any)}>
                {settings?.account.twoFactorEnabled ? 'Manage' : 'Enable'}
              </Button>
            </View>

            <Pressable
              onPress={() => navigation.navigate('SecurityLogs' as any)}
              className="flex-row items-center justify-between py-3 border-t border-border">
              <Text className="text-foreground">Security Activity</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
