import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import {X, Coins} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useSocialStore} from '../../store/socialStore';

interface SimpleTipModalProps {
  visible: boolean;
  onClose: () => void;
  recipientWallet: string;
  recipientName?: string;
  onSuccess?: () => void;
}

const QUICK_TIP_AMOUNTS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0];

export default function SimpleTipModal({
  visible,
  onClose,
  recipientWallet,
  recipientName,
  onSuccess,
}: SimpleTipModalProps) {
  const {colors} = useThemeStore();
  const {sendTip} = useSocialStore();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: '90%',
      maxWidth: 400,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
      padding: 4,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    userInfo: {
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    userWallet: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.background,
      fontFamily: 'Inter-Regular',
      marginBottom: 16,
    },
    quickAmounts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    quickAmount: {
      backgroundColor: colors.muted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    quickAmountSelected: {
      backgroundColor: colors.primary,
    },
    quickAmountText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    quickAmountTextSelected: {
      color: colors.primaryForeground,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.muted,
    },
    sendButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    cancelButtonText: {
      color: colors.foreground,
    },
    sendButtonText: {
      color: colors.primaryForeground,
    },
  });

  const handleSendTip = async () => {
    const tipAmount = parseFloat(amount);

    if (!tipAmount || tipAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid tip amount.');
      return;
    }

    setIsLoading(true);
    try {
      await sendTip({
        receiverWallet: recipientWallet,
        amount: tipAmount,
        message: message.trim(),
      });

      Alert.alert(
        'Tip Sent!',
        `Successfully sent ${tipAmount} SOL to ${recipientName || 'user'}.`,
      );
      setAmount('');
      setMessage('');
      onClose();
    } catch (error) {
      Alert.alert('Tip Failed', 'Failed to send tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Send Tip</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.userSection}>
            <Avatar fallback={recipientName?.charAt(0) || 'U'} size="md" />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {recipientName || 'Anonymous User'}
              </Text>
              <Text style={styles.userWallet}>
                {recipientWallet && recipientWallet.length > 10
                  ? `${recipientWallet.slice(0, 6)}...${recipientWallet.slice(-4)}`
                  : recipientWallet || 'Unknown'}
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Amount (SOL)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />

          <View style={styles.quickAmounts}>
            {QUICK_TIP_AMOUNTS.map(quickAmount => (
              <Pressable
                key={quickAmount}
                style={[
                  styles.quickAmount,
                  amount === quickAmount.toString() &&
                    styles.quickAmountSelected,
                ]}
                onPress={() => setAmount(quickAmount.toString())}
                disabled={isLoading}>
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() &&
                      styles.quickAmountTextSelected,
                  ]}>
                  {quickAmount} SOL
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Message (Optional)</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Add a nice message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={2}
            editable={!isLoading}
          />

          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.sendButton]}
              onPress={handleSendTip}
              disabled={isLoading}>
              <Text style={[styles.buttonText, styles.sendButtonText]}>
                {isLoading ? 'Sending...' : 'Send Tip'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
