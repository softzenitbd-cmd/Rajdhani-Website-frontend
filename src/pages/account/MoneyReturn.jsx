import React, { useState, useEffect } from "react";
import { List, Layers, Plus, X, User, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import PrintHeader from "../../components/PrintHeader";
import SearchableSelect from "../../components/SearchableSelect";
import ClientCreateModal from "../crm/client/ClientCreateModal";
import AddOptionModal from "../../components/AddOptionModal";
import { accountingService } from "../../services/accountingService";
import { crmService } from "../../services/crmService";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "react-i18next";

const MoneyReturn = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    accountId: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes, clientRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getExpenseCategories(),
        crmService.getClients(),
      ]);

      const accData = Array.isArray(accRes) ? accRes : accRes?.results || [];
      const catData = Array.isArray(catRes) ? catRes : catRes?.results || [];
      const clientData = Array.isArray(clientRes)
        ? clientRes
        : clientRes?.results || [];

      setAccounts(accData);

      setCategories(catData);

      setClients(clientData);
    } catch (err) {
      toast.error(err?.message || t("Failed to load form data"));
    }
  };

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearField = (field) => {
    setFormData({ ...formData, [field]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.amount) {
      toast.error(t("Please select an Account and enter an Amount."));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: "cost",
        transaction_type: "Money Return",
        account: formData.accountId,
        amount: String(formData.amount),
        date: formData.date,
      };

      if (formData.clientId) payload.client = formData.clientId;
      if (formData.categoryId) payload.category = formData.categoryId;
      if (formData.description) payload.reference = formData.description;

      await accountingService.createExpense(payload);
      toast.success(t("Money Return recorded successfully!"));
      navigate("/account/expense-list");
    } catch (error) {
      console.error("Error submitting money return:", error);
      const errorDetail = error.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : error.message;
      toast.error(
        t("Failed to submit Money Return: {{v0}}", { v0: errorDetail }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="dashboard-content"
      style={{
        paddingBottom: "100px",
        background: "#f1f5f9",
        minHeight: "100vh",
        padding: "24px",
      }}
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
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: "bold" }}>
            {t("Money Return")}
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate("/crm/client-list")}
              style={{
                background: "#818cf8",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: 'var(--fs-13, 13px)',
                cursor: "pointer",
              }}
            >
              <List size={14} /> {t("Client List")}
            </button>
            <button
              onClick={() => navigate("/crm/client-groups")}
              style={{
                background: "#818cf8",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: 'var(--fs-13, 13px)',
                cursor: "pointer",
              }}
            >
              <Layers size={14} /> {t("Client Group")}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "30px 40px" }}>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
              }}
            >
              {/* Left Column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Date Input */}
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
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
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
                      fontSize: 'var(--fs-14, 14px)',
                      outline: "none",
                    }}
                  />
                </div>

                {/* Client Select */}
                <div>
                  <SearchableSelect
                    options={(clients || []).map((c) => {
                      const nameStr = c.name || c.company_name || "";
                      return {
                        value: c.id,
                        label: `${nameStr} ${c.phone ? `(${c.phone})` : ""}`,
                        searchValue: `${nameStr} ${c.phone || ""}`,
                      };
                    })}
                    value={formData.clientId}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, clientId: val }))
                    }
                    placeholder={t("Select Client")}
                    onAddClick={() => setIsClientModalOpen(true)}
                  />
                </div>

                {/* Category Select */}
                <div>
                  <SearchableSelect
                    options={(categories || []).map((c) => ({
                      value: c.id,
                      label: c.name,
                      searchValue: c.name,
                    }))}
                    value={formData.categoryId}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, categoryId: val }))
                    }
                    placeholder={t("Select Category")}
                    onAddClick={() => navigate("/settings/expense-category")}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Account Select */}
                <div>
                  <SearchableSelect
                    options={(accounts || []).map((a) => ({
                      value: a.id,
                      label: a.name,
                      searchValue: a.name,
                    }))}
                    value={formData.accountId}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, accountId: val }))
                    }
                    placeholder={t("Select Account")}
                    onAddClick={() => navigate("/account/account-create")}
                  />
                </div>

                {/* Amount Input */}
                <div
                  style={{
                    display: "flex",
                    border: "1px solid #93c5fd",
                    borderRadius: "6px",
                    overflow: "hidden",
                    background: "white",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      padding: "0 14px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <User size={18} color="#1e293b" />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    placeholder={t("Amount")}
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: "none",
                      outline: "none",
                      fontSize: 'var(--fs-14, 14px)',
                    }}
                  />
                </div>

                {/* Description Input */}
                <div
                  style={{
                    display: "flex",
                    border: "1px solid #93c5fd",
                    borderRadius: "6px",
                    overflow: "hidden",
                    background: "white",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      padding: "0 14px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FileText size={18} color="#1e293b" />
                  </div>
                  <input
                    type="text"
                    name="description"
                    placeholder={t("Expense Description in a short note")}
                    value={formData.description}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: "none",
                      outline: "none",
                      fontSize: 'var(--fs-14, 14px)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                marginTop: "40px",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "4px",
                  fontSize: 'var(--fs-14, 14px)',
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {submitting ? t("Adding...") : t("Add New")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/account/expense-list")}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "4px",
                  fontSize: 'var(--fs-14, 14px)',
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

      <AddOptionModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title={t("Quick Add Client")}
        placeholder={t("Client Name")}
        onSave={() => {
          setIsClientModalOpen(false);
        }}
      />
    </div>
  );
};

export default MoneyReturn;
