import {useEffect, useRef, useCallback} from 'react';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {analyticsService} from '../services/analytics/analyticsService';
import {performanceMonitoring} from '../services/performanceMonitoring';
import {crashReportingService} from '../services/crashReportingService';

// Screen analytics hook
export function useScreenAnalytics(
  screenName: string,
  properties?: Record<string, any>,
  options?: {
    trackExit?: boolean;
    trackPerformance?: boolean;
    updateCrashContext?: boolean;
  },
) {
  const startTime = useRef(Date.now());
  const tracked = useRef(false);
  const {
    trackExit = true,
    trackPerformance = true,
    updateCrashContext = true,
  } = options || {};

  useEffect(() => {
    if (!tracked.current) {
      // Track screen view
      analyticsService.trackScreen(screenName, properties);

      // Set current screen for crash reporting
      if (updateCrashContext) {
        crashReportingService.setScreen(screenName);
      }

      // Track performance
      if (trackPerformance) {
        performanceMonitoring.trackScreenLoadTime(screenName);
      }

      tracked.current = true;
    }

    return () => {
      if (trackExit) {
        // Track screen exit
        const timeSpent = Date.now() - startTime.current;
        analyticsService.trackEvent('screen_exit', {
          screen_name: screenName,
          time_spent_ms: timeSpent,
          exit_timestamp: Date.now(),
        });
      }
    };
  }, [screenName, properties, trackExit, trackPerformance, updateCrashContext]);

  // Reset timer when screen gains focus
  useFocusEffect(
    useCallback(() => {
      startTime.current = Date.now();
    }, []),
  );
}

// Event tracking hook
export function useEventTracking() {
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      analyticsService.trackEvent(eventName, properties);
    },
    [],
  );

  const trackButtonClick = useCallback(
    (buttonName: string, properties?: Record<string, any>) => {
      analyticsService.trackButtonClick(buttonName, properties);
    },
    [],
  );

  const trackFeatureUsed = useCallback(
    (featureName: string, properties?: Record<string, any>) => {
      analyticsService.trackFeatureUsed(featureName, properties);
    },
    [],
  );

  const trackSocialAction = useCallback(
    (
      action: string,
      contentType: string,
      contentId: string,
      properties?: Record<string, any>,
    ) => {
      analyticsService.trackSocialAction(
        action,
        contentType,
        contentId,
        properties,
      );
    },
    [],
  );

  const trackTiming = useCallback(
    (category: string, variable: string, time: number, label?: string) => {
      analyticsService.trackTiming(category, variable, time, label);
    },
    [],
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number, properties?: Record<string, any>) => {
      analyticsService.trackSearch(query, resultCount, properties);
    },
    [],
  );

  const trackWalletAction = useCallback(
    (action: string, walletType?: string, properties?: Record<string, any>) => {
      analyticsService.trackWalletAction(action, walletType, properties);
    },
    [],
  );

  const trackPostAction = useCallback(
    (action: string, postId: string, properties?: Record<string, any>) => {
      analyticsService.trackPostAction(action, postId, properties);
    },
    [],
  );

  return {
    trackEvent,
    trackButtonClick,
    trackFeatureUsed,
    trackSocialAction,
    trackTiming,
    trackSearch,
    trackWalletAction,
    trackPostAction,
  };
}

// Error tracking hook
export function useErrorTracking() {
  const logError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      crashReportingService.recordError(error, context);
    },
    [],
  );

  const logMessage = useCallback(
    (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
      crashReportingService.log(message, level);
    },
    [],
  );

  const setAttribute = useCallback(
    (key: string, value: string | number | boolean) => {
      crashReportingService.setAttribute(key, value);
    },
    [],
  );

  const setContext = useCallback((context: Record<string, any>) => {
    crashReportingService.setContext(context);
  }, []);

  const trackNetworkError = useCallback(
    (url: string, method: string, statusCode: number, error: Error) => {
      crashReportingService.recordNetworkError(url, method, statusCode, error);
    },
    [],
  );

  const trackWalletError = useCallback(
    (error: Error, walletType: string, operation: string) => {
      crashReportingService.trackWalletError(error, walletType, operation);
    },
    [],
  );

  const trackBlockchainError = useCallback(
    (error: Error, network: string, transaction?: string) => {
      crashReportingService.trackBlockchainError(error, network, transaction);
    },
    [],
  );

  const trackAPIError = useCallback(
    (error: Error, endpoint: string, method: string, statusCode?: number) => {
      crashReportingService.trackAPIError(error, endpoint, method, statusCode);
    },
    [],
  );

  const trackUIError = useCallback(
    (error: Error, component: string, userAction?: string) => {
      crashReportingService.trackUIError(error, component, userAction);
    },
    [],
  );

  return {
    logError,
    logMessage,
    setAttribute,
    setContext,
    trackNetworkError,
    trackWalletError,
    trackBlockchainError,
    trackAPIError,
    trackUIError,
  };
}

// Performance tracking hook
export function usePerformanceTracking() {
  const startTrace = useCallback(
    async (traceName: string, attributes?: Record<string, string>) => {
      return await performanceMonitoring.startTrace(traceName, attributes);
    },
    [],
  );

  const stopTrace = useCallback(
    async (traceName: string, metrics?: Record<string, number>) => {
      return await performanceMonitoring.stopTrace(traceName, metrics);
    },
    [],
  );

  const trackCustomMetric = useCallback((name: string, value: number) => {
    performanceMonitoring.trackCustomMetric(name, value);
  }, []);

  const trackRenderTime = useCallback(
    (componentName: string, renderTime: number) => {
      performanceMonitoring.trackRenderTime(componentName, renderTime);
    },
    [],
  );

  const trackApiCall = useCallback(async (url: string, method: string) => {
    return await performanceMonitoring.trackApiCall(url, method);
  }, []);

  return {
    startTrace,
    stopTrace,
    trackCustomMetric,
    trackRenderTime,
    trackApiCall,
  };
}

