import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import {Heart, ThumbsUp, Laugh, Frown, Angry, Zap} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useSocialAdvancedStore} from '../../store/socialAdvancedStore';
import {ReactionSummary} from '../../types/social-advanced';

interface ReactionsBarProps {
  targetId: string;
  targetType: 'post' | 'comment';
  reactions: ReactionSummary[];
  onReactionToggle?: () => void;
  size?: 'small' | 'medium';
}

interface ReactionButtonProps {
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow';
  count: number;
  hasUserReacted: boolean;
  onPress: () => void;
  size?: 'small' | 'medium';
}

const REACTION_ICONS = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  angry: Angry,
  sad: Frown,
  wow: Zap,
};

const REACTION_COLORS = {
  like: '#3B82F6', // blue
  love: '#EF4444', // red
  laugh: '#F59E0B', // yellow
  angry: '#DC2626', // dark red
  sad: '#6B7280', // gray
  wow: '#8B5CF6', // purple
};

const ReactionButton: React.FC<ReactionButtonProps> = ({
  type,
  count,
  hasUserReacted,
  onPress,
  size = 'medium',
}) => {
  const {colors} = useThemeStore();
  const Icon = REACTION_ICONS[type];
  const reactionColor = REACTION_COLORS[type];
  const iconSize = size === 'small' ? 16 : 20;
  const scale = React.useRef(new Animated.Value(1)).current;

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: size === 'small' ? 6 : 8,
      paddingVertical: size === 'small' ? 2 : 4,
      borderRadius: 20,
      backgroundColor: hasUserReacted ? `${reactionColor}20` : colors.muted,
      borderWidth: hasUserReacted ? 1 : 0,
      borderColor: reactionColor,
    },
    text: {
      fontSize: size === 'small' ? 12 : 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      marginLeft: 4,
      color: hasUserReacted ? reactionColor : colors.mutedForeground,
    },
  });

  const handlePress = () => {
    // Animate the button
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Icon
          size={iconSize}
          color={hasUserReacted ? reactionColor : colors.mutedForeground}
        />
        {count > 0 && <Text style={styles.text}>{count}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ReactionsBar: React.FC<ReactionsBarProps> = ({
  targetId,
  targetType,
  reactions = [],
  onReactionToggle,
  size = 'medium',
}) => {
  const {colors} = useThemeStore();
  const [showPicker, setShowPicker] = useState(false);

  const {addReaction, removeReaction, userReactions} = useSocialAdvancedStore();

  const userReaction = userReactions[targetId]?.find(r => r.userWallet);
  const currentUserReactionType = userReaction?.type;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    summaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reactionStack: {
      flexDirection: 'row',
      marginRight: -4,
    },
    reactionIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      marginRight: -4,
    },
    summaryText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    addButton: {
      padding: size === 'small' ? 2 : 4,
      borderRadius: 20,
      backgroundColor: colors.muted,
    },
  });

  const handleReactionPress = useCallback(
    async (type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow') => {
      try {
        if (currentUserReactionType === type) {
          // Remove reaction
          if (userReaction) {
            await removeReaction(userReaction.id);
          }
        } else {
          // Add or change reaction
          if (userReaction) {
            await removeReaction(userReaction.id);
          }
          await addReaction({
            targetId,
            targetType,
            reactionType: type,
          });
        }

        onReactionToggle?.();
      } catch (error) {
        console.error('Failed to toggle reaction:', error);
      }
    },
    [
      targetId,
      targetType,
      currentUserReactionType,
      userReaction,
      addReaction,
      removeReaction,
      onReactionToggle,
    ],

  // Show top 3 reactions plus "add" button
  const topReactions = reactions.sort((a, b) => b.count - a.count).slice(0, 3);

  const totalReactionCount = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <View style={styles.container}>
      {/* Reaction Summary Button */}
      {totalReactionCount > 0 && (
        <TouchableOpacity style={styles.summaryButton}>
          <View style={styles.reactionStack}>
            {topReactions.slice(0, 3).map((reaction, index) => {
              const Icon =
                REACTION_ICONS[reaction.type as keyof typeof REACTION_ICONS];
              return (
                <View
                  key={reaction.type}
                  style={[styles.reactionIcon, {zIndex: 3 - index}]}>
                  <Icon
                    size={14}
                    color={
                      REACTION_COLORS[
                        reaction.type as keyof typeof REACTION_COLORS
                      ]
                    }
                  />
                </View>
              );
            })}
          </View>
          <Text style={styles.summaryText}>{totalReactionCount}</Text>
        </TouchableOpacity>
      )}

      {/* Individual Reaction Buttons */}
      {topReactions.map(reaction => (
        <ReactionButton
          key={reaction.type}
          type={
            reaction.type as 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow'
          }
          count={0} // Don't show count on individual buttons
          hasUserReacted={reaction.hasUserReacted}
          onPress={() => handleReactionPress(reaction.type as any)}
          size={size}
        />
      ))}

      {/* Add Reaction Button */}
      <TouchableOpacity
        onPress={() => handleReactionPress('like')}
        style={styles.addButton}>
        <ThumbsUp
          size={size === 'small' ? 16 : 20}
          color={
            currentUserReactionType
              ? REACTION_COLORS[
                  currentUserReactionType as keyof typeof REACTION_COLORS
                ]
              : colors.mutedForeground
          }
        />
      </TouchableOpacity>
    </View>
  );
};
