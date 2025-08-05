import React from 'react';
import {
  useFeatureFlag,
  useExperiment,
  useFeatureFlagValue,
} from '../../hooks/useFeatureFlag';
import {featureFlagService} from '../../services/featureFlags/featureFlagService';

interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  trackUsage?: boolean;
  onEnabled?: () => void;
  onDisabled?: () => void;
}

export function FeatureFlag({
  flag,
  children,
  fallback = null,
  trackUsage = true,
  onEnabled,
  onDisabled,
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);

  React.useEffect(() => {
    if (isEnabled && trackUsage) {
      featureFlagService.trackFeatureUsage(flag, {
        component_rendered: true,
        component_type: 'FeatureFlag',
      });
    }
  }, [flag, isEnabled, trackUsage]);

  React.useEffect(() => {
    if (isEnabled) {
      onEnabled?.();
    } else {
      onDisabled?.();
    }
  }, [isEnabled, onEnabled, onDisabled]);

  return <>{isEnabled ? children : fallback}</>;
}

// Inverse feature flag - shows content when flag is disabled
export function FeatureFlagInverse({
  flag,
  children,
  fallback = null,
  trackUsage = true,
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);

  React.useEffect(() => {
    if (!isEnabled && trackUsage) {
      featureFlagService.trackFeatureUsage(flag, {
        component_rendered: true,
        component_type: 'FeatureFlagInverse',
        inverted: true,
      });
    }
  }, [flag, isEnabled, trackUsage]);

  return <>{!isEnabled ? children : fallback}</>;
}

// Feature flag with multiple variants for A/B testing
interface FeatureVariantProps {
  experiment: string;
  variants: Record<string, React.ReactNode>;
  defaultVariant?: string;
  trackUsage?: boolean;
}

export function FeatureVariant({
  experiment,
  variants,
  defaultVariant = 'control',
  trackUsage = true,
}: FeatureVariantProps) {
  const {variant, trackEvent} = useExperiment(experiment);

  React.useEffect(() => {
    if (trackUsage) {
      trackEvent('variant_rendered', {
        component_type: 'FeatureVariant',
        available_variants: Object.keys(variants),
      });
    }
  }, [experiment, variant, trackUsage, variants, trackEvent]);

  const content = variants[variant] || variants[defaultVariant] || null;

  return <>{content}</>;
}

// Progressive feature flag - shows different content based on rollout percentage
interface ProgressiveFeatureProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rolloutStages?: Record<number, React.ReactNode>; // percentage -> content
}

export function ProgressiveFeature({
  flag,
  children,
  fallback = null,
  rolloutStages = {},
}: ProgressiveFeatureProps) {
  const isEnabled = useFeatureFlag(flag);
  const rolloutPercentage = useFeatureFlagValue(
    `${flag}_rollout_percentage`,
    100,
  );

  // Find the appropriate stage based on rollout percentage
  const getStageContent = () => {
    if (!isEnabled) {return fallback;}

    const stages = Object.entries(rolloutStages)
      .map(([percent, content]) => ({percent: Number(percent), content}))
      .sort((a, b) => b.percent - a.percent); // Sort descending

    const currentStage = stages.find(
      stage => rolloutPercentage >= stage.percent,

    return currentStage ? currentStage.content : children;
  };

  React.useEffect(() => {
    featureFlagService.trackFeatureUsage(flag, {
      component_type: 'ProgressiveFeature',
      rollout_percentage: rolloutPercentage,
      stage_count: Object.keys(rolloutStages).length,
    });
  }, [flag, rolloutPercentage, rolloutStages]);

  return <>{getStageContent()}</>;
}

// Feature flag with loading state for async checks
interface AsyncFeatureFlagProps extends FeatureFlagProps {
  loadingComponent?: React.ReactNode;
  timeout?: number;
}

export function AsyncFeatureFlag({
  flag,
  children,
  fallback = null,
  loadingComponent,
  timeout = 5000,
  trackUsage = true,
}: AsyncFeatureFlagProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [timedOut, setTimedOut] = React.useState(false);
  const isEnabled = useFeatureFlag(flag);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      setIsLoading(false);
    }, timeout);

    // Simulate async check completion
    const checkTimer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkTimer);
    };
  }, [timeout]);

  React.useEffect(() => {
    if (!isLoading && isEnabled && trackUsage) {
      featureFlagService.trackFeatureUsage(flag, {
        component_type: 'AsyncFeatureFlag',
        loading_time: timeout,
        timed_out: timedOut,
      });
    }
  }, [flag, isEnabled, isLoading, trackUsage, timeout, timedOut]);

  if (isLoading) {
    return <>{loadingComponent || null}</>;
  }

  if (timedOut) {
    return <>{fallback}</>;
  }

  return <>{isEnabled ? children : fallback}</>;
}

