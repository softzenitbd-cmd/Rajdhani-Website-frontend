import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Play, FileText, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchableSelect from '../../components/SearchableSelect';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';

// Mirrors the original CRM "নতুন ট্রান্সফার" form:
// from account (+) → to account (+) → date → description → amount → Add Transfer
const TransferCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
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
      const res = await accountingService.getAccounts();
      const data = Array.isArray(res) ? res : (res?.results || []);
      setAccounts(data);
    } catch (error) {
      toast.error(error?.message || t("Failed to load form data"));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
      toast.error(t("Please select both accounts and enter an amount."));
      return;
    }
    if (formData.fromAccountId === formData.toAccountId) {
      toast.error(t("Source and Destination accounts cannot be the same."));
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
      toast.success(t("Fund transferred successfully! Both accounts and statement updated."));
      navigate('/account/transfer-list');
    } catch (error) {
      console.error("Error creating transfer:", error);
      toast.error(t("Transfer request failed. Please check balance and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const accountOptions = accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    searchValue: acc.name
  }));

  const iconInput = {
    display: "flex",
    border: "1px solid #93c5fd",
    borderRadius: "6px",
    overflow: "hidden",
    background: "white",
    alignItems: "center",
  };
  const iconBox = { padding: "0 14px", display: "flex", alignItems: "center" };
  const plainInput = { flex: 1, padding: "12px 16px", border: "none", outline: "none", fontSize: 'var(--fs-14, 14px)' };

  return (
    <div
      className="dashboard-content"
      style={{ paddingBottom: "100px", background: "#f1f5f9", minHeight: "100vh", padding: "24px" }}
    >
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
          <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: "bold" }}>{t("Add New Transfer")}</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => navigate('/account/transfer-list')}
              style={{ background: "#818cf8", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "6px", fontSize: 'var(--fs-13, 13px)', cursor: "pointer" }}
            >
              <List size={14} /> {t("Transfer List")}
            </button>
            <button
              type="button"
              style={{ background: "#dc2626", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "6px", fontSize: 'var(--fs-13, 13px)', cursor: "pointer" }}
            >
              <Play size={14} /> {t("YouTube")}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "30px 40px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* From Account */}
            <SearchableSelect
              options={accountOptions}
              value={formData.fromAccountId}
              onChange={(val) => setFormData(prev => ({ ...prev, fromAccountId: val }))}
              placeholder={t("Select Account")}
              onAddClick={() => navigate('/account/account-create')}
            />

            {/* To Account */}
            <SearchableSelect
              options={accountOptions}
              value={formData.toAccountId}
              onChange={(val) => setFormData(prev => ({ ...prev, toAccountId: val }))}
              placeholder={t("Select Account")}
              onAddClick={() => navigate('/account/account-create')}
            />

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
                  fontSize: 'var(--fs-10, 10px)',
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
                style={{ width: "100%", padding: "12px 16px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: 'var(--fs-14, 14px)', outline: "none" }}
              />
            </div>

            {/* Description */}
            <div style={iconInput}>
              <div style={iconBox}><FileText size={18} color="#1e293b" /></div>
              <input
                type="text"
                name="description"
                placeholder={t("Description")}
                value={formData.description}
                onChange={handleChange}
                style={plainInput}
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

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "4px",
                fontSize: 'var(--fs-15, 15px)',
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {submitting ? t("Transferring Funds...") : t("Add Transfer")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferCreate;
