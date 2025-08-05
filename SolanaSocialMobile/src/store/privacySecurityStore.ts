import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api/client';
import {
  PrivacySettings,
  SecuritySettings,
  SecurityEvent,
  PrivacyAudit,
  ConnectedApp,
} from '../types/privacy-security';

interface PrivacySecurityState {
  // Settings
  privacySettings: PrivacySettings | null;
  securitySettings: SecuritySettings | null;

  // Audit and compliance
  privacyAudit: PrivacyAudit | null;
  securityEvents: SecurityEvent[];

  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => Promise<void>;

  // Two-factor authentication
  enableTwoFactor: (
    method: string,
  ) => Promise<{qrCode?: string; secret?: string}>;
  disableTwoFactor: (method: string) => Promise<void>;
  verifyTwoFactor: (method: string, code: string) => Promise<boolean>;

  // Session management
  fetchActiveSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;

  // Connected apps
  fetchConnectedApps: () => Promise<void>;
  revokeAppAccess: (appId: string) => Promise<void>;

  // Security events
  fetchSecurityEvents: () => Promise<void>;
  markEventResolved: (eventId: string) => Promise<void>;

  // Data management
  exportUserData: () => Promise<string>;
  deleteUserData: () => Promise<void>;
  downloadDataReport: () => Promise<string>;

  // Privacy audit
  fetchPrivacyAudit: () => Promise<void>;
  requestDataDeletion: (reason: string) => Promise<void>;

  // Biometric authentication
  setupBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;

  // Password management
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setupSecurityQuestions: (
    questions: {question: string; answer: string}[],
  ) => Promise<void>;
}

