import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {socialAdvancedAPI} from '../services/api/socialAdvanced';
import {
  Comment,
  Reaction,
  PostShare,
  SocialThread,
  CommentFilter,
  ReactionSummary,
  SocialNotification,
  CommentCreateRequest,
  CommentUpdateRequest,
  CommentVoteRequest,
  ReactionRequest,
  ShareRequest,
  MentionSuggestion,
  HashtagSuggestion,
} from '@/types/social-advanced';

interface SocialAdvancedState {
  // Comments
  comments: Record<string, Comment[]>; // postId -> comments
  commentReplies: Record<string, Comment[]>; // commentId -> replies
  loadingComments: Record<string, boolean>;
  commentErrors: Record<string, string>;
  commentFilters: Record<string, CommentFilter>;

  // Reactions
  postReactions: Record<string, ReactionSummary[]>; // postId -> reactions
  commentReactions: Record<string, ReactionSummary[]>; // commentId -> reactions
  userReactions: Record<string, Reaction[]>; // targetId -> user's reactions

  // Shares
  postShares: Record<string, PostShare[]>; // postId -> shares
  userShares: PostShare[];

  // Threads
  threads: SocialThread[];
  threadDetails: Record<string, SocialThread>;
  userThreads: string[]; // thread IDs user is part of

  // Mentions & Hashtags
  mentionSuggestions: MentionSuggestion[];
  hashtagSuggestions: HashtagSuggestion[];
  recentMentions: string[]; // recent user wallets
  trendingHashtags: string[];

  // Notifications
  notifications: SocialNotification[];
  unreadCount: number;

  // UI State
  isLoadingMentions: boolean;
  isLoadingHashtags: boolean;
  optimisticUpdates: Record<string, any>;
}

interface SocialAdvancedActions {
  // Comment Actions
  fetchComments: (postId: string, filter?: CommentFilter) => Promise<void>;
  fetchCommentReplies: (commentId: string) => Promise<void>;
  createComment: (request: CommentCreateRequest) => Promise<Comment>;
  updateComment: (
    commentId: string,
    request: CommentUpdateRequest,
  ) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  voteComment: (request: CommentVoteRequest) => Promise<void>;
  pinComment: (commentId: string) => Promise<void>;
  unpinComment: (commentId: string) => Promise<void>;

  // Reaction Actions
  addReaction: (request: ReactionRequest) => Promise<void>;
  removeReaction: (reactionId: string) => Promise<void>;
  fetchPostReactions: (postId: string) => Promise<void>;
  fetchCommentReactions: (commentId: string) => Promise<void>;

  // Share Actions
  sharePost: (request: ShareRequest) => Promise<PostShare>;
  fetchPostShares: (postId: string) => Promise<void>;
  fetchUserShares: () => Promise<void>;

  // Thread Actions
  createThread: (
    title: string,
    description?: string,
    postIds?: string[],
  ) => Promise<SocialThread>;
  fetchThreads: () => Promise<void>;
  fetchThreadDetails: (threadId: string) => Promise<void>;
  addPostToThread: (threadId: string, postId: string) => Promise<void>;
  removePostFromThread: (threadId: string, postId: string) => Promise<void>;
  leaveThread: (threadId: string) => Promise<void>;

  // Mention & Hashtag Actions
  searchMentions: (query: string) => Promise<void>;
  searchHashtags: (query: string) => Promise<void>;
  fetchTrendingHashtags: () => Promise<void>;
  addRecentMention: (walletAddress: string) => void;

  // Notification Actions
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotification: (notificationId: string) => void;

  // Utility Actions
  setCommentFilter: (postId: string, filter: CommentFilter) => void;
  clearPostComments: (postId: string) => void;
  clearOptimisticUpdate: (key: string) => void;
  reset: () => void;
}

type SocialAdvancedStore = SocialAdvancedState & SocialAdvancedActions;

