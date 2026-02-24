/**
 * Electo - Table Component
 * Paginated results table with filtering
 * @module components/table
 */

import { CONFIG } from '../core/config.js';

/**
 * @typedef {Object} TableState
 * @property {Array} items
 * @property {number} currentPage
 * @property {number} itemsPerPage
 * @property {Array} filteredItems
 */

/**
 * @typedef {Object} TableElements
 * @property {HTMLElement} tbody
 * @property {HTMLElement} paginationInfo
 * @property {HTMLElement} pageNumbers
 * @property {HTMLButtonElement} prevBtn
 * @property {HTMLButtonElement} nextBtn
 * @property {HTMLInputElement} searchInput
 * @property {HTMLSelectElement} filterSelect
 */

/**
 * @typedef {Object} ActaItem
 * @property {string} acta_id
 * @property {boolean} es_valida
 * @property {Array<{tipo: string}>} errores
 */

/**
 * TableComponent - Handles paginated table with search and filters
 * @class
 */
class TableComponent {
  /** @type {TableState} */
  #state = {
    items: [],
    currentPage: 1,
    itemsPerPage: CONFIG.PAGINATION.ITEMS_PER_PAGE,
    filteredItems: []
  };

  /** @type {TableElements} */
  #elements = {
    tbody: null,
    paginationInfo: null,
    pageNumbers: null,
    prevBtn: null,
    nextBtn: null,
    searchInput: null,
    filterSelect: null
  };

  init() {
    this.#cacheElements();
    this.#attachListeners();
  }

  /**
   * Cache DOM element references
   * @private
   */
  #cacheElements() {
    this.#elements.tbody = document.getElementById('resultsTableBody');
    this.#elements.paginationInfo = document.getElementById('paginationInfo');
    this.#elements.pageNumbers = document.getElementById('pageNumbers');
    this.#elements.prevBtn = document.getElementById('prevPageBtn');
    this.#elements.nextBtn = document.getElementById('nextPageBtn');
    this.#elements.searchInput = document.getElementById('searchInput');
    this.#elements.filterSelect = document.getElementById('filterStatus');
  }

  /**
   * Attach event listeners
   * @private
   */
  #attachListeners() {
    if (this.#elements.searchInput) {
      this.#elements.searchInput.addEventListener('input', () => {
        this.#state.currentPage = 1;
        this.#applyFilters();
      });
    }

    if (this.#elements.filterSelect) {
      this.#elements.filterSelect.addEventListener('change', () => {
        this.#state.currentPage = 1;
        this.#applyFilters();
      });
    }

    if (this.#elements.prevBtn) {
      this.#elements.prevBtn.addEventListener('click', () => this.#prevPage());
    }

    if (this.#elements.nextBtn) {
      this.#elements.nextBtn.addEventListener('click', () => this.#nextPage());
    }
  }

  /**
   * Set table items and reset pagination
   * @param {ActaItem[]} items
   */
  setItems(items) {
    this.#state.items = items;
    this.#state.currentPage = 1;
    this.#applyFilters();
  }

  /**
   * Apply search and filter to items
   * @private
   */
  #applyFilters() {
    const searchTerm = this.#elements.searchInput?.value?.toLowerCase() || '';
    const statusFilter = this.#elements.filterSelect?.value || 'all';

    let filtered = [...this.#state.items];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.acta_id.toLowerCase().includes(searchTerm)
      );
    }

    if (statusFilter === 'valid') {
      filtered = filtered.filter(item => item.es_valida);
    } else if (statusFilter === 'invalid') {
      filtered = filtered.filter(item => !item.es_valida);
    }

    this.#state.filteredItems = filtered;
    this.#render();
  }

  /**
   * Render table and pagination
   * @private
   */
  #render() {
    this.#renderTable();
    this.#renderPagination();
  }

  /**
   * Render table rows
   * @private
   */
  #renderTable() {
    if (!this.#elements.tbody) return;

    const start = (this.#state.currentPage - 1) * this.#state.itemsPerPage;
    const end = start + this.#state.itemsPerPage;
    const pageItems = this.#state.filteredItems.slice(start, end);

    if (pageItems.length === 0) {
      this.#elements.tbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-8 text-white/40">No hay resultados</td>
        </tr>
      `;
      return;
    }

    this.#elements.tbody.innerHTML = pageItems.map(item => `
      <tr class="hover:bg-white/[0.02] transition">
        <td class="mono text-sm">${item.acta_id}</td>
        <td>
          <span class="px-2 py-1 text-xs rounded ${
            item.es_valida 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }">
            ${item.es_valida ? 'VÁLIDA' : 'INVÁLIDA'}
          </span>
        </td>
        <td class="text-sm text-white/50">
          ${item.es_valida ? '—' : item.errores.map(e => e.tipo).join(', ')}
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render pagination controls
   * @private
   */
  #renderPagination() {
    if (!this.#elements.paginationInfo || !this.#elements.pageNumbers) return;

    const totalPages = Math.ceil(this.#state.filteredItems.length / this.#state.itemsPerPage);
    const start = (this.#state.currentPage - 1) * this.#state.itemsPerPage + 1;
    const end = Math.min(
      this.#state.currentPage * this.#state.itemsPerPage, 
      this.#state.filteredItems.length
    );

    // Info text
    this.#elements.paginationInfo.textContent = 
      this.#state.filteredItems.length > 0 
        ? `${start}-${end} de ${this.#state.filteredItems.length}`
        : '0 resultados';

    // Buttons
    if (this.#elements.prevBtn) {
      this.#elements.prevBtn.disabled = this.#state.currentPage === 1;
    }
    if (this.#elements.nextBtn) {
      this.#elements.nextBtn.disabled = this.#state.currentPage === totalPages || totalPages === 0;
    }

    // Page numbers
    let pagesHtml = '';
    const maxPages = Math.min(totalPages, CONFIG.PAGINATION.MAX_VISIBLE_PAGES);
    for (let i = 1; i <= maxPages; i++) {
      const isActive = i === this.#state.currentPage;
      pagesHtml += `
        <button class="px-2 py-1 text-xs ${isActive ? 'text-white' : 'text-white/40'} page-btn" data-page="${i}">
          ${i}
        </button>
      `;
    }
    this.#elements.pageNumbers.innerHTML = pagesHtml;

    // Page click handlers
    this.#elements.pageNumbers.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#state.currentPage = parseInt(btn.dataset.page);
        this.#render();
      });
    });
  }

  /**
   * Go to previous page
   * @private
   */
  #prevPage() {
    if (this.#state.currentPage > 1) {
      this.#state.currentPage--;
      this.#render();
    }
  }

  /**
   * Go to next page
   * @private
   */
  #nextPage() {
    const totalPages = Math.ceil(this.#state.filteredItems.length / this.#state.itemsPerPage);
    if (this.#state.currentPage < totalPages) {
      this.#state.currentPage++;
      this.#render();
    }
  }

  /**
   * Reset table to empty state
   */
  reset() {
    this.#state.items = [];
    this.#state.currentPage = 1;
    this.#state.filteredItems = [];
    this.#elements.searchInput.value = '';
    this.#elements.filterSelect.value = 'all';
    this.#render();
  }
}

/** @type {TableComponent} */
export const tableComponent = new TableComponent();
