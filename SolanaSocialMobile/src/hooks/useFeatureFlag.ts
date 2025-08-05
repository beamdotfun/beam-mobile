import {useEffect, useState, useCallback} from 'react';
import {featureFlagService} from '../services/featureFlags/featureFlagService';
import {analyticsService} from '../services/analytics/analyticsService';

export function useFeatureFlag(flagKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(() =>
    featureFlagService.isEnabled(flagKey),
  );

  useEffect(() => {
    // Initial check
    setIsEnabled(featureFlagService.isEnabled(flagKey));

    // Listen for updates
    const handleUpdate = () => {
      const newEnabled = featureFlagService.isEnabled(flagKey);
      setIsEnabled(newEnabled);
    };

    featureFlagService.on('config:updated', handleUpdate);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
    };
  }, [flagKey]);

  // Track usage when component using the flag renders
  useEffect(() => {
    featureFlagService.trackFeatureUsage(flagKey, {
      component_mount: true,
      hook_type: 'useFeatureFlag',
    });
  }, [flagKey]);

  return isEnabled;
}

export function useFeatureFlagValue<T = any>(
  flagKey: string,
  defaultValue?: T,
): T {
  const [value, setValue] = useState<T>(() =>
    featureFlagService.getValue(flagKey, defaultValue),
  );

  useEffect(() => {
    setValue(featureFlagService.getValue(flagKey, defaultValue));

    const handleUpdate = () => {
      setValue(featureFlagService.getValue(flagKey, defaultValue));
    };

    featureFlagService.on('config:updated', handleUpdate);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
    };
  }, [flagKey, defaultValue]);

  // Track value usage
  useEffect(() => {
    featureFlagService.trackFeatureUsage(flagKey, {
      component_mount: true,
      hook_type: 'useFeatureFlagValue',
      value: value,
    });
  }, [flagKey, value]);

  return value;
}

export function useExperiment(experimentKey: string): {
  variant: string;
  trackEvent: (eventName: string, properties?: any) => void;
  isInExperiment: boolean;
} {
  const [variant, setVariant] = useState(() =>
    featureFlagService.getVariant(experimentKey),
  );

  const [isInExperiment, setIsInExperiment] = useState(() => {
    const variantList = featureFlagService.getValue<string[]>(
      `${experimentKey}_variants`,
      ['control'],
    );
    return variantList.length > 1; // More than just control means it's an active experiment
  });

  useEffect(() => {
    const newVariant = featureFlagService.getVariant(experimentKey);
    setVariant(newVariant);

    const variantList = featureFlagService.getValue<string[]>(
      `${experimentKey}_variants`,
      ['control'],
    );
    setIsInExperiment(variantList.length > 1);
  }, [experimentKey]);

  const trackEvent = useCallback(
    (eventName: string, properties?: any) => {
      analyticsService.trackEvent(eventName, {
        experiment: experimentKey,
        variant,
        is_in_experiment: isInExperiment,
        ...properties,
      });
    },
    [experimentKey, variant, isInExperiment],
  );

  // Track experiment exposure
  useEffect(() => {
    if (isInExperiment) {
      analyticsService.trackEvent('experiment_exposure', {
        experiment: experimentKey,
        variant,
        hook_type: 'useExperiment',
      });
    }
  }, [experimentKey, variant, isInExperiment]);

  return {variant, trackEvent, isInExperiment};
}

export function useFeatureFlags(): Record<string, boolean> {
  const [flags, setFlags] = useState(() => featureFlagService.getAllFlags());

  useEffect(() => {
    const handleUpdate = () => {
      setFlags(featureFlagService.getAllFlags());
    };

    featureFlagService.on('config:updated', handleUpdate);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
    };
  }, []);

  return flags;
}

// Hook for conditional rendering based on multiple flags
export function useFeatureFlagGate(
  flags: Record<string, boolean>,
  operator: 'AND' | 'OR' = 'AND',
): boolean {
  const [gateResult, setGateResult] = useState(false);

  useEffect(() => {
    const flagResults = Object.entries(flags).map(
      ([flagKey, requiredValue]) => {
        const actualValue = featureFlagService.isEnabled(flagKey);
        return actualValue === requiredValue;
      },
    );

    const result =
      operator === 'AND'
        ? flagResults.every(Boolean)
        : flagResults.some(Boolean);

    setGateResult(result);

    // Track gate evaluation
    analyticsService.trackEvent('feature_flag_gate_evaluated', {
      flags: Object.keys(flags),
      operator,
      result,
    });
  }, [flags, operator]);

  // Listen for flag updates
  useEffect(() => {
    const handleUpdate = () => {
      const flagResults = Object.entries(flags).map(
        ([flagKey, requiredValue]) => {
          const actualValue = featureFlagService.isEnabled(flagKey);
          return actualValue === requiredValue;
        },
      );

      const result =
        operator === 'AND'
          ? flagResults.every(Boolean)
          : flagResults.some(Boolean);

      setGateResult(result);
    };

    featureFlagService.on('config:updated', handleUpdate);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
    };
  }, [flags, operator]);

  return gateResult;
}

