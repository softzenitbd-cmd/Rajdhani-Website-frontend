import React, { useState, useEffect } from 'react';
import { X, User, Building, Phone, CreditCard, Layers, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { ENDPOINTS } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import SearchableSelect from './SearchableSelect';
import AddOptionModal from './AddOptionModal';

const AddSupplierModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { post, get, loading } = useApi();
  const toast = useToast();

  const [formData, setFormData] = useState({
    supplierName: '',
    address: '',
    phone: '',
    previousDue: '',
    bankAccount: '',
    group: ''
  });

  const [groups, setGroups] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIER_GROUPS);
      setGroups(res?.results || res?.data || res || []);
    } catch (err) {
      console.error("Error fetching supplier groups:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setFormData({
        supplierName: '',
        address: '',
        phone: '',
        previousDue: '',
        bankAccount: '',
        group: ''
      });
    }
  }, [isOpen]);

  const handleAddGroup = async (groupName) => {
    if (!groupName || !groupName.trim()) return;
    try {
      const res = await post(ENDPOINTS.CRM_SUPPLIER_GROUPS, { name: groupName.toUpperCase() }, t("Supplier Group Added"));
      const newGroup = res?.data || res || { id: Date.now(), name: groupName.toUpperCase() };
      setGroups(prev => [...prev, newGroup]);
      setFormData(prev => ({ ...prev, group: newGroup.id || newGroup.uuid }));
      setIsGroupModalOpen(false);
    } catch (err) {
      console.error("Error adding group:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.phone) {
      toast.error(t("Supplier Name and Phone are required"));
      return;
    }

    const payload = {
      name: formData.supplierName,
      company_name: formData.supplierName,
      phone: formData.phone,
      address: formData.address,
      previous_due: formData.previousDue || "0",
      bank_info: formData.bankAccount,
      group: formData.group || null
    };

    try {
      const res = await post(ENDPOINTS.CRM_SUPPLIERS, payload, t("Supplier Added Successfully"));
      if (onSuccess) {
        onSuccess(res?.data || res);
      }
      onClose();
    } catch (err) {
      console.error("Error creating supplier:", err);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    flex: 1,
    padding: '12px 14px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 'var(--fs-14, 14px)',
    color: '#334155'
  };

  const iconStyle = {
    padding: '0 12px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    background: '#f1f5f9',
    borderRight: '1px solid #e2e8f0',
    borderTopLeftRadius: '6px',
    borderBottomLeftRadius: '6px'
  };

  const wrapperStyle = {
    display: 'flex',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    background: 'white'
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', padding: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{t("Add New Supplier")}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            <div style={wrapperStyle}>
              <div style={iconStyle}><User size={18} /></div>
              <input type="text" placeholder={t("Supplier Name")} required style={inputStyle} value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} />
            </div>

            <div style={wrapperStyle}>
              <div style={iconStyle}><Building size={18} /></div>
              <input type="text" placeholder={t("Address")} style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div style={wrapperStyle}>
              <div style={iconStyle}><Phone size={18} /></div>
              <input type="text" placeholder={t("Phone Number")} required style={inputStyle} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div style={wrapperStyle}>
              <div style={iconStyle}><CreditCard size={18} /></div>
              <input type="number" step="0.01" placeholder={t("Previous Due")} style={inputStyle} value={formData.previousDue} onChange={e => setFormData({...formData, previousDue: e.target.value})} />
            </div>

            <div style={wrapperStyle}>
              <div style={iconStyle}><Building size={18} /></div>
              <input type="text" placeholder={t("Bank Account")} style={inputStyle} value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ ...wrapperStyle, flex: 1 }}>
                <div style={iconStyle}><Layers size={18} /></div>
                <div style={{ flex: 1 }}>
                  <SearchableSelect
                    options={groups.map(g => ({ value: g.id || g.uuid, label: g.name }))}
                    value={formData.group}
                    onChange={(val) => setFormData({...formData, group: val})}
                    placeholder={t("Select Supplier Group")}
                    style={{ border: 'none', background: 'transparent' }}
                  />
                </div>
              </div>
              <button type="button" onClick={() => setIsGroupModalOpen(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} />
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{ background: '#10b981', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t("Add Supplier")}
            </button>
            <button type="button" onClick={onClose} style={{ background: '#ef4444', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t("Cancel")}
            </button>
          </div>
        </form>
      </div>

      <AddOptionModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title={t("Add Supplier Group")}
        label={t("Group Name")}
      />
    </div>
  );
};

export default AddSupplierModal;
