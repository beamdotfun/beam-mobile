import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWalletStore } from '../store/wallet';
import { TransactionType, TransactionOptions } from '../services/transactions/builder';
import { TransactionFlow } from '../services/transactions/service';

export interface TransactionHookOptions extends TransactionOptions {
  useCustomRpc?: boolean;
  customRpcUrl?: string;
  trackInApi?: boolean;
}

export interface TransactionState {
  loading: boolean;
  error: string | null;
  signature: string | null;
  confirmationUrl: string | null;
}

export function useTransactions() {
  const { transactionService, connected } = useWalletStore();
  const [state, setState] = useState<TransactionState>({
    loading: false,
    error: null,
    signature: null,
    confirmationUrl: null,
  });

  const executeTransaction = useCallback(
    async (
      type: TransactionType,
      params: any,
      options: TransactionHookOptions = {}
    ): Promise<TransactionFlow> => {
      if (!connected) {
        throw new Error('Wallet not connected');
      }

      setState({ loading: true, error: null, signature: null, confirmationUrl: null });

      try {
        const result = await transactionService.executeTransaction(type, params, options);
        
        setState({
          loading: false,
          error: null,
          signature: result.signature,
          confirmationUrl: result.confirmationUrl || null,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
        setState({
          loading: false,
          error: errorMessage,
          signature: null,
          confirmationUrl: null,
        });
        throw error;
      }
    },
    [transactionService, connected]
  );

  const sendSol = useCallback(
    async (
      recipientAddress: string,
      amountSol: number,
      memo?: string,
      options: TransactionHookOptions = {}
    ): Promise<TransactionFlow> => {
      const recipientPubkey = new PublicKey(recipientAddress);
      return executeTransaction(
        'transfer_sol',
        {
          toPubkey: recipientPubkey,
          lamports: amountSol * 1_000_000_000,
        },
        { memo, ...options }
      );
    },
    [executeTransaction]
  );

  const sendTip = useCallback(
    async (
      recipientAddress: string,
      amountSol: number,
      message?: string,
      options: TransactionHookOptions = {}
    ): Promise<TransactionFlow> => {
      const recipientPubkey = new PublicKey(recipientAddress);
      return transactionService.sendTip(recipientPubkey, amountSol, message, options);
    },
    [transactionService]
  );

  const createPost = useCallback(
    async (
      postData: any,
      options: TransactionHookOptions = {}
    ): Promise<TransactionFlow> => {
      return executeTransaction('create_post', postData, options);
    },
    [executeTransaction]
  );

  const votePost = useCallback(
    async (
      postId: string,
      voteType: 'up' | 'down',
      options: TransactionHookOptions = {}
    ): Promise<TransactionFlow> => {
      return executeTransaction(
        'vote_post',
        { postId, voteType },
        options
      );
    },
    [executeTransaction]
  );

  const followUser = useCallback(
    async (
      userAddress: string,
      options: TransactionHookOptions = {}
    ): Promise<TransactionFlow> => {
      return executeTransaction(
        'follow_user',
        { userAddress },
        options
      );
    },
    [executeTransaction]
  );

  const estimateFee = useCallback(
    async (
      type: TransactionType,
      params: any,
      options: TransactionOptions = {}
    ): Promise<number> => {
      if (!connected) {
        throw new Error('Wallet not connected');
      }

      return transactionService.estimateFee(type, params, options);
    },
    [transactionService, connected]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      signature: null,
      confirmationUrl: null,
    });
  }, []);

  return {
    // State
    ...state,
    
    // Methods
    executeTransaction,
    sendSol,
    sendTip,
    createPost,
    votePost,
    followUser,
    estimateFee,
    
    // Utilities
    clearError,
    reset,
  };
}

// Hook for specific transaction types with better typing
export function useSolTransfer() {
  const { sendSol, loading, error, signature, confirmationUrl, clearError, reset } = useTransactions();
  
  return {
    sendSol,
    loading,
    error,
    signature,
    confirmationUrl,
    clearError,
    reset,
  };
}

export function useTipTransaction() {
  const { sendTip, loading, error, signature, confirmationUrl, clearError, reset } = useTransactions();
  
  return {
    sendTip,
    loading,
    error,
    signature,
    confirmationUrl,
    clearError,
    reset,
  };
}

export function useSocialTransactions() {
  const {
    createPost,
    votePost,
    followUser,
    loading,
    error,
    signature,
    confirmationUrl,
    clearError,
    reset,
  } = useTransactions();
  
  return {
    createPost,
    votePost,
    followUser,
    loading,
    error,
    signature,
    confirmationUrl,
    clearError,
    reset,
  };
}