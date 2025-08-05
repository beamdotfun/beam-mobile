import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { ChevronRight, AlertCircle, CheckCircle, Loader } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { UserSettings } from '../../types/settings';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  section: keyof UserSettings;
  setting: string;
  type: 'switch' | 'text' | 'number' | 'select' | 'action';
  value?: any;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  onPress?: () => void;
  validation?: (value: any) => string | null;
  disabled?: boolean;
  showValidation?: boolean;
}

export function SettingsSection({
  title,
  description,
  icon,
  section,
  setting,
  type,
  value,
  options,
  placeholder,
  onPress,
  validation,
  disabled = false,
  showValidation = true,
}: SettingsSectionProps) {
  const { colors } = useThemeStore();
  const { 
    updateSettings, 
    saving, 
    validationErrors, 
    clearValidationErrors 
  } = useSettingsStore();
  
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync localValue with prop changes
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const sectionErrors = validationErrors[section] || [];
  const hasError = sectionErrors.length > 0 || localError;

  const handleUpdate = useCallback(async (newValue: any) => {
    try {
      setLocalError(null);
      
      // Local validation first
      if (validation) {
        const error = validation(newValue);
        if (error) {
          setLocalError(error);
          return;
        }
      }

      await updateSettings(section, { [setting]: newValue });
      setLocalValue(newValue);
      setIsEditing(false);
      
      if (sectionErrors.length > 0) {
        clearValidationErrors(section);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Error is handled by the store
    }
  }, [section, setting, updateSettings, validation, sectionErrors.length, clearValidationErrors]);

  const handleSwitchToggle = useCallback((newValue: boolean) => {
    handleUpdate(newValue);
  }, [handleUpdate]);

  const handleTextChange = useCallback((text: string) => {
    setLocalValue(text);
    if (localError) {
      setLocalError(null);
    }
  }, [localError]);

  const handleTextSubmit = useCallback(() => {
    handleUpdate(localValue);
  }, [localValue, handleUpdate]);

  const handleSelectPress = useCallback(() => {
    if (disabled || !options) return;

    Alert.alert(
      title,
      'Select an option:',
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => handleUpdate(option.value),
          style: option.value === value ? 'default' : 'default' as const,
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }, [title, options, disabled, value, handleUpdate]);

  const renderControl = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value}
            onValueChange={handleSwitchToggle}
            disabled={disabled || saving}
            trackColor={{
              false: colors.muted,
              true: colors.primary + '40',
            }}
            thumbColor={value ? colors.primary : colors.mutedForeground}
          />
        );

      case 'text':
      case 'number':
        return (
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                { 
                  color: colors.foreground,
                  backgroundColor: colors.muted,
                  borderColor: hasError ? colors.destructive : 'transparent',
                },
                isEditing && styles.textInputFocused
              ]}
              value={localValue?.toString() || ''}
              onChangeText={handleTextChange}
              onSubmitEditing={handleTextSubmit}
              onFocus={() => setIsEditing(true)}
              onBlur={() => {
                setIsEditing(false);
                if (localValue !== value) {
                  handleTextSubmit();
                }
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={type === 'number' ? 'numeric' : 'default'}
              editable={!disabled && !saving}
            />
          </View>
        );

      case 'select':
        return (
          <Pressable
            onPress={handleSelectPress}
            disabled={disabled || saving}
            style={[styles.selectButton, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.selectText, { color: colors.foreground }]}>
              {options?.find(opt => opt.value === value)?.label || 'Select...'}
            </Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
        );

      case 'action':
        return (
          <Pressable
            onPress={onPress}
            disabled={disabled || saving}
            style={styles.actionButton}
          >
            <ChevronRight size={20} color={colors.mutedForeground} />
          </Pressable>
        );

      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (saving) {
      return <Loader size={16} color={colors.primary} />;
    }
    
    if (hasError) {
      return <AlertCircle size={16} color={colors.destructive} />;
    }
    
    if (sectionErrors.length === 0 && !localError) {
      return <CheckCircle size={16} color={colors.success} />;
    }
    
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
              {icon}
            </View>
          )}
          
          <View style={styles.textSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
              {showValidation && getStatusIcon()}
            </View>
            
            {description && (
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {description}
              </Text>
            )}
            
            {showValidation && (hasError) && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {localError || sectionErrors.join(', ')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.controlSection}>
          {renderControl()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  controlSection: {
    alignItems: 'flex-end',
  },
  textInputContainer: {
    minWidth: 120,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    textAlign: 'right',
  },
  textInputFocused: {
    borderWidth: 2,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    minWidth: 120,
  },
  selectText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    padding: 4,
  },
});