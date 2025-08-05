import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ContentModerationSystem,
  ContentReport,
  FlaggedAd,
  AdRemovalRequest,
  UserModerationDashboard,
  UserReportingStats,
  ReportFilters,
  RemovalRequestFilters,
  SubmitReportRequest,
  RequestRemovalRequest,
  ReportEvidence,
  UserModerationAnalytics,
  ModerationAchievement,
} from '../types/advanced-moderation';
import {analyticsService} from '../services/analytics/analyticsService';
import {API_CONFIG} from '../config/api';

// Use centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface AdvancedModerationStore {
  // State
  moderationSystem: ContentModerationSystem | null;
  userDashboard: UserModerationDashboard | null;
  userAnalytics: UserModerationAnalytics | null;
  userAchievements: ModerationAchievement[];
  selectedReport: ContentReport | null;
  selectedFlaggedAd: FlaggedAd | null;
  selectedRemovalRequest: AdRemovalRequest | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  isUploadingEvidence: boolean;
  error: string | null;

  // Cache management
  lastFetchTime: number;
  cacheExpiration: number; // 10 minutes

  // User reporting actions
  submitAdvancedReport: (report: SubmitReportRequest) => Promise<ContentReport>;
  addReportEvidence: (
    reportId: string,
    evidence: ReportEvidence,
  ) => Promise<void>;
  withdrawReport: (reportId: string) => Promise<void>;

  // User ad removal actions
  requestAdRemoval: (
    request: RequestRemovalRequest,
  ) => Promise<AdRemovalRequest>;
  cancelRemovalRequest: (requestId: string) => Promise<void>;

  // User data fetching
  fetchUserDashboard: () => Promise<void>;
  fetchAvailableForRemoval: (filters?: RemovalRequestFilters) => Promise<void>;
  fetchUserReports: (filters?: ReportFilters) => Promise<void>;
  fetchUserRemovalRequests: (filters?: RemovalRequestFilters) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  fetchUserAnalytics: (timeRange?: string) => Promise<void>;
  fetchUserAchievements: () => Promise<void>;

  // Evidence management
  uploadEvidence: (file: any, type: string) => Promise<string>;
  validateEvidence: (evidence: ReportEvidence[]) => Promise<boolean>;

  // UI state
  setSelectedReport: (report: ContentReport | null) => void;
  setSelectedFlaggedAd: (ad: FlaggedAd | null) => void;
  setSelectedRemovalRequest: (request: AdRemovalRequest | null) => void;
  clearError: () => void;
  clearCache: () => void;
}

