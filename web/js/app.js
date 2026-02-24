/**
 * Electo - Main Application
 * Entry point that orchestrates all modules
 * @module app
 */

// Core
import { storage } from './core/storage.js';
import { themeManager } from './core/theme.js';
import { CONFIG } from './core/config.js';

// Services
import { api } from './services/api.js';

// Components
import { chartsComponent } from './components/charts.js';
import { tableComponent } from './components/table.js';
import { historyModal } from './components/modal.js';
import { progressComponent } from './components/progress.js';
import { exportComponent } from './components/export.js';

/**
 * @typedef {Object} AppState
 * @property {File|null} currentFile
 * @property {Object|null} validationResult
 */

/**
 * @typedef {Object} AppElements
 * @property {HTMLElement} dropZone
 * @property {HTMLInputElement} fileInput
 * @property {HTMLButtonElement} validateBtn
 * @property {HTMLElement} uploadSection
 * @property {HTMLElement} loadingSection
 * @property {HTMLElement} resultsSection
 * @property {HTMLElement} patternsSection
 * @property {HTMLElement} patternsList
 * @property {HTMLSelectElement} workers
 * @property {HTMLInputElement} umbralNulos
 * @property {HTMLButtonElement} historyBtn
 * @property {HTMLElement} historyList
 * @property {HTMLButtonElement} clearHistoryBtn
 */

/** @type {AppState} */
const state = {
  currentFile: null,
  validationResult: null
};

/** @type {AppElements} */
const elements = {
  loginScreen: document.getElementById('loginScreen'),
  loginForm: document.getElementById('loginForm'),
  loginUser: document.getElementById('loginUser'),
  loginPass: document.getElementById('loginPass'),
  loginError: document.getElementById('loginError'),
  logoutBtn: document.getElementById('logoutBtn'),
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  validateBtn: document.getElementById('validateBtn'),
  uploadSection: document.getElementById('uploadSection'),
  loadingSection: document.getElementById('loadingSection'),
  resultsSection: document.getElementById('resultsSection'),
  patternsSection: document.getElementById('patternsSection'),
  patternsList: document.getElementById('patternsList'),
  workers: document.getElementById('workers'),
  umbralNulos: document.getElementById('umbralNulos'),
  historyBtn: document.getElementById('historyBtn'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn')
};

// ==================== INITIALIZATION ====================

/**
 * Initialize application
 */
function init() {
  checkAuth();
  loadConfig();
  initComponents();
  attachEventListeners();
}

// ==================== AUTH ====================

function checkAuth() {
  if (api.isAuthenticated()) {
    showMainApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  elements.loginScreen.classList.remove('hidden');
  elements.logoutBtn.classList.add('hidden');
}

function showMainApp() {
  elements.loginScreen.classList.add('hidden');
  elements.logoutBtn.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const username = elements.loginUser.value;
  const password = elements.loginPass.value;
  
  elements.loginError.classList.add('hidden');
  
  try {
    await api.login(username, password);
    showMainApp();
    elements.loginUser.value = '';
    elements.loginPass.value = '';
  } catch (err) {
    elements.loginError.textContent = err.message;
    elements.loginError.classList.remove('hidden');
  }
}

function handleLogout() {
  api.logout();
  showLogin();
}

// ==================== CONFIG ====================

/**
 * Load saved configuration
 */
function loadConfig() {
  const config = storage.getConfig();
  if (config) {
    elements.workers.value = config.workers || CONFIG.DEFAULTS.WORKERS;
    elements.umbralNulos.value = config.umbralNulos || CONFIG.DEFAULTS.UMBRAL_NULOS;
  }
}

/**
 * Save current configuration
 */
function saveConfig() {
  storage.saveConfig({
    workers: elements.workers.value,
    umbralNulos: elements.umbralNulos.value
  });
}

// ==================== COMPONENTS ====================

/**
 * Initialize all components
 */
function initComponents() {
  themeManager.init();
  chartsComponent.init();
  tableComponent.init();
  historyModal.init('historyModal', 'historyOverlay', 'closeHistoryBtn');
  progressComponent.init();
}

// ==================== EVENT LISTENERS ====================

/**
 * Attach event listeners to DOM elements
 */
function attachEventListeners() {
  // Auth
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);
  
  // Listen for auth required events
  window.addEventListener('authrequired', () => {
    api.logout();
    showLogin();
  });

  // File handling
  elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  elements.dropZone.addEventListener('dragover', handleDragOver);
  elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('dragover'));
  elements.dropZone.addEventListener('drop', handleDrop);
  elements.fileInput.addEventListener('change', handleFileSelect);

  // Validation
  elements.validateBtn.addEventListener('click', runValidation);

  // History
  elements.historyBtn.addEventListener('click', showHistory);
  elements.clearHistoryBtn.addEventListener('click', clearHistory);

  // Export buttons
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => exportComponent.toCsv());
  document.getElementById('exportMdBtn')?.addEventListener('click', () => exportComponent.toMarkdown());
  document.getElementById('exportPdfBtn')?.addEventListener('click', () => exportComponent.toPdf());
}

