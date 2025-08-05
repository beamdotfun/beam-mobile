import {InteractionManager} from 'react-native';
import {analyticsService} from './analytics/analyticsService';
import {crashReportingService} from './crashReportingService';

// Mock Firebase Performance since we don't have it installed
const perf = () => ({
  setPerformanceCollectionEnabled: async (enabled: boolean) => {
    console.log('Firebase Performance collection enabled:', enabled);
  },
  startTrace: async (name: string) => {
    console.log('Firebase Performance trace started:', name);
    return {
      putAttribute: (key: string, value: string) => {
        console.log('Trace attribute set:', key, value);
      },
      putMetric: (key: string, value: number) => {
        console.log('Trace metric set:', key, value);
      },
      getAttribute: (key: string) => {
        return Math.random() * 1000; // Mock duration
      },
      stop: async () => {
        console.log('Trace stopped');
      },
    };
  },
  newHttpMetric: (url: string, method: string) => {
    console.log('HTTP metric created:', method, url);
    return {
      setRequestPayloadSize: (bytes: number) => {
        console.log('Request payload size:', bytes);
      },
      setResponsePayloadSize: (bytes: number) => {
        console.log('Response payload size:', bytes);
      },
      setHttpResponseCode: (code: number) => {
        console.log('HTTP response code:', code);
      },
      setResponseContentType: (type: string) => {
        console.log('Response content type:', type);
      },
      start: async () => {
        console.log('HTTP metric started');
      },
      stop: async () => {
        console.log('HTTP metric stopped');
      },
      getAttribute: (key: string) => {
        return Math.random() * 1000; // Mock duration
      },
    };
  },
});

interface PerformanceMetrics {
  appStartTime?: number;
  screenLoadTimes: Map<string, number[]>;
  apiCallDurations: Map<string, number[]>;
  customMetrics: Map<string, number[]>;
  memoryUsage: number[];
  frameDrops: number;
  renderTimes: Map<string, number[]>;
}

interface TraceInfo {
  trace: any;
  startTime: number;
  attributes: Record<string, string>;
}

interface HttpMetricInfo {
  metric: any;
  startTime: number;
  url: string;
  method: string;
}

class PerformanceMonitoring {
  private metrics: PerformanceMetrics = {
    screenLoadTimes: new Map(),
    apiCallDurations: new Map(),
    customMetrics: new Map(),
    memoryUsage: [],
    frameDrops: 0,
    renderTimes: new Map(),
  };

  private traces = new Map<string, TraceInfo>();
  private httpMetrics = new Map<string, HttpMetricInfo>();
  private performanceObserver?: PerformanceObserver;
  private memoryTimer?: NodeJS.Timeout;
  private isInitialized = false;

  async initialize() {
    try {
      // Enable performance monitoring
      await perf().setPerformanceCollectionEnabled(!__DEV__);

      // Track app start time
      this.trackAppStartTime();

      // Start memory monitoring
      this.startMemoryMonitoring();

      // Set up performance observer for web APIs (if available)
      this.setupPerformanceObserver();

      this.isInitialized = true;

      console.log('Performance monitoring initialized');
    } catch (error) {
      console.error('Performance monitoring initialization error:', error);
    }
  }

