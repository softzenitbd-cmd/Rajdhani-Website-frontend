import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RotateCcw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';

const Statement = () => {
  const { t } = useTranslation();

  const [statements, setStatements] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  useEffect(() => {
    loadAccounts();
    fetchStatements();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await accountingService.getAccounts();
      const data = Array.isArray(res) ? res : (res?.results || []);
      setAccounts(data);
    } catch (e) {
      console.error('Error loading accounts:', e);
    }
  };

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedType) filters.type = selectedType;
      if (selectedAccount) filters.account = selectedAccount;
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

  const handleFilter = (e) => {
    e.preventDefault();
    fetchStatements();
  };

  const handleClear = () => {
    setSelectedType('');
    setSelectedAccount('');
    setFromDate('');
    setToDate('');
    setTimeout(() => {
      fetchStatements();
    }, 50);
  };

  return (
    <div className="premium-card">
      <div className="premium-body" style={{ padding: '24px 32px 40px' }}>
        <PrintHeader />
        
        {/* Top Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Account Statement & Unified Ledger</h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Complete log of all deposits, expenses, and inter-account transfers</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/account/account-create" style={{ textDecoration: 'none' }}>
              <button className="btn-green" style={{ padding: '8px 16px', fontWeight: 'bold' }}>Add Account</button>
            </Link>
            <Link to="/account/account-list" style={{ textDecoration: 'none' }}>
              <button className="btn-blue" style={{ padding: '8px 16px', fontWeight: 'bold' }}>Account List</button>
            </Link>
          </div>
        </div>

        {/* Filter Section */}
        <form onSubmit={handleFilter} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr auto', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <label className="filter-label">Filter by Account</label>
            <select className="input-outline" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} style={{ width: '100%', padding: '10px' }}>
              <option value="">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="filter-label">Filter by Type</label>
            <select className="input-outline" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: '100%', padding: '10px' }}>
              <option value="">All (Deposit & Expense)</option>
              <option value="deposit">Deposit Only (In)</option>
              <option value="cost">Cost Only (Out)</option>
            </select>
          </div>

          <div>
            <label className="filter-label">Search Date</label>
            <div style={{ display: 'flex' }}>
              <input type="date" className="input-outline" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ borderRadius: '8px 0 0 8px', borderRight: 'none', width: '50%', padding: '10px' }} />
              <input type="date" className="input-outline" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ borderRadius: '0 8px 8px 0', width: '50%', padding: '10px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn-blue" style={{ padding: '10px 18px', fontWeight: 'bold' }}>
              <Search size={14} style={{ marginRight: '4px', display: 'inline' }} /> Filter
            </button>
            <button type="button" onClick={handleClear} className="btn-secondary" style={{ padding: '10px 14px' }}>
              Reset
            </button>
          </div>
        </form>

        {/* Table Controls */}
        <div className="table-header-controls" style={{ marginBottom: '16px' }}>
          <div className="show-entries">
            Total Statement Records: <strong>{statements.length}</strong>
          </div>
          <div className="table-controls-right" style={{ gap: '4px' }}>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => window.print()}><Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.print')}</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={fetchStatements}><RotateCcw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Reload</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ border: '1px solid #d1d5db', width: '100%' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th style={{ width: '50px' }}>SL</th>
                <th>DATE</th>
                <th>TYPE</th>
                <th>ACCOUNT</th>
                <th>SOURCE / PARTY</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'right', color: '#86efac' }}>CREDIT (+)</th>
                <th style={{ textAlign: 'right', color: '#fca5a5' }}>DEBIT (-)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading statement ledger...</td>
                </tr>
              ) : statements.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No records found for the selected filter.</td>
                </tr>
              ) : (
                statements.map((row, idx) => {
                  const isDeposit = String(row.type).toUpperCase() === 'DEPOSIT';
                  return (
                    <tr key={row.id || idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ fontWeight: '600', color: '#6b7280' }}>{idx + 1}</td>
                      <td>{row.date}</td>
                      <td>
                        <span style={{
                          background: isDeposit ? '#dcfce7' : '#fee2e2',
                          color: isDeposit ? '#15803d' : '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {row.type} ({row.transaction_type || 'General'})
                        </span>
                      </td>
                      <td style={{ fontWeight: '500' }}>{row.account_name || 'Cash Account'}</td>
                      <td style={{ fontWeight: '500', color: '#3b82f6' }}>{row.source || '-'}</td>
                      <td style={{ color: '#4b5563' }}>{row.description || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                        {row.credit && row.credit !== '--' ? `৳ ${row.credit}` : '--'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                        {row.debit && row.debit !== '--' ? `৳ ${row.debit}` : '--'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Statement;
