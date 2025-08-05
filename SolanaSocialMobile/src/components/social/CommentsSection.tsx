import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {Image} from 'react-native';
import {
  ChevronUp,
  ChevronDown,
  Reply,
  MoreVertical,
  Pin,
} from 'lucide-react-native';
import {formatDistanceToNow} from 'date-fns';
import {useThemeStore} from '../../store/themeStore';
import {useSocialAdvancedStore} from '../../store/socialAdvancedStore';
import {useWalletStore} from '../../store/wallet';
import {Comment, CommentFilter} from '../../types/social-advanced';

interface CommentsSectionProps {
  postId: string;
  onMentionClick?: (wallet: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  level?: number;
  onReply: (comment: Comment) => void;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onMentionClick?: (wallet: string) => void;
  canPin?: boolean;
  onPin?: (commentId: string) => void;
  onUnpin?: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  onReply,
  onVote,
  onMentionClick,
  canPin,
  onPin,
  onUnpin,
}) => {
  const {colors} = useThemeStore();
  const [showReplies, setShowReplies] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const indent = level * 16;

  const renderContent = () => {
    const parts = comment.content.split(/(@\w+|#\w+)/g);

    return (
      <Text className="text-sm" style={{color: colors.foreground}}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const mention = comment.mentions.find(
              m => `@${m.displayName}` === part,
            );
            if (mention) {
              return (
                <Text
                  key={index}
                  style={{color: colors.primary}}
                  onPress={() => onMentionClick?.(mention.userWallet)}>
                  {part}
                </Text>
              );
            }
          } else if (part.startsWith('#')) {
            return (
              <Text key={index} style={{color: colors.primary}}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <View style={{marginLeft: indent}}>
      <View className="flex-row items-start space-x-2 py-3">
        <Image
          source={{
            uri:
              comment.user.profilePicture || 'https://via.placeholder.com/40',
          }}
          className="w-8 h-8 rounded-full"
          style={{backgroundColor: colors.muted}}
        />

        <View className="flex-1">
          <View className="flex-row items-center space-x-2">
            <Text
              className="font-semibold text-sm"
              style={{color: colors.foreground}}>
              {comment.user.displayName}
            </Text>
            {comment.user.isVerified && (
              <View
                className="w-4 h-4 rounded-full"
                style={{backgroundColor: colors.primary}}
              />
            )}
            {comment.isPinned && <Pin size={14} color={colors.primary} />}
            <Text className="text-xs" style={{color: colors.mutedForeground}}>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </Text>
            {comment.isEdited && (
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                (edited)
              </Text>
            )}
          </View>

          <View className="mt-1">{renderContent()}</View>

          <View className="flex-row items-center space-x-4 mt-2">
            <View className="flex-row items-center space-x-1">
              <TouchableOpacity
                onPress={() => onVote(comment.id, 'upvote')}
                className="p-1">
                <ChevronUp
                  size={16}
                  color={
                    comment.userVote === 'upvote'
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
              </TouchableOpacity>
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                {comment.voteScore}
              </Text>
              <TouchableOpacity
                onPress={() => onVote(comment.id, 'downvote')}
                className="p-1">
                <ChevronDown
                  size={16}
                  color={
                    comment.userVote === 'downvote'
                      ? colors.destructive
                      : colors.mutedForeground
                  }
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => onReply(comment)}
              className="flex-row items-center space-x-1">
              <Reply size={14} color={colors.mutedForeground} />
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                Reply
              </Text>
            </TouchableOpacity>

            {hasReplies && (
              <TouchableOpacity
                onPress={() => setShowReplies(!showReplies)}
                className="flex-row items-center space-x-1">
                <Text className="text-xs" style={{color: colors.primary}}>
                  {comment.replyCount}{' '}
                  {comment.replyCount === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}

            {canPin && (
              <TouchableOpacity
                onPress={() => setShowOptions(!showOptions)}
                className="ml-auto">
                <MoreVertical size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {showOptions && canPin && (
            <View
              className="absolute right-0 top-8 rounded-lg p-2 shadow-sm"
              style={{backgroundColor: colors.card}}>
              <TouchableOpacity
                onPress={() => {
                  if (comment.isPinned) {
                    onUnpin?.(comment.id);
                  } else {
                    onPin?.(comment.id);
                  }
                  setShowOptions(false);
                }}
                className="px-3 py-2">
                <Text className="text-sm" style={{color: colors.foreground}}>
                  {comment.isPinned ? 'Unpin' : 'Pin'} Comment
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {hasReplies && showReplies && (
        <View>
          {comment.replies!.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onReply={onReply}
              onVote={onVote}
              onMentionClick={onMentionClick}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CommentSkeleton = () => {
  const {colors} = useThemeStore();

  return (
    <View className="flex-row items-start space-x-2 py-3">
      <View
        className="w-8 h-8 rounded-full"
        style={{backgroundColor: colors.muted}}
      />
      <View className="flex-1">
        <View
          className="w-32 h-4 mb-2"
          style={{backgroundColor: colors.muted}}
        />
        <View
          className="w-full h-12 mb-2"
          style={{backgroundColor: colors.muted}}
        />
        <View className="w-24 h-3" style={{backgroundColor: colors.muted}} />
      </View>
    </View>
  );
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  onMentionClick,
}) => {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState<CommentFilter['sortBy']>('newest');

  const {
    comments,
    loadingComments,
    commentErrors,
    fetchComments,
    createComment,
    voteComment,
    pinComment,
    unpinComment,
    setCommentFilter,
  } = useSocialAdvancedStore();

  const postComments = comments[postId] || [];
  const isLoading = loadingComments[postId] || false;
  const error = commentErrors[postId];

  // Filter pinned comments to show at top
  const sortedComments = useMemo(() => {
    const pinned = postComments.filter(c => c.isPinned && !c.parentCommentId);
    const unpinned = postComments.filter(
      c => !c.isPinned && !c.parentCommentId,
    );
    return [...pinned, ...unpinned];
  }, [postComments]);

  React.useEffect(() => {
    fetchComments(postId);
  }, [postId]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim()) {
      return;
    }

    try {
      await createComment({
        postId,
        parentCommentId: replyingTo?.id,
        content: commentText,
      });

      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  }, [postId, commentText, replyingTo, createComment]);

  const handleVote = useCallback(
    async (commentId: string, voteType: 'upvote' | 'downvote') => {
      try {
        await voteComment({commentId, voteType});
      } catch (error) {
        console.error('Failed to vote comment:', error);
      }
    },
    [voteComment],
  );

  const handleFilterChange = (newFilter: CommentFilter['sortBy']) => {
    setFilter(newFilter);
    setCommentFilter(postId, {sortBy: newFilter});
  };

  const isPostOwner = false; // TODO: Check if current user is post owner

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      <View className="flex-1">
        {/* Filter Bar */}
        <View
          className="flex-row items-center px-4 py-2 border-b"
          style={{borderColor: colors.border}}>
          <Text
            className="text-sm font-medium mr-4"
            style={{color: colors.foreground}}>
            {postComments.length} Comments
          </Text>

          <View className="flex-row space-x-2">
            {(['newest', 'oldest', 'top'] as const).map(sortOption => (
              <TouchableOpacity
                key={sortOption}
                onPress={() => handleFilterChange(sortOption)}
                className={`px-3 py-1 rounded-full ${
                  filter === sortOption ? '' : 'opacity-60'
                }`}
                style={{
                  backgroundColor:
                    filter === sortOption ? colors.primary : 'transparent',
                }}>
                <Text
                  className="text-xs capitalize"
                  style={{
                    color:
                      filter === sortOption
                        ? colors.primaryForeground
                        : colors.foreground,
                  }}>
                  {sortOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comments List */}
        {isLoading ? (
          <View className="px-4">
            {[...Array(3)].map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-sm" style={{color: colors.destructive}}>
              {error}
            </Text>
          </View>
        ) : sortedComments.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-sm" style={{color: colors.mutedForeground}}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedComments}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <CommentItem
                comment={item}
                onReply={setReplyingTo}
                onVote={handleVote}
                onMentionClick={onMentionClick}
                canPin={isPostOwner}
                onPin={pinComment}
                onUnpin={unpinComment}
              />
            )}
            contentContainerStyle={{paddingHorizontal: 16}}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Comment Input */}
        <View
          className="px-4 py-3 border-t"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}>
          {replyingTo && (
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs" style={{color: colors.mutedForeground}}>
                Replying to {replyingTo.user.displayName}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text className="text-xs" style={{color: colors.primary}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-end space-x-2">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={500}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: colors.muted,
                color: colors.foreground,
                maxHeight: 100,
              }}
            />

            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: commentText.trim()
                  ? colors.primary
                  : colors.muted,
              }}>
              <Text
                className="text-sm font-medium"
                style={{
                  color: commentText.trim()
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                }}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
