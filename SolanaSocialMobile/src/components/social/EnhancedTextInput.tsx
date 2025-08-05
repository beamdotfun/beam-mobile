import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import {MentionSuggestions} from './MentionSuggestions';
import {HashtagSuggestions} from './HashtagSuggestions';
import {
  MentionSuggestion,
  HashtagSuggestion,
} from '../../types/social-advanced';
import {useThemeStore} from '../../store/themeStore';

interface EnhancedTextInputProps extends TextInputProps {
  onMentionSelect?: (mention: MentionSuggestion) => void;
  onHashtagSelect?: (hashtag: HashtagSuggestion) => void;
}

export const EnhancedTextInput: React.FC<EnhancedTextInputProps> = ({
  value = '',
  onChangeText,
  onMentionSelect,
  onHashtagSelect,
  ...props
}) => {
  const {colors} = useThemeStore();
  const [showMentions, setShowMentions] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = useCallback(
    (text: string) => {
      onChangeText?.(text);

    // Check for mentions and hashtags based on cursor position
      const beforeCursor = text.slice(0, cursorPosition);
      const mentionMatch = beforeCursor.match(/@(\w*)$/);
      const hashtagMatch = beforeCursor.match(/#(\w*)$/);

    if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setShowMentions(true);
        setShowHashtags(false);
      } else if (hashtagMatch) {
        setHashtagQuery(hashtagMatch[1]);
        setShowHashtags(true);
        setShowMentions(false);
      } else {
        setShowMentions(false);
        setShowHashtags(false);
      }
    },
    [cursorPosition, onChangeText],

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setCursorPosition(e.nativeEvent.selection.end);
    },
    [],
  );

  const handleMentionSelect = useCallback(
    (user: MentionSuggestion) => {
      const text = value as string;
      const beforeCursor = text.slice(0, cursorPosition);
      const afterCursor = text.slice(cursorPosition);

      // Replace the partial mention with the full username
      const newBeforeCursor = beforeCursor.replace(
        /@\w*$/,
        `@${user.displayName} `,
      );
      const newText = newBeforeCursor + afterCursor;
      const newCursorPosition = newBeforeCursor.length;

      onChangeText?.(newText);
      setShowMentions(false);

      // Set cursor position after state update
      setTimeout(() => {
        inputRef.current?.setNativeProps({
          selection: {start: newCursorPosition, end: newCursorPosition},
        });
      }, 0);

      onMentionSelect?.(user);
    },
    [value, cursorPosition, onChangeText, onMentionSelect],
  );

  const handleHashtagSelect = useCallback(
    (hashtag: HashtagSuggestion) => {
      const text = value as string;
      const beforeCursor = text.slice(0, cursorPosition);
      const afterCursor = text.slice(cursorPosition);

      // Replace the partial hashtag with the full tag
      const newBeforeCursor = beforeCursor.replace(/#\w*$/, `#${hashtag.tag} `);
      const newText = newBeforeCursor + afterCursor;
      const newCursorPosition = newBeforeCursor.length;

      onChangeText?.(newText);
      setShowHashtags(false);

      // Set cursor position after state update
      setTimeout(() => {
        inputRef.current?.setNativeProps({
          selection: {start: newCursorPosition, end: newCursorPosition},
        });
      }, 0);

      onHashtagSelect?.(hashtag);
    },
    [value, cursorPosition, onChangeText, onHashtagSelect],
  );

  return (
    <View className="relative">
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholderTextColor={colors.mutedForeground}
        style={{color: colors.foreground}}
        {...props}
      />

      <MentionSuggestions
        query={mentionQuery}
        onSelect={handleMentionSelect}
        visible={showMentions}
      />

      <HashtagSuggestions
        query={hashtagQuery}
        onSelect={handleHashtagSelect}
        visible={showHashtags}
      />
    </View>
  );
};
