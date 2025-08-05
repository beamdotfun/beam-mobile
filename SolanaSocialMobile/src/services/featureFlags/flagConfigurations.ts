export const FEATURE_FLAG_CONFIGURATIONS = {
  // Rollout configurations
  rollouts: {
    tips: {
      schedule: [
        {day: 1, percentage: 10},
        {day: 3, percentage: 25},
        {day: 7, percentage: 50},
        {day: 14, percentage: 100},
      ],
    },
    auctions: {
      schedule: [
        {day: 1, percentage: 5},
        {day: 7, percentage: 15},
        {day: 14, percentage: 30},
        {day: 21, percentage: 50},
        {day: 30, percentage: 100},
      ],
    },
    stories: {
      schedule: [
        {day: 1, percentage: 5},
        {day: 14, percentage: 25},
        {day: 30, percentage: 50},
        {day: 60, percentage: 100},
      ],
    },
    brands: {
      schedule: [
        {day: 7, percentage: 10},
        {day: 21, percentage: 30},
        {day: 45, percentage: 60},
        {day: 90, percentage: 100},
      ],
    },
    voicePosts: {
      schedule: [
        {day: 1, percentage: 2},
        {day: 7, percentage: 10},
        {day: 21, percentage: 25},
        {day: 45, percentage: 50},
        {day: 90, percentage: 100},
      ],
    },
  },

  // User segments for targeting
  segments: {
    earlyAdopters: {
      name: 'Early Adopters',
      criteria: {
        accountAge: {min: 180}, // days
        postCount: {min: 50},
        isVerified: true,
      },
      description: 'Verified users with significant engagement history',
    },
    powerUsers: {
      name: 'Power Users',
      criteria: {
        dailyActiveStreak: {min: 7},
        postCount: {min: 100},
        followerCount: {min: 100},
      },
      description: 'Highly active users with strong social presence',
    },
    premiumUsers: {
      name: 'Premium Users',
      criteria: {
        isPremium: true,
      },
      description: 'Users with premium subscriptions',
    },
    newUsers: {
      name: 'New Users',
      criteria: {
        accountAge: {max: 30}, // days
        postCount: {max: 10},
      },
      description: 'Recently joined users within first month',
    },
    socialInfluencers: {
      name: 'Social Influencers',
      criteria: {
        followerCount: {min: 1000},
        engagementRate: {min: 0.05}, // 5%
        isVerified: true,
      },
      description: 'Verified users with large following and high engagement',
    },
    developers: {
      name: 'Developers',
      criteria: {
        isDeveloper: true,
        hasGithub: true,
      },
      description: 'Platform developers and technical contributors',
    },
    betaTesters: {
      name: 'Beta Testers',
      criteria: {
        isBetaTester: true,
      },
      description: 'Opted-in beta testing participants',
    },
  },

  // Experiment configurations for A/B testing
  experiments: {
    feedAlgorithm: {
      name: 'Feed Algorithm Test',
      variants: ['control', 'algorithmic', 'hybrid'],
      allocation: [0.33, 0.33, 0.34],
      metrics: [
        'engagement_rate',
        'session_duration',
        'posts_viewed',
        'scroll_depth',
      ],
      description: 'Testing different feed ranking algorithms',
      duration: 30, // days
      minimumSampleSize: 1000,
    },
    onboardingFlow: {
      name: 'Onboarding Flow Test',
      variants: ['original', 'simplified', 'gamified'],
      allocation: [0.4, 0.3, 0.3],
      metrics: [
        'completion_rate',
        'time_to_complete',
        'retention_7d',
        'first_post_time',
      ],
      description: 'Testing different user onboarding experiences',
      duration: 45, // days
      minimumSampleSize: 500,
    },
    auctionUI: {
      name: 'Auction UI Test',
      variants: ['simple', 'advanced'],
      allocation: [0.5, 0.5],
      metrics: [
        'bid_completion_rate',
        'average_bid_amount',
        'user_satisfaction',
      ],
      description: 'Testing simplified vs advanced auction interface',
      duration: 21, // days
      minimumSampleSize: 200,
    },
    postComposer: {
      name: 'Post Composer Test',
      variants: ['minimal', 'enhanced', 'ai_assisted'],
      allocation: [0.4, 0.3, 0.3],
      metrics: [
        'posts_created',
        'character_count',
        'media_attachments',
        'completion_rate',
      ],
      description: 'Testing different post creation interfaces',
      duration: 30, // days
      minimumSampleSize: 800,
    },
    navigationUI: {
      name: 'Navigation UI Test',
      variants: ['bottom_tabs', 'side_drawer', 'floating_action'],
      allocation: [0.5, 0.25, 0.25],
      metrics: [
        'navigation_efficiency',
        'user_satisfaction',
        'feature_discovery',
      ],
      description: 'Testing different app navigation patterns',
      duration: 60, // days
      minimumSampleSize: 1500,
    },
  },

  // Performance optimization flags
  performance: {
    imageCaching: {
      levels: ['disabled', 'basic', 'aggressive'],
      default: 'basic',
      criteria: {
        networkSpeed: ['slow', 'medium', 'fast'],
        deviceStorage: ['low', 'medium', 'high'],
      },
    },
    dataPreloading: {
      strategies: ['none', 'next_page', 'predictive'],
      default: 'next_page',
      criteria: {
        networkType: ['wifi', 'cellular'],
        batteryLevel: ['low', 'medium', 'high'],
      },
    },
    animationComplexity: {
      levels: ['minimal', 'standard', 'enhanced'],
      default: 'standard',
      criteria: {
        devicePerformance: ['low', 'medium', 'high'],
        batteryOptimization: true,
      },
    },
  },

  // Dynamic limits configuration
  limits: {
    postLength: {
      tiers: {
        free: 280,
        premium: 420,
        verified: 560,
      },
      default: 280,
    },
    imagesPerPost: {
      tiers: {
        free: 4,
        premium: 8,
        verified: 12,
      },
      default: 4,
    },
    dailyPosts: {
      tiers: {
        free: 10,
        premium: 50,
        verified: 100,
      },
      default: 10,
    },
    tipsPerDay: {
      tiers: {
        free: 5,
        premium: 25,
        verified: 100,
      },
      default: 5,
    },
  },
};

