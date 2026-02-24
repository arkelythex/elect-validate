/**
 * Electo - Progress Component
 * Progress bar handling for validation
 * @module components/progress
 */

/**
 * ProgressComponent - Handles progress bar display
 * @class
 */
class ProgressComponent {
  /** @type {HTMLElement|null} */
  #container = null;
  /** @type {HTMLElement|null} */
  #bar = null;
  /** @type {HTMLElement|null} */
  #percent = null;
  /** @type {number} */
  #currentPercent = 0;

  init() {
    this.#container = document.getElementById('progressContainer');
    this.#bar = document.getElementById('progressBar');
    this.#percent = document.getElementById('progressPercent');
    
    // Listen for validation progress events
    window.addEventListener('validationprogress', (e) => {
      this.update(e.detail.progress);
    });
  }

  /**
   * Show progress bar
   */
  show() {
    this.#container?.classList.remove('hidden');
    this.update(0);
  }

  /**
   * Hide progress bar
   */
  hide() {
    this.#container?.classList.add('hidden');
    this.reset();
  }

  /**
   * Update progress percentage
   * @param {number} percent - Progress 0-100
   */
  update(percent) {
    this.#currentPercent = percent;
    
    if (this.#bar) {
      this.#bar.style.width = percent + '%';
    }
    
    if (this.#percent) {
      this.#percent.textContent = percent + '%';
    }
  }

  /**
   * Reset progress to 0
   */
  reset() {
    this.#currentPercent = 0;
    
    if (this.#bar) {
      this.#bar.style.width = '0%';
    }
    
    if (this.#percent) {
      this.#percent.textContent = '0%';
    }
  }

  /**
   * Get current progress
   * @returns {number}
   */
  getProgress() {
    return this.#currentPercent;
  }
}

/** @type {ProgressComponent} */
export const progressComponent = new ProgressComponent();
