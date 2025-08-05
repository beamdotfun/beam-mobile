import { Transaction, PublicKey } from '@solana/web3.js';
import { SolanaTransactionBuilder, TransactionType, TransactionOptions } from './builder';
import { SolanaMobileWalletAdapter } from '../wallet/adapter';
import { transactionService as apiService } from '../api/transactions';
import { TransactionRequest, TransactionStatus } from '../../types/transactions';
import { API_CONFIG } from '../../config/api';

export interface TransactionServiceConfig {
  beamRpcUrl?: string;
  customRpcUrl?: string;
  defaultPriorityFee?: number;
  defaultComputeUnits?: number;
}

export interface TransactionFlow {
  signature: string;
  status: TransactionStatus;
  confirmationUrl?: string;
}

export class TransactionService {
  private builder: SolanaTransactionBuilder;
  private walletAdapter: SolanaMobileWalletAdapter;
  private config: TransactionServiceConfig;

  constructor(
    walletAdapter: SolanaMobileWalletAdapter,
    config: TransactionServiceConfig = {}
  ) {
    this.walletAdapter = walletAdapter;
    this.config = config;
    this.builder = new SolanaTransactionBuilder({
      beamRpcUrl: config.beamRpcUrl || API_CONFIG.BASE_URL,
      customRpcUrl: config.customRpcUrl,
      priorityFee: config.defaultPriorityFee || 5000,
      computeUnits: config.defaultComputeUnits || 200000,
    });
  }

  /**
   * Executes the complete transaction flow for Beam backend
   * Flow: Build -> Sign -> Send to Beam -> Confirm via Beam API
   */
  async executeBeamTransaction(
    type: TransactionType,
    params: any,
    options: TransactionOptions & { trackInApi?: boolean } = {}
  ): Promise<TransactionFlow> {
    try {
      // Ensure wallet is connected
      if (!this.walletAdapter.connected) {
        throw new Error('Wallet not connected');
      }

      const userPubkey = this.walletAdapter.publicKey;
      if (!userPubkey) {
        throw new Error('No wallet public key available');
      }

      // Build transaction
      let transaction: Transaction;
      
      switch (type) {
        case 'transfer_sol':
          transaction = await this.builder.buildTransferSol(
            { ...params, fromPubkey: userPubkey },
            options
          );
          break;
        case 'transfer_token':
          transaction = await this.builder.buildTransferToken(
            { ...params, fromPubkey: userPubkey },
            options
          );
          break;
        case 'create_post':
        case 'vote_post':
        case 'tip_user':
        case 'follow_user':
          transaction = await this.builder.buildSocialAction(
            { ...params, userPubkey },
            options
          );
          break;
        default:
          throw new Error(`Unsupported transaction type: ${type}`);
      }

      // Sign transaction using mobile wallet adapter
      console.log('🔍 About to sign Beam transaction:', {
        type: 'LegacyTransaction', // This service uses Legacy Transaction format
        transactionType: type,
        serializedLength: transaction.serialize({ requireAllSignatures: false }).length
      });
      
      let signedTransaction;
      try {
        signedTransaction = await this.walletAdapter.signTransaction(transaction);
        console.log('✅ Beam transaction signed successfully');
      } catch (signingError) {
        console.error('❌ Beam transaction signing failed:', signingError);
        console.error('❌ Beam signing error details:', {
          message: signingError.message,
          stack: signingError.stack,
          name: signingError.name,
          transactionType: type
        });
        throw signingError;
      }

      // Send through Beam backend
      const signature = await this.builder.sendSignedTransaction(signedTransaction, true);

      // Track in API if requested
      if (options.trackInApi !== false) {
        await this.trackTransactionInAPI(signature, type, params);
      }

      // Wait for confirmation through Beam API
      const confirmed = await this.builder.confirmTransaction(signature, true);

      return {
        signature,
        status: confirmed ? 'confirmed' : 'failed',
        confirmationUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      };
    } catch (error) {
      console.error('Beam transaction failed:', error);
      
      // Enhance error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient SOL balance for transaction fees');
        } else if (error.message.includes('Blockhash not found')) {
          throw new Error('Transaction expired. Please try again');
        } else if (error.message.includes('timeout')) {
          throw new Error('Transaction confirmation timeout. Please check your transaction manually');
        }
      }
      