// ==================== FILE HANDLING ====================

/**
 * Handle drag over event
 * @param {DragEvent} e
 */
function handleDragOver(e) {
  e.preventDefault();
  elements.dropZone.classList.add('dragover');
}

/**
 * Handle drop event
 * @param {DragEvent} e
 */
function handleDrop(e) {
  e.preventDefault();
  elements.dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
}

/**
 * Handle file selection
 * @param {Event} e
 */
function handleFileSelect(e) {
  if (e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
}

/**
 * Process selected file
 * @param {File} file
 */
function handleFile(file) {
  state.currentFile = file;
  elements.dropZone.innerHTML = `
    <div class="flex flex-col items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
        <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div>
        <p class="text-white/70 font-medium">${file.name}</p>
        <p class="text-xs text-white/30 mt-1 mono">${(file.size/1024).toFixed(1)} KB</p>
      </div>
    </div>
  `;
}

// ==================== VALIDATION ====================

/**
 * Run validation on selected file
 */
async function runValidation() {
  if (!state.currentFile) {
    alert('Selecciona un archivo');
    return;
  }

  saveConfig();
  
  elements.uploadSection.classList.add('hidden');
  elements.loadingSection.classList.remove('hidden');
  progressComponent.show();

  const options = {
    workers: elements.workers.value,
    umbralNulos: elements.umbralNulos.value,
    umbralBlancos: CONFIG.DEFAULTS.UMBRAL_BLANCOS
  };

  try {
    const result = await api.validate(state.currentFile, options);
    state.validationResult = result;
    
    // Set result for export component
    exportComponent.setResult(result, state.currentFile);
    
    addToHistory(result);
    displayResults(result);
    finishLoading();
  } catch (error) {
    alert('Error: ' + error.message);
    resetLoading();
  }
}

/**
 * Finish loading state
 */
function finishLoading() {
  setTimeout(() => {
    progressComponent.hide();
    elements.loadingSection.classList.add('hidden');
    elements.uploadSection.classList.remove('hidden');
  }, 500);
}

/**
 * Reset loading state
 */
function resetLoading() {
  elements.uploadSection.classList.remove('hidden');
  elements.loadingSection.classList.add('hidden');
  progressComponent.hide();
}

// ==================== RESULTS ====================

/**
 * Display validation results
 * @param {Object} result
 */
function displayResults(result) {
  elements.resultsSection.classList.remove('hidden');
  
  // Stats
  document.getElementById('statTotal').textContent = result.total_actas;
  document.getElementById('statValid').textContent = result.actas_validas;
  document.getElementById('statValidPct').textContent = result.estadisticas.porcentaje_validas.toFixed(1) + '%';
  document.getElementById('statInvalid').textContent = result.actas_invalidas;
  document.getElementById('statInvalidPct').textContent = result.estadisticas.porcentaje_invalidas.toFixed(1) + '%';
  document.getElementById('statTime').textContent = result.estadisticas.tiempo_procesamiento.toFixed(1) + 'ms';

  // Charts
  chartsComponent.update(result);

  // Patterns
  displayPatterns(result.estadisticas.patrones_detectados || []);

  // Table
  tableComponent.setItems(result.resultados);

  elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Display detected patterns
 * @param {string[]} patterns
 */
function displayPatterns(patterns) {
  if (patterns.length === 0) {
    elements.patternsSection.classList.add('hidden');
    return;
  }

  elements.patternsSection.classList.remove('hidden');
  elements.patternsList.innerHTML = patterns.map(p => `
    <li class="text-sm text-white/50 flex items-center gap-2">
      <span class="w-1 h-1 rounded-full bg-white/30"></span>
      ${p}
    </li>
  `).join('');
}

// ==================== HISTORY ====================

/**
 * Add result to history
 * @param {Object} result
 */
function addToHistory(result) {
  const history = storage.getHistory();
  history.unshift({
    fileName: state.currentFile?.name || 'Unknown',
    date: new Date().toISOString(),
    total: result.total_actas,
    validas: result.actas_validas,
    invalidas: result.actas_invalidas
  });
  storage.saveHistory(history);
}

/**
 * Show history modal
 */
function showHistory() {
  const history = storage.getHistory();
  
  if (history.length === 0) {
    elements.historyList.innerHTML = '<p class="text-sm text-white/40 text-center py-4">Sin archivos procesados</p>';
  } else {
    elements.historyList.innerHTML = history.map(h => `
      <div class="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">${h.fileName}</span>
          <span class="text-xs text-white/40">${new Date(h.date).toLocaleDateString()}</span>
        </div>
        <div class="text-xs text-white/40 mt-1">
          Total: ${h.total} | Válidas: ${h.validas} | Inválidas: ${h.invalidas}
        </div>
      </div>
    `).join('');
  }
  
  historyModal.open();
}

/**
 * Clear history
 */
function clearHistory() {
  storage.clearHistory();
  showHistory();
}

// Start application
document.addEventListener('DOMContentLoaded', init);
