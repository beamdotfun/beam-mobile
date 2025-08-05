import apiClient from './client';
import { ReputationResponse, ReputationData } from './types';

/**
 * Reputation API service for fetching user reputation data
 * Based on the /user/reputation endpoint documentation
 */
class ReputationAPI {
  /**
   * Get reputation data for a specific wallet address
   * @param walletAddress - The wallet address to get reputation for
   * @returns Promise with reputation data
   */
  async getUserReputation(walletAddress: string): Promise<ReputationData> {
    try {
      console.log('🔍 ReputationAPI: Fetching reputation for wallet:', walletAddress);
      
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      // Validate wallet address format (basic Solana address validation)
      if (walletAddress.length < 32 || walletAddress.length > 44) {
        throw new Error('Invalid wallet address format');
      }

      const response = await apiClient.get<ReputationResponse>('/user/reputation', {
        address: walletAddress,
      });

      console.log('🔍 ReputationAPI: Response received:', {
        ok: response.ok,
        status: response.status,
        problem: response.problem,
        data: response.data,
      });

      if (!response.ok) {
        throw new Error(response.problem || 'Failed to fetch reputation data');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch reputation data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('🚨 ReputationAPI: Error fetching reputation:', error);
      
      // Handle different error types from apisauce
      if (error.status === 400) {
        throw new Error('Invalid wallet address provided');
      } else if (error.status === 404) {
        // Return default newcomer data for users not found
        console.log('🔍 ReputationAPI: User not found, returning default data');
        return {
          walletAddress,
          totalScore: 0,
          upvotesReceived: 0,
          downvotesReceived: 0,
          scoreThisEpoch: 0,
          lastEpochUpdated: 0,
          reputationLevel: 'newcomer',
          voteRatio: 0.0,
          lastUpdated: null,
        };
      } else if (error.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        // For network errors or other issues, check if it's a response object or regular error
        if (error.problem) {
          throw new Error(`Network error: ${error.problem}`);
        } else {
          throw new Error(error.message || 'Failed to fetch reputation data');
        }
      }
    }
  }

  /**
   * Get reputation level description
   * @param level - The reputation level
   * @returns Description of the reputation level
   */
  getReputationLevelDescription(level: ReputationData['reputationLevel']): string {
    const descriptions = {
      newcomer: 'New users with minimal activity',
      rising: 'Users building reputation',
      established: 'Trusted community members',
      expert: 'Highly respected users',
      legendary: 'Top-tier community leaders',
    };
    return descriptions[level];
  }

  /**
   * Get reputation level score range
   * @param level - The reputation level
   * @returns Score range for the level
   */
  getReputationLevelRange(level: ReputationData['reputationLevel']): { min: number; max: number | null } {
    const ranges = {
      newcomer: { min: 0, max: 100 },
      rising: { min: 101, max: 500 },
      established: { min: 501, max: 1000 },
      expert: { min: 1001, max: 5000 },
      legendary: { min: 5000, max: null },
    };
    return ranges[level];
  }

  /**
   * Calculate vote ratio percentage
   * @param upvotes - Number of upvotes
   * @param downvotes - Number of downvotes
   * @returns Vote ratio as percentage (0-100)
   */
  calculateVoteRatioPercentage(upvotes: number, downvotes: number): number {
    const total = upvotes + downvotes;
    if (total === 0) return 0;
    return Math.round((upvotes / total) * 100);
  }
}

// Export singleton instance
export const reputationAPI = new ReputationAPI();