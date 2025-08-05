import React, {useEffect, useState} from 'react';
import {View, FlatList, RefreshControl, TouchableOpacity} from 'react-native';
import {
  Text,
  Card,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '../../components/ui';
import {
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Building,
  Gavel,
  Filter,
  Download,
  Calendar,
  Search,
} from 'lucide-react-native';
import {useTransactionStore} from '../../store/transactionStore';
import {useAuthStore} from '../../store/auth';
import {
  Transaction,
  TransactionType,
  TRANSACTION_TYPE_METADATA,
  TRANSACTION_STATUS_COLORS,
} from '@/types/transactions';
import {formatDistanceToNow} from 'date-fns';
import {formatSOL} from '../../utils/formatting';

// Sub-components
import {TransactionFilterSheet} from '../../components/profile/TransactionFilterSheet';
import {TransactionDetailsModal} from '../../components/profile/TransactionDetailsModal';
import {TransactionStats} from '../../components/profile/TransactionStats';

export function TransactionHistory() {
  const {user} = useAuthStore();
  const {
    transactions,
    stats,
    loading,
    refreshing,
    filter,
    fetchTransactions,
    refreshTransactions,
    loadMore,
    exportTransactions,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  } = useTransactionStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.wallet) {
      fetchTransactions(user.wallet);
      subscribeToUpdates(user.wallet);
    }

    return () => {
      unsubscribeFromUpdates();
    };
  }, [user?.wallet]);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const url = await exportTransactions(format, user?.wallet);
      // TODO: Handle download or share
      console.log('Export URL:', url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    const iconMap = {
      create_post: MessageSquare,
      create_vote: ThumbsUp,
      send_tip: DollarSign,
      create_brand: Building,
      create_bid: Gavel,
      initialize_user: ArrowUpRight,
      update_profile: ArrowUpRight,
      update_brand: Building,
      claim_payout: DollarSign,
      create_report: ArrowUpRight,
    };
    return iconMap[type] || ArrowUpRight;
  };

  const getTransactionColor = (type: TransactionType) => {
    return TRANSACTION_TYPE_METADATA[type]?.color || 'text-gray-500';
  };

  const renderTransaction = ({item}: {item: Transaction}) => {
    const Icon = getTransactionIcon(item.type);
    const color = getTransactionColor(item.type);
    const statusConfig = TRANSACTION_STATUS_COLORS[item.status];

    return (
      <TouchableOpacity onPress={() => setSelectedTransaction(item)}>
        <Card className="mx-4 mb-3 p-4">
          <View className="flex-row items-center">
            {/* Icon */}
            <View
              className={`w-12 h-12 rounded-full ${statusConfig.bg} items-center justify-center mr-3`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-semibold">{item.title}</Text>
                <Badge variant={statusConfig.badge}>{item.status}</Badge>
              </View>

              <Text className="text-sm text-muted-foreground mb-1">
                {item.description}
              </Text>

              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </Text>

                {item.amount && (
                  <Text className="text-sm font-medium">
                    {formatSOL(item.amount)} SOL
                  </Text>
                )}
              </View>

              {/* Transaction signature (truncated) */}
              <Text className="text-xs text-muted-foreground mt-1">
                {item.signature.slice(0, 8)}...{item.signature.slice(-8)}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Stats Card */}
      {stats && <TransactionStats stats={stats} />}

      {/* Filters Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="font-semibold">
          {transactions.length} Transactions
          {Object.keys(filter).length > 0 && ' (filtered)'}
        </Text>

        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="outline"
            onPress={() => setShowFilters(true)}>
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={exporting}>
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onPress={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View className="flex-1 justify-center items-center p-8">
      <ArrowUpRight className="h-16 w-16 text-muted-foreground mb-4" />
      <Text className="text-lg font-medium mb-2">No transactions yet</Text>
      <Text className="text-muted-foreground text-center">
        Your blockchain transactions will appear here
      </Text>
    </View>
  );

  const LoadingSkeleton = () => (
    <View className="px-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="mb-3 p-4">
          <View className="flex-row items-center">
            <Skeleton className="w-12 h-12 rounded-full mr-3" />
            <View className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-24" />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.signature}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={loading ? LoadingSkeleton : EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTransactions}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{flexGrow: 1, paddingBottom: 100}}
      />

      {/* Filter Sheet */}
      <TransactionFilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilter={filter}
        onApply={newFilter => {
          useTransactionStore.getState().setFilter(newFilter);
          setShowFilters(false);
        }}
      />

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          visible={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </View>
  );
}
