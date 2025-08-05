import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Hash, TrendingUp} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useSocialAdvancedStore} from '../../store/socialAdvancedStore';
import {HashtagSuggestion} from '../../types/social-advanced';

interface HashtagSuggestionsProps {
  query: string;
  onSelect: (hashtag: HashtagSuggestion) => void;
  visible: boolean;
}

export const HashtagSuggestions: React.FC<HashtagSuggestionsProps> = ({
  query,
  onSelect,
  visible,
}) => {
  const {colors} = useThemeStore();
  const {hashtagSuggestions, isLoadingHashtags, searchHashtags} =
    useSocialAdvancedStore();

  useEffect(() => {
    if (visible && query) {
      searchHashtags(query);
    }
  }, [query, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute bottom-full left-0 right-0 max-h-48 rounded-lg shadow-lg mb-2"
      style={{backgroundColor: colors.card}}>
      {isLoadingHashtags ? (
        <View className="p-4 items-center">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : hashtagSuggestions.length === 0 ? (
        <View className="p-4">
          <Text
            className="text-sm text-center"
            style={{color: colors.mutedForeground}}>
            No hashtags found
          </Text>
        </View>
      ) : (
        <FlatList
          data={hashtagSuggestions}
          keyExtractor={item => item.tag}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              className="flex-row items-center justify-between p-3 border-b"
              style={{borderColor: colors.border}}>
              <View className="flex-row items-center flex-1">
                <Hash size={20} color={colors.primary} className="mr-2" />

                <View className="flex-1">
                  <Text
                    className="font-medium"
                    style={{color: colors.foreground}}>
                    {item.tag}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{color: colors.mutedForeground}}>
                    {item.postCount} posts
                  </Text>
                </View>
              </View>

              {item.trendingScore > 0 && (
                <View className="flex-row items-center">
                  <TrendingUp size={14} color={colors.success} />
                  <Text
                    className="text-xs ml-1"
                    style={{color: colors.success}}>
                    +{item.trendingScore}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
