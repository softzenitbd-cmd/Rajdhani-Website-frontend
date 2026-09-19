import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { X, List } from 'lucide-react';

const AddOptionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  label, 
  placeholder, 
  initialValue = '',
  saveText,
  cancelText
}) => {
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

  const handleSave = async () => {
    if (!inputValue.trim()) {
      toast.error(t("Please enter {{v0}}", { v0: label ? label.toLowerCase() : t("a value") }));
      return;
    }
    try {
      setSaving(true);
      await onSave(inputValue.trim());
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

  const defaultSaveText = saveText || (
    title && title.toLowerCase().includes('category')
      ? t('Add Category')
      : (title && (title.toLowerCase().includes('edit') || title.toLowerCase().includes('update'))
          ? t('Save')
          : t('Add Group'))
  );

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: '700', color: '#1e293b' }}>
            {title || t("Add New Client Group")}
          </h3>
          <button 
            type="button" 
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              borderRadius: '4px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px 20px 20px' }}>
          {/* Input field with left badge tab */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              background: '#f8fafc',
              borderRight: '1px solid #cbd5e1',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#334155',
              fontWeight: '600',
              fontSize: 'var(--fs-13, 13px)',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}>
              <List size={16} color="#334155" />
              <span>{label || t("Group Name")}</span>
            </div>
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              placeholder={placeholder || ""}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '10px 14px',
                fontSize: 'var(--fs-14, 14px)',
                color: '#0f172a',
                background: 'transparent'
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

          {/* Action Buttons (Right Aligned: Green Add Group, Red Cancel) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px'
          }}>
            <button 
              type="button" 
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px',
                background: saving ? '#6ee7b7' : '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: 'var(--fs-14, 14px)',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { if (!saving) e.currentTarget.style.background = '#047857'; }}
              onMouseOut={(e) => { if (!saving) e.currentTarget.style.background = '#059669'; }}
            >
              {saving ? t('Saving...') : defaultSaveText}
            </button>
            <button 
              type="button" 
              onClick={handleClose} 
              style={{
                padding: '8px 20px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: 'var(--fs-14, 14px)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#dc2626'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#ef4444'; }}
            >
              {cancelText || t('Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOptionModal;
