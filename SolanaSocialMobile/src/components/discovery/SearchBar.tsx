import React, {useState, useRef} from 'react';
import {View, Text, TextInput, Pressable, ScrollView} from 'react-native';
import {Search, X, Clock, TrendingUp} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {useThemeStore} from '../../store/themeStore';
import {useDiscoveryStore} from '../../store/discovery';
import {cn} from '../../utils/cn';

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  onFocus,
  onBlur,
  onSearchSubmit,
  placeholder = 'Search users, posts, brands...',
  autoFocus = false,
}: SearchBarProps) {
  const {colors} = useThemeStore();
  const {
    searchQuery,
    recentSearches,
    trendingTopics,
    search,
    clearSearch,
    addRecentSearch,
    clearRecentSearches,
  } = useDiscoveryStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleSearch = (query?: string) => {
    const searchTerm = query || inputValue.trim();
    if (searchTerm) {
      search(searchTerm);
      addRecentSearch(searchTerm);
      onSearchSubmit?.(searchTerm);
      inputRef.current?.blur();
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setInputValue(query);
    handleSearch(query);
  };

  const handleTrendingPress = (topic: string) => {
    setInputValue(topic);
    handleSearch(topic);
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    inputRef.current?.focus();
  };

  return (
    <View className="relative">
      {/* Search Input */}
      <View className="relative">
        <View className="absolute left-3 top-3 z-10">
          <Search size={20} color={colors.mutedForeground} />
        </View>

        <TextInput
          ref={inputRef}
          value={inputValue}
          onChangeText={setInputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={() => handleSearch()}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          className={cn(
            'w-full h-12 pl-10 pr-10 rounded-lg border border-border bg-background text-foreground',
            isFocused && 'border-ring',
          )}
          style={{color: colors.foreground}}
          autoFocus={autoFocus}
          returnKeyType="search"
        />

        {inputValue.length > 0 && (
          <Pressable onPress={handleClear} className="absolute right-3 top-3">
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Search Suggestions Overlay */}
      {isFocused && (
        <Card className="absolute top-14 left-0 right-0 z-20 max-h-80">
          <CardContent className="p-0">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View className="p-4 border-b border-border">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Clock size={16} color={colors.mutedForeground} />
                      <Text className="text-foreground font-medium ml-2">
                        Recent Searches
                      </Text>
                    </View>
                    <Pressable onPress={clearRecentSearches}>
                      <Text className="text-primary text-sm">Clear</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    {recentSearches.slice(0, 5).map((query, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleRecentSearchPress(query)}>
                        <Badge variant="secondary">{query}</Badge>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending Topics */}
              {trendingTopics.length > 0 && (
                <View className="p-4">
                  <View className="flex-row items-center mb-3">
                    <TrendingUp size={16} color={colors.primary} />
                    <Text className="text-foreground font-medium ml-2">
                      Trending
                    </Text>
                  </View>

                  <View className="space-y-2">
                    {trendingTopics.slice(0, 5).map(topic => (
                      <Pressable
                        key={topic.id}
                        onPress={() => handleTrendingPress(topic.hashtag)}
                        className="flex-row items-center justify-between py-2">
                        <View className="flex-1">
                          <Text className="text-foreground font-medium">
                            {topic.name}
                          </Text>
                          <Text className="text-muted-foreground text-sm">
                            {topic.postCount} posts
                          </Text>
                        </View>

                        <Badge
                          variant={
                            topic.trend === 'rising'
                              ? 'success'
                              : topic.trend === 'falling'
                              ? 'destructive'
                              : 'secondary'
                          }>
                          {topic.trend === 'rising'
                            ? '↗'
                            : topic.trend === 'falling'
                            ? '↘'
                            : '→'}
                        </Badge>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Empty State */}
              {recentSearches.length === 0 && trendingTopics.length === 0 && (
                <View className="p-8 items-center">
                  <Search size={32} color={colors.mutedForeground} />
                  <Text className="text-muted-foreground text-center mt-2">
                    Start typing to search for users, posts, and brands
                  </Text>
                </View>
              )}
            </ScrollView>
          </CardContent>
        </Card>
      )}
    </View>
  );
}
