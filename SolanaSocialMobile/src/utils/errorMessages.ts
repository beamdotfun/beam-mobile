/**
 * Maps technical error messages to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';
  
  // Network errors
  if (errorMessage.includes('network request failed') || 
      errorMessage.includes('network error') ||
      errorMessage.includes('fetch failed')) {
    return 'Connection failed. Please check your internet connection and try again.';
  }
  
  // Wallet connection errors
  if (errorMessage.includes('com.solana.mobilewalletadapter') && 
      errorMessage.includes('websocket')) {
    return 'Connection timeout. Please try signing the message again.';
  }
  
  if (errorMessage.includes('unable to connect to websocket server')) {
    return 'Connection timeout. Please try signing the message again.';
  }
  
  if (errorMessage.includes('websocket') && errorMessage.includes('timeout')) {
    return 'Connection timeout. Please try signing the message again.';
  }
  
  if (errorMessage.includes('wallet') && errorMessage.includes('timeout')) {
    return 'Wallet connection timed out. Please try again.';
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  
  // User cancellation
  if (errorMessage.includes('cancelled') || 
      errorMessage.includes('canceled') || 
      errorMessage.includes('rejected') ||
      errorMessage.includes('user denied') ||
      errorMessage.includes('local association')) {
    return 'Wallet connection cancelled.';
  }
  
  // Authentication errors
  if (errorMessage.includes('unauthorized') || 
      errorMessage.includes('401')) {
    return 'Authentication failed. Please sign in again.';
  }
  
  if (errorMessage.includes('invalid token') || 
      errorMessage.includes('token expired')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  // Server errors
  if (errorMessage.includes('internal server error') || 
      errorMessage.includes('500')) {
    return 'Something went wrong on our end. Please try again later.';
  }
  
  if (errorMessage.includes('503') || 
      errorMessage.includes('service unavailable')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  // Validation errors
  if (errorMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  if (errorMessage.includes('password') && errorMessage.includes('short')) {
    return 'Password must be at least 8 characters long.';
  }
  
  if (errorMessage.includes('invalid email or password') || 
      errorMessage.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorMessage.includes('email already exists') || 
      errorMessage.includes('email already registered')) {
    return 'This email is already registered. Please sign in or use a different email.';
  }
  
  if (errorMessage.includes('too many attempts') || 
      errorMessage.includes('rate limit')) {
    return 'Too many attempts. Please try again later.';
  }
  
  // Google Sign-In errors
  if (errorMessage.includes('google') && errorMessage.includes('cancelled')) {
    return 'Google sign in cancelled.';
  }
  
  if (errorMessage.includes('play services')) {
    return 'Google Play Services not available. Please update your device.';
  }
  
  // Wallet specific errors
  if (errorMessage.includes('no wallet found') || 
      errorMessage.includes('wallet not installed')) {
    return 'No Solana wallet found. Please install a wallet app first.';
  }
  
  if (errorMessage.includes('insufficient balance') || 
      errorMessage.includes('insufficient funds')) {
    return 'Insufficient SOL balance for this transaction.';
  }
  
  // Transaction errors
  if (errorMessage.includes('transaction failed')) {
    return 'Transaction failed. Please try again.';
  }
  
  if (errorMessage.includes('blockhash not found')) {
    return 'Network congestion detected. Please try again in a moment.';
  }
  
  // Generic backend errors
  if (errorMessage.includes('backend') && errorMessage.includes('failed')) {
    return 'Unable to connect to our servers. Please try again later.';
  }
  
  // Default fallback - return a generic message
  return 'Something went wrong. Please try again.';
}

/**
 * Extracts clean error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  // If it's already a user-friendly message, return it
  if (typeof error === 'string') {
    return getUserFriendlyErrorMessage(error);
  }
  
  // If it has a message property
  if (error?.message) {
    return getUserFriendlyErrorMessage(error.message);
  }
  
  // If it has an error property (API responses)
  if (error?.error) {
    return getUserFriendlyErrorMessage(error.error);
  }
  
  // If it has a details property (API responses)
  if (error?.details) {
    return getUserFriendlyErrorMessage(error.details);
  }
  
  // Default
  return getUserFriendlyErrorMessage(error);
}