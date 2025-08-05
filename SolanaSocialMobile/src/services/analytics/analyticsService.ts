import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

// Mock Firebase Analytics since we don't have it installed
const analytics = () => ({
  setAnalyticsCollectionEnabled: async (enabled: boolean) => {
    console.log('Firebase Analytics collection enabled:', enabled);
  },
  setUserId: async (userId: string) => {
    console.log('Firebase Analytics user ID set:', userId);
  },
  setUserProperty: async (key: string, value: string) => {
    console.log('Firebase Analytics user property set:', key, value);
  },
  logEvent: (eventName: string, params: any) => {
    console.log('Firebase Analytics event:', eventName, params);
  },
  logScreenView: (params: {screen_name: string; screen_class: string}) => {
    console.log('Firebase Analytics screen view:', params);
  },
  logPurchase: async (params: {
    value: number;
    currency: string;
    items: any[];
  }) => {
    console.log('Firebase Analytics purchase:', params);
  },
  resetAnalyticsData: async () => {
    console.log('Firebase Analytics data reset');
  },
});

// Mock Mixpanel since we don't have it installed
class MockMixpanel {
  constructor(private token: string, private trackAutomaticEvents: boolean) {}

  async init() {
    console.log('Mixpanel initialized with token:', this.token);
  }

  identify(userId: string) {
    console.log('Mixpanel identify:', userId);
  }

  track(eventName: string, properties: any) {
    console.log('Mixpanel track:', eventName, properties);
  }

  registerSuperProperties(properties: any) {
    console.log('Mixpanel super properties:', properties);
  }

  getPeople() {
    return {
      set: (properties: any) => {
        console.log('Mixpanel people set:', properties);
      },
      trackCharge: (amount: number, properties: any) => {
        console.log('Mixpanel track charge:', amount, properties);
      },
    };
  }

  reset() {
    console.log('Mixpanel reset');
  }
}

// Mock DeviceInfo since we don't have it installed
const DeviceInfo = {
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
  getUniqueId: () => 'mock-device-id',
  getModel: () => (Platform.OS === 'ios' ? 'iPhone' : 'Android'),
  getBrand: () => (Platform.OS === 'ios' ? 'Apple' : 'Android'),
  getDeviceType: () => 'Handset',
  getSystemVersion: () => Platform.Version.toString(),
  getBundleId: () => 'com.beam.mobile',
  isTablet: () => false,
  hasNotch: () => false,
};

const MIXPANEL_TOKEN = 'mock_mixpanel_token';

interface UserProperties {
  userId?: string;
  wallet?: string;
  isPremium?: boolean;
  accountAge?: number;
  postCount?: number;
  followerCount?: number;
  isVerified?: boolean;
  preferredLanguage?: string;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
}

interface EventProperties {
  [key: string]: any;
}

class AnalyticsService {
  private mixpanel: MockMixpanel | null = null;
  private isInitialized = false;
  private userId: string | null = null;
  private sessionId: string = '';
  private eventQueue: Array<{name: string; properties: any}> = [];
  private userProperties: UserProperties = {};
  private sessionStartTime = Date.now();

  async initialize() {
    try {
      // Initialize Firebase Analytics
      await analytics().setAnalyticsCollectionEnabled(!__DEV__);

      // Initialize Mixpanel
      this.mixpanel = new MockMixpanel(MIXPANEL_TOKEN, true);
      await this.mixpanel.init();

      // Set default properties
      await this.setDefaultProperties();

      // Generate session ID
      this.sessionId = this.generateSessionId();

      // Process queued events
      await this.processEventQueue();

      this.isInitialized = true;

      // Track app open
      this.trackEvent('app_opened', {
        session_id: this.sessionId,
        launch_time: Date.now(),
        session_start_time: this.sessionStartTime,
      });

      console.log('Analytics service initialized successfully');
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  async setUser(userId: string, properties?: UserProperties) {
    this.userId = userId;

    // Set user ID in all analytics platforms
    await analytics().setUserId(userId);
    this.mixpanel?.identify(userId);

    // Set user properties
    if (properties) {
      await this.setUserProperties(properties);
    }

    // Track user session start
    this.trackEvent('session_start', {
      user_id: userId,
      session_id: this.sessionId,
      session_start_time: this.sessionStartTime,
    });
  }

  async setUserProperties(properties: UserProperties) {
    this.userProperties = {...this.userProperties, ...properties};

    // Firebase Analytics user properties
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined && value !== null) {
        await analytics().setUserProperty(key, String(value));
      }
    }

    // Mixpanel user properties
    this.mixpanel?.getPeople().set(properties);

    // Add computed properties
    await this.setComputedUserProperties(properties);
  }

