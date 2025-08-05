import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ProfileCustomization,
  ProfileAnalytics,
  Achievement,
  ProfileVerification,
  FollowerInsights,
  ProfileShowcase,
  ProfileInsight,
  ProfileSuggestion,
} from '@/types/profile-enhanced';
import {profileService} from '../services/profile/profileService';
import {useProfileStore} from './profileStore';

interface EnhancedProfileStore {
  // State
  customization: ProfileCustomization;
  analytics?: ProfileAnalytics;
  achievements: Achievement[];
  verification: ProfileVerification;
  showcase: ProfileShowcase;
  followerInsights: FollowerInsights[];

  // UI State
  isLoadingAnalytics: boolean;
  isLoadingAchievements: boolean;
  analyticsError?: string;

  // Actions
  loadProfileEnhancements: () => Promise<void>;
  loadAnalytics: (period?: '24h' | '7d' | '30d' | 'all') => Promise<void>;
  loadAchievements: () => Promise<void>;
  loadFollowerInsights: (page?: number) => Promise<void>;

  // Customization
  updateCustomization: (
    customization: Partial<ProfileCustomization>,
  ) => Promise<void>;
  updateShowcase: (showcase: Partial<ProfileShowcase>) => Promise<void>;
  resetCustomization: () => Promise<void>;

  // Verification
  startVerification: (type: string) => Promise<void>;
  submitVerificationStep: (stepId: string, data: any) => Promise<void>;
  checkVerificationStatus: () => Promise<void>;

  // Achievements
  claimAchievement: (achievementId: string) => Promise<void>;
  featureAchievement: (
    achievementId: string,
    featured: boolean,
  ) => Promise<void>;

  // Analytics
  exportAnalytics: (format: 'csv' | 'pdf') => Promise<string>;
  refreshAnalytics: () => Promise<void>;

  // Utilities
  calculateProfileCompleteness: () => number;
  getProfileInsights: () => ProfileInsight[];
  getSuggestedImprovements: () => ProfileSuggestion[];
}

const defaultCustomization: ProfileCustomization = {
  theme: {
    backgroundType: 'color',
    cardStyle: 'default',
  },
  layout: {
    profileStyle: 'standard',
    showStats: true,
    showAchievements: true,
    showActivity: true,
    pinnedSections: [],
  },
  sections: {
    bio: true,
    links: true,
    badges: true,
    gallery: true,
    brands: true,
  },
};

const defaultShowcase: ProfileShowcase = {
  featuredPosts: [],
  featuredBrands: [],
  featuredAchievements: [],
  customSections: [],
  gallery: [],
};

