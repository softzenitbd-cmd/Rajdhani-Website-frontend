import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, User, Building, Phone, Smartphone, CreditCard } from 'lucide-react';
import { crmService } from '../services/crmService';
import { loanService } from '../services/loanService';
import { useToast } from '../context/ToastContext';

/**
 * Centered Nested Popup Modal for Client Group creation (Modal on top of Modal)
 */
const CenteredNestedPopup = ({ isOpen, onClose, onSave, title, label }) => {
  const { t } = useTranslation();
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) setVal('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!val.trim()) {
      toast.error(`Please enter ${label ? label.toLowerCase() : 'a value'}`);
      return;
    }
    try {
      setSaving(true);
      await onSave(val.trim());
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
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
      zIndex: 10050,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '460px',
        maxWidth: '92vw',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold', color: '#1e293b' }}>
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} style={{ padding: '24px 20px' }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <label style={{
              position: 'absolute',
              top: '-11px',
              left: '12px',
              background: '#0ea5e9',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: 'var(--fs-11, 11px)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 1
            }}>
              🎓 {label}
            </label>
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={`${label}...`}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px 10px 16px',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                outline: 'none',
                fontSize: 'var(--fs-13, 13px)',
                background: 'white'
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 'var(--fs-13, 13px)',
                cursor: 'pointer'
              }}
            >
              {saving ? '...' : t('client_modal.save', 'Save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 'var(--fs-13, 13px)',
                cursor: 'pointer'
              }}
            >
              {t('client_modal.cancel', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Add New Client Modal Component matching user screenshot:
 * - 6 fields (3 columns x 2 rows)
 * - Pill badges with icons
 * - Client Group selection with nested creation popup
 * - Connected to crmService API
 */
const AddClientModal = ({ isOpen, onClose, onSuccess, isLoan = false }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    fathers_name: '',
    company_name: '',
    address: '',
    phone: '',
    secondary_phone: '',
    previous_due: '',
    email: '',
    group: ''
  });

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const res = await crmService.getClientGroups().catch(() => []);
      const groupList = Array.isArray(res) ? res : (res?.results || []);
      setGroups(groupList);
    } catch (err) {
      console.error("Failed to load client groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPrerequisites();
      setFormData({
        name: '',
        fathers_name: '',
        company_name: '',
        address: '',
        phone: '',
        secondary_phone: '',
        previous_due: '',
        email: '',
        group: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddGroup = async (name) => {
    if (!name?.trim()) return;
    try {
      const res = await crmService.createClientGroup({ name: name.trim() });
      const newGroup = { ...(res && typeof res === 'object' ? res : {}), id: res?.id || res?.uuid, name: res?.name || name.trim() };
      setGroups((prev) => [...prev, newGroup]);
      setFormData((prev) => ({ ...prev, group: newGroup.id }));
      toast.success(t("client_modal.group_created", "Client Group created successfully!"));
    } catch (err) {
      toast.error(err?.message || "Failed to create client group");
    } finally {
      setIsGroupModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error(t("client_modal.name_required", "Please enter a client name"));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        fathers_name: formData.fathers_name || '',
        company_name: formData.company_name || '',
        address: formData.address || '',
        phone: formData.phone || '',
        phone_optional: formData.secondary_phone || '',
        email: formData.email || '',
        previous_due: formData.previous_due ? Number(formData.previous_due).toFixed(2) : '0.00',
        due: formData.previous_due ? Number(formData.previous_due).toFixed(2) : '0.00',
        group: formData.group || null
      };

      let created;
      if (isLoan) {
        created = await loanService.createLoanAccount(payload);
      } else {
        created = await crmService.createClient(payload);
      }
      toast.success(t("client_modal.created_success", "Client added successfully!"));

      const newClient = {
        ...created,
        id: created?.id || created?.uuid || `client-${Date.now()}`,
        name: created?.name || formData.name.trim(),
        phone: created?.phone || formData.phone || '',
        due: Number(created?.due || created?.previous_due || formData.previous_due || 0)
      };

      if (onSuccess) onSuccess(newClient);
      onClose();
    } catch (err) {
      console.error("Error creating client:", err);
      toast.error(err?.message || "Failed to create client via API.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
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
          width: '900px',
          maxWidth: '95vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', color: '#1e293b' }}>
              {t('client_modal.add_new_client', 'Add New Client')}
            </h3>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '24px 20px',
              marginBottom: '32px'
            }}>
              {/* Row 1 */}
              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <User size={11} /> {t('client_modal.client_name', 'Client Name')}
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <User size={11} /> {t('client_modal.fathers_name', "Father's Name")}
                </label>
                <input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <Building size={11} /> {t('client_modal.company_name', 'Company Name')}
                </label>
                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              {/* Row 2 */}
              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <Building size={11} /> {t('client_modal.address', 'Address')}
                </label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <User size={11} /> {t('client_modal.phone', 'Phone')}
                </label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <Smartphone size={11} /> {t('client_modal.phone_optional', 'Phone (Optional)')}
                </label>
                <input type="text" name="secondary_phone" value={formData.secondary_phone} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              {/* Row 3 */}
              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <CreditCard size={11} /> {t('client_modal.previous_due', 'Previous Due')}
                </label>
                <input type="number" step="0.01" name="previous_due" value={formData.previous_due} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-11px', left: '12px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> {t('client_modal.email', 'E-mail')}
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 10px 16px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <div style={{ display: 'flex', border: '1px solid #38bdf8', borderRadius: '8px', overflow: 'hidden' }}>
                <select name="group" value={formData.group} onChange={handleChange} style={{ flex: 1, padding: '12px 14px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)', background: 'white', color: '#0f172a' }}>
                  <option value="">{t('client_modal.select_group', 'Select Group')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsGroupModalOpen(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="submit" disabled={saving} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)', cursor: 'pointer' }}>
                {saving ? '...' : t('client_modal.client_add', 'Client Add')}
              </button>
              <button type="button" onClick={onClose} disabled={saving} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)', cursor: 'pointer' }}>
                {t('client_modal.cancel', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CenteredNestedPopup
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title={t('client_modal.create_group_title', 'Add New Client Group')}
        label={t('client_modal.group_name', 'Group Name')}
      />
    </>
  );
};

export default AddClientModal;
