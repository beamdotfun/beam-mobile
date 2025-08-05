// Network configuration
export const NETWORKS = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
  TESTNET: 'testnet',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  MAINNET: 'https://api.beam.fun',
  DEVNET: 'https://dev-api.beam.fun',
  LOCAL: 'http://10.150.1.33:8069', // For physical Android device
} as const;

// Solana RPC endpoints
export const RPC_ENDPOINTS = {
  MAINNET: 'https://api.mainnet-beta.solana.com',
  DEVNET: 'https://api.devnet.solana.com',
  TESTNET: 'https://api.testnet.solana.com',
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: 'Beam',
  VERSION: '1.0.0',
  BUNDLE_ID: 'com.beam.mobile',
} as const;

// Feature flags
export const FEATURES = {
  DUAL_DATA_SOURCE: true,
  OFFLINE_MODE: true,
  PUSH_NOTIFICATIONS: true,
  HAPTIC_FEEDBACK: true,
} as const;
