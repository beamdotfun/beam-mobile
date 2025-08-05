import {api} from '../api';
import {Vote, ReputationScore, VotingStats, VoteImpact} from '@/types/voting';

interface SubmitVoteParams {
  targetUser: string;
  value: number;
  postId?: string;
  commentId?: string;
  reason?: string;
}

interface VoteHistoryParams {
  targetUser?: string;
  limit?: number;
  offset?: number;
}

interface PreviewVoteParams {
  targetUser: string;
  value: number;
}

class VotingService {
  async submitVote(params: SubmitVoteParams) {
    const response = await api.post('/voting/vote', params);
    return response;
  }

  async undoVote(voteId: string) {
    const response = await api.delete(`/voting/vote/${voteId}`);
    return response;
  }

  async getUserReputation(userWallet?: string) {
    const endpoint = userWallet
      ? `/voting/reputation/${userWallet}`
      : '/voting/reputation/me';
    const response = await api.get(endpoint);
    return response;
  }

  async getVotingStats() {
    const response = await api.get('/voting/stats');
    return response;
  }

  async getVoteHistory(params?: VoteHistoryParams) {
    const response = await api.get('/voting/history', params);
    return response;
  }

  async previewVoteImpact(params: PreviewVoteParams) {
    const response = await api.post('/voting/preview', params);
    return response;
  }

  async getReputationLeaderboard(params?: {limit?: number; offset?: number}) {
    const response = await api.get('/voting/leaderboard', params);
    return response;
  }

  async getVotingConfig() {
    const response = await api.get('/voting/config');
    return response;
  }
}

export const votingService = new VotingService();
