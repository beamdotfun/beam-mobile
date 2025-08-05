import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { SolanaMobileWalletAdapter } from '../wallet/adapter';
import { API_CONFIG } from '../../config/api';

/**
 * Blockchain Transaction Service for Beam Social Platform
 * 
 * This service implements the complete transaction flow as described in:
 * - build-blockchain-transactions.md
 * - send-transactions-guide.md
 * 
 * Flow: Build Transaction (API) -> Sign (Wallet) -> Submit (API) -> Confirm
 */

export interface CreatePostTransactionParams {
  userWallet: string;
  message: string;
  profileOwner?: string;
  computeUnits?: number;
  priorityFee?: number;
}

export interface CreateUserTransactionParams {
  userWallet: string;
  computeUnits?: number;
  priorityFee?: number;
}

export interface CreateVoteTransactionParams {
  voterWallet: string;
  targetWallet: string;
  voteType: 'upvote' | 'downvote';
  computeUnits?: number;
  priorityFee?: number;
}

export interface CreateTipTransactionParams {
  senderWallet: string;                 // Sender's wallet address (base58)
  receiverWallet: string;               // Receiver's wallet address (base58)
  amount: number;                       // Amount in lamports (required)
  message?: string;                     // Optional tip message
  computeUnits?: number;                // Optional, defaults to 250,000
  priorityFee?: number;                 // Optional, micro-lamports per compute unit
}

export interface UpdateVerificationTransactionParams {
  callerWallet: string;               // Admin/authorized wallet address (base58)
  targetUser: string;                 // Target user's wallet address (base58)
  verificationType: 'nft' | 'sns' | 'both'; // Type of verification
  domainName?: string;                // Optional for SNS verification (required for "sns" or "both")
  computeUnits?: number;              // Optional, defaults to 250,000
  priorityFee?: number;               // Optional, micro-lamports per compute unit, defaults to 1
}

export interface TransactionResponse {
  signature: string;
  status: 'confirmed' | 'submitted' | 'failed';
  slot?: number;
  blockTime?: number;
  fee?: number;
  meta?: any;
  error?: string;
}

export interface BuildTransactionResponse {
  transaction: string;
  userProfile?: string;
  userTimeline?: string;
  userScore?: string;
  estimatedFee: number;
  instructions: Array<{
    type: string;
    programId: string;
    description?: string;
  }>;
}

export interface CreatePostResponse {
  userProfile: string;
  userTimeline: string;
  estimatedFee: number;
  transactions: Array<{
    transaction: string;
    type: 'create_user' | 'create_post';
    estimatedFee: number;
    description: string;
  }>;
}

export interface BuildTransactionMultiResponse {
  transactions: Array<{
    transaction: string;
    type: string;
    estimatedFee: number;
    description: string;
  }>;
}

export interface UpdateVerificationResponse {
  targetProfile: string;      // Target user profile PDA address
  estimatedFee: number;       // Estimated transaction fee in lamports
  transaction: string;        // Base64 encoded transaction
}

export class BlockchainTransactionService {
  private apiBaseUrl: string;
  private walletAdapter: SolanaMobileWalletAdapter;
  private getAuthToken?: () => string | null;

  constructor(walletAdapter: SolanaMobileWalletAdapter, apiBaseUrl: string = API_CONFIG.BASE_URL, getAuthToken?: () => string | null) {
    this.walletAdapter = walletAdapter;
    this.apiBaseUrl = apiBaseUrl;
    this.getAuthToken = getAuthToken;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.getAuthToken) {
      const token = this.getAuthToken();
      console.log('🔍 Auth token available:', !!token);
      console.log('🔍 Auth token length:', token?.length || 0);
      console.log('🔍 Auth token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      console.log('🔍 No getAuthToken function available');
    }
    
    console.log('🔍 Final headers:', Object.keys(headers));
    return headers;
  }

