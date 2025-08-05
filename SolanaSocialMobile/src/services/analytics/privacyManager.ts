import AsyncStorage from '@react-native-async-storage/async-storage';
import {analyticsService} from './analyticsService';
import {crashReportingService} from '../crashReportingService';

// Mock Firebase and Sentry for privacy control
const analytics = () => ({
  setAnalyticsCollectionEnabled: async (enabled: boolean) => {
    console.log('Firebase Analytics collection enabled:', enabled);
  },
});

const crashlytics = () => ({
  setCrashlyticsCollectionEnabled: async (enabled: boolean) => {
    console.log('Crashlytics collection enabled:', enabled);
  },
});

const Sentry = {
  close: () => {
    console.log('Sentry closed');
  },
  init: (config: any) => {
    console.log('Sentry re-initialized:', config);
  },
};

export enum PrivacyLevel {
  FULL = 'full', // All analytics enabled
  ANONYMOUS = 'anonymous', // Analytics without user identification
  ESSENTIAL = 'essential', // Only crash reporting and essential metrics
  NONE = 'none', // No data collection
}

export interface PrivacySettings {
  level: PrivacyLevel;
  allowAnalytics: boolean;
  allowCrashReporting: boolean;
  allowPerformanceTracking: boolean;
  allowPersonalization: boolean;
  allowErrorTracking: boolean;
  dataRetentionDays: number;
  lastUpdated: number;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  level: PrivacyLevel.FULL,
  allowAnalytics: true,
  allowCrashReporting: true,
  allowPerformanceTracking: true,
  allowPersonalization: true,
  allowErrorTracking: true,
  dataRetentionDays: 365,
  lastUpdated: Date.now(),
};

class PrivacyManager {
  private currentSettings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS;
  private readonly STORAGE_KEY = 'privacy_settings';
  private readonly CONSENT_KEY = 'privacy_consent_given';
  private isInitialized = false;

  async initialize() {
    try {
      await this.loadPrivacySettings();
      await this.applyPrivacySettings();
      this.isInitialized = true;
      console.log('Privacy manager initialized');
    } catch (error) {
      console.error('Privacy manager initialization error:', error);
    }
  }

  async setPrivacyLevel(level: PrivacyLevel) {
    const newSettings = this.getSettingsForLevel(level);
    await this.updatePrivacySettings(newSettings);
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>) {
    this.currentSettings = {
      ...this.currentSettings,
      ...settings,
      lastUpdated: Date.now(),
    };

    await this.savePrivacySettings();
    await this.applyPrivacySettings();

    // Track privacy preference change (if analytics is allowed)
    if (this.currentSettings.allowAnalytics) {
      analyticsService.trackEvent('privacy_settings_changed', {
        privacy_level: this.currentSettings.level,
        allow_analytics: this.currentSettings.allowAnalytics,
        allow_crash_reporting: this.currentSettings.allowCrashReporting,
        allow_performance_tracking:
          this.currentSettings.allowPerformanceTracking,
      });
    }
  }

  async giveConsent(level: PrivacyLevel = PrivacyLevel.FULL) {
    await AsyncStorage.setItem(this.CONSENT_KEY, 'true');
    await this.setPrivacyLevel(level);

    console.log('Privacy consent given:', level);
  }

  async withdrawConsent() {
    await AsyncStorage.setItem(this.CONSENT_KEY, 'false');
    await this.setPrivacyLevel(PrivacyLevel.NONE);

    console.log('Privacy consent withdrawn');
  }

  async hasConsent(): Promise<boolean> {
    const consent = await AsyncStorage.getItem(this.CONSENT_KEY);
    return consent === 'true';
  }

  getPrivacySettings(): PrivacySettings {
    return {...this.currentSettings};
  }

  getPrivacyLevel(): PrivacyLevel {
    return this.currentSettings.level;
  }

  // Permission checks
  canTrackAnalytics(): boolean {
    return (
      this.currentSettings.allowAnalytics &&
      this.currentSettings.level !== PrivacyLevel.NONE
    );
  }

