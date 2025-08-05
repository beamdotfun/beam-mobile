import * as React from 'react';
import {Text, View} from 'react-native';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white',
        warning: 'border-transparent bg-yellow-500 text-white',
        // Social platform variants
        upvote: 'border-transparent bg-green-500 text-white',
        downvote: 'border-transparent bg-red-500 text-white',
        tip: 'border-transparent bg-yellow-500 text-white',
        brand: 'border-transparent bg-blue-500 text-white',
        verified: 'border-transparent bg-blue-600 text-white',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

function Badge({className, variant, size, children, ...props}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({variant, size}), className)} {...props}>
      <Text
        className={cn(
          'text-xs font-semibold',
          variant === 'default' && 'text-primary-foreground',
          variant === 'secondary' && 'text-secondary-foreground',
          variant === 'destructive' && 'text-destructive-foreground',
          variant === 'outline' && 'text-foreground',
          (variant === 'success' || variant === 'upvote') && 'text-white',
          (variant === 'warning' || variant === 'tip') && 'text-white',
          (variant === 'brand' || variant === 'verified') && 'text-white',
          variant === 'downvote' && 'text-white',
        )}>
        {children}
      </Text>
    </View>
  );
}

export {Badge, badgeVariants};
