import React, {useEffect, useState} from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Shield,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
} from 'lucide-react-native';
import {useAdvancedModerationStore} from '../stores/advancedModerationStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Badge} from '../components/ui/badge';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {
  AdRemovalRequest,
  RemovalRequestStatus,
  RemovalRequestFilters,
} from '../types/advanced-moderation';
import {cn} from '../lib/utils';

export const MyRemovalRequestsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    moderationSystem,
    isLoading,
    error,
    fetchUserRemovalRequests,
    setSelectedRemovalRequest,
    cancelRemovalRequest,
  } = useAdvancedModerationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<RemovalRequestFilters>({});
  const [selectedStatus, setSelectedStatus] = useState<
    RemovalRequestStatus | 'all'
  >('all');

  useEffect(() => {
    fetchUserRemovalRequests(filters);
  }, [filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserRemovalRequests(filters);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusFilter = (status: RemovalRequestStatus | 'all') => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilters({});
    } else {
      setFilters({status});
    }
  };

  const handleRequestPress = (request: AdRemovalRequest) => {
    setSelectedRemovalRequest(request);
    navigation.navigate(
      'RemovalRequestDetails' as never,
      {requestId: request.id} as never,
    );
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelRemovalRequest(requestId);
      handleRefresh();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const getStatusIcon = (status: RemovalRequestStatus) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'expired':
        return AlertCircle;
      case 'cancelled':
        return XCircle;
    }
  };

  const getStatusColor = (status: RemovalRequestStatus) => {
    switch (status) {
      case 'pending':
        return {bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '#D97706'};
      case 'approved':
        return {bg: 'bg-green-100', text: 'text-green-700', icon: '#059669'};
      case 'rejected':
        return {bg: 'bg-red-100', text: 'text-red-700', icon: '#DC2626'};
      case 'expired':
        return {bg: 'bg-gray-100', text: 'text-gray-700', icon: '#6B7280'};
      case 'cancelled':
        return {bg: 'bg-gray-100', text: 'text-gray-700', icon: '#6B7280'};
    }
  };

  const requests = moderationSystem?.userRemovalRequests || [];
  const filteredRequests =
    selectedStatus === 'all'
      ? requests
      : requests.filter(r => r.status === selectedStatus);

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    expired: requests.filter(r => r.status === 'expired').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  const totalDeposits = requests.reduce((sum, r) => sum + r.depositAmount, 0);
  const totalRewards = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-semibold text-gray-900">
            Removal Requests
          </Text>
          <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
            <Text className="text-blue-600">Back</Text>
          </Button>
        </View>
      </View>

      {/* Summary Stats */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-sm text-gray-600">Total Deposits</Text>
            <Text className="font-semibold text-gray-900">
              {(totalDeposits / 1000000000).toFixed(3)} SOL
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-sm text-gray-600">Total Rewards</Text>
            <Text className="font-semibold text-green-600">
              {(totalRewards / 1000000000).toFixed(3)} SOL
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-sm text-gray-600">Success Rate</Text>
            <Text className="font-semibold text-gray-900">
              {requests.length > 0
                ? `${((statusCounts.approved / requests.length) * 100).toFixed(
                    0,
                  )}%`
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2">
          {(
            [
              'all',
              'pending',
              'approved',
              'rejected',
              'expired',
              'cancelled',
            ] as const
          ).map(status => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'ghost'}
              size="sm"
              onPress={() => handleStatusFilter(status)}
              className="mr-2">
              <Text
                className={cn(
                  'text-sm capitalize',
                  selectedStatus === status ? 'text-white' : 'text-gray-600'
                )}>
                {status}
              </Text>
              <Badge
                variant="secondary"
                className={cn(
                  'ml-2',
                  selectedStatus === status && 'bg-white/20',
                )}>
                <Text
                  className={cn(
                    'text-xs',
                    selectedStatus === status ? 'text-white' : 'text-gray-600'
                  )}>
                  {statusCounts[status]}
                </Text>
              </Badge>
            </Button>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {isLoading && !requests.length ? (
          <View className="flex-1 justify-center items-center py-8">
            <LoadingSpinner size="large" />
            <Text className="mt-4 text-gray-600">
              Loading removal requests...
            </Text>
          </View>
        ) : filteredRequests.length > 0 ? (
          <View className="p-4 space-y-3">
            {filteredRequests.map(request => (
              <RemovalRequestCard
                key={request.id}
                request={request}
                onPress={() => handleRequestPress(request)}
                onCancel={
                  request.status === 'pending'
                    ? () => handleCancelRequest(request.id)
                    : undefined
                }
              />
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-16">
            <Shield size={48} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4">
              No Removal Requests
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              {selectedStatus === 'all' 
                ? "You haven't submitted any removal requests yet"
                : `No ${selectedStatus} requests`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Removal Request Card Component
const RemovalRequestCard: React.FC<{
  request: AdRemovalRequest;
  onPress: () => void;
  onCancel?: () => void;
}> = ({request, onPress, onCancel}) => {
  const StatusIcon = getStatusIcon(request.status);
  const statusColors = getStatusColor(request.status);

  const isExpiringSoon =
    request.status === 'pending' &&
    new Date(request.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Card className="p-4 bg-white">
      <Button variant="ghost" onPress={onPress} className="w-full p-0 h-auto">
        <View className="w-full">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-3">
              <Text className="font-semibold text-gray-900">
                Group: {request.groupId}
              </Text>
              <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                {request.justification}
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>

          {/* Status and Amounts */}
          <View className="flex-row justify-between items-center mb-3">
            <Badge variant="secondary" className={cn(statusColors.bg)}>
              <StatusIcon size={12} color={statusColors.icon} />
              <Text
                className={cn('text-xs ml-1 capitalize', statusColors.text)}>
                {request.status}
              </Text>
            </Badge>

            <View className="flex-row items-center space-x-3">
              <View className="items-center">
                <Text className="text-xs text-gray-500">Deposit</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {(request.depositAmount / 1000000000).toFixed(3)} SOL
                </Text>
              </View>
              {request.status === 'approved' && (
                <View className="items-center">
                  <Text className="text-xs text-gray-500">Reward</Text>
                  <Text className="text-sm font-medium text-green-600">
                    +{(request.rewardAmount / 1000000000).toFixed(3)} SOL
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Dates */}
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-gray-500">
              Submitted: {new Date(request.requestedAt).toLocaleDateString()}
            </Text>
            {request.status === 'pending' && (
              <Text
                className={cn(
                  'text-xs',
                  isExpiringSoon
                    ? 'text-orange-600 font-medium'
                    : 'text-gray-500',
                )}>
                Expires: {new Date(request.expiresAt).toLocaleDateString()}
              </Text>
            )}
            {request.processedAt && (
              <Text className="text-xs text-gray-500">
                Processed: {new Date(request.processedAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Outcome */}
          {request.outcome && (
            <View className="mt-3 p-2 bg-gray-50 rounded">
              <Text className="text-xs text-gray-600">{request.outcome}</Text>
            </View>
          )}

          {/* Risk Assessment Preview */}
          {request.riskAssessment && (
            <View className="mt-3 flex-row items-center space-x-2">
              <Badge
                variant="outline"
                className={cn(
                  request.riskAssessment.riskLevel === 'high' ? 'border-red-300' :
                  request.riskAssessment.riskLevel === 'medium' ? 'border-yellow-300' :
                    : 'border-green-300',
                )}>
                <Text
                  className={cn(
                    'text-xs capitalize',
                    request.riskAssessment.riskLevel === 'high'
                      ? 'text-red-600'
                      : request.riskAssessment.riskLevel === 'medium'
                      ? 'text-yellow-600'
                      : 'text-green-600',
                  )}>
                  {request.riskAssessment.riskLevel} Risk
                </Text>
              </Badge>
              <Text className="text-xs text-gray-500">
                {(request.riskAssessment.confidence * 100).toFixed(0)}%
                confidence
              </Text>
            </View>
          )}

          {/* Blockchain Status */}
          {request.onChainVerified && (
            <View className="mt-2">
              <Badge variant="outline" className="bg-blue-50">
                <Text className="text-xs text-blue-600">On-chain verified</Text>
              </Badge>
            </View>
          )}

          {/* Cancel Button for Pending Requests */}
          {onCancel && request.status === 'pending' && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onPress={e => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="w-full">
                <Text className="text-red-600 text-sm">Cancel Request</Text>
              </Button>
            </View>
          )}
        </View>
      </Button>
    </Card>
  );
};
