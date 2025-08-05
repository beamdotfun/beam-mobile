import {Platform} from 'react-native';
import {analyticsService} from './analytics/analyticsService';
import {API_CONFIG} from '../config/api';

// Mock Firebase Crashlytics since we don't have it installed
const crashlytics = () => ({
  setCrashlyticsCollectionEnabled: async (enabled: boolean) => {
    console.log('Crashlytics collection enabled:', enabled);
  },
  setUserId: (userId: string) => {
    console.log('Crashlytics user ID set:', userId);
  },
  setAttribute: (key: string, value: string) => {
    console.log('Crashlytics attribute set:', key, value);
  },
  log: (message: string) => {
    console.log('Crashlytics log:', message);
  },
  recordError: (error: Error) => {
    console.log('Crashlytics error recorded:', error.message);
  },
  crash: () => {
    console.log('Crashlytics test crash triggered');
  },
});

// Mock Sentry since we don't have it installed
const Sentry = {
  init: (config: any) => {
    console.log('Sentry initialized with config:', config);
  },
  setUser: (user: any) => {
    console.log('Sentry user set:', user);
  },
  setTag: (key: string, value: string) => {
    console.log('Sentry tag set:', key, value);
  },
  addBreadcrumb: (breadcrumb: any) => {
    console.log('Sentry breadcrumb added:', breadcrumb);
  },
  captureException: (error: Error, context?: any) => {
    console.log('Sentry exception captured:', error.message, context);
  },
  close: () => {
    console.log('Sentry closed');
  },
  reactNavigationInstrumentation: {},
  ReactNativeTracing: class {
    constructor(config: any) {
      console.log('Sentry ReactNativeTracing initialized:', config);
    }
  },
};

// Mock DeviceInfo
const DeviceInfo = {
  getModel: () => (Platform.OS === 'ios' ? 'iPhone' : 'Android'),
  getBrand: () => (Platform.OS === 'ios' ? 'Apple' : 'Android'),
  getDeviceType: () => 'Handset',
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
  getBundleId: () => 'com.beam.mobile',
  isTablet: () => false,
  getFreeDiskStorage: async () => 1000000000,
  getTotalMemory: async () => 4000000000,
  isEmulator: async () => false,
};

const SENTRY_DSN = 'mock_sentry_dsn';
const API_BASE_URL = API_CONFIG.BASE_URL;

interface CrashContext {
  userId?: string;
  userWallet?: string;
  screenName?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface BreadcrumbEntry {
  message: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  category?: string;
}

class CrashReportingService {
  private context: CrashContext = {};
  private breadcrumbs: BreadcrumbEntry[] = [];
  private readonly MAX_BREADCRUMBS = 100;
  private isInitialized = false;

  async initialize() {
    try {
      // Initialize Firebase Crashlytics
      await crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);

      // Initialize Sentry
      Sentry.init({
        dsn: SENTRY_DSN,
        debug: __DEV__,
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: __DEV__ ? 1.0 : 0.1,
        integrations: [
          new Sentry.ReactNativeTracing({
            routingInstrumentation: Sentry.reactNavigationInstrumentation,
            tracingOrigins: ['localhost', API_BASE_URL, /^\//],
          }),
        ],
        beforeSend: (event: any, hint: any) => {
          // Add custom context
          event.contexts = {
            ...event.contexts,
            app: {
              ...event.contexts?.app,
              ...this.context,
            },
          };

          // Filter out sensitive data
          return this.sanitizeEvent(event);
        },
      });

      // Set default attributes
      await this.setDefaultAttributes();

      this.isInitialized = true;

      // Log initialization
      this.log('Crash reporting initialized', 'info');

      console.log('Crash reporting service initialized successfully');
    } catch (error) {
      console.error('Crash reporting initialization error:', error);
    }
  }

  setUser(userId: string, wallet?: string, email?: string) {
    this.context.userId = userId;
    this.context.userWallet = wallet;

    // Firebase Crashlytics
    crashlytics().setUserId(userId);
    if (wallet) {
      crashlytics().setAttribute('wallet', wallet);
    }

    // Sentry
    Sentry.setUser({
      id: userId,
      email,
      username: wallet,
    });

    this.log(`User set: ${userId}`, 'info');
  }

