import React from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {Text} from '../ui/text';
import {Button} from '../ui/button';
import {crashReportingService} from '../../services/crashReportingService';
import {analyticsService} from '../../services/analytics/analyticsService';

// Mock react-native-restart since we don't have it installed
const RNRestart = {
  Restart: () => {
    console.log('App restart triggered');
    // In a real app, this would restart the app
  },
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error; retry: () => void}>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableReporting?: boolean;
  maxErrors?: number;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorTimeout?: NodeJS.Timeout;

  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    errorId: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const {enableReporting = true, onError, maxErrors = 5} = this.props;
    const newErrorCount = this.state.errorCount + 1;

    // Log to crash reporting if enabled
    if (enableReporting) {
      crashReportingService.recordJSError(error, errorInfo.componentStack);
    }

    // Track in analytics
    analyticsService.trackEvent('error_boundary_triggered', {
      error_message: error.message,
      error_name: error.name,
      component_stack: errorInfo.componentStack,
      error_count: newErrorCount,
      error_id: this.state.errorId,
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Update state
    this.setState({
      errorInfo,
      errorCount: newErrorCount,
    });

    // Auto-restart if too many errors
    if (newErrorCount >= maxErrors) {
      this.handleRestart();
    }

    // Auto-retry after delay for first few errors
    if (newErrorCount <= 2) {
      this.errorTimeout = setTimeout(() => {
        this.handleReset();
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  handleReset = () => {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    analyticsService.trackEvent('error_boundary_reset', {
      error_id: this.state.errorId,
      error_count: this.state.errorCount,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleRestart = () => {
    analyticsService.trackEvent('error_boundary_restart', {
      error_id: this.state.errorId,
      error_count: this.state.errorCount,
    });

    RNRestart.Restart();
  };

  handleReportBug = () => {
    const {error, errorInfo, errorId} = this.state;

    if (error && errorInfo) {
      // In a real app, this might open a bug report form or email
      console.log('Bug report:', {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });

      analyticsService.trackEvent('bug_report_submitted', {
        error_id: errorId,
        error_message: error.message,
      });
    }
  };

  render() {
    const {fallback: FallbackComponent} = this.props;
    const {hasError, error, errorInfo, errorCount} = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} retry={this.handleReset} />;
      }

      return (
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="bg-red-50 px-6 py-8 border-b border-red-100">
            <View className="items-center">
              <Text className="text-6xl mb-4">😕</Text>
              <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Oops! Something went wrong
              </Text>
              <Text className="text-gray-600 text-center">
                We've encountered an unexpected error. Our team has been
                notified.
              </Text>
            </View>
          </View>

          {/* Error Details (Development Only) */}
          {__DEV__ && (
            <ScrollView className="flex-1 p-6">
              <View className="bg-gray-100 p-4 rounded-lg mb-6">
                <Text className="font-semibold text-gray-900 mb-2">
                  Error Details:
                </Text>
                <Text className="font-mono text-xs text-gray-800 mb-4">
                  {error.toString()}
                </Text>

                {error.stack && (
                  <>
                    <Text className="font-semibold text-gray-900 mb-2">
                      Stack Trace:
                    </Text>
                    <Text className="font-mono text-xs text-gray-600 mb-4">
                      {error.stack}
                    </Text>
                  </>
                )}

                {errorInfo?.componentStack && (
                  <>
                    <Text className="font-semibold text-gray-900 mb-2">
                      Component Stack:
                    </Text>
                    <Text className="font-mono text-xs text-gray-600">
                      {errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>
          )}

          {/* Actions */}
          <View className="p-6 border-t border-gray-200">
            <View className="gap-3">
              <Button onPress={this.handleReset} className="bg-blue-500">
                <Text className="text-white font-semibold">Try Again</Text>
              </Button>

              <Button onPress={this.handleReportBug} variant="outline">
                <Text className="text-gray-800 font-semibold">Report Bug</Text>
              </Button>

              <Button onPress={this.handleRestart} variant="outline">
                <Text className="text-gray-800 font-semibold">Restart App</Text>
              </Button>
            </View>

            {/* Error Count Warning */}
            {errorCount > 2 && (
              <View className="mt-4 p-3 bg-red-100 rounded-lg">
                <Text className="text-red-800 text-center text-sm font-medium">
                  Multiple errors detected ({errorCount} errors)
                </Text>
                <Text className="text-red-600 text-center text-sm mt-1">
                  Please restart the app if issues persist.
                </Text>
              </View>
            )}

            {/* Error ID for Support */}
            {this.state.errorId && (
              <View className="mt-4 p-3 bg-gray-100 rounded-lg">
                <Text className="text-gray-600 text-center text-xs">
                  Error ID: {this.state.errorId}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional error boundary hook for easier use
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    crashReportingService.recordJSError(error, errorInfo?.componentStack);

    analyticsService.trackEvent('manual_error_handled', {
      error_message: error.message,
      error_name: error.name,
    });
  }, []);

  return handleError;
}

// Higher-order component for automatic error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<ErrorBoundaryProps, 'children'>,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

