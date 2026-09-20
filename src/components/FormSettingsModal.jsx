import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const FormSettingsModal = ({ isOpen, onClose, title, fields, initialSettings, onSave }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings || {});
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '600px',
        maxWidth: '95vw',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', color: '#1e293b' }}>
            {title || t("Form Settings")}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {fields.map((field) => (
            <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <span style={{ fontSize: 'var(--fs-14, 14px)', color: '#334155' }}>{field.label}</span>
              <label className="switch" style={{ margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={settings[field.key] !== false} 
                  onChange={() => handleToggle(field.key)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            style={{ background: '#0f172a', color: 'white', padding: '10px 24px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormSettingsModal;
