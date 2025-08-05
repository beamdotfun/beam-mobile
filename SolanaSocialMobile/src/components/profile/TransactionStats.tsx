import React from 'react';
import {View} from 'react-native';
import {Text, Card} from '../ui';
import {
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  MessageSquare,
  Coins,
} from 'lucide-react-native';
import {TransactionStats as Stats} from '../../types/transactions';
import {formatSOL} from '../../utils/formatting';

interface TransactionStatsProps {
  stats: Stats;
}

export function TransactionStats({stats}: TransactionStatsProps) {
  const statCards = [
    {
      label: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: Activity,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Fees Paid',
      value: `${formatSOL(stats.totalFees)} SOL`,
      icon: DollarSign,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Tips Sent',
      value: stats.totalTipsSent.toLocaleString(),
      icon: ArrowUpRight,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      label: 'Posts Created',
      value: stats.totalPostsCreated.toLocaleString(),
      icon: MessageSquare,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  // Additional detailed stats
  const detailedStats = [
    {
      label: 'Tips Received',
      value: stats.totalTipsReceived.toLocaleString(),
      icon: ArrowDownLeft,
      color: 'text-emerald-500',
    },
    {
      label: 'Votes Cast',
      value: stats.totalVotesCast.toLocaleString(),
      icon: TrendingUp,
      color: 'text-indigo-500',
    },
    {
      label: 'Bids Placed',
      value: stats.totalBidsPlaced.toLocaleString(),
      icon: Coins,
      color: 'text-amber-500',
    },
  ];

  return (
    <Card className="mx-4 mb-4 p-4">
      <Text className="font-semibold mb-3">Activity Overview</Text>

      {/* Main Stats Grid */}
      <View className="flex-row flex-wrap -mx-1 mb-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <View key={index} className="w-1/2 px-1 mb-2">
              <View className={`${stat.bg} rounded-lg p-3`}>
                <View className="flex-row items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <Text className="text-xs text-muted-foreground">
                    {stat.label}
                  </Text>
                </View>
                <Text className="text-lg font-semibold">{stat.value}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Detailed Stats */}
      <View className="border-t border-border pt-3">
        <Text className="font-medium text-sm mb-2 text-muted-foreground">
          Additional Activity
        </Text>
        <View className="flex-row justify-between">
          {detailedStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} className="flex-1 items-center">
                <View className="flex-row items-center gap-1 mb-1">
                  <Icon className={`h-3 w-3 ${stat.color}`} />
                  <Text className="text-xs text-muted-foreground">
                    {stat.label}
                  </Text>
                </View>
                <Text className="text-sm font-medium">{stat.value}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Transaction Type Breakdown */}
      <View className="border-t border-border pt-3 mt-3">
        <Text className="font-medium text-sm mb-2 text-muted-foreground">
          Transaction Breakdown
        </Text>
        <View className="space-y-1">
          {Object.entries(stats.byType)
            .filter(([_, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) // Show top 5 transaction types
            .map(([type, count]) => (
              <View
                key={type}
                className="flex-row justify-between items-center">
                <Text className="text-sm capitalize">
                  {type.replace(/_/g, ' ')}
                </Text>
                <Text className="text-sm font-medium">{count}</Text>
              </View>
            ))}
        </View>
      </View>

      {/* Status Summary */}
      <View className="border-t border-border pt-3 mt-3">
        <Text className="font-medium text-sm mb-2 text-muted-foreground">
          Status Summary
        </Text>
        <View className="flex-row justify-between">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <View key={status} className="items-center">
              <Text
                className={`text-xs capitalize ${
                  status === 'confirmed'
                    ? 'text-green-600'
                    : status === 'pending'
                    ? 'text-yellow-600'
                    : status === 'failed'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                {status}
              </Text>
              <Text className="text-sm font-medium">{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
