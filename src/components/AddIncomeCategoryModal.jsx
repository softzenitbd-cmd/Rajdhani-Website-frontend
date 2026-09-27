import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Tag } from 'lucide-react';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';

/**
 * AddIncomeCategoryModal Component
 * Allows user to quickly add an Income Category (Khat) directly from a dropdown
 */
const AddIncomeCategoryModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast.error(t('Category title is required'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await accountingService.createIncomeCategory({
        name: name.trim()
      });

      toast.success(t('Category added successfully!'));
      
      setName('');

      if (onSuccess) {
        onSuccess(res?.data || res || { id: Date.now(), name: name.trim() });
      }
      onClose();
    } catch (err) {
      console.error('Failed to create category:', err);
      toast.error(err?.message || t('Failed to create category'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '500px',
          maxWidth: '95vw',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: '#2e7d32',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={20} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              {t('Add Income Category')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                {t('Category Title')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Enter category name (e.g. Sales, Service)')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#475569',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? t('Saving...') : t('Save Category')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddIncomeCategoryModal;
