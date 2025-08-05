import * as React from 'react';
import {Switch as RNSwitch, SwitchProps} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

export interface CustomSwitchProps extends SwitchProps {
  // Add any custom props here if needed
}

function Switch(props: CustomSwitchProps) {
  const {colors} = useThemeStore();

  return (
    <RNSwitch
      trackColor={{
        false: colors.muted,
        true: colors.primary,
      }}
      thumbColor={
        props.value ? colors.primaryForeground : colors.mutedForeground
      }
      ios_backgroundColor={colors.muted}
      {...props}
    />
  );
}

export {Switch};
