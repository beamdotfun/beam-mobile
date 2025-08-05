import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RefreshCw, Wrench, Wifi, WifiOff} from 'lucide-react-native';
import {useThemeStore} from '../store/themeStore';
import {HealthService} from '../services/api/health';

interface MaintenanceScreenProps {
  onMaintenanceComplete: () => void;
  reason: 'maintenance_flag' | 'backend_down';
}

export default function MaintenanceScreen({
  onMaintenanceComplete,
  reason
}: MaintenanceScreenProps) {
  const {colors, isDark} = useThemeStore();
  const insets = useSafeAreaInsets();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const handleRetryCheck = async () => {
    setIsChecking(true);
    setLastCheckTime(new Date());
    
    try {
      const result = await HealthService.checkMaintenanceStatus();
      
      if (!result.isMaintenanceMode) {
        // Maintenance is over, notify parent to exit maintenance mode
        onMaintenanceComplete();
      }
    } catch (error) {
      console.error('MaintenanceScreen: Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-retry every 30 seconds for backend down scenarios
  useEffect(() => {
    if (reason === 'backend_down') {
      const interval = setInterval(() => {
        if (!isChecking) {
          handleRetryCheck();
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [reason, isChecking]);

  const getMaintenanceContent = () => {
    if (reason === 'maintenance_flag') {
      return {
        icon: null,
        title: 'App Under Maintenance',
        subtitle: 'We\'re making some improvements',
        description: 'Beam is currently undergoing scheduled maintenance to improve your experience. We\'ll be back shortly!',
        autoRetry: false,
      };
    } else {
      return {
        icon: null,
        title: 'Unable to Connect',
        subtitle: 'Please check back soon',
        description: 'We\'re having trouble connecting to our servers. This may be due to maintenance or connectivity issues.',
        autoRetry: true,
      };
    }
  };

  const content = getMaintenanceContent();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logoContainer: {
      marginBottom: 32,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 20,
    },
    iconContainer: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
      marginBottom: 24,
    },
    description: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 40,
      maxWidth: 300,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    retryButtonDisabled: {
      backgroundColor: colors.muted,
    },
    retryButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },
    retryButtonTextDisabled: {
      color: colors.mutedForeground,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
    },
    statusText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginLeft: 8,
    },
    autoRetryText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
    footer: {
      paddingBottom: 32,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Maintenance Icon */}
        {content.icon && (
          <View style={styles.iconContainer}>
            {content.icon}
          </View>
        )}

        {/* Title and Description */}
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
        <Text style={styles.description}>{content.description}</Text>

        {/* Retry Button */}
        <Pressable
          style={({pressed}) => [
            styles.retryButton,
            isChecking && styles.retryButtonDisabled,
            pressed && !isChecking && {opacity: 0.8},
          ]}
          onPress={handleRetryCheck}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <RefreshCw size={20} color={colors.primaryForeground} />
          )}
          <Text style={[
            styles.retryButtonText,
            isChecking && styles.retryButtonTextDisabled,
          ]}>
            {isChecking ? 'Checking...' : 'Try Again'}
          </Text>
        </Pressable>

        {/* Status Indicator */}
        {lastCheckTime && (
          <View style={styles.statusContainer}>
            <Wifi size={16} color={colors.mutedForeground} />
            <Text style={styles.statusText}>
              Last checked: {lastCheckTime.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Auto-retry message for backend down */}
        {content.autoRetry && (
          <Text style={styles.autoRetryText}>
            Automatically retrying every 30 seconds...
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for your patience
        </Text>
      </View>
    </View>
  );
}