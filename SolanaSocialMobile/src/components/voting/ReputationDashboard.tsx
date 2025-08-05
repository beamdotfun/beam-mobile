import React, {useEffect} from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Users,
  BarChart,
  Info,
  ThumbsUp,
  Zap,
} from 'lucide-react-native';
import {useVotingStore} from '../../store/votingStore';
import {useThemeStore} from '../../store/themeStore';
import {Card, CardContent} from '../ui/card';
import {Badge} from '../ui/badge';
import {ReputationMilestones} from './ReputationMilestones';
import {VotingPatterns} from './VotingPatterns';
import {cn} from '../../utils/cn';

const {width} = Dimensions.get('window');
const chartWidth = width - 32;

export function ReputationDashboard() {
  const {colors} = useThemeStore();
  const {
    userReputation,
    votingStats,
    loadUserReputation,
    loadVotingStats,
    getVotingInsights,
    formatReputation,
  } = useVotingStore();

  useEffect(() => {
    loadUserReputation();
    loadVotingStats();
  }, []);

  const insights = getVotingInsights();

  if (!userReputation || !votingStats) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{backgroundColor: colors.background}}>
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-3xl font-bold"
            style={{color: colors.foreground}}>
            {formatReputation(userReputation.score)}
          </Text>
          <View className="flex-row items-center mt-2">
            {userReputation.trend === 'up' ? (
              <TrendingUp size={16} color={colors.primary} />
            ) : userReputation.trend === 'down' ? (
              <TrendingDown size={16} color={colors.destructive} />
            ) : null}
            <Text
              className="text-sm ml-2"
              style={{color: colors.mutedForeground}}>
              Rank #{userReputation.rank} • Top {userReputation.percentile}%
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <View className="w-1/2 px-2 mb-4">
            <Card>
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <ThumbsUp size={20} color={colors.primary} />
                  <Text className="text-sm" style={{color: colors.primary}}>
                    +{votingStats.upvotesReceived}
                  </Text>
                </View>
                <Text
                  className="text-2xl font-bold"
                  style={{color: colors.foreground}}>
                  {votingStats.totalVotesReceived}
                </Text>
                <Text
                  className="text-sm"
                  style={{color: colors.mutedForeground}}>
                  Votes Received
                </Text>
              </CardContent>
            </Card>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <Card>
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Zap size={20} color={colors.primary} />
                  <Badge variant="secondary" size="sm">
                    {votingStats.votingStreak} days
                  </Badge>
                </View>
                <Text
                  className="text-2xl font-bold"
                  style={{color: colors.foreground}}>
                  {votingStats.totalVotesGiven}
                </Text>
                <Text
                  className="text-sm"
                  style={{color: colors.mutedForeground}}>
                  Votes Given
                </Text>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Reputation History Chart */}
        {userReputation.history.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Text
                className="text-lg font-semibold mb-4"
                style={{color: colors.foreground}}>
                Reputation History
              </Text>
              {/* Simple line chart visualization */}
              <View className="h-40">
                <View className="flex-1 flex-row items-end">
                  {userReputation.history.slice(-7).map((point, index) => {
                    const maxScore = Math.max(
                      ...userReputation.history.slice(-7).map(p => p.score),
                    );
                    const height = (point.score / maxScore) * 100;

                    return (
                      <View
                        key={index}
                        className="flex-1 mx-1"
                        style={{
                          height: `${height}%`,
                          backgroundColor: colors.primary,
                          opacity: 0.8,
                        }}
                      />
                    );
                  })}
                </View>
                <View className="flex-row justify-between mt-2">
                  {userReputation.history.slice(-7).map((point, index) => (
                    <Text
                      key={index}
                      className="text-xs"
                      style={{color: colors.mutedForeground}}>
                      {new Date(point.timestamp).getDate()}
                    </Text>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Voting Power */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text
              className="text-lg font-semibold mb-4"
              style={{color: colors.foreground}}>
              Voting Power
            </Text>

            {/* Power Metrics */}
            <View className="space-y-3">
              {[
                {
                  label: 'Power',
                  value: insights.votingPower,
                  color: colors.primary,
                },
                {
                  label: 'Influence',
                  value: insights.influence,
                  color: colors.primary,
                },
                {
                  label: 'Consistency',
                  value: insights.consistency,
                  color: colors.primary,
                },
              ].map(metric => (
                <View key={metric.label}>
                  <View className="flex-row justify-between mb-1">
                    <Text
                      className="text-sm"
                      style={{color: colors.foreground}}>
                      {metric.label}
                    </Text>
                    <Text
                      className="text-sm font-medium"
                      style={{color: colors.foreground}}>
                      {metric.value}%
                    </Text>
                  </View>
                  <View
                    className="h-2 rounded-full"
                    style={{backgroundColor: colors.muted}}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${metric.value}%`,
                        backgroundColor: metric.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Insights */}
            <View className="mt-4">
              {insights.suggestions.map((suggestion, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Info size={14} color={colors.primary} />
                  <Text
                    className="text-sm ml-2 flex-1"
                    style={{color: colors.mutedForeground}}>
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Reputation Breakdown */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text
              className="text-lg font-semibold mb-4"
              style={{color: colors.foreground}}>
              Reputation Breakdown
            </Text>
            {Object.entries(userReputation.breakdown).map(([key, value]) => (
              <View
                key={key}
                className="flex-row items-center justify-between py-2">
                <Text
                  className="text-sm capitalize"
                  style={{color: colors.foreground}}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <View className="flex-row items-center">
                  <View
                    className="w-24 h-2 rounded-full mr-2"
                    style={{backgroundColor: colors.muted}}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${(value / userReputation.score) * 100}%`,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                  <Text
                    className="text-sm font-medium w-12 text-right"
                    style={{color: colors.foreground}}>
                    {value}
                  </Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Milestones */}
        <ReputationMilestones
          milestones={userReputation.milestones}
          currentScore={userReputation.score}
          nextMilestone={userReputation.nextMilestone}
        />

        {/* Voting Patterns */}
        <VotingPatterns stats={votingStats} />

        {/* Achievements */}
        {votingStats.votingAchievements.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <Text
                className="text-lg font-semibold mb-4"
                style={{color: colors.foreground}}>
                Voting Achievements
              </Text>
              <View className="flex-row flex-wrap -mx-2">
                {votingStats.votingAchievements.map(achievement => (
                  <View key={achievement.id} className="w-1/3 px-2 mb-4">
                    <Pressable
                      className={cn('items-center p-3 rounded-lg')}
                      style={{
                        backgroundColor: achievement.unlockedAt
                          ? `${colors.primary}20`
                          : colors.muted,
                      }}>
                      <Award
                        size={32}
                        color={
                          achievement.unlockedAt
                            ? colors.primary
                            : colors.mutedForeground
                        }
                      />
                      <Text
                        className={cn('text-xs text-center mt-2')}
                        style={{
                          color: achievement.unlockedAt
                            ? colors.foreground
                            : colors.mutedForeground,
                        }}>
                        {achievement.name}
                      </Text>
                      {!achievement.unlockedAt && (
                        <Text
                          className="text-xs"
                          style={{color: colors.mutedForeground}}>
                          {achievement.progress}/{achievement.target}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
