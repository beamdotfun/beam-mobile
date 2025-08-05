import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {TrendingUp, TrendingDown} from 'lucide-react-native';
import {useVotingStore} from '../../store/votingStore';
import {useThemeStore} from '../../store/themeStore';
import {VoteImpact} from '../../types/voting';

interface VoteImpactPreviewProps {
  targetUser: string;
  voteValue: number;
  currentScore: number;
}

export function VoteImpactPreview({
  targetUser,
  voteValue,
  currentScore,
}: VoteImpactPreviewProps) {
  const {colors} = useThemeStore();
  const {getVoteImpactPreview, formatReputation} = useVotingStore();

  const [impact, setImpact] = useState<VoteImpact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadImpactPreview();
  }, [targetUser, voteValue]);

  const loadImpactPreview = async () => {
    setIsLoading(true);
    try {
      const previewImpact = await getVoteImpactPreview(targetUser, voteValue);
      setImpact(previewImpact);
    } catch (error) {
      console.error('Failed to load impact preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="absolute -top-20 bg-card p-3 rounded-lg shadow-lg">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!impact) {
    return null;
  }

  const isPositive = impact.change > 0;

  return (
    <View
      className="absolute -top-24 p-3 rounded-lg shadow-lg"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
      }}>
      <View className="flex-row items-center">
        {isPositive ? (
          <TrendingUp size={16} color={colors.primary} />
        ) : (
          <TrendingDown size={16} color={colors.destructive} />
        )}
        <Text
          className="text-sm font-medium ml-2"
          style={{color: colors.foreground}}>
          Impact Preview
        </Text>
      </View>

      <View className="mt-2">
        <Text className="text-xs" style={{color: colors.mutedForeground}}>
          Score: {formatReputation(currentScore)} →{' '}
          {formatReputation(impact.newScore)}
        </Text>
        <Text
          className="text-xs"
          style={{
            color: isPositive ? colors.primary : colors.destructive,
          }}>
          Change: {isPositive ? '+' : ''}
          {impact.change} ({impact.percentageChange > 0 ? '+' : ''}
          {impact.percentageChange.toFixed(1)}%)
        </Text>

        {impact.effects.rankChange !== 0 && (
          <Text className="text-xs" style={{color: colors.mutedForeground}}>
            Rank: {impact.effects.rankChange > 0 ? '+' : ''}
            {impact.effects.rankChange}
          </Text>
        )}
      </View>
    </View>
  );
}
