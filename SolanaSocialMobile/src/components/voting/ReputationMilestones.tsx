import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {Award, Lock, Check} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {ReputationMilestone} from '../../types/voting';
import {Card, CardContent} from '../ui/card';
import {cn} from '../../utils/cn';

interface ReputationMilestonesProps {
  milestones: ReputationMilestone[];
  currentScore: number;
  nextMilestone?: ReputationMilestone;
}

export function ReputationMilestones({
  milestones,
  currentScore,
  nextMilestone,
}: ReputationMilestonesProps) {
  const {colors} = useThemeStore();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.foreground}}>
          Reputation Milestones
        </Text>

        {/* Next Milestone Progress */}
        {nextMilestone && (
          <View
            className="mb-4 p-3 rounded-lg"
            style={{backgroundColor: colors.muted}}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-medium" style={{color: colors.foreground}}>
                Next: {nextMilestone.name}
              </Text>
              <Text className="text-sm" style={{color: colors.mutedForeground}}>
                {currentScore}/{nextMilestone.requiredScore}
              </Text>
            </View>
            <View
              className="h-2 rounded-full"
              style={{backgroundColor: colors.border}}>
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  width: `${
                    (currentScore / nextMilestone.requiredScore) * 100
                  }%`,
                }}
              />
            </View>
            <Text
              className="text-xs mt-1"
              style={{color: colors.mutedForeground}}>
              {nextMilestone.description}
            </Text>
          </View>
        )}

        {/* Milestones List */}
        <View className="space-y-2">
          {milestones.map(milestone => {
            const isUnlocked = milestone.unlockedAt !== undefined;
            const isNext = milestone.id === nextMilestone?.id;

            return (
              <Pressable
                key={milestone.id}
                className={cn(
                  'flex-row items-center p-3 rounded-lg',
                  isUnlocked && 'bg-primary/10',
                  isNext && 'border',
                  !isUnlocked && !isNext && 'opacity-50',
                )}
                style={{
                  backgroundColor: isUnlocked
                    ? `${colors.primary}20`
                    : colors.muted,
                  borderColor: isNext ? colors.primary : 'transparent',
                }}>
                <View className="mr-3">
                  {isUnlocked ? (
                    <Check size={24} color={colors.primary} />
                  ) : (
                    <Lock size={24} color={colors.mutedForeground} />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className="font-medium"
                    style={{
                      color: isUnlocked
                        ? colors.foreground
                        : colors.mutedForeground,
                    }}>
                    {milestone.name}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{color: colors.mutedForeground}}>
                    {milestone.requiredScore} points
                  </Text>
                </View>
                {milestone.badge && (
                  <Award
                    size={20}
                    color={isUnlocked ? colors.primary : colors.mutedForeground}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
}
