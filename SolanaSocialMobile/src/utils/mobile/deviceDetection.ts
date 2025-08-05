// import DeviceInfo from "react-native-device-info";

// Mock DeviceInfo for now
const DeviceInfo = {
  getModel: () => Promise.resolve('Android'),
  getBrand: () => Promise.resolve('Generic'),
  getSystemName: () => Promise.resolve('Android'),
  hasGms: () => Promise.resolve(true),
  getTotalMemory: () => Promise.resolve(4 * 1024 * 1024 * 1024), // 4GB
  getTotalDiskCapacity: () => Promise.resolve(64 * 1024 * 1024 * 1024), // 64GB
  getFreeDiskStorage: () => Promise.resolve(32 * 1024 * 1024 * 1024), // 32GB
  hasSystemFeature: (feature: string) => Promise.resolve(true),
};
import {Platform, Dimensions, PixelRatio} from 'react-native';
import {MobileCapabilities} from '../../types/mobile-optimizations';

/**
 * Detect if the current device is a Solana Saga phone
 */
export const isSagaDevice = async (): Promise<boolean> => {
  try {
    const model = await DeviceInfo.getModel();
    const brand = await DeviceInfo.getBrand();

    return (
      brand.toLowerCase() === 'solana' ||
      model.toLowerCase().includes('saga') ||
      model.toLowerCase().includes('solana')
    );
  } catch (error) {
    console.warn('Failed to detect Saga device:', error);
    return false;
  }
};

/**
 * Detect device capabilities and hardware features
 */
export const detectDeviceCapabilities = async (): Promise<
  Partial<MobileCapabilities>
> => {
  try {
    const [
      model,
      brand,
      systemName,
      hasGms,
      totalMemory,
      totalStorage,
      freeStorage,
    ] = await Promise.all([
      DeviceInfo.getModel(),
      DeviceInfo.getBrand(),
      DeviceInfo.getSystemName(),
      DeviceInfo.hasGms().catch(() => false),
      DeviceInfo.getTotalMemory().catch(() => 0),
      DeviceInfo.getTotalDiskCapacity().catch(() => 0),
      DeviceInfo.getFreeDiskStorage().catch(() => 0),
    ]);

    const {width, height} = Dimensions.get('window');
    const scale = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();

    const isSolanaPhone =
      brand.toLowerCase() === 'solana' || model.toLowerCase().includes('saga');

    return {
      deviceType: isSolanaPhone
        ? 'saga'
        : Platform.OS === 'ios'
        ? 'ios'
        : 'android',
      isSolanaPhone,
      hasSecureElement: isSolanaPhone,
      supportsBiometrics: hasGms || Platform.OS === 'ios',
      walletAdapterSupport: isSolanaPhone,
      seedVaultSupport: isSolanaPhone,
      mobileWalletSupport: true,
      hasNFC: hasGms || Platform.OS === 'ios',
      hasFingerprint: hasGms || Platform.OS === 'ios',
      hasFaceRecognition: Platform.OS === 'ios',
      hasGyroscope: true,
      hasAccelerometer: true,
      screenSize: {width, height, scale, fontScale},
      pixelDensity: scale,
      safeAreaInsets: {top: 0, bottom: 0, left: 0, right: 0},
      memoryInfo: {
        totalMemory,
        availableMemory: freeStorage,
        usedMemory: totalMemory - freeStorage,
        memoryPressure: 'low',
      },
      storageInfo: {
        totalStorage,
        availableStorage: freeStorage,
        usedStorage: totalStorage - freeStorage,
        lowStorageWarning: freeStorage < totalStorage * 0.1,
      },
    };
  } catch (error) {
    console.error('Failed to detect device capabilities:', error);
    return {};
  }
};

/**
 * Check if device has specific hardware features
 */
export const hasHardwareFeature = async (feature: string): Promise<boolean> => {
  try {
    switch (feature) {
      case 'nfc':
        return (await DeviceInfo.hasGms()) || Platform.OS === 'ios';
      case 'biometrics':
        return (await DeviceInfo.hasGms()) || Platform.OS === 'ios';
      case 'camera':
        return (
          (await DeviceInfo.hasSystemFeature('android.hardware.camera')) ||
          Platform.OS === 'ios'
        );
      case 'bluetooth':
        return true; // Most modern devices have Bluetooth
      case 'wifi':
        return true; // All smartphones have WiFi
      case 'cellular':
        return (
          (await DeviceInfo.hasSystemFeature('android.hardware.telephony')) ||
          Platform.OS === 'ios'
        );
      default:
        return false;
    }
  } catch (error) {
    console.warn(`Failed to check hardware feature ${feature}:`, error);
    return false;
  }
};