// Feature flag with gradual reveal animation
interface AnimatedFeatureFlagProps extends FeatureFlagProps {
  animationDuration?: number;
  animationType?: 'fade' | 'slide' | 'scale';
}

export function AnimatedFeatureFlag({
  flag,
  children,
  fallback = null,
  animationDuration = 300,
  animationType = 'fade',
  trackUsage = true,
}: AnimatedFeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);
  const [shouldRender, setShouldRender] = React.useState(isEnabled);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (isEnabled !== shouldRender) {
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setShouldRender(isEnabled);
        setIsAnimating(false);
      }, animationDuration / 2);

      return () => clearTimeout(timer);
    }
  }, [isEnabled, shouldRender, animationDuration]);

  React.useEffect(() => {
    if (shouldRender && trackUsage) {
      featureFlagService.trackFeatureUsage(flag, {
        component_type: 'AnimatedFeatureFlag',
        animation_type: animationType,
        animation_duration: animationDuration,
      });
    }
  }, [flag, shouldRender, trackUsage, animationType, animationDuration]);

  // In a real implementation, you'd use Animated from React Native
  // For now, we'll just return the content
  return <>{shouldRender ? children : fallback}</>;
}

// Higher-order component for feature flag wrapping
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: string,
  fallback?: React.ComponentType<P>,
) {
  const WrappedComponent = (props: P) => {
    const isEnabled = useFeatureFlag(flagKey);

    React.useEffect(() => {
      featureFlagService.trackFeatureUsage(flagKey, {
        component_type: 'withFeatureFlag',
        wrapped_component: Component.displayName || Component.name,
      });
    }, [isEnabled]);

    if (!isEnabled) {
      return fallback ? <fallback {...props} /> : null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withFeatureFlag(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Conditional prop injection based on feature flags
interface ConditionalPropsProps {
  children: React.ReactElement;
  flagConditions: Record<string, any>; // flag -> props to inject
}

export function ConditionalProps({
  children,
  flagConditions,
}: ConditionalPropsProps) {
  const additionalProps: Record<string, any> = {};

  // Check each flag condition and collect props
  Object.entries(flagConditions).forEach(([flagKey, props]) => {
    const isEnabled = useFeatureFlag(flagKey);
    if (isEnabled) {
      Object.assign(additionalProps, props);
    }
  });

  React.useEffect(() => {
    const enabledFlags = Object.keys(flagConditions).filter(flag =>
      featureFlagService.isEnabled(flag),
    );

    featureFlagService.trackFeatureUsage('conditional_props', {
      component_type: 'ConditionalProps',
      enabled_flags: enabledFlags,
      total_conditions: Object.keys(flagConditions).length,
    });
  }, [flagConditions]);

  return React.cloneElement(children, additionalProps);
}

// Multi-flag gate component
interface MultiFeatureGateProps {
  flags: Record<string, boolean>; // flag -> required state
  operator?: 'AND' | 'OR';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MultiFeatureGate({
  flags,
  operator = 'AND',
  children,
  fallback = null,
}: MultiFeatureGateProps) {
  const flagResults = Object.entries(flags).map(([flagKey, requiredValue]) => {
    const actualValue = useFeatureFlag(flagKey);
    return actualValue === requiredValue;
  });

  const shouldRender =
    operator === 'AND' ? flagResults.every(Boolean) : flagResults.some(Boolean);

  React.useEffect(() => {
    featureFlagService.trackFeatureUsage('multi_feature_gate', {
      component_type: 'MultiFeatureGate',
      flags: Object.keys(flags),
      operator,
      result: shouldRender,
    });
  }, [flags, operator, shouldRender]);

  return <>{shouldRender ? children : fallback}</>;
}

// Feature flag with user segment targeting
interface SegmentedFeatureProps extends FeatureFlagProps {
  requiredSegments?: string[];
  excludedSegments?: string[];
}

export function SegmentedFeature({
  flag,
  children,
  fallback = null,
  requiredSegments = [],
  excludedSegments = [],
  trackUsage = true,
}: SegmentedFeatureProps) {
  const isEnabled = useFeatureFlag(flag);

  // In a real implementation, you'd check user segments
  // For now, we'll assume the flag service handles this
  const shouldRender = isEnabled;

  React.useEffect(() => {
    if (shouldRender && trackUsage) {
      featureFlagService.trackFeatureUsage(flag, {
        component_type: 'SegmentedFeature',
        required_segments: requiredSegments,
        excluded_segments: excludedSegments,
      });
    }
  }, [flag, shouldRender, trackUsage, requiredSegments, excludedSegments]);

  return <>{shouldRender ? children : fallback}</>;
}
