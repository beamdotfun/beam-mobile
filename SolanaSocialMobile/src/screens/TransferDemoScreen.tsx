import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalletStore } from '../store/wallet';
import { SimpleTransferService } from '../services/demo/simpleTransferService';
import { ConsistentHeader } from '../components/navigation/ConsistentHeader';
import { useThemeStore } from '../store/themeStore';
import { useNavigation } from '@react-navigation/native';
import { Send, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useSocialStore } from '../store/socialStore';

export function TransferDemoScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const walletStore = useWalletStore();
  const { publicKey, connected, walletLabel } = walletStore;
  const { stopReputationPolling } = useSocialStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.0001'); // Default 0.0001 SOL (100,000 lamports)
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stop reputation polling while on this screen to reduce log noise
  React.useEffect(() => {
    console.log('🔇 TransferDemo: Stopping reputation polling for cleaner logs');
    stopReputationPolling();
    
    return () => {
      // Polling will restart when user goes back to feed
    };
  }, [stopReputationPolling]);

  const handleTransfer = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    if (!recipient) {
      setError('Please enter a recipient address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get fresh state from wallet store
      const currentWalletState = useWalletStore.getState();
      const { adapter, publicKey: currentPublicKey } = currentWalletState;
      
      if (!currentPublicKey) {
        throw new Error('No wallet connected');
      }
      
      const transferService = new SimpleTransferService(adapter);
      
      // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
      const solAmount = parseFloat(amount);
      const lamports = Math.floor(solAmount * 1_000_000_000);
      
      console.log('🚀 Starting transfer:', {
        from: currentPublicKey.toString(),
        to: recipient,
        solAmount: solAmount,
        lamports: lamports,
        lampottsType: typeof lamports,
        walletLabel: currentWalletState.walletLabel,
      });

      const signature = await transferService.transfer(
        currentPublicKey.toString(),
        recipient,
        lamports
      );

      setResult(`Transfer successful! Transaction: ${signature.slice(0, 8)}...`);
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedForeground,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    walletDisplay: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    walletAddress: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 12,
      color: colors.foreground,
      lineHeight: 18,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: colors.muted,
    },
    buttonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    errorContainer: {
      backgroundColor: colors.destructive + '10',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    errorText: {
      color: colors.destructive,
      fontSize: 14,
      flex: 1,
      marginLeft: 8,
    },
    successContainer: {
      backgroundColor: '#10B98110',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    successText: {
      color: '#10B981',
      fontSize: 14,
      flex: 1,
      marginLeft: 8,
    },
    noteContainer: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      marginTop: 32,
    },
    noteTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
    },
    noteText: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ConsistentHeader 
        title="Transfer SOL" 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 16 }}>
            <Text style={styles.sectionTitle}>From</Text>
            <View style={styles.walletDisplay}>
              <Text style={styles.walletAddress}>
                {publicKey?.toString() || 'Not connected'}
              </Text>
              {connected && (
                <Text style={[styles.noteText, { marginTop: 8, fontSize: 12 }]}>
                  Connected: {walletLabel || 'Unknown Wallet'}
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>To</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Solana wallet address"
                placeholderTextColor={colors.mutedForeground}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.sectionTitle}>Amount (SOL)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="0.0001"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              onPress={handleTransfer}
              disabled={loading || !publicKey}
              style={[
                styles.button,
                (loading || !publicKey) && styles.buttonDisabled
              ]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Send size={20} color={colors.background} />
                  <Text style={styles.buttonText}>Send SOL</Text>
                </>
              )}
            </TouchableOpacity>

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={colors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {result && (
              <View style={styles.successContainer}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.successText}>{result}</Text>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}