import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {Trash2, Zap} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {useWatchlist} from '../../hooks/useWatchlist';
import {getAvatarFallback} from '../../lib/utils';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const {width: screenWidth} = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25; // 25% of screen width
const DELETE_BUTTON_WIDTH = 100;

interface WatchlistUser {
  walletAddress: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  isVerified: boolean;
  reputation: number;
  postCount?: number;
  postsThisEpoch?: number;
  streak?: number;
}

interface SwipeableUserCardProps {
  item: WatchlistUser;
  onPress: (walletAddress: string) => void;
  onDelete?: () => void;
  statusMessage?: (message: { type: 'success' | 'error' | 'info', message: string }) => void;
}

export function SwipeableUserCard({
  item,
  onPress,
  onDelete,
  statusMessage,
}: SwipeableUserCardProps) {
  const {colors} = useThemeStore();
  const {toggleFollow} = useWatchlist();
  const pan = useRef(new Animated.Value(0)).current;
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          pan.setValue(gestureState.dx);
          // Fade in delete button as we swipe
          const opacity = Math.min(1, Math.abs(gestureState.dx) / DELETE_BUTTON_WIDTH);
          deleteButtonOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe is significant, keep it open
          Animated.parallel([
            Animated.spring(pan, {
              toValue: -DELETE_BUTTON_WIDTH,
              useNativeDriver: true,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Swipe is not significant, close it
          Animated.parallel([
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleDelete = async () => {
    // Haptic feedback
    ReactNativeHapticFeedback.trigger('impactLight');
    
    // Animate both card and delete button out together
    Animated.parallel([
      Animated.timing(pan, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(deleteButtonOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Optimistically remove from UI immediately
      onDelete?.();
      
      // Show success message
      statusMessage?.({
        type: 'success',
        message: `${item.displayName || 'User'} removed from watchlist`
      });
    });
    
    // Make the API call in the background
    try {
      await toggleFollow(item.walletAddress);
      // API call successful, no need to do anything else
    } catch (error: any) {
      console.error('Failed to remove from watchlist:', error);
      // Show error message but don't restore the card since it's already removed from UI
      statusMessage?.({
        type: 'error',
        message: 'Failed to remove from watchlist. Please refresh to see current list.'
      });
    }
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(deleteButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const postsText = `${item.postsThisEpoch || 0} posts this epoch`;
  const streakText = item.streak ? `🔥 ${item.streak}-epoch streak` : '🔥 0-epoch streak';
  const metaText = `${postsText} · ${streakText}`;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 12,
      position: 'relative',
    },
    deleteButtonContainer: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: DELETE_BUTTON_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.destructive,
      borderRadius: 12,
      marginBottom: 12,
    },
    deleteButton: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginTop: 4,
      color: colors.destructiveForeground || '#FFFFFF',
    },
    userCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    userCardPressed: {
      backgroundColor: colors.muted,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    leftColumn: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    metaLine: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    rightColumn: {
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
    },
    reputationPill: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    reputationText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 2,
    },
  });

  return (
    <View style={styles.container}>
      {/* Delete button behind the card */}
      <Animated.View
        style={[
          styles.deleteButtonContainer,
          {
            opacity: deleteButtonOpacity,
          },
        ]}>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={24} color={colors.destructiveForeground || '#FFFFFF'} />
          <Text style={styles.deleteText}>Remove</Text>
        </Pressable>
      </Animated.View>

      {/* Swipeable card */}
      <Animated.View
        style={{
          transform: [{translateX: pan}],
        }}
        {...panResponder.panHandlers}>
        <Pressable
          style={({pressed}) => [
            styles.userCard,
            pressed && styles.userCardPressed,
          ]}
          onPress={() => {
            // If swiped open, close it first
            const currentValue = (pan as any)._value;
            if (currentValue < -10) {
              resetPosition();
            } else {
              onPress(item.walletAddress);
            }
          }}>
          <View style={styles.cardContent}>
            <View style={styles.leftColumn}>
              <Avatar
                src={item.profileImage}
                fallback={getAvatarFallback(item)}
                size="md"
              />
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {item.displayName || item.username || 'Anonymous'}
                </Text>
                <Text style={styles.metaLine}>{metaText}</Text>
              </View>
            </View>
            
            <View style={styles.rightColumn}>
              <View style={styles.reputationPill}>
                <Zap size={12} color={colors.primaryForeground} fill={colors.primaryForeground} />
                <Text style={styles.reputationText}>{item.reputation || 0}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}