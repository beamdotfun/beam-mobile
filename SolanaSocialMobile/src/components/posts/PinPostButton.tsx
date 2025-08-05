import React, {useState} from 'react';
import {Pressable, Text, Alert} from 'react-native';
import {Pin, PinOff} from 'lucide-react-native';
import {useContentPinningStore} from '../../store/contentPinningStore';
import {useAuthStore} from '../../store/auth';

interface PinPostButtonProps {
  postId: string;
  authorWallet: string;
  size?: 'sm' | 'md';
  showText?: boolean;
}

export const PinPostButton: React.FC<PinPostButtonProps> = ({
  postId,
  authorWallet,
  size = 'md',
  showText = false,
}) => {
  const {user} = useAuthStore();
  const {
    isPinned,
    canPinMore,
    capabilities,
    isPinning,
    pinPost,
    unpinPost,
    error,
    clearError,
  } = useContentPinningStore();

  // Only show for own posts
  if (!user || user.walletAddress !== authorWallet) {
    return null;
  }

  const isPostPinned = isPinned(postId);
  const iconSize = size === 'sm' ? 16 : 20;

  const handlePress = () => {
    if (error) {
      clearError();
    }

    if (isPostPinned) {
      handleUnpin();
    } else {
      handlePin();
    }
  };

  const handlePin = () => {
    if (!canPinMore()) {
      Alert.alert(
        'Pin Limit Reached',
        `You can only pin ${capabilities?.maxPins || 1} post${
          capabilities?.maxPins === 1 ? '' : 's'
        } at a time. Unpin another post first.`,
      );
      return;
    }

    Alert.alert('Pin Post', 'Pin this post to your profile?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Pin',
        onPress: async () => {
          try {
            await pinPost(postId);
          } catch (error) {
            console.error('Failed to pin post:', error);
          }
        },
      },
    ]);
  };

  const handleUnpin = () => {
    Alert.alert('Unpin Post', 'Remove this post from your pinned posts?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Unpin',
        onPress: async () => {
          try {
            await unpinPost(postId);
          } catch (error) {
            console.error('Failed to unpin post:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPinning}
      className="flex-row items-center space-x-1 p-2 rounded-lg">
      {isPostPinned ? (
        <PinOff size={iconSize} color="#EF4444" />
      ) : (
        <Pin size={iconSize} color="#6B7280" />
      )}
      {showText && (
        <Text
          className={`text-sm ${
            isPostPinned ? 'text-red-600' : 'text-gray-600'
          }`}>
          {isPinning ? 'Processing...' : isPostPinned ? 'Unpin' : 'Pin'}
        </Text>
      )}
    </Pressable>
  );
};