  setScreen(screenName: string) {
    this.context.screenName = screenName;
    crashlytics().setAttribute('current_screen', screenName);

    Sentry.addBreadcrumb({
      message: `Navigated to ${screenName}`,
      category: 'navigation',
      level: 'info',
    });

    this.addBreadcrumb(`Screen: ${screenName}`, 'info', 'navigation');
  }

  setAction(action: string) {
    this.context.action = action;
    crashlytics().setAttribute('current_action', action);

    this.addBreadcrumb(`Action: ${action}`, 'info', 'user_action');
  }

  setAttribute(key: string, value: string | number | boolean) {
    crashlytics().setAttribute(key, String(value));
    Sentry.setTag(key, String(value));
  }

  setAttributes(attributes: Record<string, string | number | boolean>) {
    Object.entries(attributes).forEach(([key, value]) => {
      this.setAttribute(key, value);
    });
  }

  setContext(context: Partial<CrashContext>) {
    this.context = {...this.context, ...context};

    // Update attributes
    if (context.screenName) {
      this.setAttribute('current_screen', context.screenName);
    }
    if (context.action) {
      this.setAttribute('current_action', context.action);
    }
  }

  log(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    // Firebase Crashlytics log
    crashlytics().log(message);

    // Sentry breadcrumb
    Sentry.addBreadcrumb({
      message,
      level: level as any,
      timestamp: Date.now() / 1000,
    });

    // Internal breadcrumb tracking
    this.addBreadcrumb(message, level);

    // Also track as analytics event for patterns
    if (level === 'error') {
      analyticsService.trackEvent('error_logged', {
        message,
        screen: this.context.screenName,
        action: this.context.action,
      });
    }
  }

  recordError(error: Error, context?: Record<string, any>) {
    // Enhance error with context
    const enhancedError = this.enhanceError(error, context);

    // Firebase Crashlytics
    crashlytics().recordError(enhancedError);

    // Sentry
    Sentry.captureException(enhancedError, {
      contexts: {
        custom: context,
      },
    });

    // Analytics
    analyticsService.trackError(enhancedError, {
      ...context,
      breadcrumbs: this.getRecentBreadcrumbs(10),
      crash_context: this.context,
    });

    this.log(`Error recorded: ${error.message}`, 'error');
  }

  recordFatalError(error: Error, context?: Record<string, any>) {
    // Record as fatal in Crashlytics
    this.recordError(error, {...context, fatal: true});

    // Force crash for testing (only in dev)
    if (__DEV__ && context?.forceCrash) {
      crashlytics().crash();
    }
  }

  recordNetworkError(
    url: string,
    method: string,
    statusCode: number,
    error: Error,
  ) {
    this.recordError(error, {
      error_type: 'network',
      url,
      method,
      status_code: statusCode,
    });

    this.log(`Network error: ${method} ${url} - ${statusCode}`, 'error');
  }

  recordJSError(error: Error, componentStack?: string) {
    this.recordError(error, {
      error_type: 'javascript',
      component_stack: componentStack,
    });

    this.log(`JavaScript error: ${error.message}`, 'error');
  }

  recordNativeError(error: Error, nativeStackTrace?: string) {
    this.recordError(error, {
      error_type: 'native',
      native_stack: nativeStackTrace,
    });

    this.log(`Native error: ${error.message}`, 'error');
  }

  async testCrash() {
    if (__DEV__) {
      this.log('Test crash triggered', 'warning');
      crashlytics().crash();
    }
  }

  private async setDefaultAttributes() {
    const attributes = {
      platform: Platform.OS,
      platform_version: Platform.Version.toString(),
      device_model: DeviceInfo.getModel(),
      device_brand: DeviceInfo.getBrand(),
      device_type: DeviceInfo.getDeviceType(),
      app_version: DeviceInfo.getVersion(),
      build_number: DeviceInfo.getBuildNumber(),
      bundle_id: DeviceInfo.getBundleId(),
      is_tablet: String(DeviceInfo.isTablet()),
      free_disk_storage: String(await DeviceInfo.getFreeDiskStorage()),
      total_memory: String(await DeviceInfo.getTotalMemory()),
      is_emulator: String(await DeviceInfo.isEmulator()),
      environment: __DEV__ ? 'development' : 'production',
    };

    this.setAttributes(attributes);
  }

