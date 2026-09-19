import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, CreditCard, Users, Plus, X } from 'lucide-react';
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
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.phone || !formData.group) {
      toast.error(t("Please fill in required fields: Client Name, Phone, and Group."));
      return;
    }
    
    // API Body format: { name, phone, address, previous_due, group }
    const payload = {
      name: formData.clientName,
      phone: formData.phone,
      address: formData.address || "",
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

  const handleAddGroup = async () => {
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '8px', width: '700px', maxWidth: '95vw', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold' }}>{t("Add New Client")}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            
            {/* Row 1 */}
            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #93c5fd' }}>
                <User size={16} color="#475569" />
              </div>
              <input 
                type="text" 
                name="clientName"
                placeholder={t("Client Name")} 
                value={formData.clientName}
                onChange={handleChange}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
              />
            </div>

            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #93c5fd' }}>
                <MapPin size={16} color="#475569" />
              </div>
              <input 
                type="text" 
                name="address"
                placeholder={t("Address")} 
                value={formData.address}
                onChange={handleChange}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
              />
            </div>

            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #93c5fd' }}>
                <Phone size={16} color="#475569" />
              </div>
              <input 
                type="text" 
                name="phone"
                placeholder={t("Phone")} 
                value={formData.phone}
                onChange={handleChange}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
              />
            </div>

            {/* Row 2 */}
            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #93c5fd' }}>
                <Phone size={16} color="#475569" />
              </div>
              <input 
                type="text" 
                name="phoneOptional"
                placeholder={t("Phone (Optional)")} 
                value={formData.phoneOptional}
                onChange={handleChange}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
              />
            </div>

            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #93c5fd' }}>
                <CreditCard size={16} color="#475569" />
              </div>
              <input 
                type="number" 
                name="previousDue"
                placeholder={t("Previous Due")} 
                value={formData.previousDue}
                onChange={handleChange}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
              />
            </div>

            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              <select 
                name="group"
                value={formData.group}
                onChange={handleChange}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 'var(--fs-13, 13px)', appearance: 'none', background: 'transparent' }}
              >
                <option value="">{t("Select Group")}</option>
                {groups.map(g => (
                  <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsGroupModalOpen(true)}
                style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={16} />
              </button>
            </div>

          </div>

          {/* Group Add Modal (Nested) */}
          {isGroupModalOpen && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 1010, width: '350px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-14, 14px)' }}>{t("Add Client Group")}</h4>
              <input 
                type="text" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t("Group Name")}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleAddGroup}
                  disabled={addingGroup}
                  style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: addingGroup ? 'not-allowed' : 'pointer' }}
                >
                  {addingGroup ? t("Adding...") : t("Add Group")}
                </button>
                <button 
                  onClick={() => setIsGroupModalOpen(false)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {t("Cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '30px' }}>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '4px', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? t("Adding...") : t("Client Add")}
            </button>
            <button 
              onClick={onClose}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '4px', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)', cursor: 'pointer' }}
            >
              {t("Cancel")}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ClientCreateModal;