export const usePrivacySecurityStore = create<PrivacySecurityState>()(
  persist(
    (set, get) => ({
      privacySettings: null,
      securitySettings: null,
      privacyAudit: null,
      securityEvents: [],
      loading: false,
      saving: false,
      error: null,

      loadSettings: async () => {
        set({loading: true, error: null});

        try {
          const [privacyResponse, securityResponse] = await Promise.all([
            api.get('/user/privacy-settings'),
            api.get('/user/security-settings'),
          ]);

          if (!privacyResponse.ok || !securityResponse.ok) {
            throw new Error('Failed to load settings');
          }

          set({
            privacySettings: privacyResponse.data?.data,
            securitySettings: securityResponse.data?.data,
            loading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load settings',
            loading: false,
          });
        }
      },

      updatePrivacySettings: async updates => {
        set({saving: true, error: null});

        try {
          const response = await api.patch('/user/privacy-settings', updates);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to update privacy settings',
            );
          }

          set(state => ({
            privacySettings: state.privacySettings
              ? {
                  ...state.privacySettings,
                  ...response.data?.data,
                }
              : response.data?.data,
            saving: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update settings',
            saving: false,
          });
          throw error;
        }
      },

      updateSecuritySettings: async updates => {
        set({saving: true, error: null});

        try {
          const response = await api.patch('/user/security-settings', updates);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to update security settings',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  ...response.data?.data,
                }
              : response.data?.data,
            saving: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update settings',
            saving: false,
          });
          throw error;
        }
      },

      enableTwoFactor: async method => {
        try {
          const response = await api.post('/auth/2fa/enable', {method});

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to enable 2FA');
          }

          // Update security settings
          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  twoFactorEnabled: true,
                  twoFactorMethods: state.securitySettings.twoFactorMethods.map(
                    m =>
                      m.type === method
                        ? {
                            ...m,
                            enabled: true,
                            setupAt: new Date().toISOString(),
                          }
                        : m,
                  ),
                }
              : state.securitySettings,
          }));

          return response.data?.data || {};
        } catch (error) {
          throw error;
        }
      },

      disableTwoFactor: async method => {
        try {
          const response = await api.post('/auth/2fa/disable', {method});

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to disable 2FA');
          }

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  twoFactorMethods: state.securitySettings.twoFactorMethods.map(
                    m => (m.type === method ? {...m, enabled: false} : m),
                  ),
                  twoFactorEnabled:
                    state.securitySettings.twoFactorMethods.some(
                      m => m.type !== method && m.enabled,
                    ),
                }
              : state.securitySettings,
          }));
        } catch (error) {
          throw error;
        }
      },

      verifyTwoFactor: async (method, code) => {
        try {
          const response = await api.post('/auth/2fa/verify', {method, code});
          return response.ok && response.data?.data?.valid;
        } catch (error) {
          return false;
        }
      },

      fetchActiveSessions: async () => {
        try {
          const response = await api.get('/auth/sessions');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to fetch sessions',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  activeSessions: response.data?.data || [],
                }
              : state.securitySettings,
          }));
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
        }
      },

      revokeSession: async sessionId => {
        try {
          const response = await api.delete(`/auth/sessions/${sessionId}`);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to revoke session',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  activeSessions: state.securitySettings.activeSessions.filter(
                    s => s.id !== sessionId,
                  ),
                }
              : state.securitySettings,
          }));
        } catch (error) {
          throw error;
        }
      },

      revokeAllSessions: async () => {
        try {
          const response = await api.delete('/auth/sessions');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to revoke sessions',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  activeSessions: state.securitySettings.activeSessions.filter(
                    s => s.isCurrent,
                  ),
                }
              : state.securitySettings,
          }));
        } catch (error) {
          throw error;
        }
      },

      fetchConnectedApps: async () => {
        try {
          const response = await api.get('/auth/connected-apps');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to fetch connected apps',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  allowedDapps: response.data?.data || [],
                }
              : state.securitySettings,
          }));
        } catch (error) {
          console.error('Failed to fetch connected apps:', error);
        }
      },

      revokeAppAccess: async appId => {
        try {
          const response = await api.delete(`/auth/connected-apps/${appId}`);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to revoke app access',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  allowedDapps: state.securitySettings.allowedDapps.filter(
                    app => app.id !== appId,
                  ),
                }
              : state.securitySettings,
          }));
        } catch (error) {
          throw error;
        }
      },

      fetchSecurityEvents: async () => {
        try {
          const response = await api.get('/user/security-events');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to fetch security events',
            );

          set({securityEvents: response.data?.data || []});
        } catch (error) {
          console.error('Failed to fetch security events:', error);
        }
      },

      markEventResolved: async eventId => {
        try {
          const response = await api.patch(`/user/security-events/${eventId}`, {
            resolved: true,

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to mark event resolved',
            );
          }

          set(state => ({
            securityEvents: state.securityEvents.map(event =>
              event.id === eventId
                ? {
                    ...event,
                    resolved: true,
                    resolvedAt: new Date().toISOString(),
                  }
                : event,
            ),
          }));
        } catch (error) {
          throw error;
        }
      },

      exportUserData: async () => {
        try {
          const response = await api.post('/user/export-data');

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to export data');
          }

          return response.data?.data?.downloadUrl || '';
        } catch (error) {
          throw error;
        }
      },

      deleteUserData: async () => {
        try {
          const response = await api.delete('/user/data');

          if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to delete data');
          }
        } catch (error) {
          throw error;
        }
      },

      downloadDataReport: async () => {
        try {
          const response = await api.get('/user/privacy-report');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to download report',
            );
          }

          return response.data?.data?.reportUrl || '';
        } catch (error) {
          throw error;
        }
      },

      fetchPrivacyAudit: async () => {
        try {
          const response = await api.get('/user/privacy-audit');

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to fetch privacy audit',
            );

          set({privacyAudit: response.data?.data});
        } catch (error) {
          console.error('Failed to fetch privacy audit:', error);
        }
      },

      requestDataDeletion: async reason => {
        try {
          const response = await api.post('/user/request-deletion', {reason});

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to request deletion',
            );
          }
        } catch (error) {
          throw error;
        }
      },

      setupBiometric: async () => {
        try {
          // This would integrate with React Native Biometrics
          // For now, we'll simulate the functionality
          const biometricAvailable = true; // In real app, check device capabilities

          if (biometricAvailable) {
            await get().updateSecuritySettings({biometricEnabled: true});
            return true;
          }

          return false;
        } catch (error) {
          console.error('Biometric setup failed:', error);
          return false;
        }
      },

      disableBiometric: async () => {
        try {
          await get().updateSecuritySettings({biometricEnabled: false});
        } catch (error) {
          throw error;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword,
          });

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to change password',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  lastPasswordChange: new Date().toISOString(),
                }
              : state.securitySettings,
          }));
        } catch (error) {
          throw error;
        }
      },

      setupSecurityQuestions: async questions => {
        try {
          const response = await api.post('/auth/security-questions', {
            questions,

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to setup security questions',
            );

          set(state => ({
            securitySettings: state.securitySettings
              ? {
                  ...state.securitySettings,
                  securityQuestions: response.data?.data || [],
                }
              : state.securitySettings,
          }));
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'privacy-security-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        // Only persist non-sensitive data
        privacySettings: state.privacySettings,
        securitySettings: state.securitySettings
          ? {
              ...state.securitySettings,
              backupCodes: [], // Never persist backup codes
              securityQuestions: state.securitySettings.securityQuestions.map(
                q => ({
                  ...q,
                  hasAnswer: true,
                }),
              ),
            }
          : null,
      }),
    }
  ),
);
