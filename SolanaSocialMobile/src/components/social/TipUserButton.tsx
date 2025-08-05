import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useNavigation } from '@react-navigation/native';
import { FeedStackScreenProps } from '../../types/navigation';

interface TipUserButtonProps {
  targetWallet: string;
  targetName?: string;
  targetAvatar?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outline' | 'filled';
}

type NavigationProp = FeedStackScreenProps<'FeedHome'>['navigation'];

export function TipUserButton({
  targetWallet,
  targetName,
  targetAvatar,
  size = 'medium',
  variant = 'outline',
}: TipUserButtonProps) {
  const { colors } = useThemeStore();
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    console.log('📝 TipUserButton: Opening tip screen for', targetWallet);
    
    navigation.navigate('SendTip', {
      recipientWallet: targetWallet,
      recipientName: targetName,
      recipientAvatar: targetAvatar,
    });
  };

  const iconSize = size === 'small' ? 14 : size === 'medium' ? 16 : 18;
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
      paddingVertical: size === 'small' ? 4 : size === 'medium' ? 6 : 8,
      borderRadius: size === 'small' ? 12 : size === 'medium' ? 16 : 20,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? colors.border : 'transparent',
      backgroundColor: variant === 'filled' ? colors.primary : 'transparent',
      gap: 4,
    },
    text: {
      fontSize,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      color: variant === 'filled' ? colors.primaryForeground : colors.foreground,
    },
  });

  return (
    <Pressable style={styles.button} onPress={handlePress}>
      <DollarSign 
        size={iconSize} 
        color={variant === 'filled' ? colors.primaryForeground : colors.foreground} 
      />
      <Text style={styles.text}>Tip</Text>
    </Pressable>
  );
}