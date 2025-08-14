/**
 * Token Manager
 * 
 * Centralized token management to avoid circular dependencies between
 * client.ts and auth.ts. This module provides a simple token storage
 * mechanism that can be imported by both without creating cycles.
 */

// In-memory token storage
let authToken: string | null = null;

// Callback functions to avoid circular dependencies
let tokenRefreshCallback: (() => Promise<string>) | null = null;
let authErrorCallback: (() => Promise<void>) | null = null;

/**
 * Set the authentication token
 */
export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

/**
 * Get the current authentication token
 */
export const getAuthToken = (): string | null => {
  return authToken;
};

/**
 * Check if a token is currently set
 */
export const hasAuthToken = (): boolean => {
  return authToken !== null && authToken.length > 0;
};

/**
 * Clear the authentication token
 */
export const clearAuthToken = (): void => {
  authToken = null;
};

/**
 * Set callback for token refresh (called by auth store)
 */
export const setTokenRefreshCallback = (callback: (() => Promise<string>) | null): void => {
  tokenRefreshCallback = callback;
};

/**
 * Set callback for auth error handling (called by auth store)
 */
export const setAuthErrorCallback = (callback: (() => Promise<void>) | null): void => {
  authErrorCallback = callback;
};

/**
 * Handle token refresh via callback
 */
export const handleTokenRefresh = async (): Promise<string> => {
  if (!tokenRefreshCallback) {
    throw new Error('Token refresh callback not set');
  }
  return await tokenRefreshCallback();
};

/**
 * Handle auth error via callback
 */
export const handleAuthError = async (): Promise<void> => {
  if (!authErrorCallback) {
    console.warn('Auth error callback not set, cannot handle auth error');
    return;
  }
  await authErrorCallback();
};