// Comprehensive analytics hook that combines all tracking
export function useAnalytics(
  screenName?: string,
  screenProperties?: Record<string, any>,
  options?: {
    trackScreen?: boolean;
    trackPerformance?: boolean;
    updateCrashContext?: boolean;
  },
) {
  const events = useEventTracking();
  const errors = useErrorTracking();
  const performance = usePerformanceTracking();

  // Track screen if provided
  useScreenAnalytics(screenName || '', screenProperties, {
    trackExit: options?.trackScreen !== false,
    trackPerformance: options?.trackPerformance !== false,
    updateCrashContext: options?.updateCrashContext !== false,
  });

  return {
    ...events,
    ...errors,
    ...performance,
  };
}

// Hook for component-level performance tracking
export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef(Date.now());
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    performanceMonitoring.trackRenderTime(componentName, renderTime);
  });

  useEffect(() => {
    return () => {
      const componentLifetime = Date.now() - mountTime.current;
      analyticsService.trackEvent('component_unmount', {
        component_name: componentName,
        lifetime_ms: componentLifetime,
      });
    };
  }, [componentName]);

  const trackComponentEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      analyticsService.trackEvent(eventName, {
        ...properties,
        component_name: componentName,
      });
    },
    [componentName],
  );

  const trackComponentError = useCallback(
    (error: Error) => {
      crashReportingService.trackUIError(error, componentName);
    },
    [componentName],
  );

  return {
    trackComponentEvent,
    trackComponentError,
  };
}

// Hook for user journey tracking
export function useUserJourney() {
  const journeyStartTime = useRef(Date.now());
  const journeySteps = useRef<Array<{step: string; timestamp: number}>>([]);

  const addJourneyStep = useCallback(
    (step: string, properties?: Record<string, any>) => {
      const timestamp = Date.now();
      journeySteps.current.push({step, timestamp});

      analyticsService.trackEvent('user_journey_step', {
        step,
        step_number: journeySteps.current.length,
        time_since_start: timestamp - journeyStartTime.current,
        ...properties,
      });
    },
    [],
  );

  const completeJourney = useCallback(
    (journeyName: string, success: boolean = true) => {
      const totalTime = Date.now() - journeyStartTime.current;

      analyticsService.trackEvent('user_journey_complete', {
        journey_name: journeyName,
        success,
        total_time_ms: totalTime,
        total_steps: journeySteps.current.length,
        journey_steps: journeySteps.current.map(s => s.step).join(' -> '),
      });

      // Reset journey
      journeyStartTime.current = Date.now();
      journeySteps.current = [];
    },
    [],
  );

  const abandonJourney = useCallback((journeyName: string, reason?: string) => {
    const totalTime = Date.now() - journeyStartTime.current;

    analyticsService.trackEvent('user_journey_abandoned', {
      journey_name: journeyName,
      abandon_reason: reason,
      total_time_ms: totalTime,
      completed_steps: journeySteps.current.length,
      last_step: journeySteps.current[journeySteps.current.length - 1]?.step,
    });

    // Reset journey
    journeyStartTime.current = Date.now();
    journeySteps.current = [];
  }, []);

  return {
    addJourneyStep,
    completeJourney,
    abandonJourney,
  };
}

// Hook for A/B testing and experiments
export function useExperimentTracking() {
  const trackExperimentView = useCallback(
    (
      experimentName: string,
      variant: string,
      properties?: Record<string, any>,
    ) => {
      analyticsService.trackEvent('experiment_view', {
        experiment_name: experimentName,
        variant,
        ...properties,
      });
    },
    [],
  );

  const trackExperimentAction = useCallback(
    (
      experimentName: string,
      variant: string,
      action: string,
      properties?: Record<string, any>,
    ) => {
      analyticsService.trackEvent('experiment_action', {
        experiment_name: experimentName,
        variant,
        action,
        ...properties,
      });
    },
    [],
  );

  const trackConversion = useCallback(
    (
      experimentName: string,
      variant: string,
      conversionType: string,
      value?: number,
    ) => {
      analyticsService.trackEvent('experiment_conversion', {
        experiment_name: experimentName,
        variant,
        conversion_type: conversionType,
        conversion_value: value,
      });
    },
    [],
  );

  return {
    trackExperimentView,
    trackExperimentAction,
    trackConversion,
  };
}

// Hook for session analytics
export function useSessionAnalytics() {
  const sessionEvents = useRef<Array<{event: string; timestamp: number}>>([]);

  const addSessionEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      sessionEvents.current.push({event: eventName, timestamp: Date.now()});

      analyticsService.trackEvent(eventName, {
        ...properties,
        session_event_count: sessionEvents.current.length,
      });
    },
    [],
  );

  const getSessionSummary = useCallback(() => {
    return {
      eventCount: sessionEvents.current.length,
      events: sessionEvents.current.map(e => e.event),
      sessionDuration:
        sessionEvents.current.length > 0
          ? Date.now() - sessionEvents.current[0].timestamp
          : 0,
    };
  }, []);

  const endSession = useCallback(
    (reason: string = 'user_exit') => {
      const summary = getSessionSummary();

      analyticsService.trackEvent('session_summary', {
        end_reason: reason,
        ...summary,
      });

      // Clear session events
      sessionEvents.current = [];
    },
    [getSessionSummary],
  );

  return {
    addSessionEvent,
    getSessionSummary,
    endSession,
  };
}
