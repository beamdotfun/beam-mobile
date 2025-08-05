import React, {useEffect, useState} from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Flag,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import {useAdvancedModerationStore} from '../stores/advancedModerationStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Badge} from '../components/ui/badge';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Select} from '../components/ui/select';
import {
  ContentReport,
  ReportStatus,
  ReportFilters,
} from '../types/advanced-moderation';
import {cn} from '../lib/utils';

export const MyModerationReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    moderationSystem,
    isLoading,
    error,
    fetchUserReports,
    setSelectedReport,
  } = useAdvancedModerationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>(
    'all',
  );

  useEffect(() => {
    fetchUserReports(filters);
  }, [filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserReports(filters);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusFilter = (status: ReportStatus | 'all') => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilters({});
    } else {
      setFilters({status});
    }
  };

  const handleReportPress = (report: ContentReport) => {
    setSelectedReport(report);
    navigation.navigate(
      'ReportDetails' as never,
      {reportId: report.id} as never,
    );
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'under_review':
        return AlertCircle;
      case 'resolved':
        return CheckCircle;
      case 'closed':
        return XCircle;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return {bg: 'bg-gray-100', text: 'text-gray-700', icon: '#6B7280'};
      case 'under_review':
        return {bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '#D97706'};
      case 'resolved':
        return {bg: 'bg-green-100', text: 'text-green-700', icon: '#059669'};
      case 'closed':
        return {bg: 'bg-red-100', text: 'text-red-700', icon: '#DC2626'};
    }
  };

  const getOutcomeText = (outcome?: string) => {
    switch (outcome) {
      case 'action_taken':
        return 'Action taken against content';
      case 'no_action':
        return 'No violation found';
      case 'reviewed':
        return 'Report reviewed';
      default:
        return 'Awaiting review';
    }
  };

  const reports = moderationSystem?.userReports || [];
  const filteredReports =
    selectedStatus === 'all'
      ? reports
      : reports.filter(r => r.status === selectedStatus);

  const statusCounts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    under_review: reports.filter(r => r.status === 'under_review').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    closed: reports.filter(r => r.status === 'closed').length,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-semibold text-gray-900">
            My Reports
          </Text>
          <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
            <Text className="text-blue-600">Back</Text>
          </Button>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2">
          {(
            ['all', 'pending', 'under_review', 'resolved', 'closed'] as const
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
                  selectedStatus === status ? 'text-white' : 'text-gray-600',
                )}>
                {status.replace('_', ' ')}
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
                    selectedStatus === status ? 'text-white' : 'text-gray-600',
                  )}>
                  {statusCounts[status]}
                </Text>
              </Badge>
            </Button>
          ))}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {isLoading && !reports.length ? (
          <View className="flex-1 justify-center items-center py-8">
            <LoadingSpinner size="large" />
            <Text className="mt-4 text-gray-600">Loading reports...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          <View className="p-4 space-y-3">
            {filteredReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => handleReportPress(report)}
              />
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-16">
            <Flag size={48} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4">
              No Reports Found
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              {selectedStatus === 'all'
                ? "You haven't submitted any reports yet"
                : `No ${selectedStatus.replace('_', ' ')} reports`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Report Card Component
const ReportCard: React.FC<{
  report: ContentReport;
  onPress: () => void;
}> = ({report, onPress}) => {
  const StatusIcon = getStatusIcon(report.status);
  const statusColors = getStatusColor(report.status);

  return (
    <Card className="p-4 bg-white">
      <Button variant="ghost" onPress={onPress} className="w-full p-0 h-auto">
        <View className="w-full">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center space-x-2">
                <Text className="font-semibold text-gray-900">
                  {report.category.name}
                </Text>
                <Badge variant="secondary" className={cn(statusColors.bg)}>
                  <StatusIcon size={12} color={statusColors.icon} />
                  <Text
                    className={cn(
                      'text-xs ml-1 capitalize',
                      statusColors.text,
                    )}>
                    {report.status.replace('_', ' ')}
                  </Text>
                </Badge>
              </View>
              <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                {report.reason}
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>

          {/* Details Row */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center space-x-4">
              <Text className="text-xs text-gray-500">
                {new Date(report.createdAt).toLocaleDateString()}
              </Text>
              {report.evidence.length > 0 && (
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500">
                    {report.evidence.length} evidence
                  </Text>
                </View>
              )}
            </View>
            {report.onChainVerified && (
              <Badge variant="outline" className="bg-blue-50">
                <Text className="text-xs text-blue-600">On-chain</Text>
              </Badge>
            )}
          </View>

          {/* Outcome */}
          {report.outcome && report.outcome !== 'pending' && (
            <View className="mt-3 p-2 bg-gray-50 rounded">
              <Text className="text-xs text-gray-600">
                {getOutcomeText(report.outcome)}
              </Text>
              {report.resolutionSummary && (
                <Text className="text-xs text-gray-500 mt-1">
                  {report.resolutionSummary}
                </Text>
              )}
            </View>
          )}
        </View>
      </Button>
    </Card>
  );
};
