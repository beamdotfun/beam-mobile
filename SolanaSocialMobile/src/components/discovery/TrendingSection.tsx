import React, {useEffect} from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {
  TrendingUp,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Badge} from '../ui/badge';
import {useThemeStore} from '../../store/themeStore';
import {useDiscoveryStore} from '../../store/discovery';
import {TrendingTopic} from '../../types/discovery';

interface TrendingSectionProps {
  showAll?: boolean;
  onTopicPress?: (topic: TrendingTopic) => void;
}

function TrendingTopicItem({
  topic,
  onPress,
}: {
  topic: TrendingTopic;
  onPress?: () => void;
}) {
  const {colors} = useThemeStore();

  const getTrendIcon = () => {
    switch (topic.trend) {
      case 'rising':
        return <ArrowUpRight size={16} color={colors.success} />;
      case 'falling':
        return <ArrowDownRight size={16} color={colors.destructive} />;
      default:
        return <Hash size={16} color={colors.mutedForeground} />;
    }
  };

  const getTrendColor = () => {
    switch (topic.trend) {
      case 'rising':
        return colors.success;
      case 'falling':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  return (
    <Pressable onPress={onPress}>
      <Card className="mx-2 w-48">
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Hash size={16} color={colors.primary} />
              <Text
                className="text-foreground font-semibold ml-1"
                numberOfLines={1}>
                {topic.name}
              </Text>
            </View>
            {getTrendIcon()}
          </View>

          <Text
            className="text-muted-foreground text-sm mb-2"
            numberOfLines={2}>
            {topic.description || 'Trending topic'}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">
              {topic.postCount} posts
            </Text>
            <Badge
              variant={
                topic.trend === 'rising'
                  ? 'success'
                  : topic.trend === 'falling'
                  ? 'destructive'
                  : 'secondary'
              }>
              {topic.category}
            </Badge>
          </View>

          <Text className="text-xs mt-1" style={{color: getTrendColor()}}>
            Score: {topic.engagementScore}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );
}

export function TrendingSection({
  showAll = false,
  onTopicPress,
}: TrendingSectionProps) {
  const {colors} = useThemeStore();
  const {trendingTopics, trendingLoading, loadTrendingTopics} =
    useDiscoveryStore();

  useEffect(() => {
    if (trendingTopics.length === 0) {
      loadTrendingTopics();
    }
  }, []);

  const displayTopics = showAll ? trendingTopics : trendingTopics.slice(0, 5);

  if (trendingLoading) {
    return (
      <View className="p-4">
        <Text className="text-muted-foreground text-center">
          Loading trending topics...
        </Text>
      </View>
    );
  }

  if (displayTopics.length === 0) {
    return null;
  }

  if (showAll) {
    return (
      <View className="flex-1 p-4">
        <View className="space-y-2">
          {displayTopics.map(topic => (
            <Pressable
              key={topic.id}
              onPress={() => onTopicPress?.(topic)}
              className="flex-row items-center justify-between p-4 bg-card rounded-lg border border-border">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Hash size={16} color={colors.primary} />
                  <Text className="text-foreground font-semibold ml-2">
                    {topic.name}
                  </Text>
                  <Badge variant="secondary" className="ml-2">
                    {topic.category}
                  </Badge>
                </View>

                {topic.description && (
                  <Text className="text-muted-foreground text-sm mb-2">
                    {topic.description}
                  </Text>
                )}

                <View className="flex-row items-center space-x-4">
                  <Text className="text-muted-foreground text-xs">
                    {topic.postCount} posts
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    Score: {topic.engagementScore}
                  </Text>
                </View>
              </View>

              <View className="items-center">
                {topic.trend === 'rising' && (
                  <ArrowUpRight size={20} color={colors.success} />
                )}
                {topic.trend === 'falling' && (
                  <ArrowDownRight size={20} color={colors.destructive} />
                )}
                {topic.trend === 'stable' && (
                  <Hash size={20} color={colors.mutedForeground} />
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center">
          <TrendingUp size={20} color={colors.primary} />
          <Text className="text-lg font-bold text-foreground ml-2">
            Trending Now
          </Text>
        </View>
        <Text className="text-primary text-sm font-medium">See All</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingLeft: 16, paddingRight: 16}}>
        {displayTopics.map(topic => (
          <TrendingTopicItem
            key={topic.id}
            topic={topic}
            onPress={() => onTopicPress?.(topic)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
