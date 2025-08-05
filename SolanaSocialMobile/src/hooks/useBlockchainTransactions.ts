import { useState, useCallback } from 'react';
import { useWalletStore } from '../store/wallet';
import { 
  CreatePostTransactionParams, 
  CreateUserTransactionParams, 
  CreateVoteTransactionParams,
  CreateTipTransactionParams,
  UpdateVerificationTransactionParams,
  TransactionResponse 
} from '../services/blockchain/transactionService';

/**
 * Hook for easy blockchain transaction management
 * Provides convenient methods for common blockchain operations
 */
export function useBlockchainTransactions() {
  const { blockchainService, connected, publicKey } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when starting new operations
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Generic transaction executor with loading and error handling
  const executeTransaction = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Starting ${operationName}...`);
      const result = await operation();
      console.log(`✅ ${operationName} completed successfully`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      console.error(`❌ ${operationName} failed:`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  // Create a post on the blockchain
  const createPost = useCallback(async (
    message: string,
    options: Partial<CreatePostTransactionParams> = {}
  ): Promise<TransactionResponse> => {
    return executeTransaction(async () => {
      if (!publicKey) throw new Error('Wallet not connected');
      
      return await blockchainService.createPost({
        userWallet: publicKey.toString(),
        message,
        ...options,
      });
    }, 'create post transaction');
  }, [blockchainService, publicKey, executeTransaction]);

  // Create a user profile on the blockchain
  const createUser = useCallback(async (
    options: Partial<CreateUserTransactionParams> = {}
  ): Promise<TransactionResponse> => {
    return executeTransaction(async () => {
      if (!publicKey) throw new Error('Wallet not connected');
      
      return await blockchainService.createUser({
        userWallet: publicKey.toString(),
        ...options,
      });
    }, 'create user transaction');
  }, [blockchainService, publicKey, executeTransaction]);

  // Create a vote (upvote/downvote) on the blockchain
  const createVote = useCallback(async (
    targetWallet: string,
    voteType: 'upvote' | 'downvote',
    options: Partial<CreateVoteTransactionParams> = {}
  ): Promise<TransactionResponse> => {
    return executeTransaction(async () => {
      if (!publicKey) throw new Error('Wallet not connected');
      
      return await blockchainService.createVote({
        voterWallet: publicKey.toString(),
        targetWallet,
        voteType,
        ...options,
      });
    }, `create ${voteType} transaction`);
  }, [blockchainService, publicKey, executeTransaction]);

  // Estimate fee for a post transaction
  const estimatePostFee = useCallback(async (
    message: string,
    options: Partial<CreatePostTransactionParams> = {}
  ): Promise<number> => {
    if (!connected || !publicKey) {
      return 0.001; // Default estimate
    }

    try {
      return await blockchainService.estimatePostFee({
        userWallet: publicKey.toString(),
        message,
        ...options,
      });
    } catch (err) {
      console.warn('Fee estimation failed:', err);
      return 0.001; // Default estimate
    }
  }, [blockchainService, connected, publicKey]);

  // Check if user profile exists on blockchain
  const checkUserExists = useCallback(async (
    userWallet?: string
  ): Promise<boolean> => {
    const walletToCheck = userWallet || publicKey?.toString();
    
    if (!walletToCheck) {
      return false;
    }

    try {
      return await blockchainService.checkUserExists(walletToCheck);
    } catch (err) {
      console.warn('Error checking user existence:', err);
      return false;
    }
  }, [blockchainService, publicKey]);

  // Convenience method for upvoting
  const upvote = useCallback(async (targetWallet: string): Promise<TransactionResponse> => {
    return createVote(targetWallet, 'upvote');
  }, [createVote]);

  // Convenience method for downvoting
  const downvote = useCallback(async (targetWallet: string): Promise<TransactionResponse> => {
    return createVote(targetWallet, 'downvote');
  }, [createVote]);

  // Tip transaction method
  const createTip = useCallback(async (params: CreateTipTransactionParams): Promise<TransactionResponse> => {
    return executeTransaction(
      () => blockchainService.createTip(params),
      'create tip'
    );
  }, [executeTransaction, blockchainService]);

  // Update verification transaction method
  const updateVerification = useCallback(async (params: UpdateVerificationTransactionParams): Promise<TransactionResponse> => {
    return executeTransaction(
      () => blockchainService.updateVerification(params),
      'update verification'
    );
  }, [executeTransaction, blockchainService]);

  return {
    // Transaction methods
    createPost,
    createUser,
    createVote,
    createTip,
    updateVerification,
    upvote,
    downvote,

    // Utility methods
    estimatePostFee,
    checkUserExists,
    resetError,

    // State
    loading,
    error,
    connected,
    publicKey: publicKey?.toString() || null,

    // Service access for advanced usage
    blockchainService,
  };
}

/**
 * Hook specifically for post creation with additional UI helpers
 */
export function useCreatePost() {
  const {
    createPost,
    estimatePostFee,
    loading,
    error,
    connected,
    resetError,
  } = useBlockchainTransactions();

  const [fee, setFee] = useState<number | null>(null);

  // Estimate fee for a message
  const estimateFee = useCallback(async (message: string) => {
    try {
      const estimatedFee = await estimatePostFee(message);
      setFee(estimatedFee);
      return estimatedFee;
    } catch (err) {
      console.warn('Fee estimation failed:', err);
      setFee(0.001);
      return 0.001;
    }
  }, [estimatePostFee]);

  // Create post with automatic fee estimation
  const createPostWithFee = useCallback(async (message: string) => {
    resetError();
    
    // Estimate fee first
    const estimatedFee = await estimateFee(message);
    
    // Create the post
    const result = await createPost(message);
    
    return {
      ...result,
      estimatedFee,
    };
  }, [createPost, estimateFee, resetError]);

  return {
    createPost: createPostWithFee,
    estimateFee,
    loading,
    error,
    connected,
    fee,
    resetError,
  };
}

/**
 * Hook for voting operations with post count validation
 */
export function useVoting() {
  const {
    upvote,
    downvote,
    createVote,
    loading,
    error,
    connected,
    resetError,
    publicKey,
  } = useBlockchainTransactions();

  const [userPostCount, setUserPostCount] = useState<number | null>(null);
  const [checkingPostCount, setCheckingPostCount] = useState(false);

  // Check user post count when wallet connects
  const checkPostCount = useCallback(async () => {
    if (!publicKey) {
      setUserPostCount(null);
      return;
    }

    setCheckingPostCount(true);
    try {
      // Use the social API to check post count
      const { socialAPI } = await import('../services/api/social');
      const posts = await socialAPI.getUserPosts(publicKey, 1, 0);
      const count = posts?.posts?.length || 0;
      setUserPostCount(count);
      return count;
    } catch (error) {
      console.warn('Failed to check post count:', error);
      setUserPostCount(1); // Default to allow voting if check fails
      return 1;
    } finally {
      setCheckingPostCount(false);
    }
  }, [publicKey]);

  // Enhanced vote functions that check post count
  const voteWithPostCheck = useCallback(async (
    targetWallet: string, 
    voteType: 'upvote' | 'downvote'
  ) => {
    resetError();

    // Check post count first
    const postCount = userPostCount ?? await checkPostCount();
    
    if (postCount === 0) {
      throw new Error('You must create at least one post before you can vote on other users');
    }

    return createVote(targetWallet, voteType);
  }, [createVote, userPostCount, checkPostCount, resetError]);

  const upvoteWithCheck = useCallback(async (targetWallet: string) => {
    return voteWithPostCheck(targetWallet, 'upvote');
  }, [voteWithPostCheck]);

  const downvoteWithCheck = useCallback(async (targetWallet: string) => {
    return voteWithPostCheck(targetWallet, 'downvote');
  }, [voteWithPostCheck]);

  return {
    // Enhanced voting functions
    upvote: upvoteWithCheck,
    downvote: downvoteWithCheck,
    createVote: voteWithPostCheck,
    
    // Post count info
    userPostCount,
    checkingPostCount,
    checkPostCount,
    
    // Original functions (without post check)
    upvoteOriginal: upvote,
    downvoteOriginal: downvote,
    createVoteOriginal: createVote,
    
    // State
    loading,
    error,
    connected,
    resetError,
  };
}

/**
 * Tipping hook for sending tips with proper validation
 */
export function useTipping() {
  const { createTip, loading, error, connected, resetError } = useBlockchainTransactions();
  const { publicKey } = useWalletStore();

  const sendTip = useCallback(async (
    receiverWallet: string,
    amount: number, // Amount in lamports
    message?: string
  ) => {
    resetError();

    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    if (amount <= 0) {
      throw new Error('Tip amount must be greater than 0');
    }

    return createTip({
      senderWallet: publicKey.toString(),
      receiverWallet,
      amount,
      message,
    });
  }, [createTip, connected, publicKey, resetError]);

  return {
    sendTip,
    loading,
    error,
    connected,
    resetError,
  };
}