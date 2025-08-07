import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {PublicKey, Transaction} from '@solana/web3.js';
import {authAPI} from '../api/auth';
import {API_CONFIG} from '../../config/api';
import bs58 from 'bs58';
import {Buffer} from 'buffer';

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
    console.log('🔍 MobileWalletAdapter: Current auth token:', this.authToken ? 'exists' : 'none');
    console.log('🔍 MobileWalletAdapter: Current auth result:', this.authResult ? 'exists' : 'none');
    
    // Clear any previous connection state to ensure fresh connection
    this.authToken = null;
    this.authResult = null;
    
    const result = await transact(async (wallet) => {
      console.log('🔍 MobileWalletAdapter: Inside transact callback');
      console.log('🔍 MobileWalletAdapter: Available wallet methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(wallet)));
      
      // Step 1: Try SIWS first, fall back to regular auth if not supported
      console.log('🔍 MobileWallet: Attempting Sign in with Solana (SIWS)...');
      let authResult;
      let usedSIWS = false;
      
      try {
        authResult = await wallet.authorize({
          cluster: "mainnet-beta",
          identity: this.APP_IDENTITY,
          sign_in_payload: {
            domain: 'beam.fun',
            statement: 'Sign in to authenticate with Beam',
            uri: 'https://beam.fun',
          },
        });
        usedSIWS = true;
        console.log('🔍 MobileWallet: SIWS authorization successful');
        console.log('🔍 MobileWallet: Auth result has sign_in_result:', !!authResult.sign_in_result);
        if (authResult.sign_in_result) {
          console.log('🔍 MobileWallet: sign_in_result fields:', Object.keys(authResult.sign_in_result));
        }
      } catch (error) {
        console.log('🔍 MobileWallet: SIWS not supported, falling back to standard authorization');
        authResult = await wallet.authorize({
          cluster: "mainnet-beta",
          identity: this.APP_IDENTITY,
        });
        console.log('🔍 MobileWallet: Standard authorization successful');
      }
      
      // Check if we actually got a valid SIWS result
      if (usedSIWS && (!authResult.sign_in_result || !authResult.sign_in_result.signature)) {
        console.log('🔍 MobileWallet: Wallet claimed SIWS support but returned no/empty signature');
        console.log('🔍 MobileWallet: Attempting to sign SIWS message manually...');
        
        // For Phantom, we need to manually sign the SIWS message
        if (authResult.sign_in_result && authResult.sign_in_result.signed_message) {
          try {
            // The signed_message from Phantom is base64 encoded
            const messageBase64 = authResult.sign_in_result.signed_message;
            const messageBytes = Buffer.from(messageBase64, 'base64');
            
            console.log('🔍 MobileWallet: Signing SIWS message manually with wallet...');
            console.log('🔍 MobileWallet: Message bytes length:', messageBytes.length);
            
            // Get account from authResult.accounts
            const siwsAccount = authResult.accounts?.[0];
            if (!siwsAccount || !siwsAccount.address) {
              throw new Error('No account available for SIWS signing');
            }
            
            console.log('🔍 MobileWallet: Account address for signing:', siwsAccount.address);
            
            try {
              const signedMessages = await wallet.signMessages({
                addresses: [siwsAccount.address],
                payloads: [messageBytes],
              });
              
              console.log('🔍 MobileWallet: signMessages returned:', signedMessages);
              
              if (signedMessages && signedMessages.length > 0) {
                // Convert signature to base64
                const signatureBytes = signedMessages[0];
                const signatureBase64 = Buffer.from(signatureBytes).toString('base64');
                
                console.log('🔍 MobileWallet: Signature generated, length:', signatureBase64.length);
                
                // Update the sign_in_result with the signature
                authResult.sign_in_result.signature = signatureBase64;
                console.log('🔍 MobileWallet: Successfully signed SIWS message manually');
                usedSIWS = true; // Keep using SIWS flow
              } else {
                console.log('🔍 MobileWallet: Failed to manually sign SIWS message - no signatures returned');
                usedSIWS = false;
              }
            } catch (signError) {
              console.error('🔍 MobileWallet: Error calling signMessages:', signError);
              throw signError; // Re-throw to be caught by outer try-catch
            }
          } catch (error) {
            console.error('🔍 MobileWallet: Error signing SIWS message manually:', error);
            usedSIWS = false;
          }
        } else {
          usedSIWS = false; // No signed_message to work with
        }
      }
      
      // Store the auth token for future use
      this.authToken = authResult.auth_token;

      console.log('🔍 MobileWalletAdapter: Authorization successful');
      console.log('🔍 MobileWalletAdapter: Authorization result:', {
        accounts: authResult.accounts?.length,
        auth_token: authResult.auth_token ? 'present' : 'missing',
        wallet_uri_base: authResult.wallet_uri_base,
      });
      
      // Get the public key
      const account = authResult.accounts?.[0];
      if (!account || !account.address) {
        throw new Error('No account with address found in authorization result');
      }
      
      console.log('🔍 MobileWalletAdapter: Account details:', {
        address: account.address,
        label: account.label,
        chains: account.chains,
      });
      
      // Create PublicKey from the base64 address
      // Use Buffer to properly decode base64 to bytes
      const addressBytes = Buffer.from(account.address, 'base64');
      const publicKey = new PublicKey(addressBytes);
      const walletAddress = publicKey.toString();
      
      console.log('🔍 MobileWalletAdapter: Wallet address:', walletAddress);

      let authResponse;
      
      if (usedSIWS && authResult.sign_in_result) {
        // SIWS flow (for wallets that support it like Solflare)
        console.log('🔍 MobileWalletAdapter: Using SIWS result for authentication');
        console.log('🔍 MobileWalletAdapter: SIWS payload to backend:', JSON.stringify(authResult.sign_in_result, null, 2));
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/wallet/siws`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authResult.sign_in_result)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 MobileWalletAdapter: Backend SIWS verification failed:', errorText);
          throw new Error(`Backend verification failed: ${response.status} ${errorText}`);
        }

        authResponse = await response.json();
        console.log('🔍 MobileWalletAdapter: Backend SIWS verification successful');
      } else {
        // Use traditional challenge-response flow for wallets that don't support SIWS properly
        console.log('🔍 MobileWalletAdapter: Using traditional challenge-response authentication');
        
        // Step 1: Get challenge from backend
        console.log('🔍 MobileWalletAdapter: Requesting challenge for wallet:', walletAddress);
        const challengeResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/wallet/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        });

        console.log('🔍 MobileWalletAdapter: Challenge response status:', challengeResponse.status);
        if (!challengeResponse.ok) {
          const errorText = await challengeResponse.text();
          console.error('🔍 MobileWalletAdapter: Failed to get challenge:', errorText);
          throw new Error('Failed to get authentication challenge');
        }

        const challengeData = await challengeResponse.json();
        console.log('🔍 MobileWalletAdapter: Got challenge:', challengeData);
        const { message, nonce } = challengeData;

        // Step 2: Sign the challenge message
        const messageBytes = new TextEncoder().encode(message);
        console.log('🔍 MobileWalletAdapter: Signing challenge message...');
        
        // We need to sign outside the authorization transaction
        // Store the account address for use in the new transaction
        const accountAddress = account.address;
        const authTokenForSigning = authResult.auth_token;
        
        const signatureBase58 = await transact(async (wallet) => {
          console.log('🔍 MobileWalletAdapter: Reauthorizing for message signing...');
          await wallet.reauthorize({
            auth_token: authTokenForSigning,
            identity: this.APP_IDENTITY,
          });
          
          console.log('🔍 MobileWalletAdapter: Signing message with address:', accountAddress);
          const signedMessages = await wallet.signMessages({
            addresses: [accountAddress],
            payloads: [messageBytes],
          });
          
          if (!signedMessages || signedMessages.length === 0) {
            throw new Error('Failed to sign challenge message');
          }
          
          return bs58.encode(signedMessages[0]);
        });
        
        console.log('🔍 MobileWalletAdapter: Challenge signed successfully');

        // Step 3: Verify signature with backend
        const verifyResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/wallet/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            signature: signatureBase58,
            nonce
          })
        });

        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          console.error('🔍 MobileWalletAdapter: Backend verification failed:', errorText);
          throw new Error(`Authentication failed: ${errorText}`);
        }

        authResponse = await verifyResponse.json();
        console.log('🔍 MobileWalletAdapter: Traditional auth verification successful');
      }

      if (!authResponse.success || !authResponse.user) {
        throw new Error('Backend authentication failed');
      }

      // Try to extract wallet name from various sources
      let walletName = 'Unknown Wallet';
      if (account.label) {
        walletName = account.label;
      } else if (authResult.wallet_uri_base) {
        // Try to extract wallet name from URI (e.g., "solflare-wallet" from URI)
        const match = authResult.wallet_uri_base.match(/([a-zA-Z]+)-wallet/);
        if (match) {
          walletName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
      
      console.log('🔍 MobileWalletAdapter: Determined wallet name:', walletName);

      return {
        publicKey,
        authToken: authResult.auth_token,
        walletLabel: walletName,
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
    transaction: Transaction,
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
    transaction: Transaction,
  ): Promise<Transaction> {
    if (!this.authToken) {
      throw new Error('Wallet not authorized. Call connect() first.');
    }

    const signedTx = await transact(async (wallet) => {
      // Try to reauthorize, but handle authorization failures
      try {
        console.log('🔍 MobileWalletAdapter: Attempting to reauthorize for transaction signing...');
        await wallet.reauthorize({
          auth_token: this.authToken,
          identity: this.APP_IDENTITY,
        });
        console.log('✅ MobileWalletAdapter: Reauthorization successful');
      } catch (reauthorizeError: any) {
        console.log('⚠️ MobileWalletAdapter: Reauthorization failed:', reauthorizeError?.message);
        
        // If reauthorization fails (auth token expired), we need a fresh authorization
        if (reauthorizeError?.message?.includes('authorization') || 
            reauthorizeError?.code === -1) {
          console.log('🔄 MobileWalletAdapter: Auth token expired, requesting fresh authorization...');
          
          // Get fresh authorization
          const freshAuth = await wallet.authorize({
            identity: this.APP_IDENTITY,
            chain: 'solana:mainnet',
          });
          
          console.log('✅ MobileWalletAdapter: Fresh authorization obtained');
          
          // Update stored auth token
          if (freshAuth.auth_token) {
            this.authToken = freshAuth.auth_token;
            if (this.authResult) {
              this.authResult.authToken = freshAuth.auth_token;
            }
          }
        } else {
          // If it's not an auth error, re-throw
          throw reauthorizeError;
        }
      }

      // IMPORTANT: The transaction is already prepared, just sign it
      const signedTransactions = await wallet.signTransactions({
        transactions: [transaction],
      });

      console.log('🔍 Wallet signed transaction:', {
        count: signedTransactions.length,
        hasTransaction: !!signedTransactions[0],
        isTransaction: signedTransactions[0] instanceof Transaction
      });
      
      // Debug: Check what the wallet actually returned
      const signedTx = signedTransactions[0];
      if (signedTx) {
        console.log('🔍 Detailed signed tx check:');
        console.log('   - Type:', signedTx.constructor.name);
        console.log('   - Has serialize method:', typeof signedTx.serialize === 'function');
        console.log('   - Signatures array:', signedTx.signatures?.length);
        
        // Check if it's a raw signed transaction (Uint8Array) vs Transaction object
        if (signedTx instanceof Uint8Array) {
          console.log('   - Raw signature bytes length:', signedTx.length);
          console.log('   - First 20 bytes:', Buffer.from(signedTx.slice(0, 20)).toString('hex'));
          
          // If it's raw bytes, we need to reconstruct the transaction
          const reconstructed = Transaction.from(signedTx);
          console.log('   - Reconstructed transaction signatures:', reconstructed.signatures.length);
          return reconstructed;
        }
      }

      return signedTransactions[0];
    });

    return signedTx;
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
    this.authToken = null; // Clear the auth token too!
  }

  get connected(): boolean {
    return this.authResult !== null;
  }

  get publicKey(): PublicKey | null {
    return this.authResult?.publicKey || null;
  }
}
