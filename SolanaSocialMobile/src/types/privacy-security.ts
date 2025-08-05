export interface PrivacySettings {
  // Profile visibility
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showWallet: boolean;
  showRealName: boolean;
  showLocation: boolean;
  showBio: boolean;

  // Activity visibility
  showActivity: boolean;
  showVotingHistory: boolean;
  showTipHistory: boolean;
  showFollowing: boolean;
  showFollowers: boolean;
  showGroups: boolean;

  // Content settings
  allowDirectMessages: DMPermission;
  allowMentions: MentionPermission;
  allowTagging: TaggingPermission;
  allowComments: CommentPermission;

  // Search and discovery
  discoverableByEmail: boolean;
  discoverableByUsername: boolean;
  showInSuggestions: boolean;
  allowAnalytics: boolean;

  // Communication
  allowNotifications: boolean;
  allowEmailUpdates: boolean;
  allowPushNotifications: boolean;

  // Blockchain privacy
  hideTransactionHistory: boolean;
  usePrivateNotes: boolean;
  anonymousVoting: boolean;
}

export type ProfileVisibility = 'public' | 'followers' | 'friends' | 'private';
export type DMPermission = 'everyone' | 'followers' | 'friends' | 'none';
export type MentionPermission = 'everyone' | 'followers' | 'friends' | 'none';
export type TaggingPermission = 'everyone' | 'followers' | 'friends' | 'none';
export type CommentPermission = 'everyone' | 'followers' | 'friends' | 'none';

export interface SecuritySettings {
  // Authentication
  twoFactorEnabled: boolean;
  twoFactorMethods: TwoFactorMethod[];
  biometricEnabled: boolean;

  // Sessions
  activeSessions: DeviceSession[];
  sessionTimeout: number; // minutes
  requireAuthForSensitive: boolean;

  // Wallet security
  requireWalletConfirmation: boolean;
  transactionLimits: TransactionLimits;
  allowedDapps: ConnectedApp[];

  // Account security
  lastPasswordChange?: string;
  securityQuestions: SecurityQuestion[];
  backupCodes: string[];

  // Login security
  loginAlerts: boolean;
  suspiciousActivityAlerts: boolean;
  deviceVerification: boolean;

  // Data security
  encryptPrivateData: boolean;
  autoLockTimer: number; // minutes
  clearDataOnLogout: boolean;
}

export interface TwoFactorMethod {
  type: '2fa_app' | 'sms' | 'email' | 'hardware_key';
  enabled: boolean;
  setupAt?: string;
  lastUsed?: string;
  isPrimary: boolean;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  location: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
  userAgent: string;
}

export interface TransactionLimits {
  dailyLimit: number; // SOL
  perTransactionLimit: number; // SOL
  requireConfirmationAbove: number; // SOL
  cooldownPeriod: number; // seconds
}

export interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  connectedAt: string;
  lastUsed: string;
  isRevoked: boolean;
  iconUrl?: string;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  hasAnswer: boolean;
  createdAt: string;
}

export interface PrivacyAudit {
  // Data collection
  dataCollected: DataCategory[];
  dataShared: DataSharingInfo[];
  dataRetention: DataRetentionPolicy;

  // Privacy compliance
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  rightToDelete: boolean;
  rightToExport: boolean;

  // Analytics and tracking
  analyticsEnabled: boolean;
  thirdPartyTracking: boolean;
  advertisingPersonalization: boolean;

  // Data security
  encryptionLevel: string;
  dataLocation: string;
  backupLocations: string[];
}

export interface DataCategory {
  category: string;
  description: string;
  purpose: string;
  required: boolean;
  canOptOut: boolean;
  retention: string;
}

export interface DataSharingInfo {
  party: string;
  purpose: string;
  dataTypes: string[];
  canOptOut: boolean;
  jurisdiction: string;
}

export interface DataRetentionPolicy {
  personalData: string;
  analyticsData: string;
  transactionData: string;
  communicationData: string;
  deletionProcess: string;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export type SecurityEventType =
  | 'login_attempt'
  | 'password_change'
  | 'email_change'
  | 'wallet_connection'
  | 'suspicious_activity'
  | 'failed_login'
  | 'account_locked'
  | 'data_export'
  | 'privacy_setting_change';

export interface PrivacyReport {
  period: string;
  dataAccessed: number;
  dataShared: number;
  privacyRequestsProcessed: number;
  securityIncidents: number;
  complianceScore: number;
  recommendations: string[];
}
