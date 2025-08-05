import {StyleSheet} from 'react-native';
import {fonts} from './fonts';

export const globalStyles = StyleSheet.create({
  defaultText: {
    fontFamily: fonts.regular,
  },
  container: {
    flex: 1,
  },
});

// Default text style that can be applied globally
export const defaultTextStyle = {
  fontFamily: fonts.regular,
};
