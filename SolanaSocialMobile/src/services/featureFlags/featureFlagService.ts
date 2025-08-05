import AsyncStorage from '@react-native-async-storage/async-storage';
import {EventEmitter} from 'events';
import NetInfo from '@react-native-community/netinfo';
import {analyticsService} from '../analytics/analyticsService';

// Mock Firebase Remote Config since we don't have it installed
const remoteConfig = () => ({
  setDefaults: async (defaults: Record<string, string>) => {
    console.log('Firebase Remote Config defaults set:', defaults);
  },
  setConfigSettings: async (settings: any) => {
    console.log('Firebase Remote Config settings:', settings);
  },
  fetchAndActivate: async () => {
    console.log('Firebase Remote Config fetch and activate');
    return true; // Simulate successful fetch
  },
  getAll: () => {
    // Mock remote config values
    return {
      tips_enabled: {asString: () => '{"enabled":true,"rolloutPercentage":50}'},
      auctions_enabled: {
        asString: () => '{"enabled":true,"rolloutPercentage":25}',
      },
      stories_enabled: {asString: () => '{"enabled":false}'},
      max_post_length: {asString: () => '{"enabled":true,"value":420}'},
      config_version: {asString: () => '1.2.0'},
    };
  },
  getValue: (key: string) => ({
    asString: () => {
      const mockValues: Record<string, string> = {
        config_version: '1.2.0',
      };
      return mockValues[key] || '';
    },
  }),
});

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  value: any;
  rolloutPercentage?: number;
  targetedUsers?: string[];
  targetedSegments?: string[];
  metadata?: {
    description?: string;
    owner?: string;
    createdAt?: string;
    expiresAt?: string;
  };
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  lastUpdated: number;
  version: string;
}

interface FeatureFlagEvents {
  'flag:changed': (key: string, value: any) => void;
  'config:updated': (config: FeatureFlagConfig) => void;
  error: (error: Error) => void;
}

class FeatureFlagService extends EventEmitter {
  private config: FeatureFlagConfig = {
    flags: {},
    lastUpdated: 0,
    version: '1.0.0',
  };

  private userId?: string;
  private userSegments: string[] = [];
  private deviceId: string = '';
  private isInitialized = false;
  private refreshInterval?: NodeJS.Timeout;
  private readonly CACHE_KEY = 'feature_flags_cache';
  private readonly REFRESH_INTERVAL = 3600000; // 1 hour

  // Default local flags for offline/fallback
  private readonly DEFAULT_FLAGS: Record<string, Partial<FeatureFlag>> = {
    // Core features
    social_feed_enabled: {enabled: true},
    posting_enabled: {enabled: true},
    voting_enabled: {enabled: true},
    wallet_connect_enabled: {enabled: true},

    // New features - gradual rollout
    tips_enabled: {enabled: false, rolloutPercentage: 50},
    auctions_enabled: {enabled: false, rolloutPercentage: 25},
    brands_enabled: {enabled: false},
    advanced_search_enabled: {enabled: false},
    voice_posts_enabled: {enabled: false},
    stories_enabled: {enabled: false},

    // Experimental features
    ai_moderation_enabled: {enabled: false},
    zk_proofs_enabled: {enabled: false},
    cross_chain_enabled: {enabled: false},

    // Performance optimizations
    lazy_loading_enabled: {enabled: true},
    image_optimization_level: {enabled: true, value: 'medium'},
    cache_size_mb: {enabled: true, value: 100},

    // Dynamic limits
    max_post_length: {enabled: true, value: 420},
    max_images_per_post: {enabled: true, value: 4},
    rate_limit_posts_per_hour: {enabled: true, value: 10},

    // A/B test experiments
    feed_algorithm_test_variants: {
      enabled: true,
      value: ['control', 'algorithmic', 'hybrid'],
    },
    onboarding_flow_test_variants: {
      enabled: true,
      value: ['original', 'simplified', 'gamified'],
    },
    auction_ui_test_variants: {enabled: true, value: ['simple', 'advanced']},
  };

  async initialize(userId?: string, deviceId?: string) {
    try {
      this.userId = userId;
      this.deviceId = deviceId || (await this.generateDeviceId());

      // Set Firebase Remote Config defaults
      await remoteConfig().setDefaults(this.transformDefaultsForFirebase());

      // Configure settings
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 0 in dev, 1 hour in prod
      });

      // Load cached config first
      await this.loadCachedConfig();

      // Fetch and activate remote config
      await this.fetchAndActivateRemoteConfig();

      // Start refresh interval
      this.startRefreshInterval();

      // Monitor network changes
      this.setupNetworkListener();

      this.isInitialized = true;

      // Track initialization
      analyticsService.trackEvent('feature_flags_initialized', {
        flag_count: Object.keys(this.config.flags).length,
        version: this.config.version,
        user_id: this.userId,
        device_id: this.deviceId,
      });

