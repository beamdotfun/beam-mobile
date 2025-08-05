import {create} from 'zustand';
import {HealthService} from '../services/api/health';

interface MaintenanceState {
  isMaintenanceMode: boolean;
  maintenanceReason: 'maintenance_flag' | 'backend_down' | 'none';
  isCheckingMaintenance: boolean;
  lastHealthCheck: Date | null;
  
  // Actions
  checkMaintenanceStatus: () => Promise<void>;
  setMaintenanceMode: (isMaintenanceMode: boolean, reason: 'maintenance_flag' | 'backend_down' | 'none') => void;
  exitMaintenanceMode: () => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  isMaintenanceMode: false,
  maintenanceReason: 'none',
  isCheckingMaintenance: false,
  lastHealthCheck: null,

  checkMaintenanceStatus: async () => {
    const {isCheckingMaintenance} = get();
    
    // Prevent multiple simultaneous checks
    if (isCheckingMaintenance) {
      console.log('🏥 MaintenanceStore: Health check already in progress, skipping...');
      return;
    }

    console.log('🏥 MaintenanceStore: Starting maintenance status check...');
    set({isCheckingMaintenance: true});

    try {
      const result = await HealthService.checkMaintenanceStatus();
      
      set({
        isMaintenanceMode: result.isMaintenanceMode,
        maintenanceReason: result.reason,
        lastHealthCheck: new Date(),
        isCheckingMaintenance: false,
      });

      console.log('🏥 MaintenanceStore: Health check completed:', {
        isMaintenanceMode: result.isMaintenanceMode,
        reason: result.reason
      });

    } catch (error) {
      console.error('🏥 MaintenanceStore: Health check failed:', error);
      
      // On error, assume backend is down and enable maintenance mode
      set({
        isMaintenanceMode: true,
        maintenanceReason: 'backend_down',
        lastHealthCheck: new Date(),
        isCheckingMaintenance: false,
      });
    }
  },

  setMaintenanceMode: (isMaintenanceMode: boolean, reason: 'maintenance_flag' | 'backend_down' | 'none') => {
    console.log('🏥 MaintenanceStore: Setting maintenance mode:', {isMaintenanceMode, reason});
    set({
      isMaintenanceMode,
      maintenanceReason: reason,
      lastHealthCheck: new Date(),
    });
  },

  exitMaintenanceMode: () => {
    console.log('🏥 MaintenanceStore: Exiting maintenance mode');
    set({
      isMaintenanceMode: false,
      maintenanceReason: 'none',
      lastHealthCheck: new Date(),
    });
  },
}));