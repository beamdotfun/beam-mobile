import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Image} from 'react-native';
import {useThemeStore} from '../../store/themeStore';
import {useSocialAdvancedStore} from '../../store/socialAdvancedStore';
import {MentionSuggestion} from '../../types/social-advanced';

interface MentionSuggestionsProps {
  query: string;
  onSelect: (user: MentionSuggestion) => void;
  visible: boolean;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  query,
  onSelect,
  visible,
}) => {
  const {colors} = useThemeStore();
  const {
    mentionSuggestions,
    isLoadingMentions,
    searchMentions,
    addRecentMention,
  } = useSocialAdvancedStore();

  useEffect(() => {
    if (visible && query) {
      searchMentions(query);
    }
  }, [query, visible]);

  const handleSelect = (user: MentionSuggestion) => {
    addRecentMention(user.walletAddress);
    onSelect(user);
  };

  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute bottom-full left-0 right-0 max-h-48 rounded-lg shadow-lg mb-2"
      style={{backgroundColor: colors.card}}>
      {isLoadingMentions ? (
        <View className="p-4 items-center">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : mentionSuggestions.length === 0 ? (
        <View className="p-4">
          <Text
            className="text-sm text-center"
            style={{color: colors.mutedForeground}}>
            No users found
          </Text>
        </View>
      ) : (
        <FlatList
          data={mentionSuggestions}
          keyExtractor={item => item.walletAddress}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              className="flex-row items-center p-3 border-b"
              style={{borderColor: colors.border}}>
              <Image
                source={{
                  uri: item.profilePicture || 'https://via.placeholder.com/40',
                }}
                className="w-8 h-8 rounded-full mr-3"
                style={{backgroundColor: colors.muted}}
              />

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text
                    className="font-medium"
                    style={{color: colors.foreground}}>
                    {item.displayName}
                  </Text>
                  {item.isVerified && (
                    <View
                      className="w-3 h-3 rounded-full ml-1"
                      style={{backgroundColor: colors.primary}}
                    />
                  )}
                </View>
                <Text
                  className="text-xs"
                  style={{color: colors.mutedForeground}}>
                  Rep: {item.onChainReputation}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
