import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, ActivityIndicator} from 'react-native';
import {usePostQuotingStore} from '../../store/postQuotingStore';
import {QuoteChain, QuoteContext} from '../../types/post-quoting';
import {QuotePreview} from './QuotePreview';
import {Button} from '../ui/button';
import {formatDistanceToNow} from '../../utils/date';
import {CheckCircle} from 'lucide-react-native';

interface QuoteChainViewProps {
  postId: string;
}

export const QuoteChainView: React.FC<QuoteChainViewProps> = ({postId}) => {
  const {loadQuoteChain, loadingChains} = usePostQuotingStore();
  const [chain, setChain] = useState<QuoteChain | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadQuoteChainData();
  }, [postId]);

  const loadQuoteChainData = async () => {
    try {
      const quoteChain = await loadQuoteChain(postId);
      setChain(quoteChain);
    } catch (error) {
      console.error('Failed to load quote chain:', error);
    }
  };

  if (loadingChains.has(postId)) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="small" />
        <Text className="text-gray-600 mt-2">Loading quotes...</Text>
      </View>
    );
  }

  if (!chain || chain.quotes.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-gray-600 text-center">No quotes yet</Text>
      </View>
    );
  }

  const visibleQuotes = showAll ? chain.quotes : chain.quotes.slice(0, 3);

  return (
    <ScrollView className="flex-1">
      {/* Original Post */}
      <View className="p-4 border-b border-gray-200">
        <Text className="font-medium mb-2">Original Post</Text>
        <View className="border border-gray-200 rounded-lg p-3 bg-white">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {chain.originalPostId.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-sm">Original Author</Text>
              <Text className="text-gray-500 text-xs">
                Original post content
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quotes */}
      <View className="p-4">
        <Text className="font-medium mb-3">Quotes ({chain.totalQuotes})</Text>

        <View className="space-y-3">
          {visibleQuotes.map((quote: QuoteContext) => (
            <View key={quote.id} className="border-l-2 border-blue-200 pl-3">
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 rounded-full bg-gray-300 mr-2" />
                <Text className="font-medium text-sm">
                  User {quote.quoterWallet.substring(0, 8)}
                </Text>
                <View
                  className={`ml-2 px-2 py-1 rounded-full ${getQuoteTypeColor(
                    quote.quoteType,
                  )}`}>
                  <Text className="text-xs text-white">
                    {quote.quoteType.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-700 mb-2">
                {quote.content}
              </Text>

              {/* Quote engagement */}
              <View className="flex-row items-center mt-2">
                <Text className="text-xs text-gray-500">
                  {quote.engagement.likes} likes
                </Text>
                <Text className="text-xs text-gray-500 ml-3">
                  {quote.engagement.subQuotes} sub-quotes
                </Text>
                <Text className="text-xs text-gray-500 ml-3">
                  {formatDistanceToNow(new Date(quote.timestamp))}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Show More Button */}
        {!showAll && chain.quotes.length > 3 && (
          <Button
            variant="outline"
            onPress={() => setShowAll(true)}
            className="mt-4">
            <Text>Show {chain.quotes.length - 3} more quotes</Text>
          </Button>
        )}

        {/* Chain Analytics */}
        {chain.analytics && (
          <View className="mt-6 p-4 bg-gray-50 rounded-lg">
            <Text className="font-medium text-sm mb-2">Chain Stats</Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-gray-600">Total Engagement</Text>
                <Text className="font-medium">
                  {chain.analytics.totalEngagement}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-gray-600">Participants</Text>
                <Text className="font-medium">
                  {chain.analytics.participantCount}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-gray-600">Dominant Type</Text>
                <Text className="font-medium capitalize">
                  {chain.analytics.dominantQuoteType.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

function getQuoteTypeColor(type: string): string {
  switch (type) {
    case 'agree':
      return 'bg-green-500';
    case 'disagree':
      return 'bg-red-500';
    case 'add_context':
      return 'bg-blue-500';
    case 'share':
      return 'bg-purple-500';
    case 'question':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}
