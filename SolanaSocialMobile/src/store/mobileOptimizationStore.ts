import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import DeviceInfo from "react-native-device-info";

// Mock DeviceInfo for now
const DeviceInfo = {
  getModel: () => Promise.resolve('Android'),
  getSystemName: () => Promise.resolve('Android'),
  hasGms: () => Promise.resolve(true),
  getTotalMemory: () => Promise.resolve(4 * 1024 * 1024 * 1024), // 4GB
  getFreeDiskStorage: () => Promise.resolve(16 * 1024 * 1024 * 1024), // 16GB
  getTotalDiskCapacity: () => Promise.resolve(64 * 1024 * 1024 * 1024), // 64GB
};
import {
  Dimensions,
  PixelRatio,
  AppState,
  DeviceEventEmitter,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  MobileCapabilities,
  PerformanceMetrics,
  MobileOptimizationSettings,
  SolanaMobileFeatures,
  PerformanceAlert,
  BiometricOptions,
  CustomGesture,
} from '@/types/mobile-optimizations';

interface MobileOptimizationState {
  // Device capabilities
  capabilities: MobileCapabilities | null;
  solanaMobileFeatures: SolanaMobileFeatures | null;

  // Performance monitoring
  performanceMetrics: PerformanceMetrics | null;
  performanceHistory: PerformanceMetrics[];
  performanceAlerts: PerformanceAlert[];

  // Optimization settings
  settings: MobileOptimizationSettings;

  // Runtime state
  isLowPerformanceMode: boolean;
  isLowBatteryMode: boolean;
  isLowMemoryMode: boolean;
  isSlowNetwork: boolean;

  // Actions
  initializeMobileFeatures: () => Promise<void>;
  detectCapabilities: () => Promise<void>;

  // Performance monitoring
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
  recordPerformanceMetric: (metric: string, value: number) => void;
  clearPerformanceAlerts: () => void;

  // Solana Mobile integration
  initializeSolanaFeatures: () => Promise<void>;
  connectMobileWallet: () => Promise<void>;
  useBiometricAuth: (options: BiometricOptions) => Promise<boolean>;

  // Optimization controls
  updateSettings: (updates: Partial<MobileOptimizationSettings>) => void;
  enablePerformanceMode: () => void;
  disablePerformanceMode: () => void;
  adaptToNetworkConditions: () => void;
  adaptToMemoryPressure: () => void;

  // Gesture handling
  registerGesture: (gesture: CustomGesture) => void;
  unregisterGesture: (gestureId: string) => void;
  registeredGestures: CustomGesture[];

  // App state management
  handleAppStateChange: (state: string) => void;
  optimizeForBackground: () => void;
  optimizeForForeground: () => void;
}

const defaultSettings: MobileOptimizationSettings = {
  enablePerformanceMode: false,
  adaptiveImageQuality: true,
  enableImageCaching: true,
  prefetchContent: true,
  reducedAnimations: false,
  backgroundSyncLimited: false,
  locationUpdatesOptimized: true,
  wifiOnlyMode: false,
  compressImages: true,
  limitVideoQuality: false,
  largeTextMode: false,
  highContrastMode: false,
  reduceMotion: false,
  voiceOverEnabled: false,
  enableSecureTransactions: true,
  useSeedVault: true,
  biometricAuthentication: true,
  enablePerformanceMonitoring: false,
  showPerformanceOverlay: false,
};

let performanceMonitoringInterval: NodeJS.Timeout | null = null;
let appStateListener: any = null;
let networkListener: any = null;
let memoryListener: any = null;

