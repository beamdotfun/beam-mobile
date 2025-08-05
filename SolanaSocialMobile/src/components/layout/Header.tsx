import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {ArrowLeft, MoreVertical} from 'lucide-react-native';
import {cn} from '../../utils/cn';
import {useThemeStore} from '../../store/themeStore';

interface HeaderProps {
  title?: string;
  subtitle?: string | React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onRightPress?: () => void;
  className?: string;
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  leftComponent,
  rightComponent,
  onRightPress,
  className,
}: HeaderProps) {
  const {colors} = useThemeStore();

  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4 py-3 border-b border-border',
        className,
      )}
      style={{borderBottomColor: colors.border}}>
      {/* Left side */}
      <View className="flex-row items-center flex-1">
        {leftComponent ? (
          leftComponent
        ) : showBackButton ? (
          <Pressable onPress={onBackPress} className="mr-3 p-1">
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
        ) : null}

        <View className="flex-1">
          {title && (
            <Text className="text-lg font-semibold text-foreground">
              {title}
            </Text>
          )}
          {subtitle &&
            (typeof subtitle === 'string' ? (
              <Text className="text-sm text-muted-foreground">{subtitle}</Text>
            ) : (
              subtitle
            ))}
        </View>
      </View>

      {/* Right side */}
      {rightComponent ? (
        rightComponent
      ) : onRightPress ? (
        <Pressable onPress={onRightPress} className="p-1">
          <MoreVertical size={24} color={colors.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}
