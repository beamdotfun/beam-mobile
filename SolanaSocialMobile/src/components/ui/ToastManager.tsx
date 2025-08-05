import React, {useState, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import {AnimatedToast, ToastProps} from './AnimatedToast';

interface ToastManagerRef {
  showToast: (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

let toastManagerRef: ToastManagerRef | null = null;

export function ToastManager() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastProps = {
      ...toast,
      id,
      onDismiss: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      },
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods to global ref
  React.useEffect(() => {
    toastManagerRef = {
      showToast,
      hideToast,
      hideAllToasts,
    };

    return () => {
      toastManagerRef = null;
    };
  }, [showToast, hideToast, hideAllToasts]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <AnimatedToast key={toast.id} {...toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});

// Global toast methods
export const toast = {
  show: (options: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    toastManagerRef?.showToast(options);
  },
  success: (title: string, message?: string, options?: Partial<Omit<ToastProps, 'id' | 'onDismiss' | 'type' | 'title' | 'message'>>) => {
    toastManagerRef?.showToast({
      title,
      message,
      type: 'success',
      ...options,
    });
  },
  error: (title: string, message?: string, options?: Partial<Omit<ToastProps, 'id' | 'onDismiss' | 'type' | 'title' | 'message'>>) => {
    toastManagerRef?.showToast({
      title,
      message,
      type: 'error',
      ...options,
    });
  },
  warning: (title: string, message?: string, options?: Partial<Omit<ToastProps, 'id' | 'onDismiss' | 'type' | 'title' | 'message'>>) => {
    toastManagerRef?.showToast({
      title,
      message,
      type: 'warning',
      ...options,
    });
  },
  info: (title: string, message?: string, options?: Partial<Omit<ToastProps, 'id' | 'onDismiss' | 'type' | 'title' | 'message'>>) => {
    toastManagerRef?.showToast({
      title,
      message,
      type: 'info',
      ...options,
    });
  },
  hide: (id: string) => {
    toastManagerRef?.hideToast(id);
  },
  hideAll: () => {
    toastManagerRef?.hideAllToasts();
  },
};