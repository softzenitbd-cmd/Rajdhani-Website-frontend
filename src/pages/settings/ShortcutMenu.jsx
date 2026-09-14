import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { useToast } from '../../context/ToastContext';
import { readShortcuts, loadShortcuts, writeShortcuts, DEFAULT_SHORTCUTS, ALL_MENU_LINKS } from '../../utils/shortcuts';
import { fmtDate } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Manage the quick buttons shown in the top header. Saved on the server under
 * the `shortcuts` key of /api/erpsetting/general-settings/.
 */
const ShortcutMenu = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState(readShortcuts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [pick, setPick] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    loadShortcuts().then(setItems).finally(() => setLoading(false));
  }, []);

  const persist = async (next) => {
    const prev = items;
    setItems(next);
    try {
      setSaving(true);
      await writeShortcuts(next);
      return true;
    } catch (e) {
      setItems(prev);
      toast.error(e?.message || t("Failed to save shortcuts"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    const link = ALL_MENU_LINKS.find((l) => l.path === pick);
    if (!link) return toast.error(t("Select a menu"));
    if (items.some((i) => i.path === link.path)) return toast.error(t("Already added"));
    const ok = await persist([...items, { id: `${Date.now()}`, title: customTitle.trim() || link.title, path: link.path, created_at: new Date().toISOString() }]);
    if (!ok) return;
    setModal(false);
    setPick('');
    setCustomTitle('');
    toast.success(t("Shortcut added"));
  };

  const remove = (id) => persist(items.filter((i) => i.id !== id));
  const move = (idx, dir) => {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    persist(next);
  };

  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex' });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', padding: '24px' }}>
        <PrintHeader />
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>{t("Shortcut Menu List")}</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{t("These buttons appear in the top header for quick access.")}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={saving} onClick={async () => { if (await persist(DEFAULT_SHORTCUTS)) toast.success(t("Shortcuts reset")); }} style={{ background: '#64748b', color: 'white', padding: '8px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> {t("Reset")}
            </button>
            <button onClick={() => setModal(true)} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={16} /> {t("Add Shortcut")}
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', fontSize: '12px', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                <th style={{ width: '60px', padding: '12px' }}>{t("SL")}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t("TITLE")}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t("ADDRESS")}</th>
                <th style={{ padding: '12px' }}>{t("CREATED AT")}</th>
                <th className="action-column" style={{ padding: '12px', width: '150px' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '24px', color: '#64748b' }}>{t("Loading...")}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '24px', color: '#64748b' }}>{t("No shortcuts. Add one.")}</td></tr>
              ) : items.map((row, i) => (
                <tr key={row.id}>
                  <td style={{ padding: '10px' }}>{i + 1}</td>
                  <td style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>{t(row.title)}</td>
                  <td style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>{row.path}</td>
                  <td style={{ padding: '10px' }}>{row.created_at ? fmtDate(row.created_at) : t("Default")}</td>
                  <td className="action-column" style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => move(i, -1)} title={t("Move up")} style={btn('#64748b')}><ArrowUp size={14} /></button>
                      <button onClick={() => move(i, 1)} title={t("Move down")} style={btn('#64748b')}><ArrowDown size={14} /></button>
                      <button onClick={() => remove(row.id)} title={t("Remove")} style={btn('var(--danger)')}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', width: '420px', maxWidth: '95vw' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{t("Add Shortcut")}</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>{t("Menu")}</label>
              <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '16px' }}>
                <option value="">{t("Select a menu")}</option>
                {ALL_MENU_LINKS.map((l) => <option key={l.path} value={l.path}>{t(l.title)}</option>)}
              </select>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>{t("Button Title (optional)")}</label>
              <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder={t("Custom label")} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Cancel")}</button>
                <button onClick={add} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Add")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortcutMenu;
