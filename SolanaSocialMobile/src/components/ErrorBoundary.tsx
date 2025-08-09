import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {useThemeStore} from '../store/themeStore';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error?: Error; retry: () => void}>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 ErrorBoundary: Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary: Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={() => this.setState({ hasError: false, error: undefined })}
          />
        );
      }

      return <DefaultErrorFallback 
        error={this.state.error} 
        retry={() => this.setState({ hasError: false, error: undefined })} 
      />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  const { colors } = useThemeStore();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 24,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
        textAlign: 'center',
      }}>
        Something went wrong
      </Text>
      
      <Text style={{
        fontSize: 14,
        color: colors.mutedForeground,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 20,
      }}>
        {error?.message?.includes('memory') || error?.message?.includes('OutOfMemoryError') 
          ? 'The app ran out of memory. Try closing other apps and refreshing.'
          : 'An unexpected error occurred. Please try again.'}
      </Text>
      
      <Pressable
        onPress={retry}
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{
          color: 'white',
          fontSize: 16,
          fontWeight: '500',
        }}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}