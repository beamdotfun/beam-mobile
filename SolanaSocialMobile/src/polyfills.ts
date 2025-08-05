/**
 * React Native Polyfills
 * 
 * This file provides polyfills for Node.js globals that are not available in React Native.
 * It's imported at the app entry point to ensure these globals are available everywhere.
 */

import { Buffer } from 'buffer';

// Make Buffer available globally
(global as any).Buffer = Buffer;

// Log polyfill setup for debugging
if (__DEV__) {
  console.log('✅ Polyfills loaded: Buffer is now available globally');
}