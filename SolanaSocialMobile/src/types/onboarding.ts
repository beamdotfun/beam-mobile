export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];

  // Flow configuration
  skippable: boolean;
  mandatory: boolean;
  triggerCondition: TriggerCondition;

  // Progress tracking
  totalSteps: number;
  completedSteps: number;
  currentStep: number;

  // Timing
  estimatedTime: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  content: StepContent;

  // Navigation
  nextStepId?: string;
  previousStepId?: string;
  canSkip: boolean;
  canGoBack: boolean;

  // Validation
  validation?: StepValidation;
  requiredActions: string[];

  // UI configuration
  layout: StepLayout;
  animation?: StepAnimation;

  // Progress
  completed: boolean;
  completedAt?: string;
  skipped: boolean;
}

export type StepType =
  | 'welcome'
  | 'explanation'
  | 'interactive_tutorial'
  | 'form_input'
  | 'wallet_setup'
  | 'permission_request'
  | 'feature_introduction'
  | 'completion';

export interface StepContent {
  // Text content
  heading?: string;
  subheading?: string;
  body?: string;

  // Media
  image?: string;
  video?: string;
  animation?: string;

  // Interactive elements
  interactiveElements?: InteractiveElement[];

  // Call to action
  primaryAction: ActionButton;
  secondaryAction?: ActionButton;
  skipAction?: ActionButton;
}

export interface InteractiveElement {
  type: 'spotlight' | 'overlay' | 'tooltip' | 'modal' | 'highlight';
  target: string; // Element selector or ID
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  persistent: boolean;
}

export interface ActionButton {
  text: string;
  action: ButtonAction;
  style: 'primary' | 'secondary' | 'ghost' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export type ButtonAction =
  | 'next_step'
  | 'previous_step'
  | 'skip_step'
  | 'complete_flow'
  | 'external_action'
  | 'navigate'
  | 'custom';

export interface StepValidation {
  type: 'form' | 'action' | 'condition';
  rules: ValidationRule[];
  errorMessage: string;
}

export interface ValidationRule {
  field?: string;
  condition: string;
  value?: any;
  message: string;
}

export interface StepLayout {
  template: 'centered' | 'full_screen' | 'card' | 'overlay' | 'bottom_sheet';
  backgroundImage?: string;
  backgroundColor?: string;
  showProgress: boolean;
  showSkip: boolean;
}

export interface StepAnimation {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number; // milliseconds
  direction?: 'left' | 'right' | 'up' | 'down';
}

export type TriggerCondition =
  | 'first_launch'
  | 'after_signup'
  | 'feature_update'
  | 'manual'
  | 'conditional';

export interface OnboardingProgress {
  userId: string;
  flowId: string;
  currentStepId: string;
  completedSteps: string[];
  skippedSteps: string[];

  // Timing
  startedAt: string;
  lastActiveAt: string;
  completedAt?: string;

  // Analytics
  timeSpent: number; // seconds
  interactions: OnboardingInteraction[];

  // State
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  abandonedAt?: string;
  abandonedReason?: string;
}

export interface OnboardingInteraction {
  stepId: string;
  action: string;
  timestamp: string;
  metadata?: any;
}

export interface TutorialSpotlight {
  id: string;
  target: string; // Element ID or selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';

  // Visual styling
  highlightColor: string;
  borderRadius: number;
  padding: number;

  // Behavior
  dismissible: boolean;
  autoAdvance: boolean;
  delay: number; // milliseconds

  // Actions
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
}

export interface FeatureIntroduction {
  featureId: string;
  title: string;
  description: string;
  benefits: string[];
  screenshots: string[];

  // Tutorial elements
  tutorialSteps: TutorialStep[];

  // Conditions
  showCondition: string;
  dismissible: boolean;

  // Tracking
  shown: boolean;
  dismissed: boolean;
  completed: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  target?: string;
  action?: string;
  validation?: string;
}

export interface OnboardingAnalytics {
  // Flow metrics
  totalFlows: number;
  completedFlows: number;
  abandonedFlows: number;
  completionRate: number;

  // Step metrics
  stepCompletionRates: Record<string, number>;
  averageTimePerStep: Record<string, number>;
  dropOffPoints: string[];

  // User segments
  completionByUserType: Record<string, number>;
  completionBySource: Record<string, number>;

  // Feedback
  userRatings: number[];
  averageRating: number;
  feedbackComments: string[];
}

export interface OnboardingConfig {
  // Flow settings
  enableOnboarding: boolean;
  defaultFlowId: string;
  mandatoryFlows: string[];

  // UI settings
  theme: 'light' | 'dark' | 'auto';
  animationsEnabled: boolean;
  soundEnabled: boolean;

  // Behavior settings
  allowSkipping: boolean;
  showProgress: boolean;
  autoSave: boolean;

  // Persistence
  rememberProgress: boolean;
  sessionTimeout: number; // minutes
}
