import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';

const ExpenseCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
    transactionType: 'General Expense'
  });

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getExpenseCategories()
      ]);

      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      const catData = Array.isArray(catRes) ? catRes : (catRes?.results || []);

      setAccounts(accData);

      setCategories(catData);
    } catch (err) {
      toast.error(err?.message || t("Failed to load form data"));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectedAccount = accounts.find(a => String(a.id) === String(formData.accountId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.amount || !formData.category) {
      toast.error(t("Please select account, category, and enter an amount."));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: "cost",
        transaction_type: formData.transactionType || "General Expense",
        account: formData.accountId,
        category: formData.category,
        amount: String(formData.amount),
        description: formData.note || "General Expense Payment",
        date: formData.date,
        status: 1
      };

      await accountingService.createExpense(payload);
      toast.success(t("Expense created and account balance updated successfully!"));
      navigate('/account/expense-list');
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(t("Failed to save expense. Please check your network connection."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-card">
      <PrintHeader />
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>{t("Add New Expense (Cost)")}</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate('/account/expense-list')}><List size={16} /> {t("Expense List")}</button>
          <button className="btn-gray-outline" onClick={() => navigate('/settings/expense-category')}><List size={16} /> {t("Expense Category")}</button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div className="form-row">
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>{t("Payment Account (Cash/Bank) *")}</label>
              <div className="input-with-append">
                <select name="accountId" value={formData.accountId} onChange={handleChange} required>
                  <option value="">{t("Select Account")}</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} {t("(Balance: ৳")}{Number(acc.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
                <button type="button" className="append-btn" onClick={() => navigate('/account/account-create')}><Plus size={20} /></button>
              </div>
            </div>

            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>{t("Expense Category *")}</label>
              <div className="input-with-append">
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">{t("Select Expense Category")}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button type="button" className="append-btn" onClick={() => navigate('/settings/expense-category')}><Plus size={20} /></button>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-col">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>{t("Expense Date *")}</label>
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
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>{t("Amount (৳) *")}</label>
              <input 
                type="number" 
                step="0.01" 
                name="amount" 
                placeholder="0.00" 
                value={formData.amount} 
                onChange={handleChange} 
                required 
                className="input-outline"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: 'bold' }} 
              />
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>{t("Description / Reason of Expense")}</label>
            <textarea 
              name="note" 
              placeholder={t("e.g. Office electricity bill, tea and snacks, courier cost...")} 
              value={formData.note} 
              onChange={handleChange} 
              className="input-outline"
              style={{ width: '100%', height: '90px', padding: '12px', resize: 'vertical' }}
            />
          </div>

          {/* Footer Submit */}
          <div style={{ marginTop: '28px' }}>
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '16px', background: 'var(--danger)', borderColor: 'var(--danger)', fontWeight: 'bold' }}
            >
              {submitting ? t("Recording Expense...") : t("Confirm & Save Expense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseCreate;
