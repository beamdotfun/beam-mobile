import React, {useState, useEffect} from 'react';
import {View, Modal, TouchableOpacity, Alert} from 'react-native';
import {Text, Button, Input, Card} from '../ui';
import {X, DollarSign, TrendingUp} from 'lucide-react-native';
import {formatSOL} from '../../utils/formatting';

interface PlaceBidModalProps {
  visible: boolean;
  onClose: () => void;
  currentBid: number;
  minIncrement: number;
  onBid: (amount: number) => Promise<void>;
}

export function PlaceBidModal({
  visible,
  onClose,
  currentBid,
  minIncrement,
  onBid,
}: PlaceBidModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const minBid = currentBid + minIncrement;

  useEffect(() => {
    if (visible) {
      setBidAmount(minBid.toString());
    }
  }, [visible, minBid]);

  const handleBid = async () => {
    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount < minBid) {
      Alert.alert('Invalid Bid', `Minimum bid is ${formatSOL(minBid)} SOL`);
      return;
    }

    setLoading(true);
    try {
      await onBid(amount);
      onClose();
    } catch (error) {
      Alert.alert(
        'Bid Failed',
        error instanceof Error ? error.message : 'Failed to place bid',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBid = (multiplier: number) => {
    const amount = minBid * multiplier;
    setBidAmount(amount.toString());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold">Place Bid</Text>
            <TouchableOpacity onPress={onClose}>
              <X className="h-6 w-6" />
            </TouchableOpacity>
          </View>

          {/* Current Bid Info */}
          <Card className="p-4 mb-6 bg-muted/50">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-muted-foreground">
                  Current Bid
                </Text>
                <Text className="text-lg font-semibold">
                  {formatSOL(currentBid)} SOL
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted-foreground">
                  Minimum Bid
                </Text>
                <Text className="text-lg font-semibold text-primary">
                  {formatSOL(minBid)} SOL
                </Text>
              </View>
            </View>
          </Card>

          {/* Bid Amount Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">
              Your Bid Amount (SOL)
            </Text>
            <View className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
              <Input
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder="0.00"
                keyboardType="numeric"
                className="pl-10 text-lg"
              />
            </View>
          </View>

          {/* Quick Bid Options */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2">Quick Bid</Text>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleQuickBid(1)}
                className="flex-1">
                Min: {formatSOL(minBid)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleQuickBid(1.1)}
                className="flex-1">
                +10%: {formatSOL(minBid * 1.1)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleQuickBid(1.25)}
                className="flex-1">
                +25%: {formatSOL(minBid * 1.25)}
              </Button>
            </View>
          </View>

          {/* Bid Info */}
          <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 mb-6">
            <View className="flex-row items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-blue-900 dark:text-blue-100">
                  Your bid will be processed on the Solana blockchain. you have
                  sufficient SOL in your wallet for the bid amount plus
                  transaction fees.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              onPress={onClose}
              className="flex-1"
              disabled={loading}>
              Cancel
            </Button>
            <Button onPress={handleBid} className="flex-1" disabled={loading}>
              {loading
                ? 'Placing Bid...'
                : `Bid ${formatSOL(parseFloat(bidAmount) || 0)} SOL`}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
