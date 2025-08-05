import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
// Note: Some SPL token functions may not be available in React Native environment
// These will be implemented differently for mobile
let createTransferInstruction: any;
let getOrCreateAssociatedTokenAccount: any;
let TOKEN_PROGRAM_ID: any;

try {
  const splToken = require('@solana/spl-token');
  createTransferInstruction = splToken.createTransferInstruction;
  getOrCreateAssociatedTokenAccount = splToken.getOrCreateAssociatedTokenAccount;
  TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID;
} catch (error) {
  console.warn('SPL Token not available in this environment:', error);
  // We'll provide fallback implementations below
}

export interface TransactionBuilderConfig {
  connection?: Connection;
  beamRpcUrl?: string;
  customRpcUrl?: string;
  priorityFee?: number;
  computeUnits?: number;
}

export interface TransactionOptions {
  memo?: string;
  priorityFee?: number;
  computeUnits?: number;
}

export type TransactionType =
  | 'transfer_sol'
  | 'transfer_token'
  | 'create_post'
  | 'vote_post'
  | 'tip_user'
  | 'follow_user'
  | 'custom';

export interface TransferSolParams {
  fromPubkey: PublicKey;
  toPubkey: PublicKey;
  lamports: number;
}

export interface TransferTokenParams {
  fromPubkey: PublicKey;
  toPubkey: PublicKey;
  mint: PublicKey;
  amount: number;
  decimals?: number;
}

export interface SocialActionParams {
  userPubkey: PublicKey;
  programId: PublicKey;
  actionType: string;
  data: any;
}

export class SolanaTransactionBuilder {
  private config: TransactionBuilderConfig;

  constructor(config: TransactionBuilderConfig = {}) {
    this.config = config;
  }