// Helper to check if user is in segment
export function isUserInSegment(
  user: any,
  segmentName: keyof typeof FEATURE_FLAG_CONFIGURATIONS.segments,
): boolean {
  const segment = FEATURE_FLAG_CONFIGURATIONS.segments[segmentName];
  if (!segment) {return false;}

  const {criteria} = segment;

  for (const [key, condition] of Object.entries(criteria)) {
    if (typeof condition === 'boolean') {
      if (user[key] !== condition) {return false;}
    } else if (typeof condition === 'object' && condition !== null) {
      const value = user[key];
      if (typeof value !== 'number') {return false;}

        'min' in condition &&
        condition.min !== undefined &&
        value < condition.min
      )
        {return false;}
      if (
        'max' in condition &&
        condition.max !== undefined &&
        value > condition.max
      )
        {return false;}
    }
  }

  return true;
}

// Helper to get user segments
export function getUserSegments(user: any): string[] {
  const segments: string[] = [];

  for (const [segmentName, segment] of Object.entries(
    FEATURE_FLAG_CONFIGURATIONS.segments,
  )) {
    if (
      isUserInSegment(
        user,
        segmentName as keyof typeof FEATURE_FLAG_CONFIGURATIONS.segments,
      )
    ) {
      segments.push(segmentName);
    }
  }

  return segments;
}

// Helper to get rollout percentage for a given day
export function getRolloutPercentage(
  featureName: keyof typeof FEATURE_FLAG_CONFIGURATIONS.rollouts,
  daysSinceStart: number,
): number {
  const rollout = FEATURE_FLAG_CONFIGURATIONS.rollouts[featureName];
  if (!rollout) {return 0;}

  const {schedule} = rollout;

  // Find the appropriate rollout stage
  let currentPercentage = 0;
  for (const stage of schedule) {
    if (daysSinceStart >= stage.day) {
      currentPercentage = stage.percentage;
    } else {
      break;
    }
  }

  return currentPercentage;
}

// Helper to get experiment variant allocation
export function getExperimentAllocation(
  experimentName: keyof typeof FEATURE_FLAG_CONFIGURATIONS.experiments,
): {variants: string[]; allocation: number[]} {
  const experiment = FEATURE_FLAG_CONFIGURATIONS.experiments[experimentName];
  if (!experiment) {
    return {variants: ['control'], allocation: [1.0]};
  }

  return {
    variants: experiment.variants,
    allocation: experiment.allocation,
  };
}

// Helper to get dynamic limit for user
export function getDynamicLimit(
  limitName: keyof typeof FEATURE_FLAG_CONFIGURATIONS.limits,
  userTier: 'free' | 'premium' | 'verified' = 'free',
): number {
  const limit = FEATURE_FLAG_CONFIGURATIONS.limits[limitName];
  if (!limit) {return 0;}

  return limit.tiers[userTier] || limit.default;
}

