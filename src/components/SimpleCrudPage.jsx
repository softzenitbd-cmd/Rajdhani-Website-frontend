import React, { useEffect, useState } from 'react';
import { X, Pencil, Trash2, Plus } from 'lucide-react';
import PrintHeader from './PrintHeader';
import TableToolbar from './TableToolbar';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { toList, fmtDate } from '../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Generic "name only" master data screen (Department, Designation, Unit, Bank …).
 *
 * props:
 *  - title, itemLabel
 *  - service: { list(params), create(data), update(id, data), remove(id) }
 *  - extraFields: [{name, label, type}] additional inputs stored on the record
 *  - columns: optional extra columns [{key,label}]
 */
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' };

const SimpleCrudPage = ({ title, itemLabel: itemLabelProp, service, extraFields = [], columns = [], excelName }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const itemLabel = itemLabelProp || t('Item');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(50);
  const [modal, setModal] = useState(null); // null | { id?, name, ...extra }
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await service.list(search ? { search } : {});
      setRows(toList(res));
    } catch (e) {
      toast.error(e.message || t("Failed to load {{v0}}", { v0: title }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    const base = { name: '' };
    extraFields.forEach((f) => { base[f.name] = f.default ?? ''; });
    setModal(base);
  };

  const openEdit = (row) => {
    const base = { id: row.id || row.uuid, name: row.name || '', _original: row };
    extraFields.forEach((f) => {
      const v = row[f.name];
      // relations may come back nested ({id, name}) – edit with the id
      base[f.name] = v && typeof v === 'object' ? (v.id ?? v.uuid ?? '') : (v ?? '');
    });
    setModal(base);
  };

  const save = async () => {
    if (!modal.name?.trim()) {
      toast.error(t("{{v0}} name is required", { v0: itemLabel }));
      return;
    }
    const { id, _original, ...payload } = modal;
    // on edit only send the fields that actually changed
    if (id && _original) {
      Object.keys(payload).forEach((k) => {
        const orig = _original[k];
        const origVal = orig && typeof orig === 'object' ? (orig.id ?? orig.uuid ?? '') : orig;
        if (String(payload[k] ?? '') === String(origVal ?? '')) delete payload[k];
      });
      if (Object.keys(payload).length === 0) { setModal(null); return; }
    }
    try {
      setSaving(true);
      if (id) {
        await service.update(id, payload);
        toast.success(t("{{v0}} updated", { v0: itemLabel }));
      } else {
        await service.create(payload);
        toast.success(t("{{v0}} added", { v0: itemLabel }));
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message || t("Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const isOk = await confirm({
      title: t("Delete {{v0}}", { v0: itemLabel }),
      message: t("Are you sure you want to delete \"{{v0}}\"?", { v0: row.name }),
      confirmText: t("Delete"),
      variant: 'danger',
    });
    if (!isOk) return;
    try {
      await service.remove(row.id || row.uuid);
      toast.success(t("{{v0}} deleted", { v0: itemLabel }));
      setRows((prev) => prev.filter((r) => (r.id || r.uuid) !== (row.id || row.uuid)));
    } catch (e) {
      toast.error(e.message || t("Delete failed"));
    }
  };

  const filtered = rows
    .filter((r) => !search || String(r.name || '').toLowerCase().includes(search.toLowerCase()))
    .slice(0, entries);

  const excelData = filtered.map((r, i) => {
    const o = { SL: i + 1, Name: r.name };
    columns.forEach((c) => { o[c.label] = c.render ? c.render(r) : r[c.key]; });
    o['Created At'] = fmtDate(r.created_at);
    return o;
  });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', padding: '24px' }}>
        <PrintHeader />

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: 'var(--fs-18, 18px)', color: 'var(--text-main)', margin: 0 }}>{title}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder={t("Search...")}
              style={{ ...inputStyle, width: '220px', padding: '8px' }}
            />
            <button onClick={openCreate} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={16} /> {t("Add {{v0}}", { v0: itemLabel })}
            </button>
          </div>
        </div>

        <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName={excelName || title.replace(/\s+/g, '_')} onReload={load} onReset={() => { setSearch(''); setTimeout(load, 0); }} />

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                <th style={{ width: '60px', padding: '12px' }}>{t("SL")}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t("NAME")}</th>
                {columns.map((c) => <th key={c.key} style={{ padding: '12px' }}>{c.label}</th>)}
                <th style={{ padding: '12px' }}>{t("CREATED AT")}</th>
                <th className="action-column" style={{ padding: '12px', width: '120px' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4 + columns.length} style={{ padding: '24px', color: '#64748b' }}>{t("Loading...")}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4 + columns.length} style={{ padding: '24px', color: '#64748b' }}>{t("No data available in table")}</td></tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id || row.uuid || i}>
                    <td style={{ padding: '10px' }}>{i + 1}</td>
                    <td style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>{row.name}</td>
                    {columns.map((c) => <td key={c.key} style={{ padding: '10px' }}>{c.render ? c.render(row) : (row[c.key] ?? '-')}</td>)}
                    <td style={{ padding: '10px' }}>{fmtDate(row.created_at)}</td>
                    <td className="action-column" style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(row)} title={t("Edit")} style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                        <button onClick={() => remove(row)} title={t("Delete")} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', width: '420px', maxWidth: '95vw', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', color: 'var(--text-main)' }}>{modal.id ? t("Edit {{v0}}", { v0: itemLabel }) : t("Add {{v0}}", { v0: itemLabel })}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)' }}>{t("{{v0}} Name", { v0: itemLabel })} <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  autoFocus
                  type="text"
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                  placeholder={t("Enter {{v0}} name", { v0: itemLabel })}
                  style={inputStyle}
                />
              </div>
              {extraFields.map((f) => (
                <div key={f.name} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)' }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={modal[f.name]} onChange={(e) => setModal({ ...modal, [f.name]: e.target.value })} style={inputStyle}>
                      {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} value={modal[f.name]} onChange={(e) => setModal({ ...modal, [f.name]: e.target.value })} placeholder={f.placeholder || ''} style={inputStyle} />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setModal(null)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Cancel")}</button>
                <button onClick={save} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? t("Saving...") : t("Save")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCrudPage;