  /**
   * Creates a post on the blockchain using the complete transaction flow
   * Handles both new users (requires user creation first) and existing users
   */
  async createPost(params: CreatePostTransactionParams): Promise<TransactionResponse> {
    try {
      console.log('🔄 Starting create post transaction flow...');
      
      // Step 1: Build create-post transaction(s) via API
      const buildResponse = await this.buildCreatePostTransaction(params);
      
      // Step 2: Process all transactions in order (user creation + post creation if needed)
      const signatures: string[] = [];
      let totalFee = 0;

      for (const txInfo of buildResponse.transactions) {
        console.log(`🔄 Processing ${txInfo.type} transaction...`);
        
        // Deserialize transaction - handle both Legacy and Versioned transactions
        const transactionBuffer = Buffer.from(txInfo.transaction, 'base64');
        let transaction: Transaction | VersionedTransaction;
        
        try {
          // Try to deserialize as VersionedTransaction first (modern format)
          transaction = VersionedTransaction.deserialize(transactionBuffer);
          console.log('🔍 Deserialized as VersionedTransaction');
        } catch (error) {
          try {
            // Fall back to Legacy Transaction format
            transaction = Transaction.from(transactionBuffer);
            console.log('🔍 Deserialized as Legacy Transaction');
          } catch (legacyError) {
            console.error('❌ Failed to deserialize transaction as either format:', error, legacyError);
            throw new Error(`Failed to deserialize transaction: ${error.message}`);
          }
        }

        // Sign transaction with mobile wallet adapter
        console.log('🔍 About to sign transaction:', {
          type: transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'LegacyTransaction',
          serializedLength: transaction.serialize({ requireAllSignatures: false }).length
        });
        
        let signedTransaction;
        try {
          signedTransaction = await this.walletAdapter.signTransaction(transaction);
          console.log('✅ Transaction signed successfully');
        } catch (signingError) {
          console.error('❌ Transaction signing failed:', signingError);
          console.error('❌ Error details:', {
            message: signingError.message,
            stack: signingError.stack,
            name: signingError.name
          });
          throw signingError;
        }

        // Submit signed transaction to Beam API
        const result = await this.submitSignedTransaction(signedTransaction);
        
        signatures.push(result.signature);
        totalFee += result.fee || 0;
        
        console.log(`✅ ${txInfo.type} transaction confirmed: ${result.signature}`);
      }

      const finalSignature = signatures[signatures.length - 1]; // Use the last (post creation) signature
      
      console.log('✅ Create post transaction flow completed successfully!');
      console.log(`📝 Final signature: ${finalSignature}`);
      console.log(`💰 Total fee paid: ${totalFee} lamports`);
      
      return {
        signature: finalSignature,
        status: 'confirmed',
        fee: totalFee,
      };
      
    } catch (error) {
      console.error('❌ Create post transaction failed:', error);
      
      // Enhance error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient SOL balance for transaction fees');
        } else if (error.message.includes('Blockhash not found')) {
          throw new Error('Transaction expired. Please try again');
        } else if (error.message.includes('already exists')) {
          throw new Error('User profile already exists');
        } else if (error.message.includes('timeout')) {
          throw new Error('Transaction confirmation timeout. Please check your transaction manually');
        }
      }
      
