import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useUserGroupsStore} from '../../store/userGroupsStore';
import {UserGroupMembership, GroupPayout} from '../../types/user-groups';
import {Button} from '../../components/ui/button';
import {Card} from '../../components/ui/card';
import {formatCurrency, formatDistanceToNow} from '../../utils/formatting';

export const UserGroupsScreen: React.FC = () => {
  const {
    memberships,
    availablePayouts,
    analytics,
    isLoading,
    isClaimingPayout,
    error,
    loadGroupMemberships,
    loadAvailablePayouts,
    loadAnalytics,
    claimPayout,
    claimAllPayouts,
    clearError,
    refresh,
  } = useUserGroupsStore();

  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'groups' | 'payouts'
  >('overview');

  useEffect(() => {
    loadGroupMemberships();
    loadAvailablePayouts();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  if (isLoading && memberships.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading your groups...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-semibold text-gray-900">My Groups</Text>
          <Text className="text-sm text-gray-600">
            Track your group memberships and earnings
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row">
            {[
              {id: 'overview', label: 'Overview'},
              {id: 'groups', label: 'Groups'},
              {id: 'payouts', label: 'Payouts'},
            ].map(tab => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? 'default' : 'ghost'}
                className="flex-1 rounded-none border-0"
                onPress={() => setSelectedTab(tab.id as any)}>
                <Text
                  className={`text-sm ${
                    selectedTab === tab.id ? 'text-white' : 'text-gray-600'
                  }`}>
                  {tab.label}
                </Text>
              </Button>
            ))}
          </View>
        </View>

        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }>
          {selectedTab === 'overview' && (
            <OverviewTab
              analytics={analytics}
              availablePayouts={availablePayouts}
              onClaimAll={claimAllPayouts}
              isClaimingPayout={isClaimingPayout}
            />
          )}

          {selectedTab === 'groups' && <GroupsTab memberships={memberships} />}

          {selectedTab === 'payouts' && (
            <PayoutsTab
              payouts={availablePayouts}
              onClaimPayout={claimPayout}
              isClaimingPayout={isClaimingPayout}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Overview Tab
const OverviewTab: React.FC<{
  analytics: any;
  availablePayouts: GroupPayout[];
  onClaimAll: () => void;
  isClaimingPayout: boolean;
}> = ({analytics, availablePayouts, onClaimAll, isClaimingPayout}) => {
  const totalAvailable = availablePayouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <View className="space-y-4">
      {/* Quick Stats */}
      <Card className="p-4">
        <Text className="font-medium mb-3 text-gray-900">Quick Stats</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Total Groups</Text>
            <Text className="font-medium text-gray-900">
              {analytics?.totalGroups || 0}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Total Earnings</Text>
            <Text className="font-medium text-gray-900">
              {formatCurrency(analytics?.totalEarnings || 0)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Available Payouts</Text>
            <Text className="font-medium text-green-600">
              {formatCurrency(totalAvailable)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Available Payouts */}
      {availablePayouts.length > 0 && (
        <Card className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-medium text-gray-900">Available Payouts</Text>
            <Button size="sm" onPress={onClaimAll} disabled={isClaimingPayout}>
              <Text className="text-white text-sm">
                {isClaimingPayout ? 'Claiming...' : 'Claim All'}
              </Text>
            </Button>
          </View>

          <View className="space-y-2">
            {availablePayouts.slice(0, 3).map(payout => (
              <View
                key={payout.id}
                className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">
                    {payout.groupName}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {payout.period.label}
                  </Text>
                </View>
                <Text className="font-medium text-green-600">
                  {formatCurrency(payout.amount)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Top Group */}
      {analytics?.topGroup && (
        <Card className="p-4">
          <Text className="font-medium mb-2 text-gray-900">
            Top Earning Group
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">
              {analytics.topGroup.name}
            </Text>
            <Text className="font-medium text-gray-900">
              {formatCurrency(analytics.topGroup.earnings)}
            </Text>
          </View>
        </Card>
      )}
    </View>
  );
};

// Groups Tab
const GroupsTab: React.FC<{
  memberships: UserGroupMembership[];
}> = ({memberships}) => {
  if (memberships.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-gray-600 text-center">
          You're not in any groups yet
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Groups are created by admins for targeted advertising
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      {memberships.map(membership => (
        <Card key={membership.groupId} className="p-4">
          <View className="space-y-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  {membership.groupName}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {membership.groupDescription}
                </Text>
              </View>
              <View
                className={`px-2 py-1 rounded-full ${
                  membership.status === 'active'
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}>
                <Text
                  className={`text-xs ${
                    membership.status === 'active'
                      ? 'text-green-700'
                      : 'text-gray-700'
                  }`}>
                  {membership.status}
                </Text>
              </View>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Total Earned</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatCurrency(membership.totalEarned)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Pending Payout</Text>
                <Text className="text-sm font-medium text-green-600">
                  {formatCurrency(membership.pendingPayout)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Next Payout</Text>
                <Text className="text-sm text-gray-700">
                  {formatDistanceToNow(membership.nextPayoutDate)}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
};

// Payouts Tab
const PayoutsTab: React.FC<{
  payouts: GroupPayout[];
  onClaimPayout: (payoutId: string) => void;
  isClaimingPayout: boolean;
}> = ({payouts, onClaimPayout, isClaimingPayout}) => {
  if (payouts.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-gray-600 text-center">No payouts available</Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      {payouts.map(payout => (
        <Card key={payout.id} className="p-4">
          <View className="space-y-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  {payout.groupName}
                </Text>
                <Text className="text-sm text-gray-600">
                  {payout.period.label}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {payout.reason}
                </Text>
              </View>
              <Text className="text-lg font-bold text-green-600">
                {formatCurrency(payout.amount)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-gray-500">
                {payout.expiresAt
                  ? `Available until ${formatDistanceToNow(payout.expiresAt)}`
                  : ''}
              </Text>

              {payout.status === 'available' && (
                <Button
                  size="sm"
                  onPress={() => onClaimPayout(payout.id)}
                  disabled={isClaimingPayout}>
                  <Text className="text-white text-sm">
                    {isClaimingPayout ? 'Claiming...' : 'Claim'}
                  </Text>
                </Button>
              )}

              {payout.status === 'processing' && (
                <View className="px-2 py-1 bg-yellow-100 rounded">
                  <Text className="text-xs text-yellow-700">Processing</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
};
