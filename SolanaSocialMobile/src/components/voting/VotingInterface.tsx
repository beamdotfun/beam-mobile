import React, {useState, useCallback, useRef} from 'react';
import {View, Text, Pressable, Animated, ActivityIndicator} from 'react-native';
import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  Zap,
  Info,
} from 'lucide-react-native';
import {useVotingStore} from '../../store/votingStore';
import {useWalletStore} from '../../store/wallet';
import {useThemeStore} from '../../store/themeStore';
import {formatSOL} from '../../utils/formatting';
import {cn} from '../../utils/cn';
import {VoteImpact} from '../../types/voting';

interface VotingInterfaceProps {
  targetUserWallet: string;
  currentScore?: number;
  context?: {
    postId?: string;
    commentId?: string;
  };
  size?: 'small' | 'medium' | 'large';
  showFees?: boolean;
  showImpact?: boolean;
  onVote?: (value: number, impact: VoteImpact) => void;
}

export function VotingInterface({
  targetUserWallet,
  currentScore = 0,
  context,
  size = 'medium',
  showFees = true,
  showImpact = true,
  onVote,
}: VotingInterfaceProps) {
  const {colors} = useThemeStore();
  const {balance} = useWalletStore();
  const {
    config,
    isVoting,
    voteErrors,
    vote,
    canVote,
    getVoteCost,
    formatReputation,
    addVoteAnimation,
  } = useVotingStore();

  const [showPreview, setShowPreview] = useState(false);
  const [previewValue, setPreviewValue] = useState(0);
  const animationValue = useRef(new Animated.Value(1)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;

  const isVotingForUser = isVoting[targetUserWallet];
  const voteError = voteErrors[targetUserWallet];
  const canVoteResult = canVote(targetUserWallet);

  const handleVote = useCallback(
    async (value: number) => {
      if (!canVoteResult.allowed || isVotingForUser) {
        return;
      }

      const cost = getVoteCost(value);
      if (balance && balance < cost) {
        alert('Insufficient balance for voting fee');
        return;
      }

      try {
        // Start animation
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        // Submit vote
        const impact = await vote(targetUserWallet, value, context);

        // Animate score change
        if (impact.change !== 0) {
          Animated.sequence([
            Animated.timing(scoreAnimation, {
              toValue: impact.change,
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(scoreAnimation, {
              toValue: 0,
              duration: 500,
              delay: 1000,
              useNativeDriver: false,
            }),
          ]).start();
        }

        // Add floating animation
        const buttonRect = {x: 0, y: 0}; // Get actual button position
        addVoteAnimation({
          type: value > 0 ? 'upvote' : 'downvote',
          startPosition: buttonRect,
          endPosition: {x: buttonRect.x, y: buttonRect.y - 50},
          value: impact.change,
          color: value > 0 ? colors.primary : colors.destructive,
        });

        onVote?.(value, impact);
      } catch (error) {
        console.error('Vote failed:', error);
      }
    },
    [
      targetUserWallet,
      canVoteResult,
      isVotingForUser,
      balance,
      context,
      getVoteCost,
      vote,
      addVoteAnimation,
      onVote,
      colors,
    ],
  );

  const handlePressIn = (value: number) => {
    if (showImpact && canVoteResult.allowed) {
      setPreviewValue(value);
      setShowPreview(true);
    }
  };

  const handlePressOut = () => {
    setShowPreview(false);
  };

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const buttonSize =
    size === 'small' ? 'p-1' : size === 'medium' ? 'p-2' : 'p-3';

  return (
    <View className="items-center">
      {/* Current Score */}
      <Animated.View
        style={{
          transform: [
            {
              translateY: scoreAnimation.interpolate({
                inputRange: [-100, 0, 100],
                outputRange: [-10, 0, 10],
              }),
            },
          ],
        }}>
        <Text
          className={cn(
            'font-bold',
            size === 'small' && 'text-base',
            size === 'medium' && 'text-lg',
            size === 'large' && 'text-2xl',
          )}
          style={{color: colors.foreground}}>
          {formatReputation(currentScore)}
        </Text>
      </Animated.View>

      {/* Voting Buttons */}
      <View className="flex-row items-center mt-2">
        {/* Downvote */}
        <Pressable
          onPress={() => handleVote(-1)}
          onPressIn={() => handlePressIn(-1)}
          onPressOut={handlePressOut}
          disabled={!canVoteResult.allowed || isVotingForUser}
          className={cn(
            buttonSize,
            'rounded-full mr-3',
            !canVoteResult.allowed && 'opacity-50',
          )}>
          <Animated.View
            style={{
              transform: [{scale: animationValue}],
            }}>
            {isVotingForUser ? (
              <ActivityIndicator size="small" color={colors.destructive} />
            ) : (
              <ThumbsDown size={iconSize} color={colors.destructive} />
            )}
          </Animated.View>
        </Pressable>

        {/* Upvote */}
        <Pressable
          onPress={() => handleVote(1)}
          onPressIn={() => handlePressIn(1)}
          onPressOut={handlePressOut}
          disabled={!canVoteResult.allowed || isVotingForUser}
          className={cn(
            buttonSize,
            'rounded-full',
            !canVoteResult.allowed && 'opacity-50',
          )}>
          <Animated.View
            style={{
              transform: [{scale: animationValue}],
            }}>
            {isVotingForUser ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ThumbsUp size={iconSize} color={colors.primary} />
            )}
          </Animated.View>
        </Pressable>
      </View>

      {/* Fees */}
      {showFees && (
        <View className="flex-row items-center mt-2">
          <Text
            className="text-xs mr-2"
            style={{color: colors.mutedForeground}}>
            ↓ {formatSOL(config.downvoteFee)}
          </Text>
          <Text className="text-xs" style={{color: colors.mutedForeground}}>
            ↑ {formatSOL(config.upvoteFee)}
          </Text>
        </View>
      )}

      {/* Status Message */}
      {isVotingForUser && (
        <View className="flex-row items-center mt-2">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-xs ml-2" style={{color: colors.primary}}>
            Processing blockchain transaction...
          </Text>
        </View>
      )}

      {/* Error or Reason */}
      {!isVotingForUser && (voteError || !canVoteResult.allowed) && (
        <View className="flex-row items-center mt-2">
          <Info size={12} color={colors.destructive} />
          <Text className="text-xs ml-1" style={{color: colors.destructive}}>
            {voteError || canVoteResult.reason}
          </Text>
        </View>
      )}

      {/* Impact Preview */}
      {showPreview && showImpact && (
        <View className="absolute -top-20 bg-card p-2 rounded-lg shadow-lg">
          <Text className="text-xs" style={{color: colors.foreground}}>
            Impact Preview: {previewValue > 0 ? '+' : ''}
            {previewValue}
          </Text>
        </View>
      )}
    </View>
  );
}
