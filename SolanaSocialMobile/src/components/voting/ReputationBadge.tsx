import React from 'react';
import {View, Text} from 'react-native';
import {Award, Crown, Star} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useVotingStore} from '../../store/votingStore';

interface ReputationBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function ReputationBadge({
  score,
  size = 'medium',
  showLabel = true,
}: ReputationBadgeProps) {
  const {colors} = useThemeStore();
  const {formatReputation} = useVotingStore();

  const getBadgeInfo = (score: number) => {
    if (score >= 10000) {
      return {
        icon: Crown,
        color: '#FFD700', // Gold
        label: 'Legend',
        bgColor: 'rgba(255, 215, 0, 0.1)',
      };
    } else if (score >= 5000) {
      return {
        icon: Star,
        color: '#C0C0C0', // Silver
        label: 'Expert',
        bgColor: 'rgba(192, 192, 192, 0.1)',
      };
    } else if (score >= 1000) {
      return {
        icon: Award,
        color: '#CD7F32', // Bronze
        label: 'Veteran',
        bgColor: 'rgba(205, 127, 50, 0.1)',
      };
    } else if (score >= 100) {
      return {
        icon: Award,
        color: colors.primary,
        label: 'Active',
        bgColor: `${colors.primary}20`,
      };
    } else {
      return {
        icon: Award,
        color: colors.mutedForeground,
        label: 'Newcomer',
        bgColor: colors.muted,
      };
    }
  };

  const badgeInfo = getBadgeInfo(score);
  const Icon = badgeInfo.icon;

  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const textSize =
    size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';

  return (
    <View className="flex-row items-center">
      <View
        className="p-1 rounded-full mr-2"
        style={{backgroundColor: badgeInfo.bgColor}}>
        <Icon size={iconSize} color={badgeInfo.color} />
      </View>
      {showLabel && (
        <View>
          <Text
            className={`font-medium ${textSize}`}
            style={{color: colors.foreground}}>
            {formatReputation(score)}
          </Text>
          <Text className="text-xs" style={{color: colors.mutedForeground}}>
            {badgeInfo.label}
          </Text>
        </View>
      )}
    </View>
  );
}
