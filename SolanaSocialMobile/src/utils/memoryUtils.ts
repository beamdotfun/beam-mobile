/**
 * Memory utilities for monitoring and managing memory usage
 */

export interface MemoryStats {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  memoryUsagePercentage: number;
}

/**
 * Get current memory usage statistics (web/debug only)
 */
export function getMemoryStats(): MemoryStats | null {
  // Only available in debug mode or web
  if (typeof window !== 'undefined' && (window as any).performance?.memory) {
    const memory = (window as any).performance.memory;
    return {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

/**
 * Check if memory usage is getting critical (>80%)
 */
export function isMemoryUsageCritical(): boolean {
  const stats = getMemoryStats();
  return stats ? stats.memoryUsagePercentage > 80 : false;
}

/**
 * Log memory usage for debugging
 */
export function logMemoryUsage(context: string): void {
  const stats = getMemoryStats();
  if (stats) {
    console.log(`📊 Memory Usage [${context}]:`, {
      used: `${(stats.usedJSHeapSize / 1048576).toFixed(1)}MB`,
      limit: `${(stats.jsHeapSizeLimit / 1048576).toFixed(1)}MB`,
      percentage: `${stats.memoryUsagePercentage.toFixed(1)}%`,
      critical: stats.memoryUsagePercentage > 80 ? '⚠️ HIGH' : '✅ OK'
    });
  }
}

/**
 * Force garbage collection if available (debug mode)
 */
export function forceGarbageCollection(): void {
  if ((global as any).gc) {
    console.log('🗑️ Forcing garbage collection...');
    (global as any).gc();
  }
}

/**
 * Clean up large objects to free memory
 */
export function cleanupLargeObjects(objects: any[]): void {
  objects.forEach(obj => {
    if (obj && typeof obj === 'object') {
      // Clear arrays
      if (Array.isArray(obj)) {
        obj.length = 0;
      } else {
        // Clear object properties
        Object.keys(obj).forEach(key => {
          delete obj[key];
        });
      }
    }
  });
}