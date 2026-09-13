import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Plus, Calendar, DollarSign, FileText, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import { accountingService } from '../../services/accountingService';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import { useToast } from '../../context/ToastContext';

const LoanReceiveCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    clientId: location.state?.clientId || '',
    accountId: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    amount: '',
    note: '',
    categoryId: '',
    sms: false
  });
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [loanAccounts, setLoanAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrerequisites = async () => {
    try {
      const [loanRes, accRes, catRes] = await Promise.all([
        loanService.getLoanAccounts(),
        accountingService.getAccounts(),
        accountingService.getIncomeCategories()
      ]);
      const loanData = Array.isArray(loanRes) ? loanRes : (loanRes?.results || []);
      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      const catData = Array.isArray(catRes) ? catRes : (catRes?.results || []);

      setLoanAccounts(loanData);
      setBankAccounts(accData);
      setCategories(catData);
    } catch (err) {
      toast.error(err?.message || 'Failed to load form data');
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Quick-add helpers – every one creates the record through the API and selects it
  const handleAddLoanClient = async (name) => {
    const created = await loanService.createLoanAccount({ name: name.trim(), phone: '', address: '' });
    const row = { ...(created || {}), id: created?.id || created?.uuid, name: created?.name || name.trim() };
    setLoanAccounts(prev => [row, ...prev]);
    setFormData(prev => ({ ...prev, clientId: row.id }));
  };

  const handleAddAccount = async (name) => {
    const created = await accountingService.createAccount({ name: name.trim() });
    const row = { ...(created || {}), id: created?.id || created?.uuid, name: created?.name || name.trim() };
    setBankAccounts(prev => [row, ...prev]);
    setFormData(prev => ({ ...prev, accountId: row.id }));
  };

  const handleAddCategory = async (name) => {
    const created = await accountingService.createIncomeCategory({ name: name.trim() });
    const row = { ...(created || {}), id: created?.id || created?.uuid, name: created?.name || name.trim() };
    setCategories(prev => [row, ...prev]);
    setFormData(prev => ({ ...prev, categoryId: row.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId || !formData.accountId || !formData.amount) {
      alert("Please select Loan Account, Receiving Account, and enter Amount.");
      return;
    }

    try {
      setLoading(true);
      await loanService.createLoanReceive({
        loan_account: formData.clientId,
        account: formData.accountId,
        amount: String(formData.amount),
        description: formData.note || "Loan Receive",
        ...(formData.categoryId ? { category: formData.categoryId } : {}),
        date: formData.date,
      });
      alert("Loan Receive added successfully!");
      navigate('/loan/receive');
    } catch (error) {
      console.error("Error creating loan receive:", error);
      alert(`Failed to create loan receive: ${error?.message || 'server error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
        <PrintHeader />
      <div className="premium-card">
        <div className="premium-header">
          <h2 className="premium-title">Create Loan Receive</h2>
          <div className="header-actions">
            <button className="btn-gray-outline" onClick={() => navigate('/loan/receive')}>
              <List size={16} /> List
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white' }}>
          <form onSubmit={handleSubmit}>
            {/* Row 1 */}
            <div className="form-row">
              <div className="form-col">
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
                  <select name="clientId" value={formData.clientId} onChange={handleChange} required style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}>
                    <option value="">{t('common.select_client')}</option>
                    {loanAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} - {acc.phone}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsClientModalOpen(true)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}><Plus size={18} /></button>
                </div>
              </div>
              <div className="form-col" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <Calendar size={12} /> Date
                </div>
                <input type="date" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '14px', outline: 'none', background: 'white' }} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="form-row">
              <div className="form-col">
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
                  <select name="accountId" value={formData.accountId} onChange={handleChange} required style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}>
                    <option value="">Select Account</option>
                    {(bankAccounts || []).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsAccountModalOpen(true)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}><Plus size={18} /></button>
                </div>
              </div>
              <div className="form-col">
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                    <FileText size={18} color="#1e293b" />
                  </div>
                  <input type="text" name="note" placeholder="Receive Description in a short note" value={formData.note} onChange={handleChange} style={{ flex: 1, padding: '12px 16px 12px 0', border: 'none', outline: 'none', fontSize: '14px' }} />
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-row">
              <div className="form-col">
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 16px', fontWeight: 'bold', color: '#1e293b' }}>
                    <DollarSign size={18} color="#1e293b" />
                  </div>
                  <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} required style={{ flex: 1, padding: '12px 16px 12px 0', border: 'none', outline: 'none', fontSize: '14px' }} />
                </div>
              </div>
              <div className="form-col">
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
                  <select name="categoryId" value={formData.categoryId} onChange={handleChange} style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', appearance: 'none', background: 'transparent' }}>
                    <option value="">Select Categories</option>
                    {categories.map(c => (
                      <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}><Plus size={18} /></button>
                </div>
              </div>
            </div>

            {/* Row 4 */}
            <div className="form-row">
              <div className="form-col" style={{ flex: 'none', width: '50%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #93c5fd', borderRadius: '6px', padding: '12px 16px', background: 'white', height: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                    <MessageSquare size={18} color="#1e293b" />
                    SMS
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', margin: 0 }}>
                    <input type="checkbox" name="sms" checked={formData.sms} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.sms ? '#3b82f6' : '#cbd5e1', borderRadius: '34px', transition: '.4s' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: formData.sms ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <button type="submit" className="btn-primary" style={{ background: 'var(--primary)', padding: '10px 24px', fontSize: '14px', borderRadius: '4px' }} disabled={loading}>
                {loading ? 'Processing...' : 'Add New Receive'}
              </button>
              <button type="button" className="btn-danger" onClick={() => navigate('/loan/receive')} style={{ background: 'var(--danger)', padding: '10px 24px', fontSize: '14px', borderRadius: '4px' }}>
                Close
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleAddLoanClient}
        title="Add Client"
        label="Client Name"
      />
      <AddOptionModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleAddAccount}
        title="Add Account"
        label="Account Name"
      />
      <AddOptionModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleAddCategory}
        title="Add Category"
        label="Category Name"
      />
    </div>
  );
};

export default LoanReceiveCreate;
