import {Platform, InteractionManager, AppState} from 'react-native';
import {
  PerformanceMetrics,
  MobileOptimizationSettings,
} from '../../types/mobile-optimizations';

/**
 * Performance monitoring utilities
 */
export class PerformanceOptimizer {
  private static frameRateThreshold = 50;
  private static memoryThreshold = 0.8; // 80% of available memory
  private static batteryThreshold = 0.15; // 15% battery

  private static performanceObserver: PerformanceObserver | null = null;
  private static frameRateHistory: number[] = [];
  private static memoryUsageHistory: number[] = [];

  /**
   * Start monitoring performance metrics
   */
  static startMonitoring(callback: (metrics: PerformanceMetrics) => void) {
    // Monitor frame rate using requestAnimationFrame
    this.monitorFrameRate(callback);

    // Monitor memory usage
    this.monitorMemoryUsage(callback);

    // Monitor battery and thermal state
    this.monitorSystemState(callback);
  }

  /**
   * Stop performance monitoring
   */
  static stopMonitoring() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  /**
   * Monitor frame rate and dropped frames
   */
  private static monitorFrameRate(
    callback: (metrics: Partial<PerformanceMetrics>) => void,
  ) {
    let lastTime = performance.now();
    let frameCount = 0;
    let droppedFrames = 0;

    const measureFrameRate = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      frameCount++;

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        const fps = frameCount / (deltaTime / 1000);

        // Track dropped frames (assuming 60fps target)
        const expectedFrames = 60;
        const actualFrames = Math.round(fps);
        droppedFrames += Math.max(0, expectedFrames - actualFrames);

        this.frameRateHistory.push(fps);
        if (this.frameRateHistory.length > 60) {
          // Keep last 60 seconds
          this.frameRateHistory.shift();
        }

        callback({
          frameRate: fps,
          droppedFrames,
          renderTime: 1000 / fps,
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Monitor memory usage
   */
  private static monitorMemoryUsage(
    callback: (metrics: Partial<PerformanceMetrics>) => void,
  ) {
    if (!performance.memory) {
      return;
    }

    const checkMemory = () => {
      const memory = performance.memory;

      this.memoryUsageHistory.push(memory.usedJSHeapSize);
      if (this.memoryUsageHistory.length > 30) {
        // Keep last 30 measurements
        this.memoryUsageHistory.shift();
      }

      callback({
        jsHeapSize: memory.usedJSHeapSize,
        nativeHeapSize: memory.totalJSHeapSize,
        imageMemory: 0, // Would need native implementation
      });
    };

    setInterval(checkMemory, 2000); // Check every 2 seconds
  }

  /**
   * Monitor system state (battery, thermal)
   */
  private static monitorSystemState(
    callback: (metrics: Partial<PerformanceMetrics>) => void,
  ) {
    // Mock implementation - would need native modules for real data
    const checkSystemState = () => {
      callback({
        batteryLevel: 0.8, // Mock value
        thermalState: 'nominal',
        cpuUsage: 0.2, // Mock value
      });
    };

    setInterval(checkSystemState, 5000); // Check every 5 seconds
  }

  /**
   * Optimize performance based on current metrics
   */
  static optimizePerformance(
    metrics: PerformanceMetrics,
    settings: MobileOptimizationSettings,
  ): Partial<MobileOptimizationSettings> {
    const optimizations: Partial<MobileOptimizationSettings> = {};

    // Low frame rate optimizations
    if (metrics.frameRate < this.frameRateThreshold) {
      optimizations.reducedAnimations = true;
      optimizations.adaptiveImageQuality = true;
      optimizations.enableImageCaching = false; // Reduce memory pressure
    }

    // Memory pressure optimizations
    const memoryPressure =
      metrics.jsHeapSize / (performance.memory?.totalJSHeapSize || 1);
    if (memoryPressure > this.memoryThreshold) {
      optimizations.enableImageCaching = false;
      optimizations.prefetchContent = false;
      optimizations.compressImages = true;
    }

    // Battery optimizations
    if (metrics.batteryLevel < this.batteryThreshold) {
      optimizations.reducedAnimations = true;
      optimizations.backgroundSyncLimited = true;
      optimizations.locationUpdatesOptimized = true;
      optimizations.limitVideoQuality = true;
    }

    // Thermal optimizations
    if (
      metrics.thermalState === 'serious' ||
      metrics.thermalState === 'critical'
    ) {
      optimizations.reducedAnimations = true;
      optimizations.enablePerformanceMode = false;
      optimizations.limitVideoQuality = true;
    }

    return optimizations;
  }

  /**
   * Get performance recommendations
   */
  static getPerformanceRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.frameRate < 30) {
      recommendations.push('Enable reduced animations to improve frame rate');
      recommendations.push('Consider lowering image quality settings');
    }

    if (metrics.batteryLevel < 0.2) {
      recommendations.push('Enable battery optimization mode');
      recommendations.push('Disable background sync to save battery');
    }

    if (metrics.thermalState === 'serious') {
      recommendations.push(
        'Device is getting warm - consider reducing performance settings',
      );
    }

    if (metrics.droppedFrames > 10) {
      recommendations.push(
        'Frequent frame drops detected - enable performance mode',
      );
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  static analyzePerformanceTrends() {
    return {
      frameRateAverage:
        this.frameRateHistory.reduce((a, b) => a + b, 0) /
          this.frameRateHistory.length || 0,
      frameRateMin: Math.min(...this.frameRateHistory) || 0,
      frameRateMax: Math.max(...this.frameRateHistory) || 0,
      memoryTrend: this.getMemoryTrend(),
      performanceStability: this.getPerformanceStability(),
    };
  }

  private static getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryUsageHistory.length < 5) {
      return 'stable';
    }

    const recent = this.memoryUsageHistory.slice(-5);
    const older = this.memoryUsageHistory.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = (recentAvg - olderAvg) / olderAvg;

    if (diff > 0.1) {
      return 'increasing';
    }
    if (diff < -0.1) {
      return 'decreasing';
    }
    return 'stable';
  }

  private static getPerformanceStability(): number {
    if (this.frameRateHistory.length < 10) {
      return 1;
    }

    const mean =
      this.frameRateHistory.reduce((a, b) => a + b, 0) /
      this.frameRateHistory.length;
    const variance =
      this.frameRateHistory.reduce((sum, value) => {
        return sum + Math.pow(value - mean, 2);
      }, 0) / this.frameRateHistory.length;

    const standardDeviation = Math.sqrt(variance);

    // Stability score (0-1, where 1 is most stable)
    return Math.max(0, 1 - standardDeviation / mean);
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Get optimal image dimensions based on screen size and performance
   */
  static getOptimalImageSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    quality: 'low' | 'medium' | 'high' = 'medium',
  ) {
    const qualityFactors = {
      low: 0.5,
      medium: 0.75,
      high: 1.0,
    };

    const factor = qualityFactors[quality];
    const effectiveMaxWidth = maxWidth * factor;
    const effectiveMaxHeight = maxHeight * factor;

    const aspectRatio = originalWidth / originalHeight;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetWidth > effectiveMaxWidth) {
      targetWidth = effectiveMaxWidth;
      targetHeight = targetWidth / aspectRatio;
    }

    if (targetHeight > effectiveMaxHeight) {
      targetHeight = effectiveMaxHeight;
      targetWidth = targetHeight * aspectRatio;
    }

    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
      quality: Math.round(
        50 + (quality === 'low' ? 0 : quality === 'medium' ? 25 : 50),
      ),
    };
  }

  /**
   * Calculate optimal cache size based on available memory
   */
  static getOptimalCacheSize(availableMemory: number): number {
    // Use 10-20% of available memory for image cache
    const cacheRatio = availableMemory > 4 * 1024 * 1024 * 1024 ? 0.2 : 0.1; // 20% for high-mem devices, 10% for others
    return Math.round(availableMemory * cacheRatio);
  }
}

