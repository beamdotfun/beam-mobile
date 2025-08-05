import {
  UserSettings,
  SettingsUpdateRequest,
  DataExport,
  AccountDeletion,
  SecurityLog,
} from '@/types/settings';
import api from './client';
import {ApiResponse} from './types';

class SettingsAPI {
  async getSettings(): Promise<UserSettings> {
    const response = await api.get<ApiResponse<{settings: UserSettings}>>(
      '/settings',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to load settings');
    }

    return response.data.data.settings;
  }

  async updateSettings(data: SettingsUpdateRequest): Promise<void> {
    const response = await api.put<ApiResponse<{}>>('/settings', data);

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to update settings');
    }
  }

  async blockUser(walletAddress: string, reason?: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      '/settings/privacy/block',
      {
        walletAddress,
        reason,
      },
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to block user');
    }
  }

  async unblockUser(walletAddress: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/settings/privacy/block/${walletAddress}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to unblock user');
    }
  }

  async muteUser(walletAddress: string, duration?: number): Promise<void> {
    const response = await api.post<ApiResponse<{}>>('/settings/privacy/mute', {
      walletAddress,
      duration,
    });

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to mute user');
    }
  }

  async unmuteUser(walletAddress: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/settings/privacy/mute/${walletAddress}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to unmute user');
    }
  }

  async reportUser(walletAddress: string, reason: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      '/settings/privacy/report',
      {
        walletAddress,
        reason,
      },
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to report user');
    }
  }

  async getSecurityLogs(): Promise<SecurityLog[]> {
    const response = await api.get<ApiResponse<{logs: SecurityLog[]}>>(
      '/settings/security/logs',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to load security logs');
    }

    return response.data.data.logs;
  }

  async clearSecurityLogs(): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      '/settings/security/logs',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to clear security logs');
    }
  }

  async enableTwoFactor(): Promise<{qrCode: string; secret: string}> {
    const response = await api.post<
      ApiResponse<{qrCode: string; secret: string}>
    >('/settings/security/2fa/enable');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to enable 2FA');
    }

    return response.data.data;
  }

  async disableTwoFactor(code: string): Promise<void> {
    const response = await api.post<ApiResponse<{}>>(
      '/settings/security/2fa/disable',
      {code},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to disable 2FA');
    }
  }

  async requestDataExport(): Promise<DataExport> {
    const response = await api.post<ApiResponse<{export: DataExport}>>(
      '/settings/data/export',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to request data export',
      );
    }

    return response.data.data.export;
  }

  async checkDataExportStatus(requestId: string): Promise<DataExport> {
    const response = await api.get<ApiResponse<{export: DataExport}>>(
      `/settings/data/export/${requestId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to check export status');
    }

    return response.data.data.export;
  }

  async requestAccountDeletion(reason?: string): Promise<AccountDeletion> {
    const response = await api.post<ApiResponse<{deletion: AccountDeletion}>>(
      '/settings/account/delete',
      {reason},
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to request account deletion',
      );
    }

    return response.data.data.deletion;
  }

  async cancelAccountDeletion(): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      '/settings/account/delete',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(
        response.data?.message || 'Failed to cancel account deletion',
      );
    }
  }
}

export const settingsAPI = new SettingsAPI();
