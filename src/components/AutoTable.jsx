import React from 'react';
import { money } from '../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

/**
 * Renders any array of objects as a table. Columns are derived from the keys of the
 * first row unless `columns` is provided ([{key, label, align, render}]).
 * Used for reports whose exact backend shape can vary.
 */
const humanize = (k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const cell = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'boolean') return v ? i18n.t('Yes') : i18n.t('No');
  if (typeof v === 'number') return Number.isInteger(v) ? v : money(v);
  if (typeof v === 'object') return v.name || v.full_name || v.username || JSON.stringify(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return String(v).split('T')[0];
  return String(v);
};

const AutoTable = ({ rows = [], columns, loading, emptyText = 'No data available', showSl = true, hideKeys = ['id', 'uuid'], footer }) => {
  const { t } = useTranslation();
  const cols =
    columns ||
    (rows.length
      ? Object.keys(rows[0])
          .filter((k) => !hideKeys.includes(k))
          .map((k) => ({ key: k, label: t(humanize(k)) }))
      : []);

  const span = cols.length + (showSl ? 1 : 0) || 1;

  return (
    <div className="table-responsive">
      <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)' }}>
        <thead>
          <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
            {showSl && <th style={{ width: '50px', textAlign: 'center', padding: '10px' }}>{t("SL")}</th>}
            {cols.map((c) => (
              <th key={c.key} style={{ padding: '10px', textAlign: c.align || 'left' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={span} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading...")}</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={span} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{emptyText}</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id || r.uuid || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {showSl && <td style={{ textAlign: 'center', padding: '8px', color: '#64748b' }}>{i + 1}</td>}
                {cols.map((c) => (
                  <td key={c.key} style={{ padding: '8px', textAlign: c.align || 'left' }}>
                    {c.render ? c.render(r, i) : cell(r[c.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && rows.length > 0 && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
};

export default AutoTable;
