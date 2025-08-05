import api from './client';
import {ContentReport, ReportSubmission} from '../../types/reporting';
import {ApiResponse} from './types';

export class ReportingAPIService {
  /**
   * Submit a new content report
   */
  async submitReport(submission: ReportSubmission): Promise<ContentReport> {
    const response = await api.post<ApiResponse<{report: ContentReport}>>(
      '/moderation/reports',
      submission,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'Failed to submit report');
    }

    return response.data.data.report;
  }

  /**
   * Get user's submitted reports
   */
  async getUserReports(): Promise<ContentReport[]> {
    const response = await api.get<ApiResponse<{reports: ContentReport[]}>>(
      '/moderation/reports/user',
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch user reports');
    }

    return response.data.data.reports;
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<ContentReport> {
    const response = await api.get<ApiResponse<{report: ContentReport}>>(
      `/moderation/reports/${reportId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch report');
    }

    return response.data.data.report;
  }

  /**
   * Update report status (retry failed report)
   */
  async retryReport(reportId: string): Promise<ContentReport> {
    const response = await api.post<ApiResponse<{report: ContentReport}>>(
      `/moderation/reports/${reportId}/retry`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to retry report submission');
    }

    return response.data.data.report;
  }

  /**
   * Delete/withdraw a report
   */
  async deleteReport(reportId: string): Promise<void> {
    const response = await api.delete<ApiResponse<{}>>(
      `/moderation/reports/${reportId}`,
    );

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to delete report');
    }
  }

  /**
   * Get reporting statistics for the user
   */
  async getReportingStats(): Promise<{
    totalReports: number;
    pendingReports: number;
    submittedReports: number;
    failedReports: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        stats: {
          totalReports: number;
          pendingReports: number;
          submittedReports: number;
          failedReports: number;
        };
      }>
    >('/moderation/reports/stats');

    if (!response.ok || response.data?.status !== 'success') {
      throw new Error('Failed to fetch reporting statistics');
    }

    return response.data.data.stats;
  }
}

export const reportingAPI = new ReportingAPIService();