  /**
   * Creates a Connection instance based on configuration
   */
  private getConnection(): Connection {
    if (this.config.connection) {
      return this.config.connection;
    }

    const rpcUrl = this.config.customRpcUrl || this.config.beamRpcUrl || 'https://api.devnet.solana.com';
    return new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Adds priority fee and compute budget instructions to a transaction
   */
  private addPriorityFeeInstructions(
    transaction: Transaction,
    options: TransactionOptions = {}
  ): void {
    const priorityFee = options.priorityFee || this.config.priorityFee || 0;
    const computeUnits = options.computeUnits || this.config.computeUnits || 200000;

    if (computeUnits > 0) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeUnits,
        })
      );
    }

    if (priorityFee > 0) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee,
        })
      );
    }
  }

  /**
   * Builds a SOL transfer transaction
   */
  async buildTransferSol(
    params: TransferSolParams,
    options: TransactionOptions = {}
  ): Promise<Transaction> {
    const connection = this.getConnection();
    const transaction = new Transaction();

    // Add priority fee instructions
    this.addPriorityFeeInstructions(transaction, options);

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: params.fromPubkey,
        toPubkey: params.toPubkey,
        lamports: params.lamports,
      })
    );

    // Add memo if provided
    if (options.memo) {
      transaction.add(this.createMemoInstruction(options.memo));
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.fromPubkey;

    return transaction;
  }

  /**
   * Builds a token transfer transaction
   */
  async buildTransferToken(
    params: TransferTokenParams,
    options: TransactionOptions = {}
  ): Promise<Transaction> {
    if (!createTransferInstruction || !getOrCreateAssociatedTokenAccount || !TOKEN_PROGRAM_ID) {
      throw new Error('SPL Token functionality not available in this environment. Use SOL transfers instead.');
    }

    const connection = this.getConnection();
    const transaction = new Transaction();

    // Add priority fee instructions
    this.addPriorityFeeInstructions(transaction, options);

    // Get or create associated token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      params.fromPubkey,
      params.mint,
      params.fromPubkey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      params.fromPubkey, // Payer
      params.mint,
      params.toPubkey
    );

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        params.fromPubkey,
        params.amount * Math.pow(10, params.decimals || 6),
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Add memo if provided
    if (options.memo) {
      transaction.add(this.createMemoInstruction(options.memo));
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.fromPubkey;

    return transaction;
  }

  /**
   * Builds a social action transaction (for Beam platform)
   */
  async buildSocialAction(
    params: SocialActionParams,
    options: TransactionOptions = {}
  ): Promise<Transaction> {
    const connection = this.getConnection();
    const transaction = new Transaction();

    // Add priority fee instructions
    this.addPriorityFeeInstructions(transaction, options);

    // Create custom instruction for social action
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: params.userPubkey, isSigner: true, isWritable: true },
      ],
      programId: params.programId,
      data: Buffer.from(JSON.stringify({
        action: params.actionType,
        data: params.data,
      })),
    });

    transaction.add(instruction);

    // Add memo if provided
    if (options.memo) {
      transaction.add(this.createMemoInstruction(options.memo));
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.userPubkey;

    return transaction;
  }

  /**
   * Creates a memo instruction
   */
  private createMemoInstruction(memo: string): TransactionInstruction {
    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(memo, 'utf8'),
    });
  }

  /**
   * Estimates transaction fee
   */
  async estimateFee(transaction: Transaction): Promise<number> {
    const connection = this.getConnection();
    return await connection.getFeeForMessage(transaction.compileMessage());
  }

  /**
   * Sends a signed transaction through the appropriate RPC
   */
  async sendSignedTransaction(
    signedTransaction: Transaction,
    useBeamRpc: boolean = true
  ): Promise<string> {
    if (useBeamRpc && this.config.beamRpcUrl) {
      // Send through Beam backend
      return this.sendThroughBeamRpc(signedTransaction);
    } else {
      // Send directly to RPC
      const connection = this.getConnection();
      return await connection.sendRawTransaction(signedTransaction.serialize());
    }
  }

  /**
   * Sends transaction through Beam backend RPC forwarding
   */
  private async sendThroughBeamRpc(signedTransaction: Transaction): Promise<string> {
    const serializedTx = signedTransaction.serialize().toString('base64');
    
    const response = await fetch(`${this.config.beamRpcUrl}/api/transactions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: serializedTx,
      }),
    });

    if (!response.ok) {
      throw new Error(`Beam RPC error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.signature;
  }

  /**
   * Waits for transaction confirmation
   */
  async confirmTransaction(
    signature: string,
    useBeamApi: boolean = true,
    timeout: number = 30000
  ): Promise<boolean> {
    if (useBeamApi && this.config.beamRpcUrl) {
      return this.confirmThroughBeamApi(signature, timeout);
    } else {
      return this.confirmThroughRpc(signature, timeout);
    }
  }

  /**
   * Confirms transaction through Beam API
   */
  private async confirmThroughBeamApi(signature: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.config.beamRpcUrl}/api/transactions/${signature}`);
        const result = await response.json();
        
        if (result.status === 'confirmed' || result.status === 'finalized') {
          return true;
        }
        
        if (result.status === 'failed') {
          throw new Error(`Transaction failed: ${result.error}`);
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error checking transaction status:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  }

  /**
   * Confirms transaction through direct RPC
   */
  private async confirmThroughRpc(signature: string, timeout: number): Promise<boolean> {
    const connection = this.getConnection();
    
    try {
      const result = await connection.confirmTransaction(signature, 'confirmed');
      return !result.value.err;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
  }

  /**
   * Convenience method for the complete flow: build -> sign -> send -> confirm
   */
  async executeTransaction(
    type: TransactionType,
    params: any,
    signer: (tx: Transaction) => Promise<Transaction>,
    options: TransactionOptions & { useBeamRpc?: boolean } = {}
  ): Promise<string> {
    // Build transaction
    let transaction: Transaction;
    
    switch (type) {
      case 'transfer_sol':
        transaction = await this.buildTransferSol(params, options);
        break;
      case 'transfer_token':
        transaction = await this.buildTransferToken(params, options);
        break;
      case 'create_post':
      case 'vote_post':
      case 'tip_user':
      case 'follow_user':
        transaction = await this.buildSocialAction(params, options);
        break;
      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }

    // Sign transaction
    const signedTransaction = await signer(transaction);

    // Send transaction
    const signature = await this.sendSignedTransaction(
      signedTransaction, 
      options.useBeamRpc !== false
    );

    // Confirm transaction
    await this.confirmTransaction(signature, options.useBeamRpc !== false);

    return signature;
  }
}

// Default instance for convenience
export const transactionBuilder = new SolanaTransactionBuilder();

// Helper functions for common operations
export const TransactionHelpers = {
  /**
   * Convert SOL to lamports
   */
  solToLamports(sol: number): number {
    return sol * LAMPORTS_PER_SOL;
  },

  /**
   * Convert lamports to SOL
   */
  lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
  },

  /**
   * Format transaction for display
   */
  formatTransaction(transaction: Transaction): string {
    return transaction.serialize().toString('base64');
  },

  /**
   * Create a tip transaction for social features
   */
  async createTipTransaction(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    amountSol: number,
    message?: string
  ): Promise<Transaction> {
    return transactionBuilder.buildTransferSol(
      {
        fromPubkey,
        toPubkey,
        lamports: TransactionHelpers.solToLamports(amountSol),
      },
      {
        memo: message ? `Tip: ${message}` : 'Tip from Beam',
      }
    );
  },
};