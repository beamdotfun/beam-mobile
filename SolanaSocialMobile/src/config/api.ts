// API Configuration for development and production

// MASTER SWITCH: Set to false for production, true for local development
const USE_LOCAL_BACKEND = false;

// Local development settings
const LOCAL_API_HOST = 'http://10.150.1.33:8069';
const LOCAL_MEDIA_HOST = 'http://10.150.1.33:3001';

// Production settings
const PROD_API_HOST = 'https://api.beam.fun';
const PROD_MEDIA_HOST = 'https://api.beam.fun';

export const API_CONFIG = {
  // Single source of truth for dev/prod mode
  IS_LOCAL: USE_LOCAL_BACKEND,

  // API endpoints
  BASE_URL: USE_LOCAL_BACKEND ? LOCAL_API_HOST : PROD_API_HOST,
  MEDIA_URL: USE_LOCAL_BACKEND
    ? `${LOCAL_MEDIA_HOST}/api/media`
    : `${PROD_MEDIA_HOST}/api/media`,

  // Other settings
  TIMEOUT: 10000, // 10 seconds

  // Helper for logging
  ENV_NAME: USE_LOCAL_BACKEND ? 'LOCAL' : 'PRODUCTION',
};
