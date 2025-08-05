import {useEffect, useRef} from 'react';
import {useMaintenanceStore} from '../store/maintenanceStore';
import {HealthService} from '../services/api/health';

interface UseMaintenanceCheckOptions {
  /** Interval in milliseconds for periodic checks (default: 60000 = 1 minute) */
  interval?: number;
  /** Whether to perform periodic checks (default: false) */
  enablePeriodicCheck?: boolean;
  /** Whether to check immediately on mount (default: false) */
  checkOnMount?: boolean;
}

/**
 * Hook for managing maintenance status checks
 * Can be used by components that need to periodically check maintenance status
 */
export function useMaintenanceCheck(options: UseMaintenanceCheckOptions = {}) {
  const {
    interval = 60000, // 1 minute default
    enablePeriodicCheck = false,
    checkOnMount = false,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout>();
  const {checkMaintenanceStatus, isMaintenanceMode, maintenanceReason} = useMaintenanceStore();

  // Perform check on mount if requested
  useEffect(() => {
    if (checkOnMount) {
      checkMaintenanceStatus();
    }
  }, [checkOnMount, checkMaintenanceStatus]);

  // Setup periodic checking if enabled
  useEffect(() => {
    if (enablePeriodicCheck) {
      console.log(`🏥 useMaintenanceCheck: Starting periodic health checks every ${interval}ms`);
      
      const performPeriodicCheck = async () => {
        try {
          // Use quick health check for periodic checks to avoid retries
          const healthData = await HealthService.quickHealthCheck();
          
          if (healthData !== null) {
            // Update maintenance state based on response
            const isInMaintenance = healthData.under_maintenance;
            const currentState = useMaintenanceStore.getState();
            
            // Only update if state has changed to avoid unnecessary re-renders
            if (currentState.isMaintenanceMode !== isInMaintenance) {
              console.log('🏥 useMaintenanceCheck: Maintenance status changed:', {
                from: currentState.isMaintenanceMode,
                to: isInMaintenance
              });
              
              if (isInMaintenance) {
                useMaintenanceStore.getState().setMaintenanceMode(true, 'maintenance_flag');
              } else {
                useMaintenanceStore.getState().exitMaintenanceMode();
              }
            }
          } else {
            // If quick check fails, don't immediately assume maintenance
            // Let the user manually retry or wait for next periodic check
            console.warn('🏥 useMaintenanceCheck: Periodic health check failed (quick check)');
          }
        } catch (error) {
          console.warn('🏥 useMaintenanceCheck: Periodic check error:', error);
        }
      };

      // Start periodic checking
      intervalRef.current = setInterval(performPeriodicCheck, interval);

      return () => {
        if (intervalRef.current) {
          console.log('🏥 useMaintenanceCheck: Stopping periodic health checks');
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enablePeriodicCheck, interval]);

  // Manual check function
  const manualCheck = async () => {
    await checkMaintenanceStatus();
  };

  return {
    isMaintenanceMode,
    maintenanceReason,
    manualCheck,
  };
}