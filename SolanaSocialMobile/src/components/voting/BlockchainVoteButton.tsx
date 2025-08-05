import React, { useState, useCallback } from 'react';
import { Pressable, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useVoting } from '../../hooks/useBlockchainTransactions';

interface BlockchainVoteButtonProps {
  type: 'upvote' | 'downvote';
  targetWallet: string;
  count: number;
  isVoted: boolean;
  disabled?: boolean;
  onVoteComplete?: (signature: string) => void;
  onError?: (error: { title: string; message: string; type: 'error' | 'info' }) => void;
}

export function BlockchainVoteButton({
  type,
  targetWallet,
  count,
  isVoted,
  disabled = false,
  onVoteComplete,
  onError,
}: BlockchainVoteButtonProps) {
  const { colors } = useThemeStore();
  const { 
    upvote, 
    downvote, 
    loading, 
    error, 
    connected, 
    resetError,
    userPostCount,
    checkingPostCount,
  } = useVoting();
  
  const [localLoading, setLocalLoading] = useState(false);
  const Icon = type === 'upvote' ? ChevronUp : ChevronDown;

  const handleVote = useCallback(async () => {
    if (!connected) {
      if (onError) {
        onError({
          title: 'Wallet Not Connected',
          message: 'Please connect your wallet to vote.',
          type: 'error'
        });
      } else {
        Alert.alert('Wallet Not Connected', 'Please connect your wallet to vote.');
      }
      return;
    }

    if (isVoted) {
      if (onError) {
        onError({
          title: 'Already Voted',
          message: 'You have already voted on this user.',
          type: 'info'
        });
      } else {
        Alert.alert('Already Voted', 'You have already voted on this user.');
      }
      return;
    }

    resetError();
    setLocalLoading(true);

    try {
      const voteFunction = type === 'upvote' ? upvote : downvote;
      const result = await voteFunction(targetWallet);
      
      // Success - just call onVoteComplete, let parent handle success message
      onVoteComplete?.(result.signature);
    } catch (err: any) {
      console.error(`${type} failed:`, err);
      
      let message = err.message || 'Failed to process vote. Please try again.';
      let errorType: 'error' | 'info' = 'error';
      
      if (err.message?.includes('at least one post')) {
        message = 'You must create at least one post before you can vote';
      } else if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient')) {
        message = 'Insufficient SOL balance to complete voting';
      } else if (err.message?.includes('User rejected') || err.message?.includes('rejected') || err.message?.includes('cancelled')) {
        message = 'Voting process not completed';
        errorType = 'info';
      }

      if (onError) {
        onError({
          title: message,
          message: message,
          type: errorType
        });
      } else {
        // Fallback to alert if no error handler provided
        Alert.alert(
          errorType === 'info' ? 'Info' : 'Error',
          message
        );
      }
    } finally {
      setLocalLoading(false);
    }
  }, [
    connected,
    isVoted,
    type,
    targetWallet,
    upvote,
    downvote,
    resetError,
    onVoteComplete,
    onError,
  ]);

  const isLoading = loading || localLoading || checkingPostCount;
  const isDisabled = disabled || isLoading || !connected;

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isVoted
        ? type === 'upvote'
          ? colors.success + '20'
          : colors.destructive + '20'
        : colors.muted,
      opacity: isDisabled ? 0.5 : 1,
    },
    text: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      marginLeft: 4,
      color: isVoted
        ? type === 'upvote'
          ? colors.success
          : colors.destructive
        : colors.mutedForeground,
    },
  });

  return (
    <Pressable onPress={handleVote} disabled={isDisabled} style={styles.button}>
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={isVoted 
            ? (type === 'upvote' ? colors.success : colors.destructive)
            : colors.mutedForeground
          } 
        />
      ) : (
        <Icon
          size={16}
          color={
            isVoted
              ? type === 'upvote'
                ? colors.success || '#10B981'
                : colors.destructive || '#EF4444'
              : colors.mutedForeground
          }
        />
      )}
      <Text style={styles.text}>
        {isLoading && type === 'upvote' ? '...' : 
         isLoading && type === 'downvote' ? '...' : 
         count}
      </Text>
    </Pressable>
  );
}