import React, {useEffect, useState} from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Award,
  Crown,
  Medal,
} from 'lucide-react-native';
import {Card} from '../ui/card';
import {Text} from '../ui/text';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {LoadingSpinner} from '../ui/loading-spinner';
import {
  Platform,
  PlatformRankingEntry,
  PlatformRankingData,
} from '../../types/platform';
import {usePlatformStore} from '../../stores/platformStore';
import {useFeatureFlag} from '../../hooks/useFeatureFlag';
import {analyticsService} from '../../services/analytics/analyticsService';
import {cn} from '../../lib/utils';

interface PlatformRankingsProps {
  onPlatformPress?: (platform: Platform) => void;
  variant?: 'full' | 'compact' | 'leaderboard';
  limit?: number;
  showTrends?: boolean;
  showScoreBreakdown?: boolean;
  category?: string;
}

export const PlatformRankings: React.FC<PlatformRankingsProps> = ({
  onPlatformPress,
  variant = 'full',
  limit,
  showTrends = true,
  showScoreBreakdown = false,
  category,
}) => {
  const {platformRankings, isLoading, error, fetchPlatformRankings} =
    usePlatformStore();

  const [refreshing, setRefreshing] = useState(false);

  const realTimeRankingsEnabled = useFeatureFlag('real_time_rankings_enabled');
  const advancedRankingsEnabled = useFeatureFlag('advanced_rankings_enabled');

  useEffect(() => {
    fetchPlatformRankings();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlatformRankings();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlatformPress = (platform: Platform) => {
    onPlatformPress?.(platform);

    analyticsService.trackEvent('ranking_platform_viewed', {
      platform_id: platform.id,
      rank: platformRankings?.platforms.find(p => p.platform.id === platform.id)
        ?.rank,
      category: platform.category,
    });
  };

  const getFilteredRankings = (): PlatformRankingEntry[] => {
    if (!platformRankings) {
      return [];
    }

    let filtered = platformRankings.platforms;

    // Filter by category if specified
    if (category) {
      filtered = filtered.filter(entry => entry.platform.category === category);
    }

    // Apply limit if specified
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  };

  const getTrendIcon = (
    trend: 'up' | 'down' | 'stable',
    previousRank?: number,
    currentRank?: number,
  ) => {
    if (!showTrends || !previousRank) {
      return null;
    }

    const rankChange = previousRank - (currentRank || 0);

    switch (trend) {
      case 'up':
        return {
          icon: TrendingUp,
          color: '#10B981',
          text: `+${rankChange}`,
          bgColor: '#D1FAE5',
        };
      case 'down':
        return {
          icon: TrendingDown,
          color: '#EF4444',
          text: `-${Math.abs(rankChange)}`,
          bgColor: '#FEE2E2',
        };
      default:
        return {
          icon: Minus,
          color: '#6B7280',
          text: '0',
          bgColor: '#F3F4F6',
        };
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        icon: Crown,
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        label: 'Champion',
      };
    } else if (rank === 2) {
      return {
        icon: Award,
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        label: 'Runner-up',
      };
    } else if (rank === 3) {
      return {
        icon: Medal,
        color: '#EF4444',
        bgColor: '#FEE2E2',
        label: 'Third',
      };
    } else if (rank <= 10) {
      return {
        icon: Star,
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        label: 'Top 10',
      };
    }
    return null;
  };

  if (isLoading && !platformRankings) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading rankings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-red-600 text-center">
          Failed to load rankings
        </Text>
        <Button
          variant="outline"
          onPress={fetchPlatformRankings}
          className="mt-4">
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  const rankings = getFilteredRankings();

  if (rankings.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <TrendingUp size={48} color="#9CA3AF" />
        <Text className="text-lg font-medium text-gray-500 mt-4">
          No Rankings Available
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          Rankings will appear once platforms receive votes
        </Text>
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View className="space-y-2">
        {rankings.slice(0, 5).map(entry => (
          <CompactRankingCard
            key={entry.platform.id}
            entry={entry}
            onPress={() => handlePlatformPress(entry.platform)}
            showTrend={showTrends}
          />
        ))}
      </View>
    );
  }

  if (variant === 'leaderboard') {
    return (
      <View className="space-y-1">
        {rankings.slice(0, 10).map(entry => (
          <LeaderboardRow
            key={entry.platform.id}
            entry={entry}
            onPress={() => handlePlatformPress(entry.platform)}
            showTrend={showTrends}
          />
        ))}
      </View>
    );
  }

  // Full variant
  return (
    <ScrollView
      className="space-y-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xl font-bold text-gray-900">
            Platform Rankings
          </Text>
          {platformRankings && (
            <Text className="text-sm text-gray-600">
              Last updated:{' '}
              {new Date(platformRankings.lastUpdated).toLocaleDateString()}
              {realTimeRankingsEnabled && ' • Live'}
            </Text>
          )}
        </View>

        {category && (
          <Badge variant="secondary">
            <Text className="text-xs capitalize">{category}</Text>
          </Badge>
        )}
      </View>

      {/* Top 3 Podium */}
      {rankings.length >= 3 && variant === 'full' && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <Text className="text-lg font-semibold text-center mb-4 text-gray-900">
            Top Performers
          </Text>
          <View className="flex-row justify-center items-end space-x-4">
            {/* Second Place */}
            <PodiumPosition entry={rankings[1]} position={2} />

            {/* First Place */}
            <PodiumPosition entry={rankings[0]} position={1} />

            {/* Third Place */}
            <PodiumPosition entry={rankings[2]} position={3} />
          </View>
        </Card>
      )}

      {/* Full Rankings List */}
      <View className="space-y-3">
        {rankings.map(entry => (
          <FullRankingCard
            key={entry.platform.id}
            entry={entry}
            onPress={() => handlePlatformPress(entry.platform)}
            showTrend={showTrends}
            showScoreBreakdown={showScoreBreakdown && advancedRankingsEnabled}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Compact Ranking Card
const CompactRankingCard: React.FC<{
  entry: PlatformRankingEntry;
  onPress: () => void;
  showTrend: boolean;
}> = ({entry, onPress, showTrend}) => {
  const trend = getTrendIcon(entry.trend, entry.previousRank, entry.rank);
  const badge = getRankBadge(entry.rank);

  return (
    <Card className="p-3 bg-white">
      <View className="flex-row items-center space-x-3">
        <View className="items-center min-w-[40px]">
          <Text className="text-lg font-bold text-blue-600">#{entry.rank}</Text>
          {showTrend && trend && (
            <View className="flex-row items-center">
              <trend.icon size={12} color={trend.color} />
              <Text style={{color: trend.color}} className="text-xs ml-1">
                {trend.text}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center space-x-2">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {entry.platform.platformName}
            </Text>
            {entry.platform.isVerified && (
              <Star size={14} color="#3B82F6" fill="#3B82F6" />
            )}
            {badge && (
              <Badge style={{backgroundColor: badge.bgColor}}>
                <badge.icon size={10} color={badge.color} />
              </Badge>
            )}
          </View>
          <Text className="text-sm text-gray-600">
            {entry.platform.category}
          </Text>
        </View>

        <View className="items-end">
          <Text className="font-bold text-gray-900">
            {entry.score.toFixed(1)}
          </Text>
          <Text className="text-xs text-gray-500">score</Text>
        </View>

        <Button variant="ghost" size="sm" onPress={onPress}>
          <Text className="text-blue-600">View</Text>
        </Button>
      </View>
    </Card>
  );
};

// Leaderboard Row
const LeaderboardRow: React.FC<{
  entry: PlatformRankingEntry;
  onPress: () => void;
  showTrend: boolean;
}> = ({entry, onPress, showTrend}) => {
  const trend = getTrendIcon(entry.trend, entry.previousRank, entry.rank);
  const badge = getRankBadge(entry.rank);

  return (
    <Button
      variant="ghost"
      onPress={onPress}
      className="w-full justify-start p-3 h-auto">
      <View className="flex-row items-center space-x-3 w-full">
        <View className="items-center min-w-[30px]">
          <Text
            className={cn(
              'font-bold',
              entry.rank <= 3 ? 'text-yellow-600' : 'text-gray-600',
            )}>
            #{entry.rank}
          </Text>
        </View>

        {badge && <badge.icon size={16} color={badge.color} />}

        <Text className="flex-1 font-medium text-gray-900" numberOfLines={1}>
          {entry.platform.platformName}
        </Text>

        {showTrend && trend && (
          <View className="flex-row items-center">
            <trend.icon size={14} color={trend.color} />
          </View>
        )}

        <Text className="font-semibold text-gray-900 min-w-[50px] text-right">
          {entry.score.toFixed(0)}
        </Text>
      </View>
    </Button>
  );
};

// Full Ranking Card
const FullRankingCard: React.FC<{
  entry: PlatformRankingEntry;
  onPress: () => void;
  showTrend: boolean;
  showScoreBreakdown: boolean;
}> = ({entry, onPress, showTrend, showScoreBreakdown}) => {
  const trend = getTrendIcon(entry.trend, entry.previousRank, entry.rank);
  const badge = getRankBadge(entry.rank);

  return (
    <Card className="p-4 bg-white">
      <View className="space-y-3">
        {/* Header Row */}
        <View className="flex-row items-center space-x-4">
          <View className="items-center">
            <View className="flex-row items-center space-x-2">
              <Text className="text-2xl font-bold text-blue-600">
                #{entry.rank}
              </Text>
              {badge && (
                <View
                  style={{backgroundColor: badge.bgColor}}
                  className="p-1 rounded">
                  <badge.icon size={16} color={badge.color} />
                </View>
              )}
            </View>
            {showTrend && trend && (
              <View
                className="flex-row items-center mt-1 px-2 py-1 rounded"
                style={{backgroundColor: trend.bgColor}}>
                <trend.icon size={12} color={trend.color} />
                <Text
                  style={{color: trend.color}}
                  className="text-xs ml-1 font-medium">
                  {trend.text}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center space-x-2">
              <Text className="font-semibold text-lg text-gray-900">
                {entry.platform.platformName}
              </Text>
              {entry.platform.isVerified && (
                <Star size={16} color="#3B82F6" fill="#3B82F6" />
              )}
            </View>
            <Text className="text-sm text-gray-600">
              {entry.platform.platformUrl}
            </Text>
            {entry.platform.category && (
              <Badge variant="secondary" className="mt-1 w-fit">
                <Text className="text-xs capitalize">
                  {entry.platform.category}
                </Text>
              </Badge>
            )}
          </View>

          <View className="items-end">
            <Text className="text-2xl font-bold text-gray-900">
              {entry.score.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500">Overall Score</Text>
          </View>
        </View>

        {/* Score Breakdown */}
        {showScoreBreakdown && (
          <View className="pt-3 border-t border-gray-100">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Score Breakdown
            </Text>
            <View className="grid grid-cols-2 gap-3">
              <ScoreComponent
                label="Rating"
                value={entry.scoreComponents.rating}
                max={5}
                color="#F59E0B"
              />
              <ScoreComponent
                label="Volume"
                value={entry.scoreComponents.volume}
                max={Math.max(entry.scoreComponents.volume * 1.5, 10)}
                color="#10B981"
              />
              <ScoreComponent
                label="Activity"
                value={entry.scoreComponents.activity}
                max={Math.max(entry.scoreComponents.activity * 1.5, 50)}
                color="#3B82F6"
              />
              <ScoreComponent
                label="Reliability"
                value={entry.scoreComponents.reliability}
                max={1}
                color="#8B5CF6"
              />
            </View>
          </View>
        )}

        {/* Platform Metrics */}
        <View className="flex-row justify-between pt-3 border-t border-gray-100">
          <View className="items-center">
            <Text className="font-medium text-gray-900">
              {entry.platform.platformRating.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500">Rating</Text>
          </View>
          <View className="items-center">
            <Text className="font-medium text-gray-900">
              {entry.platform.totalVotes}
            </Text>
            <Text className="text-xs text-gray-500">Votes</Text>
          </View>
          <View className="items-center">
            <Text className="font-medium text-gray-900">
              {entry.platform.totalAuctionsHosted}
            </Text>
            <Text className="text-xs text-gray-500">Auctions</Text>
          </View>
          <View className="items-center">
            <Text className="font-medium text-gray-900">
              {(entry.platform.totalRevenueGenerated / 1000000000).toFixed(2)}{' '}
              SOL
            </Text>
            <Text className="text-xs text-gray-500">Revenue</Text>
          </View>
        </View>

        {/* Action Button */}
        <Button variant="outline" onPress={onPress} className="w-full">
          <Text className="text-gray-700 font-medium">
            View Platform Details
          </Text>
        </Button>
      </View>
    </Card>
  );
};

// Podium Position Component
const PodiumPosition: React.FC<{
  entry: PlatformRankingEntry;
  position: 1 | 2 | 3;
}> = ({entry, position}) => {
  const heights = {1: 80, 2: 60, 3: 50};
  const colors = {1: '#F59E0B', 2: '#8B5CF6', 3: '#EF4444'};
  const bgColors = {1: '#FEF3C7', 2: '#EDE9FE', 3: '#FEE2E2'};

  return (
    <View className="items-center">
      <View className="items-center mb-2">
        <Text className="font-bold text-gray-900" numberOfLines={1}>
          {entry.platform.platformName.length > 10
            ? entry.platform.platformName.substring(0, 10) + '...'
            : entry.platform.platformName}
        </Text>
        <Text className="text-xs text-gray-600">
          {entry.score.toFixed(1)} pts
        </Text>
      </View>

      <View
        className="w-16 rounded-t-lg border-2 flex justify-end items-center"
        style={{
          height: heights[position],
          backgroundColor: bgColors[position],
          borderColor: colors[position],
        }}>
        <View className="mb-2">
          <Text
            className="text-2xl font-bold text-center"
            style={{color: colors[position]}}>
            #{position}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Score Component
const ScoreComponent: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
}> = ({label, value, max, color}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <View className="space-y-1">
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-600">{label}</Text>
        <Text className="text-xs font-medium text-gray-900">
          {value.toFixed(1)}
        </Text>
      </View>
      <View className="bg-gray-200 rounded-full h-2">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
};