  canTrackCrashes(): boolean {
    return (
      this.currentSettings.allowCrashReporting &&
      this.currentSettings.level !== PrivacyLevel.NONE
    );
  }

  canTrackPerformance(): boolean {
    return (
      this.currentSettings.allowPerformanceTracking &&
      this.currentSettings.level !== PrivacyLevel.NONE &&
      this.currentSettings.level !== PrivacyLevel.ESSENTIAL
    );
  }

  canTrackUser(): boolean {
    return (
      this.currentSettings.allowPersonalization &&
      this.currentSettings.level === PrivacyLevel.FULL
    );
  }

  canTrackErrors(): boolean {
    return (
      this.currentSettings.allowErrorTracking &&
      this.currentSettings.level !== PrivacyLevel.NONE
    );
  }

  // Data export for GDPR compliance
  async exportUserData(): Promise<{
    privacySettings: PrivacySettings;
    analyticsData: any;
    crashData: any;
  }> {
    const analyticsStatus = await analyticsService.getAnalyticsStatus();
    const crashStatus = crashReportingService.getStatus();

    return {
      privacySettings: this.currentSettings,
      analyticsData: {
        status: analyticsStatus,
        // In a real app, would include stored analytics data
      },
      crashData: {
        status: crashStatus,
        breadcrumbs: crashReportingService.getBreadcrumbs(),
        context: crashReportingService.getContext(),
      },
    };
  }

  // Data deletion for GDPR compliance
  async deleteAllUserData() {
    // Reset analytics
    await analyticsService.reset();

    // Clear crash reporting context
    crashReportingService.clearBreadcrumbs();

    // Clear privacy settings
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    await AsyncStorage.removeItem(this.CONSENT_KEY);

    // Reset to no tracking
    this.currentSettings = {
      ...DEFAULT_PRIVACY_SETTINGS,
      level: PrivacyLevel.NONE,
      allowAnalytics: false,
      allowCrashReporting: false,
      allowPerformanceTracking: false,
      allowPersonalization: false,
      allowErrorTracking: false,
    };

    await this.applyPrivacySettings();

    console.log('All user data deleted');
  }

  private getSettingsForLevel(level: PrivacyLevel): PrivacySettings {
    const baseSettings = {...this.currentSettings, level};

    switch (level) {
      case PrivacyLevel.NONE:
        return {
          ...baseSettings,
          allowAnalytics: false,
          allowCrashReporting: false,
          allowPerformanceTracking: false,
          allowPersonalization: false,
          allowErrorTracking: false,
        };

      case PrivacyLevel.ESSENTIAL:
        return {
          ...baseSettings,
          allowAnalytics: false,
          allowCrashReporting: true,
          allowPerformanceTracking: false,
          allowPersonalization: false,
          allowErrorTracking: true,
        };

      case PrivacyLevel.ANONYMOUS:
        return {
          ...baseSettings,
          allowAnalytics: true,
          allowCrashReporting: true,
          allowPerformanceTracking: true,
          allowPersonalization: false,
          allowErrorTracking: true,
        };

      case PrivacyLevel.FULL:
        return {
          ...baseSettings,
          allowAnalytics: true,
          allowCrashReporting: true,
          allowPerformanceTracking: true,
          allowPersonalization: true,
          allowErrorTracking: true,
        };

      default:
        return baseSettings;
    }
  }

  private async applyPrivacySettings() {
    const settings = this.currentSettings;

    try {
      // Apply Firebase Analytics settings
      await analytics().setAnalyticsCollectionEnabled(settings.allowAnalytics);

      // Apply Crashlytics settings
      await crashlytics().setCrashlyticsCollectionEnabled(
        settings.allowCrashReporting,

      // Apply Sentry settings
      if (!settings.allowCrashReporting && !settings.allowErrorTracking) {
        Sentry.close();
      } else if (settings.allowCrashReporting || settings.allowErrorTracking) {
        // Re-initialize Sentry if needed
        // In a real app, would properly re-initialize with config
      }

      // Reset user data if not allowing personalization
      if (!settings.allowPersonalization) {
        await analyticsService.reset();
      }

      console.log('Privacy settings applied:', settings.level);
    } catch (error) {
      console.error('Error applying privacy settings:', error);
    }
  }

  private async loadPrivacySettings() {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.currentSettings = {
          ...DEFAULT_PRIVACY_SETTINGS,
          ...JSON.parse(saved),
        };
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      this.currentSettings = DEFAULT_PRIVACY_SETTINGS;
    }
  }

