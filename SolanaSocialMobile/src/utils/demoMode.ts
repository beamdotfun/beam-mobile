/**
 * Demo Mode Utility
 * 
 * Controls debug warnings and error notifications for clean demo recordings.
 * Set DEMO_MODE to true to disable all warnings and errors.
 */

export const DEMO_MODE = true; // Set to false to re-enable warnings

export const configureDemoMode = () => {
  if (__DEV__ && DEMO_MODE) {
    // Disable LogBox (yellow warning boxes)
    const LogBox = require('react-native').LogBox;
    LogBox.ignoreAllLogs(true);
    
    // Disable console outputs
    console.warn = () => {};
    console.error = () => {};
    // console.log = () => {}; // Uncomment this to also disable console.log
    
    console.info('🎬 Demo mode enabled - all warnings and errors suppressed');
  }
};

export const getQueryClientLogger = () => {
  if (__DEV__ && DEMO_MODE) {
    return {
      log: () => {},
      warn: () => {},
      error: () => {},
    };
  }
  return undefined;
};