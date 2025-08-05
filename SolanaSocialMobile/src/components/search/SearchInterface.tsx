import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
  Dimensions,
} from 'react-native';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Filter,
  Mic,
  Hash,
  MapPin,
  User,
  FileText,
} from 'lucide-react-native';
import {useSearchStore} from '../../store/searchStore';
import {useThemeStore} from '../../store/themeStore';
import {SearchType} from '../../types/search';
import {Button} from '../ui/button';

const {width: screenWidth} = Dimensions.get('window');

interface SearchInterfaceProps {
  onSearchSubmit?: (query: string, type: SearchType) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showFilters?: boolean;
  showVoiceSearch?: boolean;
}

const SEARCH_TYPES: Array<{
  key: SearchType;
  label: string;
  icon: React.ComponentType<any>;
}> = [
  {key: 'all', label: 'All', icon: Search},
  {key: 'posts', label: 'Posts', icon: FileText},
  {key: 'users', label: 'People', icon: User},
  {key: 'hashtags', label: 'Hashtags', icon: Hash},
  {key: 'locations', label: 'Places', icon: MapPin},
];

export function SearchInterface({
  onSearchSubmit,
  onFilterPress,
  placeholder = 'Search...',
  autoFocus = false,
  showFilters = true,
  showVoiceSearch = true,
}: SearchInterfaceProps) {
  const {colors} = useThemeStore();
  const {
    query,
    type,
    suggestions,
    history,
    trending,
    isLoading,
    config,
    updateQuery,
    updateType,
    search,
    getSuggestions,
    getRecentSearches,
    trackResultClick,
  } = useSearchStore();

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const suggestionsAnim = useRef(new Animated.Value(0)).current;
  const voicePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (showSuggestions) {
      Animated.timing(suggestionsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(suggestionsAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (isVoiceActive) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(voicePulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(voicePulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isVoiceActive) {
            pulse();
          }
        });
      };
      pulse();
    } else {
      voicePulseAnim.setValue(1);
    }
  }, [isVoiceActive]);

  const handleSearch = () => {
    if (!query.trim()) {
      return;
    }

    Keyboard.dismiss();
    setShowSuggestions(false);
    setIsFocused(false);

    onSearchSubmit?.(query, type);
    search(query, type);
  };

  const handleQueryChange = (text: string) => {
    updateQuery(text);

    if (text.length > 0 && isFocused) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    updateQuery(suggestion);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(), 100);
  };

  const handleTypeSelect = (selectedType: SearchType) => {
    updateType(selectedType);
    if (query.trim()) {
      handleSearch();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (query.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion tap to register
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 150);
  };

  const handleClear = () => {
    updateQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleVoiceSearch = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      // Stop voice search
      console.log('Stopping voice search');
    } else {
      setIsVoiceActive(true);
      // Start voice search
      console.log('Starting voice search');
      // Mock voice search - in real app would use speech recognition
      setTimeout(() => {
        setIsVoiceActive(false);
        updateQuery('voice search result');
      }, 3000);
    }
  };

  const recentSearches = getRecentSearches(5);

  const renderSuggestionItem = (
    text: string,
    icon: React.ComponentType<any>,
    type: 'suggestion' | 'recent' | 'trending',
    subtitle?: string,
  ) => {
    const IconComponent = icon;

    return (
      <TouchableOpacity
        key={`${type}-${text}`}
        onPress={() => handleSuggestionPress(text)}
        className="flex-row items-center px-4 py-3"
        style={{backgroundColor: colors.background}}>
        <View
          className="mr-3 p-2 rounded-full"
          style={{backgroundColor: colors.muted}}>
          <IconComponent
            size={16}
            color={
              type === 'trending' ? colors.primary : colors.mutedForeground
            }
          />
        </View>
        <View className="flex-1">
          <Text style={{color: colors.foreground}} className="font-medium">
            {text}
          </Text>
          {subtitle && (
            <Text
              style={{color: colors.mutedForeground}}
              className="text-xs mt-1">
              {subtitle}
            </Text>
          )}
        </View>
        {type === 'trending' && (
          <View className="ml-2">
            <TrendingUp size={14} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="relative">
      {/* Search Input Container */}
      <View
        className="flex-row items-center px-3 py-2 rounded-lg border"
        style={{
          backgroundColor: colors.background,
          borderColor: isFocused ? colors.primary : colors.border,
        }}>
        <Search size={20} color={colors.mutedForeground} />

        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleQueryChange}
          onSubmitEditing={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 ml-3 text-base"
          style={{color: colors.foreground}}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="p-1">
            <X size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {showVoiceSearch && config.voiceSearch.enabled && (
          <TouchableOpacity
            onPress={handleVoiceSearch}
            className="ml-2 p-2 rounded-full"
            style={{
              backgroundColor: isVoiceActive ? colors.primary : colors.muted,
            }}>
            <Animated.View style={{transform: [{scale: voicePulseAnim}]}}>
              <Mic
                size={16}
                color={
                  isVoiceActive
                    ? colors.primaryForeground
                    : colors.mutedForeground
                }
              />
            </Animated.View>
          </TouchableOpacity>
        )}

        {showFilters && (
          <TouchableOpacity
            onPress={onFilterPress}
            className="ml-2 p-2 rounded-full"
            style={{backgroundColor: colors.muted}}>
            <Filter size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Type Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 -mx-1"
        contentContainerStyle={{paddingHorizontal: 4}}>
        {SEARCH_TYPES.map(searchType => {
          const IconComponent = searchType.icon;
          const isSelected = type === searchType.key;

          return (
            <TouchableOpacity
              key={searchType.key}
              onPress={() => handleTypeSelect(searchType.key)}
              className="flex-row items-center px-3 py-2 rounded-full mr-2"
              style={{
                backgroundColor: isSelected ? colors.primary : colors.muted,
              }}>
              <IconComponent
                size={14}
                color={
                  isSelected ? colors.primaryForeground : colors.mutedForeground
                }
              />
              <Text
                className="ml-2 text-sm font-medium"
                style={{
                  color: isSelected
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                }}>
                {searchType.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Animated.View
          style={{
            opacity: suggestionsAnim,
            transform: [
              {
                translateY: suggestionsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: 8,
            maxHeight: 300,
            borderRadius: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.foreground,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <ScrollView>
            {/* Current query suggestions */}
            {suggestions.length > 0 && (
              <View>
                <Text
                  className="px-4 py-2 text-xs font-medium uppercase"
                  style={{color: colors.mutedForeground}}>
                  Suggestions
                </Text>
                {suggestions.map(suggestion =>
                  renderSuggestionItem(
                    suggestion.text,
                    suggestion.type === 'hashtag' ? Hash : Search,
                    'suggestion',
                    suggestion.count
                      ? `${suggestion.count} results`
                      : undefined,
                  ),
                )}
              </View>
            )}

            {/* Recent searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <View>
                <Text
                  className="px-4 py-2 text-xs font-medium uppercase"
                  style={{color: colors.mutedForeground}}>
                  Recent
                </Text>
                {recentSearches.map(recent =>
                  renderSuggestionItem(recent.query, Clock, 'recent'),
                )}
              </View>
            )}

            {/* Trending topics */}
            {query.length === 0 && trending.length > 0 && (
              <View>
                <Text
                  className="px-4 py-2 text-xs font-medium uppercase"
                  style={{color: colors.mutedForeground}}>
                  Trending
                </Text>
                {trending
                  .slice(0, 3)
                  .map(trend =>
                    renderSuggestionItem(
                      trend.tag,
                      TrendingUp,
                      'trending',
                      `${trend.posts} posts • ${
                        trend.change > 0 ? '+' : ''
                      }${trend.change.toFixed(1)}%`,
                    ),
                  )}
              </View>
            )}

            {/* Empty state */}
            {suggestions.length === 0 &&
              recentSearches.length === 0 &&
              trending.length === 0 && (
                <View className="p-4 items-center">
                  <Text style={{color: colors.mutedForeground}}>
                    {query.length > 0
                      ? 'No suggestions found'
                      : 'Start typing to search'}
                  </Text>
                </View>
              )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Voice Search Feedback */}
      {isVoiceActive && (
        <View
          className="absolute inset-0 items-center justify-center rounded-lg"
          style={{backgroundColor: `${colors.primary}20`}}>
          <Text className="mt-2 font-medium" style={{color: colors.primary}}>
            Listening...
          </Text>
        </View>
      )}
    </View>
  );
}