  private async savePrivacySettings() {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.currentSettings),
      );
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  }

  // GDPR/CCPA compliance helpers
  getDataProcessingPurposes(): string[] {
    const purposes: string[] = [];

    if (this.currentSettings.allowAnalytics) {
      purposes.push('Analytics and Usage Tracking');
    }

    if (this.currentSettings.allowCrashReporting) {
      purposes.push('Crash and Error Reporting');
    }

    if (this.currentSettings.allowPerformanceTracking) {
      purposes.push('Performance Monitoring');
    }

    if (this.currentSettings.allowPersonalization) {
      purposes.push('Personalization and User Experience');
    }

    return purposes;
  }

  getThirdPartyServices(): Array<{
    name: string;
    purpose: string;
    privacyPolicy: string;
  }> {
    const services: Array<{
      name: string;
      purpose: string;
      privacyPolicy: string;
    }> = [];

    if (this.currentSettings.allowAnalytics) {
      services.push({
        name: 'Firebase Analytics',
        purpose: 'App usage analytics',
        privacyPolicy: 'https://firebase.google.com/policies/analytics',
      });

      services.push({
        name: 'Mixpanel',
        purpose: 'User behavior analytics',
        privacyPolicy: 'https://mixpanel.com/legal/privacy-policy/',
      });
    }

    if (this.currentSettings.allowCrashReporting) {
      services.push({
        name: 'Firebase Crashlytics',
        purpose: 'Crash reporting',
        privacyPolicy: 'https://firebase.google.com/policies/analytics',
      });

      services.push({
        name: 'Sentry',
        purpose: 'Error tracking',
        privacyPolicy: 'https://sentry.io/privacy/',
      });
    }

    return services;
  }

  // Consent management for different regions
  async getConsentRequirements(userRegion?: string): Promise<{
    requiresConsent: boolean;
    consentType: 'opt-in' | 'opt-out';
    purposes: string[];
  }> {
    // Simplified consent logic - in real app would be more sophisticated
    const isEU = userRegion === 'EU' || userRegion === 'EEA';
    const isCalifornia = userRegion === 'CA' || userRegion === 'California';

    if (isEU) {
      return {
        requiresConsent: true,
        consentType: 'opt-in',
        purposes: this.getDataProcessingPurposes(),
      };
    }

    if (isCalifornia) {
      return {
        requiresConsent: true,
        consentType: 'opt-out',
        purposes: this.getDataProcessingPurposes(),
      };
    }

    return {
      requiresConsent: false,
      consentType: 'opt-out',
      purposes: [],
    };
  }

  // Status and debugging
  getStatus(): {
    isInitialized: boolean;
    hasConsent: boolean;
    currentLevel: PrivacyLevel;
    settingsLastUpdated: number;
    canTrack: {
      analytics: boolean;
      crashes: boolean;
      performance: boolean;
      user: boolean;
      errors: boolean;
    };
  } {
    return {
      isInitialized: this.isInitialized,
      hasConsent: false, // Would be determined asynchronously
      currentLevel: this.currentSettings.level,
      settingsLastUpdated: this.currentSettings.lastUpdated,
      canTrack: {
        analytics: this.canTrackAnalytics(),
        crashes: this.canTrackCrashes(),
        performance: this.canTrackPerformance(),
        user: this.canTrackUser(),
        errors: this.canTrackErrors(),
      },
    };
  }
}

export const privacyManager = new PrivacyManager();
