import {api} from './index';
import {
  Transaction,
  TransactionFilter,
  TransactionStats,
  TransactionResponse,
  TransactionDetailResponse,
  ExportTransactionResponse,
  TransactionType,
  TransactionStatus,
} from '@/types/transactions';

export class TransactionService {
  /**
   * Fetch user transactions with filtering and pagination
   */
  static async getUserTransactions(
    wallet: string,
    options?: {
      page?: number;
      limit?: number;
      filters?: TransactionFilter;
    },
  ): Promise<TransactionResponse['data']> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);

    if (options?.page) {
      params.append('page', options.page.toString());
    }

    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    // Apply filters
    if (options?.filters) {
      const {filters} = options;

      if (filters.types?.length) {
        params.append('types', filters.types.join(','));
      }

      if (filters.status) {
        params.append('status', filters.status);
      }

      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }

      if (filters.search) {
        params.append('search', filters.search);
      }
    }

    const response = await api.get<TransactionResponse>(
      `/blockchain/transactions?${params.toString()}`,
    );

    return response.data.data;
  }

  /**
   * Get detailed transaction information by signature
   */
  static async getTransactionDetails(signature: string): Promise<Transaction> {
    const response = await api.get<TransactionDetailResponse>(
      `/blockchain/transaction/${signature}`,
    );

    return response.data.data;
  }

  /**
   * Get transaction statistics for a user
   */
  static async getTransactionStats(
    wallet: string,
    filters?: TransactionFilter,
  ): Promise<TransactionStats> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);

    if (filters) {
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }

      if (filters.types?.length) {
        params.append('types', filters.types.join(','));
      }
    }

    const response = await api.get(
      `/blockchain/transactions/stats?${params.toString()}`,
    );

    return response.data.data;
  }

  /**
   * Export transaction data
   */
  static async exportTransactions(
    wallet: string,
    options: {
      format: 'csv' | 'json';
      filters?: TransactionFilter;
      signatures?: string[];
    },
  ): Promise<ExportTransactionResponse['data']> {
    const response = await api.post<ExportTransactionResponse>(
      '/blockchain/transactions/export',
      {
        wallet,
        format: options.format,
        filters: options.filters,
        signatures: options.signatures,
      },
    );

    return response.data.data;
  }

  /**
   * Search transactions by various criteria
   */
  static async searchTransactions(
    wallet: string,
    query: string,
    options?: {
      limit?: number;
      types?: TransactionType[];
    },
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('q', query);

    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    if (options?.types?.length) {
      params.append('types', options.types.join(','));
    }

    const response = await api.get(
      `/blockchain/transactions/search?${params.toString()}`,
    );

    return response.data.data;
  }

  /**
   * Get recent transactions for a user
   */
  static async getRecentTransactions(
    wallet: string,
    limit: number = 10,
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('limit', limit.toString());
    params.append('recent', 'true');

    const response = await api.get(
      `/blockchain/transactions?${params.toString()}`,
    );

    return response.data.data.transactions;
  }

  /**
   * Get pending transactions for a user
   */
  static async getPendingTransactions(wallet: string): Promise<Transaction[]> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('status', 'pending');

    const response = await api.get(
      `/blockchain/transactions?${params.toString()}`,
    );

    return response.data.data.transactions;
  }

  /**
   * Get failed transactions for a user
   */
  static async getFailedTransactions(
    wallet: string,
    limit: number = 20,
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('status', 'failed');
    params.append('limit', limit.toString());

    const response = await api.get(
      `/blockchain/transactions?${params.toString()}`,
    );

    return response.data.data.transactions;
  }

  /**
   * Get transactions by type
   */
  static async getTransactionsByType(
    wallet: string,
    type: TransactionType,
    options?: {
      limit?: number;
      page?: number;
    },
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('types', type);

    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    if (options?.page) {
      params.append('page', options.page.toString());
    }

    const response = await api.get(
      `/blockchain/transactions?${params.toString()}`,
    );

    return response.data.data.transactions;
  }

  /**
   * Get transaction summary for date range
   */
  static async getTransactionSummary(
    wallet: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalTransactions: number;
    totalFees: number;
    totalAmount: number;
    byType: Record<TransactionType, number>;
    byStatus: Record<TransactionStatus, number>;
  }> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());
    params.append('summary', 'true');

    const response = await api.get(
      `/blockchain/transactions/summary?${params.toString()}`,
    );

    return response.data.data;
  }


  /**
   * Refresh transaction status (force check on blockchain)
   */
  static async refreshTransactionStatus(
    signature: string,
  ): Promise<Transaction> {
    const response = await api.post(
      `/blockchain/transaction/${signature}/refresh`,
    );
    return response.data.data;
  }

  /**
   * Get transaction analytics for admin/insights
   */
  static async getTransactionAnalytics(
    wallet: string,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month',
  ): Promise<{
    totalVolume: number;
    averageTransactionSize: number;
    peakTransactionTimes: Array<{hour: number; count: number}>;
    typeDistribution: Record<TransactionType, number>;
    feeAnalysis: {
      total: number;
      average: number;
      min: number;
      max: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('wallet', wallet);
    params.append('timeframe', timeframe);

    const response = await api.get(
      `/blockchain/transactions/analytics?${params.toString()}`,
    );

    return response.data.data;
  }

  /**
   * Get platform-wide transaction metrics (admin only)
   */
  static async getPlatformTransactionMetrics(): Promise<{
    totalTransactions: number;
    dailyTransactionCount: number;
    averageBlockTime: number;
    networkFees: number;
    topTransactionTypes: Array<{type: TransactionType; count: number}>;
  }> {
    const response = await api.get('/blockchain/transactions/platform-metrics');
    return response.data.data;
  }

  /**
   * Estimate transaction fees
   */
  static async estimateTransactionFee(
    transactionType: TransactionType,
    additionalData?: any,
  ): Promise<{
    estimatedFee: number; // in lamports
    estimatedFeeSOL: number;
    priority: 'low' | 'medium' | 'high';
  }> {
    const response = await api.post('/blockchain/transactions/estimate-fee', {
      type: transactionType,
      data: additionalData,
    });

    return response.data.data;
  }

  /**
   * Get transaction health status
   */
  static async getTransactionHealthStatus(): Promise<{
    processingDelay: number; // seconds
    successRate: number; // percentage
    averageFee: number; // SOL
    networkCongestion: 'low' | 'medium' | 'high';
  }> {
    const response = await api.get('/blockchain/transactions/health');
    return response.data.data;
  }
}
