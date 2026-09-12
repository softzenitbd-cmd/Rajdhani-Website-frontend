import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RotateCcw, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';

const TransferList = () => {
  const { t } = useTranslation();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getTransfers(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setTransfers(data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchTransfers();
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setTimeout(() => {
      fetchTransfers();
    }, 50);
  };

  return (
    <div className="premium-card">
      <div className="premium-body" style={{ padding: '20px 32px 40px' }}>
        <PrintHeader />

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Transfer List</h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Account-to-account fund transfer history</span>
          </div>
          <Link to="/account/transfer-create" style={{ textDecoration: 'none' }}>
            <button className="btn-green" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> New Fund Transfer
            </button>
          </Link>
        </div>

        {/* Filter Section */}
        <form onSubmit={handleFilter} className="filter-grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
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

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: '#4b5563' }}>
            Total Transfers: <strong>{transfers.length}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-blue" onClick={() => window.print()}><Printer size={14} /> Print</button>
            <button className="btn-blue" onClick={fetchTransfers}><RotateCcw size={14} /> Reload</button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th style={{ width: '60px' }}>SL</th>
                <th>DATE</th>
                <th>FROM ACCOUNT</th>
                <th>TO ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>AMOUNT (৳)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading transfers...</td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No transfers recorded.</td>
                </tr>
              ) : (
                transfers.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ fontWeight: '600', color: '#64748b' }}>{idx + 1}</td>
                    <td>{row.date ? String(row.date).split('T')[0] : 'N/A'}</td>
                    <td style={{ fontWeight: '600', color: '#dc2626' }}>{row.from_account_name || row.from_account || 'Cash'}</td>
                    <td style={{ fontWeight: '600', color: '#059669' }}>{row.to_account_name || row.to_account || 'Bank'}</td>
                    <td style={{ color: '#4b5563' }}>{row.description || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
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

export default TransferList;
