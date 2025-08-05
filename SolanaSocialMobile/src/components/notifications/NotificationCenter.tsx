import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Bell,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  SlidersHorizontal, 
} from 'lucide-react-native';
import {NotificationItem} from './NotificationItem';
import {Button} from '../ui/button';
import {Card, CardContent} from '../ui/card';
import {Badge} from '../ui/badge';
import {useNotificationStore} from '../../store/notificationStore';
import {useThemeStore} from '../../store/themeStore';
import {
  NotificationFilter,
  NotificationCategory,
  NotificationType,
} from '../../types/notifications';
import {cn} from '../../utils/cn';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  onSettingsPress?: () => void;
  onNotificationPress?: (notificationId: string) => void;
}

const FILTER_CATEGORIES: {
  label: string;
  value: NotificationCategory;
  icon: React.ComponentType<any>;
}[] = [
  {label: 'All', value: 'social' as NotificationCategory, icon: Bell},
  {label: 'Social', value: 'social', icon: Bell},
  {label: 'Financial', value: 'financial', icon: Bell},
  {label: 'System', value: 'system', icon: Bell},
  {label: 'Moderation', value: 'moderation', icon: Bell},
];

const FILTER_TYPES: {
  label: string;
  value: NotificationType;
}[] = [
  {label: 'Likes', value: 'post_like'},
  {label: 'Comments', value: 'post_comment'},
  {label: 'Follows', value: 'user_follow'},
  {label: 'Mentions', value: 'user_mention'},
  {label: 'Tips', value: 'user_tip'},
  {label: 'Votes', value: 'user_vote'},
  {label: 'Auctions', value: 'auction_bid'},
];

