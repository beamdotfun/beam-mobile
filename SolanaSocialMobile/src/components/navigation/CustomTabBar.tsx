import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Home, Search, Trophy, Bell, MessageSquare} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useThemeStore();

  const icons: Record<string, React.ReactNode> = {
    Feed: Home,
    Search: Search,
    Leaderboard: Trophy,
    Notifications: Bell,
    Messages: MessageSquare,
  };

  return (
    <View style={[styles.container, {bottom: insets.bottom + 10}]}>
      <View style={[styles.tabBar, {backgroundColor: colors.background}]}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = icons[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tab}>
              <Icon
                size={24}
                color={isFocused ? colors.primary : colors.mutedForeground}
              />
              {isFocused && (
                <View
                  style={[styles.indicator, {backgroundColor: colors.primary}]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 10,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    // Android shadow
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
