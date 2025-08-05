import React, {useState} from 'react';
import {View, TouchableOpacity, Modal, FlatList} from 'react-native';
import {ChevronDown} from 'lucide-react-native';
import {cn} from '../../lib/utils';
import {Text} from './text';
import {Card} from './card';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  label,
  error,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View className="space-y-1">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        className={cn(
          'border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between',
          'focus:border-blue-500',
          error && 'border-red-500',
          disabled && 'bg-gray-100 opacity-60',
          className,
        )}
        disabled={disabled}>
        <Text
          className={cn(
            'flex-1',
            selectedOption ? 'text-gray-900' : 'text-gray-500',
          )}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={disabled ? '#9CA3AF' : '#6B7280'} />
      </TouchableOpacity>

      {error && <Text className="text-sm text-red-600">{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}>
          <Card className="mx-4 max-h-80 w-full max-w-sm">
            <View className="p-2">
              <FlatList
                data={options}
                keyExtractor={item => item.value}
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    className={cn(
                      'px-3 py-3 rounded-lg',
                      item.value === value && 'bg-blue-50',
                    )}>
                    <Text
                      className={cn(
                        'text-gray-900',
                        item.value === value && 'text-blue-600 font-medium',
                      )}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </Card>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
