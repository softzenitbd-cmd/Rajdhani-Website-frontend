import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RotateCcw } from 'lucide-react';
import { loanService } from '../../services/loanService';
import SearchableSelect from '../../components/SearchableSelect';

const LoanStatement = () => {
  const { t } = useTranslation();

  const [statements, setStatements] = useState([]);
  const [clients, setClients] = useState([]);
  const location = useLocation();
  const [selectedClient, setSelectedClient] = useState(location.state?.clientId || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    fetchStatements();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await loanService.getLoanAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedClient) filters.loan_account = selectedClient;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await loanService.getLoanStatement(filters).catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setStatements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching loan statement:", err);
      setStatements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedClient('');
    setFromDate('');
    setToDate('');
    fetchStatements();
  };

  const selectedClientObj = clients.find(c => String(c.id) === String(selectedClient));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title - stylized */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Loan Statement")}</h2>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: 'var(--fs-14, 14px)' }}>
        <div>
          <div><span style={{ fontWeight: 'bold' }}>{t("Name :")}</span> {selectedClientObj?.name || t("All Clients")}</div>
          <div><span style={{ fontWeight: 'bold' }}>{t("Address :")}</span> {selectedClientObj?.address || '-'}</div>
          <div><span style={{ fontWeight: 'bold' }}>{t("Contact No :")}</span> {selectedClientObj?.phone || '-'}</div>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>{t("Date :")}</span> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'normal', color: '#333' }}>{t("Loan Statement")}</h2>
        <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.3fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px', maxWidth: '840px', margin: '0 auto 24px auto' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px', color: '#334155', display: 'block' }}>{t('common.search_by_client')}</label>
            <div style={{ height: '44px' }}>
              <SearchableSelect
                options={(clients || []).map(c => ({ value: c.id, label: `${c.name} (${c.phone || '-'})`, searchValue: `${c.name} ${c.phone}` }))}
                value={selectedClient}
                onChange={(val) => setSelectedClient(val)}
                placeholder={t('common.select_client')}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px', color: '#334155', display: 'block' }}>{t('common.search_by_date')}</label>
            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', height: '44px', alignItems: 'center' }}>
              <input type="date" style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <button className="btn btn-outline" onClick={handleClearFilter} style={{ height: '44px', width: '100%', background: '#64748b', color: 'white', justifyContent: 'center', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>100</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: '#4F46E5', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <Printer size={16} style={{ marginRight: '6px' }} /> {t("Print")}
            </button>
            <button className="btn" onClick={handleClearFilter} style={{ background: '#4F46E5', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <RotateCcw size={16} style={{ marginRight: '6px' }} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#a0aebf', color: 'white' }}>
                <th width="40" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("SL ↕")}</th>
                <th width="100" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("DATE")}</th>
                <th width="100" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("RECEIPT NO")}</th>
                <th width="200" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("CLIENT")}</th>
                <th width="200" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("DESCRIPTION")}</th>
                <th width="100" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("TYPE")}</th>
                <th width="100" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("LOAN RECEIVE")}</th>
                <th width="100" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("LOAN PAYMENT")}</th>
                <th width="100" style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-12, 12px)' }}>{t("BALANCE")}</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(statements) && statements.map((statement, index) => (
                <tr key={statement.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{statement.date || statement.created_at?.split('T')[0] || '-'}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{statement.receiptNo || statement.receipt_no || (index + 1).toString().padStart(4, '0')}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                    {statement.source || (
                      <>
                        <div>{t("Name:")} {statement.clientName || statement.loan_account?.name || '-'} | </div>
                        <div>{t("Number:")} {statement.clientNumber || statement.loan_account?.phone || '-'}</div>
                      </>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>{statement.description || statement.note || '-'}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{statement.transaction_type || statement.type || '-'}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{statement.credit || statement.loanReceive || '--'}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{statement.debit || statement.loanPayment || '--'}</td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>{statement.balance || '--'}</td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td>
                </tr>
              )}
              {!loading && (!Array.isArray(statements) || statements.length === 0) && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>{t("No statements found.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanStatement;

