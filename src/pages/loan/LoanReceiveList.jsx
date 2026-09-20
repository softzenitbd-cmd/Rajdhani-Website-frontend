import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Printer, RotateCcw, Edit, Trash2, Calendar, DollarSign, FileText, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import { accountingService } from '../../services/accountingService';
import SearchableSelect from '../../components/SearchableSelect';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import CustomDatePicker from '../../components/CustomDatePicker';
import { exportVisibleTable } from '../../utils/tableExport';

const normalizeDate = (d) => {
  if (!d) return '';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
    const [day, month, year] = s.split('-');
    return `${year}-${month}-${day}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [day, month, year] = s.split('/');
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return s;
};

const formatDisplayDate = (d) => {
  if (!d) return '-';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, day] = s.slice(0, 10).split('-');
    return `${day}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.replace(/\//g, '-');
  const dateObj = new Date(s);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${day}-${m}-${y}`;
  }
  return s;
};

const LoanReceiveList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [rawLoans, setRawLoans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entries, setEntries] = useState(100);
  const [loading, setLoading] = useState(true);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editFormData, setEditFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchClients();
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getIncomeCategories()
      ]);
      setBankAccounts(Array.isArray(accRes) ? accRes : (accRes?.results || accRes?.data || []));
      setCategories(Array.isArray(catRes) ? catRes : (catRes?.results || catRes?.data || []));
    } catch (error) {
      console.error("Error loading categories/accounts:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await loanService.getLoanAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients for filter:", error);
      setClients([]);
    }
  };

  // 2. Fetch Loans when filters change
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedClient) filters.loan_account = selectedClient;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await loanService.getLoanReceives(filters).catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      setRawLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching loan receives:", error);
      setRawLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [selectedClient, fromDate, toDate]);

  const handleClearFilter = () => {
    setSelectedClient('');
    setFromDate('');
    setToDate('');
  };

  const selectedClientObj = useMemo(() => {
    if (!selectedClient) return null;
    return clients.find(c => String(c.id || c.uuid) === String(selectedClient)) || null;
  }, [clients, selectedClient]);

  // 3. Client-side robust filtering
  const visibleLoans = useMemo(() => {
    if (!Array.isArray(rawLoans)) return [];

    const normFrom = normalizeDate(fromDate);
    const normTo = normalizeDate(toDate);

    return rawLoans.filter(loan => {
      // Client filter
      if (selectedClient) {
        const clientRef = loan.loan_account;
        const cId = String(clientRef?.id || clientRef?.uuid || clientRef || loan.account_id || loan.client_id || '');
        const matchId = cId && cId === String(selectedClient);
        
        let matchName = false;
        if (selectedClientObj?.name) {
          const nameToMatch = selectedClientObj.name.toLowerCase();
          const lName = (loan.clientName || clientRef?.name || loan.loan_account_name || loan.source || '').toLowerCase();
          if (lName.includes(nameToMatch)) matchName = true;
        }

        if (!matchId && !matchName) return false;
      }

      // Date range filter
      const loanDateStr = normalizeDate(loan.date || loan.created_at);
      if (normFrom && loanDateStr && loanDateStr < normFrom) return false;
      if (normTo && loanDateStr && loanDateStr > normTo) return false;

      return true;
    });
  }, [rawLoans, selectedClient, selectedClientObj, fromDate, toDate]);

  const displayedLoans = useMemo(() => {
    return visibleLoans.slice(0, entries);
  }, [visibleLoans, entries]);

  const totalAmount = useMemo(() => {
    return visibleLoans.reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);
  }, [visibleLoans]);

  const handleDelete = async (loan) => {
    const isConfirmed = await confirm(t("Delete this record?"), t("Are you sure you want to delete this receive record?"));
    if (!isConfirmed) return;
    try {
      await loanService.deleteLoanReceive(loan.id || loan.uuid);
      toast.success(t("Deleted"));
      fetchLoans();
    } catch (e) {
      toast.error(e.message || t("Delete failed"));
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.clientId || !editFormData.accountId || !editFormData.amount) {
      toast.error(t("Please select Loan Account, Receiving Account, and enter Amount."));
      return;
    }
    try {
      setSaving(true);
      await loanService.updateLoanReceive(editFormData.id, {
        loan_account: editFormData.clientId,
        account: editFormData.accountId,
        amount: String(editFormData.amount),
        description: editFormData.note,
        ...(editFormData.categoryId ? { category: editFormData.categoryId } : {}),
        date: editFormData.date,
      });
      toast.success(t("Loan Receive updated successfully!"));
      setEditing(null);
      setEditFormData(null);
      fetchLoans();
    } catch (err) {
      toast.error(err?.message || t("Update failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      {editing && editFormData && (
        <div className="premium-card" style={{ marginBottom: '24px' }}>
          <div className="premium-header">
            <h2 className="premium-title">{t("Update Loan")} | ID No: {String(editing.receiptNo || editing.receipt_no || editing.id || '').substring(0, 8)}</h2>
          </div>
          <div className="premium-body" style={{ background: 'white' }}>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-row">
                <div className="form-col">
                  <SearchableSelect
                    options={clients.map(acc => ({ value: String(acc.id || acc.uuid), label: `${acc.name} - ${acc.phone}`, searchValue: `${acc.name} ${acc.phone}` }))}
                    value={editFormData.clientId}
                    onChange={(val) => setEditFormData(prev => ({ ...prev, clientId: val }))}
                    placeholder={t('common.select_client')}
                  />
                  {editFormData.clientId && (
                    <div style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '4px', color: '#1e293b' }}>
                      Advance: {(() => {
                        const sObj = clients.find(c => String(c.id || c.uuid) === String(editFormData.clientId));
                        return sObj ? (sObj.previous_due || sObj.balance || sObj.advance || 0) : 0;
                      })()}
                    </div>
                  )}
                </div>
                <div className="form-col" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                    <Calendar size={12} /> {t("Date")}
                  </div>
                  <CustomDatePicker name="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', outline: 'none', background: 'white' }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <SearchableSelect
                    options={(bankAccounts || []).map(acc => ({ value: String(acc.id || acc.uuid), label: acc.name, searchValue: acc.name }))}
                    value={editFormData.accountId}
                    onChange={(val) => setEditFormData(prev => ({ ...prev, accountId: val }))}
                    placeholder={t("Select Account")}
                  />
                </div>
                <div className="form-col">
                  <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                    <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                      <FileText size={18} color="#1e293b" />
                    </div>
                    <input type="text" name="note" placeholder={t("Receive Description in a short note")} value={editFormData.note} onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })} style={{ flex: 1, padding: '12px 16px 12px 0', border: 'none', outline: 'none', fontSize: 'var(--fs-14, 14px)' }} />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', alignItems: 'center' }}>
                    <div style={{ padding: '0 16px', fontWeight: 'bold', color: '#1e293b' }}>
                      <DollarSign size={18} color="#1e293b" />
                    </div>
                    <input type="number" name="amount" placeholder={t("Amount")} value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} required style={{ flex: 1, padding: '12px 16px 12px 0', border: 'none', outline: 'none', fontSize: 'var(--fs-14, 14px)' }} />
                  </div>
                </div>
                <div className="form-col">
                  <SearchableSelect
                    options={categories.map(c => ({ value: String(c.id || c.uuid), label: c.name, searchValue: c.name }))}
                    value={editFormData.categoryId}
                    onChange={(val) => setEditFormData(prev => ({ ...prev, categoryId: val }))}
                    placeholder={t("Select Categories")}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col" style={{ flex: 'none', width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #93c5fd', borderRadius: '6px', padding: '12px 16px', background: 'white', height: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-14, 14px)', fontWeight: '500', color: '#334155' }}>
                      <MessageSquare size={18} color="#1e293b" />
                      {t("SMS")}
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', margin: 0 }}>
                      <input type="checkbox" checked={editFormData.sms} onChange={(e) => setEditFormData({ ...editFormData, sms: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: editFormData.sms ? '#3b82f6' : '#cbd5e1', borderRadius: '34px', transition: '.4s' }}>
                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: editFormData.sms ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary" style={{ background: '#0ea5e9', padding: '8px 24px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px' }} disabled={saving}>
                  {saving ? t("Processing...") : t("Update receive")}
                </button>
                <button type="button" className="btn-danger" onClick={() => { setEditing(null); setEditFormData(null); }} style={{ background: '#ef4444', padding: '8px 24px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px' }}>
                  {t("close")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PrintHeader />
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Loan Receive List")}</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'normal', color: '#333', margin: 0 }}>{t("Loan Receive List")}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/loan/receive-create')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={15} /> {t("Add Loan Receive")}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px', maxWidth: '880px', margin: '0 auto 24px auto' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '6px', color: '#334155', display: 'block' }}>{t("Search By Client")}</label>
            <div style={{ height: '42px' }}>
              <SearchableSelect
                options={[
                  { value: '', label: `-- ${t("All Clients")} --`, searchValue: 'all' },
                  ...(clients || []).map(c => ({ value: String(c.id || c.uuid), label: `${c.name} (${c.phone || '-'})`, searchValue: `${c.name} ${c.phone}` }))
                ]}
                value={selectedClient}
                onChange={(val) => setSelectedClient(val)}
                placeholder={t("Select Client")}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '6px', color: '#334155', display: 'block' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: 'white', height: '42px', alignItems: 'center' }}>
              <CustomDatePicker style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <CustomDatePicker style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <button className="btn btn-outline" onClick={handleClearFilter} style={{ height: '42px', width: '100%', background: '#64748b', color: 'white', justifyContent: 'center', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={15} /> {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t("Show")} 
            <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-blue" onClick={() => exportVisibleTable('xlsx', 'Loan_Receive_List')} style={{ background: '#059669', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <FileSpreadsheet size={15} /> {t("Excel")}
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: '#4F46E5', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Printer size={15} /> {t("Print")}
            </button>
            <button className="btn" onClick={handleClearFilter} style={{ background: '#64748b', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <RotateCcw size={15} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th width="50" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("SL")}</th>
                <th width="120" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("DATE")}</th>
                <th width="140" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("RECEIPT NO")}</th>
                <th width="200" style={{ textAlign: 'left', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("CLIENT")}</th>
                <th width="140" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("TYPE")}</th>
                <th width="220" style={{ textAlign: 'left', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("DESCRIPTION")}</th>
                <th width="130" style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("AMOUNT")}</th>
                <th width="100" style={{ textAlign: 'center', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {displayedLoans.map((loan, index) => {
                const amt = Number(loan?.amount || 0);
                const displayAmt = isNaN(amt) ? '0.00' : amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const clientObj = typeof loan?.loan_account === 'object' ? loan.loan_account : null;
                const clientName = loan?.clientName || clientObj?.name || loan?.loan_account_name || (loan.source ? loan.source.replace(/^Loan Account:\s*/i, '') : '-');
                const clientPhone = loan?.clientNumber || clientObj?.phone || loan?.loan_account_phone || '-';
                const rawReceipt = String(loan.receiptNo || loan.receipt_no || (index + 1).toString().padStart(4, '0'));

                return (
                  <tr key={loan.id || index} style={{ background: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>{formatDisplayDate(loan.date || loan.created_at)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: 'var(--fs-12, 12px)' }} title={rawReceipt}>{rawReceipt}</td>
                    <td style={{ textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{clientName}</div>
                      {clientPhone && clientPhone !== '-' && (
                        <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b' }}>{clientPhone}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', background: '#dcfce7', color: '#166534' }}>
                        {loan.type || t("Loan Receive")}
                      </span>
                    </td>
                    <td style={{ textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)', color: '#334155' }}>{loan.description || loan.note || '-'}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#15803d' }}>{displayAmt} ৳</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button className="action-btn-sm edit" onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setEditing(loan);
                          setEditFormData({
                            id: loan.id || loan.uuid,
                            clientId: typeof loan.loan_account === 'object' ? loan.loan_account?.id : loan.loan_account || '',
                            accountId: typeof loan.account === 'object' ? loan.account?.id : loan.account || '',
                            date: loan.date || new Date().toISOString().split('T')[0],
                            amount: loan.amount || '',
                            note: loan.description || loan.note || '',
                            categoryId: typeof loan.category === 'object' ? loan.category?.id : loan.category || '',
                            sms: false
                          });
                        }} style={{ background: '#0284c7', border: 'none', borderRadius: '4px', padding: '5px 8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t("Edit")}>
                          <Edit size={13} />
                        </button>
                        <button className="action-btn-sm delete" onClick={() => handleDelete(loan)} style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '5px 8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t("Delete")}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t("Loading...")}</td>
                </tr>
              )}
              {!loading && displayedLoans.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t("No loans found.")}</td>
                </tr>
              )}
            </tbody>
            {displayedLoans.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan="6" style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', fontSize: 'var(--fs-13, 13px)', textTransform: 'uppercase' }}>
                    {t("Total")} :
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', color: '#15803d', fontSize: 'var(--fs-13, 13px)' }}>
                    {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanReceiveList;
