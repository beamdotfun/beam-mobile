import { Transaction } from '@solana/web3.js';
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
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
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
        
        // Deserialize transaction from base64
        const transactionBuffer = Buffer.from(txInfo.transaction, 'base64');
        const transaction = Transaction.from(transactionBuffer);
        
        console.log('📄 Deserialized transaction details:');
        console.log('   - Instructions:', transaction.instructions.length);
        console.log('   - Recent blockhash:', transaction.recentBlockhash);
        console.log('   - Fee payer:', transaction.feePayer?.toString());
        
        // IMPORTANT: The transaction is already prepared, just sign it
        const signedTransaction = await this.walletAdapter.signTransaction(transaction);
        console.log('✅ Got signed transaction back from wallet');
        console.log('   - Signatures:', signedTransaction.signatures.length);
        console.log('   - First signature valid:', signedTransaction.signatures[0] !== null);
        
        // Submit signed transaction to Beam API
        console.log('📤 About to submit to backend...');
        const result = await this.submitSignedTransaction(signedTransaction);
        console.log('✅ Backend submission complete');
        
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
      
      // Step 2: Deserialize transaction from base64
      const transactionBuffer = Buffer.from(buildResponse.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      console.log('📄 Deserialized user creation transaction details:');
      console.log('   - Instructions:', transaction.instructions.length);
      console.log('   - Recent blockhash:', transaction.recentBlockhash);
      console.log('   - Fee payer:', transaction.feePayer?.toString());

      // Step 3: Sign transaction with mobile wallet adapter
      const signedTransaction = await this.walletAdapter.signTransaction(transaction);
      console.log('✅ Got signed transaction back from wallet');
      console.log('   - Signatures:', signedTransaction.signatures.length);
      console.log('   - First signature valid:', signedTransaction.signatures[0] !== null);

      // Step 4: Submit signed transaction to Beam API
      console.log('📤 Submitting user creation transaction to backend...');
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
      console.log(`🔄 Processing ${txInfo.type} transaction...`);
      
      // Deserialize transaction from base64
      const transactionBuffer = Buffer.from(txInfo.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      console.log('📄 Deserialized vote transaction details:');
      console.log('   - Instructions:', transaction.instructions.length);
      console.log('   - Recent blockhash:', transaction.recentBlockhash);
      console.log('   - Fee payer:', transaction.feePayer?.toString());

      // Sign transaction with mobile wallet adapter
      const signedTransaction = await this.walletAdapter.signTransaction(transaction);
      console.log('✅ Got signed transaction back from wallet');
      console.log('   - Signatures:', signedTransaction.signatures.length);
      console.log('   - First signature valid:', signedTransaction.signatures[0] !== null);

      // Submit signed transaction to Beam API
      console.log('📤 Submitting vote transaction to backend...');
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
        headers: this.getAuthHeaders(),
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
        headers: this.getAuthHeaders(),
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
        headers: this.getAuthHeaders(),
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
  private async submitSignedTransaction(signedTransaction: Transaction): Promise<TransactionResponse> {
    console.log('🔍 submitSignedTransaction called');
    
    // Try to serialize - if it fails due to signature format, try fixing it
    let base64Transaction;
    try {
      console.log('🔍 Attempting to serialize...');
      const serialized = signedTransaction.serialize();
      base64Transaction = Buffer.from(serialized).toString('base64');
      console.log('✅ Serialization successful');
    } catch (error) {
      console.log('❌ Initial serialization failed:', error.message);
      // If serialize fails, the signature might be in wrong format
      // Try to fix it by converting object signatures to Buffer
      if (signedTransaction.signatures && signedTransaction.signatures.length > 0) {
        console.log('🔍 Signature details:', {
          count: signedTransaction.signatures.length,
          firstSig: signedTransaction.signatures[0],
          firstSigType: typeof signedTransaction.signatures[0],
          isNull: signedTransaction.signatures[0] === null,
          isObject: typeof signedTransaction.signatures[0] === 'object',
          keys: signedTransaction.signatures[0] ? Object.keys(signedTransaction.signatures[0]) : 'null'
        });
        signedTransaction.signatures = signedTransaction.signatures.map((sig: any) => {
          if (sig && typeof sig === 'object' && sig.signature !== undefined) {
            // signature might be null, string, or buffer
            if (sig.signature === null) {
              return null;
            } else if (typeof sig.signature === 'string') {
              return Buffer.from(sig.signature, 'base64');
            } else if (sig.signature instanceof Uint8Array) {
              return Buffer.from(sig.signature);
            } else if (Buffer.isBuffer(sig.signature)) {
              return sig.signature;
            }
          }
          return sig;
        });
      }
      // Try again
      console.log('🔍 Retrying serialization after fixing signatures...');
      const serialized = signedTransaction.serialize();
      base64Transaction = Buffer.from(serialized).toString('base64');
      console.log('✅ Serialization successful after fix');
    }
    
    console.log('🔍 Sending to backend:', `${this.apiBaseUrl}/blockchain/transactions/submit`);
    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/submit`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          transaction: base64Transaction,
        }),
      }
    );

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Polls transaction status until confirmed or timeout
   */
  private async pollTransactionStatus(signature: string, maxAttempts: number = 30): Promise<TransactionResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `${this.apiBaseUrl}/blockchain/transactions/${signature}/status`,
          {
            headers: this.getAuthHeaders(),
          }
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
      // Handle both single transaction and array format for compatibility
      const txInfo = buildResponse.transactions ? buildResponse.transactions[0] : buildResponse;
      
      if (!txInfo || !txInfo.transaction) {
        throw new Error('Invalid transaction response from API');
      }
      
      console.log(`🔄 Processing ${txInfo.type || 'tip'} transaction...`);
      
      // Deserialize transaction from base64
      const transactionBuffer = Buffer.from(txInfo.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      console.log('📄 Deserialized tip transaction details:');
      console.log('   - Instructions:', transaction.instructions.length);
      console.log('   - Recent blockhash:', transaction.recentBlockhash);
      console.log('   - Fee payer:', transaction.feePayer?.toString());

      // Sign transaction with mobile wallet adapter
      const signedTransaction = await this.walletAdapter.signTransaction(transaction);
      console.log('✅ Got signed transaction back from wallet');
      console.log('   - Signatures:', signedTransaction.signatures.length);
      console.log('   - First signature valid:', signedTransaction.signatures[0] !== null);

      // Submit signed transaction to Beam API
      console.log('📤 Submitting tip transaction to backend...');
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
      
      // Deserialize transaction from base64
      const transactionBuffer = Buffer.from(transactionString, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // Sign transaction with mobile wallet adapter
      const signedTransaction = await this.walletAdapter.signTransaction(transaction);

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
    console.log('📡 Building create-tip transaction with API...');
    const requestBody = {
      senderWallet: params.senderWallet,
      receiverWallet: params.receiverWallet,
      amount: params.amount,
      message: params.message,
      computeUnits: params.computeUnits || 250000,
      priorityFee: params.priorityFee || 1000
    };
    
    console.log('📝 Request body:', requestBody);
    console.log('🌐 API URL:', `${this.apiBaseUrl}/blockchain/transactions/build/create-tip`);
    
    const headers = this.getAuthHeaders();
    console.log('🔑 Auth headers:', {
      hasAuth: !!headers['Authorization'],
      contentType: headers['Content-Type']
    });
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/blockchain/transactions/build/create-tip`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error response:', errorData);
        throw new Error(errorData.error || errorData.details || `Failed to build create-tip transaction: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ API Response received:', {
        success: result.success,
        hasData: !!result.data,
        hasTransactions: !!(result.data?.transactions || result.transactions),
        transactionCount: (result.data?.transactions || result.transactions)?.length,
        dataKeys: result.data ? Object.keys(result.data) : [],
        hasTransaction: !!(result.data?.transaction || result.transaction)
      });
      
      // Log the actual structure for debugging
      if (result.data) {
        console.log('📦 Response data structure:', {
          keys: Object.keys(result.data),
          hasTransaction: !!result.data.transaction,
          hasTransactions: !!result.data.transactions,
          transactionType: result.data.type
        });
      }
      
      // Handle new standardized response format
      if (result.success === false) {
        console.error('❌ API returned success=false:', result);
        throw new Error(result.error || result.details || 'Failed to build create-tip transaction');
      }
      
      // Extract data from the standardized format
      return result.data || result;
    } catch (error) {
      console.error('❌ buildCreateTipTransaction failed:', error);
      throw error;
    }
  }

  /**
   * Builds an update-verification transaction via Beam API
   */
  private async buildUpdateVerificationTransaction(params: UpdateVerificationTransactionParams): Promise<UpdateVerificationResponse> {
    const response = await fetch(
      `${this.apiBaseUrl}/blockchain/transactions/build/update-verification`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          targetUser: params.targetUser,
          verificationType: params.verificationType,
          domainName: params.domainName,
          callerWallet: params.callerWallet,
          computeUnits: params.computeUnits || 250000,
          priorityFee: params.priorityFee || 1,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
        `${this.apiBaseUrl}/blockchain/transactions/build/create-user/accounts?userWallet=${userWallet}`,
        {
          headers: this.getAuthHeaders(),
        }
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