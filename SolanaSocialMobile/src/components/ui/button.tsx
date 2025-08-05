import * as React from 'react';
import {Pressable, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

// Button variants factory function
const createButtonVariants = (colors: any) =>
  ({
    variant: {
      default: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      destructive: {
        backgroundColor: colors.destructive,
        borderColor: colors.destructive,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#E5E7EB',
        borderWidth: 1,
      },
      secondary: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      link: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
    },
    size: {
      default: {
        height: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
      },
      sm: {
        height: 36,
        paddingHorizontal: 12,
        paddingVertical: 6,
      },
      lg: {
        height: 44,
        paddingHorizontal: 24,
        paddingVertical: 12,
      },
      icon: {
        width: 40,
        height: 40,
        paddingHorizontal: 12,
        paddingVertical: 12,
      },
    },
  } as const);

const createTextVariants = (colors: any) =>
  ({
    variant: {
      default: {
        color: colors.primaryForeground,
      },
      destructive: {
        color: colors.destructiveForeground,
      },
      outline: {
        color: colors.primary,
      },
      secondary: {
        color: colors.secondaryForeground,
      },
      ghost: {
        color: colors.foreground,
      },
      link: {
        color: colors.primary,
      },
    },
    size: {
      default: {
        fontSize: 16,
      },
      sm: {
        fontSize: 14,
      },
      lg: {
        fontSize: 18,
      },
      icon: {
        fontSize: 16,
      },
    },
  } as const);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      variant = 'default',
      size = 'default',
      children,
      style,
      textStyle,
      disabled,
      loading,
      ...props
    },
    ref,
  ) => {
    const {colors} = useThemeStore();

    // Ensure colors is defined
    if (!colors) {
      return null;
    }

    const buttonVariants = createButtonVariants(colors);
    const textVariants = createTextVariants(colors);

    const buttonStyle = StyleSheet.flatten([
      {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        flexDirection: 'row',
      },
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      disabled && {
        opacity: 0.5,
      },
      style,
    ]);

    const textStyleCombined = StyleSheet.flatten([
      {
        fontWeight: '600',
        textAlign: 'center',
        color: textVariants.variant[variant].color || colors.primaryForeground,
      },
      textVariants.variant[variant],
      textVariants.size[size],
      variant === 'link' && {
        textDecorationLine: 'underline',
      },
      textStyle,
    ]);

    return (
      <Pressable
        ref={ref}
        style={({pressed}) => [
          buttonStyle,
          pressed &&
            !disabled && {
              opacity: 0.8,
            },
        ]}
        disabled={disabled || loading}
        {...props}>
        <Text style={textStyleCombined}>
          {loading ? 'Loading...' : children}
        </Text>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

export {Button};
