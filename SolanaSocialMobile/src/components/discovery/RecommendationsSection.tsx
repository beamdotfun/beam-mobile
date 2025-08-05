import React, {useEffect} from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {Sparkles, X, User, Building2, Hash} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {useThemeStore} from '../../store/themeStore';
import {useDiscoveryStore} from '../../store/discovery';
import {Recommendation} from '../../types/discovery';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onPress?: () => void;
  onDismiss?: () => void;
}

function RecommendationCard({
  recommendation,
  onPress,
  onDismiss,
}: RecommendationCardProps) {
  const {colors} = useThemeStore();

  const getIcon = () => {
    switch (recommendation.type) {
      case 'user':
        return <User size={16} color={colors.primary} />;
      case 'brand':
        return <Building2 size={16} color={colors.brand} />;
      case 'topic':
        return <Hash size={16} color={colors.primary} />;
      default:
        return <Sparkles size={16} color={colors.primary} />;
    }
  };

  const getTypeLabel = () => {
    switch (recommendation.type) {
      case 'user':
        return 'User';
      case 'brand':
        return 'Brand';
      case 'topic':
        return 'Topic';
      default:
        return 'Recommendation';
    }
  };

  return (
    <Card className="mx-2 w-72">
      <CardContent className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center">
            {getIcon()}
            <Badge variant="secondary" className="ml-2">
              {getTypeLabel()}
            </Badge>
          </View>
          <Pressable onPress={onDismiss} className="p-1">
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text className="text-foreground font-semibold mb-1">
          {recommendation.title}
        </Text>

        <Text className="text-muted-foreground text-sm mb-3">
          {recommendation.reason}
        </Text>

        {/* Render recommendation data based on type */}
        {recommendation.type === 'user' && recommendation.data && (
          <View className="flex-row items-center mb-3">
            <Avatar
              src={recommendation.data.profilePicture}
              fallback={recommendation.data.displayName?.charAt(0) || '?'}
              size="sm"
            />
            <View className="ml-2 flex-1">
              <Text className="text-foreground text-sm font-medium">
                {recommendation.data.displayName}
              </Text>
              <Text className="text-muted-foreground text-xs">
                {recommendation.data.followerCount} followers
              </Text>
            </View>
          </View>
        )}

        {recommendation.type === 'brand' && recommendation.data && (
          <View className="flex-row items-center mb-3">
            <Avatar
              src={recommendation.data.logo}
              fallback={recommendation.data.brandName?.charAt(0) || '?'}
              size="sm"
            />
            <View className="ml-2 flex-1">
              <Text className="text-foreground text-sm font-medium">
                {recommendation.data.brandName}
              </Text>
              <Text className="text-muted-foreground text-xs">
                {recommendation.data.followerCount} followers
              </Text>
            </View>
          </View>
        )}

        {recommendation.type === 'topic' && recommendation.data && (
          <View className="mb-3">
            <Text className="text-foreground text-sm font-medium">
              #{recommendation.data.name}
            </Text>
            <Text className="text-muted-foreground text-xs">
              {recommendation.data.postCount} posts
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground text-xs">
            {Math.round(recommendation.confidence * 100)}% match
          </Text>
          <Button size="sm" onPress={onPress}>
            {recommendation.type === 'user' || recommendation.type === 'brand'
              ? 'Follow'
              : 'Explore'}
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}

interface RecommendationsSectionProps {
  onUserPress?: (userId: string) => void;
  onBrandPress?: (brandId: string) => void;
  onTopicPress?: (topic: string) => void;
}

export function RecommendationsSection({
  onUserPress,
  onBrandPress,
  onTopicPress,
}: RecommendationsSectionProps) {
  const {colors} = useThemeStore();
  const {
    userRecommendations,
    brandRecommendations,
    topicRecommendations,
    loadRecommendations,
    dismissRecommendation,
  } = useDiscoveryStore();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const allRecommendations = [
    ...userRecommendations,
    ...brandRecommendations,
    ...topicRecommendations,
  ].sort((a, b) => b.confidence - a.confidence);

  if (allRecommendations.length === 0) {
    return null;
  }

  const handleRecommendationPress = (rec: Recommendation) => {
    switch (rec.type) {
      case 'user':
        onUserPress?.(rec.id);
        break;
      case 'brand':
        onBrandPress?.(rec.id);
        break;
      case 'topic':
        onTopicPress?.(rec.data?.name || rec.title);
        break;
    }
  };

  const handleDismiss = (rec: Recommendation) => {
    dismissRecommendation(rec.type, rec.id);
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center">
          <Sparkles size={20} color={colors.primary} />
          <Text className="text-lg font-bold text-foreground ml-2">
            Recommended for You
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingLeft: 16, paddingRight: 16}}>
        {allRecommendations.slice(0, 10).map(rec => (
          <RecommendationCard
            key={`${rec.type}-${rec.id}`}
            recommendation={rec}
            onPress={() => handleRecommendationPress(rec)}
            onDismiss={() => handleDismiss(rec)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
