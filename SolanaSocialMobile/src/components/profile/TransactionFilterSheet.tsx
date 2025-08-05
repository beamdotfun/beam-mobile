import React, {useState} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {
  Text,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Checkbox,
  Label,
  Input,
} from '../ui';
import {
  TransactionFilter,
  TransactionType,
  TransactionStatus,
  TRANSACTION_TYPE_METADATA,
  DATE_PRESETS,
  DatePreset,
} from '@/types/transactions';
import {format} from 'date-fns';
import {Calendar} from 'lucide-react-native';

interface TransactionFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  currentFilter: TransactionFilter;
  onApply: (filter: TransactionFilter) => void;
}

export function TransactionFilterSheet({
  visible,
  onClose,
  currentFilter,
  onApply,
}: TransactionFilterSheetProps) {
  const [filter, setFilter] = useState<TransactionFilter>(currentFilter);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(
    null,
  );

  const transactionTypes: {type: TransactionType; label: string}[] = [
    {type: 'create_post', label: 'Posts'},
    {type: 'create_vote', label: 'Votes'},
    {type: 'send_tip', label: 'Tips'},
    {type: 'create_brand', label: 'Brand Operations'},
    {type: 'create_bid', label: 'Auction Bids'},
    {type: 'update_profile', label: 'Profile Updates'},
    {type: 'initialize_user', label: 'Account Initialization'},
    {type: 'update_brand', label: 'Brand Updates'},
    {type: 'claim_payout', label: 'Payout Claims'},
    {type: 'create_report', label: 'Reports'},
  ];

  const transactionStatuses: TransactionStatus[] = [
    'confirmed',
    'pending',
    'failed',
    'expired',
  ];

  const handleTypeToggle = (type: TransactionType) => {
    const types = filter.types || [];
    const newTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type];

    setFilter({...filter, types: newTypes});
  };

  const handleStatusChange = (status: TransactionStatus) => {
    setFilter({
      ...filter,
      status: filter.status === status ? undefined : status,
    });
  };

  const handleDatePreset = (preset: DatePreset) => {
    const now = new Date();
    const presetConfig = DATE_PRESETS[preset];

    let start: Date;
    if (preset === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
    } else if (preset === 'all') {
      start = new Date(0); // Unix epoch
    } else {
      start = new Date(
        now.getTime() - (presetConfig.days || 30) * 24 * 60 * 60 * 1000,
      );
    }

    setFilter({
      ...filter,
      dateRange: {
        start,
        end: new Date(),
      },
    });
  };

  const handleCustomDateChange = (type: 'start' | 'end', date: Date) => {
    setFilter({
      ...filter,
      dateRange: {
        start: type === 'start' ? date : filter.dateRange?.start || new Date(),
        end: type === 'end' ? date : filter.dateRange?.end || new Date(),
      },
    });
  };

  const handleSearchChange = (search: string) => {
    setFilter({...filter, search: search.trim() || undefined});
  };

  const handleReset = () => {
    setFilter({});
  };

  const handleApply = () => {
    onApply(filter);
  };

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80%]">
        <SheetHeader>
          <SheetTitle>Filter Transactions</SheetTitle>
        </SheetHeader>

        <ScrollView
          className="flex-1 mt-4"
          showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View className="mb-6">
            <Text className="font-medium mb-3">Search</Text>
            <Input
              placeholder="Search by signature, description..."
              value={filter.search || ''}
              onChangeText={handleSearchChange}
            />
          </View>

          {/* Transaction Types */}
          <View className="mb-6">
            <Text className="font-medium mb-3">Transaction Types</Text>
            <View className="flex-row flex-wrap gap-2">
              {transactionTypes.map(({type, label}) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleTypeToggle(type)}
                  className={`px-3 py-2 rounded-full border ${
                    filter.types?.includes(type)
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}>
                  <Text
                    className={`text-sm ${
                      filter.types?.includes(type)
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Filter */}
          <View className="mb-6">
            <Text className="font-medium mb-3">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {transactionStatuses.map(status => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-full ${
                    filter.status === status ? 'bg-primary' : 'bg-muted'
                  }`}>
                  <Text
                    className={
                      filter.status === status
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range Presets */}
          <View className="mb-6">
            <Text className="font-medium mb-3">Date Range</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {Object.entries(DATE_PRESETS).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleDatePreset(key as DatePreset)}
                  className="px-3 py-2 rounded-full bg-muted">
                  <Text className="text-sm text-foreground">
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Date Range */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowDatePicker('start')}
                className="flex-1 bg-muted rounded-lg p-3">
                <Text className="text-sm text-muted-foreground">From</Text>
                <Text>
                  {filter.dateRange?.start
                    ? format(filter.dateRange.start, 'MMM d, yyyy')
                    : 'Select date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDatePicker('end')}
                className="flex-1 bg-muted rounded-lg p-3">
                <Text className="text-sm text-muted-foreground">To</Text>
                <Text>
                  {filter.dateRange?.end
                    ? format(filter.dateRange.end, 'MMM d, yyyy')
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Filters Summary */}
          {(filter.types?.length ||
            filter.status ||
            filter.dateRange ||
            filter.search) && (
            <View className="mb-6 p-3 bg-muted rounded-lg">
              <Text className="font-medium mb-2">Active Filters</Text>

              {filter.search && (
                <Text className="text-sm text-muted-foreground">
                  Search: "{filter.search}"
                </Text>
              )}

              {filter.types?.length && (
                <Text className="text-sm text-muted-foreground">
                  Types: {filter.types.length} selected
                </Text>
              )}

              {filter.status && (
                <Text className="text-sm text-muted-foreground">
                  Status: {filter.status}
                </Text>
              )}

              {filter.dateRange && (
                <Text className="text-sm text-muted-foreground">
                  Date: {format(filter.dateRange.start, 'MMM d')} -{' '}
                  {format(filter.dateRange.end, 'MMM d')}
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View className="flex-row gap-2 p-4 border-t border-border">
          <Button variant="outline" onPress={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onPress={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </View>
      </SheetContent>
    </Sheet>
  );
}