/**
 * Animation optimization utilities
 */
export class AnimationOptimizer {
  /**
   * Get optimal animation settings based on performance
   */
  static getOptimalAnimationSettings(frameRate: number, batteryLevel: number) {
    const settings = {
      useNativeDriver: true,
      duration: 300,
      enableSpring: true,
      enableGestures: true,
      enableParallax: true,
    };

    // Reduce animation complexity on poor performance
    if (frameRate < 30 || batteryLevel < 0.2) {
      settings.duration = 150;
      settings.enableSpring = false;
      settings.enableParallax = false;
    }

    // Disable gestures on very poor performance
    if (frameRate < 20) {
      settings.enableGestures = false;
    }

    return settings;
  }

  /**
   * Throttle animations based on performance
   */
  static shouldThrottleAnimation(frameRate: number): boolean {
    return frameRate < 45;
  }
}

/**
 * Network optimization utilities
 */
export class NetworkOptimizer {
  /**
   * Get optimal network settings based on connection type
   */
  static getOptimalNetworkSettings(
    connectionType: string,
    isExpensive: boolean,
  ) {
    const settings = {
      maxConcurrentRequests: 6,
      enablePrefetch: true,
      compressionLevel: 'medium' as 'low' | 'medium' | 'high',
      cacheStrategy: 'aggressive' as 'minimal' | 'moderate' | 'aggressive',
    };

    if (connectionType === 'cellular' || isExpensive) {
      settings.maxConcurrentRequests = 3;
      settings.enablePrefetch = false;
      settings.compressionLevel = 'high';
      settings.cacheStrategy = 'aggressive';
    }

    if (connectionType === '2g' || connectionType === 'slow-2g') {
      settings.maxConcurrentRequests = 1;
      settings.enablePrefetch = false;
      settings.compressionLevel = 'high';
      settings.cacheStrategy = 'aggressive';
    }

    return settings;
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  /**
   * Trigger garbage collection (if available)
   */
  static forceGarbageCollection() {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Clear unnecessary caches
   */
  static clearCaches() {
    // This would integrate with various cache systems
    console.log('Clearing caches to free memory');
  }

  /**
   * Check if memory cleanup is needed
   */
  static shouldCleanupMemory(usedMemory: number, totalMemory: number): boolean {
    return usedMemory / totalMemory > 0.85; // 85% threshold
  }
}
