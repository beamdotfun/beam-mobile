export interface MobileCapabilities {
  // Device info
  deviceType: 'saga' | 'android' | 'ios' | 'unknown';
  isSolanaPhone: boolean;
  hasSecureElement: boolean;
  supportsBiometrics: boolean;

  // Solana Mobile features
  walletAdapterSupport: boolean;
  seedVaultSupport: boolean;
  mobileWalletSupport: boolean;

  // Hardware features
  hasNFC: boolean;
  hasFingerprint: boolean;
  hasFaceRecognition: boolean;
  hasGyroscope: boolean;
  hasAccelerometer: boolean;

  // Screen info
  screenSize: ScreenSize;
  pixelDensity: number;
  safeAreaInsets: SafeAreaInsets;

  // Performance capabilities
  memoryInfo: MemoryInfo;
  storageInfo: StorageInfo;
  networkInfo: NetworkInfo;
}

export interface ScreenSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MemoryInfo {
  totalMemory: number;
  availableMemory: number;
  usedMemory: number;
  memoryPressure: 'low' | 'moderate' | 'high' | 'critical';
}

export interface StorageInfo {
  totalStorage: number;
  availableStorage: number;
  usedStorage: number;
  lowStorageWarning: boolean;
}

export interface NetworkInfo {
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  isConnected: boolean;
  isExpensive: boolean;
  bandwidth: number; // Mbps estimate
  latency: number; // ms
}

export interface PerformanceMetrics {
  // Rendering performance
  frameRate: number;
  droppedFrames: number;
  renderTime: number;

  // Memory usage
  jsHeapSize: number;
  nativeHeapSize: number;
  imageMemory: number;

  // Network performance
  apiResponseTimes: Record<string, number>;
  imageLoadTimes: number[];
  cacheHitRatio: number;

  // User experience
  appStartTime: number;
  screenTransitionTimes: Record<string, number>;
  interactionResponseTimes: Record<string, number>;

  // Battery impact
  cpuUsage: number;
  batteryLevel: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
}

export interface MobileOptimizationSettings {
  // Performance settings
  enablePerformanceMode: boolean;
  adaptiveImageQuality: boolean;
  enableImageCaching: boolean;
  prefetchContent: boolean;

  // Battery optimization
  reducedAnimations: boolean;
  backgroundSyncLimited: boolean;
  locationUpdatesOptimized: boolean;

  // Data usage
  wifiOnlyMode: boolean;
  compressImages: boolean;
  limitVideoQuality: boolean;

  // Accessibility
  largeTextMode: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
  voiceOverEnabled: boolean;

  // Solana Mobile features
  enableSecureTransactions: boolean;
  useSeedVault: boolean;
  biometricAuthentication: boolean;

  // Development
  enablePerformanceMonitoring: boolean;
  showPerformanceOverlay: boolean;
}

export interface SolanaMobileFeatures {
  // Wallet features
  mobileWalletAdapter: MobileWalletAdapter;
  seedVault: SeedVault;

  // Security features
  secureElement: SecureElement;
  biometrics: BiometricAuth;

  // Hardware integrations
  nfc: NFCIntegration;
  sensors: SensorIntegration;
}

export interface MobileWalletAdapter {
  isAvailable: boolean;
  supportedWallets: string[];
  currentWallet?: string;

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: string) => Promise<string>;
}

export interface SeedVault {
  isAvailable: boolean;
  isConfigured: boolean;

  // Seed management
  storeSeed: (seed: string) => Promise<void>;
  retrieveSeed: () => Promise<string>;
  deleteSeed: () => Promise<void>;

  // Security
  requiresBiometric: boolean;
  lastAccessed?: string;
}

export interface SecureElement {
  isAvailable: boolean;
  isConfigured: boolean;

  // Key management
  generateKey: (keyId: string) => Promise<void>;
  signWithKey: (keyId: string, data: string) => Promise<string>;
  deleteKey: (keyId: string) => Promise<void>;

  // Security features
  attestation: boolean;
  tamperDetection: boolean;
}

export interface BiometricAuth {
  isAvailable: boolean;
  supportedTypes: BiometricType[];
  isEnrolled: boolean;

  // Authentication
  authenticate: (options: BiometricOptions) => Promise<BiometricResult>;
  checkBiometrics: () => Promise<boolean>;
}

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'voice';

export interface BiometricOptions {
  title: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: BiometricType;
}

export interface NFCIntegration {
  isAvailable: boolean;
  isEnabled: boolean;

  // NFC operations
  readTag: () => Promise<NFCTag>;
  writeTag: (data: string) => Promise<void>;

