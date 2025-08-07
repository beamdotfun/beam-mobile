import {create} from 'zustand';
import {PublicKey} from '@solana/web3.js';
import {SolanaMobileWalletAdapter} from '../services/wallet/adapter';
import {TransactionService, createTransactionService} from '../services/transactions/service';
import {BlockchainTransactionService, createBlockchainTransactionService} from '../services/blockchain/transactionService';
import {API_CONFIG} from '../config/api';
import {useAuthStore} from './auth';
import {extractErrorMessage} from '../utils/errorMessages';

interface WalletState {
  // Connection state
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  authToken: string | null;
  walletLabel: string | null;
  user: any | null; // Backend user data from SIWS
  balance: number | null;
  
  // Connection status for UI compatibility
  connectionStatus: 'Connected' | 'Disconnected' | 'Connecting';

  // Wallet adapter instance
  adapter: SolanaMobileWalletAdapter;
  
  // Transaction service instance
  transactionService: TransactionService;
  
  // Blockchain transaction service instance
  blockchainService: BlockchainTransactionService;

  // Computed properties
  isConnected: boolean;
  wallet: {
    publicKey: string | null;
  } | null;

  // Actions
  connect: () => Promise<import('../services/wallet/adapter').WalletAuth>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: any) => Promise<string>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  connected: false,
  connecting: false,
  publicKey: null,
  authToken: null,
  walletLabel: null,
  user: null,
  balance: null,
  connectionStatus: 'Disconnected',
  adapter: new SolanaMobileWalletAdapter(),
  get transactionService() {
    const adapter = get().adapter;
    return createTransactionService(adapter, {
      beamRpcUrl: API_CONFIG.BASE_URL,
      defaultPriorityFee: 5000,
      defaultComputeUnits: 200000,
    });
  },
  get blockchainService() {
    const adapter = get().adapter;
    const getAuthToken = () => useAuthStore.getState().token;
    return createBlockchainTransactionService(adapter, API_CONFIG.BASE_URL, getAuthToken);
  },

  // Computed properties
  get isConnected() {
    return get().connected;
  },
  get wallet() {
    const state = get();
    return state.connected && state.publicKey
      ? {publicKey: state.publicKey.toString()}
      : null;
  },

  // Actions
  connect: async () => {
    const {adapter} = get();

    set({connecting: true, connectionStatus: 'Connecting'});

    try {
      console.log('🔍 WalletStore: Starting mobile wallet adapter connection...');
      const auth = await adapter.connect();
      console.log('✅ WalletStore: Wallet adapter connection successful');

      set({
        connected: true,
        connecting: false,
        connectionStatus: 'Connected',
        publicKey: auth.publicKey,
        authToken: auth.authToken,
        walletLabel: auth.walletLabel,
        user: auth.user,
      });

      return auth;
    } catch (error) {
      console.error('🚨 WalletStore: Connection failed:', error);
      set({
        connecting: false, 
        connectionStatus: 'Disconnected'
      });
      // Throw user-friendly error message
      throw new Error(extractErrorMessage(error));
    }
  },

  disconnect: async () => {
    const {adapter} = get();

    try {
      console.log('🔍 WalletStore: Starting wallet disconnect...');
      await adapter.disconnect();
      console.log('✅ WalletStore: Wallet disconnected successfully');

      set({
        connected: false,
        connecting: false,
        connectionStatus: 'Disconnected',
        publicKey: null,
        authToken: null,
        walletLabel: null,
        user: null,
        balance: null,
      });
    } catch (error) {
      console.error('🚨 WalletStore: Disconnect error:', error);
      // Still set as disconnected even if deauthorize fails
      set({
        connected: false,
        connecting: false,
        connectionStatus: 'Disconnected',
        publicKey: null,
        authToken: null,
        walletLabel: null,
        user: null,
        balance: null,
      });
    }
  },

  signAndSendTransaction: async transaction => {
    const {adapter} = get();
    return await adapter.signAndSendTransaction(transaction);
  },

  signTransaction: async transaction => {
    const {adapter} = get();
    return await adapter.signTransaction(transaction);
  },

  signMessage: async (message: Uint8Array) => {
    const {adapter} = get();
    const messageString = new TextDecoder().decode(message);
    const signatureString = await adapter.signMessage(messageString);
    // Convert base58 signature string back to Uint8Array
    return new TextEncoder().encode(signatureString);
  },

  fetchBalance: async () => {
    const {publicKey} = get();
    if (!publicKey) {
      console.log('🔍 WalletStore: Cannot fetch balance - no public key');
      return;
    }

    try {
      console.log('🔍 WalletStore: Fetching SOL balance for:', publicKey.toString().slice(0, 8) + '...');
      
      // Use Solana RPC to get real balance
      const connection = new (await import('@solana/web3.js')).Connection(
        'https://api.mainnet-beta.solana.com', // Mainnet RPC
        'confirmed'
      );
      
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1000000000; // Convert lamports to SOL
      
      console.log('✅ WalletStore: Balance fetched:', {
        lamports: balance,
        sol: solBalance.toFixed(4)
      });
      
      set({balance: solBalance});
    } catch (error) {
      console.error('❌ WalletStore: Failed to fetch balance:', error);
      // Don't set balance to null on error, keep the previous value
    }
  },
}));
