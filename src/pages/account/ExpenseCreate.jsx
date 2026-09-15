import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Layers, Settings, DollarSign, Keyboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';

// Mirrors the original CRM "খরচ তৈরি" form:
// left column  → date, amount, note
// right column → account (+), category (+)
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

  const headerBtn = {
    background: "#818cf8",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    cursor: "pointer",
  };

  const iconInput = {
    display: "flex",
    border: "1px solid #93c5fd",
    borderRadius: "6px",
    overflow: "hidden",
    background: "white",
    alignItems: "center",
  };

  const iconBox = { padding: "0 14px", display: "flex", alignItems: "center" };
  const plainInput = { flex: 1, padding: "12px 16px", border: "none", outline: "none", fontSize: "14px" };

  return (
    <div
      className="dashboard-content"
      style={{ paddingBottom: "100px", background: "#f1f5f9", minHeight: "100vh", padding: "24px" }}
    >
      <PrintHeader />

      <div
        style={{
          background: "white",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          borderBottom: "6px solid #2e7d32",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#2e7d32",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>{t("Add Expense")}</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={() => navigate('/settings')} style={{ ...headerBtn, padding: "6px 10px" }} title={t("Settings")}>
              <Settings size={14} />
            </button>
            <button type="button" onClick={() => navigate('/crm/client-list')} style={headerBtn}>
              <List size={14} /> {t("Client List")}
            </button>
            <button type="button" onClick={() => navigate('/crm/client-group')} style={headerBtn}>
              <Layers size={14} /> {t("Client Group")}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "30px 40px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              {/* Left Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Date */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "10px",
                      background: "#3b82f6",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {t("📅 Date")}
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #93c5fd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Amount */}
                <div style={iconInput}>
                  <div style={iconBox}><DollarSign size={18} color="#1e293b" /></div>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    placeholder={t("Amount")}
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    style={plainInput}
                  />
                </div>

                {/* Note */}
                <div style={iconInput}>
                  <div style={iconBox}><Keyboard size={18} color="#1e293b" /></div>
                  <input
                    type="text"
                    name="note"
                    placeholder={t("Expense Description in a short note")}
                    value={formData.note}
                    onChange={handleChange}
                    style={plainInput}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Account */}
                <div>
                  <SearchableSelect
                    options={accounts.map(acc => ({
                      value: acc.id,
                      label: acc.name,
                      searchValue: acc.name
                    }))}
                    value={formData.accountId}
                    onChange={(val) => setFormData(prev => ({ ...prev, accountId: val }))}
                    placeholder={t("Select Account")}
                    onAddClick={() => navigate('/account/account-create')}
                  />
                </div>

                {/* Category */}
                <div>
                  <SearchableSelect
                    options={categories.map(cat => ({
                      value: cat.id,
                      label: cat.name,
                      searchValue: cat.name
                    }))}
                    value={formData.category}
                    onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                    placeholder={t("Select Categories")}
                    onAddClick={() => navigate('/settings/expense-category')}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "40px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {submitting ? t("Adding...") : t("Add New")}
              </button>
              <button
                type="button"
                onClick={() => navigate('/account/expense-list')}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {t("Close")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCreate;