      throw error;
    }
  }

  /**
   * Executes transaction flow for custom RPC
   * Flow: Build -> Sign -> Send to RPC -> Confirm via RPC
   */
  async executeCustomRpcTransaction(
    type: TransactionType,
    params: any,
    customRpcUrl: string,
    options: TransactionOptions & { trackInApi?: boolean } = {}
  ): Promise<TransactionFlow> {
    try {
      // Ensure wallet is connected
      if (!this.walletAdapter.connected) {
        throw new Error('Wallet not connected');
      }

      const userPubkey = this.walletAdapter.publicKey;
      if (!userPubkey) {
        throw new Error('No wallet public key available');
      }

      // Create builder with custom RPC
      const customBuilder = new SolanaTransactionBuilder({
        customRpcUrl,
        priorityFee: this.config.defaultPriorityFee,
        computeUnits: this.config.defaultComputeUnits,
      });

      // Build transaction
      let transaction: Transaction;
      
      switch (type) {
        case 'transfer_sol':
          transaction = await customBuilder.buildTransferSol(
            { ...params, fromPubkey: userPubkey },
            options
          );
          break;
        case 'transfer_token':
          transaction = await customBuilder.buildTransferToken(
            { ...params, fromPubkey: userPubkey },
            options
          );
          break;
        case 'create_post':
        case 'vote_post':
        case 'tip_user':
        case 'follow_user':
          transaction = await customBuilder.buildSocialAction(
            { ...params, userPubkey },
            options
          );
          break;
        default:
          throw new Error(`Unsupported transaction type: ${type}`);
      }

      // Sign transaction using mobile wallet adapter
      console.log('🔍 About to sign custom RPC transaction:', {
        type: 'LegacyTransaction', // This service uses Legacy Transaction format
        transactionType: type,
        serializedLength: transaction.serialize({ requireAllSignatures: false }).length,
        customRpcUrl
      });
      
      let signedTransaction;
      try {
        signedTransaction = await this.walletAdapter.signTransaction(transaction);
        console.log('✅ Custom RPC transaction signed successfully');
      } catch (signingError) {
        console.error('❌ Custom RPC transaction signing failed:', signingError);
        console.error('❌ Custom RPC signing error details:', {
          message: signingError.message,
          stack: signingError.stack,
          name: signingError.name,
          transactionType: type,
          customRpcUrl
        });
        throw signingError;
      }

      // Send directly to custom RPC
      const signature = await customBuilder.sendSignedTransaction(signedTransaction, false);

      // Track in API if requested
      if (options.trackInApi !== false) {
        await this.trackTransactionInAPI(signature, type, params);
      }

      // Wait for confirmation through RPC
      const confirmed = await customBuilder.confirmTransaction(signature, false);

      return {
        signature,
        status: confirmed ? 'confirmed' : 'failed',
        confirmationUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      };
    } catch (error) {
      console.error('Custom RPC transaction failed:', error);
      
      // Enhance error messages for better user experience  
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient SOL balance for transaction fees');
        } else if (error.message.includes('Blockhash not found')) {
          throw new Error('Transaction expired. Please try again');
        } else if (error.message.includes('timeout')) {
          throw new Error('Transaction confirmation timeout. Please check your transaction manually');
        } else if (error.message.includes('connection')) {
          throw new Error('Failed to connect to custom RPC endpoint');
        }
      }
      
      throw error;
    }
  }

  /**
   * Convenience method that automatically chooses between Beam and custom RPC
   */
  async executeTransaction(
    type: TransactionType,
    params: any,
    options: TransactionOptions & { 
      useCustomRpc?: boolean;
      customRpcUrl?: string;
      trackInApi?: boolean;
    } = {}
  ): Promise<TransactionFlow> {
    if (options.useCustomRpc && options.customRpcUrl) {
      return this.executeCustomRpcTransaction(type, params, options.customRpcUrl, options);
    } else {
      return this.executeBeamTransaction(type, params, options);
    }
  }

  /**
   * Tracks transaction in Beam API for analytics and history
   */
  private async trackTransactionInAPI(
    signature: string,
    type: TransactionType,
    params: any
  ): Promise<void> {
    try {
      const transactionRequest: TransactionRequest = {
        signature,
        type: type as any, // Type conversion needed
        amount: params.lamports || params.amount || 0,
        recipientAddress: params.toPubkey?.toString() || params.recipientAddress || '',
        description: params.memo || `${type} transaction`,
        metadata: {
          params,
          timestamp: new Date().toISOString(),
        },
      };

      await apiService.createTransaction(transactionRequest);
    } catch (error) {
      console.warn('Failed to track transaction in API:', error);
      // Don't throw - API tracking is optional
    }
  }

  /**
   * Estimates transaction fee
   */
  async estimateFee(
    type: TransactionType,
    params: any,
    options: TransactionOptions = {}
  ): Promise<number> {
    const userPubkey = this.walletAdapter.publicKey;
    if (!userPubkey) {
      throw new Error('No wallet public key available');
    }

    let transaction: Transaction;
    
    switch (type) {
      case 'transfer_sol':
        transaction = await this.builder.buildTransferSol(
          { ...params, fromPubkey: userPubkey },
          options
        );
        break;
      case 'transfer_token':
        transaction = await this.builder.buildTransferToken(
          { ...params, fromPubkey: userPubkey },
          options
        );
        break;
      case 'create_post':
      case 'vote_post':
      case 'tip_user':
      case 'follow_user':
        transaction = await this.builder.buildSocialAction(
          { ...params, userPubkey },
          options
        );
        break;
      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }

    return this.builder.estimateFee(transaction);
  }

  /**
   * Creates a tip transaction (common social feature)
   */
  async sendTip(
    recipientPubkey: PublicKey,
    amountSol: number,
    message?: string,
    options: { useCustomRpc?: boolean; customRpcUrl?: string } = {}
  ): Promise<TransactionFlow> {
    return this.executeTransaction(
      'tip_user',
      {
        toPubkey: recipientPubkey,
        lamports: amountSol * 1_000_000_000, // Convert SOL to lamports
      },
      {
        memo: message ? `Tip: ${message}` : 'Tip from Beam',
        ...options,
      }
    );
  }

  /**
   * Sends SOL transfer
   */
  async sendSol(
    recipientPubkey: PublicKey,
    amountSol: number,
    memo?: string,
    options: { useCustomRpc?: boolean; customRpcUrl?: string } = {}
  ): Promise<TransactionFlow> {
    return this.executeTransaction(
      'transfer_sol',
      {
        toPubkey: recipientPubkey,
        lamports: amountSol * 1_000_000_000,
      },
      {
        memo,
        ...options,
      }
    );
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<TransactionServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update builder configuration
    this.builder = new SolanaTransactionBuilder({
      beamRpcUrl: this.config.beamRpcUrl,
      customRpcUrl: this.config.customRpcUrl,
      priorityFee: this.config.defaultPriorityFee,
      computeUnits: this.config.defaultComputeUnits,
    });
  }

  /**
   * Gets current configuration
   */
  getConfig(): TransactionServiceConfig {
    return { ...this.config };
  }
}

// Default factory function
export function createTransactionService(
  walletAdapter: SolanaMobileWalletAdapter,
  config: TransactionServiceConfig = {}
): TransactionService {
  return new TransactionService(walletAdapter, config);
}