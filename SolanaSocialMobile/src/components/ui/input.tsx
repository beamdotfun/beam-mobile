import * as React from 'react';
import {TextInput, View, Text} from 'react-native';
import {cn} from '../../utils/cn';
import {useThemeStore} from '../../store/themeStore';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({className, label, error, helperText, ...props}, ref) => {
    const {colors} = useThemeStore();

    return (
      <View className="space-y-2">
        {label && (
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        )}
        <TextInput
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
            'focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error &&
              'border-destructive focus:border-destructive focus:ring-destructive',
            className,
          )}
          placeholderTextColor={colors.mutedForeground}
          ref={ref}
          {...props}
        />
        {error && <Text className="text-sm text-destructive">{error}</Text>}
        {helperText && !error && (
          <Text className="text-sm text-muted-foreground">{helperText}</Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

export {Input};
