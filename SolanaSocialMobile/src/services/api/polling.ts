import {api} from './index';
import {getAuthToken} from './tokenManager';
import {Post} from '../../types/social';

// Response type from the polling endpoints
interface PollUpdateResponse {
  success: boolean;
  data: {
    posts: any[]; // Raw posts from API
    count: number;
    since: string;
    has_more: boolean;
    server_time: number;
  };
}

// Rate limit tracking
interface RateLimitInfo {
  remaining: number;
  reset: number;
  retryAfter?: number;
}

class PollingService {
  private rateLimitInfo: RateLimitInfo = {
    remaining: 120,
    reset: Date.now() + 60000,
  };
  
  private backoffMultiplier = 1;
  private maxBackoff = 8;
  private baseInterval = 30000; // 30 seconds as recommended
  
  /**
   * Poll for new posts in the recent feed
   * @param since - Post signature to get updates after (optional)
   * @param limit - Number of posts to return (default: 20, max: 50)
   */
  async pollRecentFeed(since?: string, limit = 20): Promise<PollUpdateResponse> {
    const params: any = { limit };
    if (since) {
      params.since = since;
    }
    
    console.log('[PollingService] Polling recent feed:', { since, limit });
    
    try {
      const response = await api.get<PollUpdateResponse>(
        '/recent/updates',
        params
      );
      
      // Extract rate limit headers
      this.updateRateLimitInfo(response);
      
      if (response.status === 429) {
        // Rate limited
        const retryAfter = parseInt(response.headers?.['retry-after'] || '60');
        this.handleRateLimit(retryAfter);
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }
      
      if (!response.ok) {
        throw new Error(response.problem || 'Failed to poll recent feed');
      }
      
      // Reset backoff on success
      this.backoffMultiplier = 1;
      
      console.log('[PollingService] Recent feed poll successful:', {
        count: response.data?.data?.count || 0,
        has_more: response.data?.data?.has_more || false,
      });
      
      return response.data!;
    } catch (error) {
      console.error('[PollingService] Recent feed poll error:', error);
      this.increaseBackoff();
      throw error;
    }
  }
  
  /**
   * Poll for new posts in the watchlist feed (requires auth)
   * @param since - Post signature to get updates after (optional)
   * @param limit - Number of posts to return (default: 20, max: 50)
   */
  async pollWatchlistFeed(since?: string, limit = 20): Promise<PollUpdateResponse> {
    const params: any = { limit };
    if (since) {
      params.since = since;
    }
    
    // Check if authenticated
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error('Authentication required for watchlist polling');
    }
    
    console.log('[PollingService] Polling watchlist feed:', { since, limit });
    
    try {
      const response = await api.get<PollUpdateResponse>(
        '/watchlist/updates',
        params
      );
      
      // Extract rate limit headers
      this.updateRateLimitInfo(response);
      
      if (response.status === 429) {
        // Rate limited
        const retryAfter = parseInt(response.headers?.['retry-after'] || '60');
        this.handleRateLimit(retryAfter);
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }
      
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        throw new Error(response.problem || 'Failed to poll watchlist feed');
      }
      
      // Reset backoff on success
      this.backoffMultiplier = 1;
      
      console.log('[PollingService] Watchlist feed poll successful:', {
        count: response.data?.data?.count || 0,
        has_more: response.data?.data?.has_more || false,
      });
      
      return response.data!;
    } catch (error) {
      console.error('[PollingService] Watchlist feed poll error:', error);
      this.increaseBackoff();
      throw error;
    }
  }
  
  /**
   * Get the current polling interval with backoff applied
   */
  getPollingInterval(): number {
    return this.baseInterval * this.backoffMultiplier;
  }
  
  /**
   * Check if we should throttle requests based on rate limit
   */
  shouldThrottle(): boolean {
    // Proactive throttling when remaining requests are low
    if (this.rateLimitInfo.remaining < 10) {
      const waitTime = this.rateLimitInfo.reset - Date.now();
      if (waitTime > 0) {
        console.warn(`[PollingService] Low rate limit (${this.rateLimitInfo.remaining} remaining). Should wait ${waitTime}ms`);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get recommended wait time before next request
   */
  getWaitTime(): number {
    if (this.rateLimitInfo.retryAfter) {
      return this.rateLimitInfo.retryAfter * 1000;
    }
    
    if (this.shouldThrottle()) {
      const waitTime = this.rateLimitInfo.reset - Date.now();
      return Math.min(waitTime, 5000); // Cap at 5 seconds
    }
    
    return 0;
  }
  
  /**
   * Reset backoff multiplier
   */
  resetBackoff() {
    this.backoffMultiplier = 1;
  }
  
  private updateRateLimitInfo(response: any) {
    const headers = response.headers || {};
    
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo.remaining = parseInt(headers['x-ratelimit-remaining']);
    }
    
    if (headers['x-ratelimit-reset']) {
      this.rateLimitInfo.reset = parseInt(headers['x-ratelimit-reset']) * 1000;
    }
    
    if (headers['retry-after']) {
      this.rateLimitInfo.retryAfter = parseInt(headers['retry-after']);
    }
    
    console.log('[PollingService] Rate limit info updated:', this.rateLimitInfo);
  }
  
  private handleRateLimit(retryAfter: number) {
    this.rateLimitInfo.retryAfter = retryAfter;
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, this.maxBackoff);
    console.warn(`[PollingService] Rate limited. Backing off to ${this.backoffMultiplier}x interval`);
  }
  
  private increaseBackoff() {
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, this.maxBackoff);
    console.log(`[PollingService] Increased backoff to ${this.backoffMultiplier}x`);
  }
}

// Export singleton instance
export const pollingService = new PollingService();