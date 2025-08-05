import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Clock,
  Filter,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {useNotificationStore} from '../../store/notificationStore';
import {useThemeStore} from '../../store/themeStore';
import {
  NotificationPreferences,
  NotificationCategory,
  NotificationType,
  NotificationPriority,
  NotificationDeliveryMethod,
} from '@/types/notifications';
import {cn} from '../../utils/cn';

interface NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_INFO: Record<
  NotificationCategory,
  {
    label: string;
    description: string;
    icon: React.ComponentType<any>;
  }
> = {
  social: {
    label: 'Social',
    description: 'Likes, comments, follows, and social interactions',
    icon: Bell,
  },
  financial: {
    label: 'Financial',
    description: 'Tips, payments, and financial transactions',
    icon: Bell,
  },
  system: {
    label: 'System',
    description: 'App updates, announcements, and system messages',
    icon: Settings,
  },
  moderation: {
    label: 'Moderation',
    description: 'Content reports, warnings, and moderation actions',
    icon: Bell,
  },
};

const TYPE_INFO: Record<
  NotificationType,
  {
    label: string;
    description: string;
    category: NotificationCategory;
  }
> = {
  post_like: {
    label: 'Post Likes',
    description: 'When someone likes your post',
    category: 'social',
  },
  post_comment: {
    label: 'Post Comments',
    description: 'When someone comments on your post',
    category: 'social',
  },
  post_share: {
    label: 'Post Shares',
    description: 'When someone shares your post',
    category: 'social',
  },
  comment_reply: {
    label: 'Comment Replies',
    description: 'When someone replies to your comment',
    category: 'social',
  },
  comment_like: {
    label: 'Comment Likes',
    description: 'When someone likes your comment',
    category: 'social',
  },
  user_follow: {
    label: 'New Followers',
    description: 'When someone follows you',
    category: 'social',
  },
  user_mention: {
    label: 'Mentions',
    description: 'When someone mentions you',
    category: 'social',
  },
  user_tip: {
    label: 'Tips Received',
    description: 'When you receive a tip',
    category: 'financial',
  },
  user_vote: {
    label: 'Votes',
    description: 'When someone votes on your content',
    category: 'social',
  },
  brand_follow: {
    label: 'Brand Follows',
    description: 'When someone follows your brand',
    category: 'social',
  },
  brand_post: {
    label: 'Brand Posts',
    description: 'New posts from brands you follow',
    category: 'social',
  },
  auction_bid: {
    label: 'Auction Bids',
    description: 'When someone bids on your auction',
    category: 'financial',
  },
  auction_won: {
    label: 'Auction Won',
    description: 'When you win an auction',
    category: 'financial',
  },
  auction_outbid: {
    label: 'Outbid',
    description: 'When you are outbid in an auction',
    category: 'financial',
  },
  auction_ended: {
    label: 'Auction Ended',
    description: "When an auction you're watching ends",
    category: 'financial',
  },
  system_announcement: {
    label: 'Announcements',
    description: 'Important system announcements',
    category: 'system',
  },
  system_update: {
    label: 'Updates',
    description: 'App and feature updates',
    category: 'system',
  },
  moderation_warning: {
    label: 'Warnings',
    description: 'Content moderation warnings',
    category: 'moderation',
  },
  moderation_action: {
    label: 'Actions',
    description: 'Moderation actions taken on your content',
    category: 'moderation',
  },
};

const DELIVERY_METHODS: Record<
  NotificationDeliveryMethod,
  {
    label: string;
    description: string;
    icon: React.ComponentType<any>;
  }
> = {
  push: {
    label: 'Push Notifications',
    description: 'Notifications that appear on your device',
    icon: Smartphone,
  },
  in_app: {
    label: 'In-App',
    description: 'Notifications within the app',
    icon: Bell,
  },
  email: {
    label: 'Email',
    description: 'Email notifications',
    icon: Mail,
  },
  sms: {
    label: 'SMS',
    description: 'Text message notifications',
    icon: MessageSquare,
  },
};

