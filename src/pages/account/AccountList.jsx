import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { ArrowLeft, Play, Printer, RotateCcw, Trash2, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';

const AccountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fallbackAccounts = [
    { id: '1', name: 'Cash Account', account_number: 'CASH-001', balance: '25000.00', status: 1 },
    { id: '2', name: 'Dutch Bangla Bank (DBBL)', account_number: '120.105.45678', balance: '185000.00', status: 1 },
    { id: '3', name: 'Islami Bank Bangladesh', account_number: '2050.189.7766', balance: '94000.00', status: 1 },
    { id: '4', name: 'bKash Merchant', account_number: '01711223344', balance: '12500.00', status: 1 },
  ];

  const fetchAccounts = async (query = '') => {
    try {
      setLoading(true);
      const res = await accountingService.getAccounts(query);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setAccounts(data.length > 0 ? data : fallbackAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts(fallbackAccounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAccounts(searchTerm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await accountingService.deleteAccount(id);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="premium-card">
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>Account List</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go Back</button>
          <Link to="/account/account-create" style={{ textDecoration: 'none' }}>
            <button className="btn-green">Add New Account</button>
          </Link>
          <button className="btn-youtube">
            <div style={{ display: 'flex', alignItems: 'center', background: '#ff0000', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              <Play size={16} fill="white" style={{ marginRight: '6px' }} /> YouTube
            </div>
          </button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '24px' }}>
        <PrintHeader />
        
        {/* Search and Table Controls */}
        <div className="table-header-controls" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="Search name or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            </div>
            <button type="submit" className="btn-blue" style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 'bold' }}>
              Search
            </button>
          </form>

          <div className="table-controls-right" style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>Excel</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>CSV</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>PDF</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => window.print()}><Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.print')}</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => { setSearchTerm(''); fetchAccounts(''); }}><RotateCcw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.reset')}</button>
          </div>
        </div>

        <table className="custom-table" style={{ border: '1px solid #d1d5db', width: '100%' }}>
          <thead>
            <tr style={{ background: '#718096', color: 'white' }}>
              <th style={{ width: '80px', textAlign: 'left', padding: '12px' }}>ID NO</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>TITLE</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>ACCOUNT NUMBER</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>BALANCE</th>
              <th style={{ width: '100px', textAlign: 'center', padding: '12px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading accounts...</td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No accounts found.</td>
              </tr>
            ) : (
              accounts.map((acc, idx) => (
                <tr key={acc.id || idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#4b5563' }}>#{acc.id || idx + 1}</td>
                  <td style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>{acc.name}</td>
                  <td style={{ textAlign: 'left', padding: '12px', color: '#4b5563' }}>{acc.account_number || acc.accountNumber || 'Cash'}</td>
                  <td style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', color: '#059669' }}>
                    ৳ {Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <button onClick={() => handleDelete(acc.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountList;
