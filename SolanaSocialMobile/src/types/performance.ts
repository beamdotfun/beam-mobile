export interface PerformanceMetrics {
  // Frame rate metrics
  fps: {
    current: number;
    average: number;
    min: number;
    drops: number;
  };

  // Memory metrics
  memory: {
    used: number; // MB
    limit: number;
    percentage: number;
    leaks: MemoryLeak[];
  };

  // Render metrics
  render: {
    componentRenders: Record<string, number>;
    unnecessaryRenders: number;
    renderTime: Record<string, number>; // ms
    slowComponents: string[];
  };

  // Network metrics
  network: {
    requests: number;
    failedRequests: number;
    averageLatency: number; // ms
    bandwidth: number; // KB/s
  };

  // Bundle metrics
  bundle: {
    size: number; // KB
    loadTime: number; // ms
    chunks: BundleChunk[];
  };
}

export interface MemoryLeak {
  component: string;
  size: number; // KB
  type: 'listener' | 'timer' | 'subscription' | 'ref';
  stackTrace?: string;
}

export interface BundleChunk {
  name: string;
  size: number; // KB
  loaded: boolean;
  loadTime?: number; // ms
}

export interface OptimizationConfig {
  // Image optimization
  images: {
    enableLazyLoad: boolean;
    enableProgressive: boolean;
    maxCacheSize: number; // MB
    compressionQuality: number; // 0-1
    resizeThreshold: number; // pixels
  };

  // List optimization
  lists: {
    initialNumToRender: number;
    maxToRenderPerBatch: number;
    windowSize: number;
    removeClippedSubviews: boolean;
    updateCellsBatchingPeriod: number; // ms
  };

  // Render optimization
  render: {
    enableMemoization: boolean;
    enableBatching: boolean;
    debounceDelay: number; // ms
    throttleDelay: number; // ms
  };

  // Memory management
  memory: {
    enableGarbageCollection: boolean;
    gcThreshold: number; // MB
    maxCacheAge: number; // minutes
    enableMemoryWarnings: boolean;
  };
}

export interface PerformanceReport {
  timestamp: string;
  duration: number; // seconds
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
  recommendations: string[];
}

export interface PerformanceIssue {
  severity: 'critical' | 'warning' | 'info';
  type: 'memory' | 'render' | 'network' | 'bundle';
  component?: string;
  description: string;
  impact: string;
  solution?: string;
}
