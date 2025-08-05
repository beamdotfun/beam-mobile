import {Appearance} from 'react-native';
import {fonts, typography} from './fonts';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // UI status colors
  success: string;
  warning: string;
  // Social platform specific colors
  upvote: string;
  downvote: string;
  tip: string;
  brand: string;
  auction: string;
  verified: string;
}

export const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',
  popover: '#FFFFFF',
  popoverForeground: '#0F172A',
  primary: '#3B82F6', // Beam blue
  primaryForeground: '#F8FAFC',
  secondary: '#F3F4F6',
  secondaryForeground: '#1E293B',
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  accent: '#F3F4F6',
  accentForeground: '#1E293B',
  destructive: '#EF4444',
  destructiveForeground: '#F8FAFC',
  border: '#E5E7EB',
  input: '#E5E7EB',
  ring: '#3B82F6',
  // UI status colors
  success: '#10B981', // Green
  warning: '#F59E0B', // Gold
  // Social platform colors
  upvote: '#10B981', // Green
  downvote: '#EF4444', // Red
  tip: '#F59E0B', // Gold
  brand: '#3B82F6', // Blue
  auction: '#A855F7', // Purple
  verified: '#0EA5E9', // Twitter blue
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  foreground: '#F8FAFC',
  card: '#0F172A',
  cardForeground: '#F8FAFC',
  popover: '#0F172A',
  popoverForeground: '#F8FAFC',
  primary: '#60A5FA', // Lighter blue for dark mode
  primaryForeground: '#F8FAFC',
  secondary: '#1E293B',
  secondaryForeground: '#F8FAFC',
  muted: '#1E293B',
  mutedForeground: '#94A3B8',
  accent: '#1E293B',
  accentForeground: '#F8FAFC',
  destructive: '#DC2626',
  destructiveForeground: '#F8FAFC',
  border: '#1E293B',
  input: '#1E293B',
  ring: '#60A5FA',
  // UI status colors
  success: '#059669', // Green
  warning: '#D97706', // Gold
  // Social platform colors
  upvote: '#059669',
  downvote: '#DC2626',
  tip: '#D97706',
  brand: '#3B82F6',
  auction: '#A855F7',
  verified: '#0EA5E9',
};

export const getThemeColors = (theme: Theme): ThemeColors => {
  if (theme === 'system') {
    return Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;
  }
  return theme === 'dark' ? darkTheme : lightTheme;
};

// Spacing constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius constants
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

// Shadow constants
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Export fonts and typography for easy access
export {fonts, typography};
