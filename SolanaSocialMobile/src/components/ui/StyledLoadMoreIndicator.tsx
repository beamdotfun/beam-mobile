import React from 'react';
import {View, Text, StyleSheet, Pressable, Dimensions} from 'react-native';
import {Avatar} from './avatar';
import {useThemeStore} from '../../store/themeStore';
import {getUserProfilePicture} from '../../utils/profileUtils';
import {getAvatarFallback} from '../../lib/utils';

const {width} = Dimensions.get('window');

interface PendingPost {
  id: string;
  user: {
    walletAddress?: string;
    display_name?: string;
    name?: string;
    profilePicture?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

interface StyledLoadMoreIndicatorProps {
  onPress?: () => void;
  pendingPosts?: PendingPost[];
  isLoading?: boolean;
  totalCount?: number; // Override the total count display
}

export function StyledLoadMoreIndicator({
  onPress,
  pendingPosts = [],
  isLoading = false,
  totalCount,
}: StyledLoadMoreIndicatorProps) {
  const {colors} = useThemeStore();

  // Mock some pending posts for demonstration if none provided
  const mockPendingPosts: PendingPost[] = [
    {
      id: '1',
      user: {
        walletAddress: 'ABC123DEF456',
        display_name: 'User 1',
        profilePicture: null,
      },
    },
    {
      id: '2', 
      user: {
        walletAddress: 'XYZ789QRS012',
        display_name: 'User 2',
        profilePicture: null,
      },
    },
    {
      id: '3',
      user: {
        walletAddress: 'MNO345PQR678',
        display_name: 'User 3', 
        profilePicture: null,
      },
    },
  ];

  const displayPosts = pendingPosts.length > 0 ? pendingPosts : [];
  const visibleAvatars = displayPosts.slice(0, 3); // Show max 3 avatars
  const remainingCount = Math.max(0, displayPosts.length - 3);
  const totalNewPosts = totalCount !== undefined ? totalCount : displayPosts.length;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginHorizontal: 96, // Increased from 80 to make 20% narrower
      marginVertical: 4,
      height: 40, // Match tab bar height exactly
      paddingHorizontal: 12,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    pressed: {
      backgroundColor: colors.primary + 'DD', // Slightly transparent when pressed
      transform: [{scale: 0.98}],
    },
    avatarsContainer: {
      flexDirection: 'row',
      marginRight: 12,
    },
    avatarWrapper: {
      marginLeft: -16, // Even tighter overlap
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 16,
    },
    firstAvatar: {
      marginLeft: 0, // First avatar doesn't overlap
    },
    remainingCount: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    remainingCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    textContainer: {
      flex: 1,
      alignItems: 'center',
    },
    mainText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primaryForeground,
      fontFamily: 'Inter-Medium',
    },
  });

  const getDisplayText = () => {
    if (isLoading) {
      return 'Loading more posts...';
    }
    
    if (totalNewPosts === 1) {
      return '1 New post';
    }
    
    if (totalNewPosts <= 20) {
      return `${totalNewPosts} New posts`;
    }
    
    return '20+ New posts';
  };
  
  // Don't render if we have no posts to display
  if (totalNewPosts === 0 && !isLoading) {
    return null;
  }

  return (
    <Pressable
      style={({pressed}) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isLoading}>
      
      {/* Stacked Avatar Section */}
      <View style={styles.avatarsContainer}>
        {visibleAvatars.map((post, index) => {
          const avatarUrl = getUserProfilePicture(post.user);
          const fallback = getAvatarFallback({
            displayName: post.user.display_name,
            name: post.user.name,
            walletAddress: post.user.walletAddress,
          });

          return (
            <View
              key={post.id}
              style={[
                styles.avatarWrapper,
                index === 0 && styles.firstAvatar,
              ]}>
              <Avatar
                src={avatarUrl}
                fallback={fallback}
                size="sm"
                showRing={post.user.is_verified}
                ringColor={colors.success}
              />
            </View>
          );
        })}
        
        {/* Show remaining count if more than 3 */}
        {remainingCount > 0 && (
          <View style={styles.remainingCount}>
            <Text style={styles.remainingCountText}>
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>

      {/* Text Section */}
      <View style={styles.textContainer}>
        <Text style={isLoading ? styles.loadingText : styles.mainText}>
          {getDisplayText()}
        </Text>
      </View>
    </Pressable>
  );
}