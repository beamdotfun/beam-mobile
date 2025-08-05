import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ContentReport, ReportSubmission} from '../types/reporting';
import api from '../services/api/client';

interface ReportingState {
  // State
  pendingReports: ContentReport[];
  userReports: ContentReport[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  submitReport: (submission: ReportSubmission) => Promise<void>;
  getUserReports: () => Promise<void>;
  retryFailedReport: (reportId: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;

  // UI state
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useReportingStore = create<ReportingState>()(
  persist(
    (set, get) => ({
      // Initial state
      pendingReports: [],
      userReports: [],
      isSubmitting: false,
      isLoading: false,
      error: null,

      // Submit a new report
      submitReport: async (submission: ReportSubmission) => {
        set({isSubmitting: true, error: null});

        try {
          const response = await api.post('/moderation/reports', submission);

          if (!response.ok) {
            throw new Error(
              response.data?.message || 'Failed to submit report',
            );
          }

          const newReport: ContentReport = response.data.report;

          set(state => ({
            userReports: [newReport, ...state.userReports],
            pendingReports:
              newReport.status === 'pending'
                ? [newReport, ...state.pendingReports]
                : state.pendingReports,
            isSubmitting: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to submit report';

          // Create a pending report for retry later
          const pendingReport: ContentReport = {
            id: `pending_${Date.now()}`,
            reporterWallet:
              useWalletStore.getState().publicKey?.toString() || '',
            reportedContentId: submission.contentId,
            reportedContentType: submission.contentType,
            reportedUserWallet: submission.reportedUserWallet,
            reason: submission.reason,
            description: submission.description,
            status: 'failed',
            createdAt: new Date().toISOString(),
          };

          set(state => ({
            pendingReports: [pendingReport, ...state.pendingReports],
            isSubmitting: false,
            error: errorMessage,
          }));

          throw error;
        }
      },

      // Get user's reports
      getUserReports: async () => {
        set({isLoading: true, error: null});

        try {
          const response = await api.get('/moderation/reports/user');

          if (response.ok && response.data) {
            const reports: ContentReport[] = response.data.reports || [];

            set({
              userReports: reports,
              pendingReports: reports.filter(
                r => r.status === 'pending' || r.status === 'failed',
              ),
              isLoading: false,
            });
          } else {
            set({isLoading: false});
          }
        } catch (error) {
          console.error('Failed to fetch user reports:', error);
          set({
            isLoading: false,
            error: 'Failed to load your reports',
          });
        }
      },

      // Retry a failed report
      retryFailedReport: async (reportId: string) => {
        const report = get().pendingReports.find(r => r.id === reportId);
        if (!report) {
          return;
        }

        try {
          await get().submitReport({
            contentId: report.reportedContentId,
            contentType: report.reportedContentType,
            reportedUserWallet: report.reportedUserWallet,
            reason: report.reason,
            description: report.description,
          });

          // Remove the failed report from pending if successful
          set(state => ({
            pendingReports: state.pendingReports.filter(r => r.id !== reportId),
          }));
        } catch (error) {
          console.error('Failed to retry report:', error);
          throw error;
        }
      },

      // Delete a report (remove from local state)
      deleteReport: async (reportId: string) => {
        try {
          const response = await api.delete(`/moderation/reports/${reportId}`);

          if (response.ok) {
            set(state => ({
              userReports: state.userReports.filter(r => r.id !== reportId),
              pendingReports: state.pendingReports.filter(
                r => r.id !== reportId,
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to delete report:', error);
          // Still remove from local state even if API call fails
          set(state => ({
            userReports: state.userReports.filter(r => r.id !== reportId),
            pendingReports: state.pendingReports.filter(r => r.id !== reportId),
          }));
        }
      },

      // Clear error state
      clearError: () => set({error: null}),

      // Set loading state
      setLoading: (loading: boolean) => set({isLoading: loading}),
    }),
    {
      name: 'reporting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        pendingReports: state.pendingReports,
        userReports: state.userReports,
      }),
    },
  ),
);
