import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { BlockchainVoteButton } from './BlockchainVoteButton';

interface UserVotingSectionProps {
  targetWallet: string;
  upvoteCount: number;
  downvoteCount: number;
  userVoteStatus?: 'upvoted' | 'downvoted' | null;
  onVoteComplete?: (signature: string, voteType: 'upvote' | 'downvote') => void;
}

export function UserVotingSection({
  targetWallet,
  upvoteCount,
  downvoteCount,
  userVoteStatus,
  onVoteComplete,
}: UserVotingSectionProps) {
  const { colors } = useThemeStore();

  const handleVoteComplete = (signature: string, voteType: 'upvote' | 'downvote') => {
    console.log(`${voteType} completed with signature: ${signature}`);
    onVoteComplete?.(signature, voteType);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    voteSection: {
      alignItems: 'center',
    },
    label: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      marginBottom: 8,
    },
    netScore: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    netScoreLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      marginBottom: 4,
    },
    netScoreValue: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      color: colors.foreground,
    },
  });

  const netScore = upvoteCount - downvoteCount;

  return (
    <View style={styles.container}>
      {/* Downvote Section */}
      <View style={styles.voteSection}>
        <Text style={styles.label}>Downvote</Text>
        <BlockchainVoteButton
          type="downvote"
          targetWallet={targetWallet}
          count={downvoteCount}
          isVoted={userVoteStatus === 'downvoted'}
          onVoteComplete={(signature) => handleVoteComplete(signature, 'downvote')}
        />
      </View>

      {/* Net Score */}
      <View style={styles.netScore}>
        <Text style={styles.netScoreLabel}>Reputation</Text>
        <Text style={[
          styles.netScoreValue,
          { color: netScore > 0 ? colors.success : netScore < 0 ? colors.destructive : colors.foreground }
        ]}>
          {netScore > 0 ? '+' : ''}{netScore}
        </Text>
      </View>

      {/* Upvote Section */}
      <View style={styles.voteSection}>
        <Text style={styles.label}>Upvote</Text>
        <BlockchainVoteButton
          type="upvote"
          targetWallet={targetWallet}
          count={upvoteCount}
          isVoted={userVoteStatus === 'upvoted'}
          onVoteComplete={(signature) => handleVoteComplete(signature, 'upvote')}
        />
      </View>
    </View>
  );
}