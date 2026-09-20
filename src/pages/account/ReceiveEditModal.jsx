import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  List,
  Layers,
  Plus,
  X,
  MessageSquare,
  User,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import ClientCreateModal from '../crm/client/ClientCreateModal';
import AddAccountModal from '../../components/AddAccountModal';
import AddOptionModal from '../../components/AddOptionModal';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';


/**
 * Modernized Update Receive Modal:
 * - Emerald Green Gradient Header with single-line title & clean ID badge
 * - Header Quick Actions (Settings, Receive List, Receive Category, Close)
 * - 2-Column form layout with properly spaced clean labels (no overlapping clipping badges)
 * - Client selection with live Due badge indicator & inline Add Client modal
 * - Account select with clear button & inline Add Account modal
 * - Date, Amount with currency prefix, Description, Category with inline Add Category modal
 * - SMS Toggle Switch Card
 * - Navy "Update Receive" & Red "Close" action buttons
 */
const ReceiveEditModal = ({ isOpen, receive, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals for inline creation
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [clientLiveDue, setClientLiveDue] = useState(null);

  const [formData, setFormData] = useState({
    clientId: '',
    category: '',
    date: '',
    description: '',
    amount: '',
    accountId: '',
    sms: false
  });

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes, clientRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getIncomeCategories(),
        crmService.getClients({ page_size: 1000 })
      ]);

      setAccounts(Array.isArray(accRes) ? accRes : (accRes?.results || []));
      setCategories(Array.isArray(catRes) ? catRes : (catRes?.results || []));
      setClients(Array.isArray(clientRes) ? clientRes : (clientRes?.results || []));
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
    if (receive && isOpen) {
      const cId = receive.client || receive.client_id || (typeof receive.client === 'object' ? receive.client?.id : '') || '';
      const accId = receive.account || receive.account_id || (typeof receive.account === 'object' ? receive.account?.id : '') || '';
      const catId = receive.category || receive.category_id || (typeof receive.category === 'object' ? receive.category?.id : '') || '';
      const dateStr = receive.date ? String(receive.date).split('T')[0] : new Date().toISOString().split('T')[0];
      const amt = receive.amount ? String(receive.amount) : '';
      const desc = receive.description || receive.reference || '';

      setFormData({
        clientId: cId ? String(cId) : '',
        category: catId ? String(catId) : '',
        date: dateStr,
        description: desc,
        amount: amt,
        accountId: accId ? String(accId) : '',
        sms: Boolean(receive.sms)
      });
    }
  }, [receive, isOpen]);

  // Live client due fetching
  useEffect(() => {
    if (!formData.clientId) {
      setClientLiveDue(null);
      return;
    }

    const client = (clients || []).find((c) => String(c.id || c.uuid) === String(formData.clientId));
    const initialDue = client
      ? Number(client.current_due ?? client.previous_due ?? client.total_due ?? client.due ?? client.due_amount ?? 0)
      : 0;

    setClientLiveDue(initialDue);

    crmService
      .getClientDueReport({ client_id: formData.clientId })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          const row = list[0];
          const due = Number(row.current_due ?? row.total_due ?? row.balance ?? row.due ?? row.due_amount ?? row.previous_due ?? initialDue);
          setClientLiveDue(due);
        }
      })
      .catch(() => {});
  }, [formData.clientId, clients]);

  if (!isOpen || !receive) return null;

  const selectedClient = (clients || []).find((c) => String(c.id || c.uuid) === String(formData.clientId));
  const dueAmount = clientLiveDue !== null
    ? clientLiveDue
    : (selectedClient ? Number(selectedClient.current_due ?? selectedClient.previous_due ?? selectedClient.total_due ?? selectedClient.due ?? 0) : 0);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
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
        amount: Number(formData.amount).toFixed(2),
        date: formData.date,
        sms: formData.sms
      };

      if (formData.accountId) payload.account = formData.accountId;
      if (formData.clientId) payload.client = formData.clientId;
      if (formData.category) payload.category = formData.category;
      if (formData.description) payload.reference = formData.description;

      await accountingService.updateReceive(receive.id || receive.uuid, payload);
      toast.success(t("Receive updated successfully!"));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating receive:", error);
      toast.error(error?.message || t("Failed to update receive"));
    } finally {
      setSubmitting(false);
    }
  };

  // Determine clean display ID
  const rawId = receive.receipt_no || receive.invoice_no || receive.id_no || receive.id || '';
  const displayId = String(rawId).length > 12 ? String(rawId).slice(0, 8) : String(rawId);

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
                <span>{t("Update Receive | ID No:")}</span>
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
                onClick={() => navigate('/settings/income-category')}
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
                onClick={onClose}
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
                <List size={14} /> {t("Receive List")}
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings/income-category')}
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
                <Layers size={14} /> {t("Receive Category")}
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
                
                {/* 1. Client Select */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <User size={14} color="#15803d" />
                    <span>{t("Select Client")}</span>
                  </label>
                  <SearchableSelect
                    options={(clients || []).map((c) => {
                      const nameStr = c.name || c.company_name || '';
                      return {
                        value: c.id || c.uuid,
                        label: `${nameStr} ${c.phone ? `(${c.phone})` : ''}`,
                        searchValue: `${nameStr} ${c.phone || ''}`
                      };
                    })}
                    value={formData.clientId}
                    onChange={(val) => setFormData((prev) => ({ ...prev, clientId: val }))}
                    placeholder={t("Select Client")}
                    onAddClick={() => setIsClientModalOpen(true)}
                  />
                  {formData.clientId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <span style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#64748b' }}>
                        {t("Due:")}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: 'var(--fs-12, 12px)',
                          fontWeight: '700',
                          background: dueAmount > 0 ? '#fee2e2' : '#dcfce7',
                          color: dueAmount > 0 ? '#b91c1c' : '#15803d',
                          border: dueAmount > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0'
                        }}
                      >
                        ৳ {Number(dueAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Account Select */}
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
                      <option value="">{t("Select Account")}</option>
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

                {/* 3. Amount */}
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

                {/* 4. SMS Notification */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <MessageSquare size={14} color="#0284c7" />
                    <span>{t("SMS Notification")}</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0 14px',
                      height: '42px',
                      background: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '500', color: '#334155' }}>
                      <span>{formData.sms ? t("SMS Enabled") : t("SMS Disabled")}</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        name="sms"
                        checked={formData.sms}
                        onChange={handleChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: formData.sms ? '#2563eb' : '#cbd5e1',
                          borderRadius: '34px',
                          transition: '.3s'
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            height: '16px',
                            width: '16px',
                            left: formData.sms ? '20px' : '2px',
                            bottom: '2px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            transition: '.3s'
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 5. Date */}
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

                {/* 6. Description */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <FileText size={14} color="#15803d" />
                    <span>{t("Receive Description in a short note")}</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t("Receive Description in a short note")}
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

                {/* 7. Category */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <Layers size={14} color="#15803d" />
                    <span>{t("Receive Category")}</span>
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
                      <option value="">{t("Select Category")}</option>
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
                      title={t("Add Category")}
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
                {submitting ? t("Updating...") : t("Update Receive")}
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

      {/* Inline Client Create Modal */}
      <ClientCreateModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientAdded={(newClient) => {
          if (newClient) {
            setClients((prev) => [...prev, newClient]);
          }
          if (newClient?.id || newClient?.uuid) {
            setFormData((prev) => ({ ...prev, clientId: newClient.id || newClient.uuid }));
          }
        }}
      />

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

      {/* Inline Category Create Modal */}
      <AddOptionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={t("Add New Income Category")}
        label={t("Category Name")}
        placeholder={t("Enter category name")}
        onSave={async (name) => {
          const created = await accountingService.createIncomeCategory({ name });
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

export default ReceiveEditModal;

