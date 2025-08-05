import api from './client';
import { ApiResponse } from './types';

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  usdValue: number;
  usdPrice: number;
  isNative: boolean;
  isVerified: boolean;
  logoUri: string;
}

export interface WalletTokensResponse {
  wallet: string;
  tokens: TokenInfo[];
  totalUsdValue: number;
  tokenCount: number;
  filteredCount: number;
  lastUpdated: number;
}

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  price: number;
}

export class TipsAPIService {
  /**
   * Get user's wallet token balances
   */
  async getWalletTokens(walletAddress: string): Promise<WalletTokensResponse> {
    console.log('🔍 TipsAPI: Fetching wallet tokens for:', walletAddress);
    
    const response = await api.get<ApiResponse<WalletTokensResponse>>(
      `/wallets/${walletAddress}/tokens`
    );
    
    if (!response.ok) {
      console.error('🚨 TipsAPI: Failed to fetch wallet tokens:', response.problem);
      throw new Error(response.problem || 'Failed to fetch wallet tokens');
    }
    
    console.log('✅ TipsAPI: Wallet tokens fetched successfully');
    return response.data!.data;
  }

  /**
   * Get token metadata for multiple mints
   */
  async getTokenMetadata(mints: string[]): Promise<TokenMetadata[]> {
    console.log('🔍 TipsAPI: Fetching token metadata for:', mints.length, 'tokens');
    
    if (mints.length === 0) {
      throw new Error('At least one mint address is required');
    }
    
    if (mints.length > 50) {
      throw new Error('Maximum 50 mints per request');
    }
    
    const response = await api.post<ApiResponse<TokenMetadata[]>>(
      '/tokens/metadata',
      { mints }
    );
    
    if (!response.ok) {
      console.error('🚨 TipsAPI: Failed to fetch token metadata:', response.problem);
      throw new Error(response.problem || 'Failed to fetch token metadata');
    }
    
    console.log('✅ TipsAPI: Token metadata fetched successfully');
    return response.data!.data;
  }

  /**
   * Get available tokens for tipping (simplified implementation)
   */
  async getAvailableTokens(walletAddress: string): Promise<TokenInfo[]> {
    try {
      const walletData = await this.getWalletTokens(walletAddress);
      return walletData.tokens;
    } catch (error) {
      console.error('Failed to fetch available tokens:', error);
      return [];
    }
  }

  /**
   * Format token amount for display
   */
  formatTokenAmount(amount: number, decimals: number): string {
    const adjustedAmount = amount / Math.pow(10, decimals);
    
    if (adjustedAmount < 0.001) {
      return adjustedAmount.toExponential(2);
    }
    
    if (adjustedAmount < 1) {
      return adjustedAmount.toFixed(6);
    }
    
    if (adjustedAmount < 1000) {
      return adjustedAmount.toFixed(3);
    }
    
    return adjustedAmount.toLocaleString();
  }

  /**
   * Format USD value for display
   */
  formatUsdValue(usdValue: number): string {
    if (usdValue < 0.01) {
      return '<$0.01';
    }
    
    if (usdValue < 1) {
      return `$${usdValue.toFixed(3)}`;
    }
    
    return `$${usdValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Convert USD amount to token amount
   */
  usdToTokenAmount(usdAmount: number, tokenPrice: number, decimals: number): number {
    if (tokenPrice <= 0) return 0;
    const tokenAmount = usdAmount / tokenPrice;
    return Math.floor(tokenAmount * Math.pow(10, decimals));
  }

  /**
   * Convert token amount to USD
   */
  tokenToUsdAmount(tokenAmount: number, tokenPrice: number, decimals: number): number {
    const adjustedAmount = tokenAmount / Math.pow(10, decimals);
    return adjustedAmount * tokenPrice;
  }
}

// Export singleton instance
export const tipsAPI = new TipsAPIService();