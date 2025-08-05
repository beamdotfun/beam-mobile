import React from 'react';
import {View, Text, FlatList, Pressable} from 'react-native';
import {
  User,
  MessageSquare,
  Building2,
  Hash,
  Shield,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {useThemeStore} from '../../store/themeStore';
import {useDiscoveryStore} from '../../store/discovery';
import {
  SearchResult,
  UserSearchResult,
  PostSearchResult,
  BrandSearchResult,
} from '@/types/discovery';
import {formatDistanceToNow} from 'date-fns';

interface SearchResultsProps {
  onUserPress?: (walletAddress: string) => void;
  onPostPress?: (postId: string) => void;
  onBrandPress?: (brandAddress: string) => void;
  onTopicPress?: (topic: string) => void;
}

function UserResultItem({
  result,
  onPress,
}: {
  result: UserSearchResult;
  onPress?: () => void;
}) {
  const {colors} = useThemeStore();

  return (
    <Pressable onPress={onPress}>
      <Card className="mx-4 mb-2">
        <CardContent className="p-4">
          <View className="flex-row items-center space-x-3">
            <Avatar
              src={result.profilePicture}
              fallback={result.displayName.charAt(0)}
              size="md"
            />

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-foreground font-semibold">
                  {result.displayName}
                </Text>
                {result.isVerified && (
                  <Shield size={14} color={colors.verified} className="ml-1" />
                )}
              </View>

              {result.bio && (
                <Text
                  className="text-muted-foreground text-sm mt-1"
                  numberOfLines={1}>
                  {result.bio}
                </Text>
              )}

              <View className="flex-row items-center mt-2 space-x-4">
                <Text className="text-muted-foreground text-xs">
                  {result.followerCount} followers
                </Text>
                <Text className="text-muted-foreground text-xs">
                  Rep: {result.onChainReputation}
                </Text>
              </View>
            </View>

            <Button
              size="sm"
              variant={result.isFollowing ? 'outline' : 'default'}>
              {result.isFollowing ? 'Following' : 'Follow'}
            </Button>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

function PostResultItem({
  result,
  onPress,
}: {
  result: PostSearchResult;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mx-4 mb-2">
        <CardContent className="p-4">
          <View className="flex-row items-start space-x-3">
            <MessageSquare size={20} color="#666" />

            <View className="flex-1">
              <Text className="text-foreground font-medium">
                {result.authorName}
              </Text>

              <Text className="text-foreground mt-1" numberOfLines={3}>
                {result.message}
              </Text>

              <View className="flex-row items-center mt-2 space-x-4">
                <Text className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(result.createdAt), {
                    addSuffix: true,
                  })}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  Score: {result.voteScore}
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

function BrandResultItem({
  result,
  onPress,
}: {
  result: BrandSearchResult;
  onPress?: () => void;
}) {
  const {colors} = useThemeStore();

  return (
    <Pressable onPress={onPress}>
      <Card className="mx-4 mb-2">
        <CardContent className="p-4">
          <View className="flex-row items-center space-x-3">
            <Avatar
              src={result.logo}
              fallback={result.brandName.charAt(0)}
              size="md"
            />

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-foreground font-semibold">
                  {result.brandName}
                </Text>
                {result.isVerified && (
                  <Badge variant="brand" className="ml-2">
                    Brand
                  </Badge>
                )}
              </View>

              {result.description && (
                <Text
                  className="text-muted-foreground text-sm mt-1"
                  numberOfLines={2}>
                  {result.description}
                </Text>
              )}

              <Text className="text-muted-foreground text-xs mt-2">
                {result.followerCount} followers
              </Text>
            </View>

            <Building2 size={20} color={colors.brand} />
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

export function SearchResults({
  onUserPress,
  onPostPress,
  onBrandPress,
  onTopicPress,
}: SearchResultsProps) {
  const {searchResults, searchLoading, searchQuery} = useDiscoveryStore();

  const renderResult = ({item}: {item: SearchResult}) => {
    switch (item.type) {
      case 'user':
        return (
          <UserResultItem
            result={item as UserSearchResult}
            onPress={() => onUserPress?.(item.id)}
          />
        );
      case 'post':
        return (
          <PostResultItem
            result={item as PostSearchResult}
            onPress={() => onPostPress?.(item.id)}
          />
        );
      case 'brand':
        return (
          <BrandResultItem
            result={item as BrandSearchResult}
            onPress={() => onBrandPress?.(item.id)}
          />
        );
      default:
        return null;
    }
  };

  if (searchLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-muted-foreground">Searching...</Text>
      </View>
    );
  }

  if (!searchQuery) {
    return null;
  }

  if (searchResults.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8 py-12">
        <Text className="text-muted-foreground text-lg text-center mb-2">
          No results found
        </Text>
        <Text className="text-muted-foreground text-center">
          Try adjusting your search terms or filters
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={searchResults}
      keyExtractor={item => `${item.type}-${item.id}`}
      renderItem={renderResult}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingVertical: 8}}
    />
  );
}
