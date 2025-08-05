import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react-native';
import {useVotingStore} from '../../store/votingStore';
import {useWalletStore} from '../../store/wallet';
import {useThemeStore} from '../../store/themeStore';
import {Vote} from '../../types/voting';
import {formatDistanceToNow} from 'date-fns';
import {formatSOL} from '../../utils/formatting';
import {cn} from '../../utils/cn';

interface VoteHistoryProps {
  targetUser?: string;
  showFilters?: boolean;
}

export function VoteHistory({
  targetUser,
  showFilters = true,
}: VoteHistoryProps) {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const {recentVotes, voteHistory, loadVoteHistory, formatReputation} =
    useVotingStore();

  const [filter, setFilter] = useState<'all' | 'given' | 'received'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const currentUserWallet = publicKey?.toString();

  useEffect(() => {
    loadHistory();
  }, [targetUser]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      await loadVoteHistory(targetUser);
    } finally {
      setIsLoading(false);
    }
  };

  const votes = targetUser ? voteHistory.get(targetUser) || [] : recentVotes;

  const filteredVotes = votes.filter(vote => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'given') {
      return vote.voterWallet === currentUserWallet;
    }
    if (filter === 'received') {
      return vote.targetUserWallet === currentUserWallet;
    }
    return true;
  });

  const renderVote = ({item: vote}: {item: Vote}) => {
    const isGiven = vote.voterWallet === currentUserWallet;
    const isPositive = vote.value > 0;

    return (
      <Pressable
        onPress={() => {
          // Navigate to context (post/comment)
          // if (vote.postId) {
          //   navigation.navigate("PostDetail", { postId: vote.postId });
          // }
        }}
        className="p-4 mb-2 rounded-lg"
        style={{backgroundColor: colors.card}}>
        <View className="flex-row items-start">
          {/* User Avatar Placeholder */}
          <View
            className="w-10 h-10 rounded-full mr-3"
            style={{backgroundColor: colors.border}}
          />

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Text
                  className="font-semibold"
                  style={{color: colors.foreground}}>
                  {isGiven ? 'Target User' : 'Voter'}
                </Text>
                <View
                  className={cn('ml-2 px-2 py-0.5 rounded-full')}
                  style={{
                    backgroundColor: isPositive
                      ? `${colors.primary}20`
                      : `${colors.destructive}20`,
                  }}>
                  <Text
                    className="text-xs"
                    style={{
                      color: isPositive ? colors.primary : colors.destructive,
                    }}>
                    {isPositive ? '+' : ''}
                    {vote.impactScore}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Clock size={12} color={colors.mutedForeground} />
                <Text
                  className="text-xs ml-1"
                  style={{color: colors.mutedForeground}}>
                  {formatDistanceToNow(new Date(vote.timestamp), {
                    addSuffix: true,
                  })}
                </Text>
              </View>
            </View>

            {/* Vote Type */}
            <View className="flex-row items-center">
              {isPositive ? (
                <ThumbsUp size={16} color={colors.primary} />
              ) : (
                <ThumbsDown size={16} color={colors.destructive} />
              )}
              <Text
                className="text-sm ml-2"
                style={{color: colors.mutedForeground}}>
                {isGiven ? 'You voted' : 'Voted for you'}
              </Text>
              {vote.streak && vote.streak > 1 && (
                <View className="ml-2 flex-row items-center">
                  <TrendingUp size={12} color={colors.primary} />
                  <Text
                    className="text-xs ml-1"
                    style={{color: colors.primary}}>
                    {vote.streak} day streak
                  </Text>
                </View>
              )}
            </View>

            {/* Context */}
            {vote.reason && (
              <Text
                className="text-sm mt-1"
                style={{color: colors.mutedForeground}}>
                "{vote.reason}"
              </Text>
            )}

            {/* Transaction */}
            <View className="flex-row items-center mt-2">
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                Fee: {formatSOL(vote.feePaid)}
              </Text>
              <Text
                className="text-xs mx-2"
                style={{color: colors.mutedForeground}}>
                •
              </Text>
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                {vote.transactionSignature.slice(0, 8)}...
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1">
      {/* Filters */}
      {showFilters && (
        <View
          className="flex-row items-center px-4 py-3 border-b"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}>
          <Filter size={16} color={colors.foreground} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="ml-3">
            {['all', 'given', 'received'].map(type => (
              <Pressable
                key={type}
                onPress={() => setFilter(type as any)}
                className={cn('px-4 py-1 rounded-full mr-2')}
                style={{
                  backgroundColor:
                    filter === type ? colors.primary : colors.muted,
                }}>
                <Text
                  className={cn('text-sm capitalize')}
                  style={{
                    color:
                      filter === type
                        ? colors.background
                        : colors.mutedForeground,
                  }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Vote List */}
      <FlatList
        data={filteredVotes}
        renderItem={renderVote}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 16}}
        refreshing={isLoading}
        onRefresh={loadHistory}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <ThumbsUp size={48} color={colors.mutedForeground} />
            <Text className="mt-4" style={{color: colors.mutedForeground}}>
              No voting history yet
            </Text>
          </View>
        }
      />
    </View>
  );
}
