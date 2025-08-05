import {useCallback, useEffect, useRef, useState} from 'react';
import {usePerformanceStore} from '../../store/performance';
import {performanceMonitor} from '../../services/performance';
import {InteractionManager} from 'react-native';

export function usePerformance(componentName: string) {
  const {shouldMemoize} = usePerformanceStore();
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderDelta = currentTime - lastRenderTime.current;

    // Track render
    performanceMonitor.measureComponent(componentName, () => {
      // Component render tracking
    });

    // Check for rapid re-renders (potential performance issue)
    if (renderDelta < 100 && renderCount.current > 1) {
      performanceMonitor.trackUnnecessaryRender(componentName);
    }

    lastRenderTime.current = currentTime;
  });

  const runAfterInteractions = useCallback((callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  }, []);

  const deferredCallback = useCallback((callback: () => void, delay = 0) => {
    const timeout = setTimeout(() => {
      InteractionManager.runAfterInteractions(callback);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  return {
    shouldMemoize: shouldMemoize(componentName),
    runAfterInteractions,
    deferredCallback,
    renderCount: renderCount.current,
  };
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const {config} = usePerformanceStore();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay || config.render.debounceDelay);

    return () => clearTimeout(timeout);
  }, [value, delay, config.render.debounceDelay]);

  return debouncedValue;
}

export function useThrottle<T>(value: T, delay?: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());
  const {config} = usePerformanceStore();

  useEffect(() => {
    const effectDelay = delay || config.render.throttleDelay;
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= effectDelay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, effectDelay);

    return () => clearTimeout(handler);
  }, [value, delay, config.render.throttleDelay]);

  return throttledValue;
}

export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{default: T}>,
  fallback?: React.ComponentType,
): T | React.ComponentType | null {
  const [Component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    let mounted = true;

    InteractionManager.runAfterInteractions(async () => {
      try {
        const imported = await importFn();
        if (mounted) {
          setComponent(() => imported.default);
        }
      } catch (error) {
        console.error('Failed to load component:', error);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return Component || fallback || null;
}

export function useMemoryPressure() {
  const {config, currentMetrics} = usePerformanceStore();
  const [isUnderPressure, setIsUnderPressure] = useState(false);

  useEffect(() => {
    if (!currentMetrics) {
      return;
    }

    const memoryPercentage = currentMetrics.memory.percentage;
    const threshold =
      (config.memory.gcThreshold / currentMetrics.memory.limit) * 100;

    setIsUnderPressure(memoryPercentage > threshold);
  }, [currentMetrics, config.memory.gcThreshold]);

  const requestGarbageCollection = useCallback(() => {
    // In React Native, we can't directly trigger GC
    // But we can suggest memory cleanup
    if (global.gc) {
      global.gc();
    }

    // Clear image cache if under pressure
    if (isUnderPressure) {
      // This would typically call a native module
      console.log('Requesting memory cleanup due to pressure');
    }
  }, [isUnderPressure]);

  return {
    isUnderPressure,
    memoryUsage: currentMetrics?.memory.percentage || 0,
    requestGarbageCollection,
  };
}

export function useRenderOptimization(
  componentName: string,
  props: Record<string, any>,
) {
  const previousProps = useRef<Record<string, any>>();
  const {config} = usePerformanceStore();

  const hasPropsChanged = useCallback(
    (keys?: string[]) => {
      if (!previousProps.current) {
        previousProps.current = props;
        return true;
      }

      const checkKeys = keys || Object.keys(props);
      const changed = checkKeys.some(
        key => previousProps.current![key] !== props[key],
      );

      if (changed) {
        previousProps.current = props;
      }

      return changed;
    },
    [props],
  );

  const shouldUpdate = useCallback(
    (keys?: string[]) => {
      if (!config.render.enableMemoization) {
        return true;
      }

      return hasPropsChanged(keys);
    },
    [config.render.enableMemoization, hasPropsChanged],
  );

  return {
    shouldUpdate,
    hasPropsChanged,
  };
}
