import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Award,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {useThemeStore} from '../../store/themeStore';
import {useDiscoveryStore} from '../../store/discovery';
import {LeaderboardEntry} from '../../types/discovery';

const Tab = createMaterialTopTabNavigator();

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onUserPress?: (walletAddress: string) => void;
}

function LeaderboardList({
  entries,
  loading,
  onUserPress,
}: LeaderboardListProps) {
  const {colors} = useThemeStore();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-muted-foreground">Loading leaderboard...</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Trophy size={48} color={colors.mutedForeground} />
        <Text className="text-muted-foreground text-center mt-4">
          No leaderboard data available
        </Text>
      </View>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={20} color={colors.warning} />;
      case 2:
        return <Award size={20} color="#C0C0C0" />;
      case 3:
        return <Award size={20} color="#CD7F32" />;
      default:
        return (
          <View className="w-6 h-6 rounded-full bg-muted items-center justify-center">
            <Text className="text-muted-foreground text-xs font-bold">
              {rank}
            </Text>
          </View>
        );
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp size={14} color={colors.success} />;
    } else if (change < 0) {
      return <TrendingDown size={14} color={colors.destructive} />;
    }
    return null;
  };

  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      <View className="space-y-2">
        {entries.map(entry => (
          <Pressable
            key={entry.walletAddress}
            onPress={() => onUserPress?.(entry.walletAddress)}>
            <Card>
              <CardContent className="p-4">
                <View className="flex-row items-center space-x-3">
                  {getRankIcon(entry.rank)}

                  <Avatar
                    src={entry.profilePicture}
                    fallback={entry.displayName.charAt(0)}
                    size="md"
                  />

                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-foreground font-semibold">
                        {entry.displayName}
                      </Text>
                      {entry.verified && (
                        <Badge variant="success" className="ml-2">
                          <Text className="text-xs">Verified</Text>
                        </Badge>
                      )}
                      {entry.brandAddress && (
                        <Badge variant="brand" className="ml-2">
                          <Text className="text-xs">Brand</Text>
                        </Badge>
                      )}
                    </View>

                    <View className="flex-row items-center mt-1 space-x-2">
                      <Text className="text-muted-foreground text-sm">
                        Score: {entry.score.toLocaleString()}
                      </Text>
                      {entry.change !== 0 && (
                        <View className="flex-row items-center">
                          {getChangeIcon(entry.change)}
                          <Text
                            className="text-xs ml-1"
                            style={{
                              color:
                                entry.change > 0
                                  ? colors.success
                                  : colors.destructive,
                            }}>
                            {Math.abs(entry.change)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text className="text-muted-foreground text-lg font-bold">
                    #{entry.rank}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function ReputationLeaderboard({
  onUserPress,
}: {
  onUserPress?: (walletAddress: string) => void;
}) {
  const {reputationLeaderboard, leaderboardLoading, loadLeaderboard} =
    useDiscoveryStore();

  useEffect(() => {
    loadLeaderboard('reputation');
  }, []);

  return (
    <LeaderboardList
      entries={reputationLeaderboard}
      loading={leaderboardLoading}
      onUserPress={onUserPress}
    />
  );
}

function TipsLeaderboard({
  onUserPress,
}: {
  onUserPress?: (walletAddress: string) => void;
}) {
  const {tipsLeaderboard, leaderboardLoading, loadLeaderboard} =
    useDiscoveryStore();

  useEffect(() => {
    loadLeaderboard('tips');
  }, []);

  return (
    <LeaderboardList
      entries={tipsLeaderboard}
      loading={leaderboardLoading}
      onUserPress={onUserPress}
    />
  );
}

function PostsLeaderboard({
  onUserPress,
}: {
  onUserPress?: (walletAddress: string) => void;
}) {
  const {postsLeaderboard, leaderboardLoading, loadLeaderboard} =
    useDiscoveryStore();

  useEffect(() => {
    loadLeaderboard('posts');
  }, []);

  return (
    <LeaderboardList
      entries={postsLeaderboard}
      loading={leaderboardLoading}
      onUserPress={onUserPress}
    />
  );
}

interface LeaderboardSectionProps {
  onUserPress?: (walletAddress: string) => void;
}

export function LeaderboardSection({onUserPress}: LeaderboardSectionProps) {
  const {colors} = useThemeStore();

  return (
    <View className="flex-1">
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarIndicatorStyle: {backgroundColor: colors.primary},
          tabBarStyle: {backgroundColor: colors.background},
          tabBarLabelStyle: {fontSize: 12, fontWeight: '600'},
        }}>
        <Tab.Screen
          name="Reputation"
          children={() => <ReputationLeaderboard onUserPress={onUserPress} />}
        />
        <Tab.Screen
          name="Tips"
          children={() => <TipsLeaderboard onUserPress={onUserPress} />}
        />
        <Tab.Screen
          name="Posts"
          children={() => <PostsLeaderboard onUserPress={onUserPress} />}
        />
      </Tab.Navigator>
    </View>
  );
}
