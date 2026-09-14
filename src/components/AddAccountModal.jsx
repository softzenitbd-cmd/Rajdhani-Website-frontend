import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User } from 'lucide-react';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';

/**
 * AddAccountModal Component matching the user screenshot layout & styling:
 * - 6 fields (2 columns x 3 rows) with cyan badge pills
 * - Connected to accountingService.createAccount API
 */
const AddAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    accountNumber: '',
    contactPerson: '',
    phone: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('account_modal.title_required', 'Account title is required'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await accountingService.createAccount({
        name: formData.name.trim(),
        balance: formData.balance || 0,
        account_number: formData.accountNumber || '',
        contact_person: formData.contactPerson || '',
        phone: formData.phone || '',
        description: formData.description || ''
      });

      toast.success(t('account_modal.success', 'Account added successfully!'));
      
      // Reset form
      setFormData({
        name: '',
        balance: '',
        accountNumber: '',
        contactPerson: '',
        phone: '',
        description: ''
      });

      if (onSuccess) {
        onSuccess(res?.data || res || { id: Date.now(), name: formData.name.trim() });
      }
      onClose();
    } catch (err) {
      console.error('Failed to create account:', err);
      toast.error(err?.message || t('account_modal.error', 'Failed to create account'));
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
          width: '720px',
          maxWidth: '95vw',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
            {t('account_modal.title', 'Add New Account')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px 20px',
              marginBottom: '24px'
            }}
          >
            {/* Field 1: Account Title */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '12px',
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                <User size={12} /> {t('account_modal.account_title', 'একাউন্ট টাইটেল')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("Account title")}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'white'
                }}
              />
            </div>

            {/* Field 2: Initial Balance */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '12px',
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                <User size={12} /> {t('account_modal.initial_balance', 'প্রাথমিক ব্যালেন্স')}
              </label>
              <input
                type="number"
                step="0.01"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder={t("Initial Balance")}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'white'
                }}
              />
            </div>

            {/* Field 3: Account Number */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '12px',
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                <User size={12} /> {t('account_modal.account_number', 'একাউন্ট নাম্বার')}
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder={t("Account Number")}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'white'
                }}
              />
            </div>

            {/* Field 4: Contact Person */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '12px',
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                <User size={12} /> {t('account_modal.contact_person', 'যোগাযোগ নাম্বার')}
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder={t("Contact Person")}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'white'
                }}
              />
            </div>

            {/* Field 5: Phone Number */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '12px',
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                <User size={12} /> {t('account_modal.phone_number', 'ফোন নাম্বার')}
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("Phone Number")}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'white'
                }}
              />
            </div>

            {/* Field 6: Account Description */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '12px',
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                <User size={12} /> {t('account_modal.account_description', 'একাউন্ট বর্ণনা')}
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("Account description")}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'white'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '9px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {submitting ? '...' : t('account_modal.add_btn', 'Add New Account')}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '9px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {t('account_modal.cancel', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;
