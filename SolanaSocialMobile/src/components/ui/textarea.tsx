import React from 'react';
import {TextInput, TextInputProps, View} from 'react-native';
import {cn} from '../../lib/utils';
import {Text} from './text';

interface TextareaProps extends Omit<TextInputProps, 'multiline'> {
  label?: string;
  error?: string;
  className?: string;
  rows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className,
  rows = 4,
  style,
  ...props
}) => {
  const inputHeight = rows * 20 + 20; // Approximate height based on rows

  return (
    <View className="space-y-1">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        multiline
        textAlignVertical="top"
        className={cn(
          'border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        style={[{height: inputHeight, textAlignVertical: 'top'}, style]}
        {...props}
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  );
};
