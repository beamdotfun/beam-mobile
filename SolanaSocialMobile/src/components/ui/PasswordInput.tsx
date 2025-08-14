import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  showToggleButton?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  labelStyle,
  showToggleButton = true,
  style,
  ...textInputProps
}) => {
  const {colors} = useThemeStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    inputContainer: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      borderWidth: 1,
      borderColor: error ? colors.destructive : colors.border,
    },
    toggleButton: {
      position: 'absolute',
      right: 16,
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    helperText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 6,
    },
    errorText: {
      fontSize: 12,
      color: colors.destructive,
      fontFamily: 'Inter-Regular',
      marginTop: 6,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          {...textInputProps}
          style={[styles.input, inputStyle, style]}
          secureTextEntry={!isPasswordVisible}
          placeholderTextColor={colors.mutedForeground}
        />
        {showToggleButton && (
          <Pressable
            style={styles.toggleButton}
            onPress={togglePasswordVisibility}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};