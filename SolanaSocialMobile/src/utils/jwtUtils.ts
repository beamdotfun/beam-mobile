/**
 * JWT token utilities for React Native
 * Handles token validation without requiring additional dependencies
 */

/**
 * Base64 decode function for React Native
 * React Native doesn't have atob, so we implement our own
 */
function base64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  str = str.replace(/[^A-Za-z0-9+/]/g, '');
  
  while (i < str.length) {
    const encoded1 = chars.indexOf(str.charAt(i++));
    const encoded2 = chars.indexOf(str.charAt(i++));
    const encoded3 = chars.indexOf(str.charAt(i++));
    const encoded4 = chars.indexOf(str.charAt(i++));
    
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
}

interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  userId?: number;
  email?: string;
  [key: string]: any;
}

/**
 * Decode JWT token payload (without verification)
 * Only use for reading expiration and other non-sensitive data
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    if (!payload) {
      return null;
    }

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64 (React Native compatible)
    // React Native doesn't have atob, so we implement base64 decoding
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = base64Decode(base64);
    
    // Validate decoded string before parsing
    if (!decoded || decoded.length === 0) {
      return null;
    }
    
    return JSON.parse(decoded);
  } catch (error) {
    // Only log if it's not a JSON parse error (to reduce noise)
    if (error instanceof SyntaxError) {
      return null;
    }
    console.warn('Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * Returns true if token is expired or invalid
 */
export function isJWTExpired(token: string): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get time until JWT token expires
 * Returns seconds until expiration, or 0 if already expired
 */
export function getJWTTimeUntilExpiry(token: string): number {
  if (!token) {
    return 0;
  }

  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - currentTime;
  return Math.max(0, timeUntilExpiry);
}

/**
 * Get JWT token expiration date
 */
export function getJWTExpirationDate(token: string): Date | null {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}