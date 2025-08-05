import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserSettings,
  SettingsUpdateRequest,
  PrivacyAction,
  DataExport,
  AccountDeletion,
  SecurityLog,
} from '../types/settings';
import {settingsAPI} from '../services/api/settings';

interface SettingsState {
  // Settings data
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastUpdated: number | null;
  pendingUpdates: Record<string, any>;
  syncStatus: 'synced' | 'pending' | 'error' | 'syncing';

  // Privacy management
  blockedUsers: Set<string>;
  mutedUsers: Set<string>;

  // Security
  securityLogs: SecurityLog[];
  securityLoading: boolean;

  // Data management
  dataExport: DataExport | null;
  accountDeletion: AccountDeletion | null;

  // Validation and error tracking
  validationErrors: Record<string, string[]>;
  lastError: { section?: string; message: string; timestamp: number } | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (section: keyof UserSettings, updates: any) => Promise<void>;
  updateSettingsBatch: (updates: Array<{ section: keyof UserSettings; data: any }>) => Promise<void>;
  resetSection: (section: keyof UserSettings) => Promise<void>;
  validateSettings: (section: keyof UserSettings, updates: any) => string[];
  retryFailedUpdates: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  // Privacy actions
  blockUser: (walletAddress: string, reason?: string) => Promise<void>;
  unblockUser: (walletAddress: string) => Promise<void>;
  muteUser: (walletAddress: string, duration?: number) => Promise<void>;
  unmuteUser: (walletAddress: string) => Promise<void>;
  reportUser: (walletAddress: string, reason: string) => Promise<void>;

  // Security
  loadSecurityLogs: () => Promise<void>;
  clearSecurityLogs: () => Promise<void>;
  enableTwoFactor: () => Promise<{qrCode: string; secret: string}>;
  disableTwoFactor: (code: string) => Promise<void>;

  // Data management
  requestDataExport: () => Promise<void>;
  checkDataExportStatus: (requestId: string) => Promise<void>;
  requestAccountDeletion: (reason?: string) => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;

  // Cache management
  clearCache: () => Promise<void>;
  calculateCacheSize: () => Promise<number>;

  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearValidationErrors: (section?: keyof UserSettings) => void;
  clearLastError: () => void;
}