      console.log('Feature flag service initialized');
    } catch (error) {
      console.error('Feature flag initialization error:', error);
      this.emit('error', error as Error);

      // Fall back to defaults
      this.loadDefaultFlags();
    }
  }

  isEnabled(flagKey: string): boolean {
    const flag = this.config.flags[flagKey];

    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`);
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check targeted users (highest priority)
    if (flag.targetedUsers?.length && this.userId) {
      return flag.targetedUsers.includes(this.userId);
    }

    // Check targeted segments
    if (flag.targetedSegments?.length) {
      const hasTargetedSegment = flag.targetedSegments.some(segment =>
        this.userSegments.includes(segment),
      );
      if (hasTargetedSegment) {
        return true;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      return this.isInRolloutGroup(flagKey, flag.rolloutPercentage);
    }

    return flag.enabled;
  }

  getValue<T = any>(flagKey: string, defaultValue?: T): T {
    const flag = this.config.flags[flagKey];

    if (!flag || !this.isEnabled(flagKey)) {
      return defaultValue as T;
    }

    return flag.value !== undefined ? flag.value : defaultValue;
  }

  getAllFlags(): Record<string, boolean> {
    const flags: Record<string, boolean> = {};

    Object.keys(this.config.flags).forEach(key => {
      flags[key] = this.isEnabled(key);
    });

    return flags;
  }

  getFeatureFlagDetails(flagKey: string): FeatureFlag | null {
    return this.config.flags[flagKey] || null;
  }

  setUser(userId: string, segments: string[] = []) {
    this.userId = userId;
    this.userSegments = segments;

    // Re-evaluate flags with new user context
    this.emit('config:updated', this.config);

    analyticsService.trackEvent('feature_flags_user_set', {
      user_id: userId,
      segments: segments.join(','),
    });
  }

  setUserSegments(segments: string[]) {
    this.userSegments = segments;

    // Re-evaluate flags with new segments
    this.emit('config:updated', this.config);
  }

  async refresh(): Promise<void> {
    await this.fetchAndActivateRemoteConfig();
  }

  // A/B Testing support
  getVariant(experimentKey: string): string {
    const variants = this.getValue<string[]>(`${experimentKey}_variants`, [
      'control',
    ]);
    const variantIndex = this.getVariantIndex(experimentKey, variants.length);

    const variant = variants[variantIndex];

    // Track variant assignment
    analyticsService.trackEvent('experiment_variant_assigned', {
      experiment: experimentKey,
      variant,
      user_id: this.userId,
      device_id: this.deviceId,
    });

    return variant;
  }

  // Track feature usage
  trackFeatureUsage(flagKey: string, properties?: Record<string, any>) {
    const isEnabled = this.isEnabled(flagKey);
    const flag = this.config.flags[flagKey];

    analyticsService.trackEvent('feature_flag_used', {
      flag_key: flagKey,
      flag_enabled: isEnabled,
      flag_value: this.getValue(flagKey),
      rollout_percentage: flag?.rolloutPercentage,
      is_targeted: this.isUserTargeted(flagKey),
      ...properties,
    });
  }

  // Check if current user is specifically targeted
  private isUserTargeted(flagKey: string): boolean {
    const flag = this.config.flags[flagKey];
    if (!flag) {return false;}

    // Check user targeting
    if (flag.targetedUsers?.length && this.userId) {
      return flag.targetedUsers.includes(this.userId);
    }

    // Check segment targeting
    if (flag.targetedSegments?.length) {
      return flag.targetedSegments.some(segment =>
        this.userSegments.includes(segment),
      );
    }

    return false;
  }

  private async fetchAndActivateRemoteConfig() {
    try {
      // Fetch from Firebase
      const activated = await remoteConfig().fetchAndActivate();

      if (activated) {
        // Get all values
        const values = remoteConfig().getAll();

        // Transform Firebase config to our format
        const flags: Record<string, FeatureFlag> = {};

        Object.entries(values).forEach(([key, value]) => {
          try {
            const configValue = value.asString();

            // Try to parse as JSON for complex flags
            try {
              const parsed = JSON.parse(configValue);
              flags[key] = {
                key,
                enabled: parsed.enabled ?? true,
                value: parsed.value,
                rolloutPercentage: parsed.rolloutPercentage,
                targetedUsers: parsed.targetedUsers,
                targetedSegments: parsed.targetedSegments,
                metadata: parsed.metadata,
              };
            } catch {
              // Simple boolean flag
              flags[key] = {
                key,
                enabled: configValue === 'true',
                value: configValue === 'true' ? true : configValue,
              };
            }
          } catch (error) {
            console.error(`Error parsing flag ${key}:`, error);
          }
        });

        // Merge with defaults
        const newConfig = {
          flags: {...this.transformDefaultFlags(), ...flags},
          lastUpdated: Date.now(),
          version:
            remoteConfig().getValue('config_version').asString() || '1.0.0',
        };

        // Check for changes
        const hasChanges =
          JSON.stringify(this.config.flags) !== JSON.stringify(newConfig.flags);

        this.config = newConfig;

        // Cache the config
        await this.cacheConfig();

        // Notify listeners
        this.emit('config:updated', this.config);

        if (hasChanges) {
          analyticsService.trackEvent('feature_flags_updated', {
            version: this.config.version,
            flag_count: Object.keys(this.config.flags).length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching remote config:', error);
      this.emit('error', error as Error);
    }
  }

  private transformDefaultFlags(): Record<string, FeatureFlag> {
    const flags: Record<string, FeatureFlag> = {};

    Object.entries(this.DEFAULT_FLAGS).forEach(([key, value]) => {
      flags[key] = {
        key,
        enabled: value.enabled ?? false,
        value: value.value,
        rolloutPercentage: value.rolloutPercentage,
        targetedUsers: value.targetedUsers,
        targetedSegments: value.targetedSegments,
      };
    });

    return flags;
  }

  private transformDefaultsForFirebase(): Record<string, string> {
    const defaults: Record<string, string> = {};

    Object.entries(this.DEFAULT_FLAGS).forEach(([key, value]) => {
      defaults[key] = JSON.stringify(value);
    });

    return defaults;
  }

  private isInRolloutGroup(flagKey: string, percentage: number): boolean {
    // Consistent bucketing based on user/device ID and flag key
    const identifier = this.userId || this.deviceId;
    const hash = this.hashString(`${identifier}:${flagKey}`);
    const bucket = hash % 100;

    return bucket < percentage;
  }

  private getVariantIndex(experimentKey: string, variantCount: number): number {
    const identifier = this.userId || this.deviceId;
    const hash = this.hashString(`${identifier}:${experimentKey}`);

    return hash % variantCount;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async generateDeviceId(): Promise<string> {
    const stored = await AsyncStorage.getItem('device_id');
    if (stored) {return stored;}

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('device_id', id);

    return id;
  }

  private async loadCachedConfig() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedConfig = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        if (Date.now() - parsedConfig.lastUpdated < 24 * 60 * 60 * 1000) {
          this.config = parsedConfig;
          return;
        }
      }

      // Fallback to defaults if no valid cache
      this.loadDefaultFlags();
    } catch (error) {
      console.error('Error loading cached config:', error);
      this.loadDefaultFlags();
    }
  }

  private async cacheConfig() {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error caching config:', error);
    }
  }

  private loadDefaultFlags() {
    this.config = {
      flags: this.transformDefaultFlags(),
      lastUpdated: Date.now(),
      version: 'default',
    };
  }

  private startRefreshInterval() {
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, this.REFRESH_INTERVAL);
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (
        state.isConnected &&
        Date.now() - this.config.lastUpdated > this.REFRESH_INTERVAL
      ) {
        this.refresh();
      }
    });
  }

  // Development utilities
  async forceRefresh(): Promise<void> {
    await this.fetchAndActivateRemoteConfig();
  }

  // Override flags locally for testing (development only)
  async setLocalOverride(flagKey: string, enabled: boolean, value?: any) {
    if (!__DEV__) {return;}

    const overrides = await this.getLocalOverrides();
    overrides[flagKey] = {enabled, value};

    await AsyncStorage.setItem(
      'feature_flag_overrides',
      JSON.stringify(overrides),

    // Update flag
    if (this.config.flags[flagKey]) {
      this.config.flags[flagKey] = {
        ...this.config.flags[flagKey],
        enabled,
        value: value !== undefined ? value : this.config.flags[flagKey].value,
      };

      this.emit('config:updated', this.config);
    }
  }

  async clearLocalOverrides() {
    if (!__DEV__) {return;}

    await AsyncStorage.removeItem('feature_flag_overrides');
    await this.loadCachedConfig();
    await this.fetchAndActivateRemoteConfig();
  }

  private async getLocalOverrides(): Promise<
    Record<string, {enabled: boolean; value?: any}>
  > {
    if (!__DEV__) {return {};}

    try {
      const stored = await AsyncStorage.getItem('feature_flag_overrides');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // Status and debugging
  getStatus(): {
    isInitialized: boolean;
    flagCount: number;
    version: string;
    lastUpdated: number;
    userId?: string;
    deviceId: string;
    userSegments: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      flagCount: Object.keys(this.config.flags).length,
      version: this.config.version,
      lastUpdated: this.config.lastUpdated,
      userId: this.userId,
      deviceId: this.deviceId,
      userSegments: [...this.userSegments],
    };
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.removeAllListeners();
  }
}

export const featureFlagService = new FeatureFlagService();
