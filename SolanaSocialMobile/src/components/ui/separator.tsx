import * as React from 'react';
import {View} from 'react-native';
import {cn} from '../../utils/cn';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof View>,
  SeparatorProps
>(({orientation = 'horizontal', className, ...props}, ref) => (
  <View
    ref={ref}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className,
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

export {Separator};
