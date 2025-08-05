import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import {cn} from '../../lib/utils';
import {fonts, typography} from '../../styles/fonts';

interface TextProps extends RNTextProps {
  className?: string;
  variant?: 'default' | 'heading' | 'subheading' | 'caption' | 'label';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  className,
  variant = 'default',
  children,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'heading':
        return 'text-2xl font-bold text-gray-900';
      case 'subheading':
        return 'text-lg font-semibold text-gray-800';
      case 'caption':
        return 'text-sm text-gray-600';
      case 'label':
        return 'text-sm font-medium text-gray-700';
      default:
        return 'text-base text-gray-900';
    }
  };

  // Get typography preset based on variant
  const getTypographyStyle = () => {
    switch (variant) {
      case 'heading':
        return typography.h1;
      case 'subheading':
        return typography.h3;
      case 'caption':
        return typography.caption;
      case 'label':
        return typography.labelLarge;
      default:
        return typography.bodyMedium;
    }
  };

  return (
    <RNText
      className={cn(getVariantStyles(), className)}
      style={[getTypographyStyle(), style]}
      {...props}>
      {children}
    </RNText>
  );
};
