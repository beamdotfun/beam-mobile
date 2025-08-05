import api from './client';
import {ApiResponse, PaginatedResponse} from './types';
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

export class SocialAdvancedAPIService {
  /**
   * Comment Management
   */
  async getComments(
    postId: string,
    filter?: CommentFilter,
  ): Promise<Comment[]> {
    const params: any = {
      includeReplies: filter?.includeReplies ?? true,
    };

    if (filter?.sortBy) {params.sortBy = filter.sortBy;}
    if (filter?.userWallet) {params.userWallet = filter.userWallet;}
    if (filter?.hasMedia !== undefined) {params.hasMedia = filter.hasMedia;}

    const response = await api.get<ApiResponse<{comments: Comment[]}>>(
      `/posts/${postId}/comments`,
      params,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch comments');
    }

    return response.data.data.comments;
  }

  async getCommentReplies(commentId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<{replies: Comment[]}>>(
      `/comments/${commentId}/replies`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch comment replies',
      );
    }

    return response.data.data.replies;
  }

  async createComment(request: CommentCreateRequest): Promise<Comment> {
    const response = await api.post<ApiResponse<{comment: Comment}>>(
      '/comments',
      request,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to create comment');
    }

    return response.data.data.comment;
  }

  async updateComment(
    commentId: string,
    request: CommentUpdateRequest,
  ): Promise<Comment> {
    const response = await api.put<ApiResponse<{comment: Comment}>>(
      `/comments/${commentId}`,
      request,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to update comment');
    }

    return response.data.data.comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/comments/${commentId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to delete comment');
    }
  }

  async voteComment(request: CommentVoteRequest): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      `/comments/${request.commentId}/vote`,
      {voteType: request.voteType},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to vote on comment');
    }
  }

  async pinComment(commentId: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      `/comments/${commentId}/pin`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to pin comment');
    }
  }

  async unpinComment(commentId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/comments/${commentId}/pin`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to unpin comment');
    }
  }

  /**
   * Reaction Management
   */
  async addReaction(request: ReactionRequest): Promise<Reaction> {
    const endpoint =
      request.targetType === 'post'
        ? `/posts/${request.targetId}/reactions`
        : `/comments/${request.targetId}/reactions`;

    const response = await api.post<ApiResponse<{reaction: Reaction}>>(
      endpoint,
      {type: request.reactionType},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to add reaction');
    }

    return response.data.data.reaction;
  }

  async removeReaction(reactionId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/reactions/${reactionId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to remove reaction');
    }
  }

  async getPostReactions(postId: string): Promise<ReactionSummary[]> {
    const response = await api.get<ApiResponse<{reactions: ReactionSummary[]}>>(
      `/posts/${postId}/reactions`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch post reactions',
      );
    }

    return response.data.data.reactions;
  }

  async getCommentReactions(commentId: string): Promise<ReactionSummary[]> {
    const response = await api.get<ApiResponse<{reactions: ReactionSummary[]}>>(
      `/comments/${commentId}/reactions`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch comment reactions',
      );
    }

    return response.data.data.reactions;
  }

  /**
   * Share Management
   */
  async sharePost(request: ShareRequest): Promise<PostShare> {
    const response = await api.post<ApiResponse<{share: PostShare}>>(
      `/posts/${request.postId}/share`,
      {
        platform: request.platform,
        comment: request.comment,
      },
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to share post');
    }

    return response.data.data.share;
  }

  async getPostShares(postId: string): Promise<PostShare[]> {
    const response = await api.get<ApiResponse<{shares: PostShare[]}>>(
      `/posts/${postId}/shares`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch post shares');
    }

    return response.data.data.shares;
  }

  async getUserShares(): Promise<PostShare[]> {
    const response = await api.get<ApiResponse<{shares: PostShare[]}>>(
      '/user/shares',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch user shares');
    }

    return response.data.data.shares;
  }

  /**
   * Thread Management
   */
  async createThread(data: {
    title: string;
    description?: string;
    postIds?: string[];
  }): Promise<SocialThread> {
    const response = await api.post<ApiResponse<{thread: SocialThread}>>(
      '/threads',
      data,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to create thread');
    }

    return response.data.data.thread;
  }

  async getThreads(): Promise<SocialThread[]> {
    const response = await api.get<ApiResponse<{threads: SocialThread[]}>>(
      '/threads',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to fetch threads');
    }

    return response.data.data.threads;
  }

  async getThreadDetails(threadId: string): Promise<SocialThread> {
    const response = await api.get<ApiResponse<{thread: SocialThread}>>(
      `/threads/${threadId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch thread details',
      );
    }

    return response.data.data.thread;
  }

  async addPostToThread(threadId: string, postId: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      `/threads/${threadId}/posts`,
      {postId},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to add post to thread');
    }
  }

  async removePostFromThread(threadId: string, postId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/threads/${threadId}/posts/${postId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to remove post from thread',
      );
    }
  }

  async leaveThread(threadId: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      `/threads/${threadId}/leave`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to leave thread');
    }
  }

  /**
   * Mention and Hashtag Management
   */
  async searchUsers(query: string): Promise<MentionSuggestion[]> {
    const response = await api.get<ApiResponse<{users: MentionSuggestion[]}>>(
      '/users/search',
      {q: query, limit: 10},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to search users');
    }

    return response.data.data.users;
  }

  async searchHashtags(query: string): Promise<HashtagSuggestion[]> {
    const response = await api.get<
      ApiResponse<{hashtags: HashtagSuggestion[]}>
    >('/hashtags/search', {q: query, limit: 10});

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to search hashtags');
    }

    return response.data.data.hashtags;
  }

  async getTrendingHashtags(): Promise<string[]> {
    const response = await api.get<ApiResponse<{hashtags: string[]}>>(
      '/hashtags/trending',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch trending hashtags',
      );
    }

    return response.data.data.hashtags;
  }

  /**
   * Notification Management
   */
  async getNotifications(): Promise<SocialNotification[]> {
    const response = await api.get<
      ApiResponse<{notifications: SocialNotification[]}>
    >('/notifications');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch notifications',
      );
    }

    return response.data.data.notifications;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const response = await api.put<ApiResponse<{}>>(
      `/notifications/${notificationId}/read`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to mark notification as read',
      );
    }
  }

  async markAllNotificationsRead(): Promise<void> {
    const response = await api.put<ApiResponse<{}>>('/notifications/read-all');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to mark all notifications as read',
      );
    }
  }

  /**
   * Analytics
   */
  async getPostAnalytics(postId: string): Promise<{
    views: number;
    engagement: number;
    shares: number;
    reach: number;
  }> {
    const response = await api.get<ApiResponse<{analytics: any}>>(
      `/posts/${postId}/analytics`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to fetch post analytics',
      );
    }

    return response.data.data.analytics;
  }
}

export const socialAdvancedAPI = new SocialAdvancedAPIService();
