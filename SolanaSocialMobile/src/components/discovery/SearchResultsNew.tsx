import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  Search,
  User,
  FileText,
  Hash,
  Users,
  Building,
  Filter,
} from 'lucide-react-native';
import {
  SearchResult,
  SearchPost,
  SearchUser,
  SearchHashtag,
  SearchGroup,
  SearchBrand,
} from '@/types/discovery';
import {Card} from '../ui/card';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {formatNumber, formatDistanceToNow} from '../../utils/formatting';
import {useDiscoveryStore} from '../../store/discoveryStore';

interface SearchResultsProps {
  results: SearchResult | null;
  query: string;
  loading?: boolean;
}

export const SearchResultsNew: React.FC<SearchResultsProps> = ({
  results,
  query,
  loading,
}) => {
  const navigation = useNavigation();
  const {followCreator, unfollowCreator, bookmarkPost} = useDiscoveryStore();
  const [selectedTab, setSelectedTab] = useState<
    'all' | 'posts' | 'users' | 'hashtags' | 'groups' | 'brands'
  >('all');

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Searching for "{query}"...</Text>
      </View>
    );
  }

  if (!results) {
    return null;
  }

  const renderTabs = () => {
    const tabs = [
      {key: 'all', label: 'All', count: results.totalResults},
      {
        key: 'posts',
        label: 'Posts',
        count: results.posts.length,
        icon: FileText,
      },
      {key: 'users', label: 'Users', count: results.users.length, icon: User},
      {
        key: 'hashtags',
        label: 'Hashtags',
        count: results.hashtags.length,
        icon: Hash,
      },
      {
        key: 'groups',
        label: 'Groups',
        count: results.groups.length,
        icon: Users,
      },
      {
        key: 'brands',
        label: 'Brands',
        count: results.brands.length,
        icon: Building,
      },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-3 mr-2 flex-row items-center ${
                isSelected ? 'border-b-2 border-blue-500' : ''
              }`}>
              {Icon && (
                <Icon
                  size={16}
                  className={isSelected ? 'text-blue-500' : 'text-gray-500'}
                />
              )}
              <Text
                className={`${Icon ? 'ml-2' : ''} font-medium ${
                  isSelected ? 'text-blue-500' : 'text-gray-600'
                }`}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View className="ml-2 bg-gray-200 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-gray-700">{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderPostResult = (post: SearchPost) => (
    <Card key={post.id} className="mb-3">
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('PostDetail' as never, {postId: post.id} as never)
        }>
        <View className="p-4">
          {/* Author info */}
          <View className="flex-row items-center mb-2">
            <Avatar
              source={{uri: post.author.avatar}}
              fallback={post.author.displayName[0]}
              size="sm"
            />
            <View className="ml-2">
              <Text className="font-medium text-gray-900">
                {post.author.displayName}
              </Text>
              <Text className="text-xs text-gray-600">
                @{post.author.username} · {formatDistanceToNow(post.createdAt)}
              </Text>
            </View>
          </View>

          {/* Content with highlights */}
          <Text className="text-gray-900 leading-relaxed">{post.snippet}</Text>

          {/* Matched terms */}
          <View className="flex-row flex-wrap mt-2">
            {post.matchedTerms.map(term => (
              <Badge key={term} variant="secondary" className="mr-1 mb-1">
                <Text className="text-xs">{term}</Text>
              </Badge>
            ))}
          </View>

          {/* Engagement stats */}
          <View className="flex-row items-center mt-3 space-x-4">
            <Text className="text-sm text-gray-600">
              {formatNumber(post.voteScore)} votes
            </Text>
            <Text className="text-sm text-gray-600">
              {formatNumber(post.commentCount)} comments
            </Text>
            <Text className="text-sm text-gray-600">
              Score: {post.searchScore.toFixed(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderUserResult = (user: SearchUser) => (
    <Card key={user.wallet} className="mb-3">
      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            'UserProfile' as never,
            {wallet: user.wallet} as never,
          )
        }>
        <View className="p-4 flex-row items-center">
          <Avatar
            source={{uri: user.avatar}}
            fallback={user.displayName[0]}
            size="lg"
          />

          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900">
                {user.displayName}
              </Text>
              {user.isVerified && (
                <View className="ml-1 w-4 h-4 bg-blue-500 rounded-full" />
              )}
            </View>
            <Text className="text-sm text-gray-600">@{user.username}</Text>

            <View className="flex-row items-center mt-2">
              <Text className="text-sm text-gray-700">
                {formatNumber(user.followerCount)} followers
              </Text>
              {user.mutualConnections > 0 && (
                <Text className="text-sm text-gray-600 ml-3">
                  {user.mutualConnections} mutual
                </Text>
              )}
            </View>

            {/* Matched fields */}
            <View className="flex-row flex-wrap mt-2">
              {user.matchedFields.map(field => (
                <Text key={field} className="text-xs text-blue-500 mr-2">
                  in {field}
                </Text>
              ))}
            </View>
          </View>

          <Button
            variant={user.userFollowing ? 'outline' : 'default'}
            size="sm"
            onPress={() =>
              user.userFollowing
                ? unfollowCreator(user.wallet)
                : followCreator(user.wallet)
            }>
            <Text
              className={user.userFollowing ? 'text-gray-700' : 'text-white'}>
              {user.userFollowing ? 'Following' : 'Follow'}
            </Text>
          </Button>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderHashtagResult = (hashtag: SearchHashtag) => (
    <Card key={hashtag.tag} className="mb-3">
      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            'HashtagDetail' as never,
            {hashtag: hashtag.tag} as never,
          )
        }>
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Hash size={20} className="text-blue-500" />
                <Text className="text-lg font-semibold text-gray-900 ml-1">
                  {hashtag.tag}
                </Text>
              </View>
              {hashtag.description && (
                <Text className="text-sm text-gray-600 mt-1">
                  {hashtag.description}
                </Text>
              )}
              <View className="flex-row items-center mt-2">
                <Text className="text-sm text-gray-700">
                  {formatNumber(hashtag.postCount)} posts
                </Text>
                <Text className="text-sm text-gray-600 ml-3">
                  {formatNumber(hashtag.totalEngagement)} engagement
                </Text>
              </View>
            </View>

            <Button
              variant={hashtag.isFollowing ? 'outline' : 'default'}
              size="sm">
              <Text
                className={
                  hashtag.isFollowing ? 'text-gray-700' : 'text-white'
                }>
                {hashtag.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Button>
          </View>

          {/* Related tags */}
          {hashtag.relatedTags.length > 0 && (
            <View className="mt-3">
              <Text className="text-xs text-gray-500 mb-1">Related</Text>
              <View className="flex-row flex-wrap">
                {hashtag.relatedTags.slice(0, 3).map(tag => (
                  <Text key={tag} className="text-sm text-blue-500 mr-2">
                    #{tag}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderGroupResult = (group: SearchGroup) => (
    <Card key={group.id} className="mb-3">
      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            'GroupDetail' as never,
            {groupId: group.id} as never,
          )
        }>
        <View className="p-4 flex-row items-center">
          <Avatar
            source={{uri: group.avatar}}
            fallback={group.name[0]}
            size="lg"
          />

          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900">{group.name}</Text>
              {group.isPrivate && (
                <Badge variant="secondary" className="ml-2">
                  <Text className="text-xs">Private</Text>
                </Badge>
              )}
            </View>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {group.description}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-sm text-gray-700">
                {formatNumber(group.memberCount)} members
              </Text>
              <Text className="text-sm text-gray-600 ml-3">
                {group.category}
              </Text>
            </View>
          </View>

          {group.userIsMember && (
            <Badge variant="default">
              <Text className="text-xs text-white">Member</Text>
            </Badge>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderBrandResult = (brand: SearchBrand) => (
    <Card key={brand.id} className="mb-3">
      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            'BrandProfile' as never,
            {brandId: brand.id} as never,
          )
        }>
        <View className="p-4 flex-row items-center">
          <Avatar
            source={{uri: brand.avatar}}
            fallback={brand.name[0]}
            size="lg"
          />

          <View className="flex-1 ml-3">
            <Text className="font-semibold text-gray-900">{brand.name}</Text>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {brand.description}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-sm text-gray-700">
                {formatNumber(brand.followerCount)} followers
              </Text>
              <Text className="text-sm text-gray-600 ml-3">
                {brand.category}
              </Text>
            </View>
          </View>

          <Building size={20} className="text-gray-400" />
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'all':
        return (
          <ScrollView className="flex-1 p-4">
            {results.posts.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Posts
                </Text>
                {results.posts.slice(0, 3).map(renderPostResult)}
              </View>
            )}

            {results.users.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Users
                </Text>
                {results.users.slice(0, 3).map(renderUserResult)}
              </View>
            )}

            {results.hashtags.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Hashtags
                </Text>
                {results.hashtags.slice(0, 3).map(renderHashtagResult)}
              </View>
            )}
          </ScrollView>
        );

      case 'posts':
        return (
          <FlatList
            data={results.posts}
            renderItem={({item}) => renderPostResult(item)}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 16}}
          />
        );

      case 'users':
        return (
          <FlatList
            data={results.users}
            renderItem={({item}) => renderUserResult(item)}
            keyExtractor={item => item.wallet}
            contentContainerStyle={{padding: 16}}
          />
        );

      case 'hashtags':
        return (
          <FlatList
            data={results.hashtags}
            renderItem={({item}) => renderHashtagResult(item)}
            keyExtractor={item => item.tag}
            contentContainerStyle={{padding: 16}}
          />
        );

      case 'groups':
        return (
          <FlatList
            data={results.groups}
            renderItem={({item}) => renderGroupResult(item)}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 16}}
          />
        );

      case 'brands':
        return (
          <FlatList
            data={results.brands}
            renderItem={({item}) => renderBrandResult(item)}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 16}}
          />
        );
    }
  };

  return (
    <View className="flex-1">
      {/* Results header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          {results.totalResults} results for "{query}"
        </Text>
        <Text className="text-sm text-gray-600">
          Search completed in {results.searchTime}ms
        </Text>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      {results.totalResults === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Search size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600 text-center">
            No results found for "{query}"
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            Try different keywords or check your spelling
          </Text>
          {results.suggestions.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm text-gray-600 mb-2">Did you mean:</Text>
              {results.suggestions.map(suggestion => (
                <TouchableOpacity key={suggestion} className="py-1">
                  <Text className="text-blue-500">{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        renderContent()
      )}
    </View>
  );
};
