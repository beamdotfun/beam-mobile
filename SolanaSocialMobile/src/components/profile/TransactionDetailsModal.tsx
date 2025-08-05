import React, {useState} from 'react';
import {View, ScrollView, TouchableOpacity, Share} from 'react-native';
import {
  Text,
  Card,
  Badge,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Separator,
} from '../ui';
import {
  ExternalLink,
  Copy,
  Share2,
  Clock,
  Hash,
  DollarSign,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
} from 'lucide-react-native';
import {
  Transaction,
  TRANSACTION_TYPE_METADATA,
  TRANSACTION_STATUS_COLORS,
} from '@/types/transactions';
import {format} from 'date-fns';
import {formatSOL} from '../../utils/formatting';
import {Clipboard} from 'react-native';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  visible: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({
  transaction,
  visible,
  onClose,
}: TransactionDetailsModalProps) {
  const [copying, setCopying] = useState<string | null>(null);

  const metadata = TRANSACTION_TYPE_METADATA[transaction.type];
  const statusConfig = TRANSACTION_STATUS_COLORS[transaction.status];

  const handleCopy = async (text: string, label: string) => {
    setCopying(label);
    try {
      await Clipboard.setString(text);
      // TODO: Show toast notification
      console.log(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setTimeout(() => setCopying(null), 1000);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Transaction: ${transaction.title}\nSignature: ${transaction.signature}\nStatus: ${transaction.status}`,
        title: 'Transaction Details',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const openExplorer = () => {
    // TODO: Open Solana explorer with transaction signature
    const explorerUrl = `https://explorer.solana.com/tx/${transaction.signature}`;
    console.log('Opening explorer:', explorerUrl);
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, 'MMM d, yyyy'),
      time: format(date, 'h:mm:ss a'),
    };
  };

  const createdDateTime = formatDateTime(transaction.createdAt);
  const confirmedDateTime = transaction.confirmedAt
    ? formatDateTime(transaction.confirmedAt)
    : null;

  return (
    <Modal open={visible} onOpenChange={onClose}>
      <ModalContent className="max-h-[80%]">
        <ModalHeader>
          <ModalTitle>Transaction Details</ModalTitle>
        </ModalHeader>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Transaction Header */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <View
                className={`w-12 h-12 rounded-full ${statusConfig.bg} items-center justify-center mr-3`}>
                <View className={`h-6 w-6 ${metadata.color}`}>
                  {/* TODO: Add proper icon component */}
                  <Text>{metadata.icon}</Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-lg">
                  {transaction.title}
                </Text>
                <Text className="text-muted-foreground">
                  {metadata.description}
                </Text>
              </View>
              <View className="items-end">
                {getStatusIcon()}
                <Badge variant={statusConfig.badge} className="mt-1">
                  {transaction.status}
                </Badge>
              </View>
            </View>

            <Text className="text-muted-foreground">
              {transaction.description}
            </Text>
          </Card>

          {/* Transaction Details */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Transaction Information</Text>

            {/* Signature */}
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">
                Signature
              </Text>
              <TouchableOpacity
                onPress={() => handleCopy(transaction.signature, 'Signature')}
                className="flex-row items-center gap-2">
                <Text className="font-mono text-sm flex-1">
                  {transaction.signature}
                </Text>
                <Copy
                  className={`h-4 w-4 ${
                    copying === 'Signature'
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                  }`}
                />
              </TouchableOpacity>
            </View>

            <Separator className="my-3" />

            {/* Blockchain Data */}
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Slot</Text>
                <Text className="text-sm font-medium">
                  {transaction.slot.toLocaleString()}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">
                  Block Time
                </Text>
                <Text className="text-sm font-medium">
                  {transaction.blockTime}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">
                  Transaction Fee
                </Text>
                <Text className="text-sm font-medium">
                  {formatSOL(transaction.fee / 1000000000)} SOL
                </Text>
              </View>

              {transaction.amount && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Amount</Text>
                  <Text className="text-sm font-medium text-green-600">
                    {formatSOL(transaction.amount)} SOL
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Wallet Information */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Wallet Information</Text>

            <View className="space-y-3">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">
                  From Wallet
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleCopy(transaction.fromWallet, 'From Wallet')
                  }
                  className="flex-row items-center gap-2">
                  <Text className="font-mono text-sm flex-1">
                    {transaction.fromWallet}
                  </Text>
                  <Copy
                    className={`h-4 w-4 ${
                      copying === 'From Wallet'
                        ? 'text-green-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </TouchableOpacity>
              </View>

              {transaction.toWallet && (
                <View>
                  <Text className="text-sm text-muted-foreground mb-1">
                    To Wallet
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleCopy(transaction.toWallet!, 'To Wallet')
                    }
                    className="flex-row items-center gap-2">
                    <Text className="font-mono text-sm flex-1">
                      {transaction.toWallet}
                    </Text>
                    <Copy
                      className={`h-4 w-4 ${
                        copying === 'To Wallet'
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Card>

          {/* Transaction Data */}
          {transaction.data && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold mb-3">Additional Data</Text>

              <View className="space-y-3">
                {transaction.data.postContent && (
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Post Content
                    </Text>
                    <Text className="text-sm">
                      {transaction.data.postContent}
                    </Text>
                  </View>
                )}

                {transaction.data.recipientUser && (
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Recipient
                    </Text>
                    <Text className="text-sm font-mono">
                      {transaction.data.recipientUser}
                    </Text>
                  </View>
                )}

                {transaction.data.tipMessage && (
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Tip Message
                    </Text>
                    <Text className="text-sm">
                      {transaction.data.tipMessage}
                    </Text>
                  </View>
                )}

                {transaction.data.voteType && (
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Vote Type
                    </Text>
                    <Text className="text-sm capitalize">
                      {transaction.data.voteType}
                    </Text>
                  </View>
                )}

                {transaction.data.brandName && (
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Brand Name
                    </Text>
                    <Text className="text-sm">
                      {transaction.data.brandName}
                    </Text>
                  </View>
                )}

                {transaction.data.bidAmount && (
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Bid Amount
                    </Text>
                    <Text className="text-sm font-medium">
                      {formatSOL(transaction.data.bidAmount)} SOL
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Timestamps */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Timeline</Text>

            <View className="space-y-3">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">
                  Created
                </Text>
                <Text className="text-sm">
                  {createdDateTime.date} at {createdDateTime.time}
                </Text>
              </View>

              {confirmedDateTime && (
                <View>
                  <Text className="text-sm text-muted-foreground mb-1">
                    Confirmed
                  </Text>
                  <Text className="text-sm">
                    {confirmedDateTime.date} at {confirmedDateTime.time}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </ScrollView>

        <ModalFooter>
          <View className="flex-row gap-2 w-full">
            <Button variant="outline" onPress={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button variant="outline" onPress={openExplorer} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Explorer
            </Button>

            <Button onPress={onClose} className="flex-1">
              Close
            </Button>
          </View>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
