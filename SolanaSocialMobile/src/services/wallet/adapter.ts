import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {PublicKey, Transaction, VersionedTransaction} from '@solana/web3.js';
import {authAPI} from '../api/auth';
import {API_CONFIG} from '../../config/api';
import bs58 from 'bs58';

export interface WalletAuth {
  publicKey: PublicKey;
  authToken: string;
  walletLabel?: string;
  user?: any; // Backend user data
}

export class SolanaMobileWalletAdapter {
  private authResult: WalletAuth | null = null;

  private authToken: string | null = null;
  private readonly APP_IDENTITY = { 
    name: "Beam",
    uri: "https://beam.fun",
    icon: "/assets/images/logo.png" // Must be relative to the uri
  };

  async connect(): Promise<WalletAuth> {
    console.log('🔍 MobileWalletAdapter: Starting connection...');
    console.log('🔍 MobileWalletAdapter: This should launch wallet selection');
    
    const result = await transact(async (wallet) => {
      console.log('🔍 MobileWalletAdapter: Inside transact callback');
      console.log('🔍 MobileWalletAdapter: Available wallet methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(wallet)));
      
      // Step 1: Use Sign in with Solana (SIWS) - this combines authorize + sign message!
      console.log('🔍 MobileWallet: Using Sign in with Solana (SIWS)...');
      const authResult = await wallet.authorize({
        cluster: "devnet",
        identity: this.APP_IDENTITY,
        sign_in_payload: {
          domain: 'beam.fun',
          statement: 'Sign in to authenticate with Beam',
          uri: 'https://beam.fun',
        },
      });
      
      // Store the auth token for future use
      this.authToken = authResult.auth_token;

      console.log('🔍 MobileWalletAdapter: SIWS Authorization successful');
      console.log('🔍 MobileWalletAdapter: Has sign_in_result:', !!authResult.sign_in_result);
      
      // Get the public key
      const account = authResult.accounts?.[0];
      if (!account || !account.address) {
        throw new Error('No account with address found in authorization result');
      }
      
      // Create PublicKey from the base64 address
      const base64Chars = 'ABCDEFGHIJ KLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const base64 = account.address;
      let bits = 0;
      let data = 0;
      const bytes = [];
      
      for (let i = 0; i < base64.length; i++) {
        if (base64[i] === '=') break;
        const charIndex = base64Chars.indexOf(base64[i]);
        if (charIndex === -1) continue;
        
        data = (data << 6) | charIndex;
        bits += 6;
        
        if (bits >= 8) {
          bytes.push((data >> (bits - 8)) & 0xFF);
          bits -= 8;
        }
      }
      
      const addressBytes = new Uint8Array(bytes);
      const publicKey = new PublicKey(addressBytes);
      const walletAddress = publicKey.toString();
      
      console.log('🔍 MobileWalletAdapter: Wallet address:', walletAddress);

      // Check if we got the sign-in result
      if (!authResult.sign_in_result) {
        throw new Error('Sign in with Solana failed - no sign_in_result received');
      }

      console.log('🔍 MobileWalletAdapter: SIWS completed successfully');
      console.log('🔍 MobileWalletAdapter: Sign-in result received:', authResult.sign_in_result);
      
      // Send SIWS result to backend for verification
      console.log('🔍 MobileWalletAdapter: Sending SIWS result to backend...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/wallet/siws`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authResult.sign_in_result)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 MobileWalletAdapter: Backend SIWS verification failed:', errorText);
        throw new Error(`Backend verification failed: ${response.status} ${errorText}`);
      }

      const authResponse = await response.json();
      console.log('🔍 MobileWalletAdapter: Backend SIWS verification successful:', authResponse);

      if (!authResponse.success || !authResponse.user) {
        throw new Error('Backend authentication failed');
      }

      return {
        publicKey,
        authToken: authResult.auth_token,
        walletLabel: authResult.wallet_uri_base || 'unknown-wallet',
        user: {
          ...authResponse.user,
          token: authResponse.token, // Include the JWT token from backend
          refreshToken: authResponse.refreshToken, // Include refresh token if available
        }
      };
    });

    console.log('✅ MobileWalletAdapter: Full authentication completed successfully');
    
    this.authResult = result;
    return result;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.authToken) {
      throw new Error('Wallet not authorized. Call connect() first.');
    }

    console.log('🔍 MobileWalletAdapter: Starting new transact for signing...');
    