// Hook for rollout percentage tracking
export function useFeatureFlagRollout(flagKey: string): {
  isEnabled: boolean;
  rolloutPercentage: number;
  isInRollout: boolean;
} {
  const isEnabled = useFeatureFlag(flagKey);
  const [rolloutInfo, setRolloutInfo] = useState(() => {
    const flag = featureFlagService.getFeatureFlagDetails(flagKey);
    return {
      rolloutPercentage: flag?.rolloutPercentage || 100,
      isInRollout: (flag?.rolloutPercentage || 100) < 100,
    };
  });

  useEffect(() => {
    const flag = featureFlagService.getFeatureFlagDetails(flagKey);
    setRolloutInfo({
      rolloutPercentage: flag?.rolloutPercentage || 100,
      isInRollout: (flag?.rolloutPercentage || 100) < 100,
    });
  }, [flagKey]);

  useEffect(() => {
    const handleUpdate = () => {
      const flag = featureFlagService.getFeatureFlagDetails(flagKey);
      setRolloutInfo({
        rolloutPercentage: flag?.rolloutPercentage || 100,
        isInRollout: (flag?.rolloutPercentage || 100) < 100,
      });
    };

    featureFlagService.on('config:updated', handleUpdate);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
    };
  }, [flagKey]);

  return {
    isEnabled,
    ...rolloutInfo,
  };
}

// Hook for A/B testing with conversion tracking
export function useABTest(
  experimentKey: string,
  goalEvents: string[] = [],
): {
  variant: string;
  trackConversion: (goalEvent: string, value?: number) => void;
  trackMetric: (metricName: string, value: number) => void;
} {
  const {variant, trackEvent} = useExperiment(experimentKey);

  const trackConversion = useCallback(
    (goalEvent: string, value?: number) => {
      if (goalEvents.includes(goalEvent)) {
        trackEvent('conversion', {
          goal_event: goalEvent,
          conversion_value: value,
        });

        analyticsService.trackEvent('ab_test_conversion', {
          experiment: experimentKey,
          variant,
          goal_event: goalEvent,
          conversion_value: value,
        });
      }
    },
    [experimentKey, variant, goalEvents, trackEvent],
  );

  const trackMetric = useCallback(
    (metricName: string, value: number) => {
      trackEvent('metric', {
        metric_name: metricName,
        metric_value: value,
      });

      analyticsService.trackEvent('ab_test_metric', {
        experiment: experimentKey,
        variant,
        metric_name: metricName,
        metric_value: value,
      });
    },
    [experimentKey, variant, trackEvent],
  );

  return {
    variant,
    trackConversion,
    trackMetric,
  };
}

// Hook for feature flag status monitoring
export function useFeatureFlagStatus(): {
  isLoading: boolean;
  lastUpdated: number;
  version: string;
  errorCount: number;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState(() => {
    const flagStatus = featureFlagService.getStatus();
    return {
      isLoading: !flagStatus.isInitialized,
      lastUpdated: flagStatus.lastUpdated,
      version: flagStatus.version,
      errorCount: 0,
    };
  });

  const refresh = useCallback(async () => {
    setStatus(prev => ({...prev, isLoading: true}));
    try {
      await featureFlagService.refresh();
      setStatus(prev => ({...prev, isLoading: false}));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        errorCount: prev.errorCount + 1,
      }));
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      const flagStatus = featureFlagService.getStatus();
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: flagStatus.lastUpdated,
        version: flagStatus.version,
      }));
    };

    const handleError = () => {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        errorCount: prev.errorCount + 1,
      }));
    };

    featureFlagService.on('config:updated', handleUpdate);
    featureFlagService.on('error', handleError);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
      featureFlagService.off('error', handleError);
    };
  }, []);

  return {...status, refresh};
}

// Hook for performance-sensitive flag checking (cached)
export function useFeatureFlagCached(
  flagKey: string,
  cacheTime: number = 5000,
): boolean {
  const [cachedValue, setCachedValue] = useState(() =>
    featureFlagService.isEnabled(flagKey),
  );
  const [lastCheck, setLastCheck] = useState(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastCheck > cacheTime) {
      const newValue = featureFlagService.isEnabled(flagKey);
      setCachedValue(newValue);
      setLastCheck(now);
    }
  }, [flagKey, cacheTime, lastCheck]);

  // Still listen for config updates for immediate updates
  useEffect(() => {
    const handleUpdate = () => {
      const newValue = featureFlagService.isEnabled(flagKey);
      setCachedValue(newValue);
      setLastCheck(Date.now());
    };

    featureFlagService.on('config:updated', handleUpdate);

    return () => {
      featureFlagService.off('config:updated', handleUpdate);
    };
  }, [flagKey]);

  return cachedValue;
}
