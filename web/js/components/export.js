/**
 * Electo - Export Component
 * CSV, Markdown, and PDF export utilities
 * @module components/export
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
 * ExportComponent - Handles file export in various formats
 * @class
 */
class ExportComponent {
  /** @type {ValidationResult|null} */
  #currentResult = null;
  /** @type {File|null} */
  #currentFile = null;

  /**
   * Set current validation result for export
   * @param {ValidationResult} result
   * @param {File} file
   */
  setResult(result, file) {
    this.#currentResult = result;
    this.#currentFile = file;
  }

  /**
   * Clear current result
   */
  clear() {
    this.#currentResult = null;
    this.#currentFile = null;
  }

  /**
   * Export to CSV format
   */
  toCsv() {
    if (!this.#currentResult) return;

    const r = this.#currentResult;
    const lines = ['Acta_ID,Estado,Error_Tipo,Gravedad,Campo,Valor,Esperado'];

    r.resultados.filter(x => x.es_valida).forEach(x => {
      lines.push(`${x.acta_id},VALIDO,,,,`);
    });

    r.resultados.filter(x => !x.es_valida).forEach(x => {
      x.errores.forEach(e => {
        lines.push(`${x.acta_id},INVALIDO,${e.tipo},${e.gravedad},${e.campo || ''},${e.valor || ''},${e.esperado || ''}`);
      });
    });

    this.#downloadFile(lines.join('\n'), 'reporte_validacion.csv', 'text/csv');
  }

  /**
   * Export to Markdown format
   */
  toMarkdown() {
    if (!this.#currentResult) return;

    const r = this.#currentResult;
    const lines = [
      '# Electo - Reporte de Validación Electoral',
      '',
      `**Fecha:** ${new Date().toLocaleString('es-PE')}`,
      `**Archivo:** ${this.#currentFile?.name || 'N/A'}`,
      '',
      '---',
      '',
      '## Resumen',
      '',
      '| Métrica | Valor |',
      '|---------|-------|',
      `| Total Actas | ${r.total_actas} |`,
      `| Válidas | ${r.actas_validas} (${r.estadisticas.porcentaje_validas.toFixed(1)}%) |`,
      `| Inválidas | ${r.actas_invalidas} (${r.estadisticas.porcentaje_invalidas.toFixed(1)}%) |`,
      `| Tiempo | ${r.estadisticas.tiempo_procesamiento.toFixed(1)}ms |`,
      ''
    ];

    if (Object.keys(r.estadisticas.errors_por_tipo || {}).length > 0) {
      lines.push('## Errores por Tipo', '');
      Object.entries(r.estadisticas.errors_por_tipo).forEach(([tipo, count]) => {
        lines.push(`- **${tipo}**: ${count}`);
      });
      lines.push('');
    }

    this.#downloadFile(lines.join('\n'), 'reporte_validacion.md', 'text/markdown');
  }

  /**
   * Export to PDF format
   */
  toPdf() {
    if (!this.#currentResult) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const r = this.#currentResult;

    doc.setFontSize(18);
    doc.text('Electo - Reporte de Validación', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString('es-PE')}`, 20, 30);
    doc.text(`Archivo: ${this.#currentFile?.name || 'N/A'}`, 20, 36);

    doc.setFillColor(245, 245, 245);
    doc.rect(20, 45, 170, 35, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen', 25, 55);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total: ${r.total_actas}`, 25, 65);
    doc.text(`Válidas: ${r.actas_validas} (${r.estadisticas.porcentaje_validas.toFixed(1)}%)`, 25, 72);
    doc.text(`Inválidas: ${r.actas_invalidas} (${r.estadisticas.porcentaje_invalidas.toFixed(1)}%)`, 90, 72);

    doc.save('reporte_validacion.pdf');
  }

  /**
   * Download file helper
   * @param {string} content
   * @param {string} filename
   * @param {string} type
   * @private
   */
  #downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
}

/** @type {ExportComponent} */
export const exportComponent = new ExportComponent();
