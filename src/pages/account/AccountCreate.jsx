import React, { useState } from 'react';
import { User, List, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const AccountCreate = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    accountNumber: '',
    contactPerson: '',
    phone: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.balance) {
      toast.error(t("Account Title and Initial Balance are required!"));
      return;
    }

    try {
      setSubmitting(true);
      await accountingService.createAccount({
        name: formData.name,
        account_number: formData.accountNumber,
        balance: formData.balance,
        contact_person: formData.contactPerson,
        phone: formData.phone,
        description: formData.description
      });
      toast.success(t("Account added successfully!"));
      navigate('/account/account-list');
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error(t("Failed to create account. Please check your network and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <PrintHeader />
      
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '0.5px' }}>{t("ADD NEW ACCOUNT")}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/account/account-list')}
              style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              <List size={15} /> {t("Account List")}
            </button>
            <button 
              onClick={() => navigate(-1)}
              style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              <ArrowLeft size={15} /> {t("Go Back")}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 28px' }}>
              
              {/* Field 1: Account Title */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', height: '46px', padding: '0 14px', background: 'white' }}>
                  <User size={16} color="#64748b" />
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', paddingLeft: '12px', fontSize: '14px', color: '#1e293b' }} 
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '6px', fontWeight: '500' }}>
                  {t("Account Title (e.g. Cash, DBBL, Brac Bank) *")}
                </div>
              </div>

              {/* Field 2: Initial Balance */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', height: '46px', padding: '0 14px', background: 'white' }}>
                  <User size={16} color="#64748b" />
                  <input 
                    type="number" 
                    step="0.01" 
                    name="balance" 
                    value={formData.balance} 
                    onChange={handleChange} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', paddingLeft: '12px', fontSize: '14px', color: '#1e293b' }} 
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '6px', fontWeight: '500' }}>
                  {t("Initial Balance *")}
                </div>
              </div>

              {/* Field 3: Account Number */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', height: '46px', padding: '0 14px', background: 'white' }}>
                  <User size={16} color="#64748b" />
                  <input 
                    type="text" 
                    name="accountNumber" 
                    value={formData.accountNumber} 
                    onChange={handleChange} 
                    style={{ flex: 1, border: 'none', outline: 'none', paddingLeft: '12px', fontSize: '14px', color: '#1e293b' }} 
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
                  {t("Account Number")}
                </div>
              </div>

              {/* Field 4: Contact Person */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', height: '46px', padding: '0 14px', background: 'white' }}>
                  <User size={16} color="#64748b" />
                  <input 
                    type="text" 
                    name="contactPerson" 
                    value={formData.contactPerson} 
                    onChange={handleChange} 
                    style={{ flex: 1, border: 'none', outline: 'none', paddingLeft: '12px', fontSize: '14px', color: '#1e293b' }} 
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
                  {t("Contact Person")}
                </div>
              </div>

              {/* Field 5: Phone Number */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', height: '46px', padding: '0 14px', background: 'white' }}>
                  <User size={16} color="#64748b" />
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    style={{ flex: 1, border: 'none', outline: 'none', paddingLeft: '12px', fontSize: '14px', color: '#1e293b' }} 
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
                  {t("Phone Number")}
                </div>
              </div>

            </div>

            {/* Field 6: Description */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>{t("Description")}</div>
              <textarea 
                name="description" 
                placeholder={t("Account Description")} 
                value={formData.description} 
                onChange={handleChange} 
                style={{ 
                  width: '100%', 
                  height: '110px', 
                  border: '1px solid #60a5fa', 
                  borderRadius: '6px', 
                  padding: '12px 14px', 
                  outline: 'none', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }} 
              />
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '28px' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  background: '#10b981', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontSize: '15px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {submitting ? t("Adding Account...") : t("Add Account")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountCreate;
