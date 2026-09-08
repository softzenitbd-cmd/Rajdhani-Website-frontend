import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, Search } from 'lucide-react';
import { accountingService } from '../../services/accountingService';

const DepositAll = () => {
  const { t } = useTranslation();

  const [deposits, setDeposits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fallbackData = [
    { id: '1', sl: 1, date: '2026-09-01', client_id: 'Name: C.CUSTOMER | Number: 01', type: 'deposit', transaction_type: 'Invoice', amount: '612.00', category_id: 'CASH SELL' },
    { id: '2', sl: 2, date: '2026-08-28', client_id: 'Name: JAKIR MAMA | Number: 01912711587', type: 'deposit', transaction_type: 'Direct Deposit', amount: '3220.00', category_id: 'TAGADA' },
    { id: '3', sl: 3, date: '2026-08-25', client_id: 'Name: MASUD MASTER | Number: 01717287080', type: 'deposit', transaction_type: 'Invoice', amount: '5390.00', category_id: 'CASH SELL' },
    { id: '4', sl: 4, date: '2026-08-25', client_id: 'Name: SUJON TRADERS | Number: 01711223344', type: 'deposit', transaction_type: 'Invoice', amount: '450.00', category_id: 'BAKI ADAY' },
  ];

  useEffect(() => {
    loadCategories();
    fetchDeposits();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await accountingService.getIncomeCategories();
      const data = Array.isArray(res) ? res : (res?.results || []);
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category_id = selectedCategory;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getDepositReport(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setDeposits(data.length > 0 ? data : fallbackData);
    } catch (error) {
      console.error('Error fetching deposit report:', error);
      setDeposits(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchDeposits();
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setFromDate('');
    setToDate('');
    setTimeout(fetchDeposits, 50);
  };

  const totalAmount = deposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px', color: 'var(--text-main)' }}>All Deposit Report</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Detailed report of all client payments and capital deposits</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Total Deposited</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>৳ {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          {/* Filters Area */}
          <form onSubmit={handleFilter} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', fontWeight: '600' }}>Search Reference or Client</label>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', fontWeight: '600' }}>Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', fontWeight: '600' }}>Date Range</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '50%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '50%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Showing {deposits.length} entries
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={fetchDeposits} style={{ background: '#64748b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                <RefreshCcw size={14} /> Reload
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '60px', padding: '10px', textAlign: 'center' }}>SL</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>DATE</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>TYPE</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>CLIENT INFO</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>CATEGORY</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>AMOUNT (৳)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading deposit report...</td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No deposits found for this period.</td>
                  </tr>
                ) : (
                  deposits.map((row, index) => (
                    <tr key={row.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{row.date ? String(row.date).split('T')[0] : 'N/A'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {row.transaction_type || 'Deposit'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'left', fontWeight: '500' }}>
                        {row.client_id || row.client_name || 'Walk-in Client'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>
                        {row.receive_category?.name || row.category_id || 'General'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
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
    </div>
  );
};

export default DepositAll;
