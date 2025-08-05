import React, {useState} from 'react';
import {View, Alert, Vibration} from 'react-native';
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  Star,
  Flag,
  MoreHorizontal,
} from 'lucide-react-native';
import {Button} from '../ui/button';
import {Text} from '../ui/text';
import {Badge} from '../ui/badge';
import {Card} from '../ui/card';
import {Platform, PlatformVote, VotingWeight} from '../../types/platform';
import {usePlatformStore} from '../../stores/platformStore';
import {useFeatureFlag} from '../../hooks/useFeatureFlag';
import {analyticsService} from '../../services/analytics/analyticsService';
import {cn} from '../../lib/utils';

interface VotingControlsProps {
  platform: Platform;
  userVote?: PlatformVote;
  votingWeight?: VotingWeight;
  onVoteSuccess?: (voteType: 'upvote' | 'downvote') => void;
  variant?: 'compact' | 'expanded' | 'minimal';
  showVoteCount?: boolean;
  showWeight?: boolean;
  disabled?: boolean;
}

export const VotingControls: React.FC<VotingControlsProps> = ({
  platform,
  userVote,
  votingWeight,
  onVoteSuccess,
  variant = 'compact',
  showVoteCount = true,
  showWeight = false,
  disabled = false,
}) => {
  const {votePlatform, isVoting} = usePlatformStore();
  const [showActions, setShowActions] = useState(false);

  const weightedVotingEnabled = useFeatureFlag('weighted_voting_enabled');
  const advancedVotingEnabled = useFeatureFlag('advanced_voting_enabled');
  const hapticFeedbackEnabled = useFeatureFlag('haptic_feedback_enabled');

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (disabled || isVoting) {
      return;
    }

    try {
      // Haptic feedback
      if (hapticFeedbackEnabled) {
        Vibration.vibrate(50);
      }

      await votePlatform(platform.id, voteType);

      onVoteSuccess?.(voteType);

      // Show success feedback
      Alert.alert(
        'Vote Submitted',
        `Your ${voteType} has been recorded${
          weightedVotingEnabled && votingWeight
            ? ` with weight ${votingWeight.totalWeight.toFixed(1)}`
            : ''
        }.`,
        [{text: 'OK'}],
      );

      // Track analytics
      analyticsService.trackEvent('platform_vote_submitted', {
        platform_id: platform.id,
        vote_type: voteType,
        voting_weight: votingWeight?.totalWeight || 1.0,
        previous_vote: userVote?.voteType,
        platform_category: platform.category,
      });
    } catch (error) {
      Alert.alert(
        'Vote Failed',
        'Unable to submit your vote. Please try again.',
        [{text: 'OK'}],
      );
    }
  };

  const handleReport = () => {
    Alert.alert('Report Platform', 'Why are you reporting this platform?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Spam/Fraud', onPress: () => submitReport('spam')},
      {
        text: 'Inappropriate Content',
        onPress: () => submitReport('inappropriate'),
      },
      {text: 'Technical Issues', onPress: () => submitReport('technical')},
      {text: 'Other', onPress: () => submitReport('other')},
    ]);
  };

  const submitReport = async (reason: string) => {
    try {
      // In a real app, this would call the platform store's report function
      analyticsService.trackEvent('platform_reported', {
        platform_id: platform.id,
        reason,
        reporter_vote: userVote?.voteType,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your feedback. We will review this platform.',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const getVoteButtonStyle = (voteType: 'upvote' | 'downvote') => {
    const isActive = userVote?.voteType === voteType;
    const baseStyle = 'flex-row items-center space-x-1';

    if (variant === 'minimal') {
      return cn(baseStyle, isActive ? 'opacity-100' : 'opacity-60');
    }

    return cn(baseStyle);
  };

  const getVoteButtonVariant = (voteType: 'upvote' | 'downvote') => {
    const isActive = userVote?.voteType === voteType;

    if (variant === 'minimal') {
      return 'ghost';
    }

    return isActive ? 'default' : 'outline';
  };

  const getVoteButtonColor = (voteType: 'upvote' | 'downvote') => {
    const isActive = userVote?.voteType === voteType;

    if (!isActive) {
      return '#6B7280';
    }

    return voteType === 'upvote' ? '#10B981' : '#EF4444';
  };

  if (variant === 'minimal') {
    return (
      <View className="flex-row items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => handleVote('upvote')}
          disabled={disabled || isVoting}
          className={cn(
            'p-1',
            userVote?.voteType === 'upvote' && 'bg-green-50',
          )}>
          <ThumbsUp
            size={18}
            color={getVoteButtonColor('upvote')}
            fill={
              userVote?.voteType === 'upvote'
                ? getVoteButtonColor('upvote')
                : 'none'
            }
          />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onPress={() => handleVote('downvote')}
          disabled={disabled || isVoting}
          className={cn(
            'p-1',
            userVote?.voteType === 'downvote' && 'bg-red-50',
          )}>
          <ThumbsDown
            size={18}
            color={getVoteButtonColor('downvote')}
            fill={
              userVote?.voteType === 'downvote'
                ? getVoteButtonColor('downvote')
                : 'none'
            }
          />
        </Button>

        {showVoteCount && (
          <Text className="text-sm text-gray-600">{platform.totalVotes}</Text>
        )}
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View className="flex-row items-center space-x-2">
        <Button
          variant={getVoteButtonVariant('upvote')}
          size="sm"
          onPress={() => handleVote('upvote')}
          disabled={disabled || isVoting}
          className={cn(
            getVoteButtonStyle('upvote'),
            userVote?.voteType === 'upvote' && 'bg-green-500 border-green-500',
          )}>
          <ThumbsUp
            size={16}
            color={getVoteButtonColor('upvote')}
            fill={userVote?.voteType === 'upvote' ? 'white' : 'none'}
          />
          {userVote?.voteType === 'upvote' && (
            <Text className="text-white text-xs ml-1">Liked</Text>
          )}
        </Button>

        <Button
          variant={getVoteButtonVariant('downvote')}
          size="sm"
          onPress={() => handleVote('downvote')}
          disabled={disabled || isVoting}
          className={cn(
            getVoteButtonStyle('downvote'),
            userVote?.voteType === 'downvote' && 'bg-red-500 border-red-500',
          )}>
          <ThumbsDown
            size={16}
            color={getVoteButtonColor('downvote')}
            fill={userVote?.voteType === 'downvote' ? 'white' : 'none'}
          />
          {userVote?.voteType === 'downvote' && (
            <Text className="text-white text-xs ml-1">Disliked</Text>
          )}
        </Button>

        {showVoteCount && (
          <View className="flex-row items-center">
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-sm text-gray-600 ml-1">
              {platform.totalVotes}
            </Text>
          </View>
        )}

        {advancedVotingEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setShowActions(!showActions)}
            className="p-1">
            <MoreHorizontal size={16} color="#6B7280" />
          </Button>
        )}
      </View>
    );
  }

  // Expanded variant
  return (
    <Card className="p-4 bg-white">
      <View className="space-y-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-semibold text-gray-900">
            Rate this Platform
          </Text>
          {showWeight && votingWeight && weightedVotingEnabled && (
            <Badge variant="secondary">
              <Text className="text-xs">
                Weight: {votingWeight.totalWeight.toFixed(1)}x
              </Text>
            </Badge>
          )}
        </View>

        {/* Voting Description */}
        <Text className="text-sm text-gray-600">
          Help other users by rating this platform based on your experience with
          their auctions and services.
        </Text>

        {/* Current Rating Display */}
        <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
          <View>
            <Text className="text-sm text-gray-600">Current Rating</Text>
            <View className="flex-row items-center mt-1">
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text className="font-semibold ml-1">
                {platform.platformRating.toFixed(1)}
              </Text>
              <Text className="text-gray-500 ml-1">
                ({platform.totalVotes} votes)
              </Text>
            </View>
          </View>

          {userVote && (
            <Badge
              variant={
                userVote.voteType === 'upvote' ? 'success' : 'destructive'
              }>
              <Text className="text-xs font-medium">
                Your {userVote.voteType === 'upvote' ? 'Upvote' : 'Downvote'}
              </Text>
            </Badge>
          )}
        </View>

        {/* Voting Buttons */}
        <View className="flex-row space-x-3">
          <Button
            variant={userVote?.voteType === 'upvote' ? 'default' : 'outline'}
            onPress={() => handleVote('upvote')}
            disabled={disabled || isVoting}
            className={cn(
              'flex-1 flex-row items-center justify-center space-x-2 py-3',
              userVote?.voteType === 'upvote' &&
                'bg-green-500 border-green-500',
            )}>
            <ThumbsUp
              size={20}
              color={userVote?.voteType === 'upvote' ? 'white' : '#10B981'}
              fill={userVote?.voteType === 'upvote' ? 'white' : 'none'}
            />
            <Text
              className={cn(
                'font-medium',
                userVote?.voteType === 'upvote'
                  ? 'text-white'
                  : 'text-green-600',
              )}>
              {userVote?.voteType === 'upvote' ? 'Liked' : 'Like'}
            </Text>
          </Button>

          <Button
            variant={userVote?.voteType === 'downvote' ? 'default' : 'outline'}
            onPress={() => handleVote('downvote')}
            disabled={disabled || isVoting}
            className={cn(
              'flex-1 flex-row items-center justify-center space-x-2 py-3',
              userVote?.voteType === 'downvote' && 'bg-red-500 border-red-500',
            )}>
            <ThumbsDown
              size={20}
              color={userVote?.voteType === 'downvote' ? 'white' : '#EF4444'}
              fill={userVote?.voteType === 'downvote' ? 'white' : 'none'}
            />
            <Text
              className={cn(
                'font-medium',
                userVote?.voteType === 'downvote'
                  ? 'text-white'
                  : 'text-red-600',
              )}>
              {userVote?.voteType === 'downvote' ? 'Disliked' : 'Dislike'}
            </Text>
          </Button>
        </View>

        {/* Voting Weight Information */}
        {showWeight && votingWeight && weightedVotingEnabled && (
          <View className="p-3 bg-blue-50 rounded-lg">
            <Text className="text-sm font-medium text-blue-900 mb-2">
              Your Voting Weight
            </Text>
            <View className="space-y-1">
              <View className="flex-row justify-between">
                <Text className="text-xs text-blue-700">Base Weight</Text>
                <Text className="text-xs text-blue-900 font-medium">
                  {votingWeight.baseWeight.toFixed(1)}x
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-blue-700">Stake Bonus</Text>
                <Text className="text-xs text-blue-900 font-medium">
                  +{votingWeight.stakeWeight.toFixed(1)}x
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-blue-700">Reputation Bonus</Text>
                <Text className="text-xs text-blue-900 font-medium">
                  +{votingWeight.reputationWeight.toFixed(1)}x
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-blue-200 pt-1">
                <Text className="text-xs font-medium text-blue-900">
                  Total Weight
                </Text>
                <Text className="text-xs font-bold text-blue-900">
                  {votingWeight.totalWeight.toFixed(1)}x
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Additional Actions */}
        {advancedVotingEnabled && showActions && (
          <View className="flex-row space-x-2 pt-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onPress={handleReport}
              className="flex-row items-center space-x-1">
              <Flag size={14} color="#EF4444" />
              <Text className="text-red-600 text-sm">Report</Text>
            </Button>
          </View>
        )}

        {/* Loading State */}
        {isVoting && (
          <View className="flex-row justify-center py-2">
            <Text className="text-sm text-gray-500">Submitting vote...</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

// Quick Vote Component for lists
export const QuickVote: React.FC<{
  platform: Platform;
  userVote?: PlatformVote;
  onVote: (platformId: string, voteType: 'upvote' | 'downvote') => void;
  disabled?: boolean;
}> = ({platform, userVote, onVote, disabled = false}) => {
  return (
    <View className="flex-row items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onPress={() => onVote(platform.id, 'upvote')}
        disabled={disabled}
        className="p-1">
        <ThumbsUp
          size={16}
          color={userVote?.voteType === 'upvote' ? '#10B981' : '#6B7280'}
          fill={userVote?.voteType === 'upvote' ? '#10B981' : 'none'}
        />
      </Button>

      <Text className="text-xs text-gray-600 min-w-[20px] text-center">
        {platform.totalVotes}
      </Text>

      <Button
        variant="ghost"
        size="sm"
        onPress={() => onVote(platform.id, 'downvote')}
        disabled={disabled}
        className="p-1">
        <ThumbsDown
          size={16}
          color={userVote?.voteType === 'downvote' ? '#EF4444' : '#6B7280'}
          fill={userVote?.voteType === 'downvote' ? '#EF4444' : 'none'}
        />
      </Button>
    </View>
  );
};

// Voting Summary Component
export const VotingSummary: React.FC<{
  platform: Platform;
  className?: string;
}> = ({platform, className}) => {
  const positivePercentage = Math.round((platform.platformRating / 5.0) * 100);

  return (
    <View className={cn('space-y-2', className)}>
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-700">
          Community Rating
        </Text>
        <Text className="text-sm text-gray-600">
          {platform.totalVotes} votes
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <Star size={16} color="#F59E0B" fill="#F59E0B" />
        <Text className="font-semibold text-gray-900">
          {platform.platformRating.toFixed(1)}
        </Text>
        <Text className="text-sm text-gray-600">out of 5.0</Text>
      </View>

      <View className="space-y-1">
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">Positive</Text>
          <Text className="text-xs text-gray-900">{positivePercentage}%</Text>
        </View>
        <View className="bg-gray-200 rounded-full h-2">
          <View
            className="bg-green-500 h-2 rounded-full"
            style={{width: `${positivePercentage}%`}}
          />
        </View>
      </View>
    </View>
  );
};
