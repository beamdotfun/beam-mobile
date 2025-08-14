import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingFlow,
  OnboardingStep,
  OnboardingProgress,
  TutorialSpotlight,
  FeatureIntroduction,
  OnboardingConfig,
  OnboardingAnalytics,
  OnboardingInteraction,
} from '@/types/onboarding';
import apiClient from '../services/api';

interface OnboardingState {
  // Flows and steps
  availableFlows: OnboardingFlow[];
  currentFlow: OnboardingFlow | null;
  currentStep: OnboardingStep | null;

  // Progress tracking
  userProgress: Record<string, OnboardingProgress>;

  // Tutorial system
  activeSpotlights: TutorialSpotlight[];
  featureIntroductions: FeatureIntroduction[];

  // Configuration
  config: OnboardingConfig;

  // UI state
  isActive: boolean;
  loading: boolean;
  error: string | null;

  // Analytics
  interactions: OnboardingInteraction[];

  // Actions
  loadOnboardingFlows: () => Promise<void>;
  startFlow: (flowId: string) => Promise<void>;
  completeStep: (stepId: string, data?: any) => Promise<void>;
  skipStep: (stepId: string, reason?: string) => Promise<void>;
  goToPreviousStep: () => Promise<void>;
  goToNextStep: () => Promise<void>;

  // Flow control
  pauseFlow: () => void;
  resumeFlow: () => void;
  abandonFlow: (reason: string) => Promise<void>;
  completeFlow: () => Promise<void>;

  // Tutorial features
  showSpotlight: (spotlight: TutorialSpotlight) => void;
  hideSpotlight: (spotlightId: string) => void;
  showFeatureIntroduction: (featureId: string) => void;
  dismissFeatureIntroduction: (featureId: string) => void;

  // Progress management
  saveProgress: () => Promise<void>;
  loadProgress: (flowId: string) => Promise<void>;
  resetProgress: (flowId: string) => Promise<void>;

  // Analytics
  trackInteraction: (action: string, metadata?: any) => void;
  getAnalytics: () => Promise<OnboardingAnalytics>;

  // Configuration
  updateConfig: (updates: Partial<OnboardingConfig>) => void;

  // Utilities
  shouldShowOnboarding: () => boolean;
  getNextStep: () => OnboardingStep | null;
  getPreviousStep: () => OnboardingStep | null;
  calculateProgress: () => number;
  clearError: () => void;
}

