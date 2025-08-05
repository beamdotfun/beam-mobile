import React from 'react';
import {View, Text, TextInput, Pressable, Platform} from 'react-native';
import {Bold, Italic, Link, List, Quote, Code, Hash} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter markdown...',
}: MarkdownEditorProps) {
  const {colors} = useThemeStore();

  const insertMarkdown = (before: string, after: string = '') => {
    // In a real implementation, we'd handle cursor position
    // For now, we'll just append to the end
    const newValue = value + before + after;
    onChange(newValue);
  };

  const insertAtCursor = (text: string) => {
    onChange(value + text);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      onPress: () => insertMarkdown('**', '**'),
      label: 'Bold',
    },
    {
      icon: Italic,
      onPress: () => insertMarkdown('*', '*'),
      label: 'Italic',
    },
    {
      icon: Link,
      onPress: () => insertMarkdown('[', '](url)'),
      label: 'Link',
    },
    {
      icon: List,
      onPress: () => insertAtCursor('\n- '),
      label: 'List',
    },
    {
      icon: Quote,
      onPress: () => insertAtCursor('\n> '),
      label: 'Quote',
    },
    {
      icon: Code,
      onPress: () => insertMarkdown('`', '`'),
      label: 'Code',
    },
    {
      icon: Hash,
      onPress: () => insertAtCursor('\n# '),
      label: 'Heading',
    },
  ];

  return (
    <View>
      {/* Toolbar */}
      <View
        className="flex-row flex-wrap mb-3 pb-3 border-b"
        style={{borderColor: colors.border}}>
        {toolbarButtons.map((button, index) => (
          <Pressable
            key={index}
            onPress={button.onPress}
            className="p-2 mr-2 mb-2 rounded-lg"
            style={{backgroundColor: colors.muted}}
            accessibilityLabel={button.label}
            accessibilityRole="button">
            <button.icon size={16} color={colors.foreground} />
          </Pressable>
        ))}
      </View>

      {/* Editor */}
      <TextInput
        multiline
        numberOfLines={8}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={{
          textAlignVertical: 'top',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          fontSize: 14,
          color: colors.foreground,
          minHeight: 160,
        }}
      />

      {/* Help Text */}
      <View
        className="mt-2 p-2 rounded"
        style={{backgroundColor: colors.muted}}>
        <Text className="text-xs" style={{color: colors.mutedForeground}}>
          Markdown supported: **bold**, *italic*, [links](url), `code`, #
          headings, {'>'}quotes, - lists
        </Text>
      </View>

      {/* Live Preview (optional) */}
      {value.length > 0 && (
        <View
          className="mt-4 p-3 rounded-lg border"
          style={{borderColor: colors.border}}>
          <Text
            className="text-xs font-medium mb-2"
            style={{color: colors.mutedForeground}}>
            Preview
          </Text>
          <Text className="text-sm" style={{color: colors.foreground}}>
            {/* Simple preview - in production, use a proper markdown renderer */}
            {value.substring(0, 100)}
            {value.length > 100 ? '...' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
