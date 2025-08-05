import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {formatDistanceToNow} from 'date-fns';
import {
  MessageCircle,
  Users,
  Clock,
  ChevronRight,
  Eye,
  Quote,
  Bookmark,
} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {ThreadGroup, getThreadSummary} from '../../utils/threadUtils';

interface ThreadCardProps {
  thread: ThreadGroup;
  onPress: () => void;
  onUserPress?: (walletAddress: string) => void;
}

export function ThreadCard({thread, onPress, onUserPress}: ThreadCardProps) {
  const {colors} = useThemeStore();
  const threadSummary = getThreadSummary(thread);
  
  // Calculate aggregated stats
  const totalViews = thread.posts.reduce((sum, post) => sum + (post.view_count || post.viewCount || 0), 0);
  const totalQuotes = thread.posts.reduce((sum, post) => sum + (post.quote_count || post.quoteCount || 0), 0);
  const totalBookmarks = thread.posts.reduce((sum, post) => sum + (post.receipts_count || post.receiptsCount || 0), 0);

  // Get the first post for preview
  const firstPost = thread.firstPost;
  const lastPost = thread.lastPost;
  
  // Get user info from the first post
  const firstPostUser = firstPost.user;
  const userWallet = firstPostUser?.wallet_address || firstPost.userWallet || '';
  const isBrandUser = firstPostUser?.is_brand && firstPostUser?.brand_name;
  const displayName = (isBrandUser ? firstPostUser.brand_name : null) ||
    firstPostUser?.display_name || firstPostUser?.username || firstPost.username || 
    (userWallet ? `${userWallet.slice(0, 5)}...${userWallet.slice(-5)}` : 'Unknown');
  const avatarUrl = isBrandUser && firstPostUser?.brand_logo_url 
    ? firstPostUser.brand_logo_url
    : (firstPostUser?.avatar_url || firstPost.profile_image_url);
  const isVerified = firstPostUser?.is_verified || firstPost.is_username_verified || firstPost.is_profile_verified || false;

  // Truncate message for preview
  const previewMessage = firstPost.message.length > 150 
    ? firstPost.message.substring(0, 150) + '...' 
    : firstPost.message;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    threadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    threadIcon: {
      marginRight: 8,
    },
    threadBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    threadBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    userInfo: {
      marginLeft: 12,
      flex: 1,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    verifiedIcon: {
      marginLeft: 4,
      fontSize: 16,
      color: colors.success,
    },
    userMeta: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    expandIcon: {
      marginLeft: 'auto',
    },
    previewContent: {
      marginBottom: 12,
    },
    previewText: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    threadMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    threadMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    threadMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    threadMetaIcon: {
      marginRight: 4,
    },
    threadMetaText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      marginRight: 4,
    },
    statText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    continueIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    continueText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginRight: 4,
    },
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Thread Header */}
      <View style={styles.threadHeader}>
        <View style={styles.threadBadge}>
          <MessageCircle size={12} color={colors.primary} />
          <Text style={styles.threadBadgeText}>THREAD</Text>
        </View>
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        <Pressable
          onPress={() => onUserPress?.(userWallet)}
          disabled={!onUserPress}>
          <Avatar
            src={avatarUrl}
            fallback={displayName.charAt(0)}
            size="md"
            showRing={isVerified}
            ringColor={colors.success}
          />
        </Pressable>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{displayName}</Text>
            {isVerified && <Text style={styles.verifiedIcon}>✓</Text>}
          </View>
          <Text style={styles.userMeta}>
            Started {formatDistanceToNow(new Date(thread.createdAt), {addSuffix: true})}
          </Text>
        </View>
        
        <ChevronRight size={20} color={colors.mutedForeground} style={styles.expandIcon} />
      </View>

      {/* Preview Content */}
      <View style={styles.previewContent}>
        <Text style={styles.previewText}>
          {previewMessage}
        </Text>
      </View>

      {/* Thread Meta */}
      <View style={styles.threadMeta}>
        <View style={styles.threadMetaLeft}>
          <View style={styles.threadMetaItem}>
            <MessageCircle size={14} color={colors.mutedForeground} style={styles.threadMetaIcon} />
            <Text style={styles.threadMetaText}>
              {thread.totalPosts} post{thread.totalPosts !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.threadMetaItem}>
            <Users size={14} color={colors.mutedForeground} style={styles.threadMetaIcon} />
            <Text style={styles.threadMetaText}>
              {threadSummary.participants.length} participant{threadSummary.participants.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.threadMetaItem}>
          <Clock size={14} color={colors.mutedForeground} style={styles.threadMetaIcon} />
          <Text style={styles.threadMetaText}>
            {formatDistanceToNow(new Date(thread.updatedAt), {addSuffix: true})}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Eye size={16} color={colors.mutedForeground} style={styles.statIcon} />
          <Text style={styles.statText}>
            {totalViews > 0 ? totalViews.toLocaleString() : '0'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Quote size={16} color={colors.mutedForeground} style={styles.statIcon} />
          <Text style={styles.statText}>
            {totalQuotes > 0 ? totalQuotes.toLocaleString() : '0'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Bookmark size={16} color={colors.mutedForeground} style={styles.statIcon} />
          <Text style={styles.statText}>
            {totalBookmarks > 0 ? totalBookmarks.toLocaleString() : '0'}
          </Text>
        </View>
      </View>

      {/* Continue Reading Indicator */}
      {thread.totalPosts > 1 && (
        <View style={styles.continueIndicator}>
          <Text style={styles.continueText}>
            Continue reading thread
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}