import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, Alert, Modal, Pressable} from 'react-native';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {Input} from '../ui/input';
import {useThemeStore} from '../../store/themeStore';
import {useAuctionStore} from '../../store/auctionStore';
import {useWalletStore} from '../../store/wallet';
import {Auction, BidRequest} from '../../types/auction';
import {formatDistanceToNow} from 'date-fns';

interface BiddingInterfaceProps {
  auction: Auction;
  isVisible: boolean;
  onClose: () => void;
  onBidPlaced?: (success: boolean) => void;
}

export function BiddingInterface({
  auction,
  isVisible,
  onClose,
  onBidPlaced,
}: BiddingInterfaceProps) {
  const {colors} = useThemeStore();
  const {placeBid, isLoading} = useAuctionStore();
  const {wallet, balance} = useWalletStore();

  const [bidAmount, setBidAmount] = useState<string>('');
  const [isAutoBid, setIsAutoBid] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const minBid = auction.currentBid + auction.bidIncrement;
  const suggestedBids = [
    minBid,
    minBid + auction.bidIncrement,
    minBid + auction.bidIncrement * 2,
    minBid + auction.bidIncrement * 5,
  ];

  useEffect(() => {
    if (isVisible) {
      setBidAmount(minBid.toFixed(3));
      setIsAutoBid(false);
      setMaxAutoBid('');
      setShowConfirmation(false);
    }
  }, [isVisible, minBid]);

  const validateBid = (): boolean => {
    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return false;
    }

    if (amount < minBid) {
      Alert.alert('Bid Too Low', `Minimum bid is ${minBid.toFixed(3)} SOL`);
      return false;
    }

    if (amount > (balance || 0)) {
      Alert.alert(
        'Insufficient Balance',
        'You do not have enough SOL for this bid',
      );
      return false;
    }

    if (isAutoBid) {
      const maxAmount = parseFloat(maxAutoBid);
      if (isNaN(maxAmount) || maxAmount < amount) {
        Alert.alert(
          'Invalid Auto-Bid',
          'Max auto-bid must be greater than or equal to your bid',
        );
        return false;
      }
    }

    return true;
  };

  const handleBidPress = () => {
    if (!validateBid()) {return;}
    setShowConfirmation(true);
  };

  const handleConfirmBid = async () => {
    try {
      setShowConfirmation(false);

      const bidRequest: BidRequest = {
        auctionId: auction.auctionId,
        amount: parseFloat(bidAmount),
        isAutoBid,
        maxAmount: isAutoBid ? parseFloat(maxAutoBid) : undefined,
      };

      const response = await placeBid(bidRequest);

      if (response.success) {
        Alert.alert(
          'Bid Placed Successfully!',
          response.isWinning
            ? 'You are now the highest bidder!'
            : 'Your bid has been placed.',
          [{text: 'OK', onPress: onClose}],
        );
        onBidPlaced?.(true);
      } else {
        Alert.alert('Bid Failed', response.error || 'Failed to place bid');
        onBidPlaced?.(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place bid. Please try again.');
      onBidPlaced?.(false);
    }
  };

  const formatTimeRemaining = (endTime: string): string => {
    const end = new Date(endTime);
    const now = new Date();
    const remaining = end.getTime() - now.getTime();

    if (remaining <= 0) {return 'Ended';}

    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {return `${days}d ${hours % 24}h`;}
    if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
    if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
    return `${seconds}s`;
  };

  const BidConfirmationModal = () => (
    <Modal
      visible={showConfirmation}
      transparent
      animationType="slide"
      onRequestClose={() => setShowConfirmation(false)}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-xl p-6">
          <Text className="text-xl font-bold text-foreground mb-4 text-center">
            Confirm Your Bid
          </Text>

          <Card className="mb-6">
            <CardContent className="p-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground">Auction:</Text>
                <Text className="text-foreground font-medium" numberOfLines={1}>
                  {auction.title}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground">Your Bid:</Text>
                <Text className="text-2xl font-bold text-primary">
                  {bidAmount} SOL
                </Text>
              </View>

              {isAutoBid && (
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-foreground">Max Auto-Bid:</Text>
                  <Text className="text-lg font-semibold text-warning">
                    {maxAutoBid} SOL
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground">Current Bid:</Text>
                <Text className="text-muted-foreground">
                  {auction.currentBid.toFixed(3)} SOL
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-foreground">Your Balance:</Text>
                <Text className="text-muted-foreground">
                  {balance?.toFixed(3) || '0.000'} SOL
                </Text>
              </View>
            </CardContent>
          </Card>

          <View className="flex-row space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => setShowConfirmation(false)}>
              <Text className="text-muted-foreground">Cancel</Text>
            </Button>

            <Button
              className="flex-1"
              onPress={handleConfirmBid}
              disabled={isLoading}>
              <Text className="text-primary-foreground">
                {isLoading ? 'Placing Bid...' : 'Confirm Bid'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" onPress={onClose}>
            <Text className="text-muted-foreground">Cancel</Text>
          </Button>
          <Text className="text-lg font-semibold text-foreground">
            Place Bid
          </Text>
          <View className="w-16" />
        </View>

        <View className="flex-1 p-4">
          {/* Auction Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text
                    className="text-lg font-semibold text-foreground"
                    numberOfLines={1}>
                    {auction.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {auction.brandName}
                  </Text>
                </View>

                  variant={
                    auction.status === 'ending_soon' ? 'destructive' : 'default'
                  }>
                  <Text className="text-xs">
                    {formatTimeRemaining(auction.endTime)}
                  </Text>
                </Badge>
              </View>

              <View className="flex-row justify-between">
                <View>
                  <Text className="text-2xl font-bold text-foreground">
                    {auction.currentBid.toFixed(3)} SOL
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Current Bid
                  </Text>
                </View>

                <View className="items-end">
                  <View className="flex-row items-center">
                    <Users size={14} color={colors.mutedForeground} />
                    <Text className="text-sm text-muted-foreground ml-1">
                      {auction.totalBidders} bidders
                    </Text>
                  </View>
                  <Text className="text-xs text-success">
                    +{auction.userPayout.toFixed(3)} SOL reward
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Bid Amount Input */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Your Bid Amount
              </Text>

              <View className="flex-row items-center mb-3">
                <TextInput
                  className="flex-1 text-2xl font-bold text-foreground border border-border rounded-lg px-3 py-2 bg-input"
                  style={{color: colors.foreground}}
                  placeholder={minBid.toFixed(3)}
                  placeholderTextColor={colors.mutedForeground}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="decimal-pad"
                />
                <Text className="text-lg text-muted-foreground ml-2">SOL</Text>
              </View>

              <Text className="text-sm text-muted-foreground mb-3">
                Minimum bid: {minBid.toFixed(3)} SOL
              </Text>

              {/* Quick Bid Buttons */}
              <View className="flex-row flex-wrap gap-2">
                {suggestedBids.map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onPress={() => setBidAmount(amount.toFixed(3))}>
                    <Text className="text-muted-foreground text-xs">
                      {amount.toFixed(3)}
                    </Text>
                  </Button>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Auto-Bid Settings */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-foreground">
                  Auto-Bid
                </Text>
                <Pressable
                  onPress={() => setIsAutoBid(!isAutoBid)}
                  className={`w-12 h-6 rounded-full p-1 ${
                    isAutoBid ? 'bg-primary' : 'bg-muted'
                  }`}>
                  <View
                    className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                      isAutoBid ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </Pressable>
              </View>

              <Text className="text-sm text-muted-foreground mb-3">
                Automatically place bids up to your maximum amount
              </Text>

              {isAutoBid && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Maximum Auto-Bid Amount
                  </Text>
                  <View className="flex-row items-center">
                    <TextInput
                      className="flex-1 text-lg text-foreground border border-border rounded-lg px-3 py-2 bg-input"
                      style={{color: colors.foreground}}
                      placeholder={(minBid * 2).toFixed(3)}
                      placeholderTextColor={colors.mutedForeground}
                      value={maxAutoBid}
                      onChangeText={setMaxAutoBid}
                      keyboardType="decimal-pad"
                    />
                    <Text className="text-lg text-muted-foreground ml-2">
                      SOL
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Balance Warning */}
          {parseFloat(bidAmount) > (balance || 0) && (
            <Card className="mb-4 border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <View className="flex-row items-center">
                  <AlertTriangle size={20} color={colors.destructive} />
                  <Text className="text-destructive ml-2 flex-1">
                    Insufficient balance. You need{' '}
                    {(parseFloat(bidAmount) - (balance || 0)).toFixed(3)} more
                    SOL.
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Place Bid Button */}
          <Button
            onPress={handleBidPress}
            disabled={
              isLoading ||
              !bidAmount ||
              parseFloat(bidAmount) < minBid ||
              parseFloat(bidAmount) > (balance || 0)
            }
            className="w-full">
            <Zap size={20} color={colors.primaryForeground} />
            <Text className="text-primary-foreground ml-2 text-lg font-semibold">
              Place Bid - {bidAmount || '0.000'} SOL
            </Text>
          </Button>

          {/* Auction Details */}
          <View className="mt-6 pt-4 border-t border-border">
            <Text className="text-sm text-muted-foreground text-center">
              Expected reach: {auction.expectedReach.toLocaleString()} users
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Quality score: {auction.qualityScore}/10
            </Text>
          </View>
        </View>

        <BidConfirmationModal />
      </View>
    </Modal>
  );
}
