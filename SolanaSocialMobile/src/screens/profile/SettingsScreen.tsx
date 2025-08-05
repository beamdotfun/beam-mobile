import React, {useEffect} from 'react';
import {View, Text, ScrollView, Alert, Pressable, Switch, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  User,
  Lock,
  Bell,
  Palette,
  Wallet,
  FileText,
  Code,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Settings as SettingsIcon,
  RefreshCw,
} from 'lucide-react-native';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {SettingsSyncIndicator} from '../../components/ui/SettingsSyncIndicator';
import {useSettingsStore} from '../../store/settingsStore';
import {useThemeStore} from '../../store/themeStore';
import {ProfileStackScreenProps} from '../../types/navigation';

type Props = ProfileStackScreenProps<'Settings'>;

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  onPress: () => void;
}

function SettingsSection({
  title,
  icon,
  description,
  onPress,
}: SettingsSectionProps) {
  const {colors} = useThemeStore();

  return (
    <Pressable onPress={onPress}>
      <Card className="mx-4 mb-3">
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3 flex-1">
              <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                {icon}
              </View>

              <View className="flex-1">
                <Text className="text-foreground font-semibold">{title}</Text>
                {description && (
                  <Text className="text-muted-foreground text-sm mt-1">
                    {description}
                  </Text>
                )}
              </View>
            </View>

            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

export default function SettingsScreen({navigation}: Props) {
  const {colors} = useThemeStore();
  const {
    settings,
    loading,
    loadSettings,
    syncWithServer,
    syncStatus,
    lastError,
    retryFailedUpdates
  } = useSettingsStore();
  const {theme, setTheme} = useThemeStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleRefresh = async () => {
    try {
      await syncWithServer();
    } catch (error) {
      console.error('Failed to sync settings:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await retryFailedUpdates();
    } catch (error) {
      Alert.alert('Retry Failed', 'Unable to sync settings. Please check your connection and try again.');
    }
  };

  const handleThemeToggle = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} color={colors.foreground} />;
      case 'dark':
        return <Moon size={20} color={colors.foreground} />;
      case 'system':
        return <Smartphone size={20} color={colors.foreground} />;
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: <User size={20} color={colors.foreground} />,
      description: 'Email, session settings',
      screen: 'AccountSettings',
    },
    {
      title: 'Privacy & Security',
      icon: <Lock size={20} color={colors.foreground} />,
      description: 'Privacy controls, blocked users',
      screen: 'PrivacySettings',
    },
    {
      title: 'Notifications',
      icon: <Bell size={20} color={colors.foreground} />,
      description: 'Push, email, in-app alerts',
      screen: 'NotificationSettings',
    },
    {
      title: 'Wallet',
      icon: <Wallet size={20} color={colors.foreground} />,
      description: 'RPC, fees, transaction settings',
      screen: 'WalletSettings',
    },
    {
      title: 'Content & Data',
      icon: <FileText size={20} color={colors.foreground} />,
      description: 'Feed preferences, data usage',
      screen: 'ContentSettings',
    },
    {
      title: 'Advanced',
      icon: <Code size={20} color={colors.foreground} />,
      description: 'Developer options, beta features',
      screen: 'AdvancedSettings',
    },
  ];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <AppNavBar
        title="Settings"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Sync Status Header */}
        <Card className="mx-4 mb-4">
          <CardContent className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-3">
                <SettingsIcon size={20} color={colors.primary} />
                <Text className="text-foreground font-semibold">Settings Sync</Text>
              </View>
              <SettingsSyncIndicator onRetryPress={handleRetry} />
            </View>
            {lastError && (
              <Text className="text-destructive text-sm mt-2">
                {lastError.message}
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card className="mx-4 mb-6">
          <CardHeader>
            <CardTitle>
              <Text className="text-lg font-semibold text-foreground">
                Quick Settings
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Theme Toggle */}
            <Pressable
              onPress={handleThemeToggle}
              className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center space-x-3">
                {getThemeIcon()}
                <Text className="text-foreground font-medium">Theme</Text>
              </View>

              <View className="bg-muted px-3 py-1 rounded-full">
                <Text className="text-foreground text-sm capitalize">
                  {theme}
                </Text>
              </View>
            </Pressable>

            {/* Analytics Toggle */}
            <View className="flex-row items-center justify-between py-3 border-t border-border">
              <Text className="text-foreground font-medium">Analytics</Text>
              <Switch
                value={settings?.advanced.analyticsEnabled}
                onValueChange={value => {
                  // Update analytics setting
                }}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
              />
            </View>
          </CardContent>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map(section => (
          <SettingsSection
            key={section.screen}
            title={section.title}
            icon={section.icon}
            description={section.description}
            onPress={() => navigation.navigate(section.screen as any)}
          />
        ))}

        {/* Footer Info */}
        <View className="px-4 py-8">
          <Text className="text-muted-foreground text-center text-sm">
            Beam v1.0.0
          </Text>
          <Text className="text-muted-foreground text-center text-xs mt-1">
            Built for Solana Mobile
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