  private enhanceError(error: Error, context?: Record<string, any>): Error {
    const enhanced = new Error(error.message);
    enhanced.name = error.name;
    enhanced.stack = error.stack;

    // Add context to error
    (enhanced as any).context = {
      ...this.context,
      ...context,
      breadcrumbs: this.getRecentBreadcrumbs(20),
      timestamp: Date.now(),
      error_id: this.generateErrorId(),
    };

    return enhanced;
  }

  private sanitizeEvent(event: any): any | null {
    // Remove sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    if (event.user?.email) {
      event.user.email = event.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    }

    // Remove wallet private keys if accidentally logged
    const sensitivePatterns = [
      /[A-Za-z0-9]{87,88}/, // Potential private keys
      /Bearer\s+[A-Za-z0-9\-._~+\/]+/, // Auth tokens
      /[a-f0-9]{64}/, // Potential hex keys
    ];

    const eventString = JSON.stringify(event);
    let sanitizedString = eventString;

    for (const pattern of sensitivePatterns) {
      sanitizedString = sanitizedString.replace(pattern, '[REDACTED]');
    }

    try {
      return JSON.parse(sanitizedString);
    } catch {
      return event; // Return original if parsing fails
    }
  }

  private addBreadcrumb(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    category?: string,
  ) {
    this.breadcrumbs.push({
      message,
      timestamp: Date.now(),
      level,
      category,
    });

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  private getRecentBreadcrumbs(count: number = 20): string[] {
    return this.breadcrumbs
      .slice(-count)
      .map(
        b =>
          `[${new Date(b.timestamp).toISOString()}] ${b.level.toUpperCase()}: ${
            b.message
          }`,
      );
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods for common scenarios

  trackWalletError(error: Error, walletType: string, operation: string) {
    this.recordError(error, {
      error_category: 'wallet',
      wallet_type: walletType,
      wallet_operation: operation,
    });
  }

  trackBlockchainError(error: Error, network: string, transaction?: string) {
    this.recordError(error, {
      error_category: 'blockchain',
      network,
      transaction_id: transaction,
    });
  }

  trackAPIError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
  ) {
    this.recordError(error, {
      error_category: 'api',
      endpoint,
      method,
      status_code: statusCode,
    });
  }

  trackUIError(error: Error, component: string, userAction?: string) {
    this.recordError(error, {
      error_category: 'ui',
      component,
      user_action: userAction,
    });
  }

  // Performance and health monitoring
  recordPerformanceIssue(type: string, duration: number, threshold: number) {
    if (duration > threshold) {
      this.log(
        `Performance issue: ${type} took ${duration}ms (threshold: ${threshold}ms)`,
        'warning',

      analyticsService.trackEvent('performance_issue', {
        issue_type: type,
        duration_ms: duration,
        threshold_ms: threshold,
        screen: this.context.screenName,
      });
    }
  }

  recordMemoryWarning(usedMemory: number, totalMemory: number) {
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    this.log(
      `Memory warning: ${memoryUsagePercent.toFixed(1)}% used`,
      'warning',

    analyticsService.trackEvent('memory_warning', {
      used_memory: usedMemory,
      total_memory: totalMemory,
      usage_percent: memoryUsagePercent,
      screen: this.context.screenName,
    });
  }

  // Debug and testing utilities
  getBreadcrumbs(): BreadcrumbEntry[] {
    return [...this.breadcrumbs];
  }

  getContext(): CrashContext {
    return {...this.context};
  }

  clearBreadcrumbs() {
    this.breadcrumbs = [];
    this.log('Breadcrumbs cleared', 'info');
  }

  getStatus(): {
    isInitialized: boolean;
    breadcrumbCount: number;
    context: CrashContext;
  } {
    return {
      isInitialized: this.isInitialized,
      breadcrumbCount: this.breadcrumbs.length,
      context: {...this.context},
    };
  }
}

export const crashReportingService = new CrashReportingService();
