import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Hash, Users, Plus, List } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import AddOptionModal from '../../../components/AddOptionModal';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { useTranslation } from 'react-i18next';

const SupplierEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: '',
    address: '',
    phone: '',
    phoneOptional: '',
    previousDue: '',
    reference: '',
    group: '',
    bank_info: ''
  });
  const [groups, setGroups] = useState([]);
  const { get, patch, post, loading } = useApi();

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIER_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupplier = async () => {
    try {
      const res = await get(`${ENDPOINTS.CRM_SUPPLIERS}${id}/`);
      const supplier = res.data || res;
      setFormData({
        supplierName: supplier.name || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        phoneOptional: supplier.phoneOptional || '',
        previousDue: supplier.previous_due || '',
        reference: supplier.reference || '',
        group: supplier.group?.id || supplier.group || '',
        bank_info: supplier.bank_info || ''
      });
    } catch (err) {
      console.error("Failed to fetch supplier", err);
    }
  };

  useEffect(() => {
    fetchGroups();
    if (id) fetchSupplier();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.phone || !formData.group) {
      toast.error(t("Please fill in required fields: Supplier Name, Phone, and Group."));
      return;
    }
    
    const payload = {
      name: formData.supplierName,
      phone: formData.phone,
      address: formData.address || "",
      previous_due: formData.previousDue || "0.00",
      group: formData.group,
      bank_info: formData.bank_info || ""
    };
    
    try {
      await patch(`${ENDPOINTS.CRM_SUPPLIERS}${id}/`, payload, t("Supplier Updated Successfully!"));
      navigate('/crm/supplier-list');
    } catch (err) {
      console.error("Failed to update supplier", err);
    }
  };

  const handleAddGroup = async (groupName) => {
    if (!groupName || !groupName.trim()) return;
    try {
      await post(ENDPOINTS.CRM_SUPPLIER_GROUPS, { name: groupName.toUpperCase() }, t("Supplier Group Added"));
      setIsGroupModalOpen(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content" style={{ padding: '24px' }}>
      <div className="chart-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Header */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: '800', color: '#1e293b', margin: 0, textTransform: 'uppercase' }}>{t("SUPPLIER EDIT")}</h2>
          <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={() => navigate('/crm/supplier-list')} style={{ padding: '6px 12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <List size={14} /> {t("Supplier List")}
            </button>
            <button className="btn btn-outline" style={{ padding: '6px 12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsGroupModalOpen(true)}>
              <Users size={14} /> {t("Supplier Group")}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              
              {/* Row 1 */}
              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <User size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.supplierName} onChange={(e) => setFormData({...formData, supplierName: e.target.value})} required />
                  <label>{t("Supplier Name")}</label>
                </div>
              </div>
              
              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <MapPin size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <label>{t("Address")}</label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Phone size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                  <label>{t("Phone Number")}</label>
                </div>
              </div>

              {/* Row 2 */}
              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Phone size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.phoneOptional} onChange={(e) => setFormData({...formData, phoneOptional: e.target.value})} />
                  <label>{t("Phone Optional")}</label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Hash size={18} className="input-icon" />
                  <input type="number" placeholder=" " value={formData.previousDue} onChange={(e) => setFormData({...formData, previousDue: e.target.value})} />
                  <label>{t("Previous Due")}</label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Users size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} />
                  <label>{t("Reference")}</label>
                </div>
              </div>

            {/* Row 3 */}
            <div className="form-group" style={{ gridColumn: 'span 1' }}>
              <div className="input-group">
                <div className="form-input floating-label">
                  <select name="group" value={formData.group} onChange={(e) => setFormData({...formData, group: e.target.value})} required>
                    <option value="" disabled hidden></option>
                    {groups.map(group => (
                      <option key={group.id || group.uuid} value={group.id || group.uuid}>{group.name}</option>
                    ))}
                  </select>
                  <label>{t("Select supplier group")}</label>
                </div>
                <button type="button" className="btn-icon add-btn" onClick={() => setIsGroupModalOpen(true)}>
                  <Plus size={20} />
                </button>
              </div>
            </div>

            </div>

            <div style={{ marginTop: '24px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
                🏛️ {t("Bank Account Info")}
              </label>
              <textarea 
                className="input-outline" 
                name="bank_info" 
                value={formData.bank_info} 
                onChange={(e) => setFormData({...formData, bank_info: e.target.value})} 
                rows="4"
                placeholder={`Bank Name:\nAccount Number:\nAccount Description:`}
                style={{ width: '100%', resize: 'vertical', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button type="button" className="btn btn-outline" style={{ padding: '10px 24px' }} onClick={() => navigate(-1)}>
                {t("Cancel")}
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 32px' }} disabled={loading}>
                {loading ? t("Updating...") : t("Update Supplier")}
              </button>
            </div>
          </form>
        </div>
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

export default SupplierEdit;
