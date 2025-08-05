import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PerformanceMetrics,
  PerformanceIssue,
  OptimizationConfig,
  PerformanceReport,
} from '@/types/performance';
import {performanceMonitor} from '../services/performance';

interface PerformanceState {
  // Memoization checker
  shouldMemoize: (componentName: string) => boolean;
  // Configuration
  config: OptimizationConfig;
  isMonitoringEnabled: boolean;
  showDebugOverlay: boolean;

  // Real-time metrics
  currentMetrics: PerformanceMetrics | null;
  recentIssues: PerformanceIssue[];

  // Reports
  reports: PerformanceReport[];
  lastReportTimestamp: string | null;

  // Actions
  updateConfig: (config: Partial<OptimizationConfig>) => void;
  setMonitoring: (enabled: boolean) => void;
  toggleDebugOverlay: () => void;
  updateMetrics: (metrics: PerformanceMetrics) => void;
  addIssue: (issue: PerformanceIssue) => void;
  generateReport: () => Promise<PerformanceReport>;
  clearReports: () => void;
  resetToDefaults: () => void;
}

const defaultConfig: OptimizationConfig = {
  images: {
    enableLazyLoad: true,
    enableProgressive: true,
    maxCacheSize: 100, // MB
    compressionQuality: 0.8,
    resizeThreshold: 1920, // pixels
  },
  lists: {
    initialNumToRender: 10,
    maxToRenderPerBatch: 5,
    windowSize: 10,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 50, // ms
  },
  render: {
    enableMemoization: true,
    enableBatching: true,
    debounceDelay: 300, // ms
    throttleDelay: 100, // ms
  },
  memory: {
    enableGarbageCollection: true,
    gcThreshold: 200, // MB
    maxCacheAge: 30, // minutes
    enableMemoryWarnings: true,
  },
};

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: defaultConfig,
      isMonitoringEnabled: false,
      showDebugOverlay: false,
      currentMetrics: null,
      recentIssues: [],
      reports: [],
      lastReportTimestamp: null,

      // Update configuration
      updateConfig: newConfig => {
        set(state => ({
          config: {
            ...state.config,
            images: {...state.config.images, ...newConfig.images},
            lists: {...state.config.lists, ...newConfig.lists},
            render: {...state.config.render, ...newConfig.render},
            memory: {...state.config.memory, ...newConfig.memory},
          },
        }));
      },

      // Toggle monitoring
      setMonitoring: enabled => {
        if (enabled) {
          performanceMonitor.initialize();

          // Start periodic metric updates
          const updateInterval = setInterval(() => {
            const metrics = performanceMonitor.getMetrics();
            get().updateMetrics(metrics);
          }, 1000);

          // Store interval ID for cleanup
          (global as any).__performanceUpdateInterval = updateInterval;
        } else {
          // Clean up monitoring
          if ((global as any).__performanceUpdateInterval) {
            clearInterval((global as any).__performanceUpdateInterval);
            delete (global as any).__performanceUpdateInterval;
          }
          performanceMonitor.cleanup();
        }

        set({isMonitoringEnabled: enabled});
      },

      // Toggle debug overlay
      toggleDebugOverlay: () => {
        set(state => ({
          showDebugOverlay: !state.showDebugOverlay,
        }));
      },

      // Update current metrics
      updateMetrics: metrics => {
        set({currentMetrics: metrics});

        // Check for memory warnings
        const {memory} = get().config;
        if (memory.enableMemoryWarnings && metrics.memory.percentage > 80) {
          // Could trigger a notification or alert here
          console.warn(
            'High memory usage detected:',
            metrics.memory.percentage + '%',
          );
        }
      },

      // Add performance issue
      addIssue: issue => {
        set(state => {
          const issues = [...state.recentIssues, issue];

          // Keep only last 100 issues
          if (issues.length > 100) {
            issues.shift();
          }

          return {recentIssues: issues};
        });
      },

      // Generate performance report
      generateReport: async () => {
        const report = performanceMonitor.generateReport();

        set(state => {
          const reports = [...state.reports, report];

          // Keep only last 10 reports
          if (reports.length > 10) {
            reports.shift();
          }

          return {
            reports,
            lastReportTimestamp: report.timestamp,
          };
        });

        return report;
      },

      // Clear all reports
      clearReports: () => {
        set({
          reports: [],
          lastReportTimestamp: null,
          recentIssues: [],
        });
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          config: defaultConfig,
          isMonitoringEnabled: false,
          showDebugOverlay: false,
          currentMetrics: null,
          recentIssues: [],
          reports: [],
          lastReportTimestamp: null,
        });
      },

      // Check if component should be memoized
      shouldMemoize: (componentName: string) => {
        const {config, currentMetrics} = get();

        if (!config.render.enableMemoization) {
          return false;
        }

        // Always memoize slow components
        if (currentMetrics?.render.slowComponents.includes(componentName)) {
          return true;
        }

        // Memoize components with high render counts
        const renderCount =
          currentMetrics?.render.componentRenders[componentName] || 0;
        if (renderCount > 10) {
          return true;
        }

        return false;
      },
    }),
    {
      name: 'performance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        config: state.config,
        reports: state.reports,
        lastReportTimestamp: state.lastReportTimestamp,
      }),
    },
  ),
);
