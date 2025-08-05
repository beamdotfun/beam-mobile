import {clsx, type ClassValue} from 'clsx';

/**
 * Utility function to combine and conditionally apply CSS classes
 * Similar to tailwind-merge but simplified for React Native with NativeWind
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Generate standardized avatar fallback text from user data
 * Priority order:
 * 1. First character of displayName
 * 2. First character of username
 * 3. First character of brandName (for brands)
 * 4. First character of name
 * 5. First 2 characters of wallet address
 * 6. Default 'U'
 */
export function getAvatarFallback(userData?: {
  displayName?: string | null;
  username?: string | null;
  brandName?: string | null;
  name?: string | null;
  walletAddress?: string | null;
  primaryWalletAddress?: string | null;
  userWallet?: string | null;
}): string {
  if (!userData) return 'U';
  
  // Try display name first
  if (userData.displayName?.trim()) {
    return userData.displayName.trim().charAt(0).toUpperCase();
  }
  
  // Try username
  if (userData.username?.trim()) {
    return userData.username.trim().charAt(0).toUpperCase();
  }
  
  // Try brand name for brands
  if (userData.brandName?.trim()) {
    return userData.brandName.trim().charAt(0).toUpperCase();
  }
  
  // Try generic name field
  if (userData.name?.trim()) {
    return userData.name.trim().charAt(0).toUpperCase();
  }
  
  // Try wallet address variants
  const walletAddress = userData.walletAddress || userData.primaryWalletAddress || userData.userWallet;
  if (walletAddress?.trim()) {
    return walletAddress.trim().slice(0, 2).toUpperCase();
  }
  
  // Default fallback
  return 'U';
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format currency amounts
 */
export function formatCurrency(amount: number, currency = 'SOL'): string {
  return `${amount.toFixed(4)} ${currency}`;
}

/**
 * Format time ago string
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  return targetDate.toLocaleDateString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation - Solana addresses are 32-44 characters in base58
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
