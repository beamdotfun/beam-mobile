import React, {useEffect, useState} from 'react';
import {View, ScrollView, Alert, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Flag,
  DollarSign,
  TrendingUp,
  Award,
  Shield,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import {useAdvancedModerationStore} from '../stores/advancedModerationStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Badge} from '../components/ui/badge';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {useFeatureFlag} from '../hooks/useFeatureFlag';
import {cn} from '../lib/utils';
import {useNavigation} from '@react-navigation/native';

export const UserModerationDashboard: React.FC = () => {
  const navigation = useNavigation();
  const {
    userDashboard,
    userAchievements,
    isLoading,
    error,
    fetchUserDashboard,
    fetchUserAchievements,
    clearError,
  } = useAdvancedModerationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activity' | 'rewards'>('overview');

  const achievementsEnabled = useFeatureFlag('moderation_achievements_enabled');
  const advancedStatsEnabled = useFeatureFlag(
    'advanced_moderation_stats_enabled',
  );

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUserDashboard(),
        achievementsEnabled && fetchUserAchievements(),
      ]);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserDashboard(),
        achievementsEnabled && fetchUserAchievements(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestRemoval = (flaggedAdId: string) => {
    // Navigate to removal request screen
    navigation.navigate('AdRemovalRequest' as never, {flaggedAdId} as never);
  };

  const handleViewAllReports = () => {
    navigation.navigate('MyModerationReports' as never);
  };

  const handleViewAllRemovals = () => {
    navigation.navigate('MyRemovalRequests' as never);
  };

  if (isLoading && !userDashboard) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">
          Loading moderation dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  const stats = userDashboard?.personalStats;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-semibold text-gray-900">
            Community Moderation
          </Text>
          <Text className="text-sm text-gray-600">
            Help keep the platform safe and earn rewards
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row px-4">
            {[
              {id: 'overview', label: 'Overview'},
              {id: 'activity', label: 'Activity'},
              {id: 'rewards', label: 'Rewards'},
            ].map(tab => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? 'default' : 'ghost'}
                className={cn(
                  'flex-1 rounded-none',
                  selectedTab === tab.id && 'border-b-2 border-blue-500',
                )}
                onPress={() => setSelectedTab(tab.id as any)}>
                <Text
                  className={cn(
                    'text-sm font-medium',
                    selectedTab === tab.id ? 'text-blue-600' : 'text-gray-600'
                  )}>
                  {tab.label}
                </Text>
              </Button>
            ))}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {selectedTab === 'overview' && (
            <View className="p-4 space-y-4">
              {/* Personal Stats */}
              {stats && (
                <Card className="p-4 bg-white">
                  <Text className="font-medium text-lg mb-3 text-gray-900">
                    Your Moderation Stats

                  <View className="grid grid-cols-2 gap-4">
                    <StatCard
                      icon={Flag}
                      title="Reports"
                      value={stats.totalReportsSubmitted.toString()}
                      subtitle={`${stats.reportsThisMonth} this month`}
                      color="blue"
                    />

                    <StatCard
                      icon={DollarSign}
                      title="Rewards"
                      value={`${(stats.totalRewardsEarned / 1000000000).toFixed(
                        3,
                      )} SOL`}
                      subtitle="Total earned"
                      color="green"
                    />

                    <StatCard
                      icon={TrendingUp}
                      title="Success Rate"
                      value={`${stats.reportSuccessRate.toFixed(1)}%`}
                      subtitle={`${stats.successfulReports} successful`}
                      color="purple"
                    />

                    <StatCard
                      icon={Award}
                      title="Level"
                      value={stats.reporterLevel}
                      subtitle={`Score: ${stats.moderationScore}/100`}
                      color="orange"
                      capitalize
                    />
                  </View>

                  {/* Moderation Score Progress */}
                  <View className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-medium text-gray-700">
                        Moderation Score
                      </Text>
                      <Text className="text-sm font-bold text-gray-900">
                        {stats.moderationScore}/100
                      </Text>
                    </View>
                    <View className="w-full bg-gray-200 rounded-full h-2">
                      <View
                        className="bg-blue-500 h-2 rounded-full"
                        style={{width: `${stats.moderationScore}%`}}
                      />
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      {stats.moderationScore >= 90
                        ? 'Expert Moderator'
                        : stats.moderationScore >= 70
                        ? 'Trusted Moderator'
                        : stats.moderationScore >= 50
                        ? 'Active Moderator'
                        : 'New Moderator'}
                    </Text>
                  </View>
                </Card>
              )}

              {/* Available for Removal */}
              {userDashboard?.availableForRemoval &&
                userDashboard.availableForRemoval.length > 0 && (
                  <Card className="p-4 bg-white">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="font-medium text-lg text-gray-900">
                        Available for Removal
                      </Text>
                      <Badge variant="secondary">
                        <Text className="text-xs">Earn 0.005 SOL</Text>
                      </Badge>
                    </View>

                  <View className="space-y-3">
                      {userDashboard.availableForRemoval.slice(0, 3).map(ad => (
                        <RemovalOpportunityCard
                          key={ad.id}
                          ad={ad}
                          onRequestRemoval={() => handleRequestRemoval(ad.id)}
                        />
                      ))}
                    </View>


                  {userDashboard.availableForRemoval.length > 3 && (
                      <Button variant="outline" className="mt-3 w-full">
                        <Text className="text-gray-700">
                          View All ({userDashboard.availableForRemoval.length})
                        </Text>
                      </Button>
                    )}
                  </Card>
                )}

              {/* Achievements */}
              {achievementsEnabled && userAchievements.length > 0 && (
                <Card className="p-4 bg-white">
                  <Text className="font-medium text-lg mb-3 text-gray-900">
                    Achievements

                  <View className="space-y-3">
                    {userAchievements.slice(0, 4).map(achievement => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </View>
                </Card>
              )}

              {/* Moderation Guidelines */}
              {userDashboard?.moderationGuidelines && (
                <Card className="p-4 bg-white">
                  <Text className="font-medium text-lg mb-3 text-gray-900">
                    Important Guidelines

                  <View className="space-y-2">
                    {userDashboard.moderationGuidelines.map(guideline => (
                      <View
                        key={guideline.id}
                        className="flex-row items-start space-x-3">
                        <View
                          className={cn(
                            'w-2 h-2 rounded-full mt-2',
                            guideline.importance === 'high' ? 'bg-red-500' :
                            guideline.importance === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                          )}
                        />
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">
                            {guideline.title}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {guideline.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              )}
            </View>
          )}

          {selectedTab === 'activity' && (
            <View className="p-4 space-y-4">
              {/* Recent Reports */}
              <Card className="p-4 bg-white">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-medium text-lg text-gray-900">
                    Recent Reports
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleViewAllReports}>
                    <Text className="text-blue-600 text-sm">View All</Text>
                    <ChevronRight size={16} color="#2563EB" />
                  </Button>
                </View>

                {userDashboard?.recentReports &&
                userDashboard.recentReports.length > 0 ? (
                  <View className="space-y-3">
                    {userDashboard.recentReports.slice(0, 5).map(report => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon={Flag}
                    title="No reports yet"
                    description="Start reporting inappropriate content to help keep the platform safe"
                  />
                )}
              </Card>

              {/* Recent Removal Requests */}
              <Card className="p-4 bg-white">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-medium text-lg text-gray-900">
                    Removal Requests
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleViewAllRemovals}>
                    <Text className="text-blue-600 text-sm">View All</Text>
                    <ChevronRight size={16} color="#2563EB" />
                  </Button>
                </View>

                {userDashboard?.recentRemovalRequests &&
                userDashboard.recentRemovalRequests.length > 0 ? (
                  <View className="space-y-3">
                    {userDashboard.recentRemovalRequests
                      .slice(0, 3)
                      .map(request => (
                        <RemovalRequestCard
                          key={request.id}
                          request={request}
                        />
                      ))}
                  </View>
                ) : (
                  <EmptyState
                    icon={Shield}
                    title="No removal requests"
                    description="Request removal of flagged ads to earn rewards"
                  />
                )}
              </Card>

              {/* Moderation History */}
              {stats && advancedStatsEnabled && (
                <Card className="p-4 bg-white">
                  <Text className="font-medium text-lg mb-3 text-gray-900">
                    Activity Summary

                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">Reports This Month</Text>
                      <Text className="font-medium text-gray-900">
                        {stats.reportsThisMonth}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">
                        Average Resolution Time
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {Math.round(
                          stats.averageResolutionTime / (60 * 60 * 1000),
                        )}
                        h
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">
                        Total Deposits Placed
                      </Text>
                      <Text className="font-medium text-gray-900">
                        {(stats.totalDepositsPlaced / 1000000000).toFixed(3)}{' '}
                        SOL
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">Deposits Returned</Text>
                      <Text className="font-medium text-green-600">
                        {(stats.totalDepositsReturned / 1000000000).toFixed(3)}{' '}
                        SOL
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
            </View>
          )}

          {selectedTab === 'rewards' && (
            <View className="p-4 space-y-4">
              {/* Pending Rewards */}
              {userDashboard?.pendingRewards &&
                userDashboard.pendingRewards.length > 0 && (
                  <Card className="p-4 bg-white">
                    <Text className="font-medium text-lg mb-3 text-gray-900">
                      Pending Rewards


                    <View className="space-y-3">
                      {userDashboard.pendingRewards.map(reward => (
                        <PendingRewardCard key={reward.id} reward={reward} />
                      ))}
                    </View>

                  <View className="mt-4 p-3 bg-green-50 rounded-lg">
                      <Text className="text-sm font-medium text-green-800">
                        Total Pending:{' '}
                        {(
                          userDashboard.pendingRewards.reduce(
                            (sum, r) => sum + r.amount,
                            0,
                          ) / 1000000000
                        ).toFixed(3)}{' '}
                        SOL
                      </Text>
                    </View>
                  </Card>
                )}

              {/* Reward Information */}
              {userDashboard?.rewardInformation && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <Text className="font-medium text-lg text-blue-900 mb-3">
                    How Moderation Rewards Work
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-start space-x-2">
                      <Text className="text-blue-700">•</Text>
                      <Text className="text-sm text-blue-700 flex-1">
                        Report ads that violate community guidelines
                      </Text>
                    </View>
                    <View className="flex-row items-start space-x-2">
                      <Text className="text-blue-700">•</Text>
                      <Text className="text-sm text-blue-700 flex-1">
                        Request removal with{' '}
                        {(
                          userDashboard.rewardInformation.currentDepositAmount /
                          1000000000
                        ).toFixed(3)}{' '}
                        SOL deposit
                      </Text>
                    </View>
                    <View className="flex-row items-start space-x-2">
                      <Text className="text-blue-700">•</Text>
                      <Text className="text-sm text-blue-700 flex-1">
                        Earn{' '}
                        {(
                          userDashboard.rewardInformation.currentRewardAmount /
                          1000000000
                        ).toFixed(3)}{' '}
                        SOL + deposit back if approved
                      </Text>
                    </View>
                    <View className="flex-row items-start space-x-2">
                      <Text className="text-blue-700">•</Text>
                      <Text className="text-sm text-blue-700 flex-1">
                        Maintain {userDashboard.rewardInformation.successRate}%+
                        success rate for best results
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 p-2 bg-blue-100 rounded">
                    <Text className="text-xs text-blue-800 text-center">
                      Minimum reputation required:{' '}
                      {userDashboard.rewardInformation.minimumReputation}
                    </Text>
                  </View>
                </Card>
              )}

              {/* Reward Stats */}
              {stats && (
                <Card className="p-4 bg-white">
                  <Text className="font-medium text-lg mb-3 text-gray-900">
                    Lifetime Earnings

                  <View className="space-y-3">
                    <View className="p-4 bg-green-50 rounded-lg">
                      <Text className="text-2xl font-bold text-green-700">
                        {(stats.totalRewardsEarned / 1000000000).toFixed(4)} SOL
                      </Text>
                      <Text className="text-sm text-green-600">
                        Total Rewards Earned
                      </Text>
                    </View>

                    <View className="grid grid-cols-2 gap-3">
                      <View className="p-3 bg-gray-50 rounded-lg">
                        <Text className="font-medium text-gray-900">
                          {stats.successfulReports}
                        </Text>
                        <Text className="text-xs text-gray-600">
                          Successful Reports
                        </Text>
                      </View>
                      <View className="p-3 bg-gray-50 rounded-lg">
                        <Text className="font-medium text-gray-900">
                          {(
                            (stats.totalDepositsReturned /
                              stats.totalDepositsPlaced) *
                            100
                          ).toFixed(1)}
                          %
                        </Text>
                        <Text className="text-xs text-gray-600">
                          Deposit Return Rate
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  capitalize?: boolean;
}> = ({icon: Icon, title, value, subtitle, color, capitalize}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
  };

  return (
    <View className="items-center">
      <View className={cn('p-3 rounded-lg mb-2', colorClasses[color])}>
        <Icon
          size={24}
          color={
            color === 'blue'
              ? '#2563EB'
              : color === 'green'
              ? '#059669'
              : color === 'purple'
              ? '#7C3AED'
              : '#D97706'
          }
        />
      </View>
      <Text
        className={cn(
          'text-2xl font-bold text-gray-900',
          capitalize && 'capitalize',
        )}>
        {value}
      </Text>
      <Text className="text-sm text-gray-600">{title}</Text>
      <Text className="text-xs text-gray-500">{subtitle}</Text>
    </View>
  );
};

// Removal Opportunity Card
const RemovalOpportunityCard: React.FC<{
  ad: any;
  onRequestRemoval: () => void;
}> = ({ad, onRequestRemoval}) => (
  <View className="p-3 bg-gray-50 rounded-lg">
    <View className="flex-row justify-between items-start mb-2">
      <View className="flex-1 mr-3">
        <Text className="font-medium text-gray-900">
          {ad.groupInfo?.groupName}
        </Text>
        <Text className="text-sm text-gray-600">
          {ad.reportCount} reports • {ad.priorityLevel} priority
        </Text>
      </View>
      <Badge
        variant={
          ad.priorityLevel === 'urgent'
            ? 'destructive'
            : ad.priorityLevel === 'high'
            ? 'warning'
            : 'secondary'
        }>
        <Text className="text-xs capitalize">{ad.priorityLevel}</Text>
      </Badge>
    </View>

    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-gray-500">
        Flagged {new Date(ad.flaggedAt).toLocaleDateString()}
      </Text>
      <Button size="sm" onPress={onRequestRemoval}>
        <Text className="text-white text-xs">Request Removal</Text>
      </Button>
    </View>
  </View>
);

// Achievement Card
const AchievementCard: React.FC<{
  achievement: any;
}> = ({achievement}) => (
  <View className="flex-row items-center space-x-3">
    <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center">
      <Text className="text-2xl">{achievement.icon}</Text>
    </View>
    <View className="flex-1">
      <Text className="font-medium text-gray-900">{achievement.name}</Text>
      <Text className="text-sm text-gray-600">{achievement.description}</Text>
      <View className="mt-1">
        <View className="bg-gray-200 rounded-full h-2">
          <View
            className={cn(
              'h-2 rounded-full',
              achievement.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{width: `${achievement.progress}%`}}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          {achievement.progress}% complete
          {achievement.reward &&
            ` • Reward: ${(achievement.reward / 1000000000).toFixed(3)} SOL`}
        </Text>
      </View>
    </View>
  </View>
);

// Report Card
const ReportCard: React.FC<{
  report: any;
}> = ({report}) => (
  <View className="flex-row justify-between items-center">
    <View className="flex-1 mr-3">
      <Text className="font-medium text-gray-900">{report.category.name}</Text>
      <Text className="text-sm text-gray-600" numberOfLines={1}>
        {report.reason}
      </Text>
      <Text className="text-xs text-gray-500">
        {new Date(report.createdAt).toLocaleDateString()}
      </Text>
    </View>
    <Badge
      variant={
        report.status === 'resolved' ? 'success' :
        report.status === 'under_review' ? 'warning' :
        'secondary'
      }>
      <Text className="text-xs capitalize">
        {report.status.replace('_', ' ')}
      </Text>
    </Badge>
  </View>
);

// Removal Request Card
const RemovalRequestCard: React.FC<{
  request: any;
}> = ({request}) => (
  <View className="flex-row justify-between items-center">
    <View className="flex-1 mr-3">
      <Text className="font-medium text-gray-900">
        Group: {request.groupId}
      </Text>
      <Text className="text-sm text-gray-600" numberOfLines={1}>
        {request.justification}
      </Text>
      <Text className="text-xs text-gray-500">
        Deposit: {(request.depositAmount / 1000000000).toFixed(3)} SOL
      </Text>
    </View>
    <View className="items-end">
      <Badge
        variant={
          request.status === 'approved' ? 'success' :
            : request.status === 'rejected'
            ? 'destructive'
            : request.status === 'pending'
            ? 'warning'
            : 'secondary'
        }>
        <Text className="text-xs capitalize">{request.status}</Text>
      </Badge>
      {request.rewardAmount > 0 && request.status === 'approved' && (
        <Text className="text-xs text-green-600 mt-1">
          +{(request.rewardAmount / 1000000000).toFixed(3)} SOL
        </Text>
      )}
    </View>
  </View>
);

// Pending Reward Card
const PendingRewardCard: React.FC<{
  reward: any;
}> = ({reward}) => (
  <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
    <View className="flex-1 mr-3">
      <Text className="font-medium text-gray-900">{reward.description}</Text>
      <Text className="text-sm text-gray-600">
        Expected: {new Date(reward.expectedDate).toLocaleDateString()}
      </Text>
    </View>
    <View className="items-end">
      <Text className="font-bold text-green-600">
        {(reward.amount / 1000000000).toFixed(3)} SOL
      </Text>
      <Badge
        variant={
          reward.status === 'ready' ? 'success' :
          reward.status === 'processing' ? 'warning' :
            : 'secondary'
        }>
        <Text className="text-xs capitalize">{reward.status}</Text>
      </Badge>
    </View>
  </View>
);

// Empty State Component
const EmptyState: React.FC<{
  icon: any;
  title: string;
  description: string;
}> = ({icon: Icon, title, description}) => (
  <View className="items-center py-8">
    <Icon size={48} color="#9CA3AF" />
    <Text className="text-gray-600 font-medium mt-3">{title}</Text>
    <Text className="text-sm text-gray-500 text-center mt-1 px-4">
      {description}
    </Text>
  </View>
);
