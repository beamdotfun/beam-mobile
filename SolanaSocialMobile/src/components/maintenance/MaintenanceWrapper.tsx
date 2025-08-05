import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {useMaintenanceStore} from '../../store/maintenanceStore';
import {useThemeStore} from '../../store/themeStore';
import {useMaintenanceCheck} from '../../hooks/useMaintenanceCheck';
import MaintenanceScreen from '../../screens/MaintenanceScreen';

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export function MaintenanceWrapper({children}: MaintenanceWrapperProps) {
  const {colors} = useThemeStore();
  const {
    isMaintenanceMode,
    maintenanceReason,
    isCheckingMaintenance,
    checkMaintenanceStatus,
    exitMaintenanceMode,
  } = useMaintenanceStore();
  
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // Enable periodic health checks every 5 minutes (300 seconds)
  useMaintenanceCheck({
    interval: 5 * 60 * 1000, // 5 minutes in milliseconds
    enablePeriodicCheck: true,
    checkOnMount: false, // We handle initial check manually below
  });

  // Perform initial maintenance check on app load
  useEffect(() => {
    const performInitialCheck = async () => {
      console.log('🏥 MaintenanceWrapper: Performing initial maintenance check...');
      
      try {
        await checkMaintenanceStatus();
      } catch (error) {
        console.error('🏥 MaintenanceWrapper: Initial check failed:', error);
      } finally {
        setIsInitialCheck(false);
      }
    };

    performInitialCheck();
  }, [checkMaintenanceStatus]);

  // Show loading screen during initial health check
  if (isInitialCheck && isCheckingMaintenance) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show maintenance screen if maintenance mode is active
  if (isMaintenanceMode && maintenanceReason !== 'none') {
    return (
      <MaintenanceScreen
        onMaintenanceComplete={exitMaintenanceMode}
        reason={maintenanceReason}
      />
    );
  }

  // Show normal app content
  return <>{children}</>;
}