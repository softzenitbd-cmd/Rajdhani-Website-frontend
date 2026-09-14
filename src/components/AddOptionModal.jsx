import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { X, Check, Plus } from 'lucide-react';

const AddOptionModal = ({ isOpen, onClose, onSave, title, label, placeholder, initialValue = '' }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  // onSave may be async and may throw (API failure) – only close on success
  const handleSave = async () => {
    if (!inputValue.trim()) {
      toast.error(t("Please enter {{v0}}", { v0: label ? label.toLowerCase() : t("a value") }));
      return;
    }
    try {
      setSaving(true);
      await onSave(inputValue.trim());
      toast.success(t("Saved successfully!"));
      setInputValue('');
      onClose();
    } catch (err) {
      toast.error(err?.message || t("Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          width: '420px',
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          background: '#2e7d32',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px', display: 'flex' }}>
              <Plus size={18} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', letterSpacing: '0.3px' }}>
                {title || t("Add Option")}
              </h3>
              <span style={{ fontSize: '11px', opacity: 0.85 }}>{t("Side Drawer Quick Creation")}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              {label || t("Title / Name")} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                placeholder={placeholder || t("Enter {{v0}}...", { v0: label ? label.toLowerCase() : t("name") })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '14px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          gap: '12px',
          justify: 'flex-end'
        }}>
          <button 
            type="button" 
            onClick={handleClose} 
            style={{
              padding: '10px 18px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 22px',
              background: saving ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Check size={16} /> {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOptionModal;