      throw error;
    }
  }

  /**
   * Creates a user profile on the blockchain
   */
  async createUser(params: CreateUserTransactionParams): Promise<TransactionResponse> {
    try {
      console.log('🔄 Starting create user transaction flow...');
      
      // Step 1: Build create-user transaction via API
      const buildResponse = await this.buildCreateUserTransaction(params);
      
      // Step 2: Deserialize transaction - handle both Legacy and Versioned transactions
      const transactionBuffer = Buffer.from(buildResponse.transaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try to deserialize as VersionedTransaction first (modern format)
        transaction = VersionedTransaction.deserialize(transactionBuffer);
        console.log('🔍 Deserialized as VersionedTransaction');
      } catch (error) {
        try {
          // Fall back to Legacy Transaction format
          transaction = Transaction.from(transactionBuffer);
          console.log('🔍 Deserialized as Legacy Transaction');
        } catch (legacyError) {
          console.error('❌ Failed to deserialize transaction as either format:', error, legacyError);
          throw new Error(`Failed to deserialize transaction: ${error.message}`);
        }
      }

      // Step 3: Sign transaction with mobile wallet adapter
      const signedTransaction = await this.walletAdapter.signTransaction(transaction);

      // Step 4: Submit signed transaction to Beam API
      const result = await this.submitSignedTransaction(signedTransaction);
      
      console.log('✅ Create user transaction completed successfully!');
      console.log(`📝 Signature: ${result.signature}`);
      console.log(`👤 User Profile: ${buildResponse.userProfile}`);
      console.log(`📜 User Timeline: ${buildResponse.userTimeline}`);
      console.log(`🏆 User Score: ${buildResponse.userScore}`);
      console.log(`💰 Fee paid: ${result.fee} lamports`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Create user transaction failed:', error);
      throw error;
    }
  }

  /**
   * Creates a vote (upvote/downvote) on the blockchain
   */
  async createVote(params: CreateVoteTransactionParams): Promise<TransactionResponse> {
    try {
      console.log('🔄 Starting create vote transaction flow...');
      
      // Step 1: Build create-vote transaction via API
      const buildResponse = await this.buildCreateVoteTransaction(params);
      
      // Step 2: Process the vote transaction
      const txInfo = buildResponse.transactions[0];
      
      // Deserialize transaction - handle both Legacy and Versioned transactions
      const transactionBuffer = Buffer.from(txInfo.transaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try to deserialize as VersionedTransaction first (modern format)
        transaction = VersionedTransaction.deserialize(transactionBuffer);
        console.log('🔍 Deserialized as VersionedTransaction');
      } catch (error) {
        try {
          // Fall back to Legacy Transaction format
          transaction = Transaction.from(transactionBuffer);
          console.log('🔍 Deserialized as Legacy Transaction');
        } catch (legacyError) {
          console.error('❌ Failed to deserialize transaction as either format:', error, legacyError);
          throw new Error(`Failed to deserialize transaction: ${error.message}`);
        }
      }

      // Sign transaction with mobile wallet adapter
      console.log('🔍 About to sign vote transaction:', {
        type: transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'LegacyTransaction',
        serializedLength: transaction.serialize({ requireAllSignatures: false }).length,
        voteType: params.voteType
      });
      
      let signedTransaction;
      try {
        signedTransaction = await this.walletAdapter.signTransaction(transaction);
        console.log('✅ Vote transaction signed successfully');
      } catch (signingError) {
        console.error('❌ Vote transaction signing failed:', signingError);
        console.error('❌ Vote signing error details:', {
          message: signingError.message,
          stack: signingError.stack,
          name: signingError.name
        });
        throw signingError;
      }

      // Submit signed transaction to Beam API
      const result = await this.submitSignedTransaction(signedTransaction);
      
      console.log('✅ Create vote transaction completed successfully!');
      console.log(`📝 Signature: ${result.signature}`);
      console.log(`🗳️ Vote type: ${params.voteType}`);
      console.log(`👤 Voter: ${params.voterWallet}`);
      console.log(`🎯 Target: ${params.targetWallet}`);
      console.log(`💰 Fee paid: ${result.fee} lamports`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Create vote transaction failed:', error);
      
      // Enhance error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Vote transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient SOL balance for voting fees');
        } else if (error.message.includes('Blockhash not found')) {
          throw new Error('Vote transaction expired. Please try again');
        } else if (error.message.includes('timeout')) {
          throw new Error('Vote transaction confirmation timeout. Please check your transaction manually');
        } else if (error.message.includes('cannot vote for yourself')) {
          throw new Error('Cannot vote for yourself');
        } else if (error.message.includes('already voted')) {
          throw new Error('You have already voted for this user recently');
        }
      }
      
      throw error;
    }
  }

  /**
   * Estimates the fee for creating a post
   */
  async estimatePostFee(params: CreatePostTransactionParams): Promise<number> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/blockchain/transactions/build/create-post/estimate-fee?userWallet=${params.userWallet}&priorityFee=${params.priorityFee || 1}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to estimate fee: ${response.statusText}`);
      }

      const data = await response.json();
      return data.estimatedFee || 0.001; // Default 0.001 SOL if estimation fails
    } catch (error) {
      console.warn('Fee estimation failed, using default:', error);
      return 0.001; // Default estimate
    }
  }

  /**
   * Builds a create-post transaction via Beam API
   * Returns either 1 transaction (existing user) or 2 transactions (new user)
   */
  private async buildCreatePostTransaction(params: CreatePostTransactionParams): Promise<CreatePostResponse> {
    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/build/create-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: params.userWallet,
          message: params.message,
          profileOwner: params.profileOwner,
          computeUnits: params.computeUnits || 350000,
          priorityFee: params.priorityFee || 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || `Failed to build create-post transaction: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle new standardized response format
    if (result.success === false) {
      throw new Error(result.error || result.details || 'Failed to build create-post transaction');
    }
    
    // Extract data from the standardized format
    return result.data || result;
  }

  /**
   * Builds a create-user transaction via Beam API
   */
  private async buildCreateUserTransaction(params: CreateUserTransactionParams): Promise<BuildTransactionResponse> {
    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/build/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: params.userWallet,
          computeUnits: params.computeUnits || 400000,
          priorityFee: params.priorityFee || 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || `Failed to build create-user transaction: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle new standardized response format
    if (result.success === false) {
      throw new Error(result.error || result.details || 'Failed to build create-user transaction');
    }
    
    // Extract data from the standardized format
    return result.data || result;
  }

  /**
   * Builds a create-vote transaction via Beam API
   */
  private async buildCreateVoteTransaction(params: CreateVoteTransactionParams): Promise<CreatePostResponse> {
    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/build/create-vote`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterWallet: params.voterWallet,
          targetWallet: params.targetWallet,
          voteType: params.voteType,
          computeUnits: params.computeUnits || 300000,
          priorityFee: params.priorityFee || 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || `Failed to build create-vote transaction: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle new standardized response format
    if (result.success === false) {
      throw new Error(result.error || result.details || 'Failed to build create-vote transaction');
    }
    
    // Extract data from the standardized format
    return result.data || result;
  }

  /**
   * Submits a signed transaction to Beam API for execution
   */
  private async submitSignedTransaction(signedTransaction: Transaction | VersionedTransaction): Promise<TransactionResponse> {
    // Serialize the signed transaction
    const serializedTx = signedTransaction.serialize();
    const base64Transaction = Buffer.from(serializedTx).toString('base64');

    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: base64Transaction,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || `Failed to submit transaction: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle new standardized response format
    if (result.success === false) {
      throw new Error(result.error || result.details || 'Failed to submit transaction');
    }
    
    // Extract data from the standardized format
    const data = result.data || result;
    
    // If transaction was submitted but not confirmed, poll for status
    if (data.status === 'submitted' && data.signature) {
      return await this.pollTransactionStatus(data.signature);
    }

    return data;
  }

  /**
   * Polls transaction status until confirmed or timeout
   */
  private async pollTransactionStatus(signature: string, maxAttempts: number = 30): Promise<TransactionResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `${this.apiBaseUrl}/blockchain/transactions/${signature}/status`
        );
        
        if (response.ok) {
          const result = await response.json();
          
          // Handle new standardized response format
          if (result.success === false) {
            throw new Error(result.error || result.details || 'Transaction failed');
          }
          
          const data = result.data || result;
          
          if (data.status === 'confirmed' || data.status === 'finalized') {
            return data;
          } else if (data.status === 'failed') {
            throw new Error(data.error || 'Transaction failed on-chain');
          }
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn(`Polling attempt ${attempt + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Transaction confirmation timeout - please check manually');
  }

  /**
   * Creates a tip transaction on the blockchain
   */
  async createTip(params: CreateTipTransactionParams): Promise<TransactionResponse> {
    try {
      console.log('🔄 Starting create tip transaction flow...');
      console.log(`💰 Sending ${params.amount} lamports from ${params.senderWallet} to ${params.receiverWallet}`);
      
      // Step 1: Build create-tip transaction via API
      const buildResponse = await this.buildCreateTipTransaction(params);
      
      // Step 2: Process the tip transaction
      const txInfo = buildResponse.transactions[0];
      
      // Deserialize transaction - handle both Legacy and Versioned transactions
      const transactionBuffer = Buffer.from(txInfo.transaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try to deserialize as VersionedTransaction first (modern format)
        transaction = VersionedTransaction.deserialize(transactionBuffer);
        console.log('🔍 Deserialized as VersionedTransaction');
      } catch (error) {
        try {
          // Fall back to Legacy Transaction format
          transaction = Transaction.from(transactionBuffer);
          console.log('🔍 Deserialized as Legacy Transaction');
        } catch (legacyError) {
          console.error('❌ Failed to deserialize transaction as either format:', error, legacyError);
          throw new Error(`Failed to deserialize transaction: ${error.message}`);
        }
      }

      // Sign transaction with mobile wallet adapter
      console.log('🔍 About to sign tip transaction:', {
        type: transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'LegacyTransaction',
        serializedLength: transaction.serialize({ requireAllSignatures: false }).length,
        amount: params.amount
      });
      
      let signedTransaction;
      try {
        signedTransaction = await this.walletAdapter.signTransaction(transaction);
        console.log('✅ Tip transaction signed successfully');
      } catch (signingError) {
        console.error('❌ Tip transaction signing failed:', signingError);
        console.error('❌ Tip signing error details:', {
          message: signingError.message,
          stack: signingError.stack,
          name: signingError.name
        });
        throw signingError;
      }

      // Submit signed transaction to Beam API
      const result = await this.submitSignedTransaction(signedTransaction);
      
      console.log('✅ Create tip transaction completed successfully!');
      console.log(`📝 Signature: ${result.signature}`);
      console.log(`💰 Amount: ${params.amount} lamports`);
      console.log(`👥 From: ${params.senderWallet} to ${params.receiverWallet}`);
      if (params.message) {
        console.log(`💬 Message: ${params.message}`);
      }
      console.log(`💸 Fee paid: ${result.fee} lamports`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Create tip transaction failed:', error);
      
      // Enhance error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Tip transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient balance for tip amount and fees');
        } else if (error.message.includes('Blockhash not found')) {
          throw new Error('Tip transaction expired. Please try again');
        } else if (error.message.includes('timeout')) {
          throw new Error('Tip transaction confirmation timeout. Please check your transaction manually');
        } else if (error.message.includes('invalid token')) {
          throw new Error('Invalid token specified for tip');
        } else if (error.message.includes('amount too small')) {
          throw new Error('Tip amount too small. Please increase the amount');
        }
      }
      
      throw error;
    }
  }

  /**
   * Updates verification status on the blockchain
   */
  async updateVerification(params: UpdateVerificationTransactionParams): Promise<TransactionResponse> {
    try {
      console.log('🔄 Starting update verification transaction flow...');
      
      // Step 1: Build update-verification transaction via API
      const buildResponse = await this.buildUpdateVerificationTransaction(params);
      
      // Step 2: Process the verification transaction
      const transactionString = buildResponse.transaction;
      
      // Deserialize transaction - handle both Legacy and Versioned transactions
      const transactionBuffer = Buffer.from(transactionString, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try to deserialize as VersionedTransaction first (modern format)
        transaction = VersionedTransaction.deserialize(transactionBuffer);
        console.log('🔍 Deserialized as VersionedTransaction');
      } catch (error) {
        try {
          // Fall back to Legacy Transaction format
          transaction = Transaction.from(transactionBuffer);
          console.log('🔍 Deserialized as Legacy Transaction');
        } catch (legacyError) {
          console.error('❌ Failed to deserialize transaction as either format:', error, legacyError);
          throw new Error(`Failed to deserialize transaction: ${error.message}`);
        }
      }

      // Sign transaction with mobile wallet adapter
      console.log('🔍 About to sign verification transaction:', {
        type: transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'LegacyTransaction',
        serializedLength: transaction.serialize({ requireAllSignatures: false }).length,
        caller: params.callerWallet,
        target: params.targetUser,
        verificationType: params.verificationType
      });
      
      let signedTransaction;
      try {
        signedTransaction = await this.walletAdapter.signTransaction(transaction);
        console.log('✅ Verification transaction signed successfully');
      } catch (signingError) {
        console.error('❌ Verification transaction signing failed:', signingError);
        console.error('❌ Verification signing error details:', {
          message: signingError.message,
          stack: signingError.stack,
          name: signingError.name
        });
        throw signingError;
      }

      // Submit signed transaction to Beam API
      const result = await this.submitSignedTransaction(signedTransaction);
      
      console.log('✅ Update verification transaction completed successfully!');
      console.log(`📝 Signature: ${result.signature}`);
      console.log(`🔍 Caller: ${params.callerWallet}`);
      console.log(`🎯 Target: ${params.targetUser}`);
      console.log(`✅ Verification Type: ${params.verificationType}`);
      console.log(`💰 Fee paid: ${result.fee} lamports`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Update verification transaction failed:', error);
      
      // Enhance error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Verification transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient SOL balance for verification fees');
        } else if (error.message.includes('Blockhash not found')) {
          throw new Error('Verification transaction expired. Please try again');
        } else if (error.message.includes('timeout')) {
          throw new Error('Verification transaction confirmation timeout. Please check your transaction manually');
        } else if (error.message.includes('not authorized')) {
          throw new Error('You are not authorized to verify this user');
        } else if (error.message.includes('already verified')) {
          throw new Error('User is already verified');
        }
      }
      
      throw error;
    }
  }

  /**
   * Builds a create-tip transaction via the API
   * @private
   */
  private async buildCreateTipTransaction(params: CreateTipTransactionParams): Promise<BuildTransactionMultiResponse> {
    try {
      console.log('🔧 Building create-tip transaction...');
      
      const requestBody = {
        senderWallet: params.senderWallet,
        receiverWallet: params.receiverWallet,
        amount: params.amount,
        message: params.message,
        computeUnits: params.computeUnits || 250000,  // Default to 250,000 as per spec
        priorityFee: params.priorityFee || 1000
      };
      
      console.log('📤 Tip transaction request:', requestBody);
      
      const response = await fetch(`${this.apiBaseUrl}/blockchain/transactions/build/create-tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to build create-tip transaction: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Create-tip transaction built successfully');
      
      // Handle new standardized response format
      if (result.success === false) {
        throw new Error(result.error || result.details || 'Failed to build create-tip transaction');
      }
      
      // Extract data from the standardized format
      return result.data || result;
    } catch (error) {
      console.error('❌ Failed to build create-tip transaction:', error);
      throw error;
    }
  }

  /**
   * Builds an update-verification transaction via Beam API
   */
  private async buildUpdateVerificationTransaction(params: UpdateVerificationTransactionParams): Promise<UpdateVerificationResponse> {
    console.log('🔍 Building update-verification transaction with params:', params);
    console.log('🔍 Using API URL:', `${this.apiBaseUrl}/blockchain/transactions/build/update-verification`);
    
    const requestBody = {
      targetUser: params.targetUser,
      verificationType: params.verificationType,
      domainName: params.domainName,
      callerWallet: params.callerWallet,
      computeUnits: params.computeUnits || 250000,  // Default to 250,000 as per backend spec
      priorityFee: params.priorityFee || 1,         // Default to 1 micro-lamport as per backend spec
    };
    
    console.log('🔍 Update-verification request body:', requestBody);
    
    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/build/update-verification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('🔍 Update-verification response status:', response.status);
    console.log('🔍 Update-verification response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('🔍 Update-verification error data:', errorData);
      throw new Error(errorData.error || errorData.details || `Failed to build update-verification transaction: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle new standardized response format
    if (result.success === false) {
      throw new Error(result.error || result.details || 'Failed to build update-verification transaction');
    }
    
    // Extract data from the standardized format
    return result.data || result;
  }

  /**
   * Checks if a user profile exists on-chain
   */
  async checkUserExists(userWallet: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/blockchain/transactions/build/create-user/accounts?userWallet=${userWallet}`
      );
      
      if (response.ok) {
        // If we can get account info, user likely exists
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking user existence:', error);
      return false; // Assume user doesn't exist on error
    }
  }

  /**
   * Updates the API base URL
   */
  updateApiBaseUrl(newUrl: string): void {
    this.apiBaseUrl = newUrl;
  }

  /**
   * Gets the current API base URL
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }
}

/**
 * Factory function to create a blockchain transaction service
 */
export function createBlockchainTransactionService(
  walletAdapter: SolanaMobileWalletAdapter,
  apiBaseUrl?: string,
  getAuthToken?: () => string | null
): BlockchainTransactionService {
  return new BlockchainTransactionService(walletAdapter, apiBaseUrl, getAuthToken);
}