import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Printer, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';

const ReceiveList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [receives, setReceives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const fetchReceives = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getReceives(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setReceives(data);
    } catch (error) {
      console.error('Error fetching receives:', error);
      setReceives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceives();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReceives();
  };

  const handleClear = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setTimeout(() => {
      fetchReceives();
    }, 50);
  };

  return (
    <div className="premium-card">
      <div className="premium-body" style={{ padding: '32px' }}>
        <PrintHeader />

        {/* Title and Top Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Receive List (Deposits)</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Live customer payments and deposit records</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-green" onClick={() => navigate('/account/receive-create')}>
              <Plus size={16} /> Add New Receive
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <form onSubmit={handleFilter} className="filter-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
          <div>
            <label className="filter-label">Search Reference or Client</label>
            <input 
              type="text" 
              className="input-outline" 
              placeholder="Search reference or text..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div>
            <label className="filter-label">From Date</label>
            <input 
              type="date" 
              className="input-outline" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div>
            <label className="filter-label">To Date</label>
            <input 
              type="date" 
              className="input-outline" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn-blue" style={{ padding: '10px 16px', fontWeight: 'bold' }}>
              <Search size={14} style={{ marginRight: '4px', display: 'inline' }} /> Filter
            </button>
            <button type="button" onClick={handleClear} className="btn-secondary" style={{ padding: '10px 16px' }}>
              Reset
            </button>
          </div>
        </form>

        {/* Table Section */}
        <div className="table-header-controls" style={{ marginBottom: '16px' }}>
          <div className="show-entries">
            Total Records: <strong>{receives.length}</strong>
          </div>
          <div className="table-controls-right">
            <button className="btn-blue" onClick={() => window.print()}><Printer size={16} /> {t('common.print')}</button>
            <button className="btn-blue" onClick={fetchReceives}><RotateCcw size={16} /> Reload</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th>SL</th>
                <th>DATE</th>
                <th>RECEIPT / REF</th>
                <th>TRANSACTION</th>
                <th>CLIENT</th>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>AMOUNT (৳)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading live receives...</td>
                </tr>
              ) : receives.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No receives found for the criteria.</td>
                </tr>
              ) : (
                receives.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ fontWeight: '600', color: '#64748b' }}>{idx + 1}</td>
                    <td>{row.date ? String(row.date).split('T')[0] : 'N/A'}</td>
                    <td style={{ fontWeight: '600' }}>{row.reference || row.receipt_no || `RCP-${row.id}`}</td>
                    <td><span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{row.transaction_type || 'Deposit'}</span></td>
                    <td style={{ fontWeight: '500' }}>{row.client_name || row.client_id || (row.client ? `Client #${row.client}` : 'General / Walk-in')}</td>
                    <td>{row.account_name || row.account || 'Main Cash'}</td>
                    <td style={{ color: '#4b5563' }}>{row.description || row.reference || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                      ৳ {Number(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceiveList;
