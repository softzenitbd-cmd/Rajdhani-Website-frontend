import React, { useState, useEffect } from 'react';
import { List, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddOptionModal from '../../../components/AddOptionModal';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { useToast } from '../../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const SupplierCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  
  const [formData, setFormData] = useState({
    supplierName: '',
    companyName: '',
    phone: '',
    previousDue: '',
    address: '',
    domain: '',
    group: '',
    bankInfo: 'Bank Name:\nAccount Number:\nAccount Description:'
  });

  const { get, post, loading } = useApi();

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIER_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.phone || !formData.group) {
      toast.error(t("Please fill in required fields: Supplier Name, Phone, and Group."));
      return;
    }
    
    const payload = {
      name: formData.supplierName,
      company_name: formData.companyName,
      phone: formData.phone,
      address: formData.address || "",
      domain: formData.domain || "",
      previous_due: formData.previousDue || "0.00",
      group: formData.group,
      bank_info: formData.bankInfo
    };
    
    try {
      await post(ENDPOINTS.CRM_SUPPLIERS, payload, t("Supplier Added Successfully!"));
      navigate('/crm/supplier-list');
    } catch (err) {
      console.error("Failed to add supplier", err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">{t("SUPPLIER CREATE")}</h2>
        <div className="card-actions">
          <button className="btn btn-outline" style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }} onClick={() => navigate('/crm/supplier-list')}>
            <List size={14} /> {t("Supplier List")}
          </button>
          <button className="btn btn-outline" style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }} onClick={() => navigate('/crm/supplier-group')}>
            <Users size={14} /> {t("Supplier Group")}
          </button>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <div className="form-input floating-label">
                <div className="input-icon">👤</div>
                <input type="text" placeholder=" " name="supplierName" value={formData.supplierName} onChange={handleInputChange} />
                <label>{t("Supplier Name")}</label>
              </div>
            </div>
            
            <div className="form-group">
              <div className="form-input floating-label">
                <div className="input-icon">🏢</div>
                <input type="text" placeholder=" " name="companyName" value={formData.companyName} onChange={handleInputChange} />
                <label>{t("Company Name")}</label>
              </div>
            </div>

            <div className="form-group">
              <div className="form-input floating-label">
                <div className="input-icon">📱</div>
                <input type="text" placeholder=" " name="phone" value={formData.phone} onChange={handleInputChange} />
                <label>{t("Phone")}</label>
              </div>
            </div>

            <div className="form-group">
              <div className="form-input floating-label">
                <div className="input-icon">💳</div>
                <input type="text" placeholder=" " name="previousDue" value={formData.previousDue} onChange={handleInputChange} />
                <label>{t("Previous Due")}</label>
              </div>
            </div>

            <div className="form-group">
              <div className="form-input floating-label">
                <div className="input-icon">🏢</div>
                <input type="text" placeholder=" " name="address" value={formData.address} onChange={handleInputChange} />
                <label>{t("Address")}</label>
              </div>
            </div>

            <div className="form-group">
              <div className="form-input floating-label">
                <div className="input-icon">🌐</div>
                <input type="text" placeholder=" " name="domain" value={formData.domain} onChange={handleInputChange} />
                <label>{t("Domain")}</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                <div className="form-input floating-label">
                  <select name="group" value={formData.group} onChange={handleInputChange}>
                    <option value="" disabled hidden></option>
                    <option value="test">{t("Select a group")}</option>
                    {groups.map(group => (
                      <option key={group.id || group.uuid} value={group.id || group.uuid}>{group.name}</option>
                    ))}
                  </select>
                  <label>{t("Select a group")}</label>
                </div>
                <button type="button" className="btn-append" onClick={() => setIsGroupModalOpen(true)}>
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
              <span style={{ marginRight: '8px' }}>🏦</span> {t("Bank Account info")}
            </div>
            <textarea 
              name="bankInfo"
              value={formData.bankInfo}
              onChange={handleInputChange}
              className="form-input floating-label" 
              style={{ height: '120px', padding: '12px', resize: 'vertical' }}
            ></textarea>
          </div>

          <button type="submit" className="btn-success">
            {t("Add Supplier")}
          </button>
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

export default SupplierCreate;
