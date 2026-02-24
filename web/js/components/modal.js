/**
 * Electo - Modal Component
 * Reusable modal functionality
 * @module components/modal
 */

/**
 * ModalComponent - Generic modal handler
 * @class
 */
class ModalComponent {
  /** @type {HTMLElement|null} */
  #modal = null;
  /** @type {HTMLElement|null} */
  #overlay = null;
  /** @type {HTMLButtonElement|null} */
  #closeBtn = null;

  /**
   * Initialize modal with DOM element IDs
   * @param {string} modalId - Modal element ID
   * @param {string} overlayId - Overlay element ID
   * @param {string} closeBtnId - Close button element ID
   */
  init(modalId, overlayId, closeBtnId) {
    this.#modal = document.getElementById(modalId);
    this.#overlay = document.getElementById(overlayId);
    this.#closeBtn = document.getElementById(closeBtnId);
    this.#attachListeners();
  }

  /**
   * Attach event listeners
   * @private
   */
  #attachListeners() {
    if (this.#closeBtn) {
      this.#closeBtn.addEventListener('click', () => this.close());
    }

    if (this.#overlay) {
      this.#overlay.addEventListener('click', () => this.close());
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#modal && !this.#modal.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  /**
   * Open modal
   */
  open() {
    this.#modal?.classList.remove('hidden');
  }

  /**
   * Close modal
   */
  close() {
    this.#modal?.classList.add('hidden');
  }

  /**
   * Toggle modal visibility
   */
  toggle() {
    this.#modal?.classList.toggle('hidden');
  }

  /**
   * Check if modal is currently open
   * @returns {boolean}
   */
  isOpen() {
    return this.#modal && !this.#modal.classList.contains('hidden');
  }
}

/** @type {ModalComponent} */
export const historyModal = new ModalComponent();
