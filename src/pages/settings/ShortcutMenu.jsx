import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { useToast } from '../../context/ToastContext';
import { readShortcuts, writeShortcuts, DEFAULT_SHORTCUTS, ALL_MENU_LINKS } from '../../utils/shortcuts';
import { fmtDate } from '../../utils/apiHelpers';

/**
 * Manage the quick buttons shown in the top header. Stored locally
 * (no backend endpoint) – see docs/missing-api-screens/README.md
 */
const ShortcutMenu = () => {
  const toast = useToast();
  const [items, setItems] = useState(readShortcuts);
  const [modal, setModal] = useState(false);
  const [pick, setPick] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const persist = (next) => {
    setItems(next);
    writeShortcuts(next);
  };

  const add = () => {
    const link = ALL_MENU_LINKS.find((l) => l.path === pick);
    if (!link) return toast.error('Select a menu');
    if (items.some((i) => i.path === link.path)) return toast.error('Already added');
    persist([...items, { id: `${Date.now()}`, title: customTitle.trim() || link.title, path: link.path, created_at: new Date().toISOString() }]);
    setModal(false);
    setPick('');
    setCustomTitle('');
    toast.success('Shortcut added');
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
            <h2 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>Shortcut Menu List</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>These buttons appear in the top header for quick access.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { persist(DEFAULT_SHORTCUTS); toast.success('Shortcuts reset'); }} style={{ background: '#64748b', color: 'white', padding: '8px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={() => setModal(true)} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={16} /> Add Shortcut
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', fontSize: '12px', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                <th style={{ width: '60px', padding: '12px' }}>SL</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>TITLE</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>ADDRESS</th>
                <th style={{ padding: '12px' }}>CREATED AT</th>
                <th className="action-column" style={{ padding: '12px', width: '150px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '24px', color: '#64748b' }}>No shortcuts. Add one.</td></tr>
              ) : items.map((row, i) => (
                <tr key={row.id}>
                  <td style={{ padding: '10px' }}>{i + 1}</td>
                  <td style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>{row.title}</td>
                  <td style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>{row.path}</td>
                  <td style={{ padding: '10px' }}>{row.created_at ? fmtDate(row.created_at) : 'Default'}</td>
                  <td className="action-column" style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => move(i, -1)} title="Move up" style={btn('#64748b')}><ArrowUp size={14} /></button>
                      <button onClick={() => move(i, 1)} title="Move down" style={btn('#64748b')}><ArrowDown size={14} /></button>
                      <button onClick={() => remove(row.id)} title="Remove" style={btn('var(--danger)')}><Trash2 size={14} /></button>
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
              <h3 style={{ margin: 0, fontSize: '16px' }}>Add Shortcut</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Menu</label>
              <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '16px' }}>
                <option value="">Select a menu</option>
                {ALL_MENU_LINKS.map((l) => <option key={l.path} value={l.path}>{l.title}</option>)}
              </select>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Button Title (optional)</label>
              <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Custom label" style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={add} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortcutMenu;
