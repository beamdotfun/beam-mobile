import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

export interface SlideUpModalOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface SlideUpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: SlideUpModalOption[];
  showCancel?: boolean;
  cancelText?: string;
}

export function SlideUpModal({
  visible,
  onClose,
  title,
  subtitle,
  options,
  showCancel = true,
  cancelText = 'Cancel',
}: SlideUpModalProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
      marginBottom: 8,
      paddingHorizontal: 20,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    modalOptions: {
      paddingHorizontal: 20,
      gap: 12,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    modalOptionIconDestructive: {
      backgroundColor: colors.destructive + '15',
    },
    modalOptionContent: {
      flex: 1,
    },
    modalOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    modalOptionTitleDestructive: {
      color: colors.destructive,
    },
    modalOptionDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    modalCancelButton: {
      marginTop: 12,
      marginHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          
          <Text style={styles.modalTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.modalSubtitle}>{subtitle}</Text>
          )}

          <View style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.modalOption}
                onPress={option.onPress}
                activeOpacity={0.7}>
                <View 
                  style={[
                    styles.modalOptionIcon,
                    option.destructive && styles.modalOptionIconDestructive
                  ]}>
                  {option.icon}
                </View>
                <View style={styles.modalOptionContent}>
                  <Text 
                    style={[
                      styles.modalOptionTitle,
                      option.destructive && styles.modalOptionTitleDestructive
                    ]}>
                    {option.title}
                  </Text>
                  <Text style={styles.modalOptionDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {showCancel && (
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}