const defaultConfig: OnboardingConfig = {
  enableOnboarding: true,
  defaultFlowId: 'main_onboarding',
  mandatoryFlows: ['main_onboarding'],
  theme: 'auto',
  animationsEnabled: true,
  soundEnabled: false,
  allowSkipping: true,
  showProgress: true,
  autoSave: true,
  rememberProgress: true,
  sessionTimeout: 30,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      availableFlows: [],
      currentFlow: null,
      currentStep: null,
      userProgress: {},
      activeSpotlights: [],
      featureIntroductions: [],
      config: defaultConfig,
      isActive: false,
      loading: false,
      error: null,
      interactions: [],

      loadOnboardingFlows: async () => {
        set({loading: true, error: null});

        try {
          const response = await apiClient.get('/onboarding/flows');

          if (response.data.success) {
            set({
              availableFlows: response.data.data,
              loading: false,
            });
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load onboarding flows',
            loading: false,
          });
        }
      },

      startFlow: async flowId => {
        const {availableFlows} = get();
        const flow = availableFlows.find(f => f.id === flowId);

        if (!flow) {
          throw new Error(`Flow ${flowId} not found`);
        }

        const firstStep = flow.steps[0];

        // Create or update progress
        const progress: OnboardingProgress = {
          userId: '', // Will be set from auth store
          flowId,
          currentStepId: firstStep.id,
          completedSteps: [],
          skippedSteps: [],
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          timeSpent: 0,
          interactions: [],
          status: 'in_progress',
        };

        set(state => ({
          currentFlow: flow,
          currentStep: firstStep,
          userProgress: {
            ...state.userProgress,
            [flowId]: progress,
          },
          isActive: true,
        }));

        // Track flow start
        get().trackInteraction('flow_started', { flowId });

        // Auto-save progress
        if (get().config.autoSave) {
          await get().saveProgress();
        }
      },

      completeStep: async (stepId, data) => {
        const {currentFlow, currentStep} = get();

        if (!currentFlow || !currentStep || currentStep.id !== stepId) {
          return;
        }

        // Mark step as completed
        const updatedStep = {
          ...currentStep,
          completed: true,
          completedAt: new Date().toISOString(),
        };

        // Update progress
        set(state => {
          const progress = state.userProgress[currentFlow.id];
          if (progress) {
            progress.completedSteps.push(stepId);
            progress.lastActiveAt = new Date().toISOString();
          }
          return {
            currentStep: updatedStep,
            userProgress: {
              ...state.userProgress,
              [currentFlow.id]: progress,
            },
          };
        });

        // Track completion
        get().trackInteraction('step_completed', { stepId, data });

        // Auto-advance to next step
        const nextStep = get().getNextStep();
        if (nextStep) {
          await get().goToNextStep();
        } else {
          // Flow completed
          await get().completeFlow();
        }
      },

      skipStep: async (stepId, reason) => {
        const {currentFlow, currentStep} = get();

        if (!currentFlow || !currentStep || currentStep.id !== stepId) {
          return;
        }

        if (!currentStep.canSkip) {
          throw new Error('This step cannot be skipped');
        }

        // Update progress
        set(state => {
          const progress = state.userProgress[currentFlow.id];
          if (progress) {
            progress.skippedSteps.push(stepId);
            progress.lastActiveAt = new Date().toISOString();
          }
          return {
            userProgress: {
              ...state.userProgress,
              [currentFlow.id]: progress,
            },
          };
        });

        // Track skip
        get().trackInteraction('step_skipped', { stepId, reason });

        // Go to next step
        await get().goToNextStep();
      },

      goToPreviousStep: async () => {
        const previousStep = get().getPreviousStep();

        if (previousStep) {
          set({currentStep: previousStep});
          get().trackInteraction('step_back', { stepId: previousStep.id });
        }
      },

      goToNextStep: async () => {
        const nextStep = get().getNextStep();

        if (nextStep) {
          set({currentStep: nextStep});

          // Update current step in progress
          set(state => {
            const {currentFlow} = state;
            if (currentFlow) {
              const progress = state.userProgress[currentFlow.id];
              if (progress) {
                progress.currentStepId = nextStep.id;
                progress.lastActiveAt = new Date().toISOString();
              }
              return {
                userProgress: {
                  ...state.userProgress,
                  [currentFlow.id]: progress,
                },
              };
            }
            return state;
          });

          get().trackInteraction('step_forward', { stepId: nextStep.id });

          // Auto-save progress
          if (get().config.autoSave) {
            await get().saveProgress();
          }
        }
      },

      pauseFlow: () => {
        set({isActive: false});
        get().trackInteraction('flow_paused');
      },

      resumeFlow: () => {
        set({isActive: true});
        get().trackInteraction('flow_resumed');
      },

      abandonFlow: async reason => {
        const {currentFlow} = get();

        if (currentFlow) {
          set(state => {
            const progress = state.userProgress[currentFlow.id];
            if (progress) {
              progress.status = 'abandoned';
              progress.abandonedAt = new Date().toISOString();
              progress.abandonedReason = reason;
            }
            return {
              currentFlow: null,
              currentStep: null,
              isActive: false,
              userProgress: {
                ...state.userProgress,
                [currentFlow.id]: progress,
              },
            };
          });

          get().trackInteraction('flow_abandoned', { reason });
          await get().saveProgress();
        }
      },

      completeFlow: async () => {
        const {currentFlow} = get();

        if (currentFlow) {
          set(state => {
            const progress = state.userProgress[currentFlow.id];
            if (progress) {
              progress.status = 'completed';
              progress.completedAt = new Date().toISOString();
            }
            return {
              currentFlow: null,
              currentStep: null,
              isActive: false,
              userProgress: {
                ...state.userProgress,
                [currentFlow.id]: progress,
              },
            };
          });

          get().trackInteraction('flow_completed');
          await get().saveProgress();

          // Show completion celebration
          // This could trigger a success modal or animation
        }
      },

      showSpotlight: spotlight => {
        set(state => ({
          activeSpotlights: [...state.activeSpotlights, spotlight],
        }));

        get().trackInteraction('spotlight_shown', {
          spotlightId: spotlight.id,
        });
      },

      hideSpotlight: spotlightId => {
        set(state => ({
          activeSpotlights: state.activeSpotlights.filter(
            s => s.id !== spotlightId,
          ),
        }));

        get().trackInteraction('spotlight_hidden', { spotlightId });
      },

      showFeatureIntroduction: featureId => {
        set(state => ({
          featureIntroductions: state.featureIntroductions.map(intro =>
            intro.featureId === featureId ? {...intro, shown: true} : intro,
          ),
        }));

        get().trackInteraction('feature_intro_shown', { featureId });
      },

      dismissFeatureIntroduction: featureId => {
        set(state => ({
          featureIntroductions: state.featureIntroductions.map(intro =>
            intro.featureId === featureId ? {...intro, dismissed: true} : intro,
          ),
        }));

        get().trackInteraction('feature_intro_dismissed', { featureId });
      },

      saveProgress: async () => {
        const {userProgress} = get();

        try {
          await apiClient.post('/onboarding/progress', { progress: userProgress });
        } catch (error) {
          console.error('Failed to save onboarding progress:', error);
        }
      },

      loadProgress: async flowId => {
        try {
          const response = await apiClient.get(
            `/onboarding/progress/${flowId}`,

          if (response.data.success) {
            const progress = response.data.data;
            set(state => ({
              userProgress: {
                ...state.userProgress,
                [flowId]: progress,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to load onboarding progress:', error);
        }
      },

      resetProgress: async flowId => {
        set(state => {
          const {[flowId]: removed, ...remaining} = state.userProgress;
          return {userProgress: remaining};
        });

        try {
          await apiClient.delete(`/onboarding/progress/${flowId}`);
        } catch (error) {
          console.error('Failed to reset onboarding progress:', error);
        }
      },

      trackInteraction: (action, metadata) => {
        const interaction = {
          stepId: get().currentStep?.id || '',
          action,
          timestamp: new Date().toISOString(),
          metadata,
        };

        set(state => ({
          interactions: [...state.interactions, interaction],
        }));
      },

      getAnalytics: async () => {
        try {
          const response = await apiClient.get('/onboarding/analytics');

          if (response.data.success) {
            return response.data.data;
          }
          throw new Error(response.data.message);
        } catch (error: any) {
          throw error;
        }
      },

      updateConfig: updates => {
        set(state => ({
          config: {...state.config, ...updates},
        }));
      },

      shouldShowOnboarding: () => {
        const {config, availableFlows, userProgress} = get();

        if (!config.enableOnboarding) {return false;}

        // Check if any mandatory flows are incomplete
        for (const flowId of config.mandatoryFlows) {
          const progress = userProgress[flowId];
          if (!progress || progress.status !== 'completed') {
            return true;
          }
        }

        return false;
      },

      getNextStep: () => {
        const {currentFlow, currentStep} = get();

        if (!currentFlow || !currentStep) {return null;}

        const currentIndex = currentFlow.steps.findIndex(
          s => s.id === currentStep.id,
        );
        if (currentIndex < currentFlow.steps.length - 1) {
          return currentFlow.steps[currentIndex + 1];
        }

        return null;
      },

      getPreviousStep: () => {
        const {currentFlow, currentStep} = get();

        if (!currentFlow || !currentStep) {return null;}

        const currentIndex = currentFlow.steps.findIndex(
          s => s.id === currentStep.id,
        );
        if (currentIndex > 0) {
          return currentFlow.steps[currentIndex - 1];
        }

        return null;
      },

      calculateProgress: () => {
        const {currentFlow, userProgress} = get();

        if (!currentFlow) {return 0;}

        const progress = userProgress[currentFlow.id];
        if (!progress) {return 0;}

        return (progress.completedSteps.length / currentFlow.totalSteps) * 100;
      },

      clearError: () => set({error: null}),
    }),
    {
      name: 'onboarding-storage',
      storage: {
        getItem: async name => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Failed to get/parse item from AsyncStorage:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async name => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: state => ({
        userProgress: state.userProgress,
        config: state.config,
        featureIntroductions: state.featureIntroductions,
      }),
    },
  ),
);