  trackEvent(eventName: string, properties?: EventProperties) {
    // Queue events if not initialized
    if (!this.isInitialized) {
      this.eventQueue.push({name: eventName, properties});
      return;
    }

    // Add default properties to every event
    const enrichedProperties = {
      ...properties,
      session_id: this.sessionId,
      timestamp: Date.now(),
      platform: Platform.OS,
      app_version: DeviceInfo.getVersion(),
      build_number: DeviceInfo.getBuildNumber(),
      device_id: DeviceInfo.getUniqueId(),
      user_id: this.userId,
      session_duration: Date.now() - this.sessionStartTime,
    };

    // Send to Firebase Analytics
    analytics().logEvent(
      eventName,
      this.sanitizeProperties(enrichedProperties),

    // Send to Mixpanel with additional context
    this.mixpanel?.track(eventName, enrichedProperties);

    // Log in development
    if (__DEV__) {
      console.log(`📊 Event: ${eventName}`, enrichedProperties);
    }
  }

  trackScreen(screenName: string, properties?: EventProperties) {
    // Firebase screen tracking
    analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });

    // Custom screen view event with properties
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  trackTiming(
    category: string,
    variable: string,
    time: number,
    label?: string,
  ) {
    this.trackEvent('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_time: time,
      timing_label: label,
    });
  }

  async trackRevenue(
    amount: number,
    currency: string,
    properties?: EventProperties,
  ) {
    await analytics().logPurchase({
      value: amount,
      currency: currency,
      items: [],
    });

    this.mixpanel?.getPeople().trackCharge(amount, {
      currency,
      ...properties,
    });

    this.trackEvent('revenue', {
      amount,
      currency,
      ...properties,
    });
  }

  private async setDefaultProperties() {
    const deviceProperties = {
      device_model: DeviceInfo.getModel(),
      device_brand: DeviceInfo.getBrand(),
      device_type: DeviceInfo.getDeviceType(),
      os_version: DeviceInfo.getSystemVersion(),
      app_version: DeviceInfo.getVersion(),
      build_number: DeviceInfo.getBuildNumber(),
      bundle_id: DeviceInfo.getBundleId(),
      is_tablet: DeviceInfo.isTablet(),
      has_notch: DeviceInfo.hasNotch(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: Platform.OS,
    };

    // Set as super properties in Mixpanel
    this.mixpanel?.registerSuperProperties(deviceProperties);
  }

  private async setComputedUserProperties(properties: UserProperties) {
    // User segments
    const segments: string[] = [];

    if (properties.isPremium) {segments.push('premium');}
    if (properties.postCount && properties.postCount > 100)
      {segments.push('power_user');}
    if (properties.isVerified) {segments.push('verified');}
    if (properties.accountAge && properties.accountAge > 365)
      {segments.push('veteran');}

    // Engagement level
    let engagementLevel = 'low';
    if (properties.postCount && properties.postCount > 10) {
      engagementLevel = 'medium';
    }
    if (properties.postCount && properties.postCount > 50) {
      engagementLevel = 'high';
    }

    const computedProperties = {
      user_segments: segments.join(','),
      engagement_level: engagementLevel,
    };

    await analytics().setUserProperty('user_segments', segments.join(','));
    await analytics().setUserProperty('engagement_level', engagementLevel);
    this.mixpanel?.getPeople().set(computedProperties);
  }

  private sanitizeProperties(properties: any): any {
    // Firebase has limits on property names and values
    const sanitized: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === undefined || value === null) {continue;}

      // Limit key length to 40 characters
      const sanitizedKey = key.slice(0, 40).replace(/[^a-zA-Z0-9_]/g, '_');

      // Limit string values to 100 characters
      let sanitizedValue = value;
      if (typeof value === 'string' && value.length > 100) {
        sanitizedValue = value.slice(0, 100);
      }

      // Convert arrays to strings
      if (Array.isArray(value)) {
        sanitizedValue = value.join(',');
      }

      sanitized[sanitizedKey] = sanitizedValue;
    }

    return sanitized;
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent(event.name, event.properties);
      }
    }
  }

  // Convenience methods for common events
  trackButtonClick(buttonName: string, properties?: EventProperties) {
    this.trackEvent('button_click', {
      button_name: buttonName,
      ...properties,
    });
  }

  trackFeatureUsed(featureName: string, properties?: EventProperties) {
    this.trackEvent('feature_used', {
      feature_name: featureName,
      ...properties,
    });
  }

  trackError(error: Error, properties?: EventProperties) {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace
      ...properties,
    });
  }

  trackSocialAction(
    action: string,
    contentType: string,
    contentId: string,
    properties?: EventProperties,
  ) {
    this.trackEvent('social_action', {
      action,
      content_type: contentType,
      content_id: contentId,
      ...properties,
    });
  }

  trackSearch(
    query: string,
    resultCount: number,
    properties?: EventProperties,
  ) {
    this.trackEvent('search_performed', {
      search_query: query,
      result_count: resultCount,
      ...properties,
    });
  }

  trackOnboardingStep(
    step: string,
    completed: boolean,
    properties?: EventProperties,
  ) {
    this.trackEvent('onboarding_step', {
      step_name: step,
      completed,
      ...properties,
    });
  }

  trackWalletAction(
    action: string,
    walletType?: string,
    properties?: EventProperties,
  ) {
    this.trackEvent('wallet_action', {
      wallet_action: action,
      wallet_type: walletType,
      ...properties,
    });
  }

  trackPostAction(
    action: string,
    postId: string,
    properties?: EventProperties,
  ) {
    this.trackEvent('post_action', {
      post_action: action,
      post_id: postId,
      ...properties,
    });
  }

  // Session management
  async endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime;

    this.trackEvent('session_end', {
      session_id: this.sessionId,
      session_duration: sessionDuration,
      session_end_time: Date.now(),
    });
  }

  async startNewSession() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    this.trackEvent('session_start', {
      session_id: this.sessionId,
      session_start_time: this.sessionStartTime,
      user_id: this.userId,
    });
  }

  // Privacy and data management
  async reset() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.userProperties = {};

    await analytics().resetAnalyticsData();
    this.mixpanel?.reset();

    console.log('Analytics data reset');
  }

  async getAnalyticsStatus(): Promise<{
    isInitialized: boolean;
    userId: string | null;
    sessionId: string;
    sessionDuration: number;
    queuedEvents: number;
  }> {
    return {
      isInitialized: this.isInitialized,
      userId: this.userId,
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      queuedEvents: this.eventQueue.length,
    };
  }

  // Batch tracking for performance
  trackBatch(events: Array<{name: string; properties?: EventProperties}>) {
    events.forEach(event => {
      this.trackEvent(event.name, event.properties);
    });
  }

  // Debug helpers
  enableDebugMode() {
    // Enable more verbose logging
    console.log('Analytics debug mode enabled');
  }

  disableDebugMode() {
    console.log('Analytics debug mode disabled');
  }
}

export const analyticsService = new AnalyticsService();