  // Events
  onTagDiscovered: (callback: (tag: NFCTag) => void) => void;
  onTagLost: (callback: () => void) => void;
}

export interface NFCTag {
  id: string;
  type: string;
  data: string;
  writable: boolean;
}

export interface SensorIntegration {
  accelerometer: SensorData;
  gyroscope: SensorData;
  magnetometer: SensorData;

  // Event listeners
  onShake: (callback: () => void) => void;
  onTilt: (callback: (angle: number) => void) => void;
  onMotion: (callback: (motion: MotionData) => void) => void;
}

export interface SensorData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface MotionData {
  acceleration: SensorData;
  rotation: SensorData;
  orientation: {
    pitch: number;
    roll: number;
    yaw: number;
  };
}

export interface AppStateOptimization {
  // Lifecycle management
  appState: 'active' | 'background' | 'inactive';
  lastActiveTime: string;
  backgroundTime: number;

  // Resource management
  pauseAnimations: boolean;
  suspendNetworkRequests: boolean;
  clearSensitiveData: boolean;

  // Background tasks
  allowedBackgroundTasks: string[];
  backgroundTasksRunning: string[];

  // Memory management
  triggerMemoryCleanup: boolean;
  unloadHeavyResources: boolean;
}

export interface GestureOptimizations {
  // Touch gestures
  enableSwipeGestures: boolean;
  swipeThreshold: number;
  swipeSensitivity: number;

  // Pull to refresh
  enablePullToRefresh: boolean;
  pullThreshold: number;

  // Long press
  enableLongPress: boolean;
  longPressDelay: number;

  // Pinch to zoom
  enablePinchZoom: boolean;
  minZoom: number;
  maxZoom: number;

  // Double tap
  enableDoubleTap: boolean;
  doubleTapDelay: number;
}

export interface ImageOptimizations {
  // Quality settings
  defaultQuality: number;
  thumbnailQuality: number;
  fullImageQuality: number;

  // Size constraints
  maxWidth: number;
  maxHeight: number;
  thumbnailSize: number;

  // Caching
  enableCache: boolean;
  cacheDuration: number;
  maxCacheSize: number;

  // Progressive loading
  enableProgressive: boolean;
  blurRadius: number;
  placeholderColor: string;
}

export interface AnimationOptimizations {
  // Frame rate
  targetFPS: number;
  enableVsync: boolean;

  // Animation types
  useNativeDriver: boolean;
  enableSpringPhysics: boolean;
  interruptible: boolean;

  // Performance
  throttleAnimations: boolean;
  disableComplexAnimations: boolean;
  simplifyTransitions: boolean;
}

export interface CacheOptimizations {
  // Storage limits
  maxCacheSize: number;
  maxImageCacheSize: number;
  maxDataCacheSize: number;

  // Eviction policies
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'size';
  ttl: number;

  // Cache types
  enableMemoryCache: boolean;
  enableDiskCache: boolean;
  enableNetworkCache: boolean;

  // Cleanup
  autoCleanup: boolean;
  cleanupInterval: number;
  cleanupThreshold: number;
}

export interface NetworkOptimizations {
  // Request management
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;

  // Batching
  enableBatching: boolean;
  batchSize: number;
  batchDelay: number;

  // Compression
  enableCompression: boolean;
  compressionLevel: number;

  // Caching
  enableHttpCache: boolean;
  cacheMaxAge: number;
  respectCacheHeaders: boolean;

  // Optimization
  prefetchLinks: boolean;
  preconnectDomains: string[];
  prioritizeVisibleContent: boolean;
}

export interface AccessibilityOptimizations {
  // Visual
  minimumTouchSize: number;
  contrastRatio: number;
  focusIndicatorWidth: number;

  // Screen reader
  announceChanges: boolean;
  provideHints: boolean;
  groupElements: boolean;

  // Navigation
  enableKeyboardNavigation: boolean;
  tabOrderOptimized: boolean;
  skipLinks: boolean;

  // Feedback
  hapticFeedback: boolean;
  audioFeedback: boolean;
  visualFeedback: boolean;
}

// Performance monitoring state
export interface PerformanceMonitoringState {
  isMonitoring: boolean;
  metrics: PerformanceMetrics;
  capabilities: MobileCapabilities;
  settings: MobileOptimizationSettings;

  // Thresholds
  frameRateThreshold: number;
  memoryThreshold: number;
  batteryThreshold: number;

  // Alerts
  performanceAlerts: PerformanceAlert[];
  lastOptimizationTime: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'framerate' | 'memory' | 'battery' | 'thermal' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}
