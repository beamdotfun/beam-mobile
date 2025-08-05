import React, {useState} from 'react';
import {View, Text, ScrollView, Pressable, Alert, Switch} from 'react-native';
import {
  Palette,
  Layout,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import {useEnhancedProfileStore} from '../../store/profile-enhanced';
import {useThemeStore} from '../../store/themeStore';
import {ProfileCustomization as ProfileCustomizationType} from '../../types/profile-enhanced';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {cn} from '../../utils/cn';

export function ProfileCustomization() {
  const {colors} = useThemeStore();
  const {customization, updateCustomization, resetCustomization} =
    useEnhancedProfileStore();

  const [localCustomization, setLocalCustomization] = useState(customization);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCustomization(localCustomization);
      Alert.alert('Success', 'Profile customization saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save customization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Customization',
      'Are you sure you want to reset all customizations to default?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetCustomization();
              setLocalCustomization(customization);
              Alert.alert('Success', 'Customization reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset customization');
            }
          },
        },
      ],
    );
  };

  const updateTheme = (updates: Partial<ProfileCustomizationType['theme']>) => {
    setLocalCustomization({
      ...localCustomization,
      theme: {...localCustomization.theme, ...updates},
    });
  };

  const updateLayout = (
    updates: Partial<ProfileCustomizationType['layout']>,
  ) => {
    setLocalCustomization({
      ...localCustomization,
      layout: {...localCustomization.layout, ...updates},
    });
  };

  const updateSections = (
    section: keyof ProfileCustomizationType['sections'],
  ) => {
    setLocalCustomization({
      ...localCustomization,
      sections: {
        ...localCustomization.sections,
        [section]: !localCustomization.sections[section],
      },
    });
  };

  const themeColors = [
    {name: 'Default', value: undefined},
    {name: 'Blue', value: '#3B82F6'},
    {name: 'Green', value: '#10B981'},
    {name: 'Purple', value: '#8B5CF6'},
    {name: 'Red', value: '#EF4444'},
    {name: 'Orange', value: '#F59E0B'},
  ];

  const backgroundTypes = [
    {label: 'Solid Color', value: 'color'},
    {label: 'Gradient', value: 'gradient'},
    {label: 'Image', value: 'image'},
  ];

  const cardStyles = [
    {label: 'Default', value: 'default'},
    {label: 'Glass', value: 'glass'},
    {label: 'Minimal', value: 'minimal'},
  ];

  const profileStyles = [
    {label: 'Standard', value: 'standard'},
    {label: 'Compact', value: 'compact'},
    {label: 'Expanded', value: 'expanded'},
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">
            Customize Profile
          </Text>
          <Pressable onPress={handleReset} className="p-2">
            <RotateCcw size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Theme Customization */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <View className="flex-row items-center mb-4">
              <Palette size={20} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                Theme
              </Text>
            </View>

            {/* Primary Color */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Primary Color
              </Text>
              <View className="flex-row flex-wrap">
                {themeColors.map(color => (
                  <Pressable
                    key={color.name}
                    onPress={() => updateTheme({primaryColor: color.value})}
                    className="mr-3 mb-3">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: color.value || colors.primary,
                        borderWidth: 2,
                        borderColor:
                          localCustomization.theme.primaryColor === color.value
                            ? colors.foreground
                            : 'transparent',
                      }}>
                      {localCustomization.theme.primaryColor ===
                        color.value && <Check size={20} color="white" />}
                    </View>
                    <Text className="text-xs text-center mt-1">
                      {color.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Background Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Background Type
              </Text>
              <View className="flex-row space-x-2">
                {backgroundTypes.map(type => (
                  <Pressable
                    key={type.value}
                    onPress={() =>
                      updateTheme({backgroundType: type.value as any})
                    }
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border',
                      localCustomization.theme.backgroundType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border',
                    )}>
                    <Text
                      className={cn(
                        'text-sm text-center',
                        localCustomization.theme.backgroundType === type.value
                          ? 'text-primary font-medium'
                          : 'text-foreground',
                      )}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Card Style */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Card Style
              </Text>
              <View className="flex-row space-x-2">
                {cardStyles.map(style => (
                  <Pressable
                    key={style.value}
                    onPress={() => updateTheme({cardStyle: style.value as any})}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border',
                      localCustomization.theme.cardStyle === style.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border',
                    )}>
                    <Text
                      className={cn(
                        'text-sm text-center',
                        localCustomization.theme.cardStyle === style.value
                          ? 'text-primary font-medium'
                          : 'text-foreground',
                      )}>
                      {style.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Layout Customization */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <View className="flex-row items-center mb-4">
              <Layout size={20} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                Layout
              </Text>
            </View>

            {/* Profile Style */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Profile Style
              </Text>
              <View className="flex-row space-x-2">
                {profileStyles.map(style => (
                  <Pressable
                    key={style.value}
                    onPress={() =>
                      updateLayout({profileStyle: style.value as any})
                    }
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border',
                      localCustomization.layout.profileStyle === style.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border',
                    )}>
                    <Text
                      className={cn(
                        'text-sm text-center',
                        localCustomization.layout.profileStyle === style.value
                          ? 'text-primary font-medium'
                          : 'text-foreground',
                      )}>
                      {style.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Toggle Options */}
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Show Stats</Text>
                <Switch
                  value={localCustomization.layout.showStats}
                  onValueChange={value => updateLayout({showStats: value})}
                  trackColor={{false: colors.muted, true: colors.primary}}
                  thumbColor={colors.background}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">
                  Show Achievements
                </Text>
                <Switch
                  value={localCustomization.layout.showAchievements}
                  onValueChange={value =>
                    updateLayout({showAchievements: value})
                  }
                  trackColor={{false: colors.muted, true: colors.primary}}
                  thumbColor={colors.background}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Show Activity</Text>
                <Switch
                  value={localCustomization.layout.showActivity}
                  onValueChange={value => updateLayout({showActivity: value})}
                  trackColor={{false: colors.muted, true: colors.primary}}
                  thumbColor={colors.background}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <View className="flex-row items-center mb-4">
              <Eye size={20} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                Content Sections
              </Text>
            </View>

            <View className="space-y-3">
              {Object.entries(localCustomization.sections).map(
                ([key, value]) => (
                  <View
                    key={key}
                    className="flex-row items-center justify-between">
                    <Text className="text-sm text-foreground capitalize">
                      {key}
                    </Text>
                    <Switch
                      value={value}
                      onValueChange={() => updateSections(key as any)}
                      trackColor={{false: colors.muted, true: colors.primary}}
                      thumbColor={colors.background}
                    />
                  </View>
                ),
              )}
            </View>
          </CardContent>
        </Card>

        {/* Actions */}
        <View className="flex-row space-x-3 mb-6">
          <Button variant="outline" onPress={handleReset} className="flex-1">
            <Text className="text-foreground">Reset to Default</Text>
          </Button>

          <Button onPress={handleSave} disabled={isSaving} className="flex-1">
            <Text className="text-primary-foreground">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
