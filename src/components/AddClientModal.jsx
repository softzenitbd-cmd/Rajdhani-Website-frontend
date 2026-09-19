import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, User, Building, Phone, CreditCard, Mail, Users, UserPlus } from 'lucide-react';
import { crmService } from '../services/crmService';
import { loanService } from '../services/loanService';
import { useToast } from '../context/ToastContext';

/**
 * Sleek Centered Nested Popup Modal for Client Group creation
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
      toast.error(t("Please enter {{v0}}", { v0: label ? label.toLowerCase() : t("a value") }));
      return;
    }
    try {
      setSaving(true);
      await onSave(val.trim());
    } catch (err) {
      toast.error(err?.message || t("Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10050,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '420px',
          maxWidth: '92vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} />
            </div>
            <h4 style={{ margin: 0, fontSize: 'var(--fs-15, 15px)', fontWeight: '700', color: '#1e293b' }}>
              {title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#64748b', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              {label} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={t("Enter group name")}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none',
                fontSize: 'var(--fs-13, 13px)',
                color: '#1e293b',
                background: '#f8fafc',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'white',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '8px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: 'var(--fs-13, 13px)',
                cursor: 'pointer'
              }}
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '8px 22px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: 'var(--fs-13, 13px)',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              {saving ? t("Saving...") : t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Modern Add New Client Modal Component:
 * - Clean 2-column responsive layout
 * - Dedicated labels with icons
 * - Instant Client Group creation
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
      toast.success(t("Client Group created successfully!"));
    } catch (err) {
      toast.error(err?.message || t("Failed to create client group"));
    } finally {
      setIsGroupModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error(t("Please enter client name"));
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error(t("Please enter phone number"));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        fathers_name: formData.fathers_name || '',
        company_name: formData.company_name || '',
        address: formData.address || '',
        phone: formData.phone.trim(),
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
      toast.success(t("Client Added Successfully!"));

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
      toast.error(err?.message || t("Failed to create client via API."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
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
            borderRadius: '12px',
            width: '740px',
            maxWidth: '96vw',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UserPlus size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: '700', color: '#1e293b' }}>
                  {t("Add New Client")}
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>
                  {t("Create a new client profile with contact and due information")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px 20px',
                marginBottom: '24px'
              }}
            >
              {/* Client Name */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Client Name")} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("Enter client name")}
                    required
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

              {/* Company / Shop Name */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Company / Shop Name")}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Building size={16} />
                  </div>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder={t("Enter company or shop name")}
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Phone Number")} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("e.g. 01711000000")}
                    required
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

              {/* Alternative Phone */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Alternative Phone (Optional)")}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    name="secondary_phone"
                    value={formData.secondary_phone}
                    onChange={handleChange}
                    placeholder={t("e.g. 01811000000")}
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

              {/* Client Group */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Client Group")}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Users size={16} />
                  </div>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', cursor: 'pointer' }}
                  >
                    <option value="">{t("Select Group")}</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(true)}
                    title={t("Add New Group")}
                    style={{
                      height: '40px',
                      padding: '0 14px',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Previous Due */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Previous Due")}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <CreditCard size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="previous_due"
                    value={formData.previous_due}
                    onChange={handleChange}
                    placeholder="0.00"
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("Address")}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Building size={16} />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t("Enter address / city")}
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  {t("E-mail")}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("Enter email address")}
                    style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                  />
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: 'var(--fs-13, 13px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '9px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#059669',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 'var(--fs-13, 13px)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                {saving ? t("Adding...") : t("Add Client")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CenteredNestedPopup
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title={t("Add New Client Group")}
        label={t("Group Name")}
      />
    </>
  );
};

export default AddClientModal;
