/**
 * Electo - Theme Manager
 * Dark/Light theme handling with CSS variables
 * @module core/theme
 */

import { storage } from './storage.js';

/**
 * ThemeManager - Handles dark/light theme switching
 * Dispatches custom events for dependent components
 * @class
 */
class ThemeManager {
  /** @type {string|null} */
  #currentTheme = null;

  /** @type {{dark: HTMLElement|null, light: HTMLElement|null}} */
  #icons = { dark: null, light: null };

  constructor() {
    this.#icons.dark = document.getElementById('themeIconDark');
    this.#icons.light = document.getElementById('themeIconLight');
  }

  /**
   * Initialize theme from storage
   */
  init() {
    this.#currentTheme = storage.getTheme();
    this.#apply(this.#currentTheme);
    this.#attachListeners();
  }

  /**
   * Toggle between dark and light themes
   */
  toggle() {
    const next = this.#currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  /**
   * Set specific theme
   * @param {string} theme - 'dark' or 'light'
   */
  setTheme(theme) {
    this.#currentTheme = theme;
    this.#apply(theme);
    storage.saveTheme(theme);
  }

  /**
   * Get current theme
   * @returns {string}
   */
  get() {
    return this.#currentTheme;
  }

  /**
   * Check if dark theme is active
   * @returns {boolean}
   */
  isDark() {
    return this.#currentTheme === 'dark';
  }

  /**
   * Apply theme to DOM
   * @param {string} theme
   * @private
   */
  #apply(theme) {
    document.body.setAttribute('data-theme', theme);
    
    if (this.#icons.dark && this.#icons.light) {
      this.#icons.dark.classList.toggle('hidden', theme !== 'dark');
      this.#icons.light.classList.toggle('hidden', theme === 'dark');
    }
    
    // Dispatch event for charts to update
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  /**
   * Attach click listener to theme toggle button
   * @private
   */
  #attachListeners() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
  }
}

/** @type {ThemeManager} */
export const themeManager = new ThemeManager();