export function NotificationSettings({
  visible,
  onClose,
}: NotificationSettingsProps) {
  const {colors} = useThemeStore();
  const {preferences, updatePreferences, resetPreferences, testNotification} =
    useNotificationStore();

  const [activeTab, setActiveTab] = useState<
    'general' | 'categories' | 'types' | 'delivery'
  >('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUpdatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      try {
        await updatePreferences(updates);
      } catch (error) {
        Alert.alert('Error', 'Failed to update notification preferences');
      }
    },
    [updatePreferences],
  );

  const handleResetPreferences = useCallback(async () => {
    try {
      await resetPreferences();
      setShowResetConfirm(false);
      Alert.alert(
        'Success',
        'Notification preferences have been reset to defaults',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset notification preferences');
    }
  }, [resetPreferences]);

  const handleTestNotification = useCallback(
    async (type: 'push' | 'in_app' | 'email') => {
      try {
        await testNotification(type);
        Alert.alert('Test Sent', `Test ${type} notification has been sent`);
      } catch (error) {
        Alert.alert('Error', `Failed to send test ${type} notification`);
      }
    },
    [testNotification],
  );

  const renderGeneralSettings = () => (
    <ScrollView className="flex-1 p-4">
      {/* Master Toggle */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">
                Enable Notifications
              </Text>
              <Text className="text-sm text-muted-foreground">
                Master toggle for all notifications
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={enabled => handleUpdatePreferences({enabled})}
              trackColor={{false: colors.muted, true: colors.primary}}
              thumbColor={colors.background}
            />
          </View>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">
                Do Not Disturb
              </Text>
              <Text className="text-sm text-muted-foreground">
                Automatically silence notifications during specific hours
              </Text>
            </View>
            <Switch
              value={preferences.doNotDisturb.enabled}
              onValueChange={enabled =>
                handleUpdatePreferences({
                  doNotDisturb: {...preferences.doNotDisturb, enabled},
                })
              }
              trackColor={{false: colors.muted, true: colors.primary}}
              thumbColor={colors.background}
            />
          </View>

          {preferences.doNotDisturb.enabled && (
            <View className="pt-3 border-t border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-muted-foreground">From</Text>
                <Text className="text-sm text-foreground">
                  {preferences.doNotDisturb.startTime}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">To</Text>
                <Text className="text-sm text-foreground">
                  {preferences.doNotDisturb.endTime}
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Push Notification Settings */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-base font-medium text-foreground mb-3">
            Push Notifications
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Enabled</Text>
              <Switch
                value={preferences.push.enabled}
                onValueChange={enabled =>
                  handleUpdatePreferences({
                    push: {...preferences.push, enabled},
                  })
                }
                trackColor={{false: colors.muted, true: colors.primary}}
                thumbColor={colors.background}
              />
            </View>

            {preferences.push.enabled && (
              <>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Sound</Text>
                  <Switch
                    value={preferences.push.sound}
                    onValueChange={sound =>
                      handleUpdatePreferences({
                        push: {...preferences.push, sound},
                      })
                    }
                    trackColor={{false: colors.muted, true: colors.primary}}
                    thumbColor={colors.background}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Vibration
                  </Text>
                  <Switch
                    value={preferences.push.vibration}
                    onValueChange={vibration =>
                      handleUpdatePreferences({
                        push: {...preferences.push, vibration},
                      })
                    }
                    trackColor={{false: colors.muted, true: colors.primary}}
                    thumbColor={colors.background}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Badge Count
                  </Text>
                  <Switch
                    value={preferences.push.badge}
                    onValueChange={badge =>
                      handleUpdatePreferences({
                        push: {...preferences.push, badge},
                      })
                    }
                    trackColor={{false: colors.muted, true: colors.primary}}
                    thumbColor={colors.background}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Lock Screen
                  </Text>
                  <Switch
                    value={preferences.push.lockScreen}
                    onValueChange={lockScreen =>
                      handleUpdatePreferences({
                        push: {...preferences.push, lockScreen},
                      })
                    }
                    trackColor={{false: colors.muted, true: colors.primary}}
                    thumbColor={colors.background}
                  />
                </View>
              </>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-base font-medium text-foreground mb-3">
            Test Notifications
          </Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Send test notifications to verify your settings
          </Text>

          <View className="space-y-2">
            <Button
              variant="outline"
              onPress={() => handleTestNotification('push')}
              className="w-full">
              <Text>Test Push Notification</Text>
            </Button>

            <Button
              variant="outline"
              onPress={() => handleTestNotification('in_app')}
              className="w-full">
              <Text>Test In-App Notification</Text>
            </Button>

            <Button
              variant="outline"
              onPress={() => handleTestNotification('email')}
              className="w-full">
              <Text>Test Email Notification</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-base font-medium text-foreground mb-2">
            Reset Settings
          </Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Reset all notification preferences to default values
          </Text>

          <Button
            variant="destructive"
            onPress={() => setShowResetConfirm(true)}
            className="w-full">
            <Text className="text-white">Reset to Defaults</Text>
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );

  const renderCategorySettings = () => (
    <ScrollView className="flex-1 p-4">
      {Object.entries(CATEGORY_INFO).map(([category, info]) => {
        const categoryPrefs =
          preferences.categories[category as NotificationCategory];
        const IconComponent = info.icon;

        return (
          <Card key={category} className="mb-4">
            <CardContent className="p-4">
              <View className="flex-row items-center mb-3">
                <IconComponent size={20} color={colors.primary} />
                <Text className="text-base font-medium text-foreground ml-2">
                  {info.label}
                </Text>
              </View>

              <Text className="text-sm text-muted-foreground mb-3">
                {info.description}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Enabled</Text>
                  <Switch
                    value={categoryPrefs.enabled}
                    onValueChange={enabled =>
                      handleUpdatePreferences({
                        categories: {
                          ...preferences.categories,
                          [category]: {...categoryPrefs, enabled},
                        },
                      })
                    }
                    trackColor={{false: colors.muted, true: colors.primary}}
                    thumbColor={colors.background}
                  />
                </View>

                {categoryPrefs.enabled && (
                  <>
                    <View>
                      <Text className="text-sm text-muted-foreground mb-2">
                        Delivery Methods
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {Object.entries(DELIVERY_METHODS).map(
                          ([method, methodInfo]) => {
                            const isSelected =
                              categoryPrefs.deliveryMethods.includes(
                                method as NotificationDeliveryMethod,
                              );
                            return (
                              <Pressable
                                key={method}
                                onPress={() => {
                                  const methods = isSelected
                                    ? categoryPrefs.deliveryMethods.filter(
                                        m => m !== method,
                                      )
                                    : [
                                        ...categoryPrefs.deliveryMethods,
                                        method as NotificationDeliveryMethod,


                                  handleUpdatePreferences({
                                    categories: {
                                      ...preferences.categories,
                                      [category]: {
                                        ...categoryPrefs,
                                        deliveryMethods: methods,
                                      },
                                    },
                                  });
                                }}
                                className={cn(
                                  'px-3 py-2 rounded-lg border',
                                  isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-card',
                                )}>
                                <Text
                                  className={cn(
                                    'text-xs',
                                    isSelected
                                      ? 'text-primary'
                                      : 'text-foreground',
                                  )}>
                                  {methodInfo.label}
                                </Text>
                              </Pressable>
                            );
                          },
                        )}
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-2">
                        Priority
                      </Text>
                      <View className="flex-row space-x-2">
                        {(
                          [
                            'low',
                            'normal',
                            'high',
                            'urgent',
                          ] as NotificationPriority[]
                        ).map(priority => (
                          <Pressable
                            key={priority}
                            onPress={() =>
                              handleUpdatePreferences({
                                categories: {
                                  ...preferences.categories,
                                  [category]: {...categoryPrefs, priority},
                                },
                              })
                            }
                            className={cn(
                              'px-3 py-2 rounded-lg border',
                              categoryPrefs.priority === priority
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-card',
                            )}>
                            <Text
                              className={cn(
                                'text-xs capitalize',
                                categoryPrefs.priority === priority
                                  ? 'text-primary'
                                  : 'text-foreground',
                              )}>
                              {priority}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </View>
            </CardContent>
          </Card>
        );
      })}
    </ScrollView>
  );

  const renderTypeSettings = () => (
    <ScrollView className="flex-1 p-4">
      {Object.entries(TYPE_INFO).map(([type, info]) => {
        const typePrefs = preferences.types[type as NotificationType];

        return (
          <Card key={type} className="mb-4">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-medium text-foreground">
                  {info.label}
                </Text>
                <Badge variant="outline">
                  <Text className="text-xs capitalize">{info.category}</Text>
                </Badge>
              </View>

              <Text className="text-sm text-muted-foreground mb-3">
                {info.description}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Enabled</Text>
                  <Switch
                    value={typePrefs.enabled}
                    onValueChange={enabled =>
                      handleUpdatePreferences({
                        types: {
                          ...preferences.types,
                          [type]: {...typePrefs, enabled},
                        },
                      })
                    }
                    trackColor={{false: colors.muted, true: colors.primary}}
                    thumbColor={colors.background}
                  />
                </View>

                {typePrefs.enabled && (
                  <>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">
                        Grouping
                      </Text>
                      <Switch
                        value={typePrefs.grouping}
                        onValueChange={grouping =>
                          handleUpdatePreferences({
                            types: {
                              ...preferences.types,
                              [type]: {...typePrefs, grouping},
                            },
                          })
                        }
                        trackColor={{false: colors.muted, true: colors.primary}}
                        thumbColor={colors.background}
                      />
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-2">
                        Frequency
                      </Text>
                      <View className="flex-row space-x-2">
                        {['instant', 'batched'].map(frequency => (
                          <Pressable
                            key={frequency}
                            onPress={() =>
                              handleUpdatePreferences({
                                types: {
                                  ...preferences.types,
                                  [type]: {
                                    ...typePrefs,
                                    frequency: frequency as
                                      | 'instant'
                                      | 'batched',
                                  },
                                },
                              })
                            }
                            className={cn(
                              'px-3 py-2 rounded-lg border',
                              typePrefs.frequency === frequency
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-card',
                            )}>
                            <Text
                              className={cn(
                                'text-xs capitalize',
                                typePrefs.frequency === frequency
                                  ? 'text-primary'
                                  : 'text-foreground',
                              )}>
                              {frequency}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </View>
            </CardContent>
          </Card>
        );
      })}
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'categories':
        return renderCategorySettings();
      case 'types':
        return renderTypeSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView
        className="flex-1"
        style={{backgroundColor: colors.background}}>
        {/* Header */}
        <View className="border-b border-border px-4 py-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-foreground">
              Notification Settings
            </Text>

            <Pressable onPress={onClose} className="p-2">
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="border-b border-border">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4">
            <View className="flex-row space-x-1 py-3">
              {[
                {key: 'general', label: 'General'},
                {key: 'categories', label: 'Categories'},
                {key: 'types', label: 'Types'},
              ].map(tab => (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    activeTab === tab.key ? 'bg-primary' : 'bg-muted'
                  )}>
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      activeTab === tab.key
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground',
                    )}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        {renderContent()}

        {/* Reset Confirmation Modal */}
        <Modal
          visible={showResetConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetConfirm(false)}>
          <View
            className="flex-1 justify-center items-center"
            style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <Card className="mx-8">
              <CardContent className="p-6">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  Reset Notification Settings
                </Text>
                <Text className="text-sm text-muted-foreground mb-4">
                  Are you sure you want to reset all notification preferences to
                  their default values? This action cannot be undone.
                </Text>

                <View className="flex-row space-x-3">
                  <Button
                    variant="outline"
                    onPress={() => setShowResetConfirm(false)}
                    className="flex-1">
                    <Text>Cancel</Text>
                  </Button>

                  <Button
                    variant="destructive"
                    onPress={handleResetPreferences}
                    className="flex-1">
                    <Text className="text-white">Reset</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