  async startTrace(traceName: string, attributes?: Record<string, string>) {
    try {
      const trace = await perf().startTrace(traceName);

      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          trace.putAttribute(key, value);
        });
      }

      this.traces.set(traceName, {
        trace,
        startTime: Date.now(),
        attributes: attributes || {},
      });

      return trace;
    } catch (error) {
      console.error('Error starting trace:', error);
      crashReportingService.recordError(error as Error, {
        trace_name: traceName,
      });
    }
  }

  async stopTrace(traceName: string, metrics?: Record<string, number>) {
    const traceInfo = this.traces.get(traceName);
    if (!traceInfo) {
      console.warn(`Trace ${traceName} not found`);
      return;
    }

    try {
      const duration = Date.now() - traceInfo.startTime;

      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          traceInfo.trace.putMetric(key, value);
        });
      }

      // Add duration metric
      traceInfo.trace.putMetric('duration_ms', duration);

      await traceInfo.trace.stop();
      this.traces.delete(traceName);

      // Store metrics locally
      this.addCustomMetric(traceName, duration);

      // Also track in analytics
      analyticsService.trackEvent('performance_trace_complete', {
        trace_name: traceName,
        duration_ms: duration,
        ...metrics,
        ...traceInfo.attributes,
      });

      // Alert on slow traces
      if (duration > 5000) {
        // 5 seconds
        crashReportingService.recordPerformanceIssue(traceName, duration, 5000);
      }

      return duration;
    } catch (error) {
      console.error('Error stopping trace:', error);
      crashReportingService.recordError(error as Error, {
        trace_name: traceName,
      });
    }
  }

  async trackScreenLoadTime(screenName: string) {
    const startTime = Date.now();
    const traceName = `screen_load_${screenName}`;

    await this.startTrace(traceName, {
      screen_name: screenName,
      load_type: 'screen',
    });

    // Wait for interactions to complete
    InteractionManager.runAfterInteractions(() => {
      const loadTime = Date.now() - startTime;

      this.stopTrace(traceName, {
        load_time_ms: loadTime,
      });

      // Store metric
      const times = this.metrics.screenLoadTimes.get(screenName) || [];
      times.push(loadTime);
      this.metrics.screenLoadTimes.set(screenName, times);

      // Track in analytics if slow
      if (loadTime > 2000) {
        // 2 seconds
        analyticsService.trackEvent('slow_screen_load', {
          screen_name: screenName,
          load_time_ms: loadTime,
        });

        crashReportingService.recordPerformanceIssue(
          `screen_load_${screenName}`,
          loadTime,
          2000,
        );
      }
    });
  }

  async trackApiCall(url: string, method: string) {
    const urlKey = `${method}_${new URL(url).pathname}`;
    const metric = perf().newHttpMetric(url, method as any);

    const metricInfo: HttpMetricInfo = {
      metric,
      startTime: Date.now(),
      url,
      method,
    };

    this.httpMetrics.set(urlKey, metricInfo);
    await metric.start();

    return {
      setRequestPayloadSize: (bytes: number) =>
        metric.setRequestPayloadSize(bytes),
      setResponsePayloadSize: (bytes: number) =>
        metric.setResponsePayloadSize(bytes),
      setHttpResponseCode: (code: number) => metric.setHttpResponseCode(code),
      setResponseContentType: (type: string) =>
        metric.setResponseContentType(type),
      stop: async () => {
        const duration = Date.now() - metricInfo.startTime;

        await metric.stop();

        // Track duration
        const durations = this.metrics.apiCallDurations.get(urlKey) || [];
        durations.push(duration);
        this.metrics.apiCallDurations.set(urlKey, durations);

        // Analytics
        analyticsService.trackEvent('api_call_complete', {
          endpoint: urlKey,
          duration_ms: duration,
          method,
        });

        // Alert on slow API calls
        if (duration > 10000) {
          // 10 seconds
          crashReportingService.recordPerformanceIssue(
            `api_${urlKey}`,
            duration,
            10000,
          );
        }

        this.httpMetrics.delete(urlKey);
      },
    };
  }

  trackCustomMetric(name: string, value: number) {
    this.addCustomMetric(name, value);

    analyticsService.trackEvent('custom_metric', {
      metric_name: name,
      metric_value: value,
    });
  }

  trackRenderTime(componentName: string, renderTime: number) {
    const times = this.metrics.renderTimes.get(componentName) || [];
    times.push(renderTime);
    this.metrics.renderTimes.set(componentName, times);

    // Alert on slow renders
    if (renderTime > 100) {
      // 100ms
      analyticsService.trackEvent('slow_render', {
        component_name: componentName,
        render_time_ms: renderTime,
      });
    }
  }

  trackFrameDrop() {
    this.metrics.frameDrops++;

    // Track significant frame drops
    if (this.metrics.frameDrops % 10 === 0) {
      analyticsService.trackEvent('frame_drops', {
        total_drops: this.metrics.frameDrops,
      });
    }
  }

  trackMemoryUsage(usedMemory: number, totalMemory: number) {
    this.metrics.memoryUsage.push(usedMemory);

    // Keep only recent measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }

    const usagePercent = (usedMemory / totalMemory) * 100;

    // Alert on high memory usage
    if (usagePercent > 80) {
      crashReportingService.recordMemoryWarning(usedMemory, totalMemory);
    }
  }

  trackStartupMetrics() {
    const appStartTime = Date.now() - (performance?.now() || 0);
    this.metrics.appStartTime = appStartTime;

    // Track cold start time
    this.trackCustomMetric('app_start_time', appStartTime);

    analyticsService.trackEvent('app_startup', {
      start_time_ms: appStartTime,
      startup_type: 'cold', // Could be enhanced to detect warm/hot starts
    });
  }

  private trackAppStartTime() {
    this.trackStartupMetrics();
  }

  private startMemoryMonitoring() {
    // Mock memory monitoring (in real app would use actual memory APIs)
    this.memoryTimer = setInterval(() => {
      const mockUsedMemory = Math.random() * 1000000000; // Random between 0-1GB
      const mockTotalMemory = 4000000000; // 4GB

      this.trackMemoryUsage(mockUsedMemory, mockTotalMemory);
    }, 30000); // Every 30 seconds
  }

  private setupPerformanceObserver() {
    // Only available in some environments
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              this.trackCustomMetric(entry.name, entry.duration);
            }
          });
        });

        this.performanceObserver.observe({entryTypes: ['measure']});
      } catch (error) {
        console.warn('PerformanceObserver not available:', error);
      }
    }
  }

  private addCustomMetric(name: string, value: number) {
    const values = this.metrics.customMetrics.get(name) || [];
    values.push(value);

    // Keep only recent values
    if (values.length > 50) {
      values.shift();
    }

    this.metrics.customMetrics.set(name, values);
  }

  getMetricsSummary() {
    const screenLoadAverage = this.calculateAverageMap(
      this.metrics.screenLoadTimes,
    );
    const apiCallAverages = this.calculateAverageMap(
      this.metrics.apiCallDurations,
    );
    const renderAverages = this.calculateAverageMap(this.metrics.renderTimes);
    const customAverages = this.calculateAverageMap(this.metrics.customMetrics);

    const memoryAverage = this.calculateAverage(this.metrics.memoryUsage);

    return {
      appStartTime: this.metrics.appStartTime,
      screenLoadAverages: Object.fromEntries(screenLoadAverage),
      apiCallAverages: Object.fromEntries(apiCallAverages),
      renderAverages: Object.fromEntries(renderAverages),
      customMetrics: Object.fromEntries(customAverages),
      averageMemoryUsage: memoryAverage,
      totalFrameDrops: this.metrics.frameDrops,
      activeTraces: this.traces.size,
      activeHttpMetrics: this.httpMetrics.size,
    };
  }

  getDetailedMetrics() {
    return {
      ...this.getMetricsSummary(),
      rawMetrics: {
        screenLoadTimes: Object.fromEntries(this.metrics.screenLoadTimes),
        apiCallDurations: Object.fromEntries(this.metrics.apiCallDurations),
        renderTimes: Object.fromEntries(this.metrics.renderTimes),
        customMetrics: Object.fromEntries(this.metrics.customMetrics),
        memoryUsage: [...this.metrics.memoryUsage],
      },
    };
  }

  // Performance optimization suggestions
  getPerformanceInsights(): {
    slowScreens: string[];
    slowAPIs: string[];
    slowComponents: string[];
    memoryIssues: boolean;
    frameIssues: boolean;
  } {
    const slowScreens: string[] = [];
    const slowAPIs: string[] = [];
    const slowComponents: string[] = [];

    // Identify slow screens (>2s average)
    this.metrics.screenLoadTimes.forEach((times, screen) => {
      const average = this.calculateAverage(times);
      if (average > 2000) {
        slowScreens.push(screen);
      }
    });

    // Identify slow APIs (>5s average)
    this.metrics.apiCallDurations.forEach((times, api) => {
      const average = this.calculateAverage(times);
      if (average > 5000) {
        slowAPIs.push(api);
      }
    });

    // Identify slow components (>50ms average)
    this.metrics.renderTimes.forEach((times, component) => {
      const average = this.calculateAverage(times);
      if (average > 50) {
        slowComponents.push(component);
      }
    });

    const memoryAverage = this.calculateAverage(this.metrics.memoryUsage);
    const memoryIssues = memoryAverage > 3000000000; // >3GB average
    const frameIssues = this.metrics.frameDrops > 100;

    return {
      slowScreens,
      slowAPIs,
      slowComponents,
      memoryIssues,
      frameIssues,
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateAverageMap(map: Map<string, number[]>): Map<string, number> {
    const averages = new Map<string, number>();

    map.forEach((values, key) => {
      averages.set(key, this.calculateAverage(values));
    });

    return averages;
  }

  // Cleanup
  destroy() {
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Stop all active traces
    this.traces.forEach((_, traceName) => {
      this.stopTrace(traceName);
    });

    // Stop all active HTTP metrics
    this.httpMetrics.forEach(metricInfo => {
      metricInfo.metric.stop();
    });
  }

  // Debug utilities
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeTraces: Array.from(this.traces.keys()),
      activeHttpMetrics: Array.from(this.httpMetrics.keys()),
      metricCounts: {
        screenLoads: this.metrics.screenLoadTimes.size,
        apiCalls: this.metrics.apiCallDurations.size,
        customMetrics: this.metrics.customMetrics.size,
        renderTimes: this.metrics.renderTimes.size,
      },
    };
  }
}

export const performanceMonitoring = new PerformanceMonitoring();
