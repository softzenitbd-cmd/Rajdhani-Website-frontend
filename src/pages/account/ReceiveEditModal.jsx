import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Settings, List, Layers, Plus, X, MessageSquare } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import ClientCreateModal from '../crm/client/ClientCreateModal';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';

/**
 * Update Receive Modal Popup matching user screenshot:
 * - Green Header: "Update Receive | ID No: {id}"
 * - Header Quick Actions: Settings, Receive List, Receive Category
 * - 2-Column form layout with cyan floating badges
 * - Client selection with live Due display
 * - Account, Amount, SMS Toggle, Date, Description, Category
 * - "Update Receive" (black) and "Close" (red) action buttons
 */
const ReceiveEditModal = ({ isOpen, receive, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
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

  const receiveIdDisplay = receive.id || receive.id_no || receive.receipt_no || (receive.uuid ? String(receive.uuid).slice(0, 8) : '187478');

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
            background: 'white',
            borderRadius: '8px',
            width: '880px',
            maxWidth: '96vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Green Top Header */}
          <div
            style={{
              background: '#2e7d32',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px'
            }}
          >
            <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold' }}>
              {t("Update Receive | ID No:")} {receiveIdDisplay}
            </h2>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/settings/income-category')}
                title={t("Settings")}
                style={{
                  background: '#818cf8',
                  color: 'white',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Settings size={15} />
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#818cf8',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--fs-13, 13px)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <List size={14} /> {t("Receive List")}
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings/income-category')}
                style={{
                  background: '#818cf8',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--fs-13, 13px)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Layers size={14} /> {t("Receive Category")}
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Client Select with Add and Clear */}
                <div>
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
                  <div style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', marginTop: '6px', marginLeft: '2px', color: '#1e293b' }}>
                    {t("Due:")} {Number(dueAmount).toFixed(0)}
                  </div>
                </div>

                {/* Account Select */}
                <div style={{ display: 'flex', border: '1px solid #38bdf8', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
                  <select
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
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
                      style={{ background: 'white', border: 'none', borderLeft: '1px solid #e2e8f0', padding: '0 10px', cursor: 'pointer', color: '#64748b' }}
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/account/account-create')}
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Amount Input with Cyan Badge */}
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '12px',
                      background: '#0284c7',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: 'var(--fs-11, 11px)',
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  >
                    $ {t("Amount")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 14px 10px 14px',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* SMS Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '10px 16px',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#1e293b' }}>
                    <span>💬</span>
                    <span>{t("SMS")}</span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px' }}>
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
                        cursor: 'pointer',
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
                          transition: '.3s'
                        }}
                      />
                    </span>
                  </label>
                </div>

              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Date Input with Cyan Badge */}
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '12px',
                      background: '#0284c7',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: 'var(--fs-11, 11px)',
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  >
                    📅 {t("Date")}
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '14px 14px 10px 14px',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Description Input with Cyan Badge */}
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '12px',
                      background: '#0284c7',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: 'var(--fs-11, 11px)',
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  >
                    📝 {t("Receive Description in a short note")}
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t("Description")}
                    style={{
                      width: '100%',
                      padding: '14px 14px 10px 14px',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Category Select */}
                <div style={{ display: 'flex', border: '1px solid #38bdf8', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: 'none',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'transparent',
                      color: '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">{t("CASH SELL")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {formData.category && (
                    <button
                      type="button"
                      onClick={() => clearField('category')}
                      style={{ background: 'white', border: 'none', borderLeft: '1px solid #e2e8f0', padding: '0 10px', cursor: 'pointer', color: '#64748b' }}
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/settings/income-category')}
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

              </div>
            </div>

            {/* Bottom Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '36px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#0f172a',
                  color: 'white',
                  border: 'none',
                  padding: '9px 24px',
                  borderRadius: '4px',
                  fontSize: 'var(--fs-13, 13px)',
                  fontWeight: 'bold',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
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
                  padding: '9px 24px',
                  borderRadius: '4px',
                  fontSize: 'var(--fs-13, 13px)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
                }}
              >
                {t("Close")}
              </button>
            </div>
          </form>
        </div>
      </div>

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
    </>
  );
};

export default ReceiveEditModal;
