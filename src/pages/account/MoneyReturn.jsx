import React, { useState, useEffect } from 'react';
import { List, Layers, Plus, X, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';

const MoneyReturn = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    accountId: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes, clientRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getExpenseCategories(),
        crmService.getClients()
      ]);

      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      const catData = Array.isArray(catRes) ? catRes : (catRes?.results || []);
      const clientData = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);

      setAccounts(accData);

      setCategories(catData);

      setClients(clientData);
    } catch (err) {
      toast.error(err?.message || 'Failed to load form data');
    }
  };

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearField = (field) => {
    setFormData({ ...formData, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.amount) {
      alert("Please select an Account and enter an Amount.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: "cost",
        transaction_type: "Money Return",
        account: formData.accountId,
        amount: String(formData.amount),
        date: formData.date
      };

      if (formData.clientId) payload.client = formData.clientId;
      if (formData.categoryId) payload.category = formData.categoryId;
      if (formData.description) payload.reference = formData.description;

      await accountingService.createExpense(payload);
      alert("Money Return recorded successfully!");
      navigate('/account/expense-list');
    } catch (error) {
      console.error("Error submitting money return:", error);
      const errorDetail = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
      alert(`Failed to submit Money Return:\n${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: '#f1f5f9', minHeight: '100vh', padding: '24px' }}>
      <PrintHeader />
      
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderBottom: '6px solid #2e7d32' }}>
        {/* Header */}
        <div style={{ background: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Money Return</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/crm/client-list')} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <List size={14} /> Client List
            </button>
            <button onClick={() => navigate('/crm/client-groups')} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <Layers size={14} /> Client Group
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '30px 40px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Date Input */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📅 Date
                  </div>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '14px', outline: 'none' }} 
                  />
                </div>

                {/* Client Select */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
                  <select 
                    name="clientId" 
                    value={formData.clientId} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}
                  >
                    <option value="">Select Client</option>
                    {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name || c.company_name}</option>)}
                  </select>
                  {formData.clientId && (
                    <button type="button" onClick={() => clearField('clientId')} style={{ background: 'white', border: 'none', borderLeft: '1px solid #93c5fd', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => setIsClientModalOpen(true)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>

                {/* Category Select */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
                  <select 
                    name="categoryId" 
                    value={formData.categoryId} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}
                  >
                    <option value="">Select Category</option>
                    {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formData.categoryId && (
                    <button type="button" onClick={() => clearField('categoryId')} style={{ background: 'white', border: 'none', borderLeft: '1px solid #93c5fd', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => navigate('/settings/expense-category')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>

              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Account Select */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
                  <select 
                    name="accountId" 
                    value={formData.accountId} 
                    onChange={handleChange}
                    required
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}
                  >
                    <option value="">Select Account</option>
                    {(accounts || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {formData.accountId && (
                    <button type="button" onClick={() => clearField('accountId')} style={{ background: 'white', border: 'none', borderLeft: '1px solid #93c5fd', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => navigate('/account/account-create')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>

                {/* Amount Input */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center' }}>
                    <User size={18} color="#1e293b" />
                  </div>
                  <input 
                    type="number" 
                    name="amount" 
                    placeholder="Amount" 
                    value={formData.amount} 
                    onChange={handleChange}
                    required
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                {/* Description Input */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center' }}>
                    <FileText size={18} color="#1e293b" />
                  </div>
                  <input 
                    type="text" 
                    name="description" 
                    placeholder="Expense Description in a short note" 
                    value={formData.description} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px' }}
                  />
                </div>

              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {submitting ? 'Adding...' : 'Add New'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/account/expense-list')} 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Quick Add Client"
        placeholder="Client Name"
        onSave={() => {
          setIsClientModalOpen(false);
        }}
      />
    </div>
  );
};

export default MoneyReturn;