const defaultSettings: UserSettings = {
  account: {
    emailVerified: false,
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 60,
  },
  privacy: {
    profileVisibility: 'public',
    showActivity: true,
    allowDirectMessages: 'followers',
    allowMentions: 'everyone',
    showOnlineStatus: true,
    shareTypingIndicators: true,
    blockList: [],
    mutedUsers: [],
    mutedWords: [],
  },
  notifications: {
    push: {
      enabled: true,
      newFollowers: true,
      mentions: true,
      comments: true,
      votes: true,
      tips: true,
      brandUpdates: true,
      auctionUpdates: true,
      systemAlerts: true,
    },
    email: {
      enabled: false,
      dailyDigest: false,
      weeklyReport: false,
      promotionalEmails: false,
    },
    inApp: {
      showBadges: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    colorBlindMode: false,
    reduceAnimations: false,
    highContrast: false,
    language: 'en',
  },
  wallet: {
    defaultRpc: 'https://api.mainnet-beta.solana.com',
    showBalanceInUsd: true,
    defaultSlippage: 0.5,
    priorityFees: 'medium',
  },
  content: {
    defaultFeedSort: 'recent',
    autoPlayVideos: 'wifi',
    showSensitiveContent: false,
    dataUsageMode: 'normal',
    cacheSize: 100,
    imageQuality: 'high',
  },
  advanced: {
    developerMode: false,
    debugLogging: false,
    analyticsEnabled: true,
    crashReporting: true,
    betaFeatures: false,
    experimentalWallet: false,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      loading: false,
      saving: false,
      error: null,
      lastUpdated: null,
      pendingUpdates: {},
      syncStatus: 'synced',
      blockedUsers: new Set(),
      mutedUsers: new Set(),
      securityLogs: [],
      securityLoading: false,
      dataExport: null,
      accountDeletion: null,
      validationErrors: {},
      lastError: null,

      // Load settings from backend
      loadSettings: async () => {
        set({loading: true, error: null});

        try {
          const settings = await settingsAPI.getSettings();

          set({
            settings,
            blockedUsers: new Set(settings.privacy.blockList),
            mutedUsers: new Set(settings.privacy.mutedUsers),
            loading: false,
          });
        } catch (error) {
          console.error('Failed to load settings:', error);
          set({
            loading: false,
            error: 'Failed to load settings. Using defaults.',
          });
        }
      },

      // Validate settings before update
      validateSettings: (section: keyof UserSettings, updates: any) => {
        const errors: string[] = [];
        
        switch (section) {
          case 'account':
            if (updates.sessionTimeout && (updates.sessionTimeout < 5 || updates.sessionTimeout > 480)) {
              errors.push('Session timeout must be between 5 and 480 minutes');
            }
            if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
              errors.push('Please enter a valid email address');
            }
            break;
            
          case 'wallet':
            if (updates.defaultSlippage && (updates.defaultSlippage < 0 || updates.defaultSlippage > 100)) {
              errors.push('Slippage must be between 0% and 100%');
            }
            if (updates.autoApproveLimit && updates.autoApproveLimit < 0) {
              errors.push('Auto-approve limit cannot be negative');
            }
            if (updates.customRpcUrl && !/^https?:\/\/.+/.test(updates.customRpcUrl)) {
              errors.push('RPC URL must be a valid HTTP/HTTPS URL');
            }
            break;
            
          case 'content':
            if (updates.cacheSize && (updates.cacheSize < 10 || updates.cacheSize > 1000)) {
              errors.push('Cache size must be between 10MB and 1000MB');
            }
            break;
            
          case 'privacy':
            if (updates.mutedWords && updates.mutedWords.some(word => word.length > 50)) {
              errors.push('Muted words cannot exceed 50 characters each');
            }
            break;
        }
        
        return errors;
      },

      // Enhanced update settings with validation and retry logic
      updateSettings: async (section: keyof UserSettings, updates: any) => {
        const {settings, validateSettings} = get();
        if (!settings) {
          throw new Error('Settings not loaded');
        }

        // Validate updates
        const validationErrors = validateSettings(section, updates);
        if (validationErrors.length > 0) {
          set({
            validationErrors: {
              ...get().validationErrors,
              [section]: validationErrors
            },
            lastError: {
              section,
              message: validationErrors.join(', '),
              timestamp: Date.now()
            }
          });
          throw new Error(validationErrors.join(', '));
        }

        // Clear validation errors for this section
        const {[section]: _, ...restValidationErrors} = get().validationErrors;
        set({ 
          validationErrors: restValidationErrors,
          saving: true, 
          error: null,
          syncStatus: 'syncing'
        });

        const originalSettings = settings;
        const updateKey = `${section}-${Date.now()}`;

        try {
          // Optimistic update
          const updatedSettings = {
            ...settings,
            [section]: {
              ...settings[section],
              ...updates,
            },
          };

          set({
            settings: updatedSettings,
            pendingUpdates: {
              ...get().pendingUpdates,
              [updateKey]: { section, data: updates, timestamp: Date.now() }
            }
          });

          // Save to backend with retry logic
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              await settingsAPI.updateSettings({section, settings: updates});
              break;
            } catch (error) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw error;
              }
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
          }

          // Success - remove from pending updates
          const {[updateKey]: removed, ...remainingUpdates} = get().pendingUpdates;
          set({
            saving: false,
            syncStatus: 'synced',
            lastUpdated: Date.now(),
            pendingUpdates: remainingUpdates,
            lastError: null
          });
          
        } catch (error) {
          console.error('Failed to update settings:', error);

          // Revert optimistic update
          const {[updateKey]: removed, ...remainingUpdates} = get().pendingUpdates;
          set({
            settings: originalSettings,
            saving: false,
            syncStatus: 'error',
            error: 'Failed to save settings. Please try again.',
            pendingUpdates: remainingUpdates,
            lastError: {
              section,
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now()
            }
          });

          throw error;
        }
      },

      // Batch update multiple settings sections
      updateSettingsBatch: async (updates: Array<{ section: keyof UserSettings; data: any }>) => {
        const {settings} = get();
        if (!settings) {
          throw new Error('Settings not loaded');
        }

        // Validate all updates first
        const allValidationErrors: Record<string, string[]> = {};
        for (const update of updates) {
          const errors = get().validateSettings(update.section, update.data);
          if (errors.length > 0) {
            allValidationErrors[update.section] = errors;
          }
        }

        if (Object.keys(allValidationErrors).length > 0) {
          set({
            validationErrors: allValidationErrors,
            lastError: {
              message: 'Validation failed for multiple sections',
              timestamp: Date.now()
            }
          });
          throw new Error('Validation failed for one or more settings sections');
        }

        set({ saving: true, error: null, syncStatus: 'syncing' });
        const originalSettings = settings;

        try {
          // Apply all optimistic updates
          let updatedSettings = { ...settings };
          for (const update of updates) {
            updatedSettings = {
              ...updatedSettings,
              [update.section]: {
                ...updatedSettings[update.section],
                ...update.data,
              },
            };
          }

          set({ settings: updatedSettings });

          // Save all updates to backend
          await Promise.all(
            updates.map(update =>
              settingsAPI.updateSettings({
                section: update.section,
                settings: update.data
              })
            )
          );

          set({
            saving: false,
            syncStatus: 'synced',
            lastUpdated: Date.now(),
            lastError: null
          });
          
        } catch (error) {
          console.error('Failed to update settings batch:', error);

          // Revert all optimistic updates
          set({
            settings: originalSettings,
            saving: false,
            syncStatus: 'error',
            error: 'Failed to save settings. Please try again.',
            lastError: {
              message: error instanceof Error ? error.message : 'Batch update failed',
              timestamp: Date.now()
            }
          });

          throw error;
        }
      },

      // Retry failed updates
      retryFailedUpdates: async () => {
        const { pendingUpdates } = get();
        const failedUpdates = Object.entries(pendingUpdates);
        
        if (failedUpdates.length === 0) {
          return;
        }

        set({ syncStatus: 'syncing' });
        
        try {
          for (const [key, update] of failedUpdates) {
            await get().updateSettings(update.section, update.data);
          }
          
          set({ 
            syncStatus: 'synced',
            pendingUpdates: {},
            lastError: null
          });
        } catch (error) {
          set({ syncStatus: 'error' });
          throw error;
        }
      },

      // Sync with server to get latest settings
      syncWithServer: async () => {
        set({ loading: true });
        
        try {
          await get().loadSettings();
          set({ 
            syncStatus: 'synced',
            lastUpdated: Date.now(),
            lastError: null
          });
        } catch (error) {
          set({ 
            syncStatus: 'error',
            lastError: {
              message: 'Failed to sync with server',
              timestamp: Date.now()
            }
          });
          throw error;
        }
      },

      // Reset section to defaults
      resetSection: async (section: keyof UserSettings) => {
        const defaults = defaultSettings[section];
        await get().updateSettings(section, defaults);
      },

      // Block user
      blockUser: async (walletAddress: string, reason?: string) => {
        try {
          await settingsAPI.blockUser(walletAddress, reason);

          set(state => {
            const newBlockedUsers = new Set(state.blockedUsers);
            newBlockedUsers.add(walletAddress);

            return {
              blockedUsers: newBlockedUsers,
              settings: state.settings
                ? {
                    ...state.settings,
                    privacy: {
                      ...state.settings.privacy,
                      blockList: Array.from(newBlockedUsers),
                    },
                  }
                : state.settings,
            };
          });
        } catch (error) {
          console.error('Failed to block user:', error);
          throw error;
        }
      },

      // Unblock user
      unblockUser: async (walletAddress: string) => {
        try {
          await settingsAPI.unblockUser(walletAddress);

          set(state => {
            const newBlockedUsers = new Set(state.blockedUsers);
            newBlockedUsers.delete(walletAddress);

            return {
              blockedUsers: newBlockedUsers,
              settings: state.settings
                ? {
                    ...state.settings,
                    privacy: {
                      ...state.settings.privacy,
                      blockList: Array.from(newBlockedUsers),
                    },
                  }
                : state.settings,
            };
          });
        } catch (error) {
          console.error('Failed to unblock user:', error);
          throw error;
        }
      },

      // Mute user
      muteUser: async (walletAddress: string, duration?: number) => {
        try {
          await settingsAPI.muteUser(walletAddress, duration);

          set(state => {
            const newMutedUsers = new Set(state.mutedUsers);
            newMutedUsers.add(walletAddress);

            return {
              mutedUsers: newMutedUsers,
              settings: state.settings
                ? {
                    ...state.settings,
                    privacy: {
                      ...state.settings.privacy,
                      mutedUsers: Array.from(newMutedUsers),
                    },
                  }
                : state.settings,
            };
          });
        } catch (error) {
          console.error('Failed to mute user:', error);
          throw error;
        }
      },

      // Unmute user
      unmuteUser: async (walletAddress: string) => {
        try {
          await settingsAPI.unmuteUser(walletAddress);

          set(state => {
            const newMutedUsers = new Set(state.mutedUsers);
            newMutedUsers.delete(walletAddress);

            return {
              mutedUsers: newMutedUsers,
              settings: state.settings
                ? {
                    ...state.settings,
                    privacy: {
                      ...state.settings.privacy,
                      mutedUsers: Array.from(newMutedUsers),
                    },
                  }
                : state.settings,
            };
          });
        } catch (error) {
          console.error('Failed to unmute user:', error);
          throw error;
        }
      },

      // Report user
      reportUser: async (walletAddress: string, reason: string) => {
        try {
          await settingsAPI.reportUser(walletAddress, reason);
        } catch (error) {
          console.error('Failed to report user:', error);
          throw error;
        }
      },

      // Load security logs
      loadSecurityLogs: async () => {
        set({securityLoading: true});

        try {
          const logs = await settingsAPI.getSecurityLogs();
          set({securityLogs: logs, securityLoading: false});
        } catch (error) {
          console.error('Failed to load security logs:', error);
          set({securityLoading: false});
        }
      },

      // Clear security logs
      clearSecurityLogs: async () => {
        try {
          await settingsAPI.clearSecurityLogs();
          set({securityLogs: []});
        } catch (error) {
          console.error('Failed to clear security logs:', error);
          throw error;
        }
      },

      // Enable two-factor authentication
      enableTwoFactor: async () => {
        try {
          const result = await settingsAPI.enableTwoFactor();

          set(state => ({
            settings: state.settings
              ? {
                  ...state.settings,
                  account: {
                    ...state.settings.account,
                    twoFactorEnabled: true,
                  },
                }
              : state.settings,
          }));

          return result;
        } catch (error) {
          console.error('Failed to enable 2FA:', error);
          throw error;
        }
      },

      // Disable two-factor authentication
      disableTwoFactor: async (code: string) => {
        try {
          await settingsAPI.disableTwoFactor(code);

          set(state => ({
            settings: state.settings
              ? {
                  ...state.settings,
                  account: {
                    ...state.settings.account,
                    twoFactorEnabled: false,
                  },
                }
              : state.settings,
          }));
        } catch (error) {
          console.error('Failed to disable 2FA:', error);
          throw error;
        }
      },

      // Request data export
      requestDataExport: async () => {
        try {
          const exportRequest = await settingsAPI.requestDataExport();
          set({dataExport: exportRequest});
        } catch (error) {
          console.error('Failed to request data export:', error);
          throw error;
        }
      },

      // Check data export status
      checkDataExportStatus: async (requestId: string) => {
        try {
          const status = await settingsAPI.checkDataExportStatus(requestId);
          set({dataExport: status});
        } catch (error) {
          console.error('Failed to check export status:', error);
          throw error;
        }
      },

      // Request account deletion
      requestAccountDeletion: async (reason?: string) => {
        try {
          const deletionRequest = await settingsAPI.requestAccountDeletion(
            reason,
          );
          set({accountDeletion: deletionRequest});
        } catch (error) {
          console.error('Failed to request account deletion:', error);
          throw error;
        }
      },

      // Cancel account deletion
      cancelAccountDeletion: async () => {
        try {
          await settingsAPI.cancelAccountDeletion();
          set({accountDeletion: null});
        } catch (error) {
          console.error('Failed to cancel account deletion:', error);
          throw error;
        }
      },

      // Clear cache
      clearCache: async () => {
        try {
          // Clear AsyncStorage cache
          const keys = await AsyncStorage.getAllKeys();
          const cacheKeys = keys.filter(
            key =>
              key.startsWith('cache_') ||
              key.startsWith('image_') ||
              key.startsWith('temp_'),
          );
          await AsyncStorage.multiRemove(cacheKeys);

          // Clear image cache if using a library like FastImage
          // FastImage.clearDiskCache();
          // FastImage.clearMemoryCache();
        } catch (error) {
          console.error('Failed to clear cache:', error);
          throw error;
        }
      },

      // Calculate cache size
      calculateCacheSize: async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          let totalSize = 0;

          for (const key of keys) {
            if (key.startsWith('cache_') || key.startsWith('image_')) {
              const value = await AsyncStorage.getItem(key);
              if (value) {
                totalSize += value.length;
              }
            }
          }

          return totalSize / 1024 / 1024; // Convert to MB
        } catch (error) {
          console.error('Failed to calculate cache size:', error);
          return 0;
        }
      },

      // Utilities
      setLoading: (loading: boolean) => set({loading}),
      setError: (error: string | null) => set({error}),
      clearValidationErrors: (section?: keyof UserSettings) => {
        if (section) {
          const {[section]: _, ...rest} = get().validationErrors;
          set({ validationErrors: rest });
        } else {
          set({ validationErrors: {} });
        }
      },
      clearLastError: () => set({ lastError: null }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        settings: state.settings,
      }),
    },
  ),
);
