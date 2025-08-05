import React from 'react';
import {View, Text, Image, ScrollView} from 'react-native';
import {Users, TrendingUp, Clock} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {VotingStats} from '../../types/voting';
import {Card, CardContent} from '../ui/card';

interface VotingPatternsProps {
  stats: VotingStats;
}

export function VotingPatterns({stats}: VotingPatternsProps) {
  const {colors} = useThemeStore();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.foreground}}>
          Voting Patterns
        </Text>

        {/* Most Voted Users */}
        {stats.mostVotedUsers.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Users size={16} color={colors.primary} />
              <Text
                className="text-sm font-medium ml-2"
                style={{color: colors.foreground}}>
                Top Interactions
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stats.mostVotedUsers.map(user => (
                <View
                  key={user.userWallet}
                  className="mr-3 items-center p-2 rounded-lg"
                  style={{backgroundColor: colors.muted}}>
                  {user.profilePicture ? (
                    <Image
                      source={{uri: user.profilePicture}}
                      className="w-10 h-10 rounded-full mb-1"
                    />
                  ) : (
                    <View
                      className="w-10 h-10 rounded-full mb-1"
                      style={{backgroundColor: colors.border}}
                    />
                  )}
                  <Text
                    className="text-xs font-medium"
                    style={{color: colors.foreground}}
                    numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{
                      color:
                        user.relationship === 'supporter'
                          ? colors.primary
                          : user.relationship === 'critic'
                          ? colors.destructive
                          : colors.mutedForeground,
                    }}>
                    {user.relationship}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Voting Trends */}
        {stats.votingTrends.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={16} color={colors.primary} />
              <Text
                className="text-sm font-medium ml-2"
                style={{color: colors.foreground}}>
                Recent Trends
              </Text>
            </View>
            {stats.votingTrends.slice(0, 3).map((trend, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between py-2"
                style={{
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderColor: colors.border,
                }}>
                <Text className="text-sm" style={{color: colors.foreground}}>
                  {trend.period}
                </Text>
                <View className="flex-row items-center">
                  <Text
                    className="text-sm mr-2"
                    style={{color: colors.primary}}>
                    ↑{trend.upvotes}
                  </Text>
                  <Text className="text-sm" style={{color: colors.destructive}}>
                    ↓{trend.downvotes}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Voting Hours */}
        {stats.votingHours.length > 0 && (
          <View>
            <View className="flex-row items-center mb-2">
              <Clock size={16} color={colors.primary} />
              <Text
                className="text-sm font-medium ml-2"
                style={{color: colors.foreground}}>
                Active Hours
              </Text>
            </View>
            <View className="flex-row h-12">
              {stats.votingHours.map(hour => (
                <View
                  key={hour.hour}
                  className="flex-1 mx-0.5"
                  style={{
                    backgroundColor: colors.primary,
                    opacity: hour.percentage / 100,
                    height: `${hour.percentage}%`,
                    alignSelf: 'flex-end',
                  }}
                />
              ))}
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                12AM
              </Text>
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                12PM
              </Text>
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                11PM
              </Text>
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