/**
 * Get device performance tier
 */
export const getDevicePerformanceTier = async (): Promise<
  'low' | 'medium' | 'high'
> => {
  try {
    const totalMemory = await DeviceInfo.getTotalMemory();
    const {width, height} = Dimensions.get('window');
    const screenSize = width * height;

    // Simple heuristics for performance tier
    if (totalMemory > 6 * 1024 * 1024 * 1024 && screenSize > 2000000) {
      // 6GB+ RAM, large screen
      return 'high';
    } else if (totalMemory > 3 * 1024 * 1024 * 1024) {
      // 3GB+ RAM
      return 'medium';
    } else {
      return 'low';
    }
  } catch (error) {
    console.warn('Failed to determine performance tier:', error);
    return 'medium';
  }
};

/**
 * Check if device supports specific Solana Mobile features
 */
export const getSolanaCapabilities = async () => {
  const isSaga = await isSagaDevice();

  return {
    mobileWalletAdapter: isSaga,
    seedVault: isSaga,
    secureElement: isSaga,
    transactionSigning: isSaga,
    biometricAuth: isSaga && (await hasHardwareFeature('biometrics')),
    nfcSupport: isSaga && (await hasHardwareFeature('nfc')),
  };
};

/**
 * Get device form factor information
 */
export const getDeviceFormFactor = () => {
  const {width, height} = Dimensions.get('window');
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  const diagonal =
    Math.sqrt(width * width + height * height) / PixelRatio.get();

  let formFactor: 'phone' | 'tablet' | 'foldable' = 'phone';

  if (diagonal > 7) {
    // Rough tablet threshold
    formFactor = 'tablet';
  } else if (aspectRatio > 2.1) {
    // Very tall screens might be foldables
    formFactor = 'foldable';
  }

  return {
    formFactor,
    screenSize: {width, height},
    aspectRatio,
    diagonalInches: diagonal / 160, // Approximate diagonal in inches
    isLandscape: width > height,
    isTablet: formFactor === 'tablet',
    isFoldable: formFactor === 'foldable',
  };
};

/**
 * Get network capability information
 */
export const getNetworkCapabilities = () => {
  return {
    supports5G: Platform.OS === 'android', // Simplified assumption
    supportsWiFi6: true, // Most modern devices
    supportsBluetooth5: true, // Most modern devices
    supportsNFC: Platform.OS === 'android' || Platform.OS === 'ios',
    supportsUSBC: Platform.OS === 'android',
    supportsWirelessCharging: false, // Would need specific detection
  };
};

/**
 * Check if device meets minimum requirements for features
 */
export const checkMinimumRequirements = async (requirements: {
  minMemoryGB?: number;
  minStorageGB?: number;
  requiresBiometrics?: boolean;
  requiresNFC?: boolean;
  requiresSolanaPhone?: boolean;
}) => {
  const capabilities = await detectDeviceCapabilities();
  const results = {
    meetsRequirements: true,
    failedChecks: [] as string[],
  };

  if (requirements.minMemoryGB) {
    const memoryGB =
      (capabilities.memoryInfo?.totalMemory || 0) / (1024 * 1024 * 1024);
    if (memoryGB < requirements.minMemoryGB) {
      results.meetsRequirements = false;
      results.failedChecks.push(
        `Insufficient memory: ${memoryGB.toFixed(1)}GB < ${
          requirements.minMemoryGB
        }GB`,
      );
    }
  }

  if (requirements.minStorageGB) {
    const storageGB =
      (capabilities.storageInfo?.totalStorage || 0) / (1024 * 1024 * 1024);
    if (storageGB < requirements.minStorageGB) {
      results.meetsRequirements = false;
      results.failedChecks.push(
        `Insufficient storage: ${storageGB.toFixed(1)}GB < ${
          requirements.minStorageGB
        }GB`,
      );
    }
  }

  if (requirements.requiresBiometrics && !capabilities.supportsBiometrics) {
    results.meetsRequirements = false;
    results.failedChecks.push('Biometric authentication not supported');
  }

  if (requirements.requiresNFC && !capabilities.hasNFC) {
    results.meetsRequirements = false;
    results.failedChecks.push('NFC not supported');
  }

  if (requirements.requiresSolanaPhone && !capabilities.isSolanaPhone) {
    results.meetsRequirements = false;
    results.failedChecks.push('Solana phone required');
  }

  return results;
};
