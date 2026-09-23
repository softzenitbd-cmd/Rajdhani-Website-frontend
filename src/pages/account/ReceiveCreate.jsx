import React, { useState, useEffect } from 'react';
import { List, Layers, Plus, X, FileText, Printer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import SearchableSelect from '../../components/SearchableSelect';
import ClientCreateModal from '../crm/client/ClientCreateModal';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../components/CustomDatePicker';


const ReceiveCreate = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

  const [formData, setFormData] = useState({
    clientId: location.state?.clientId || '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    accountId: '',
    sms: false
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientLiveDue, setClientLiveDue] = useState(null);

  const loadPrerequisites = async () => {
    try {
      const [accRes, catRes, clientRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getIncomeCategories(),
        crmService.getClients({ page_size: 1000 })
      ]);

      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      const catData = Array.isArray(catRes) ? catRes : (catRes?.results || []);
      const clientData = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);

      setAccounts(accData);
      setCategories(catData);
      setClients(clientData);

      // Auto-select "TOTAL BALANCE" account if it exists
      const totalBalanceAcc = accData.find(a => a.name && a.name.toUpperCase().includes('TOTAL BALANCE'));
      if (totalBalanceAcc) {
        setFormData(prev => ({ ...prev, accountId: totalBalanceAcc.id || totalBalanceAcc.uuid || '' }));
      }
    } catch (err) {
      toast.error(err?.message || t("Failed to load form data"));
    }
  };

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const selectedClient = (clients || []).find(c => String(c.id || c.uuid) === String(formData.clientId));

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

    // Calculate accurate due matching Client Statement
    accountingService.getClientLedger(formData.clientId).then(ledgerRes => {
      const rawList = Array.isArray(ledgerRes) ? ledgerRes : (ledgerRes?.ledger || ledgerRes?.transactions || ledgerRes?.statement || ledgerRes?.results || []);
      const summary = ledgerRes && !Array.isArray(ledgerRes) ? ledgerRes : null;
      // Calculate sum of all transactions first to find true opening balance
      const sumOfTransactions = rawList.reduce((acc, r) => {
        const t = String(r.type || r.transaction_type || '').toLowerCase();
        const debit = Number(r.debit ?? 0);
        const credit = Number(r.credit ?? 0);
        const isReturn = /return/.test(t) && !/money/.test(t);
        const isMoneyReturn = /money|refund/.test(t);
        const bill = Number(r.bill ?? r.grand_total ?? r.total ?? (r.debit !== undefined && !isMoneyReturn ? debit : 0));
        const salesReturn = Number(r.sales_return ?? r.return_amount ?? (r.credit !== undefined && isReturn ? credit : 0));
        const receive = Number(r.receive ?? r.payment ?? r.amount_received ?? (r.credit !== undefined && !isReturn ? credit : 0));
        const moneyReturn = Number(r.money_return ?? (r.debit !== undefined && isMoneyReturn ? debit : 0));
        return acc + bill - salesReturn - receive + moneyReturn;
      }, 0);

      // The true Opening Balance = Current Due - Sum of all transactions
      const trueOpeningBalance = initialDue - sumOfTransactions;

      let running = trueOpeningBalance;
      
      rawList.forEach(r => {
        const t = String(r.type || r.transaction_type || '').toLowerCase();
        const debit = Number(r.debit ?? 0);
        const credit = Number(r.credit ?? 0);
        const isReturn = /return/.test(t) && !/money/.test(t);
        const isMoneyReturn = /money|refund/.test(t);
        const bill = Number(r.bill ?? r.grand_total ?? r.total ?? (r.debit !== undefined && !isMoneyReturn ? debit : 0));
        const salesReturn = Number(r.sales_return ?? r.return_amount ?? (r.credit !== undefined && isReturn ? credit : 0));
        const receive = Number(r.receive ?? r.payment ?? r.amount_received ?? (r.credit !== undefined && !isReturn ? credit : 0));
        const moneyReturn = Number(r.money_return ?? (r.debit !== undefined && isMoneyReturn ? debit : 0));
        running = running + bill - salesReturn - receive + moneyReturn;
      });
      setClientLiveDue(running);
    }).catch(() => setClientLiveDue(initialDue));
  }, [formData.clientId, clients]);

  const dueAmount = clientLiveDue !== null ? clientLiveDue : 0;


  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const clearField = (field) => {
    setFormData({ ...formData, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.amount) {
      toast.error(t("Please enter an amount and select an account."));
      return;
    }

    try {
      setSubmitting(true);
      // POST /api/accounting/receives/ – account balance (+), client due (-)
      const payload = {
        type: "deposit",
        transaction_type: formData.clientId ? "Invoice" : "Receive",
        account: formData.accountId,
        amount: Number(formData.amount).toFixed(2),
        date: formData.date,
        status: 1
      };

      if (formData.clientId) payload.client = formData.clientId;
      if (formData.category) payload.category = formData.category;
      if (formData.description) payload.reference = formData.description;

      const createdReceive = await accountingService.createReceive(payload);
      toast.success(t("Receive recorded successfully!"));
      
      setReceiptModal({
        ...createdReceive,
        amount: formData.amount,
        date: formData.date,
        client: selectedClient,
        client_name: selectedClient?.name || 'Walk-in',
        due: (dueAmount - Number(formData.amount)).toFixed(2),
        reference: formData.description
      });
      
    } catch (error) {
      console.error("Error creating receive:", error);
      const errorDetail = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
      toast.error(t("Failed to submit receive: {{v0}}", { v0: errorDetail }));
    } finally {
      setSubmitting(false);
    }
  };
  const handlePrintReceipt = () => {
    const printContents = document.getElementById('print-receipt-section').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: '#f1f5f9', minHeight: '100vh', padding: '24px' }}>
      <PrintHeader />
      
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderBottom: '6px solid #2e7d32' }}>
        {/* Header */}
        <div style={{ background: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>

          <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold' }}>{t("Add New Receive")}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/account/receive-list')} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', cursor: 'pointer' }}>
              <List size={14} /> {t("Receive List")}
            </button>
            <button onClick={() => navigate('/settings/income-category')} style={{ background: '#818cf8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', cursor: 'pointer' }}>
              <Layers size={14} /> {t("Receive Category")}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '30px 40px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Client Select */}
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
                    onChange={(val) => setFormData(prev => ({ ...prev, clientId: val }))}
                    placeholder={t("Select Client")}
                    onAddClick={() => setIsClientModalOpen(true)}
                  />
                  {formData.clientId && (
                    <div style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', marginTop: '8px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-main)' }}>{t("Due:")}</span>
                      <span style={{
                        color: dueAmount > 0 ? '#dc2626' : '#059669',
                        background: dueAmount > 0 ? '#fee2e2' : '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: 'var(--fs-12, 12px)',
                        fontWeight: 'bold'
                      }}>
                        ৳ {Number(dueAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Account Select */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
                  <select 
                    name="accountId" 
                    value={formData.accountId} 
                    onChange={handleChange}
                    required
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 'var(--fs-14, 14px)', appearance: 'none', background: 'transparent' }}
                  >
                    <option value="">{t("Select Account")}</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {formData.accountId && (
                    <button type="button" onClick={() => clearField('accountId')} style={{ background: 'white', border: 'none', borderLeft: '1px solid #93c5fd', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => navigate('/account/account-create')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>

                {/* Amount Input */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 16px', fontWeight: 'bold', color: '#1e293b' }}>$</div>
                  <input 
                    type="number" 
                    name="amount" 
                    placeholder={t("Amount")} 
                    value={formData.amount} 
                    onChange={handleChange}
                    required
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 'var(--fs-14, 14px)' }}
                  />
                </div>

                {/* SMS Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #93c5fd', borderRadius: '6px', padding: '12px 16px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-14, 14px)', fontWeight: '500' }}>
                    <div style={{ background: '#1e293b', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: 'var(--fs-10, 10px)' }}>💬</span>
                    </div>
                    {t("SMS")}
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                    <input type="checkbox" name="sms" checked={formData.sms} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.sms ? '#3b82f6' : '#cbd5e1', borderRadius: '34px', transition: '.4s' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: formData.sms ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
                    </span>
                  </label>
                </div>

              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Date Input */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t("📅 Date")}
                  </div>
                  <CustomDatePicker 
                     
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', outline: 'none' }} 
                  />
                </div>

                {/* Description Input */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                  <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}><FileText size={18} color="#1e293b" /></div>
                  <input 
                    type="text" 
                    name="description" 
                    placeholder={t("Receive Description in a short note")} 
                    value={formData.description} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 'var(--fs-14, 14px)' }}
                  />
                </div>

                {/* Category Select */}
                <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden' }}>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 'var(--fs-14, 14px)', appearance: 'none', background: 'transparent' }}
                  >
                    <option value="">{t("Select Category")}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formData.category && (
                    <button type="button" onClick={() => clearField('category')} style={{ background: 'white', border: 'none', borderLeft: '1px solid #93c5fd', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => navigate('/settings/income-category')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>

              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {submitting ? t("Adding...") : t("Add New Receive")}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/account/receive-list')} 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}
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
            setClients(prev => [...prev, newClient]);
          }
          if (newClient?.id || newClient?.uuid) {
            setFormData(prev => ({ ...prev, clientId: newClient.id || newClient.uuid }));
          }
        }}
      />

      {/* Money Receipt Modal */}
      {receiptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', width: '800px', maxWidth: '95%', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', color: '#1e293b' }}>{t("Money Receipt")}</h3>
              <button onClick={() => { setReceiptModal(null); window.location.reload(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'white' }} id="print-receipt-section">
              <PrintHeader showOnScreen={true} />
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 'var(--fs-16, 16px)', margin: '16px 0', borderBottom: '1px solid black', paddingBottom: '4px' }}>
                জমা রশিদ
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: 'var(--fs-14, 14px)' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black', width: '40%' }}>Receipt No</td>
                    <td style={{ padding: '8px', border: '1px solid black', width: '60%' }}>
                      #{receiptModal.receipt_no || receiptModal.receipt_number || (receiptModal.id ? `RCP-${String(receiptModal.id).replace(/\D/g, '').padEnd(6, '0').slice(0, 6)}` : 'N/A')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>তারিখ</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.date ? String(receiptModal.date).split('T')[0] : ''}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>নাম</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.client_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>মোবাইল</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.client?.phone || receiptModal.client?.mobile || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>ঠিকানা</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.client?.address || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>বিবরণ</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.reference || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>জমা টাকা</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{Number(receiptModal.amount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>বাকি</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.due}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
              <button onClick={handlePrintReceipt} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Printer size={16} /> Print
              </button>
              <button onClick={() => { setReceiptModal(null); window.location.reload(); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <X size={16} /> Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveCreate;