export const useEnhancedProfileStore = create<EnhancedProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state
      customization: defaultCustomization,
      analytics: undefined,
      achievements: [],
      verification: {
        status: 'unverified',
        steps: [],
        currentStep: 0,
      },
      showcase: defaultShowcase,
      followerInsights: [],
      isLoadingAnalytics: false,
      isLoadingAchievements: false,

      // Load all profile enhancements
      loadProfileEnhancements: async () => {
        await Promise.all([
          get().loadAnalytics(),
          get().loadAchievements(),
          get().checkVerificationStatus(),
        ]);
      },

      // Load analytics
      loadAnalytics: async (period = '7d') => {
        set({isLoadingAnalytics: true, analyticsError: undefined});

        try {
          const response = await profileService.getAnalytics({period});
          if (response.status === 'success' && response.data) {
            set({analytics: response.data});
          }
        } catch (error) {
          set({analyticsError: 'Failed to load analytics'});
          console.error('Failed to load analytics:', error);
        } finally {
          set({isLoadingAnalytics: false});
        }
      },

      // Load achievements
      loadAchievements: async () => {
        set({isLoadingAchievements: true});

        try {
          const response = await profileService.getAchievements();
          if (response.status === 'success' && response.data) {
            set({achievements: response.data});
          }
        } catch (error) {
          console.error('Failed to load achievements:', error);
        } finally {
          set({isLoadingAchievements: false});
        }
      },

      // Load follower insights
      loadFollowerInsights: async (page = 1) => {
        try {
          const response = await profileService.getFollowerInsights({
            page,
            limit: 20,
          });
          if (response.status === 'success' && response.data) {
            set(state => ({
              followerInsights:
                page === 1
                  ? response.data || []
                  : [...state.followerInsights, ...(response.data || [])],
            }));
          }
        } catch (error) {
          console.error('Failed to load follower insights:', error);
        }
      },

      // Update customization
      updateCustomization: async (
        customization: Partial<ProfileCustomization>,
      ) => {
        const updated = {...get().customization, ...customization};

        try {
          await profileService.updateCustomization(updated);
          set({customization: updated});
        } catch (error) {
          console.error('Failed to update customization:', error);
          throw error;
        }
      },

      // Update showcase
      updateShowcase: async (showcase: Partial<ProfileShowcase>) => {
        const updated = {...get().showcase, ...showcase};

        try {
          await profileService.updateShowcase(updated);
          set({showcase: updated});
        } catch (error) {
          console.error('Failed to update showcase:', error);
          throw error;
        }
      },

      // Reset customization
      resetCustomization: async () => {
        try {
          await profileService.resetCustomization();
          set({customization: defaultCustomization});
        } catch (error) {
          console.error('Failed to reset customization:', error);
          throw error;
        }
      },

      // Start verification
      startVerification: async (type: string) => {
        try {
          const response = await profileService.startVerification(type);
          if (response.status === 'success' && response.data) {
            set({verification: response.data});
          }
        } catch (error) {
          console.error('Failed to start verification:', error);
          throw error;
        }
      },

      // Submit verification step
      submitVerificationStep: async (stepId: string, data: any) => {
        try {
          const response = await profileService.submitVerificationStep(
            stepId,
            data,
          );
          if (response.status === 'success' && response.data) {
            set({verification: response.data});
          }
        } catch (error) {
          console.error('Failed to submit verification step:', error);
          throw error;
        }
      },

      // Check verification status
      checkVerificationStatus: async () => {
        try {
          const response = await profileService.getVerificationStatus();
          if (response.status === 'success' && response.data) {
            set({verification: response.data});
          }
        } catch (error) {
          console.error('Failed to check verification status:', error);
        }
      },

      // Claim achievement
      claimAchievement: async (achievementId: string) => {
        try {
          await profileService.claimAchievement(achievementId);

          set(state => ({
            achievements: state.achievements.map(a =>
              a.id === achievementId
                ? {...a, unlockedAt: new Date().toISOString()}
                : a,
            ),
          }));
        } catch (error) {
          console.error('Failed to claim achievement:', error);
          throw error;
        }
      },

      // Feature achievement
      featureAchievement: async (achievementId: string, featured: boolean) => {
        try {
          await profileService.featureAchievement(achievementId, featured);

          set(state => ({
            achievements: state.achievements.map(a =>
              a.id === achievementId ? {...a, featured} : a,
            ),
            showcase: {
              ...state.showcase,
              featuredAchievements: featured
                ? [...state.showcase.featuredAchievements, achievementId]
                : state.showcase.featuredAchievements.filter(
                    id => id !== achievementId,
                  ),
            },
          }));
        } catch (error) {
          console.error('Failed to feature achievement:', error);
          throw error;
        }
      },

      // Export analytics
      exportAnalytics: async (format: 'csv' | 'pdf') => {
        try {
          const response = await profileService.exportAnalytics(format);
          if (response.status === 'success' && response.data) {
            return response.data.url;
          }
          throw new Error('Failed to export analytics');
        } catch (error) {
          console.error('Failed to export analytics:', error);
          throw error;
        }
      },

      // Refresh analytics
      refreshAnalytics: async () => {
        const {analytics} = get();
        if (analytics) {
          await get().loadAnalytics(analytics.metrics.period);
        }
      },

      // Calculate profile completeness
      calculateProfileCompleteness: () => {
        const {currentProfile} = useProfileStore.getState();
        if (!currentProfile) {
          return 0;
        }

        const fields = [
          currentProfile.name,
          currentProfile.bio,
          currentProfile.profilePicture,
          currentProfile.links?.length > 0,
          currentProfile.nftAvatar || currentProfile.snsAvatar,
          get().showcase.gallery.length > 0,
          get().achievements.filter(a => a.unlockedAt).length > 0,
        ];

        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
      },

      // Get profile insights
      getProfileInsights: () => {
        const {analytics} = get();
        if (!analytics) {
          return [];
        }

        const insights: ProfileInsight[] = [];

        // Follower growth insight
        if (analytics.overview.followerGrowth > 0) {
          insights.push({
            type: 'positive',
            title: 'Growing Audience',
            description: 'Your follower count is increasing',
            value: `+${analytics.overview.followerGrowth}%`,
            trend: 'up',
          });
        } else if (analytics.overview.followerGrowth < -5) {
          insights.push({
            type: 'negative',
            title: 'Losing Followers',
            description: 'Your follower count is declining',
            value: `${analytics.overview.followerGrowth}%`,
            trend: 'down',
          });
        }

        // Engagement insight
        if (analytics.overview.engagementRate > 5) {
          insights.push({
            type: 'positive',
            title: 'High Engagement',
            description: 'Your content is resonating with your audience',
            value: `${analytics.overview.engagementRate}%`,
            trend: analytics.overview.reputationTrend,
          });
        }

        // Best posting time
        if (analytics.content.bestPostingTime) {
          insights.push({
            type: 'neutral',
            title: 'Optimal Posting Time',
            description: 'Your audience is most active at',
            value: analytics.content.bestPostingTime,
          });
        }

        return insights;
      },

      // Get suggested improvements
      getSuggestedImprovements: () => {
        const suggestions: ProfileSuggestion[] = [];
        const completeness = get().calculateProfileCompleteness();
        const {currentProfile} = useProfileStore.getState();
        const {analytics, verification, achievements} = get();

        // Profile completeness
        if (completeness < 80) {
          suggestions.push({
            id: 'complete-profile',
            priority: 'high',
            title: 'Complete Your Profile',
            description: 'A complete profile attracts more followers',
            action: 'Add missing information',
            impact: '+20% visibility',
          });
        }

        // Verification
        if (verification.status === 'unverified') {
          suggestions.push({
            id: 'verify-profile',
            priority: 'medium',
            title: 'Get Verified',
            description: 'Build trust with verification',
            action: 'Start verification process',
            impact: '+50% credibility',
          });
        }

        // Post frequency
        if (analytics && analytics.content.topPosts.length < 5) {
          suggestions.push({
            id: 'post-more',
            priority: 'high',
            title: 'Post More Frequently',
            description: 'Regular posting keeps your audience engaged',
            action: 'Create new content',
            impact: '+30% engagement',
          });
        }

        // Achievements
        const unlockedAchievements = achievements.filter(
          a => a.unlockedAt,
        ).length;
        if (unlockedAchievements < 3) {
          suggestions.push({
            id: 'unlock-achievements',
            priority: 'low',
            title: 'Unlock More Achievements',
            description: 'Show off your accomplishments',
            action: 'View available achievements',
            impact: '+10% profile views',
          });
        }

        return suggestions.sort((a, b) => {
          const priority = {high: 3, medium: 2, low: 1};
          return priority[b.priority] - priority[a.priority];
        });
      },
    }),
    {
      name: 'enhanced-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        customization: state.customization,
        showcase: state.showcase,
      }),
    },
  ),
);
