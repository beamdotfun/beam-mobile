import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {Flag} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface SimpleReportButtonProps {
  contentId: string;
  contentType: 'post' | 'profile';
  reportedUserWallet: string;
  variant?: 'icon' | 'text' | 'both';
  onPress?: () => void;
}

export function SimpleReportButton({
  contentId,
  contentType,
  reportedUserWallet,
  variant = 'text',
  onPress,
}: SimpleReportButtonProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
    },
    text: {
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
  });

  const handlePress = () => {
    // Simple alert instead of full modal for now
    console.log(`Report ${contentType} ${contentId} by ${reportedUserWallet}`);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      {variant !== 'text' && <Flag size={20} color={colors.foreground} />}
      {variant !== 'icon' && <Text style={styles.text}>Report</Text>}
    </Pressable>
  );
}