    const signature = await transact(async (wallet) => {
      console.log('🔍 MobileWalletAdapter: Reauthorizing wallet for signing...');
      
      // Reauthorize using stored auth token
      const authResult = await wallet.reauthorize({
        auth_token: this.authToken,
        identity: this.APP_IDENTITY,
      });
      
      console.log('🔍 MobileWalletAdapter: Reauthorization successful');
      
      // Convert message to bytes using proper encoding
      const messageBytes = new TextEncoder().encode(message);
      
      console.log('🔍 MobileWalletAdapter: About to sign message with', messageBytes.length, 'bytes');
      
      // Sign the message
      const signedMessages = await wallet.signMessages({
        payloads: [messageBytes],
      });
      
      console.log('🔍 MobileWalletAdapter: Message signed, converting to base58...');
      console.log('🔍 MobileWalletAdapter: SignedMessages structure:', signedMessages);
      
      // Get the first signed message
      const signedMessage = signedMessages[0];
      
      if (!signedMessage) {
        throw new Error('No signed message received from wallet');
      }
      
      // Convert signature to base58
      const signatureBytes = signedMessage instanceof Uint8Array 
        ? signedMessage 
        : new Uint8Array(signedMessage);
        
      return bs58.encode(signatureBytes);
    });

    return signature;
  }

  async signAndSendTransaction(
    transaction: Transaction | VersionedTransaction,
  ): Promise<string> {
    if (!this.authToken) {
      throw new Error('Wallet not authorized. Call connect() first.');
    }

    console.log('🔍 MobileWalletAdapter: Starting sign and send transaction...');

    const result = await transact(async wallet => {
      // Reauthorize using stored auth token
      const authResult = await wallet.reauthorize({
        auth_token: this.authToken,
        identity: this.APP_IDENTITY,
      });

      console.log('🔍 MobileWalletAdapter: Reauthorization successful for sign and send');

      console.log('🔍 MobileWalletAdapter: Signing and sending transaction...');

      // Sign and send the transaction - pass transaction object directly
      const transactionSignatures = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      console.log('🔍 MobileWalletAdapter: Transaction signed and sent successfully');
      console.log('🔍 MobileWalletAdapter: Transaction signatures:', transactionSignatures);

      // Return the signature directly from the array
      const signature = transactionSignatures[0];
      
      if (!signature) {
        throw new Error('No transaction signature received from wallet');
      }

      return signature;
    });

    return result;
  }

  async signTransaction(
    transaction: Transaction | VersionedTransaction,
  ): Promise<Transaction | VersionedTransaction> {
    if (!this.authToken) {
      throw new Error('Wallet not authorized. Call connect() first.');
    }

    console.log('🔍 MobileWalletAdapter: Starting transaction signing...');

    try {
      const result = await transact(async wallet => {
        console.log('🔍 MobileWalletAdapter: Inside transact callback for signing');
        
        try {
          // Reauthorize using stored auth token
          console.log('🔍 MobileWalletAdapter: About to reauthorize...');
          const authResult = await wallet.reauthorize({
            auth_token: this.authToken,
            identity: this.APP_IDENTITY,
          });
          console.log('🔍 MobileWalletAdapter: Reauthorization successful for transaction signing');

          console.log('🔍 MobileWalletAdapter: About to call wallet.signTransactions...');
          console.log('🔍 MobileWalletAdapter: Transaction type:', transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'LegacyTransaction');
          
          // Sign the transaction - pass the transaction object directly (not serialized)
          // According to docs, web3js version handles serialization automatically
          const signedTxs = await wallet.signTransactions({
            transactions: [transaction],
          });

          console.log('🔍 MobileWalletAdapter: wallet.signTransactions completed successfully');
          console.log('🔍 MobileWalletAdapter: SignedTxs length:', signedTxs?.length);
          console.log('🔍 MobileWalletAdapter: SignedTxs[0] type:', typeof signedTxs[0]);

          // Return the signed transaction directly - docs show signedTxs[0]
          const signedTransaction = signedTxs[0];
          
          if (!signedTransaction) {
            throw new Error('No signed transaction received from wallet');
          }

          console.log('🔍 MobileWalletAdapter: Returning signed transaction');
          
          return signedTransaction;
        } catch (innerError) {
          console.error('❌ MobileWalletAdapter: Error inside transact callback:', innerError);
          console.error('❌ MobileWalletAdapter: Inner error details:', {
            message: innerError.message,
            stack: innerError.stack,
            name: innerError.name
          });
          throw innerError;
        }
      });

      console.log('🔍 MobileWalletAdapter: transact completed successfully');
      return result;
    } catch (outerError) {
      console.error('❌ MobileWalletAdapter: Error in signTransaction:', outerError);
      console.error('❌ MobileWalletAdapter: Outer error details:', {
        message: outerError.message,
        stack: outerError.stack,
        name: outerError.name
      });
      throw outerError;
    }
  }

  async disconnect(): Promise<void> {
    console.log('🔍 MobileWalletAdapter: Starting disconnect...');
    
    if (!this.authResult) {
      console.log('🔍 MobileWalletAdapter: No active connection to disconnect');
      return;
    }

    console.log('🔍 MobileWalletAdapter: Deauthorizing wallet...');
    
    await transact(async wallet => {
      await wallet.deauthorize({
        auth_token: this.authResult!.authToken,
      });
    });

    console.log('✅ MobileWalletAdapter: Disconnect completed successfully');
    this.authResult = null;
  }

  get connected(): boolean {
    return this.authResult !== null;
  }

  get publicKey(): PublicKey | null {
    return this.authResult?.publicKey || null;
  }
}
