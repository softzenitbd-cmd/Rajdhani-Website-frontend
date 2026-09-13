import * as XLSX from 'xlsx';
import { toast } from '../context/ToastContext';

/**
 * Export the table currently shown on screen (first `table.custom-table`, or the
 * first table inside `.premium-body`) to xlsx / csv. Works on any list page
 * without page specific code. Action columns are skipped.
 */
const findTable = () =>
  document.querySelector('.premium-body table.custom-table') ||
  document.querySelector('table.custom-table') ||
  document.querySelector('.premium-body table') ||
  document.querySelector('.chart-card table') ||
  document.querySelector('table');

const rowsFromTable = (table) => {
  const rows = [];
  const skipIdx = new Set();
  const headRow = table.tHead?.rows?.[0];
  if (headRow) {
    Array.from(headRow.cells).forEach((c, i) => {
      if (c.classList.contains('action-column') || c.classList.contains('no-print-col') || /^action/i.test(c.textContent.trim())) skipIdx.add(i);
    });
    rows.push(Array.from(headRow.cells).filter((_, i) => !skipIdx.has(i)).map((c) => c.textContent.replace(/[⇅↕]/g, '').trim()));
  }
  Array.from(table.tBodies).forEach((body) => {
    Array.from(body.rows).forEach((r) => {
      if (r.cells.length <= 1) return; // "no data" / loading rows
      rows.push(Array.from(r.cells).filter((_, i) => !skipIdx.has(i)).map((c) => c.innerText.replace(/\s+/g, ' ').trim()));
    });
  });
  const foot = table.tFoot?.rows?.[0];
  if (foot) rows.push(Array.from(foot.cells).map((c) => c.innerText.replace(/\s+/g, ' ').trim()));
  return rows;
};

export const exportVisibleTable = (format = 'xlsx', name = 'Report') => {
  const table = findTable();
  if (!table) {
    toast.error('No table found to export.');
    return;
  }
  const rows = rowsFromTable(table);
  if (rows.length <= 1) {
    toast.error('No data available to export.');
    return;
  }
  const fileBase = `${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = rows[0].map((_, i) => ({ wch: Math.min(60, Math.max(10, ...rows.map((r) => String(r[i] || '').length + 2))) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${fileBase}.${format === 'csv' ? 'csv' : 'xlsx'}`, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
};

export default exportVisibleTable;
