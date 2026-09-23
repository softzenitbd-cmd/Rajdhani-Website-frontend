import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  List,
  Layers,
  Plus,
  X,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import AddAccountModal from '../../components/AddAccountModal';
import AddOptionModal from '../../components/AddOptionModal';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';


/**
 * Modernized Update Expense Modal matching the user reference screenshot:
 * - Emerald Green Gradient Header with single-line title & clean ID badge
 * - Header Quick Actions (Settings, Client List, Client Group / Expense Category, Close)
 * - 2-Column form layout:
 *     Left: Date, Amount (with currency prefix), Expense Description
 *     Right: Account (with clear + Add Account modal), Category (with clear + Add Category modal)
 * - Navy "Update Expense" & Red "Close" action buttons
 */
const ExpenseEditModal = ({ isOpen, expense, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Modals for inline creation
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    category: '',
    date: '',
    amount: '',
    description: ''
  });

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getExpenseCategories()
      ]);

      setAccounts(Array.isArray(accRes) ? accRes : (accRes?.results || []));
      setCategories(Array.isArray(catRes) ? catRes : (catRes?.results || []));
    } catch (err) {
      console.error("Failed to load prerequisites:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPrerequisites();
    }
  }, [isOpen]);

  useEffect(() => {
    if (expense && isOpen) {
      const accId = expense.account || expense.account_id || (typeof expense.account === 'object' ? expense.account?.id : '') || '';
      const catId = expense.category || expense.category_id || (typeof expense.category === 'object' ? expense.category?.id : '') || '';
      const dateStr = expense.date ? String(expense.date).split('T')[0] : new Date().toISOString().split('T')[0];
      const amt = expense.amount ? String(expense.amount) : '';
      const desc = expense.description || expense.desc || expense.note || '';

      setFormData({
        accountId: accId ? String(accId) : '',
        category: catId ? String(catId) : '',
        date: dateStr,
        amount: amt,
        description: desc
      });
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.amount) {
      toast.error(t("Please enter an amount."));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount: String(Number(formData.amount).toFixed(2)),
        date: formData.date,
        description: formData.description || "General Expense Payment"
      };

      if (formData.accountId) payload.account = formData.accountId;
      if (formData.category) payload.category = formData.category;

      await accountingService.updateExpense(expense.id || expense.uuid, payload);
      toast.success(t("Expense updated successfully! Balances and ledgers have been auto-adjusted."));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error(error?.message || t("Failed to update expense"));
    } finally {
      setSubmitting(false);
    }
  };

  // Determine clean display ID
  const rawId = expense.reference || expense.id_no || expense.id || '';
  const displayId = String(rawId).length > 12 ? String(rawId).replace(/\D/g, '').padEnd(6, '0').slice(0, 6) : String(rawId);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '16px'
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            width: '840px',
            maxWidth: '96vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalFadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Emerald Green Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--fs-16, 16px)',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title={String(rawId)}
              >
                <span>{t("Update Expense | ID No:")}</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    background: 'rgba(255, 255, 255, 0.22)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: 'var(--fs-13, 13px)',
                    fontWeight: '600'
                  }}
                >
                  {displayId}
                </span>
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => navigate('/settings/expense-category')}
                title={t("Settings")}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
              >
                <Settings size={15} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/crm/client-list')}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--fs-13, 13px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
              >
                <List size={14} /> {t("Client List")}
              </button>
              <button
                type="button"
                onClick={() => navigate('/crm/client-group')}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--fs-13, 13px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
              >
                <Layers size={14} /> {t("Client Group")}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
                title={t("Close")}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 1. Date */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <Calendar size={14} color="#15803d" />
                    <span>{t("Date")}</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <CustomDatePicker
                    
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      color: '#1e293b',
                      boxSizing: 'border-box',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>

                {/* 2. Amount */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <span style={{ color: '#15803d', fontWeight: 'bold' }}>৳</span>
                    <span>{t("Amount")}</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '42px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: 'white',
                      overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRight: '1px solid #cbd5e1',
                        padding: '0 14px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#475569',
                        fontWeight: '700',
                        fontSize: 'var(--fs-14, 14px)'
                      }}
                    >
                      ৳
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      style={{
                        flex: 1,
                        height: '100%',
                        padding: '0 12px',
                        border: 'none',
                        outline: 'none',
                        fontSize: 'var(--fs-14, 14px)',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: 'transparent'
                      }}
                    />
                  </div>
                </div>

                {/* 3. Expense Description */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <FileText size={14} color="#15803d" />
                    <span>{t("Expense Description in a short note")}</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t("Expense Description in a short note")}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      color: '#1e293b',
                      boxSizing: 'border-box',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>

              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 4. Account Select */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <CreditCard size={14} color="#15803d" />
                    <span>{t("Account / Payment Method")}</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      height: '42px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <select
                      name="accountId"
                      value={formData.accountId}
                      onChange={handleChange}
                      style={{
                        flex: 1,
                        height: '100%',
                        padding: '0 12px',
                        border: 'none',
                        outline: 'none',
                        fontSize: 'var(--fs-13, 13px)',
                        background: 'transparent',
                        color: '#1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">{t("TOTAL BALANCE")}</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    {formData.accountId && (
                      <button
                        type="button"
                        onClick={() => clearField('accountId')}
                        style={{
                          background: 'white',
                          border: 'none',
                          borderLeft: '1px solid #e2e8f0',
                          padding: '0 10px',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                        title={t("Clear")}
                      >
                        <X size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAccountModalOpen(true)}
                      style={{
                        background: '#15803d',
                        color: 'white',
                        border: 'none',
                        padding: '0 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#166534')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#15803d')}
                      title={t("Add New Account")}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* 5. Expense Category */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <Layers size={14} color="#15803d" />
                    <span>{t("Select Categories")}</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      height: '42px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={{
                        flex: 1,
                        height: '100%',
                        padding: '0 12px',
                        border: 'none',
                        outline: 'none',
                        fontSize: 'var(--fs-13, 13px)',
                        background: 'transparent',
                        color: '#1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">{t("Select Categories")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {formData.category && (
                      <button
                        type="button"
                        onClick={() => clearField('category')}
                        style={{
                          background: 'white',
                          border: 'none',
                          borderLeft: '1px solid #e2e8f0',
                          padding: '0 10px',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                        title={t("Clear")}
                      >
                        <X size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{
                        background: '#15803d',
                        color: 'white',
                        border: 'none',
                        padding: '0 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#166534')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#15803d')}
                      title={t("Add Expense Category")}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '32px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#0f172a',
                  color: 'white',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: '6px',
                  fontSize: 'var(--fs-14, 14px)',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { if (!submitting) e.currentTarget.style.background = '#1e293b'; }}
                onMouseOut={(e) => { if (!submitting) e.currentTarget.style.background = '#0f172a'; }}
              >
                {submitting ? t("Updating...") : t("Update Expense")}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: '6px',
                  fontSize: 'var(--fs-14, 14px)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.25)',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
              >
                {t("Close")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inline Account Create Modal */}
      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={(newAccount) => {
          if (newAccount) {
            setAccounts((prev) => [...prev, newAccount]);
            if (newAccount.id) {
              setFormData((prev) => ({ ...prev, accountId: newAccount.id }));
            }
          }
        }}
      />

      {/* Inline Expense Category Create Modal */}
      <AddOptionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={t("Add New Expense Category")}
        label={t("Category Name")}
        placeholder={t("e.g. DOKAN KOROJ, SALARY")}
        onSave={async (name) => {
          const created = await accountingService.createExpenseCategory({ name });
          if (created) {
            setCategories((prev) => [...prev, created]);
            if (created.id) {
              setFormData((prev) => ({ ...prev, category: created.id }));
            }
            toast.success(t("Category added successfully!"));
          }
        }}
      />
    </>
  );
};

export default ExpenseEditModal;
