import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Printer, RotateCcw, Edit, Trash2, Calendar, DollarSign, FileText, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import { accountingService } from '../../services/accountingService';
import SearchableSelect from '../../components/SearchableSelect';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import CustomDatePicker from '../../components/CustomDatePicker';


const LoanReceiveList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

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
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editFormData, setEditFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchLoans();
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getIncomeCategories()
      ]);
      setBankAccounts(Array.isArray(accRes) ? accRes : (accRes?.results || []));
      setCategories(Array.isArray(catRes) ? catRes : (catRes?.results || []));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await loanService.getLoanAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients for filter:", error);
      setClients([]);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedClient) filters.loan_account = selectedClient;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await loanService.getLoanReceives(filters).catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching loan receives:", error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchLoans();
  };

  const handleClearFilter = () => {
    setSelectedClient('');
    setFromDate('');
    setToDate('');
    fetchLoans();
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
                    options={clients.map(acc => ({ value: acc.id, label: `${acc.name} - ${acc.phone}`, searchValue: `${acc.name} ${acc.phone}` }))}
                    value={editFormData.clientId}
                    onChange={(val) => setEditFormData(prev => ({ ...prev, clientId: val }))}
                    placeholder={t('common.select_client')}
                  />
                  {editFormData.clientId && (
                    <div style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '4px', color: '#1e293b' }}>
                      Advance: {(() => {
                        const selectedClientObj = clients.find(c => String(c.id) === String(editFormData.clientId) || String(c.uuid) === String(editFormData.clientId));
                        return selectedClientObj ? (selectedClientObj.previous_due || selectedClientObj.balance || selectedClientObj.advance || 0) : 0;
                      })()}
                    </div>
                  )}
                </div>
                <div className="form-col" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                    <Calendar size={12} /> {t("Date")}
                  </div>
                  <CustomDatePicker  name="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', outline: 'none', background: 'white' }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <SearchableSelect
                    options={(bankAccounts || []).map(acc => ({ value: acc.id, label: acc.name, searchValue: acc.name }))}
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
                    options={categories.map(c => ({ value: c.id || c.uuid, label: c.name, searchValue: c.name }))}
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'normal', color: '#333', margin: 0 }}>{t("Loan List")}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={() => navigate('/loan/receive-create')} style={{ background: '#10b981', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            <Plus size={14} /> {t("Add Loan Receive")}
          </button>
          <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
             ▶ {t("YouTube")}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.3fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px', maxWidth: '840px', margin: '0 auto 24px auto' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px', color: '#334155', display: 'block' }}>{t('Search By Client')}</label>
            <div style={{ height: '44px' }}>
              <SearchableSelect
                options={(clients || []).map(c => ({ value: c.id, label: `${c.name} (${c.phone || '-'})`, searchValue: `${c.name} ${c.phone}` }))}
                value={selectedClient}
                onChange={(val) => setSelectedClient(val)}
                placeholder={t('Select Client')}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px', color: '#334155', display: 'block' }}>{t('Search By Date')}</label>
            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', height: '44px', alignItems: 'center' }}>
              <CustomDatePicker  style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <CustomDatePicker  style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <button onClick={handleClearFilter} style={{ height: '44px', width: '100%', background: '#718096', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)', cursor: 'pointer' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#334155' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} defaultValue="100">
              <option>100</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Printer size={14} style={{ marginRight: '6px' }} /> {t("Print")}
            </button>
            <button onClick={handleClearFilter} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', border: '1px solid #9ca3af' }}>
            <thead>
              <tr style={{ background: '#8e949d', color: 'white' }}>
                <th width="50" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("SL")}</th>
                <th width="120" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("DATE")}</th>
                <th width="140" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("RECEIPT NO")}</th>
                <th width="200" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("CLIENT")}</th>
                <th width="150" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("TYPE")}</th>
                <th width="250" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("DESCRIPTION")}</th>
                <th width="120" style={{ textAlign: 'center', borderRight: '1px solid #d1d5db', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("AMOUNT")}</th>
                <th width="100" style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(loans) && loans.map((loan, index) => {
                const amt = Number(loan?.amount || 0);
                const displayAmt = isNaN(amt) ? '0.00' : amt.toFixed(2);
                const clientObj = typeof loan?.loan_account === 'object' ? loan.loan_account : null;
                const clientName = loan?.clientName || clientObj?.name || loan?.loan_account_name || '-';
                const clientPhone = loan?.clientNumber || clientObj?.phone || loan?.loan_account_phone || '-';
                const rawReceipt = String(loan.receiptNo || loan.receipt_no || (index + 1).toString().padStart(4, '0'));
                const receiptDisplay = rawReceipt;

                return (
                  <tr key={loan.id || index} style={{ background: 'white', borderBottom: '1px solid #9ca3af' }}>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)' }}>{loan.date ? new Date(loan.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)' }} title={rawReceipt}>{receiptDisplay}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)' }}>
                      <div>{t("Name:")} {clientName}</div>
                      <div>{t("Number:")} {clientPhone}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)' }}>{loan.type || t("Loan Receive")}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)' }}>{loan.description || loan.note || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{displayAmt}</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => {
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
                        }} style={{ background: '#0ea5e9', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDelete(loan)} style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              {Array.isArray(loans) && loans.length > 0 && (
                <tr style={{ background: 'white', borderBottom: '1px solid #9ca3af', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af' }}>{t("Total")}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #9ca3af' }}>
                    {loans.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}></td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td>
                </tr>
              )}
              {!loading && (!Array.isArray(loans) || loans.length === 0) && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>{t("No entries found")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: 'var(--fs-12, 12px)', color: '#334155' }}>
          <div>{t("Showing")} {loans.length > 0 ? 1 : 0} {t("to")} {loans.length} {t("of")} {loans.length} {t("entries")}</div>
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer', color: '#64748b' }}>{t("Previous")}</button>
            <button style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}>1</button>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b' }}>{t("Next")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanReceiveList;

