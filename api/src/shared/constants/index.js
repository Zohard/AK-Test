// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

// Media Types
const MEDIA_TYPES = {
  ANIME: 'anime',
  MANGA: 'manga'
};

// User Roles/Groups (SMF-based)
const USER_GROUPS = {
  ADMIN: 1,
  MODERATOR: 2,
  MEMBER: 0
};

// Review Rating Range
const RATING_RANGE = {
  MIN: 0,
  MAX: 10
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// File Upload Limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_IMAGE_TYPES: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

// Database Status Values
const DB_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0
};

// Publication Status for Manga
const PUBLICATION_STATUS = {
  ONGOING: 'En cours',
  COMPLETED: 'Terminé',
  SUSPENDED: 'Suspendu',
  ABANDONED: 'Abandonné'
};

// Sort Directions
const SORT_DIRECTIONS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// Cache Keys
const CACHE_KEYS = {
  ANIME_STATS: 'anime:statistics',
  MANGA_STATS: 'manga:statistics',
  REVIEW_STATS: 'review:statistics',
  USER_STATS: 'user:statistics',
  TOP_RATED_ANIME: 'top_rated:anime',
  TOP_RATED_MANGA: 'top_rated:manga'
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 300,     // 5 minutes
  MEDIUM: 1800,   // 30 minutes
  LONG: 3600,     // 1 hour
  VERY_LONG: 86400 // 24 hours
};

// API Rate Limits
const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // login attempts per window
  },
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 20 // search requests per minute
  }
};

// Error Messages
const ERROR_MESSAGES = {
  // Generic
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  
  // Authentication
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_NOT_ACTIVATED: 'Account is not activated',
  TOKEN_REQUIRED: 'Access token is required',
  INVALID_TOKEN: 'Invalid or expired token',
  
  // User Management
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists with this username or email',
  
  // Media
  ANIME_NOT_FOUND: 'Anime not found',
  MANGA_NOT_FOUND: 'Manga not found',
  
  // Reviews
  REVIEW_NOT_FOUND: 'Review not found',
  ALREADY_REVIEWED: 'You have already reviewed this media',
  
  // Admin
  ADMIN_REQUIRED: 'Admin access required'
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  
  // Generic CRUD
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  
  // Specific
  REVIEW_CREATED: 'Review created successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted successfully'
};

// Validation Rules
const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255
  },
  REVIEW_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255
  },
  REVIEW_CONTENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000
  },
  SYNOPSIS: {
    MAX_LENGTH: 5000
  },
  YEAR: {
    MIN: 1900,
    MAX: new Date().getFullYear() + 5
  },
  EPISODES: {
    MIN: 1,
    MAX: 10000
  },
  VOLUMES: {
    MIN: 1,
    MAX: 1000
  }
};

module.exports = {
  HTTP_STATUS,
  MEDIA_TYPES,
  USER_GROUPS,
  RATING_RANGE,
  PAGINATION,
  UPLOAD_LIMITS,
  DB_STATUS,
  PUBLICATION_STATUS,
  SORT_DIRECTIONS,
  CACHE_KEYS,
  CACHE_TTL,
  RATE_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES
};