export function NotificationCenter({
  visible,
  onClose,
  onSettingsPress,
  onNotificationPress,
}: NotificationCenterProps) {
  const {colors} = useThemeStore();
  const {
    filteredNotifications,
    unreadCount,
    loading,
    refreshing,
    activeFilter,
    setFilter,
    clearFilter,
    markAllAsRead,
    clearAll,
    deleteMultiple,
    initialize,
  } = useNotificationStore();

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    [],
  );
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [tempFilter, setTempFilter] =
    useState<NotificationFilter>(activeFilter);

  useEffect(() => {
    if (visible) {
      initialize();
    }
  }, [visible]);

  const handleRefresh = useCallback(() => {
    initialize();
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAll();
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ],
    );
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedNotifications.length === 0) {return;}

    Alert.alert(
      'Delete Notifications',
      `Are you sure you want to delete ${selectedNotifications.length} notifications?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMultiple(selectedNotifications);
              setSelectedNotifications([]);
              setSelectionMode(false);
              Alert.alert('Success', 'Notifications deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notifications');
            }
          },
        },
      ],
    );
  }, [selectedNotifications]);

  const handleNotificationSelect = useCallback(
    (notificationId: string) => {
      if (!selectionMode) {return;}

      setSelectedNotifications(prev => {
        if (prev.includes(notificationId)) {
          return prev.filter(id => id !== notificationId);
        } else {
          return [...prev, notificationId];
        }
      });
    },
    [selectionMode],
  );

  const handleNotificationPress = useCallback(
    (notificationId: string) => {
      if (selectionMode) {
        handleNotificationSelect(notificationId);
      } else {
        onNotificationPress?.(notificationId);
      }
    },
    [selectionMode, onNotificationPress, handleNotificationSelect],
  );

  const handleApplyFilter = useCallback(() => {
    setFilter(tempFilter);
    setShowFilterModal(false);
  }, [tempFilter, setFilter]);

  const handleClearFilter = useCallback(() => {
    const emptyFilter = {};
    setTempFilter(emptyFilter);
    clearFilter();
    setShowFilterModal(false);
  }, [clearFilter]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(!selectionMode);
    setSelectedNotifications([]);
  }, [selectionMode]);

  const selectAll = useCallback(() => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  }, [selectedNotifications, filteredNotifications]);

  const hasActiveFilter = Object.keys(activeFilter).length > 0;

  const renderNotification = useCallback(
    ({item, index}: {item: any; index: number}) => (
      <NotificationItem
        notification={item}
        onPress={() => handleNotificationPress(item.id)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedNotifications([item.id]);
          }
        }}
        selected={selectedNotifications.includes(item.id)}
        selectionMode={selectionMode}
        showDivider={index < filteredNotifications.length - 1}
      />
    ),
    [
      handleNotificationPress,
      selectedNotifications,
      selectionMode,
      filteredNotifications.length,
    ],
  );

  const renderHeader = useCallback(
    () => (
      <View className="p-4 border-b border-border">
        {/* Title Row */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Bell size={24} color={colors.foreground} />
            <Text className="text-xl font-bold text-foreground ml-2">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <Text className="text-xs text-white">{unreadCount}</Text>
              </Badge>
            )}
          </View>

        <Pressable onPress={onClose} className="p-2">
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Action Bar */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() => setShowFilterModal(true)}
              className={cn(
                'flex-row items-center space-x-1 px-3 py-2 rounded-lg',
                hasActiveFilter ? 'bg-primary/10' : 'bg-muted',
              )}>
              <Filter
                size={16}
                color={
                  hasActiveFilter ? colors.primary : colors.mutedForeground
                }
              />
              <Text
                className={cn(
                  'text-sm',
                  hasActiveFilter ? 'text-primary' : 'text-muted-foreground',
                )}>
                Filter
              </Text>
              {hasActiveFilter && (
                <Badge variant="secondary" className="ml-1">
                  <Text className="text-xs">Active</Text>
                </Badge>
              )}
            </Pressable>

            <Pressable
              onPress={toggleSelectionMode}
              className="flex-row items-center space-x-1 px-3 py-2 rounded-lg bg-muted">
              <CheckCheck size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">
                {selectionMode ? 'Cancel' : 'Select'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onSettingsPress} className="p-2 rounded-lg">
            <Settings size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Selection Mode Actions */}
        {selectionMode && (
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={selectAll}
                className="px-3 py-2 rounded-lg bg-muted">
                <Text className="text-sm text-muted-foreground">
                  {selectedNotifications.length === filteredNotifications.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Text>
              </Pressable>

              <Text className="text-sm text-muted-foreground">
                {selectedNotifications.length} selected
              </Text>
            </View>

            {selectedNotifications.length > 0 && (
              <Pressable
                onPress={handleDeleteSelected}
                className="flex-row items-center space-x-1 px-3 py-2 rounded-lg bg-destructive/10">
                <Trash2 size={16} color={colors.destructive} />
                <Text className="text-sm text-destructive">Delete</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Quick Actions */}
        {!selectionMode && filteredNotifications.length > 0 && (
          <View className="flex-row items-center space-x-2 mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="flex-1">
              <Text className="text-sm">Mark All Read</Text>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onPress={handleClearAll}
              className="flex-1">
              <Text className="text-sm">Clear All</Text>
            </Button>
          </View>
        )}
      </View>
    ),
    [
      colors,
      unreadCount,
      onClose,
      onSettingsPress,
      hasActiveFilter,
      selectionMode,
      selectedNotifications,
      filteredNotifications.length,
      toggleSelectionMode,
      selectAll,
      handleDeleteSelected,
      handleMarkAllRead,
      handleClearAll,
    ],
  );

  const renderEmpty = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-8 py-12">
        <Bell size={48} color={colors.mutedForeground} />
        <Text className="text-lg font-medium text-foreground mt-4 mb-2">
          No Notifications
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          {hasActiveFilter
            ? 'No notifications match your current filter. Try adjusting your filter settings.'
            : "You're all caught up! New notifications will appear here when you receive them."}
        </Text>
        {hasActiveFilter && (
          <Button
            variant="outline"
            onPress={handleClearFilter}
            className="mt-4">
            <Text>Clear Filter</Text>
          </Button>
        )}
      </View>
    ),
    [colors, hasActiveFilter, handleClearFilter],
  );

  const renderFilterModal = useCallback(
    () => (
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}>
        <SafeAreaView
          className="flex-1"
          style={{backgroundColor: colors.background}}>
          {/* Header */}
          <View className="border-b border-border px-4 py-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center space-x-2">
                <SlidersHorizontal size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground">
                  Filter Notifications
                </Text>
              </View>

                onPress={() => setShowFilterModal(false)}
                className="p-2">
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <View className="flex-1 p-4">
            {/* Read Status Filter */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <Text className="text-base font-medium text-foreground mb-3">
                  Read Status
                </Text>
                <View className="flex-row space-x-2">
                  {[
                    {label: 'All', value: undefined},
                    {label: 'Unread', value: false},
                    {label: 'Read', value: true},
                  ].map(option => (
                    <Pressable
                      key={option.label}
                      onPress={() =>
                        setTempFilter(prev => ({...prev, read: option.value}))
                      }
                      className={cn(
                        'px-4 py-2 rounded-lg border',
                        tempFilter.read === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card',
                      )}>
                      <Text
                        className={cn(
                          'text-sm',
                          tempFilter.read === option.value
                            ? 'text-primary'
                            : 'text-foreground',
                        )}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* Category Filter */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <Text className="text-base font-medium text-foreground mb-3">
                  Categories
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {FILTER_CATEGORIES.map(category => {
                    const isSelected = tempFilter.category?.includes(
                      category.value,
                    );
                    return (
                      <Pressable
                        key={category.value}
                        onPress={() => {
                          setTempFilter(prev => {
                            const categories = prev.category || [];
                            if (isSelected) {
                              return {
                                ...prev,
                                category: categories.filter(
                                  c => c !== category.value,
                                ),
                              };
                            } else {
                              return {
                                ...prev,
                                category: [...categories, category.value],
                              };
                            }
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
                            'text-sm',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}>
                          {category.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </CardContent>
            </Card>

            {/* Type Filter */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <Text className="text-base font-medium text-foreground mb-3">
                  Types
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {FILTER_TYPES.map(type => {
                    const isSelected = tempFilter.type?.includes(type.value);
                    return (
                      <Pressable
                        key={type.value}
                        onPress={() => {
                          setTempFilter(prev => {
                            const types = prev.type || [];
                            if (isSelected) {
                              return {
                                ...prev,
                                type: types.filter(t => t !== type.value),
                              };
                            } else {
                              return {...prev, type: [...types, type.value]};
                            }
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
                            'text-sm',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}>
                          {type.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Actions */}
          <View className="border-t border-border p-4">
            <View className="flex-row space-x-3">
              <Button
                variant="outline"
                onPress={() => {
                  setTempFilter({});
                  handleClearFilter();
                }}
                className="flex-1">
                <Text>Clear All</Text>
              </Button>

            <Button
              onPress={handleApplyFilter}
              className="flex-1"
                <Text className="text-primary-foreground">Apply Filter</Text>
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    ),
    [
      showFilterModal,
      colors,
      tempFilter,
      setTempFilter,
      handleApplyFilter,
      handleClearFilter,
    ],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView
        className="flex-1"
        style={{backgroundColor: colors.background}}>
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />

        {renderFilterModal()}
      </SafeAreaView>
    </Modal>
  );
}
