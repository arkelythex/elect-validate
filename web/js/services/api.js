/**
 * Electo - API Service
 * HTTP and WebSocket communication
 * @module services/api
 */

import { CONFIG, ENV } from '../core/config.js';

/**
 * @typedef {Object} ValidationOptions
 * @property {string} workers - Number of workers
 * @property {string} umbralNulos - Null vote threshold
 * @property {string} umbralBlancos - Blank vote threshold
 */

/**
 * @typedef {Object} ValidationResult
 * @property {number} total_actas
 * @property {number} actas_validas
 * @property {number} actas_invalidas
 * @property {Object} estadisticas
 * @property {Array} resultados
 */

/**
 * @typedef {Object} WSMessage
 * @property {string} type - 'progress' | 'result' | 'error'
 * @property {number} [progress]
 * @property {ValidationResult} [result]
 * @property {string} [error]
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} token
 */

/**
 * ApiService - Handles HTTP and WebSocket communication
 * Primary method: validate() with automatic fallback
 * @class
 */
class ApiService {
  /** @type {string|null} */
  #token = null;

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    if (!this.#token) {
      this.#token = localStorage.getItem('Electo_token');
    }
    return this.#token;
  }

  /**
   * Set and store token
   * @param {string} token
   */
  setToken(token) {
    this.#token = token;
    localStorage.setItem('Electo_token', token);
  }

  /**
   * Clear token
   */
  clearToken() {
    this.#token = null;
    localStorage.removeItem('Electo_token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Login and get token
   * @param {string} username
   * @param {string} password
   * @returns {Promise<LoginResponse>}
   */
  async login(username, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  /**
   * Logout
   */
  logout() {
    this.clearToken();
  }

  /**
   * Validate file using WebSocket (preferred for large files)
   * @param {File} file - CSV file to validate
   * @param {ValidationOptions} options - Validation options
   * @returns {Promise<ValidationResult>}
   */
  async validateWithWS(file, options = {}) {
    const { workers, umbralNulos, umbralBlancos } = options;
    
    return new Promise((resolve, reject) => {
      const host = window.location.host;
      const wsUrl = CONFIG.API.VALIDATE_WS.replace('{host}', host)
        + `?workers=${workers}&umbral_nulos=${umbralNulos}&umbral_blancos=${umbralBlancos}`;
      
      /** @type {WebSocket} */
      const ws = new WebSocket(wsUrl);
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          ws.close();
        }
      };

      ws.onopen = () => {
        const reader = new FileReader();
        reader.onload = () => ws.send(reader.result);
        reader.onerror = () => {
          cleanup();
          reject(new Error('Error leyendo archivo'));
        };
        reader.readAsText(file);
      };

      /** @param {MessageEvent} event */
      ws.onmessage = (event) => {
        /** @type {WSMessage} */
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          window.dispatchEvent(new CustomEvent('validationprogress', { 
            detail: { progress: data.progress } 
          }));
        } else if (data.type === 'result') {
          resolved = true;
          cleanup();
          resolve(data.result);
        } else if (data.type === 'error') {
          cleanup();
          reject(new Error(data.error));
        }
      };

      ws.onerror = () => {
        cleanup();
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        if (!resolved) {
          reject(new Error('Connection closed'));
        }
      };
    });
  }

  /**
   * Validate file using HTTP POST (fallback)
   * @param {File} file - CSV file to validate
   * @param {ValidationOptions} options - Validation options
   * @returns {Promise<ValidationResult>}
   */
  async validateWithHTTP(file, options = {}) {
    const { workers, umbralNulos, umbralBlancos } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workers', workers);
    formData.append('umbral_nulos', umbralNulos);
    formData.append('umbral_blancos', umbralBlancos);

    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(CONFIG.API.VALIDATE, {
      method: 'POST',
      headers,
      body: formData
    });

    if (response.status === 401) {
      this.clearToken();
      window.dispatchEvent(new CustomEvent('authrequired'));
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Validate file - tries WebSocket first, falls back to HTTP
   * @param {File} file - CSV file to validate
   * @param {ValidationOptions} options - Validation options
   * @returns {Promise<ValidationResult>}
   */
  async validate(file, options = {}) {
    try {
      return await this.validateWithWS(file, options);
    } catch (error) {
      ENV.isDev && console.warn('WS failed, falling back to HTTP:', error);
      
      try {
        return await this.validateWithHTTP(file, options);
      } catch (httpError) {
        throw new Error(`Validation failed: ${httpError.message}`);
      }
    }
  }
}

/** @type {ApiService} */
export const api = new ApiService();
