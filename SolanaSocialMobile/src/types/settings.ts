export interface UserSettings {
  // Account Settings
  account: {
    email?: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number; // minutes
  };

  // Privacy Settings
  privacy: {
    profileVisibility: 'public' | 'followers' | 'private';
    showActivity: boolean;
    allowDirectMessages: 'everyone' | 'followers' | 'none';
    allowMentions: 'everyone' | 'followers' | 'none';
    showOnlineStatus: boolean;
    shareTypingIndicators: boolean;
    blockList: string[]; // wallet addresses
    mutedUsers: string[]; // wallet addresses
    mutedWords: string[];
  };

  // Notification Settings
  notifications: {
    push: {
      enabled: boolean;
      newFollowers: boolean;
      mentions: boolean;
      comments: boolean;
      votes: boolean;
      tips: boolean;
      brandUpdates: boolean;
      auctionUpdates: boolean;
      systemAlerts: boolean;
    };
    email: {
      enabled: boolean;
      dailyDigest: boolean;
      weeklyReport: boolean;
      promotionalEmails: boolean;
    };
    inApp: {
      showBadges: boolean;
      soundEnabled: boolean;
      vibrationEnabled: boolean;
    };
  };

  // Appearance Settings
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    colorBlindMode: boolean;
    reduceAnimations: boolean;
    highContrast: boolean;
    language: string;
  };

  // Wallet Settings
  wallet: {
    defaultRpc: string;
    customRpcUrl?: string;
    autoApproveLimit?: number; // SOL amount
    showBalanceInUsd: boolean;
    defaultSlippage: number; // percentage
    priorityFees: 'slow' | 'medium' | 'fast' | 'custom';
    customPriorityFee?: number;
  };

  // Content Settings
  content: {
    defaultFeedSort: 'recent' | 'popular' | 'following';
    autoPlayVideos: 'always' | 'wifi' | 'never';
    showSensitiveContent: boolean;
    dataUsageMode: 'normal' | 'saver';
    cacheSize: number; // MB
    imageQuality: 'low' | 'medium' | 'high' | 'original';
  };

  // Advanced Settings
  advanced: {
    developerMode: boolean;
    debugLogging: boolean;
    analyticsEnabled: boolean;
    crashReporting: boolean;
    betaFeatures: boolean;
    experimentalWallet: boolean;
  };
}

export interface SettingsUpdateRequest {
  section: keyof UserSettings;
  settings: Partial<UserSettings[keyof UserSettings]>;
}

export interface PrivacyAction {
  type: 'block' | 'unblock' | 'mute' | 'unmute' | 'report';
  targetWallet: string;
  reason?: string;
  duration?: number; // for temporary mutes
}

export interface DataExport {
  requestId: string;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  requestedAt: string;
  expiresAt?: string;
  downloadUrl?: string;
  sizeBytes?: number;
}

export interface AccountDeletion {
  requestId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  requestedAt: string;
  scheduledFor: string; // 30 days later
  reason?: string;
}

export interface SecurityLog {
  id: string;
  type:
    | 'login'
    | 'logout'
    | 'password_change'
    | 'settings_change'
    | 'suspicious_activity';
  deviceInfo: {
    platform: string;
    browser?: string;
    location?: string;
  };
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'failed';
}
