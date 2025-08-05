// import DeviceInfo from "react-native-device-info";

// Mock DeviceInfo for now
const DeviceInfo = {
  getUsedMemory: () => Promise.resolve(100 * 1024 * 1024), // 100MB
  getTotalMemory: () => Promise.resolve(4 * 1024 * 1024 * 1024), // 4GB
};
import {
  PerformanceMetrics,
  PerformanceIssue,
  PerformanceReport,
  MemoryLeak,
} from '@/types/performance';

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: {current: 60, average: 60, min: 60, drops: 0},
    memory: {used: 0, limit: 0, percentage: 0, leaks: []},
    render: {
      componentRenders: {},
      unnecessaryRenders: 0,
      renderTime: {},
      slowComponents: [],
    },
    network: {
      requests: 0,
      failedRequests: 0,
      averageLatency: 0,
      bandwidth: 0,
    },
    bundle: {size: 0, loadTime: 0, chunks: []},
  };

  private frameCallback?: number;
  private lastFrameTime = 0;
  private frameCount = 0;
  private issues: PerformanceIssue[] = [];
  private networkStartTimes = new Map<string, number>();
  private totalDataTransferred = 0;
  private startTime = Date.now();

  initialize() {
    this.setupFrameRateMonitoring();
    this.setupMemoryMonitoring();
    this.monitorNetworkRequests();
  }

  private setupFrameRateMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsValues: number[] = [];

    const measureFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        fpsValues.push(fps);

        // Keep last 60 samples
        if (fpsValues.length > 60) {
          fpsValues.shift();
        }

        this.metrics.fps = {
          current: fps,
          average: Math.round(
            fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
          ),
          min: Math.min(...fpsValues),
          drops: fpsValues.filter(f => f < 55).length,
        };

        // Check for performance issues
        if (fps < 30) {
          this.addIssue({
            severity: 'critical',
            type: 'render',
            description: `Low frame rate detected: ${fps} FPS`,
            impact: 'Severe UI lag and poor user experience',
            solution: 'Optimize heavy components and reduce re-renders',
          });
        } else if (fps < 55) {
          this.addIssue({
            severity: 'warning',
            type: 'render',
            description: `Below target frame rate: ${fps} FPS`,
            impact: 'Noticeable UI stuttering',
            solution: 'Review render optimizations',
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      frameCount++;
      this.frameCallback = requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }

  private setupMemoryMonitoring() {
    const checkMemory = async () => {
      try {
        const memoryInfo = await DeviceInfo.getUsedMemory();
        const totalMemory = await DeviceInfo.getTotalMemory();

        const usedMB = memoryInfo / 1024 / 1024;
        const totalMB = totalMemory / 1024 / 1024;
        const percentage = (usedMB / totalMB) * 100;

        this.metrics.memory = {
          used: Math.round(usedMB),
          limit: Math.round(totalMB),
          percentage: Math.round(percentage),
          leaks: this.detectMemoryLeaks(),
        };

        // Check for memory issues
        if (percentage > 80) {
          this.addIssue({
            severity: 'warning',
            type: 'memory',
            description: `High memory usage: ${Math.round(percentage)}%`,
            impact: 'App may crash or become unresponsive',
            solution: 'Clear caches and optimize memory usage',
          });
        } else if (percentage > 90) {
          this.addIssue({
            severity: 'critical',
            type: 'memory',
            description: `Critical memory usage: ${Math.round(percentage)}%`,
            impact: 'Imminent app crash',
            solution: 'Immediate memory cleanup required',
          });
        }
      } catch (error) {
        console.error('Memory monitoring error:', error);
      }
    };

    // Check memory every 10 seconds
    setInterval(checkMemory, 10000);
    checkMemory();
  }

  private monitorNetworkRequests() {
    const originalFetch = global.fetch;
    let requestCount = 0;
    let failedCount = 0;
    let totalLatency = 0;

    global.fetch = async (...args) => {
      const startTime = performance.now();
      const requestId = `${Date.now()}-${Math.random()}`;
      requestCount++;

      this.networkStartTimes.set(requestId, startTime);

      try {
        const response = await originalFetch(...args);
        const latency = performance.now() - startTime;
        totalLatency += latency;

        // Estimate data transferred (simplified)
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          this.totalDataTransferred += parseInt(contentLength) / 1024; // KB
        }

        this.metrics.network = {
          requests: requestCount,
          failedRequests: failedCount,
          averageLatency: Math.round(totalLatency / requestCount),
          bandwidth: this.calculateBandwidth(),
        };

        if (!response.ok) {
          failedCount++;
        }

        // Check for slow requests
        if (latency > 3000) {
          this.addIssue({
            severity: 'warning',
            type: 'network',
            description: `Slow network request: ${Math.round(latency)}ms`,
            impact: 'Poor user experience with loading delays',
            solution: 'Optimize API calls or implement caching',
          });
        }

        this.networkStartTimes.delete(requestId);
        return response;
      } catch (error) {
        failedCount++;
        this.networkStartTimes.delete(requestId);

        this.metrics.network.failedRequests = failedCount;

        throw error;
      }
    };
  }

  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Check for potential leaks based on render counts
    Object.entries(this.metrics.render.componentRenders).forEach(
      ([component, count]) => {
        if (count > 100) {
          leaks.push({
            component,
            size: 0, // Would need actual measurement
            type: 'subscription',
            stackTrace:
              'High render count indicates possible subscription leak',
          });
        }
      },
    );

    // Check for stale network requests
    const now = performance.now();
    this.networkStartTimes.forEach((startTime, requestId) => {
      if (now - startTime > 30000) {
        // 30 seconds
        leaks.push({
          component: 'NetworkManager',
          size: 0,
          type: 'listener',
          stackTrace: `Stale network request: ${requestId}`,
        });
      }
    });

    return leaks;
  }

  private calculateBandwidth(): number {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    if (elapsedSeconds === 0) {
      return 0;
    }

    // KB/s
    return Math.round(this.totalDataTransferred / elapsedSeconds);
  }

  measureComponent(componentName: string, renderFn: () => void) {
    const startTime = performance.now();

    renderFn();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Track render time
    this.metrics.render.renderTime[componentName] = duration;

    // Track render count
    this.metrics.render.componentRenders[componentName] =
      (this.metrics.render.componentRenders[componentName] || 0) + 1;

    // Check for slow renders
    if (duration > 16.67) {
      // More than one frame at 60fps
      if (!this.metrics.render.slowComponents.includes(componentName)) {
        this.metrics.render.slowComponents.push(componentName);
      }

      this.addIssue({
        severity: 'warning',
        type: 'render',
        component: componentName,
        description: `Slow component render: ${Math.round(duration)}ms`,
        impact: 'Frame drops and UI stuttering',
        solution: `Optimize ${componentName} with React.memo or useMemo`,
      });
    }
  }

  trackUnnecessaryRender(componentName: string) {
    this.metrics.render.unnecessaryRenders++;

    this.addIssue({
      severity: 'info',
      type: 'render',
      component: componentName,
      description: `Unnecessary render in ${componentName}`,
      impact: 'Wasted CPU cycles',
      solution: 'Use React.memo or optimize dependencies',
    });
  }

  getMetrics(): PerformanceMetrics {
    return {...this.metrics};
  }

  getIssues(): PerformanceIssue[] {
    return [...this.issues];
  }

  private addIssue(issue: PerformanceIssue) {
    // Avoid duplicate issues
    const exists = this.issues.some(
      i => i.type === issue.type && i.description === issue.description,
    );

    if (!exists) {
      this.issues.push(issue);

      // Keep only recent issues
      if (this.issues.length > 50) {
        this.issues.shift();
      }
    }
  }

  generateReport(): PerformanceReport {
    const metrics = this.getMetrics();
    const issues = this.getIssues();
    const recommendations = this.generateRecommendations(metrics, issues);

    return {
      timestamp: new Date().toISOString(),
      duration: performance.now() / 1000,
      metrics,
      issues,
      recommendations,
    };
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    issues: PerformanceIssue[],
  ): string[] {
    const recommendations: string[] = [];

    // FPS recommendations
    if (metrics.fps.average < 55) {
      recommendations.push('Enable React.memo for expensive components');
      recommendations.push('Use InteractionManager for heavy operations');
      recommendations.push('Reduce the number of animated components');
    }

    // Memory recommendations
    if (metrics.memory.percentage > 70) {
      recommendations.push('Implement image caching with size limits');
      recommendations.push('Clear unused data from stores');
      recommendations.push('Use FlatList instead of ScrollView for long lists');
    }

    // Network recommendations
    if (metrics.network.averageLatency > 1000) {
      recommendations.push('Implement request caching');
      recommendations.push('Use pagination for large data sets');
      recommendations.push('Consider using a CDN for static assets');
    }

    // Render recommendations
    if (metrics.render.unnecessaryRenders > 10) {
      recommendations.push('Review component dependencies');
      recommendations.push(
        'Use useCallback and useMemo for expensive operations',
      );
      recommendations.push('Split large components into smaller ones');
    }

    // Component-specific recommendations
    metrics.render.slowComponents.forEach(component => {
      recommendations.push(`Optimize ${component} rendering performance`);
    });

    return recommendations;
  }

  cleanup() {
    if (this.frameCallback) {
      cancelAnimationFrame(this.frameCallback);
    }

    // Clear any intervals or listeners
    this.networkStartTimes.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
