/**
 * Electo - Core Configuration
 * Configuration constants and environment setup
 * @module core/config
 */

/**
 * @typedef {Object} ApiConfig
 * @property {string} VALIDATE - HTTP endpoint for validation
 * @property {string} VALIDATE_WS - WebSocket endpoint template
 */

/**
 * @typedef {Object} PaginationConfig
 * @property {number} ITEMS_PER_PAGE - Number of items per page
 * @property {number} MAX_VISIBLE_PAGES - Maximum page numbers to display
 */

/**
 * @typedef {Object} StorageKeysConfig
 * @property {string} CONFIG - Key for app configuration
 * @property {string} HISTORY - Key for validation history
 * @property {string} THEME - Key for theme preference
 */

/**
 * @typedef {Object} DefaultsConfig
 * @property {number} WORKERS - Default worker count
 * @property {number} UMBRAL_NULOS - Default null vote threshold (%)
 * @property {number} UMBRAL_BLANCOS - Default blank vote threshold (%)
 * @property {string} THEME - Default theme ('dark' | 'light')
 */

/**
 * @typedef {Object} LimitsConfig
 * @property {number} MAX_HISTORY_ITEMS - Maximum history entries
 * @property {number} MAX_FILE_SIZE_MB - Maximum file size in MB
 */

/**
 * @typedef {Object} CONFIG
 * @property {ApiConfig} API
 * @property {PaginationConfig} PAGINATION
 * @property {StorageKeysConfig} STORAGE_KEYS
 * @property {DefaultsConfig} DEFAULTS
 * @property {LimitsConfig} LIMITS
 */

/**
 * @typedef {Object} ENV
 * @property {boolean} isDev - Development environment flag
 * @property {boolean} isProduction - Production environment flag
 */

/** @type {CONFIG} */
const CONFIG = Object.freeze({
  // API Endpoints
  API: {
    VALIDATE: '/api/validate',
    VALIDATE_WS: 'ws://{host}/api/validate-ws'
  },

  // Pagination
  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    MAX_VISIBLE_PAGES: 5
  },

  // Storage Keys
  STORAGE_KEYS: {
    CONFIG: 'Electo_config',
    HISTORY: 'Electo_history',
    THEME: 'Electo_theme'
  },

  // Defaults
  DEFAULTS: {
    WORKERS: 4,
    UMBRAL_NULOS: 30,
    UMBRAL_BLANCOS: 10,
    THEME: 'dark'
  },

  // Limits
  LIMITS: {
    MAX_HISTORY_ITEMS: 10,
    MAX_FILE_SIZE_MB: 50
  }
});

/** @type {ENV} */
const ENV = Object.freeze({
  isDev: window.location.hostname === 'localhost',
  isProduction: window.location.hostname !== 'localhost'
});

export { CONFIG, ENV };
