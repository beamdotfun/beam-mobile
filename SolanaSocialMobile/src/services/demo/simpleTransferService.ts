import { Transaction } from '@solana/web3.js';
import { SolanaMobileWalletAdapter } from '../wallet/adapter';
import apiClient from '../api/client';
import { Buffer } from 'buffer';

interface TestTransactionResponse {
  success: boolean;
  message?: string;
  data?: {
    transaction: string; // base64 encoded transaction
    type: string;
  };
}

interface SubmitTransactionResponse {
  success: boolean;
  message?: string;
  data?: {
    signature: string;
  };
}

export class SimpleTransferService {
  constructor(private walletAdapter: SolanaMobileWalletAdapter) {}

  async transfer(from: string, to: string, lamports: number): Promise<string> {
    try {
      console.log('🔍 SimpleTransfer: Starting transfer flow...');
      console.log('🔍 From:', from);
      console.log('🔍 To:', to);
      console.log('🔍 Amount:', lamports, 'lamports');

      // Step 1: Get transaction from backend
      console.log('📡 Requesting test transaction from backend...');
      const buildResponse = await apiClient.post<TestTransactionResponse>(
        '/blockchain/test-transaction',
        {
          fromWallet: from,
          toWallet: to,
          lamports,
        }
      );

      if (!buildResponse.data?.success || !buildResponse.data?.data?.transaction) {
        throw new Error(buildResponse.data?.message || 'Failed to build transaction');
      }

      console.log('✅ Got transaction from backend');
      console.log('📝 Transaction type:', buildResponse.data.data.type);

      // Step 2: Deserialize the transaction
      const transactionBuffer = Buffer.from(buildResponse.data.data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      console.log('📄 Deserialized transaction');
      console.log('   - Has signatures:', transaction.signatures.length);
      console.log('   - Instructions:', transaction.instructions.length);
      console.log('   - Recent blockhash:', transaction.recentBlockhash);

      // Step 3: Sign with wallet (exact same pattern as working code)
      console.log('📝 Sending to wallet for signing...');
      const signedTransaction = await this.walletAdapter.signTransaction(transaction);
      console.log('✅ Got signed transaction back from wallet');
      
      // Debug: Check the signed transaction details
      console.log('🔍 Signed transaction details:');
      console.log('   - Type:', signedTransaction.constructor.name);
      console.log('   - Has signatures:', signedTransaction.signatures.length);
      console.log('   - Signatures:', signedTransaction.signatures.map((sig, idx) => ({
        index: idx,
        signature: sig.signature ? `${Buffer.from(sig.signature).toString('hex').slice(0, 20)}...` : 'null',
        publicKey: sig.publicKey?.toString()
      })));

      // Step 4: Serialize for backend submission
      const serialized = signedTransaction.serialize();
      const base64Tx = Buffer.from(serialized).toString('base64');
      
      console.log('📦 Serialization check:');
      console.log('   - Serialized successfully');
      console.log('   - Serialized length:', serialized.length);
      console.log('   - First 20 bytes:', Buffer.from(serialized.slice(0, 20)).toString('hex'));
      
      console.log('📤 Submitting to backend...');
      console.log('   - Serialized length:', serialized.length);
      console.log('   - Base64 length:', base64Tx.length);

      // Step 5: Submit to backend
      const submitResponse = await apiClient.post<SubmitTransactionResponse>(
        '/blockchain/transactions/submit',
        {
          transaction: base64Tx,  // Changed from 'signedTransaction' to 'transaction' per API docs
        }
      );

      if (!submitResponse.data?.success || !submitResponse.data?.data?.signature) {
        throw new Error(submitResponse.data?.message || 'Failed to submit transaction');
      }

      console.log('✅ Transaction submitted successfully!');
      console.log('🎉 Signature:', submitResponse.data.data.signature);

      return submitResponse.data.data.signature;
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      if (error instanceof Error) {
        console.error('   - Error message:', error.message);
        console.error('   - Stack:', error.stack);
      }
      throw error;
    }
  }
}