// Helper to get performance configuration
export function getPerformanceConfig(
  configName: keyof typeof FEATURE_FLAG_CONFIGURATIONS.performance,
  criteria: Record<string, any>,
): string {
  const config = FEATURE_FLAG_CONFIGURATIONS.performance[configName];
  if (!config) {return '';}

  // Simple rule-based selection for now
  // In a real implementation, this would use more sophisticated logic
  if (configName === 'imageCaching') {
    if (criteria.networkSpeed === 'slow' || criteria.deviceStorage === 'low') {
      return 'basic';
    } else if (
      criteria.networkSpeed === 'fast' &&
      criteria.deviceStorage === 'high'
    ) {
      return 'aggressive';
    }
    return config.default;
  }

  if (configName === 'dataPreloading') {
    if (criteria.networkType === 'wifi' && criteria.batteryLevel !== 'low') {
      return 'predictive';
    } else if (criteria.batteryLevel === 'low') {
      return 'none';
    }
    return config.default;
  }

  if (configName === 'animationComplexity') {
    if (criteria.devicePerformance === 'low' || criteria.batteryOptimization) {
      return 'minimal';
    } else if (criteria.devicePerformance === 'high') {
      return 'enhanced';
    }
    return config.default;
  }

  return config.default;
}

// Helper to validate experiment configuration
export function validateExperimentConfig(
  experimentName: keyof typeof FEATURE_FLAG_CONFIGURATIONS.experiments,
): {isValid: boolean; errors: string[]} {
  const experiment = FEATURE_FLAG_CONFIGURATIONS.experiments[experimentName];
  const errors: string[] = [];

  if (!experiment) {
    errors.push(`Experiment '${experimentName}' not found`);
    return {isValid: false, errors};
  }

  // Check variant count matches allocation count
  if (experiment.variants.length !== experiment.allocation.length) {
    errors.push('Variant count does not match allocation array length');
  }

  // Check allocation sums to 1.0 (with small tolerance for floating point)
  const allocationSum = experiment.allocation.reduce(
    (sum, val) => sum + val,
    0,
  );
  if (Math.abs(allocationSum - 1.0) > 0.01) {
    errors.push(`Allocation values must sum to 1.0, got ${allocationSum}`);
  }

  // Check for duplicate variants
  const uniqueVariants = new Set(experiment.variants);
  if (uniqueVariants.size !== experiment.variants.length) {
    errors.push('Duplicate variants found');
  }

  // Check minimum sample size is reasonable
  if (experiment.minimumSampleSize < 50) {
    errors.push('Minimum sample size should be at least 50');
  }

  return {isValid: errors.length === 0, errors};
}

// Helper to get all available experiments
export function getAvailableExperiments(): Array<{
  key: string;
  name: string;
  description: string;
  variants: string[];
  duration: number;
}> {
  return Object.entries(FEATURE_FLAG_CONFIGURATIONS.experiments).map(
    ([key, experiment]) => ({
      key,
      name: experiment.name,
      description: experiment.description,
      variants: experiment.variants,
      duration: experiment.duration,
    }),
  );
}

// Helper to get segment information
export function getSegmentInfo(segmentName: string): {
  name: string;
  description: string;
  criteria: Record<string, any>;
} | null {
  const segment =
    FEATURE_FLAG_CONFIGURATIONS.segments[
      segmentName as keyof typeof FEATURE_FLAG_CONFIGURATIONS.segments
    ];
  if (!segment) {return null;}

  return {
    name: segment.name,
    description: segment.description,
    criteria: segment.criteria,
  };
}

// Helper for feature flag metadata
export const FEATURE_FLAG_METADATA = {
  // Core features
  social_feed_enabled: {
    description: 'Enable the main social media feed',
    category: 'core',
    risk: 'high',
    owner: 'feed-team',
  },
  posting_enabled: {
    description: 'Allow users to create new posts',
    category: 'core',
    risk: 'high',
    owner: 'content-team',
  },
  voting_enabled: {
    description: 'Enable post voting (likes/dislikes)',
    category: 'core',
    risk: 'medium',
    owner: 'engagement-team',
  },
  wallet_connect_enabled: {
    description: 'Enable Solana wallet connection',
    category: 'core',
    risk: 'high',
    owner: 'wallet-team',
  },

  // New features
  tips_enabled: {
    description: 'Enable SOL tipping functionality',
    category: 'monetization',
    risk: 'medium',
    owner: 'payments-team',
  },
  auctions_enabled: {
    description: 'Enable NFT auction features',
    category: 'marketplace',
    risk: 'medium',
    owner: 'auction-team',
  },
  stories_enabled: {
    description: 'Enable ephemeral stories feature',
    category: 'content',
    risk: 'low',
    owner: 'stories-team',
  },
  brands_enabled: {
    description: 'Enable brand partnership features',
    category: 'business',
    risk: 'low',
    owner: 'partnerships-team',
  },

  // Experimental
  ai_moderation_enabled: {
    description: 'Enable AI-powered content moderation',
    category: 'moderation',
    risk: 'high',
    owner: 'trust-safety-team',
  },
  zk_proofs_enabled: {
    description: 'Enable zero-knowledge proof features',
    category: 'privacy',
    risk: 'high',
    owner: 'privacy-team',
  },
  cross_chain_enabled: {
    description: 'Enable cross-chain functionality',
    category: 'blockchain',
    risk: 'high',
    owner: 'blockchain-team',
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_METADATA;