export const useMobileOptimizationStore = create<MobileOptimizationState>()(
  persist(
    (set, get) => ({
      capabilities: null,
      solanaMobileFeatures: null,
      performanceMetrics: null,
      performanceHistory: [],
      performanceAlerts: [],
      settings: defaultSettings,
      isLowPerformanceMode: false,
      isLowBatteryMode: false,
      isLowMemoryMode: false,
      isSlowNetwork: false,
      registeredGestures: [],

      initializeMobileFeatures: async () => {
        try {
          await get().detectCapabilities();
        } catch (error) {
          console.error('Failed to detect device capabilities:', error);
          // Continue with default capabilities if detection fails
        }

        try {
          await get().initializeSolanaFeatures();
        } catch (error) {
          console.error('Failed to initialize Solana features:', error);
          // Continue without Solana features if initialization fails
        }

        try {
          if (get().settings.enablePerformanceMonitoring) {
            get().startPerformanceMonitoring();
          }
        } catch (error) {
          console.error('Failed to start performance monitoring:', error);
        }

        // Clean up any existing listeners first
        if (appStateListener) {
          appStateListener.remove?.();
          appStateListener = null;
        }
        if (networkListener) {
          networkListener();
          networkListener = null;
        }
        if (memoryListener) {
          memoryListener.remove?.();
          memoryListener = null;
        }
        
        try {
          // Set up app state listener
          appStateListener = AppState.addEventListener('change', get().handleAppStateChange);
        } catch (error) {
          console.error('Failed to set up app state listener:', error);
        }

        try {
          // Set up network state listener
          networkListener = NetInfo.addEventListener(() => {
            get().adaptToNetworkConditions();
          });
        } catch (error) {
          console.error('Failed to set up network state listener:', error);
        }

        try {
          // Set up memory pressure listener
          memoryListener = DeviceEventEmitter.addListener('memoryWarning', () => {
            get().adaptToMemoryPressure();
          });
        } catch (error) {
          console.error('Failed to set up memory pressure listener:', error);
        }
      },

      detectCapabilities: async () => {
        try {
          const {width, height} = Dimensions.get('window');
          const scale = PixelRatio.get();
          const fontScale = PixelRatio.getFontScale();

          // Detect if this is a Solana phone
          const deviceModel = await DeviceInfo.getModel();
          const isSolanaPhone = deviceModel.toLowerCase().includes('saga');

          // Get network info
          const networkState = await NetInfo.fetch();

          const capabilities: MobileCapabilities = {
            deviceType: isSolanaPhone
              ? 'saga'
              : (await DeviceInfo.getSystemName()) === 'iOS'
              ? 'ios'
              : 'android',
            isSolanaPhone,
            hasSecureElement: isSolanaPhone,
            supportsBiometrics: await DeviceInfo.hasGms(),
            walletAdapterSupport: isSolanaPhone,
            seedVaultSupport: isSolanaPhone,
            mobileWalletSupport: true,
            hasNFC: await DeviceInfo.hasGms(),
            hasFingerprint: await DeviceInfo.hasGms(),
            hasFaceRecognition: false,
            hasGyroscope: true,
            hasAccelerometer: true,
            screenSize: {width, height, scale, fontScale},
            pixelDensity: PixelRatio.get(),
            safeAreaInsets: {top: 0, bottom: 0, left: 0, right: 0},
            memoryInfo: {
              totalMemory: await DeviceInfo.getTotalMemory(),
              availableMemory: await DeviceInfo.getFreeDiskStorage(),
              usedMemory: 0,
              memoryPressure: 'low',
            },
            storageInfo: {
              totalStorage: await DeviceInfo.getTotalDiskCapacity(),
              availableStorage: await DeviceInfo.getFreeDiskStorage(),
              usedStorage: 0,
              lowStorageWarning: false,
            },
            networkInfo: {
              connectionType: networkState.type as any,
              isConnected: networkState.isConnected || false,
              isExpensive: networkState.details?.isConnectionExpensive || false,
              bandwidth: 0,
              latency: 0,
            },
          };

          set({capabilities});
        } catch (error) {
          console.error('Failed to detect capabilities:', error);
        }
      },

      initializeSolanaFeatures: async () => {
        const capabilities = get().capabilities;
        if (!capabilities?.isSolanaPhone) {
          return;
        }

        try {
          // Initialize Solana Mobile features
          const features: SolanaMobileFeatures = {
            mobileWalletAdapter: {
              isAvailable: capabilities.walletAdapterSupport,
              supportedWallets: ['Phantom', 'Solflare', 'Glow'],
              currentWallet: undefined,
              connect: async () => {
                // Implementation would connect to mobile wallet
                console.log('Connecting to mobile wallet...');
              },
              disconnect: async () => {
                console.log('Disconnecting from mobile wallet...');
              },
              signTransaction: async transaction => {
                console.log('Signing transaction...');
                return transaction;
              },
              signAllTransactions: async transactions => {
                console.log('Signing all transactions...');
                return transactions;
              },
              signMessage: async message => {
                console.log('Signing message...');
                return message;
              },
            },
            seedVault: {
              isAvailable: capabilities.seedVaultSupport,
              isConfigured: false,
              storeSeed: async seed => {
                console.log('Storing seed in vault...');
              },
              retrieveSeed: async () => {
                console.log('Retrieving seed from vault...');
                return '';
              },
              deleteSeed: async () => {
                console.log('Deleting seed from vault...');
              },
              requiresBiometric: true,
              lastAccessed: undefined,
            },
            secureElement: {
              isAvailable: capabilities.hasSecureElement,
              isConfigured: false,
              generateKey: async keyId => {
                console.log('Generating key:', keyId);
              },
              signWithKey: async (keyId, data) => {
                console.log('Signing with key:', keyId);
                return data;
              },
              deleteKey: async keyId => {
                console.log('Deleting key:', keyId);
              },
              attestation: true,
              tamperDetection: true,
            },
            biometrics: {
              isAvailable: capabilities.supportsBiometrics,
              supportedTypes: ['fingerprint'],
              isEnrolled: false,
              authenticate: async options => {
                console.log('Authenticating with biometrics...');
                return {success: true};
              },
              checkBiometrics: async () => {
                return capabilities.supportsBiometrics;
              },
            },
            nfc: {
              isAvailable: capabilities.hasNFC,
              isEnabled: false,
              readTag: async () => {
                console.log('Reading NFC tag...');
                return {id: '', type: '', data: '', writable: false};
              },
              writeTag: async data => {
                console.log('Writing NFC tag:', data);
              },
              onTagDiscovered: callback => {
                console.log('Listening for NFC tags...');
              },
              onTagLost: callback => {
                console.log('Listening for NFC tag loss...');
              },
            },
            sensors: {
              accelerometer: {x: 0, y: 0, z: 0, timestamp: Date.now()},
              gyroscope: {x: 0, y: 0, z: 0, timestamp: Date.now()},
              magnetometer: {x: 0, y: 0, z: 0, timestamp: Date.now()},
              onShake: callback => {
                console.log('Listening for shake events...');
              },
              onTilt: callback => {
                console.log('Listening for tilt events...');
              },
              onMotion: callback => {
                console.log('Listening for motion events...');
              },
            },
          };

          set({solanaMobileFeatures: features});
        } catch (error) {
          console.error('Failed to initialize Solana features:', error);
        }
      },

      startPerformanceMonitoring: () => {
        if (performanceMonitoringInterval) {
          return;
        }

        performanceMonitoringInterval = setInterval(() => {
          const metrics: PerformanceMetrics = {
            frameRate: 60, // Would be measured from actual frame times
            droppedFrames: 0,
            renderTime: 16.67,
            jsHeapSize: 0,
            nativeHeapSize: 0,
            imageMemory: 0,
            apiResponseTimes: {},
            imageLoadTimes: [],
            cacheHitRatio: 0.85,
            appStartTime: 0,
            screenTransitionTimes: {},
            interactionResponseTimes: {},
            cpuUsage: 0.2,
            batteryLevel: 0.8,
            thermalState: 'nominal',
          };

          const history = get().performanceHistory;
          set({
            performanceMetrics: metrics,
            performanceHistory: [...history.slice(-99), metrics],
          });

          // Check for performance issues
          const alerts: PerformanceAlert[] = [];

          if (metrics.frameRate < 30) {
            alerts.push({
              id: `framerate-${Date.now()}`,
              type: 'framerate',
              severity: 'high',
              message: 'Low frame rate detected',
              timestamp: new Date().toISOString(),
              resolved: false,
            });
          }

          if (metrics.batteryLevel < 0.15) {
            alerts.push({
              id: `battery-${Date.now()}`,
              type: 'battery',
              severity: 'high',
              message: 'Low battery level',
              timestamp: new Date().toISOString(),
              resolved: false,
            });
          }

          if (alerts.length > 0) {
            set({performanceAlerts: [...get().performanceAlerts, ...alerts]});
          }
        }, 1000);
      },

      stopPerformanceMonitoring: () => {
        if (performanceMonitoringInterval) {
          clearInterval(performanceMonitoringInterval);
          performanceMonitoringInterval = null;
        }
      },

      recordPerformanceMetric: (metric: string, value: number) => {
        const metrics = get().performanceMetrics;
        if (!metrics) {
          return;
        }

        const updated = {...metrics};

        switch (metric) {
          case 'frameRate':
            updated.frameRate = value;
            break;
          case 'renderTime':
            updated.renderTime = value;
            break;
          case 'cpuUsage':
            updated.cpuUsage = value;
            break;
          case 'batteryLevel':
            updated.batteryLevel = value;
            break;
        }

        set({performanceMetrics: updated});
      },

      clearPerformanceAlerts: () => {
        set({performanceAlerts: []});
      },

      connectMobileWallet: async () => {
        const features = get().solanaMobileFeatures;
        if (!features?.mobileWalletAdapter.isAvailable) {
          throw new Error('Mobile wallet adapter not available');
        }

        await features.mobileWalletAdapter.connect();
      },

      useBiometricAuth: async (options: BiometricOptions) => {
        const features = get().solanaMobileFeatures;
        if (!features?.biometrics.isAvailable) {
          return false;
        }

        const result = await features.biometrics.authenticate(options);
        return result.success;
      },

      updateSettings: (updates: Partial<MobileOptimizationSettings>) => {
        const newSettings = {...get().settings, ...updates};
        set({settings: newSettings});

        // Apply settings changes
        if (updates.enablePerformanceMonitoring !== undefined) {
          if (updates.enablePerformanceMonitoring) {
            get().startPerformanceMonitoring();
          } else {
            get().stopPerformanceMonitoring();
          }
        }
      },

      enablePerformanceMode: () => {
        set({
          settings: {
            ...get().settings,
            enablePerformanceMode: true,
            reducedAnimations: false,
            prefetchContent: true,
            enableImageCaching: true,
          },
          isLowPerformanceMode: false,
        });
      },

      disablePerformanceMode: () => {
        set({
          settings: {
            ...get().settings,
            enablePerformanceMode: false,
          },
        });
      },

      adaptToNetworkConditions: async () => {
        const networkState = await NetInfo.fetch();
        const isSlowNetwork =
          networkState.type === 'cellular' &&
          !networkState.details?.isConnectionExpensive;

        set({isSlowNetwork});

        if (isSlowNetwork) {
          get().updateSettings({
            compressImages: true,
            limitVideoQuality: true,
            prefetchContent: false,
          });
        }
      },

      adaptToMemoryPressure: () => {
        set({isLowMemoryMode: true});

        // Reduce memory usage
        get().updateSettings({
          enableImageCaching: false,
          prefetchContent: false,
          reducedAnimations: true,
        });
      },

      registerGesture: (gesture: CustomGesture) => {
        const gestures = get().registeredGestures;
        set({registeredGestures: [...gestures, gesture]});
      },

      unregisterGesture: (gestureId: string) => {
        const gestures = get().registeredGestures;
        set({
          registeredGestures: gestures.filter(g => g.id !== gestureId),
        });
      },

      handleAppStateChange: (nextAppState: string) => {
        if (nextAppState === 'background') {
          get().optimizeForBackground();
        } else if (nextAppState === 'active') {
          get().optimizeForForeground();
        }
      },

      optimizeForBackground: () => {
        // Stop non-essential operations
        get().updateSettings({
          backgroundSyncLimited: true,
          locationUpdatesOptimized: true,
          prefetchContent: false,
        });

        // Stop performance monitoring to save battery
        if (!get().settings.enablePerformanceMonitoring) {
          get().stopPerformanceMonitoring();
        }
      },

      optimizeForForeground: () => {
        // Resume normal operations
        get().updateSettings({
          backgroundSyncLimited: false,
          prefetchContent: true,
        });

        // Resume performance monitoring if enabled
        if (get().settings.enablePerformanceMonitoring) {
          get().startPerformanceMonitoring();
        }
      },
    }),
    {
      name: 'mobile-optimization-storage',
      storage: AsyncStorage,
      partialize: state => ({
        settings: state.settings,
        performanceHistory: state.performanceHistory.slice(-10),
      }),
    },
  ),
);
