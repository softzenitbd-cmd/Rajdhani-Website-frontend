import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

/**
 * Generic small edit dialog.
 * fields: [{ name, label, type='text' }]   record: object being edited
 * onSave(changedFields) → promise
 */
const input = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' };

const QuickEditModal = ({ title = 'Edit', fields, record, onSave, onClose }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState(() => {
    const f = {};
    fields.forEach((fl) => {
      const v = record?.[fl.name];
      f[fl.name] = fl.type === 'date' && v ? String(v).split('T')[0] : v ?? '';
    });
    return f;
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const changed = {};
    fields.forEach((fl) => {
      const original = fl.type === 'date' && record?.[fl.name] ? String(record[fl.name]).split('T')[0] : record?.[fl.name] ?? '';
      if (String(form[fl.name] ?? '') !== String(original)) changed[fl.name] = form[fl.name];
    });
    if (Object.keys(changed).length === 0) return onClose();
    try {
      setSaving(true);
      await onSave(changed);
      toast.success(t("Updated successfully"));
      onClose(true);
    } catch (e) {
      toast.error(e.message || t("Update failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '8px', width: '440px', maxWidth: '95vw', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{title}</h3>
          <button onClick={() => onClose()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '24px' }}>
          {fields.map((fl) => (
            <div key={fl.name} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--label-color)', fontWeight: 600 }}>{fl.label}</label>
              {fl.type === 'textarea' ? (
                <textarea value={form[fl.name]} onChange={(e) => setForm({ ...form, [fl.name]: e.target.value })} style={{ ...input, minHeight: '70px' }} />
              ) : fl.type === 'select' ? (
                <select value={form[fl.name]} onChange={(e) => setForm({ ...form, [fl.name]: e.target.value })} style={input}>
                  {(fl.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={fl.type || 'text'} step={fl.type === 'number' ? '0.01' : undefined} value={form[fl.name]} onChange={(e) => setForm({ ...form, [fl.name]: e.target.value })} style={input} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button onClick={() => onClose()} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Cancel")}</button>
            <button onClick={save} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? t("Saving...") : t("Save")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEditModal;
