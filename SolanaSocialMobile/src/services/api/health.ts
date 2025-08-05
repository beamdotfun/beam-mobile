import api from './client';
import {ApiResponse} from './types';

interface HealthCheckResponse {
  status: string;
  under_maintenance: boolean;
  components?: {
    database?: any;
    redis?: any;
  };
  version?: string;
  uptime_seconds?: number;
  start_time?: number;
  memory_usage_mb?: number;
  goroutine_count?: number;
}

export class HealthService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Check if the app should be in maintenance mode
   * Tries up to 3 times before assuming the backend is down
   */
  static async checkMaintenanceStatus(): Promise<{
    isMaintenanceMode: boolean;
    reason: 'maintenance_flag' | 'backend_down' | 'none';
  }> {
    console.log('🏥 HealthService: Starting maintenance status check...');

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🏥 HealthService: Attempt ${attempt}/${this.MAX_RETRIES}`);
        
        const response = await api.get<ApiResponse<HealthCheckResponse> | HealthCheckResponse>('/health');
        
        let healthData: HealthCheckResponse | null = null;
        
        if (response.ok) {
          // Handle multiple response formats:
          // 1. Standard API format: {success: true, data: {under_maintenance: boolean}}
          // 2. Direct format: {under_maintenance: boolean}
          // 3. Health status format: {status: 'healthy', under_maintenance: boolean}
          if (response.data?.success && (response.data as ApiResponse<HealthCheckResponse>).data) {
            healthData = (response.data as ApiResponse<HealthCheckResponse>).data;
            console.log('🏥 HealthService: Health check successful (API format):', healthData);
          } else if (response.data && typeof (response.data as HealthCheckResponse).under_maintenance === 'boolean') {
            healthData = response.data as HealthCheckResponse;
            console.log('🏥 HealthService: Health check successful (direct format):', healthData);
          }
          
          if (healthData) {
            if (healthData.under_maintenance) {
              console.log('🚧 HealthService: Maintenance mode ACTIVE via backend flag');
              return {
                isMaintenanceMode: true,
                reason: 'maintenance_flag'
              };
            } else {
              console.log('✅ HealthService: App operational, maintenance mode OFF');
              return {
                isMaintenanceMode: false,
                reason: 'none'
              };
            }
          } else {
            console.warn(`🏥 HealthService: Invalid response format on attempt ${attempt}:`, response);
          }
        } else {
          console.warn(`🏥 HealthService: Response not OK on attempt ${attempt}:`, response);
        }
      } catch (error) {
        console.warn(`🏥 HealthService: Attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, consider backend down
        if (attempt === this.MAX_RETRIES) {
          console.error('🚨 HealthService: All health check attempts failed - assuming backend down');
          return {
            isMaintenanceMode: true,
            reason: 'backend_down'
          };
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < this.MAX_RETRIES) {
          console.log(`🏥 HealthService: Waiting ${this.RETRY_DELAY}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    // Fallback - should never reach here but just in case
    console.error('🚨 HealthService: Unexpected end of health check - assuming backend down');
    return {
      isMaintenanceMode: true,
      reason: 'backend_down'
    };
  }

  /**
   * Perform a single health check without retries
   * Useful for periodic checks after app has loaded
   */
  static async quickHealthCheck(): Promise<HealthCheckResponse | null> {
    try {
      const response = await api.get<ApiResponse<HealthCheckResponse> | HealthCheckResponse>('/health');
      
      if (response.ok) {
        // Handle multiple response formats
        if (response.data?.success && (response.data as ApiResponse<HealthCheckResponse>).data) {
          return (response.data as ApiResponse<HealthCheckResponse>).data;
        } else if (response.data && typeof (response.data as HealthCheckResponse).under_maintenance === 'boolean') {
          return response.data as HealthCheckResponse;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('🏥 HealthService: Quick health check failed:', error);
      return null;
    }
  }
}