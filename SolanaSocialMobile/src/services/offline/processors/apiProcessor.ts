import {QueueItem} from '../queueStorage';
import {API_CONFIG} from '../../../config/api';

interface ApiQueueData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth: boolean;
  conflictResolution?: 'overwrite' | 'merge' | 'skip';
  idempotencyKey?: string;
  metadata?: {
    type: string;
    description: string;
    retryable?: boolean;
  };
}

class ApiProcessor {
  async process(item: QueueItem): Promise<any> {
    const data = item.data as ApiQueueData;

    try {
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...data.headers,
      };

      // Add authentication if required
      if (data.requiresAuth) {
        // TODO: Integrate with auth service when available
        // const token = await authService.getAccessToken();
        // headers['Authorization'] = `Bearer ${token}`;
        console.log('Auth required but not implemented yet');
      }

      // Add idempotency key to prevent duplicate operations
      if (data.idempotencyKey) {
        headers['Idempotency-Key'] = data.idempotencyKey;
      }

      // Make the API request using fetch
      const url = `${API_CONFIG.BASE_URL}${data.endpoint}`;

      const response = await fetch(url, {
        method: data.method,
        headers,
        body: data.body ? JSON.stringify(data.body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();

      console.log(`API request completed: ${data.method} ${data.endpoint}`);
      return responseData;
    } catch (error: any) {
      console.error(
        `API request failed: ${data.method} ${data.endpoint}`,
        error,

      // Check if this is a retryable error
      if (this.isRetryableError(error, data)) {
        throw error; // Will be retried by queue processor
      } else {
        // Mark as permanently failed
        throw new Error(`Non-retryable error: ${error.message}`);
      }
    }
  }

  private isRetryableError(error: any, data: ApiQueueData): boolean {
    // Network errors are retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.message.includes('HTTP 5')) {
      return true;
    }

    // Rate limiting is retryable
    if (error.message.includes('HTTP 429')) {
      return true;
    }

    // Specific metadata can override retryability
    if (data.metadata?.retryable !== undefined) {
      return data.metadata.retryable;
    }

    // Client errors (4xx) are generally not retryable
    if (error.message.includes('HTTP 4')) {
      return false;
    }

    // Default to retryable for unknown errors
    return true;
  }

  // Helper method to create API queue items
  static createQueueItem(
    method: ApiQueueData['method'],
    endpoint: string,
    options: Partial<Omit<ApiQueueData, 'method' | 'endpoint'>> = {},
  ) {
    return {
      type: 'api_request' as const,
      priority: options.metadata?.type === 'urgent' ? 9 : 5,
      maxRetries: 3,
      data: {
        method,
        endpoint,
        requiresAuth: true,
        ...options,
      } as ApiQueueData,
    };
  }
}

export const apiProcessor = new ApiProcessor();
