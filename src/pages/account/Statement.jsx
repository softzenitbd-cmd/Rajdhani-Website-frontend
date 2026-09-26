import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Printer, RotateCcw, Plus, ArrowLeft, Scale } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import CustomDatePicker from '../../components/CustomDatePicker';
import { fmtDate } from '../../utils/apiHelpers';


const cell = { padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' };
const num = (v) => {
  if (v === undefined || v === null || v === '' || v === '--') return 0;
  return Number(String(v).replace(/[^0-9.-]/g, '')) || 0;
};
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Mirrors the original CRM "একাউন্ট বিবৃতি":
// toolbar (add / balance / back) → print header → client / account / type / date filters → ledger table
const Statement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [statements, setStatements] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [clientId, setClientId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    (async () => {
      try {
        const [accRes, cliRes] = await Promise.all([
          accountingService.getAccounts(),
          crmService.getClients({ page_size: 1000 }),
        ]);
        setAccounts(Array.isArray(accRes) ? accRes : (accRes?.results || []));
        setClients(Array.isArray(cliRes) ? cliRes : (cliRes?.results || []));
      } catch (e) {
        console.error('Error loading filters:', e);
      }
    })();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (type) filters.type = type;
      if (clientId) filters.client = clientId;
      if (accountId) filters.account = accountId;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getStatement(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setStatements(data);
    } catch (error) {
      console.error('Error fetching statement:', error);
      setStatements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [clientId, accountId, type, fromDate, toDate]);

  const handleClearFilter = () => {
    setClientId('');
    setAccountId('');
    setType('');
    setFromDate('');
    setToDate('');
  };

  // Running balance computed on the client
  const rows = useMemo(() => {
    let balance = 0;
    return statements.slice(0, limit).map((row) => {
      const credit = num(row.credit);
      const debit = num(row.debit);
      balance += credit - debit;
      return { ...row, credit, debit, balance };
    });
  }, [statements, limit]);

  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);

  const toolBtn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)' });
  const label = { display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' };

  return (
    <div style={{ background: 'white', minHeight: '100vh', padding: '20px' }}>
      {/* Top toolbar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={() => navigate('/account/account-create')} style={toolBtn('#059669')}><Plus size={14} /> {t("Add New")}</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/account/account-balance')} style={toolBtn('#16a34a')}><Scale size={14} /> {t("Account Balance")}</button>
          <button onClick={() => navigate(-1)} style={toolBtn('#1e293b')}><ArrowLeft size={14} /> {t("Go Back")}</button>
        </div>
      </div>

      <PrintHeader />
      <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-20, 20px)', fontWeight: 'bold', margin: '12px 0 20px' }}>{t("Account Statement")}</h2>

      {/* Filters */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: '20px', marginBottom: '16px' }}>
        <div>
          <label style={label}>{t("Search By Client")}</label>
          <SearchableSelect
            options={clients.map((c) => ({ value: c.id, label: c.name || c.company_name, searchValue: `${c.name || ''} ${c.phone || ''}` }))}
            value={clientId}
            onChange={(val) => setClientId(val)}
            placeholder={t("Select Client")}
          />
        </div>
        <div>
          <label style={label}>{t("Search By Account")}</label>
          <SearchableSelect
            options={accounts.map((a) => ({ value: a.id, label: a.name, searchValue: a.name }))}
            value={accountId}
            onChange={(val) => setAccountId(val)}
            placeholder={t("Select Account")}
          />
        </div>
        <div>
          <label style={label}>{t("Search By Type")}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none', background: 'white' }}>
            <option value="">{t("Choose one")}</option>
            <option value="deposit">{t("Deposit")}</option>
            <option value="cost">{t("Expense")}</option>
          </select>
        </div>
        <div>
          <label style={label}>{t("Search By Date")}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CustomDatePicker  value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
            <CustomDatePicker  value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button onClick={handleClearFilter} style={{ background: '#64748b', color: 'white', border: 'none', padding: '12px 0', width: '100%', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: 'var(--fs-15, 15px)' }}>
          {t("Clear Filter")}
        </button>
      </div>

      {/* Table Controls */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: 'var(--fs-14, 14px)' }}>
          {t("Show")}
          <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value) || 100)} style={{ width: '60px', margin: '0 8px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
          {t("entries")}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => window.print()} style={toolBtn('#3b82f6')}><Printer size={14} /> {t("Print")}</button>
          <button onClick={fetchStatements} style={toolBtn('#3b82f6')}><RotateCcw size={14} /> {t("Reset")}</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
          <thead>
            <tr style={{ background: '#94a3b8', color: 'white' }}>
              <th style={cell}>{t("SL")}</th>
              <th style={cell}>{t("DATE")}</th>
              <th style={cell}>{t("CLIENT / SUPPLIER")}</th>
              <th style={cell}>{t("TYPE")}</th>
              <th style={cell}>{t("ACCOUNT")}</th>
              <th style={cell}>{t("BANK")}</th>
              <th style={cell}>{t("DESCRIPTION")}</th>
              <th style={cell}>{t("CREDIT")}</th>
              <th style={cell}>{t("DEBIT")}</th>
              <th style={cell}>{t("BALANCE")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ ...cell, padding: '20px' }}>{t("Loading...")}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="10" style={{ ...cell, padding: '20px' }}>{t("No data available in table")}</td></tr>
            ) : (
              rows.map((row, idx) => {
                const isDeposit = String(row.type).toLowerCase() === 'deposit';
                return (
                  <tr key={row.id || idx}>
                    <td style={cell}>{idx + 1}</td>
                    <td style={cell}>{row.date ? fmtDate(row.date) : ''}</td>
                    <td style={cell}>{row.source || row.client_name || row.supplier_name || ''}</td>
                    <td style={cell}>
                      <span style={{ 
                        background: String(row.transaction_type || row.type).toLowerCase().match(/payment|deposit|receive|স্টাফ|পেমেন্ট/) ? '#10b981' : String(row.transaction_type || row.type).toLowerCase().match(/expense|খরচ/) ? '#f43f5e' : '#3b82f6', 
                        color: 'black', 
                        padding: '4px 10px', 
                        borderRadius: '4px', 
                        fontSize: 'var(--fs-12, 12px)', 
                        fontWeight: 'bold' 
                      }}>
                        {t(row.transaction_type || row.type)}
                      </span>
                    </td>
                    <td style={cell}>{row.account_name || ''}</td>
                    <td style={cell}>{row.bank_name || row.bank || ''}</td>
                    <td style={cell}>{row.description || ''}</td>
                    <td style={{ ...cell, color: '#10b981', fontWeight: '600' }}>{row.credit ? fmt(row.credit) : '0'}</td>
                    <td style={{ ...cell, color: '#ef4444', fontWeight: '600' }}>{row.debit ? fmt(row.debit) : '0'}</td>
                    <td style={{ ...cell, color: 'black', fontWeight: 'bold' }}>{fmt(row.balance)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
              <td colSpan="7" style={cell}>{t("Total")}</td>
              <td style={{ ...cell, color: '#10b981' }}>{fmt(totalCredit)}</td>
              <td style={{ ...cell, color: '#ef4444' }}>{fmt(totalDebit)}</td>
              <td style={{ ...cell, color: 'black', fontWeight: 'bold' }}>{fmt(totalCredit - totalDebit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ marginTop: '10px', fontSize: 'var(--fs-13, 13px)', color: '#475569' }}>
        {t("Showing {{from}} to {{to}} of {{total}} entries", { from: rows.length ? 1 : 0, to: rows.length, total: statements.length })}
      </div>
    </div>
  );
};

export default Statement;