export const useAdvancedModerationStore = create<AdvancedModerationStore>()(
  persist(
    (set, get) => ({
      moderationSystem: null,
      userDashboard: null,
      userAnalytics: null,
      userAchievements: [],
      selectedReport: null,
      selectedFlaggedAd: null,
      selectedRemovalRequest: null,
      isLoading: false,
      isSubmitting: false,
      isUploadingEvidence: false,
      error: null,
      lastFetchTime: 0,
      cacheExpiration: 10 * 60 * 1000, // 10 minutes

      submitAdvancedReport: async request => {
        set({isSubmitting: true, error: null});

        try {
          // Mock report submission
          const mockReport: ContentReport = {
            id: `report-${Date.now()}`,
            reporterWallet: request.reporterWallet,
            reporterUserId: 123,
            groupId: request.groupId,
            advertiserWallet: request.advertiserWallet,
            categoryId: request.categoryId,
            category: {
              id: request.categoryId,
              name: 'Spam',
              description: 'Unwanted repetitive content',
              severity: 'medium',
              requiredEvidence: ['description'],
              autoActions: ['flag_for_review'],
              threshold: 5,
            },
            reason: request.reason,
            reasonLength: request.reason.length,
            evidence: request.evidence.map((e, index) => ({
              ...e,
              id: `evidence-${index}`,
              verified: false,
            })),
            status: 'pending',
            createdAt: new Date().toISOString(),
            onChainVerified: false,
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Update local state
          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  userReports: [
                    ...state.moderationSystem.userReports,
                    mockReport,
                  ],
                }
              : null,
            isSubmitting: false,
          }));

          // Track analytics
          analyticsService.trackEvent('moderation_report_submitted', {
            category_id: request.categoryId,
            evidence_count: request.evidence.length,
            reason_length: request.reason.length,
          });

          // Refresh stats
          get().fetchUserStats();

          return mockReport;
        } catch (error) {
          set({
            isSubmitting: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to submit report',
          });
          throw error;
        }
      },

      addReportEvidence: async (reportId, evidence) => {
        set({isUploadingEvidence: true, error: null});

        try {
          // Mock evidence addition
          await new Promise(resolve => setTimeout(resolve, 500));

          set(state => {
            const updatedReports =
              state.moderationSystem?.userReports.map(report =>
                report.id === reportId
                  ? {...report, evidence: [...report.evidence, evidence]}
                  : report,
              ) || [];

            return {
              moderationSystem: state.moderationSystem
                ? {
                    ...state.moderationSystem,
                    userReports: updatedReports,
                  }
                : null,
              isUploadingEvidence: false,
            };
          });

          analyticsService.trackEvent('moderation_evidence_added', {
            report_id: reportId,
            evidence_type: evidence.type,
          });
        } catch (error) {
          set({
            isUploadingEvidence: false,
            error:
              error instanceof Error ? error.message : 'Failed to add evidence',
          });
          throw error;
        }
      },

      withdrawReport: async reportId => {
        try {
          // Mock report withdrawal
          await new Promise(resolve => setTimeout(resolve, 500));

          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  userReports: state.moderationSystem.userReports.filter(
                    r => r.id !== reportId,
                  ),
                }
              : null,
          }));

          analyticsService.trackEvent('moderation_report_withdrawn', {
            report_id: reportId,
          });
        } catch (error) {
          throw error;
        }
      },

      requestAdRemoval: async request => {
        set({isSubmitting: true, error: null});

        try {
          // Mock removal request
          const mockRequest: AdRemovalRequest = {
            id: `removal-${Date.now()}`,
            groupId: 'group-123',
            removerWallet: 'UserWallet111111111111111111111111111111',
            removerUserId: 123,
            status: 'pending',
            depositAmount: request.depositAmount,
            rewardAmount: 5000000, // 0.005 SOL
            requestedAt: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            reviewStatus: 'pending_review',
            evidenceProvided:
              request.evidence?.map((e, index) => ({
                ...e,
                id: `evidence-${index}`,
                verified: false,
              })) || [],
            justification: request.justification,
            riskAssessment: {
              riskLevel: 'medium',
              confidence: 0.75,
              factors: [
                {
                  factor: 'Report count',
                  impact: 'negative',
                  weight: 0.4,
                  description: 'Multiple reports from verified users',
                },
                {
                  factor: 'User reputation',
                  impact: 'positive',
                  weight: 0.3,
                  description: 'Requester has good moderation history',
                },
              ],
              recommendation: 'Consider for removal',
            },
            onChainVerified: false,
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Update local state
          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  userRemovalRequests: [
                    ...state.moderationSystem.userRemovalRequests,
                    mockRequest,
                  ],
                }
              : null,
            isSubmitting: false,
          }));

          // Track analytics
          analyticsService.trackEvent('moderation_removal_requested', {
            flagged_ad_id: request.flaggedAdId,
            deposit_amount: request.depositAmount,
            evidence_count: request.evidence?.length || 0,
          });

          // Refresh dashboard
          get().fetchUserDashboard();

          return mockRequest;
        } catch (error) {
          set({
            isSubmitting: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to request removal',
          });
          throw error;
        }
      },

      cancelRemovalRequest: async requestId => {
        try {
          // Mock cancellation
          await new Promise(resolve => setTimeout(resolve, 500));

          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  userRemovalRequests:
                    state.moderationSystem.userRemovalRequests.map(req =>
                      req.id === requestId
                        ? {...req, status: 'cancelled' as const}
                        : req,
                    ),
                }
              : null,
          }));

          analyticsService.trackEvent('moderation_removal_cancelled', {
            request_id: requestId,
          });
        } catch (error) {
          throw error;
        }
      },

      fetchUserDashboard: async () => {
        const state = get();
        const now = Date.now();

        // Check cache validity
        if (
          state.userDashboard &&
          now - state.lastFetchTime < state.cacheExpiration
        ) {
          return;
        }

        set({isLoading: true, error: null});

        try {
          // Mock dashboard data
          const mockDashboard: UserModerationDashboard = {
            personalStats: {
              totalReportsSubmitted: 42,
              reportsThisMonth: 8,
              successfulReports: 35,
              totalRewardsEarned: 125000000, // 0.125 SOL
              totalDepositsPlaced: 50000000, // 0.05 SOL
              totalDepositsReturned: 45000000, // 0.045 SOL
              reportSuccessRate: 83.3,
              averageResolutionTime: 24 * 60 * 60 * 1000, // 24 hours
              moderationScore: 85,
              reporterLevel: 'trusted',
            },
            recentReports: [],
            recentRemovalRequests: [],
            availableForRemoval: [
              {
                id: 'flagged-1',
                groupId: 'group-1',
                advertiserWallet: 'Advertiser111111111111111111111111111111',
                reportCount: 15,
                totalReports: 15,
                flaggedAt: new Date(
                  Date.now() - 2 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                threshold: 10,
                groupInfo: {
                  groupId: 'group-1',
                  groupName: 'Crypto Trading Tips',
                  description: 'Professional crypto trading community',
                  memberCount: 5420,
                  activityLevel: 'high',
                },
                advertiserInfo: {
                  wallet: 'Advertiser111111111111111111111111111111',
                  brandName: 'QuickCrypto',
                  reputation: 2.1,
                  totalReports: 28,
                  previousViolations: 3,
                  accountAge: 45,
                },
                flagStatus: 'flagged',
                priorityLevel: 'high',
                hasRemovalRequest: false,
                reviewStatus: 'awaiting_review',
              },
              {
                id: 'flagged-2',
                groupId: 'group-2',
                advertiserWallet: 'Advertiser222222222222222222222222222222',
                reportCount: 8,
                totalReports: 8,
                flaggedAt: new Date(
                  Date.now() - 1 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                threshold: 10,
                groupInfo: {
                  groupId: 'group-2',
                  groupName: 'NFT Collectors',
                  description: 'Exclusive NFT trading group',
                  memberCount: 3200,
                  activityLevel: 'medium',
                },
                advertiserInfo: {
                  wallet: 'Advertiser222222222222222222222222222222',
                  brandName: 'NFT Deals',
                  reputation: 3.5,
                  totalReports: 12,
                  previousViolations: 1,
                  accountAge: 120,
                },
                flagStatus: 'flagged',
                priorityLevel: 'medium',
                hasRemovalRequest: false,
                reviewStatus: 'awaiting_review',
              },
            ],
            pendingRewards: [
              {
                id: 'reward-1',
                type: 'removal_reward',
                amount: 5000000, // 0.005 SOL
                description: 'Approved ad removal - Crypto Trading Tips',
                expectedDate: new Date(
                  Date.now() + 2 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                status: 'processing',
              },
              {
                id: 'reward-2',
                type: 'deposit_return',
                amount: 10000000, // 0.01 SOL
                description: 'Deposit return - NFT Marketplace ad',
                expectedDate: new Date(
                  Date.now() + 1 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                status: 'ready',
              },
            ],
            moderationGuidelines: [
              {
                id: 'guide-1',
                title: 'Identifying Spam Content',
                description:
                  'Look for repetitive posts, excessive links, or irrelevant promotional content',
                category: 'reporting',
                importance: 'high',
              },
              {
                id: 'guide-2',
                title: 'Evidence Requirements',
                description:
                  'Always include screenshots or URLs when reporting content violations',
                category: 'evidence',
                importance: 'high',
              },
              {
                id: 'guide-3',
                title: 'False Reporting',
                description:
                  'False reports may result in reduced moderation privileges',
                category: 'guidelines',
                importance: 'medium',
              },
            ],
            rewardInformation: {
              currentDepositAmount: 10000000, // 0.01 SOL
              currentRewardAmount: 5000000, // 0.005 SOL
              successRate: 75,
              minimumReputation: 50,
              guidelines: [
                'Report ads that clearly violate community guidelines',
                'Provide detailed evidence with your removal request',
                'Maintain a high success rate to unlock higher rewards',
                'Deposits are returned for approved removals',
              ],
            },
          };

          set({
            userDashboard: mockDashboard,
            isLoading: false,
            lastFetchTime: now,
          });

          analyticsService.trackEvent('moderation_dashboard_loaded', {
            reports_count: mockDashboard.personalStats.totalReportsSubmitted,
            rewards_earned: mockDashboard.personalStats.totalRewardsEarned,
            reporter_level: mockDashboard.personalStats.reporterLevel,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch dashboard',
          });
        }
      },

      fetchAvailableForRemoval: async filters => {
        set({isLoading: true, error: null});

        try {
          // Mock available ads for removal
          await new Promise(resolve => setTimeout(resolve, 500));

          const flaggedAds: FlaggedAd[] = [
            // Use dashboard data if available
            ...(get().userDashboard?.availableForRemoval || []),
          ];

          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  availableForRemoval: flaggedAds,
                }
              : {
                  reportCategories: [],
                  userReports: [],
                  reportStats: {} as UserReportingStats,
                  availableForRemoval: flaggedAds,
                  userRemovalRequests: [],
                  moderationHistory: [],
                },
            isLoading: false,
          }));

          analyticsService.trackEvent(
            'moderation_removal_opportunities_viewed',
            {
              available_count: flaggedAds.length,
              filters_applied: !!filters,
            },
          );
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch flagged ads',
          });
        }
      },

      fetchUserReports: async filters => {
        set({isLoading: true, error: null});

        try {
          // Mock user reports
          const mockReports: ContentReport[] = [
            {
              id: 'report-1',
              reporterWallet: 'UserWallet111111111111111111111111111111',
              reporterUserId: 123,
              groupId: 'group-1',
              advertiserWallet: 'Advertiser111111111111111111111111111111',
              categoryId: 'spam',
              category: {
                id: 'spam',
                name: 'Spam',
                description: 'Unwanted repetitive content',
                severity: 'medium',
                requiredEvidence: ['description'],
                autoActions: ['flag_for_review'],
                threshold: 5,
              },
              reason:
                'This advertiser is posting the same content repeatedly across multiple groups',
              reasonLength: 72,
              evidence: [],
              status: 'resolved',
              createdAt: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              processedAt: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              onChainVerified: true,
              outcome: 'action_taken',
              resolutionSummary: 'Content removed and advertiser warned',
            },
            {
              id: 'report-2',
              reporterWallet: 'UserWallet111111111111111111111111111111',
              reporterUserId: 123,
              groupId: 'group-2',
              advertiserWallet: 'Advertiser222222222222222222222222222222',
              categoryId: 'fraud',
              category: {
                id: 'fraud',
                name: 'Fraud or Scam',
                description: 'Deceptive content',
                severity: 'critical',
                requiredEvidence: ['screenshot', 'url', 'description'],
                autoActions: ['auto_remove', 'require_verification'],
                threshold: 2,
              },
              reason: 'Promoting a known scam website',
              reasonLength: 29,
              evidence: [
                {
                  id: 'evidence-1',
                  type: 'url',
                  data: 'https://scam-site.example',
                  description: 'Link to fraudulent website',
                  timestamp: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                  verified: true,
                },
              ],
              status: 'under_review',
              createdAt: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              onChainVerified: true,
              outcome: 'pending',
            },
          ];

          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  userReports: mockReports,
                }
              : null,
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch reports',
          });
        }
      },

      fetchUserRemovalRequests: async filters => {
        set({isLoading: true, error: null});

        try {
          // Mock removal requests
          const mockRequests: AdRemovalRequest[] = [
            {
              id: 'removal-1',
              groupId: 'group-1',
              removerWallet: 'UserWallet111111111111111111111111111111',
              removerUserId: 123,
              status: 'approved',
              depositAmount: 10000000,
              rewardAmount: 5000000,
              requestedAt: new Date(
                Date.now() - 5 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              processedAt: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              expiresAt: new Date(
                Date.now() + 2 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              reviewStatus: 'approved',
              outcome:
                'Ad successfully removed. Deposit returned + reward earned.',
              transactionSignature: '5xSignature111111111111111111111111111111',
              onChainVerified: true,
              evidenceProvided: [],
              justification: 'Multiple reports of spam and misleading content',
              riskAssessment: {
                riskLevel: 'high',
                confidence: 0.85,
                factors: [],
                recommendation: 'Remove immediately',
              },
            },
          ];

          set(state => ({
            moderationSystem: state.moderationSystem
              ? {
                  ...state.moderationSystem,
                  userRemovalRequests: mockRequests,
                }
              : null,
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch removal requests',
          });
        }
      },

      fetchUserStats: async () => {
        try {
          // Stats are included in dashboard
          await get().fetchUserDashboard();
        } catch (error) {
          console.error('Failed to fetch user stats:', error);
        }
      },

      fetchUserAnalytics: async (timeRange = '30d') => {
        set({isLoading: true, error: null});

        try {
          // Mock analytics data
          const mockAnalytics: UserModerationAnalytics = {
            reportsByCategory: [
              {
                categoryId: 'spam',
                categoryName: 'Spam',
                count: 15,
                percentage: 35.7,
                trend: 2.5,
                averageResolutionTime: 18 * 60 * 60 * 1000,
              },
              {
                categoryId: 'fraud',
                categoryName: 'Fraud',
                count: 10,
                percentage: 23.8,
                trend: -1.2,
                averageResolutionTime: 12 * 60 * 60 * 1000,
              },
              {
                categoryId: 'harassment',
                categoryName: 'Harassment',
                count: 8,
                percentage: 19.0,
                trend: 0.8,
                averageResolutionTime: 24 * 60 * 60 * 1000,
              },
              {
                categoryId: 'inappropriate',
                categoryName: 'Inappropriate',
                count: 9,
                percentage: 21.4,
                trend: 1.5,
                averageResolutionTime: 20 * 60 * 60 * 1000,
              },
            ],
            reportsBySeverity: [
              {
                severity: 'low',
                count: 5,
                percentage: 11.9,
                averageResolutionTime: 36 * 60 * 60 * 1000,
              },
              {
                severity: 'medium',
                count: 20,
                percentage: 47.6,
                averageResolutionTime: 24 * 60 * 60 * 1000,
              },
              {
                severity: 'high',
                count: 12,
                percentage: 28.6,
                averageResolutionTime: 12 * 60 * 60 * 1000,
              },
              {
                severity: 'critical',
                count: 5,
                percentage: 11.9,
                averageResolutionTime: 6 * 60 * 60 * 1000,
              },
            ],
            rewardsTrend: Array.from({length: 30}, (_, i) => ({
              date: new Date(
                Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
              ).toISOString(),
              value: Math.floor(Math.random() * 10000000) + 5000000,
              change: Math.random() * 10 - 5,
            })),
            successRateTrend: Array.from({length: 30}, (_, i) => ({
              date: new Date(
                Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
              ).toISOString(),
              value: 75 + Math.random() * 20,
              change: Math.random() * 5 - 2.5,
            })),
            monthlyActivity: {
              reports: 8,
              removals: 2,
              rewards: 25000000, // 0.025 SOL
            },
          };

          set({userAnalytics: mockAnalytics, isLoading: false});
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch analytics',
          });
        }
      },

      fetchUserAchievements: async () => {
        set({isLoading: true, error: null});

        try {
          // Mock achievements
          const mockAchievements: ModerationAchievement[] = [
            {
              id: 'achievement-1',
              name: 'First Report',
              description: 'Submit your first content report',
              icon: '🚩',
              requirement: {
                type: 'reports',
                value: 1,
              },
              unlockedAt: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              progress: 100,
            },
            {
              id: 'achievement-2',
              name: 'Vigilant Guardian',
              description: 'Submit 50 successful reports',
              icon: '🛡️',
              requirement: {
                type: 'reports',
                value: 50,
              },
              progress: 70,
            },
            {
              id: 'achievement-3',
              name: 'Removal Expert',
              description: 'Successfully request 10 ad removals',
              icon: '🎯',
              requirement: {
                type: 'removals',
                value: 10,
              },
              reward: 10000000, // 0.01 SOL bonus
              progress: 20,
            },
            {
              id: 'achievement-4',
              name: 'Trusted Moderator',
              description: 'Achieve a moderation score of 90+',
              icon: '⭐',
              requirement: {
                type: 'score',
                value: 90,
              },
              progress: 85,
            },
          ];

          set({userAchievements: mockAchievements, isLoading: false});
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch achievements',
          });
        }
      },

      uploadEvidence: async (file, type) => {
        set({isUploadingEvidence: true, error: null});

        try {
          // Mock file upload
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Return mock URL
          const mockUrl = `https://evidence.example.com/${Date.now()}-${type}`;

          set({isUploadingEvidence: false});

          return mockUrl;
        } catch (error) {
          set({
            isUploadingEvidence: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to upload evidence',
          });
          throw error;
        }
      },

      validateEvidence: async evidence => {
        // Mock validation
        return evidence.length > 0 && evidence.every(e => e.data && e.type);
      },

      setSelectedReport: report => set({selectedReport: report}),
      setSelectedFlaggedAd: ad => set({selectedFlaggedAd: ad}),
      setSelectedRemovalRequest: request =>
        set({selectedRemovalRequest: request}),
      clearError: () => set({error: null}),
      clearCache: () => set({lastFetchTime: 0, userDashboard: null}),
    }),
    {
      name: 'advanced-moderation-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        userAchievements: state.userAchievements,
        lastFetchTime: state.lastFetchTime,
      }),
    },
  ),
);

// Helper function to get auth token
function getAuthToken(): string {
  // In a real app, this would get the token from secure storage
  return 'mock-auth-token';
}
