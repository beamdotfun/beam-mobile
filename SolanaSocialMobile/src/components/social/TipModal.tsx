import React, {useState} from 'react';
import {View, Text, Modal, Pressable, Alert} from 'react-native';
import {X, Coins} from 'lucide-react-native';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useSocialStore} from '../../store/socialStore';
import {cn} from '../../utils/cn';

interface TipModalProps {
  visible: boolean;
  onClose: () => void;
  recipientWallet: string;
  recipientName?: string;
}

const QUICK_TIP_AMOUNTS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0];

export default function TipModal({
  visible,
  onClose,
  recipientWallet,
  recipientName,
}: TipModalProps) {
  const {colors} = useThemeStore();
  const {sendTip} = useSocialStore();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    const tipAmount = parseFloat(amount);

    if (!tipAmount || tipAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid tip amount.');
      return;
    }

    if (tipAmount > 10) {
      Alert.alert('Amount Too Large', 'Maximum tip amount is 10 SOL.');
      return;
    }

    setLoading(true);

    try {
      await sendTip({
        receiverWallet: recipientWallet,
        amount: tipAmount,
        message: message.trim() || undefined,
      });

      Alert.alert('Tip Sent!', `Successfully sent ${tipAmount} SOL tip.`);
      onClose();
      setAmount('');
      setMessage('');
    } catch (error) {
      console.error('Tip failed:', error);
      Alert.alert('Tip Failed', 'Failed to send tip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setAmount('');
      setMessage('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle>
              <View className="flex-row items-center">
                <Coins size={24} color={colors.tip} />
                <Text className="text-xl font-bold text-foreground ml-2">
                  Send Tip
                </Text>
              </View>
            </CardTitle>

            <Pressable onPress={handleClose} disabled={loading}>
              <X size={24} color={colors.mutedForeground} />
            </Pressable>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Recipient Info */}
            <View className="flex-row items-center p-3 bg-muted rounded-lg">
              <Avatar
                fallback={
                  recipientName?.charAt(0) || recipientWallet.slice(0, 2)
                }
                size="sm"
                className="mr-3"
              />
              <View>
                <Text className="text-foreground font-medium">
                  {recipientName || 'Anonymous User'}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {`${recipientWallet.slice(0, 6)}...${recipientWallet.slice(
                    -4,
                  )}`}
                </Text>
              </View>
            </View>

            {/* Quick Amount Buttons */}
            <View>
              <Text className="text-foreground font-medium mb-2">
                Quick Amounts (SOL)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {QUICK_TIP_AMOUNTS.map(quickAmount => (
                  <Pressable
                    key={quickAmount}
                    onPress={() => handleQuickAmount(quickAmount)}
                    className={cn(
                      'px-3 py-2 rounded-full border',
                      amount === quickAmount.toString()
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border',
                    )}>
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        amount === quickAmount.toString()
                          ? 'text-primary-foreground'
                          : 'text-foreground',
                      )}>
                      {quickAmount}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Custom Amount */}
            <Input
              label="Custom Amount (SOL)"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!loading}
            />

            {/* Optional Message */}
            <Input
              label="Message (Optional)"
              value={message}
              onChangeText={setMessage}
              placeholder="Say something nice..."
              multiline
              numberOfLines={3}
              editable={!loading}
            />

            {/* Actions */}
            <View className="flex-row space-x-3 pt-2">
              <Button
                variant="outline"
                onPress={handleClose}
                disabled={loading}
                className="flex-1">
                Cancel
              </Button>

              <Button
                onPress={handleTip}
                disabled={!amount || loading}
                className="flex-1">
                {loading ? 'Sending...' : `Tip ${amount} SOL`}
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}