const useSocialAdvancedStore = create<SocialAdvancedStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        comments: {},
        commentReplies: {},
        loadingComments: {},
        commentErrors: {},
        commentFilters: {},
        postReactions: {},
        commentReactions: {},
        userReactions: {},
        postShares: {},
        userShares: [],
        threads: [],
        threadDetails: {},
        userThreads: [],
        mentionSuggestions: [],
        hashtagSuggestions: [],
        recentMentions: [],
        trendingHashtags: [],
        notifications: [],
        unreadCount: 0,
        isLoadingMentions: false,
        isLoadingHashtags: false,
        optimisticUpdates: {},

        // Comment Actions
        fetchComments: async (postId: string, filter?: CommentFilter) => {
          set(state => ({
            loadingComments: {...state.loadingComments, [postId]: true},
            commentErrors: {...state.commentErrors, [postId]: ''},
          }));

          try {
            const comments = await socialAdvancedAPI.getComments(
              postId,
              filter,
            );
            set(state => ({
              comments: {...state.comments, [postId]: comments},
              commentFilters: {...state.commentFilters, [postId]: filter || {}},
              loadingComments: {...state.loadingComments, [postId]: false},
            }));
          } catch (error) {
            set(state => ({
              commentErrors: {
                ...state.commentErrors,
                [postId]:
                  error instanceof Error
                    ? error.message
                    : 'Failed to fetch comments',
              },
              loadingComments: {...state.loadingComments, [postId]: false},
            }));
          }
        },

        fetchCommentReplies: async (commentId: string) => {
          try {
            const replies = await socialAdvancedAPI.getCommentReplies(
              commentId,
            );
            set(state => ({
              commentReplies: {...state.commentReplies, [commentId]: replies},
            }));
          } catch (error) {
            console.error('Failed to fetch comment replies:', error);
          }
        },

        createComment: async (request: CommentCreateRequest) => {
          // Optimistic update
          const tempId = `temp-${Date.now()}`;
          const optimisticComment: Comment = {
            id: tempId,
            postId: request.postId,
            parentCommentId: request.parentCommentId,
            userWallet: '', // Will be filled by API
            content: request.content,
            mentions: [],
            hashtags: [],
            upvotes: 0,
            downvotes: 0,
            voteScore: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
            isPinned: false,
            user: {
              walletAddress: '',
              displayName: 'You',
              isVerified: false,
              onChainReputation: 0,
            },
          };

          set(state => ({
            optimisticUpdates: {
              ...state.optimisticUpdates,
              [tempId]: optimisticComment,
            },
            comments: {
              ...state.comments,
              [request.postId]: [
                optimisticComment,
                ...(state.comments[request.postId] || []),
              ],
            },
          }));

          try {
            const comment = await socialAdvancedAPI.createComment(request);

            set(state => {
              const newComments = {...state.comments};
              const postComments = newComments[request.postId] || [];
              const index = postComments.findIndex(c => c.id === tempId);

              if (index !== -1) {
                postComments[index] = comment;
              } else {
                postComments.unshift(comment);
              }

              const {[tempId]: _, ...restOptimistic} = state.optimisticUpdates;

              return {
                comments: newComments,
                optimisticUpdates: restOptimistic,
              };
            });

            return comment;
          } catch (error) {
            // Remove optimistic update on error
            set(state => {
              const newComments = {...state.comments};
              const postComments = newComments[request.postId] || [];
              newComments[request.postId] = postComments.filter(
                c => c.id !== tempId,
              );

              const {[tempId]: _, ...restOptimistic} = state.optimisticUpdates;

              return {
                comments: newComments,
                optimisticUpdates: restOptimistic,
                commentErrors: {
                  ...state.commentErrors,
                  [request.postId]:
                    error instanceof Error
                      ? error.message
                      : 'Failed to create comment',
                },
              };
            });
            throw error;
          }
        },

        updateComment: async (
          commentId: string,
          request: CommentUpdateRequest,
        ) => {
          try {
            await socialAdvancedAPI.updateComment(commentId, request);

            set(state => {
              const newComments = {...state.comments};

              // Update comment in all post comment lists
              Object.keys(newComments).forEach(postId => {
                const comments = newComments[postId];
                const index = comments.findIndex(c => c.id === commentId);
                if (index !== -1) {
                  comments[index] = {
                    ...comments[index],
                    content: request.content,
                    // Note: mentions would need to be parsed from content or provided as Mention[]
                    // For now, keeping existing mentions
                    isEdited: true,
                    updatedAt: new Date().toISOString(),
                  };
                }
              });

              return {comments: newComments};
            });
          } catch (error) {
            throw error;
          }
        },

        deleteComment: async (commentId: string) => {
          try {
            await socialAdvancedAPI.deleteComment(commentId);

            set(state => {
              const newComments = {...state.comments};

              // Remove comment from all post comment lists
              Object.keys(newComments).forEach(postId => {
                newComments[postId] = newComments[postId].filter(
                  c => c.id !== commentId,
                );
              });

              // Remove comment replies
              const {[commentId]: _, ...restReplies} = state.commentReplies;

              return {
                comments: newComments,
                commentReplies: restReplies,
              };
            });
          } catch (error) {
            throw error;
          }
        },

        voteComment: async (request: CommentVoteRequest) => {
          try {
            await socialAdvancedAPI.voteComment(request);

            set(state => {
              const newComments = {...state.comments};

              // Update vote in all post comment lists
              Object.keys(newComments).forEach(postId => {
                const comments = newComments[postId];
                const index = comments.findIndex(
                  c => c.id === request.commentId,
                );
                if (index !== -1) {
                  const comment = comments[index];
                  const previousVote = comment.userVote;

                  // Update vote counts
                  if (previousVote === 'upvote') {comment.upvotes--;}
                  if (previousVote === 'downvote') {comment.downvotes--;}

                  if (request.voteType === 'upvote') {comment.upvotes++;}
                  if (request.voteType === 'downvote') {comment.downvotes++;}

                  comment.userVote = request.voteType;
                  comment.voteScore = comment.upvotes - comment.downvotes;
                }
              });

              return {comments: newComments};
            });
          } catch (error) {
            throw error;
          }
        },

        pinComment: async (commentId: string) => {
          try {
            await socialAdvancedAPI.pinComment(commentId);

            set(state => {
              const newComments = {...state.comments};

              Object.keys(newComments).forEach(postId => {
                const comments = newComments[postId];
                const index = comments.findIndex(c => c.id === commentId);
                if (index !== -1) {
                  comments[index].isPinned = true;
                  // Move pinned comment to top
                  const [pinnedComment] = comments.splice(index, 1);
                  comments.unshift(pinnedComment);
                }
              });

              return {comments: newComments};
            });
          } catch (error) {
            throw error;
          }
        },

        unpinComment: async (commentId: string) => {
          try {
            await socialAdvancedAPI.unpinComment(commentId);

            set(state => {
              const newComments = {...state.comments};

              Object.keys(newComments).forEach(postId => {
                const comments = newComments[postId];
                const comment = comments.find(c => c.id === commentId);
                if (comment) {
                  comment.isPinned = false;
                }
              });

              return {comments: newComments};
            });
          } catch (error) {
            throw error;
          }
        },

        // Reaction Actions
        addReaction: async (request: ReactionRequest) => {
          const optimisticId = `temp-reaction-${Date.now()}`;

          // Optimistic update
          set(state => {
            const key =
              request.targetType === 'post'
                ? 'postReactions'
                : 'commentReactions';
            const reactions = state[key][request.targetId] || [];
            const existingReaction = reactions.find(
              r => r.type === request.reactionType,
            );

            if (existingReaction) {
              existingReaction.count++;
              existingReaction.hasUserReacted = true;
            } else {
              reactions.push({
                type: request.reactionType,
                count: 1,
                hasUserReacted: true,
                recentUsers: [],
              });
            }

            return {
              [key]: {...state[key], [request.targetId]: [...reactions]},
              userReactions: {
                ...state.userReactions,
                [request.targetId]: [
                  ...(state.userReactions[request.targetId] || []),
                  {
                    id: optimisticId,
                    postId:
                      request.targetType === 'post'
                        ? request.targetId
                        : undefined,
                    commentId:
                      request.targetType === 'comment'
                        ? request.targetId
                        : undefined,
                    userWallet: '',
                    type: request.reactionType,
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            };
          });

          try {
            await socialAdvancedAPI.addReaction(request);
          } catch (error) {
            // Revert optimistic update
            set(state => {
              const key =
                request.targetType === 'post'
                  ? 'postReactions'
                  : 'commentReactions';
              const reactions = state[key][request.targetId] || [];
              const reaction = reactions.find(
                r => r.type === request.reactionType,
              );

              if (reaction) {
                reaction.count--;
                if (reaction.count === 0) {
                  const index = reactions.indexOf(reaction);
                  reactions.splice(index, 1);
                } else {
                  reaction.hasUserReacted = false;
                }
              }

              return {
                [key]: {...state[key], [request.targetId]: [...reactions]},
                userReactions: {
                  ...state.userReactions,
                  [request.targetId]:
                    state.userReactions[request.targetId]?.filter(
                      r => r.id !== optimisticId,
                    ) || [],
                },
              };
            });
            throw error;
          }
        },

        removeReaction: async (reactionId: string) => {
          try {
            await socialAdvancedAPI.removeReaction(reactionId);

            // Update will come through WebSocket
          } catch (error) {
            throw error;
          }
        },

        fetchPostReactions: async (postId: string) => {
          try {
            const reactions = await socialAdvancedAPI.getPostReactions(postId);
            set(state => ({
              postReactions: {...state.postReactions, [postId]: reactions},
            }));
          } catch (error) {
            console.error('Failed to fetch post reactions:', error);
          }
        },

        fetchCommentReactions: async (commentId: string) => {
          try {
            const reactions = await socialAdvancedAPI.getCommentReactions(
              commentId,
            );
            set(state => ({
              commentReactions: {
                ...state.commentReactions,
                [commentId]: reactions,
              },
            }));
          } catch (error) {
            console.error('Failed to fetch comment reactions:', error);
          }
        },

        // Share Actions
        sharePost: async (request: ShareRequest) => {
          try {
            const share = await socialAdvancedAPI.sharePost(request);

            set(state => ({
              postShares: {
                ...state.postShares,
                [request.postId]: [
                  share,
                  ...(state.postShares[request.postId] || []),
                ],
              },
              userShares: [share, ...state.userShares],
            }));

            return share;
          } catch (error) {
            throw error;
          }
        },

        fetchPostShares: async (postId: string) => {
          try {
            const shares = await socialAdvancedAPI.getPostShares(postId);
            set(state => ({
              postShares: {...state.postShares, [postId]: shares},
            }));
          } catch (error) {
            console.error('Failed to fetch post shares:', error);
          }
        },

        fetchUserShares: async () => {
          try {
            const shares = await socialAdvancedAPI.getUserShares();
            set({userShares: shares});
          } catch (error) {
            console.error('Failed to fetch user shares:', error);
          }
        },

        // Thread Actions
        createThread: async (
          title: string,
          description?: string,
          postIds?: string[],
        ) => {
          try {
            const thread = await socialAdvancedAPI.createThread({
              title,
              description,
              postIds,
            });

            set(state => ({
              threads: [thread, ...state.threads],
              threadDetails: {...state.threadDetails, [thread.id]: thread},
              userThreads: [thread.id, ...state.userThreads],
            }));

            return thread;
          } catch (error) {
            throw error;
          }
        },

        fetchThreads: async () => {
          try {
            const threads = await socialAdvancedAPI.getThreads();
            set({threads});
          } catch (error) {
            console.error('Failed to fetch threads:', error);
          }
        },

        fetchThreadDetails: async (threadId: string) => {
          try {
            const thread = await socialAdvancedAPI.getThreadDetails(threadId);
            set(state => ({
              threadDetails: {...state.threadDetails, [threadId]: thread},
            }));
          } catch (error) {
            console.error('Failed to fetch thread details:', error);
          }
        },

        addPostToThread: async (threadId: string, postId: string) => {
          try {
            await socialAdvancedAPI.addPostToThread(threadId, postId);

            set(state => {
              const thread = state.threadDetails[threadId];
              if (thread) {
                thread.posts.push(postId);
                return {
                  threadDetails: {
                    ...state.threadDetails,
                    [threadId]: {...thread},
                  },
                };
              }
              return state;
            });
          } catch (error) {
            throw error;
          }
        },

        removePostFromThread: async (threadId: string, postId: string) => {
          try {
            await socialAdvancedAPI.removePostFromThread(threadId, postId);

            set(state => {
              const thread = state.threadDetails[threadId];
              if (thread) {
                thread.posts = thread.posts.filter(id => id !== postId);
                return {
                  threadDetails: {
                    ...state.threadDetails,
                    [threadId]: {...thread},
                  },
                };
              }
              return state;
            });
          } catch (error) {
            throw error;
          }
        },

        leaveThread: async (threadId: string) => {
          try {
            await socialAdvancedAPI.leaveThread(threadId);

            set(state => ({
              userThreads: state.userThreads.filter(id => id !== threadId),
            }));
          } catch (error) {
            throw error;
          }
        },

        // Mention & Hashtag Actions
        searchMentions: async (query: string) => {
          if (!query || query.length < 2) {
            set({mentionSuggestions: []});
            return;
          }

          set({isLoadingMentions: true});

          try {
            const suggestions = await socialAdvancedAPI.searchUsers(query);
            set({
              mentionSuggestions: suggestions,
              isLoadingMentions: false,
            });
          } catch (error) {
            set({
              mentionSuggestions: [],
              isLoadingMentions: false,
            });
          }
        },

        searchHashtags: async (query: string) => {
          if (!query || query.length < 2) {
            set({hashtagSuggestions: []});
            return;
          }

          set({isLoadingHashtags: true});

          try {
            const suggestions = await socialAdvancedAPI.searchHashtags(query);
            set({
              hashtagSuggestions: suggestions,
              isLoadingHashtags: false,
            });
          } catch (error) {
            set({
              hashtagSuggestions: [],
              isLoadingHashtags: false,
            });
          }
        },

        fetchTrendingHashtags: async () => {
          try {
            const hashtags = await socialAdvancedAPI.getTrendingHashtags();
            set({trendingHashtags: hashtags});
          } catch (error) {
            console.error('Failed to fetch trending hashtags:', error);
          }
        },

        addRecentMention: (walletAddress: string) => {
          set(state => {
            const mentions = [
              walletAddress,
              ...state.recentMentions.filter(w => w !== walletAddress),
            ];
            return {recentMentions: mentions.slice(0, 10)}; // Keep last 10
          });
        },

        // Notification Actions
        fetchNotifications: async () => {
          try {
            const notifications = await socialAdvancedAPI.getNotifications();
            const unreadCount = notifications.filter(n => !n.isRead).length;
            set({notifications, unreadCount});
          } catch (error) {
            console.error('Failed to fetch notifications:', error);
          }
        },

        markNotificationRead: async (notificationId: string) => {
          try {
            await socialAdvancedAPI.markNotificationRead(notificationId);

            set(state => {
              const notifications = state.notifications.map(n =>
                n.id === notificationId ? {...n, isRead: true} : n,
              );
              const unreadCount = notifications.filter(n => !n.isRead).length;
              return {notifications, unreadCount};
            });
          } catch (error) {
            console.error('Failed to mark notification as read:', error);
          }
        },

        markAllNotificationsRead: async () => {
          try {
            await socialAdvancedAPI.markAllNotificationsRead();

            set(state => ({
              notifications: state.notifications.map(n => ({
                ...n,
                isRead: true,
              })),
              unreadCount: 0,
            }));
          } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
          }
        },

        clearNotification: (notificationId: string) => {
          set(state => {
            const notifications = state.notifications.filter(
              n => n.id !== notificationId,
            );
            const unreadCount = notifications.filter(n => !n.isRead).length;
            return {notifications, unreadCount};
          });
        },


        // Utility Actions
        setCommentFilter: (postId: string, filter: CommentFilter) => {
          set(state => ({
            commentFilters: {...state.commentFilters, [postId]: filter},
          }));
          get().fetchComments(postId, filter);
        },

        clearPostComments: (postId: string) => {
          set(state => {
            const {[postId]: _, ...restComments} = state.comments;
            const {[postId]: __, ...restErrors} = state.commentErrors;
            const {[postId]: ___, ...restLoading} = state.loadingComments;
            const {[postId]: ____, ...restFilters} = state.commentFilters;

            return {
              comments: restComments,
              commentErrors: restErrors,
              loadingComments: restLoading,
              commentFilters: restFilters,
            };
          });
        },

        clearOptimisticUpdate: (key: string) => {
          set(state => {
            const {[key]: _, ...rest} = state.optimisticUpdates;
            return {optimisticUpdates: rest};
          });
        },

        reset: () => {
          set({
            comments: {},
            commentReplies: {},
            loadingComments: {},
            commentErrors: {},
            commentFilters: {},
            postReactions: {},
            commentReactions: {},
            userReactions: {},
            postShares: {},
            userShares: [],
            threads: [],
            threadDetails: {},
            userThreads: [],
            mentionSuggestions: [],
            hashtagSuggestions: [],
            recentMentions: [],
            trendingHashtags: [],
            notifications: [],
            unreadCount: 0,
            isLoadingMentions: false,
            isLoadingHashtags: false,
            optimisticUpdates: {},
          });
        },
      }),
      {
        name: 'social-advanced-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: state => ({
          recentMentions: state.recentMentions,
          notifications: state.notifications.slice(0, 50), // Keep last 50
          unreadCount: state.unreadCount,
        }),
      },
    ),
  ),
);

export {useSocialAdvancedStore};
