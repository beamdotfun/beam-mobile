import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface SimpleCommentsSectionProps {
  postId: string;
  onMentionClick?: (wallet: string) => void;
}

export function SimpleCommentsSection({
  postId,
  onMentionClick,
}: SimpleCommentsSectionProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
    },
    text: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Comments feature coming soon</Text>
    </View>
  );
}
