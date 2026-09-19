import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, CreditCard, Users, Plus, X, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';

const ClientCreateModal = ({ isOpen, onClose, onClientAdded }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { get, post, loading } = useApi();

  const [formData, setFormData] = useState({
    clientName: '',
    address: '',
    phone: '',
    phoneOptional: '',
    previousDue: '',
    group: ''
  });
  
  const [groups, setGroups] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setFormData({
        clientName: '',
        address: '',
        phone: '',
        phoneOptional: '',
        previousDue: '',
        group: ''
      });
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENT_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error('Error fetching client groups:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.clientName?.trim() || !formData.phone?.trim() || !formData.group) {
      toast.error(t("Please fill in required fields: Client Name, Phone, and Group."));
      return;
    }
    
    // API Body format: { name, phone, address, previous_due, group }
    const payload = {
      name: formData.clientName.trim(),
      phone: formData.phone.trim(),
      address: formData.address?.trim() || "",
      previous_due: formData.previousDue || "0.00",
      group: formData.group
    };
    
    try {
      const createdClient = await post(ENDPOINTS.CRM_CLIENTS, payload, t("Client Added Successfully!"));
      if (onClientAdded) {
        onClientAdded(createdClient);
      }
      onClose();
    } catch (err) {
      console.error("Failed to add client", err);
    }
  };

  const handleAddGroup = async (e) => {
    if (e) e.preventDefault();
    if (!newGroupName || !newGroupName.trim()) return;
    const trimmed = newGroupName.trim();
    setAddingGroup(true);
    try {
      const created = await post(ENDPOINTS.CRM_CLIENT_GROUPS, { name: trimmed }, t("Client Group Added"));
      setIsGroupModalOpen(false);
      setNewGroupName('');
      await fetchGroups();
      if (created?.id || created?.uuid) {
        setFormData(prev => ({ ...prev, group: created.id || created.uuid }));
      }
    } catch (err) {
      console.error("Error creating client group via API:", err);
    } finally {
      setAddingGroup(false);
    }
  };

  if (!isOpen) return null;

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
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '680px',
          maxWidth: '100%',
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            
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
                  name="clientName"
                  placeholder={t("Enter client name")}
                  value={formData.clientName}
                  onChange={handleChange}
                  required
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
                  placeholder={t("e.g. 01711000000")}
                  value={formData.phone}
                  onChange={handleChange}
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
                  name="phoneOptional"
                  placeholder={t("e.g. 01811000000")}
                  value={formData.phoneOptional}
                  onChange={handleChange}
                  style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                />
              </div>
            </div>

            {/* Client Group */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                {t("Client Group")} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', overflow: 'hidden' }}>
                <div style={{ padding: '0 12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                  <Users size={16} />
                </div>
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  required
                  style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', cursor: 'pointer' }}
                >
                  <option value="">{t("Select Group")}</option>
                  {groups.map(g => (
                    <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>
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
                  name="previousDue"
                  placeholder="0.00"
                  value={formData.previousDue}
                  onChange={handleChange}
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
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  name="address"
                  placeholder={t("Enter address / city")}
                  value={formData.address}
                  onChange={handleChange}
                  style={{ flex: 1, height: '40px', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', paddingRight: '12px' }}
                />
              </div>
            </div>

          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
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
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#059669',
                color: 'white',
                fontWeight: '600',
                fontSize: 'var(--fs-13, 13px)',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? t("Adding...") : t("Add Client")}
            </button>
          </div>
        </form>

        {/* Group Add Modal (Nested) */}
        {isGroupModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px'
            }}
            onClick={() => setIsGroupModalOpen(false)}
          >
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '10px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                width: '380px',
                maxWidth: '90vw'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold', color: '#1e293b' }}>
                  {t("Add Client Group")}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t("Group Name")}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  marginBottom: '18px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontSize: 'var(--fs-13, 13px)'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontSize: 'var(--fs-13, 13px)',
                    cursor: 'pointer'
                  }}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  disabled={addingGroup}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: 'var(--fs-13, 13px)',
                    cursor: addingGroup ? 'not-allowed' : 'pointer'
                  }}
                >
                  {addingGroup ? t("Adding...") : t("Add Group")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCreateModal;
