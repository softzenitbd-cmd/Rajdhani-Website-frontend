import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Hash, Users, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import AddOptionModal from '../../components/AddOptionModal';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../api/endpoints';
import { loanService } from '../../services/loanService';
import { useTranslation } from 'react-i18next';
import SearchableSelect from '../../components/SearchableSelect';

const LoanClientCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    fathersName: '',
    companyName: '',
    address: '',
    phone: '',
    phoneOptional: '',
    email: '',
    previousDue: '',
    reference: '',
    group: ''
  });
  const [groups, setGroups] = useState([]);
  const { get, post, loading } = useApi();

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENT_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.phone) {
      toast.error(t("Please fill in required fields: Client Name and Phone."));
      return;
    }
    
    try {
      await loanService.createLoanAccount({
        name: formData.clientName,
        phone: formData.phone,
        address: formData.address || '',
        previous_due: formData.previousDue || '0.00',
        max_due_limit: '0.00', // added back
        // Pass extra fields if the backend supports them
        fathers_name: formData.fathersName || "",
        company_name: formData.companyName || "",
        phone_optional: formData.phoneOptional || "",
        email: formData.email || "",
        reference: formData.reference || "",
        group: formData.group || ""
      });
      toast.success(t("Loan Account created successfully!"));
      navigate('/loan/client-list');
    } catch (err) {
      console.error("Failed to add loan client", err);
      toast.error(t("Failed to create loan account."));
    }
  };

  const handleAddGroup = async (groupName) => {
    if (!groupName || !groupName.trim()) return;
    const trimmed = groupName.trim();
    try {
      const created = await post(ENDPOINTS.CRM_CLIENT_GROUPS, { name: trimmed }, t("Client Group Added"));
      setIsGroupModalOpen(false);
      await fetchGroups();
      if (created?.id) {
        setFormData(prev => ({ ...prev, group: created.id }));
      }
    } catch (err) {
      // useApi.post already showed the error toast; keep the modal open so the user can retry
      console.error("Error creating client group via API:", err);
      throw err;
    }
  };

  return (
    <div className="dashboard-content" style={{ padding: '24px' }}>
      <div className="chart-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Header */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: 0, textTransform: 'uppercase' }}>{t("ADD NEW LOAN ACCOUNT")}</h2>
          <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/loan/client-list')} style={{ padding: '6px 12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <List size={14} /> {t("Account List")}
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsGroupModalOpen(true)}>
              <Users size={14} /> {t("Client Group")}
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
                  <input type="text" placeholder=" " value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} required />
                  <label>{t("Client Name")}</label>
                </div>
              </div>
              
              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <User size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.fathersName} onChange={(e) => setFormData({...formData, fathersName: e.target.value})} />
                  <label>{t("Father's Name")}</label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <User size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
                  <label>{t("Company Name")}</label>
                </div>
              </div>

              {/* Row 2 */}
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

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Phone size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.phoneOptional} onChange={(e) => setFormData({...formData, phoneOptional: e.target.value})} />
                  <label>{t("Phone Optional")}</label>
                </div>
              </div>

              {/* Row 3 */}
              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Hash size={18} className="input-icon" />
                  <input type="number" placeholder=" " value={formData.previousDue} onChange={(e) => setFormData({...formData, previousDue: e.target.value})} />
                  <label>{t("Previous Due")}</label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <User size={18} className="input-icon" />
                  <input type="email" placeholder=" " value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <label>{t("E-mail")}</label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-input floating-label" style={{ background: 'white' }}>
                  <Users size={18} className="input-icon" />
                  <input type="text" placeholder=" " value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} />
                  <label>{t("Reference")}</label>
                </div>
              </div>

            {/* Row 4 */}
            <div className="form-group" style={{ gridColumn: 'span 1' }}>
              <SearchableSelect
                options={groups.map(group => ({ value: group.id || group.uuid, label: group.name, searchValue: group.name }))}
                value={formData.group}
                onChange={(val) => setFormData({...formData, group: val})}
                placeholder={t("Select client group")}
                onAddClick={() => setIsGroupModalOpen(true)}
              />
            </div>

            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '24px' }}>
              <button 
                type="submit" 
                style={{ 
                  background: '#10b981', 
                  color: 'white', 
                  width: '100%', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {t("Client Add")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title={t("Add New Client Group")}
        label={t("Group Name")}
      />
    </div>
  );
};

export default LoanClientCreate;
