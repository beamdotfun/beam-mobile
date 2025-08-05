/**
 * Font configuration for the Beam app
 *
 * Font weights mapping:
 * - Thin: 100
 * - ExtraLight: 200
 * - Light: 300
 * - Regular: 400
 * - Medium: 500
 * - SemiBold: 600
 * - Bold: 700
 * - ExtraBold: 800
 * - Black: 900
 */

import {Platform} from 'react-native';

// Font family names for each platform
const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter_18pt',
});

export const fonts = {
  // Font families by weight
  thin: Platform.select({
    ios: 'Inter-Thin',
    android: 'Inter_18pt-Thin',
  }),
  extraLight: Platform.select({
    ios: 'Inter-ExtraLight',
    android: 'Inter_18pt-ExtraLight',
  }),
  light: Platform.select({
    ios: 'Inter-Light',
    android: 'Inter_18pt-Light',
  }),
  regular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter_18pt-Regular',
  }),
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter_18pt-Medium',
  }),
  semiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter_18pt-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter_18pt-Bold',
  }),
  extraBold: Platform.select({
    ios: 'Inter-ExtraBold',
    android: 'Inter_18pt-ExtraBold',
  }),
  black: Platform.select({
    ios: 'Inter-Black',
    android: 'Inter_18pt-Black',
  }),
};

// Typography presets
export const typography = {
  // Display styles
  displayLarge: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.25,
  },

  // Heading styles
  h1: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  h2: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.15,
  },
  h3: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  h4: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Body styles
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Label styles
  labelLarge: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  // Button text
  button: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    textTransform: 'none' as const,
  },

  // Caption
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  // Overline
  overline: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

// Helper function to get font weight style
export const getFontWeight = (weight: keyof typeof fonts) => ({
  fontFamily: fonts[weight],
});
