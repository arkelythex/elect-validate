/**
 * Electo - Charts Component
 * Statistics visualization with Chart.js
 * @module components/charts
 */

import { themeManager } from '../core/theme.js';

/**
 * @typedef {Object} ChartColors
 * @property {string} text
 * @property {string} grid
 * @property {string[]} pie
 * @property {string} bar
 */

/**
 * @typedef {Object} ValidationStats
 * @property {number} porcentaje_validas
 * @property {number} porcentaje_invalidas
 * @property {number} tiempo_procesamiento
 * @property {Object.<string, number>} errors_por_tipo
 * @property {string[]} patrones_detectados
 */

/**
 * ChartsComponent - Handles pie and bar chart rendering
 * @class
 */
class ChartsComponent {
  /** @type {Chart|null} */
  #pieChart = null;
  /** @type {Chart|null} */
  #barChart = null;

  init() {
    this.#initPieChart();
    this.#initBarChart();
    
    // Listen for theme changes
    window.addEventListener('themechange', () => this.#updateTheme());
  }

  /**
   * Get color scheme based on current theme
   * @returns {ChartColors}
   * @private
   */
  #getChartColors() {
    const isDark = themeManager.isDark();
    return {
      text: isDark ? '#a1a1aa' : '#52525b',
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      pie: isDark 
        ? ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)']
        : ['#22c55e', '#ef4444'],
      bar: isDark ? 'rgba(255,255,255,0.4)' : '#6366f1'
    };
  }

  /**
   * Initialize pie/doughnut chart
   * @private
   */
  #initPieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;
    
    const colors = this.#getChartColors();
    const colors_pie = colors.pie;
    
    this.#pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Válidas', 'Inválidas'],
        datasets: [{
          data: [0, 0],
          backgroundColor: colors_pie,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.text, padding: 20 }
          }
        }
      }
    });
  }

  /**
   * Initialize bar chart
   * @private
   */
  #initBarChart() {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    
    const colors = this.#getChartColors();
    
    this.#barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Errores',
          data: [],
          backgroundColor: colors.bar,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { 
            ticks: { color: colors.text }, 
            grid: { display: false } 
          },
          y: { 
            ticks: { color: colors.text }, 
            grid: { color: colors.grid } 
          }
        }
      }
    });
  }

  /**
   * Update charts with validation results
   * @param {Object} data - Validation result data
   */
  update(data) {
    if (!this.#pieChart || !this.#barChart) return;

    // Update Pie Chart
    this.#pieChart.data.datasets[0].data = [data.actas_validas, data.actas_invalidas];
    this.#pieChart.data.datasets[0].backgroundColor = this.#getChartColors().pie;
    this.#pieChart.options.plugins.legend.labels.color = this.#getChartColors().text;
    this.#pieChart.update();

    // Update Bar Chart
    const errorTypes = Object.keys(data.estadisticas.errors_por_tipo || {});
    const errorCounts = Object.values(data.estadisticas.errors_por_tipo || {});

    this.#barChart.data.labels = errorTypes.length > 0 ? errorTypes : ['Sin errores'];
    this.#barChart.data.datasets[0].data = errorCounts.length > 0 ? errorCounts : [0];
    this.#barChart.data.datasets[0].backgroundColor = this.#getChartColors().bar;
    this.#barChart.options.scales.x.ticks.color = this.#getChartColors().text;
    this.#barChart.options.scales.y.ticks.color = this.#getChartColors().text;
    this.#barChart.options.scales.y.grid.color = this.#getChartColors().grid;
    this.#barChart.update();
  }

  /**
   * Update charts on theme change
   * @private
   */
  #updateTheme() {
    if (this.#pieChart && this.#barChart) {
      // Re-initialize with new theme colors
      const data = {
        actas_validas: this.#pieChart.data.datasets[0].data[0],
        actas_invalidas: this.#pieChart.data.datasets[0].data[1],
        estadisticas: { errors_por_tipo: {} }
      };
      
      // Extract bar data
      data.estadisticas.errors_por_tipo = this.#barChart.data.labels.reduce((acc, label, i) => {
        if (label !== 'Sin errores') {
          acc[label] = this.#barChart.data.datasets[0].data[i];
        }
        return acc;
      }, {});
      
      this.update(data);
    }
  }

  /**
   * Destroy chart instances
   */
  destroy() {
    this.#pieChart?.destroy();
    this.#barChart?.destroy();
  }
}

/** @type {ChartsComponent} */
export const chartsComponent = new ChartsComponent();
