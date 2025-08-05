import {create, ApiResponse as ApisauceResponse} from 'apisauce';
import {API_CONFIG} from '../../config/api';
import {useOfflineStore} from '../../store/offlineStore';
import {Platform} from 'react-native';

// Base API configuration
const baseApi = create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management (will be implemented with wallet integration)
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// Enhanced API client with offline support
class OfflineAwareAPIClient {
  private baseApi = baseApi;

  constructor() {
    // Request interceptor for authentication
    this.baseApi.addRequestTransform(request => {
      // Add auth token if available
      const authToken = getAuthToken();
      console.log('API Client - Auth token available:', !!authToken, 'URL:', request.url);
      if (authToken && request.headers) {
        request.headers.Authorization = `Bearer ${authToken}`;
        console.log('API Client - Added Authorization header for:', request.url);
      } else {
        console.log('API Client - No auth token or headers for:', request.url, 'Token:', !!authToken, 'Headers:', !!request.headers);
      }
    });

    // Response interceptor for error handling and token refresh
    this.baseApi.addResponseTransform(async response => {
      if (!response.ok) {
        console.error('API Error:', response.problem, response.data);

        // Handle token expiration with automatic refresh
        if (response.status === 401 && authToken) {
          console.log('Access token expired, attempting refresh...');
          try {
            await this.handleTokenRefresh();
            // Don't retry here - let the calling code handle retry logic
          } catch (error) {
            console.error('Token refresh failed:', error);
            await this.handleAuthenticationError();
          }
        }
      }
    });
  }

  private async handleTokenRefresh() {
    // Import dynamically to avoid circular dependencies
    const {useAuthStore} = await import('../../store/auth');
    const {authAPI} = await import('./auth');
    
    const {refreshToken} = useAuthStore.getState();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('Attempting token refresh...');
    const authResponse = await authAPI.refreshToken(refreshToken);
    
    if (authResponse.success && authResponse.token) {
      // Update the token in the API client
      setAuthToken(authResponse.token);
      
      // Update the auth store with new token
      useAuthStore.setState({
        token: authResponse.token,
        user: authResponse.user || useAuthStore.getState().user,
      });
      
      console.log('Token refresh successful');
      return authResponse.token;
    }
    
    throw new Error('Token refresh failed');
  }

  private async handleAuthenticationError() {
    // Import dynamically to avoid circular dependencies
    const {useAuthStore} = await import('../../store/auth');
    const {signOut} = useAuthStore.getState();

    console.warn('Authentication error - signing out user');
    await signOut();
  }

