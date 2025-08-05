import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {ChevronUp, ChevronDown} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface VoteButtonProps {
  type: 'upvote' | 'downvote';
  count: number;
  isVoted: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function VoteButton({
  type,
  count,
  isVoted,
  onPress,
  disabled = false,
}: VoteButtonProps) {
  const {colors} = useThemeStore();
  const Icon = type === 'upvote' ? ChevronUp : ChevronDown;

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isVoted
        ? type === 'upvote'
          ? colors.success + '20'
          : colors.destructive + '20'
        : colors.muted,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      marginLeft: 4,
      color: isVoted
        ? type === 'upvote'
          ? colors.success
          : colors.destructive
        : colors.mutedForeground,
    },
  });

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.button}>
      <Icon
        size={16}
        color={
          isVoted
            ? type === 'upvote'
              ? colors.success || '#10B981'
              : colors.destructive || '#EF4444'
            : colors.mutedForeground
        }
      />
      <Text style={styles.text}>{count}</Text>
    </Pressable>
  );
}
