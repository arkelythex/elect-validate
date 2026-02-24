/**
 * Electo - Storage Service
 * LocalStorage abstraction for persistence
 * @module core/storage
 */

import { CONFIG } from './config.js';

/**
 * @typedef {Object} AppConfig
 * @property {string} workers
 * @property {string} umbralNulos
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} fileName
 * @property {string} date - ISO date string
 * @property {number} total
 * @property {number} validas
 * @property {number} invalidas
 */

/**
 * StorageService - LocalStorage abstraction
 * Handles app configuration, theme, and validation history
 * @class
 */
class StorageService {
  /**
   * Internal getter with error handling
   * @param {string} key - Storage key
   * @returns {*} Parsed JSON or null
   * @private
   */
  #get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Internal setter with error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   * @private
   */
  #set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get stored configuration
   * @returns {AppConfig|null}
   */
  getConfig() {
    return this.#get(CONFIG.STORAGE_KEYS.CONFIG);
  }

  /**
   * Save app configuration
   * @param {AppConfig} config
   * @returns {boolean}
   */
  saveConfig(config) {
    return this.#set(CONFIG.STORAGE_KEYS.CONFIG, config);
  }

  /**
   * Get current theme
   * @returns {string} 'dark' or 'light'
   */
  getTheme() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || CONFIG.DEFAULTS.THEME;
  }

  /**
   * Save theme preference
   * @param {string} theme - 'dark' or 'light'
   */
  saveTheme(theme) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get validation history
   * @returns {HistoryEntry[]}
   */
  getHistory() {
    return this.#get(CONFIG.STORAGE_KEYS.HISTORY) || [];
  }

  /**
   * Save validation history (limited to MAX_HISTORY_ITEMS)
   * @param {HistoryEntry[]} history
   * @returns {boolean}
   */
  saveHistory(history) {
    return this.#set(
      CONFIG.STORAGE_KEYS.HISTORY,
      history.slice(0, CONFIG.LIMITS.MAX_HISTORY_ITEMS)
    );
  }

  /**
   * Clear all history
   */
  clearHistory() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY);
  }
}

/** @type {StorageService} */
export const storage = new StorageService();
