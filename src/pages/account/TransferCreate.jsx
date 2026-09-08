import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Play, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import { accountingService } from '../../services/accountingService';

const TransferCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const res = await accountingService.getAccounts();
      const data = Array.isArray(res) ? res : (res?.results || []);
      setAccounts(data.length > 0 ? data : [
        { id: '1', name: 'Cash Account', balance: '25000.00' },
        { id: '2', name: 'Dutch Bangla Bank (DBBL)', balance: '185000.00' },
        { id: '3', name: 'Islami Bank Bangladesh', balance: '94000.00' }
      ]);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
      alert("Please select both accounts and enter an amount.");
      return;
    }
    if (formData.fromAccountId === formData.toAccountId) {
      alert("Source and Destination accounts cannot be the same.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        from_account: formData.fromAccountId,
        to_account: formData.toAccountId,
        amount: String(formData.amount),
        description: formData.description || "Internal Fund Transfer",
        date: formData.date
      };

      await accountingService.createTransfer(payload);
      alert("Fund transferred successfully! Both accounts and statement updated.");
      navigate('/account/transfer-list');
    } catch (error) {
      console.error("Error creating transfer:", error);
      alert("Transfer request failed. Please check balance and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-card">
      <PrintHeader />
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>Add New Transfer</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate('/account/transfer-list')}><List size={16} /> Transfer List</button>
          <button className="btn-gray-outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go Back</button>
          <button className="btn-youtube">
            <div style={{ display: 'flex', alignItems: 'center', background: '#ff0000', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              <Play size={16} fill="white" style={{ marginRight: '6px' }} /> YouTube
            </div>
          </button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Row 1: From & To */}
          <div className="form-row">
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>From Account (Deducted) *</label>
              <div className="input-with-append">
                <select name="fromAccountId" value={formData.fromAccountId} onChange={handleChange} required>
                  <option value="">Select Source Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: ৳{Number(acc.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>To Account (Credited) *</label>
              <div className="input-with-append">
                <select name="toAccountId" value={formData.toAccountId} onChange={handleChange} required>
                  <option value="">Select Destination Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: ৳{Number(acc.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Date & Amount */}
          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Transfer Date *</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                className="input-outline"
                style={{ width: '100%', padding: '10px', borderRadius: '6px' }} 
              />
            </div>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Transfer Amount (৳) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="amount" 
                placeholder="0.00" 
                value={formData.amount} 
                onChange={handleChange} 
                required 
                className="input-outline"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px' }} 
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>Description / Note</label>
            <input 
              type="text" 
              name="description" 
              placeholder="e.g. Sent cash to DBBL main branch" 
              value={formData.description} 
              onChange={handleChange} 
              className="input-outline"
              style={{ width: '100%', padding: '10px', borderRadius: '6px' }}
            />
          </div>

          {/* Footer Submit */}
          <div style={{ marginTop: '28px' }}>
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '16px', background: 'var(--primary)', borderColor: 'var(--primary)', fontWeight: 'bold' }}
            >
              {submitting ? 'Transferring Funds...' : 'Confirm & Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferCreate;
