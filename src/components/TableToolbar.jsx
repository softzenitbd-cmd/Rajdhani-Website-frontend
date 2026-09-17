import React from 'react';
import { Printer, RefreshCcw, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/excelExporter';
import { printPage } from '../utils/printUtils';
import { useTranslation } from 'react-i18next';

/**
 * Standard right hand toolbar used on every list / report page.
 *
 * props:
 *  - excelData / excelName   → enables the Excel button (array of flat objects)
 *  - onReload                → Reload button
 *  - onReset                 → Reset button (clear filters)
 *  - onPrint                 → override print (defaults to window.print())
 *  - entries / setEntries    → "Show N entries" select on the left
 *  - total                   → number of rows currently loaded
 */
const btn = (bg) => ({
  background: bg,
  color: 'white',
  padding: '6px 12px',
  border: 'none',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  fontSize: 'var(--fs-12, 12px)',
  fontWeight: 600,
});

const TableToolbar = ({
  excelData,
  excelName = 'Report',
  onReload,
  onReset,
  onPrint,
  entries,
  setEntries,
  total,
  left,
}) => {
  const { t } = useTranslation();
  return (
    <div className="table-header-controls no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {setEntries ? (
          <>
            {t("Show")}
            <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }}>
              {[10, 25, 50, 100, 500].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {t("entries")}
          </>
        ) : null}
        {typeof total === 'number' && <span>· {t("{{count}} records", { count: total })}</span>}
        {left}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {excelData && (
          <button type="button" onClick={() => exportToExcel(excelData, excelName)} style={btn('#059669')}>
            <FileSpreadsheet size={14} /> {t("Excel")}
          </button>
        )}
        <button type="button" onClick={onPrint || printPage} style={btn('var(--primary)')}>
          <Printer size={14} /> {t("Print")}
        </button>
        {onReset && (
          <button type="button" onClick={onReset} style={btn('#64748b')}>
            <RotateCcw size={14} /> {t("Reset")}
          </button>
        )}
        {onReload && (
          <button type="button" onClick={onReload} style={btn('#0ea5e9')}>
            <RefreshCcw size={14} /> {t("Reload")}
          </button>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;
