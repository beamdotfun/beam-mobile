import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSolTransfer, useTipTransaction } from '../../hooks/useTransactions';

interface TransactionExampleProps {
  onClose?: () => void;
}

export function TransactionExample({ onClose }: TransactionExampleProps) {
  const { colors } = useThemeStore();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [useCustomRpc, setUseCustomRpc] = useState(false);
  const [customRpcUrl, setCustomRpcUrl] = useState('');

  // Using the transaction hooks
  const {
    sendSol,
    loading: transferLoading,
    error: transferError,
    signature: transferSignature,
    confirmationUrl: transferConfirmationUrl,
    clearError: clearTransferError,
    reset: resetTransfer,
  } = useSolTransfer();

  const {
    sendTip,
    loading: tipLoading,
    error: tipError,
    signature: tipSignature,
    confirmationUrl: tipConfirmationUrl,
    clearError: clearTipError,
    reset: resetTip,
  } = useTipTransaction();

  const handleSendSol = async () => {
    if (!recipientAddress || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await sendSol(
        recipientAddress,
        parseFloat(amount),
        memo || undefined,
        {
          useCustomRpc,
          customRpcUrl: useCustomRpc ? customRpcUrl : undefined,
          trackInApi: true,
        }
      );

      Alert.alert(
        'Transaction Sent!',
        `Transaction signature: ${result.signature.substring(0, 20)}...`,
        [
          {
            text: 'View on Explorer',
            onPress: () => {
              // Open explorer URL - you'd implement this with Linking.openURL
              console.log('Open explorer:', result.confirmationUrl);
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Transaction Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSendTip = async () => {
    if (!recipientAddress || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await sendTip(
        recipientAddress,
        parseFloat(amount),
        memo || 'Tip from Beam mobile app',
        {
          useCustomRpc,
          customRpcUrl: useCustomRpc ? customRpcUrl : undefined,
          trackInApi: true,
        }
      );

      Alert.alert(
        'Tip Sent!',
        `Tip sent successfully! Signature: ${result.signature.substring(0, 20)}...`
      );
    } catch (error) {
      Alert.alert('Tip Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.background,
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 12,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.card,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    switchLabel: {
      fontSize: 16,
      color: colors.foreground,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonDisabled: {
      backgroundColor: colors.muted,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      color: colors.mutedForeground,
    },
    errorText: {
      color: colors.destructive,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    successText: {
      color: colors.success,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    resultContainer: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
    },
    resultText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'monospace',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Examples</Text>

      {/* Form Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipient Address *</Text>
          <TextInput
            style={styles.input}
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            placeholder="Enter Solana public key"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (SOL) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.1"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Memo (Optional)</Text>
          <TextInput
            style={styles.input}
            value={memo}
            onChangeText={setMemo}
            placeholder="Transaction note"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>

      {/* RPC Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Configuration</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Use Custom RPC</Text>
          <Switch
            value={useCustomRpc}
            onValueChange={setUseCustomRpc}
            trackColor={{ false: colors.muted, true: colors.primary + '40' }}
            thumbColor={useCustomRpc ? colors.primary : colors.mutedForeground}
          />
        </View>

        {useCustomRpc && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Custom RPC URL</Text>
            <TextInput
              style={styles.input}
              value={customRpcUrl}
              onChangeText={setCustomRpcUrl}
              placeholder="https://api.devnet.solana.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <Text style={[styles.label, { fontSize: 12, opacity: 0.7 }]}>
          {useCustomRpc
            ? 'Transaction will be sent directly to your RPC'
            : 'Transaction will be sent through Beam backend'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <Pressable
          style={[
            styles.button,
            transferLoading && styles.buttonDisabled,
          ]}
          onPress={handleSendSol}
          disabled={transferLoading}
        >
          <Text
            style={[
              styles.buttonText,
              transferLoading && styles.buttonTextDisabled,
            ]}
          >
            {transferLoading ? 'Sending SOL...' : 'Send SOL Transfer'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            tipLoading && styles.buttonDisabled,
          ]}
          onPress={handleSendTip}
          disabled={tipLoading}
        >
          <Text
            style={[
              styles.buttonText,
              tipLoading && styles.buttonTextDisabled,
            ]}
          >
            {tipLoading ? 'Sending Tip...' : 'Send as Tip'}
          </Text>
        </Pressable>
      </View>

      {/* Results */}
      {transferError && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Transfer Error</Text>
          <Text style={[styles.resultText, { color: colors.destructive }]}>
            {transferError}
          </Text>
          <Pressable onPress={clearTransferError} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.primary }}>Clear Error</Text>
          </Pressable>
        </View>
      )}

      {transferSignature && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Transfer Success</Text>
          <Text style={styles.resultText}>Signature: {transferSignature}</Text>
          {transferConfirmationUrl && (
            <Text style={styles.resultText}>Explorer: {transferConfirmationUrl}</Text>
          )}
        </View>
      )}

      {tipError && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Tip Error</Text>
          <Text style={[styles.resultText, { color: colors.destructive }]}>
            {tipError}
          </Text>
          <Pressable onPress={clearTipError} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.primary }}>Clear Error</Text>
          </Pressable>
        </View>
      )}

      {tipSignature && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Tip Success</Text>
          <Text style={styles.resultText}>Signature: {tipSignature}</Text>
          {tipConfirmationUrl && (
            <Text style={styles.resultText}>Explorer: {tipConfirmationUrl}</Text>
          )}
        </View>
      )}
    </View>
  );
}