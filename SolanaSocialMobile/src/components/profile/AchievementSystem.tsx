import React, {useEffect} from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Trophy,
  Lock,
  Star,
  Zap,
  Users,
  Heart,
  TrendingUp,
} from 'lucide-react-native';
import {useEnhancedProfileStore} from '../../store/profile-enhanced';
import {useThemeStore} from '../../store/themeStore';
import {Achievement} from '../../types/profile-enhanced';
import {Card, CardContent} from '../ui/card';
import {Badge} from '../ui/badge';
import {cn} from '../../utils/cn';

export function AchievementSystem() {
  const {colors} = useThemeStore();
  const {
    achievements,
    isLoadingAchievements,
    loadAchievements,
    claimAchievement,
    featureAchievement,
  } = useEnhancedProfileStore();

  useEffect(() => {
    loadAchievements();
  }, []);

  const handleClaim = async (achievementId: string) => {
    try {
      await claimAchievement(achievementId);
      // Show success animation
    } catch (error) {
      console.error('Failed to claim achievement:', error);
    }
  };

  const handleFeature = async (achievement: Achievement) => {
    try {
      await featureAchievement(achievement.id, !achievement.featured);
    } catch (error) {
      console.error('Failed to feature achievement:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return colors.muted;
      case 'rare':
        return colors.primary;
      case 'epic':
        return colors.secondary;
      case 'legendary':
        return colors.warning || colors.primary;
      default:
        return colors.muted;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'social':
        return Users;
      case 'engagement':
        return Heart;
      case 'reputation':
        return TrendingUp;
      case 'special':
        return Star;
      case 'milestone':
        return Trophy;
      default:
        return Trophy;
    }
  };

  const renderAchievement = (achievement: Achievement) => {
    const isUnlocked = !!achievement.unlockedAt;
    const canClaim = achievement.progress >= 100 && !isUnlocked;

    return (
      <Card
        key={achievement.id}
        className={cn('mb-4', !isUnlocked && 'opacity-75')}>
        <Pressable
          onPress={() => isUnlocked && handleFeature(achievement)}
          disabled={!isUnlocked}
          className="p-4">
          <View className="flex-row items-start">
            {/* Icon */}
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{
                backgroundColor: getRarityColor(achievement.rarity) + '20',
              }}>
              {isUnlocked ? (
                <Trophy size={32} color={getRarityColor(achievement.rarity)} />
              ) : (
                <Lock size={32} color={colors.muted} />
              )}
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-semibold text-base text-foreground">
                  {achievement.name}
                </Text>
                {achievement.featured && isUnlocked && (
                  <Star
                    size={16}
                    color={colors.warning || colors.primary}
                    fill={colors.warning || colors.primary}
                  />
                )}
              </View>

              <Text className="text-sm text-muted-foreground mb-2">
                {achievement.description}
              </Text>

              {/* Progress */}
              {!isUnlocked && (
                <View className="mb-2">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-muted-foreground">
                      Progress: {achievement.current}/{achievement.target}
                    </Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {achievement.progress}%
                    </Text>
                  </View>
                  <View className="h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary"
                      style={{width: `${achievement.progress}%`}}
                    />
                  </View>
                </View>
              )}

              {/* Rarity and Reward */}
              <View className="flex-row items-center justify-between">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: getRarityColor(achievement.rarity) + '20',
                  }}>
                  <Text
                    className="text-xs capitalize"
                    style={{color: getRarityColor(achievement.rarity)}}>
                    {achievement.rarity}
                  </Text>
                </Badge>

                {canClaim && (
                  <Pressable
                    onPress={() => handleClaim(achievement.id)}
                    className="bg-primary px-3 py-1 rounded-full">
                    <Text className="text-primary-foreground text-xs font-semibold">
                      Claim
                    </Text>
                  </Pressable>
                )}

                {isUnlocked && achievement.reward && (
                  <View className="flex-row items-center">
                    <Zap size={14} color={colors.warning || colors.primary} />
                    <Text className="text-xs text-foreground ml-1">
                      {achievement.reward.value}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Card>
    );
  };

  const categories = [
    {id: 'social', title: 'Social', icon: Users},
    {id: 'engagement', title: 'Engagement', icon: Heart},
    {id: 'reputation', title: 'Reputation', icon: TrendingUp},
    {id: 'special', title: 'Special', icon: Star},
    {id: 'milestone', title: 'Milestones', icon: Trophy},
  ];

  if (isLoadingAchievements) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">
          Achievements
        </Text>

        {/* Stats */}
        <View className="flex-row justify-between mb-6">
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">
              {achievements.filter(a => a.unlockedAt).length}
            </Text>
            <Text className="text-sm text-muted-foreground">Unlocked</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">
              {achievements.length}
            </Text>
            <Text className="text-sm text-muted-foreground">Total</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">
              {achievements.length > 0
                ? Math.round(
                    (achievements.filter(a => a.unlockedAt).length /
                      achievements.length) *
                      100,
                  )
                : 0}
              %
            </Text>
            <Text className="text-sm text-muted-foreground">Complete</Text>
          </View>
        </View>

        {/* Categories */}
        {categories.map(category => {
          const categoryAchievements = achievements.filter(
            a => a.category === category.id,
          );
          if (categoryAchievements.length === 0) {
            return null;
          }

          const Icon = category.icon;

          return (
            <View key={category.id} className="mb-6">
              <View className="flex-row items-center mb-4">
                <Icon size={20} color={colors.primary} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  {category.title}
                </Text>
                <Text className="text-sm text-muted-foreground ml-2">
                  ({categoryAchievements.filter(a => a.unlockedAt).length}/
                  {categoryAchievements.length})
                </Text>
              </View>
              {categoryAchievements.map(renderAchievement)}
            </View>
          );
        })}

        {/* Empty state */}
        {achievements.length === 0 && (
          <View className="flex-1 items-center justify-center py-20">
            <Trophy size={48} color={colors.muted} />
            <Text className="text-lg font-medium text-foreground mt-4">
              No Achievements Yet
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-2 px-8">
              Complete challenges and milestones to unlock achievements
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