  async get<T>(
    endpoint: string,
    params?: any,
    config?: any,
  ): Promise<ApisauceResponse<T>> {
    const {isOnline, getCachedData, setCachedData} = useOfflineStore.getState();
    const cacheKey = `GET_${endpoint}_${JSON.stringify(params || {})}`;

    // Check cache first if offline or using cache-first strategy
    if (!isOnline) {
      const cached = await getCachedData<T>(cacheKey);
      if (cached) {
        return {
          ok: true,
          status: 200,
          data: cached,
          headers: {},
          config: {},
          duration: 0,
          problem: null,
          originalError: null,
        };
      }
    }

    try {
      // Make the actual request
      console.log('🔍 API Client: Making GET request:', {
        endpoint,
        params,
        baseURL: this.baseApi.axiosInstance?.defaults?.baseURL || API_CONFIG.BASE_URL,
        fullURL: `${API_CONFIG.BASE_URL}${endpoint}`,
        hasAuthToken: !!authToken,
      });
      
      const response = await this.baseApi.get<T>(endpoint, params, config);
      
      console.log('🔍 API Client: Response received:', {
        endpoint,
        ok: response.ok,
        status: response.status,
        problem: response.problem,
        hasData: !!response.data,
      });

      // Cache successful GET responses
      if (response.ok && response.data) {
        await setCachedData(cacheKey, response.data);
      }

      return response;
    } catch (error) {
      console.error('🔴 API Client: Request error:', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
      });
      // If network error and GET request, try cache
      const cached = await getCachedData<T>(cacheKey);
      if (cached) {
        return {
          ok: true,
          status: 200,
          data: cached,
          headers: {},
          config: {},
          duration: 0,
          problem: null,
          originalError: null,
        };
      }

      throw error;
    }
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: any,
  ): Promise<ApisauceResponse<T>> {
    const {isOnline, addToSyncQueue} = useOfflineStore.getState();

    // If offline, queue the operation
    if (!isOnline) {
      addToSyncQueue({
        type: this.getResourceType(endpoint),
        action: 'create',
        data,
      });

      // Return optimistic response
      return {
        ok: true,
        status: 202, // Accepted
        data: {queued: true, ...data} as T,
        headers: {},
        config: {},
        duration: 0,
        problem: null,
        originalError: null,
      };
    }

    return this.baseApi.post<T>(endpoint, data, config);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: any,
  ): Promise<ApisauceResponse<T>> {
    const {isOnline, addToSyncQueue} = useOfflineStore.getState();

    // If offline, queue the operation
    if (!isOnline) {
      addToSyncQueue({
        type: this.getResourceType(endpoint),
        action: 'update',
        data,
      });

      // Return optimistic response
      return {
        ok: true,
        status: 202, // Accepted
        data: {queued: true, ...data} as T,
        headers: {},
        config: {},
        duration: 0,
        problem: null,
        originalError: null,
      };
    }

    return this.baseApi.put<T>(endpoint, data, config);
  }

  async delete<T>(
    endpoint: string,
    config?: any,
  ): Promise<ApisauceResponse<T>> {
    const {isOnline, addToSyncQueue} = useOfflineStore.getState();

    // If offline, queue the operation
    if (!isOnline) {
      addToSyncQueue({
        type: this.getResourceType(endpoint),
        action: 'delete',
        data: {endpoint},
      });

      // Return optimistic response
      return {
        ok: true,
        status: 202, // Accepted
        data: {queued: true} as T,
        headers: {},
        config: {},
        duration: 0,
        problem: null,
        originalError: null,
      };
    }

    return this.baseApi.delete<T>(endpoint, config);
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: any,
  ): Promise<ApisauceResponse<T>> {
    const {isOnline, addToSyncQueue} = useOfflineStore.getState();

    // If offline, queue the operation
    if (!isOnline) {
      addToSyncQueue({
        type: this.getResourceType(endpoint),
        action: 'update',
        data,
      });

      // Return optimistic response
      return {
        ok: true,
        status: 202, // Accepted
        data: {queued: true, ...data} as T,
        headers: {},
        config: {},
        duration: 0,
        problem: null,
        originalError: null,
      };
    }

    return this.baseApi.patch<T>(endpoint, data, config);
  }

  private getResourceType(
    endpoint: string,
  ): 'post' | 'comment' | 'vote' | 'tip' | 'follow' | 'brand' | 'auction' {
    // Extract resource type from endpoint
    const segments = endpoint.split('/').filter(Boolean);
    const resource = segments[0];

    switch (resource) {
      case 'posts':
        return 'post';
      case 'comments':
        return 'comment';
      case 'votes':
        return 'vote';
      case 'tips':
        return 'tip';
      case 'follows':
      case 'users':
        return 'follow';
      case 'brands':
        return 'brand';
      case 'auctions':
        return 'auction';
      default:
        return 'post'; // Default fallback
    }
  }

  // Expose base API methods for direct access if needed
  setBaseURL = this.baseApi.setBaseURL;
  setHeader = this.baseApi.setHeader;
  setHeaders = this.baseApi.setHeaders;
  addRequestTransform = this.baseApi.addRequestTransform;
  addResponseTransform = this.baseApi.addResponseTransform;
  addAsyncRequestTransform = this.baseApi.addAsyncRequestTransform;
  addAsyncResponseTransform = this.baseApi.addAsyncResponseTransform;
}

// Create and export the enhanced API client instance
const api = new OfflineAwareAPIClient();

export default api;
