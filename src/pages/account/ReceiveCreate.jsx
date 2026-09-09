import React, { useState, useEffect } from 'react';
import { Settings, List, Layers, Play, Plus, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';

const ReceiveCreate = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    accountId: '',
    sms: false
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes, clientRes] = await Promise.all([
        accountingService.getAccounts().catch(() => []),
        accountingService.getIncomeCategories().catch(() => []),
        crmService.getClients().catch(() => [])
      ]);

      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      const catData = Array.isArray(catRes) ? catRes : (catRes?.results || []);
      const clientData = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);

      setAccounts(accData.length > 0 ? accData : [
        { id: '1', name: 'TOTAL BALENCE', balance: '25000.00' }
      ]);

      setCategories(catData.length > 0 ? catData : [
        { id: '1', name: 'CASH SELL' }
      ]);

      setClients(clientData.length > 0 ? clientData : [
        { id: '1', name: 'RANIG CUSTOMER 2024', due: 0 }
      ]);
    } catch (err) {
      console.error('Failed to load prerequisites:', err);
    }
  };

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const clearField = (field) => {
    setFormData({ ...formData, [field]: '' });
  };

  const selectedClient = (clients || []).find(c => String(c.id) === String(formData.clientId));
  const dueAmount = selectedClient ? (selectedClient.due || selectedClient.due_amount || 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.amount) {
      alert("Please enter an amount and select an account.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: "deposit",
        account: formData.accountId,
        amount: String(formData.amount),
        date: formData.date
      };

      if (formData.clientId) payload.client = formData.clientId;
      if (formData.category) payload.category = formData.category;
      if (formData.description) payload.reference = formData.description;

      await accountingService.createReceive(payload);
      alert("Receive recorded successfully!");
      navigate('/account/receive-list');
    } catch (error) {
      console.error("Error creating receive:", error);
      const errorDetail = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
      alert(`Failed to submit receive:\n${errorDetail}`);
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

          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Add New Receive</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}><Settings size={16} /></button>
            <button onClick={() => navigate('/account/receive-list')} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <List size={14} /> Receive List
            </button>
            <button onClick={() => navigate('/settings/income-category')} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <Layers size={14} /> Receive Category
            </button>
            <button style={{ background: 'white', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
              <Play size={16} fill="#ef4444" /> YouTube
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '30px 40px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Client Select */}
                <div>
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
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '6px', marginLeft: '4px' }}>Due: {dueAmount}</div>
                </div>

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
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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
                  <div style={{ padding: '0 16px', fontWeight: 'bold', color: '#1e293b' }}>$</div>
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

                {/* SMS Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #93c5fd', borderRadius: '6px', padding: '12px 16px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                    <div style={{ background: '#1e293b', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '10px' }}>💬</span>
                    </div>
                    SMS
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                    <input type="checkbox" name="sms" checked={formData.sms} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.sms ? '#3b82f6' : '#cbd5e1', borderRadius: '34px', transition: '.4s' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: formData.sms ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
                    </span>
                  </label>
                </div>

              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
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

                {/* Description Input */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}><FileText size={18} color="#1e293b" /></div>
                  <input 
                    type="text" 
                    name="description" 
                    placeholder="Receive Description in a short note" 
                    value={formData.description} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                {/* Category Select */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formData.category && (
                    <button type="button" onClick={() => clearField('category')} style={{ background: 'white', border: 'none', borderLeft: '1px solid #93c5fd', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => navigate('/settings/income-category')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
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
                {submitting ? 'Adding...' : 'Add New Receive'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/account/receive-list')} 
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

export default ReceiveCreate;
