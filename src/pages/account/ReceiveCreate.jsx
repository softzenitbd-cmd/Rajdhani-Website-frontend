import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, List, Layers, Play, X, Plus, Calendar, BookOpen, DollarSign, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import { accountingService } from '../../services/accountingService';

const ReceiveCreate = () => {
  const { t } = useTranslation();
  const { state } = useAppContext();
  const { clients } = state;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    accountId: '',
    transactionType: 'Invoice'
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoadingInitial(true);
      const [accRes, catRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getIncomeCategories()
      ]);

      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      const catData = Array.isArray(catRes) ? catRes : (catRes?.results || []);

      setAccounts(accData.length > 0 ? accData : [
        { id: '1', name: 'Cash Account', balance: '25000.00' },
        { id: '2', name: 'Dutch Bangla Bank (DBBL)', balance: '185000.00' },
        { id: '3', name: 'Islami Bank Bangladesh', balance: '94000.00' },
      ]);

      setCategories(catData.length > 0 ? catData : [
        { id: '1', name: 'CASH SELL' },
        { id: '2', name: 'TAGADA' },
        { id: '3', name: 'BAKI ADAY' },
        { id: '4', name: 'HALKHATA' },
      ]);
    } catch (err) {
      console.error('Failed to load accounts/categories:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectedClient = clients.find(c => String(c.id) === String(formData.clientId));
  const dueAmount = selectedClient ? selectedClient.due : 0;
  const selectedAccount = accounts.find(a => String(a.id) === String(formData.accountId));

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
        transaction_type: formData.transactionType || "Invoice",
        client: formData.clientId || null,
        account: formData.accountId,
        category: formData.category || null,
        amount: String(formData.amount),
        reference: formData.description || "Customer Deposit",
        date: formData.date,
        status: 1
      };

      await accountingService.createReceive(payload);
      alert("Receive recorded successfully!");
      navigate('/account/receive-list');
    } catch (error) {
      console.error("Error creating receive:", error);
      alert("Failed to submit receive. Please verify server connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-card">
      <PrintHeader />
      <div className="premium-header">
        <h2 className="premium-title">Add New Receive (Deposit)</h2>
        <div className="header-actions">
          <button className="btn-icon"><Settings size={18} /></button>
          <button className="btn-gray-outline" onClick={() => navigate('/account/receive-list')}><List size={16} /> Receive List</button>
          <button className="btn-gray-outline" onClick={() => navigate('/settings/income-category')}><Layers size={16} /> Receive Category</button>
          <button className="btn-youtube">
            <div style={{ display: 'flex', alignItems: 'center', background: '#ff0000', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              <Play size={16} fill="white" style={{ marginRight: '6px' }} /> YouTube
            </div>
            <div style={{ background: 'var(--success)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-10px', border: '2px solid white' }}>M</div>
          </button>
        </div>
      </div>

      <div className="premium-body">
        <form onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div className="form-row">
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Client / Customer</label>
              <div className="input-with-append">
                <select name="clientId" value={formData.clientId} onChange={handleChange}>
                  <option value="">{t('common.select_client')} (Optional / Walk-in)</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name} (Due: ৳{client.due})</option>
                  ))}
                </select>
                <button type="button" className="append-btn" onClick={() => setIsClientModalOpen(true)}><Plus size={20} /></button>
              </div>
            </div>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Income Category</label>
              <div className="input-with-append">
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select Income Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button type="button" className="append-btn" onClick={() => navigate('/settings/income-category')}><Plus size={20} /></button>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>
                Date &bull; {selectedClient ? <span style={{ color: '#ef4444' }}>Selected Client Due: ৳{dueAmount}</span> : null}
              </label>
              <input type="date" name="date" className="input-date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
            </div>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Receiving Account (Cash/Bank) *</label>
              <div className="input-with-append">
                <select name="accountId" value={formData.accountId} onChange={handleChange} required>
                  <option value="">Select Cash or Bank Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Current Bal: ৳{Number(acc.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
                <button type="button" className="append-btn" onClick={() => navigate('/account/account-create')}><Plus size={20} /></button>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Description / Reference</label>
              <input 
                type="text" 
                name="description" 
                className="input-outline" 
                placeholder="e.g. Payment for INV-0001 or Cash Receive" 
                value={formData.description} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px' }}
              />
            </div>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Received Amount (৳) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="amount" 
                className="input-outline" 
                placeholder="0.00" 
                value={formData.amount} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div style={{ marginTop: '30px' }}>
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '16px', background: 'var(--success)', borderColor: 'var(--success)', fontWeight: 'bold' }}
            >
              {submitting ? 'Recording Deposit...' : 'Confirm & Save Receive'}
            </button>
          </div>
        </form>
      </div>

      <AddOptionModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Quick Add Client"
        placeholder="Client Name"
        onSave={(name) => {
          setIsClientModalOpen(false);
        }}
      />
    </div>
  );
};

export default ReceiveCreate;
