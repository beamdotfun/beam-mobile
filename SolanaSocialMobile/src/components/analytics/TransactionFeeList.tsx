import React from 'react';
import {View, Text, FlatList, Pressable} from 'react-native';
import {Clock, AlertCircle, CheckCircle} from 'lucide-react-native';
import {TransactionFee} from '../../types/fee-analytics';
import {formatSOL, formatRelativeTime} from '../../utils/formatting';

interface TransactionFeeListProps {
  transactions: TransactionFee[];
}

export function TransactionFeeList({transactions}: TransactionFeeListProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      posting: 'bg-blue-100 text-blue-700',
      voting: 'bg-purple-100 text-purple-700',
      tipping: 'bg-green-100 text-green-700',
      auction_bids: 'bg-yellow-100 text-yellow-700',
      auction_creation: 'bg-orange-100 text-orange-700',
      group_operations: 'bg-pink-100 text-pink-700',
      profile_updates: 'bg-gray-100 text-gray-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const renderTransaction = ({item}: {item: TransactionFee}) => (
    <View className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="font-medium text-sm">{item.description}</Text>
          <View className="flex-row items-center mt-1">
            <View
              className={`px-2 py-0.5 rounded ${getCategoryColor(
                item.category,
              )}`}>
              <Text className="text-xs font-medium">{item.category}</Text>
            </View>
            <View className="flex-row items-center ml-2">
              <Clock size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {formatRelativeTime(item.timestamp)}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="font-semibold text-sm">
            {formatSOL(item.totalFee)}
          </Text>
          {item.status === 'confirmed' ? (
            <CheckCircle size={14} color="#10B981" />
          ) : (
            <AlertCircle size={14} color="#EF4444" />
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between text-xs">
        <View className="flex-row space-x-3">
          <Text className="text-gray-500">Base: {formatSOL(item.baseFee)}</Text>
          <Text className="text-gray-500">
            Priority: {formatSOL(item.priorityFee)}
          </Text>
        </View>
        {item.wasOptimal === false && item.savings && (
          <View className="bg-yellow-50 px-2 py-1 rounded">
            <Text className="text-xs text-yellow-700">
              Could save {formatSOL(item.savings)}
            </Text>
          </View>
        )}
      </View>

      {item.signature && (
        <Pressable className="mt-2">
          <Text className="text-xs text-blue-600" numberOfLines={1}>
            {item.signature}
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (transactions.length === 0) {
    return (
      <View className="bg-white rounded-lg p-4">
        <Text className="text-gray-500 text-center">
          No transactions in this period
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="text-lg font-semibold mb-3">Transaction Fees</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
