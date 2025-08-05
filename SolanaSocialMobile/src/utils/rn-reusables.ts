import {StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../styles/theme';

// Custom styling system that mimics React Native Reusables/TailwindCSS
export interface RNReusableStyle {
  [key: string]: ViewStyle | TextStyle;
}

// Base styles that can be combined
export const baseStyles: RNReusableStyle = {
  // Layout
  'flex-1': {flex: 1},
  'flex-row': {flexDirection: 'row'},
  'flex-col': {flexDirection: 'column'},
  'items-center': {alignItems: 'center'},
  'items-start': {alignItems: 'flex-start'},
  'items-end': {alignItems: 'flex-end'},
  'justify-center': {justifyContent: 'center'},
  'justify-between': {justifyContent: 'space-between'},
  'justify-around': {justifyContent: 'space-around'},
  'justify-evenly': {justifyContent: 'space-evenly'},
  'self-center': {alignSelf: 'center'},
  'self-start': {alignSelf: 'flex-start'},
  'self-end': {alignSelf: 'flex-end'},
  'self-stretch': {alignSelf: 'stretch'},

  // Spacing
  'p-0': {padding: 0},
  'p-1': {padding: spacing.xs},
  'p-2': {padding: spacing.sm},
  'p-3': {padding: spacing.md},
  'p-4': {padding: spacing.lg},
  'p-5': {padding: spacing.xl},
  'p-6': {padding: spacing.xxl},

  'px-0': {paddingHorizontal: 0},
  'px-1': {paddingHorizontal: spacing.xs},
  'px-2': {paddingHorizontal: spacing.sm},
  'px-3': {paddingHorizontal: spacing.md},
  'px-4': {paddingHorizontal: spacing.lg},
  'px-5': {paddingHorizontal: spacing.xl},
  'px-6': {paddingHorizontal: spacing.xxl},

  'py-0': {paddingVertical: 0},
  'py-1': {paddingVertical: spacing.xs},
  'py-2': {paddingVertical: spacing.sm},
  'py-3': {paddingVertical: spacing.md},
  'py-4': {paddingVertical: spacing.lg},
  'py-5': {paddingVertical: spacing.xl},
  'py-6': {paddingVertical: spacing.xxl},

  'pt-0': {paddingTop: 0},
  'pt-1': {paddingTop: spacing.xs},
  'pt-2': {paddingTop: spacing.sm},
  'pt-3': {paddingTop: spacing.md},
  'pt-4': {paddingTop: spacing.lg},
  'pt-5': {paddingTop: spacing.xl},
  'pt-6': {paddingTop: spacing.xxl},

  'pb-0': {paddingBottom: 0},
  'pb-1': {paddingBottom: spacing.xs},
  'pb-2': {paddingBottom: spacing.sm},
  'pb-3': {paddingBottom: spacing.md},
  'pb-4': {paddingBottom: spacing.lg},
  'pb-5': {paddingBottom: spacing.xl},
  'pb-6': {paddingBottom: spacing.xxl},

  'pl-0': {paddingLeft: 0},
  'pl-1': {paddingLeft: spacing.xs},
  'pl-2': {paddingLeft: spacing.sm},
  'pl-3': {paddingLeft: spacing.md},
  'pl-4': {paddingLeft: spacing.lg},
  'pl-5': {paddingLeft: spacing.xl},
  'pl-6': {paddingLeft: spacing.xxl},

  'pr-0': {paddingRight: 0},
  'pr-1': {paddingRight: spacing.xs},
  'pr-2': {paddingRight: spacing.sm},
  'pr-3': {paddingRight: spacing.md},
  'pr-4': {paddingRight: spacing.lg},
  'pr-5': {paddingRight: spacing.xl},
  'pr-6': {paddingRight: spacing.xxl},

  // Margins
  'm-0': {margin: 0},
  'm-1': {margin: spacing.xs},
  'm-2': {margin: spacing.sm},
  'm-3': {margin: spacing.md},
  'm-4': {margin: spacing.lg},
  'm-5': {margin: spacing.xl},
  'm-6': {margin: spacing.xxl},

  'mx-0': {marginHorizontal: 0},
  'mx-1': {marginHorizontal: spacing.xs},
  'mx-2': {marginHorizontal: spacing.sm},
  'mx-3': {marginHorizontal: spacing.md},
  'mx-4': {marginHorizontal: spacing.lg},
  'mx-5': {marginHorizontal: spacing.xl},
  'mx-6': {marginHorizontal: spacing.xxl},

  'my-0': {marginVertical: 0},
  'my-1': {marginVertical: spacing.xs},
  'my-2': {marginVertical: spacing.sm},
  'my-3': {marginVertical: spacing.md},
  'my-4': {marginVertical: spacing.lg},
  'my-5': {marginVertical: spacing.xl},
  'my-6': {marginVertical: spacing.xxl},

  'mt-0': {marginTop: 0},
  'mt-1': {marginTop: spacing.xs},
  'mt-2': {marginTop: spacing.sm},
  'mt-3': {marginTop: spacing.md},
  'mt-4': {marginTop: spacing.lg},
  'mt-5': {marginTop: spacing.xl},
  'mt-6': {marginTop: spacing.xxl},

  'mb-0': {marginBottom: 0},
  'mb-1': {marginBottom: spacing.xs},
  'mb-2': {marginBottom: spacing.sm},
  'mb-3': {marginBottom: spacing.md},
  'mb-4': {marginBottom: spacing.lg},
  'mb-5': {marginBottom: spacing.xl},
  'mb-6': {marginBottom: spacing.xxl},

  'ml-0': {marginLeft: 0},
  'ml-1': {marginLeft: spacing.xs},
  'ml-2': {marginLeft: spacing.sm},
  'ml-3': {marginLeft: spacing.md},
  'ml-4': {marginLeft: spacing.lg},
  'ml-5': {marginLeft: spacing.xl},
  'ml-6': {marginLeft: spacing.xxl},

  'mr-0': {marginRight: 0},
  'mr-1': {marginRight: spacing.xs},
  'mr-2': {marginRight: spacing.sm},
  'mr-3': {marginRight: spacing.md},
  'mr-4': {marginRight: spacing.lg},
  'mr-5': {marginRight: spacing.xl},
  'mr-6': {marginRight: spacing.xxl},

  // Colors
  'bg-primary': {backgroundColor: colors.primary},
  'bg-primary-foreground': {backgroundColor: colors.primaryForeground},
  'bg-secondary': {backgroundColor: colors.secondary},
  'bg-secondary-foreground': {backgroundColor: colors.secondaryForeground},
  'bg-background': {backgroundColor: colors.background},
  'bg-foreground': {backgroundColor: colors.foreground},
  'bg-card': {backgroundColor: colors.card},
  'bg-border': {backgroundColor: colors.border},
  'bg-input': {backgroundColor: colors.input},
  'bg-ring': {backgroundColor: colors.ring},
  'bg-destructive': {backgroundColor: colors.destructive},
  'bg-destructive-foreground': {backgroundColor: colors.destructiveForeground},
  'bg-muted': {backgroundColor: colors.muted},
  'bg-muted-foreground': {backgroundColor: colors.mutedForeground},
  'bg-accent': {backgroundColor: colors.accent},
  'bg-accent-foreground': {backgroundColor: colors.accentForeground},
  'bg-popover': {backgroundColor: colors.popover},
  'bg-popover-foreground': {backgroundColor: colors.popoverForeground},
  'bg-success': {backgroundColor: colors.success},
  'bg-warning': {backgroundColor: colors.warning},
  'bg-error': {backgroundColor: colors.error},
  'bg-info': {backgroundColor: colors.info},

  // Text colors
  'text-primary': {color: colors.primary},
  'text-primary-foreground': {color: colors.primaryForeground},
  'text-secondary': {color: colors.secondary},
  'text-secondary-foreground': {color: colors.secondaryForeground},
  'text-background': {color: colors.background},
  'text-foreground': {color: colors.foreground},
  'text-card': {color: colors.card},
  'text-border': {color: colors.border},
  'text-input': {color: colors.input},
  'text-ring': {color: colors.ring},
  'text-destructive': {color: colors.destructive},
  'text-destructive-foreground': {color: colors.destructiveForeground},
  'text-muted': {color: colors.muted},
  'text-muted-foreground': {color: colors.mutedForeground},
  'text-accent': {color: colors.accent},
  'text-accent-foreground': {color: colors.accentForeground},
  'text-popover': {color: colors.popover},
  'text-popover-foreground': {color: colors.popoverForeground},
  'text-success': {color: colors.success},
  'text-warning': {color: colors.warning},
  'text-error': {color: colors.error},
  'text-info': {color: colors.info},

  // Typography
  'text-xs': {fontSize: typography.fontSize.xs},
  'text-sm': {fontSize: typography.fontSize.sm},
  'text-base': {fontSize: typography.fontSize.base},
  'text-lg': {fontSize: typography.fontSize.lg},
  'text-xl': {fontSize: typography.fontSize.xl},
  'text-2xl': {fontSize: typography.fontSize['2xl']},
  'text-3xl': {fontSize: typography.fontSize['3xl']},
  'text-4xl': {fontSize: typography.fontSize['4xl']},

  'font-normal': {fontWeight: typography.fontWeight.normal},
  'font-medium': {fontWeight: typography.fontWeight.medium},
  'font-semibold': {fontWeight: typography.fontWeight.semibold},
  'font-bold': {fontWeight: typography.fontWeight.bold},

  'text-left': {textAlign: 'left'},
  'text-center': {textAlign: 'center'},
  'text-right': {textAlign: 'right'},

  // Border radius
  'rounded-none': {borderRadius: 0},
  'rounded-sm': {borderRadius: borderRadius.sm},
  rounded: {borderRadius: borderRadius.md},
  'rounded-md': {borderRadius: borderRadius.md},
  'rounded-lg': {borderRadius: borderRadius.lg},
  'rounded-xl': {borderRadius: borderRadius.xl},
  'rounded-full': {borderRadius: borderRadius.full},

  // Borders
  border: {borderWidth: 1, borderColor: colors.border},
  'border-0': {borderWidth: 0},
  'border-2': {borderWidth: 2, borderColor: colors.border},
  'border-primary': {borderColor: colors.primary},
  'border-secondary': {borderColor: colors.secondary},
  'border-destructive': {borderColor: colors.destructive},
  'border-muted': {borderColor: colors.muted},
  'border-accent': {borderColor: colors.accent},
  'border-success': {borderColor: colors.success},
  'border-warning': {borderColor: colors.warning},
  'border-error': {borderColor: colors.error},
  'border-info': {borderColor: colors.info},

  // Shadows
  'shadow-none': {},
  'shadow-sm': shadows.sm,
  shadow: shadows.md,
  'shadow-md': shadows.md,
  'shadow-lg': shadows.lg,

  // Positioning
  absolute: {position: 'absolute'},
  relative: {position: 'relative'},

  // Sizing
  'w-full': {width: '100%'},
  'h-full': {height: '100%'},
  'min-h-0': {minHeight: 0},
  'min-h-full': {minHeight: '100%'},
  'max-w-full': {maxWidth: '100%'},
  'max-h-full': {maxHeight: '100%'},

  // Opacity
  'opacity-0': {opacity: 0},
  'opacity-25': {opacity: 0.25},
  'opacity-50': {opacity: 0.5},
  'opacity-75': {opacity: 0.75},
  'opacity-100': {opacity: 1},

  // Overflow
  'overflow-hidden': {overflow: 'hidden'},
  'overflow-visible': {overflow: 'visible'},
};

// Function to combine styles like the `cn` utility
export function rn(
  ...classNames: (string | undefined | null | false)[]
): ViewStyle | TextStyle {
  return classNames.filter(Boolean).reduce((acc, className) => {
    if (className && baseStyles[className]) {
      return {...acc, ...baseStyles[className]};
    }
    return acc;
  }, {} as ViewStyle | TextStyle);
}

// Export for easy use
export default {rn, baseStyles};
