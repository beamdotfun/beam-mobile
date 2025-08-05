import React from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {cn} from '../../utils/cn';
import {useThemeStore} from '../../store/themeStore';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  className,
  scrollable = false,
  refreshing = false,
  onRefresh,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const {colors} = useThemeStore();

  const content = (
    <View
      className={cn('flex-1 bg-background', className)}
      style={{backgroundColor: colors.background}}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={edges}
      style={{backgroundColor: colors.background}}>
      {scrollable ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
