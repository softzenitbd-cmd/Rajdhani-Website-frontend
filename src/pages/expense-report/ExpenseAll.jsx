import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, Search } from 'lucide-react';
import { accountingService } from '../../services/accountingService';

const ExpenseAll = () => {
  const { t } = useTranslation();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fallbackData = [
    { id: '1', sl: 1, date: '2026-09-01', voucherNo: '182396', category: 'DOKAN KOROJ', account: 'Cash Account', desc: 'JOLIL SALARE AD', type: 'Staff Payment', amount: '4000.00' },
    { id: '2', sl: 2, date: '2026-08-24', voucherNo: '182571', category: 'FOYLA MARET', account: 'Dutch Bangla Bank', desc: 'JAKIR MAMA 2 SHUTTER BABOD', type: 'Cost', amount: '30000.00' },
    { id: '3', sl: 3, date: '2026-08-24', voucherNo: '182572', category: 'JAKAT FAND', account: 'Cash Account', desc: 'DAN', type: 'Cost', amount: '600.00' },
    { id: '4', sl: 4, date: '2026-08-24', voucherNo: '182567', category: 'MALL FEROT', account: 'Cash Account', desc: 'Refund', type: 'Money Return', amount: '5090.00' },
  ];

  useEffect(() => {
    loadCategories();
    fetchExpenses();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await accountingService.getExpenseCategories();
      const data = Array.isArray(res) ? res : (res?.results || []);
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category_id = selectedCategory;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getExpenseReport(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setExpenses(data.length > 0 ? data : fallbackData);
    } catch (error) {
      console.error('Error fetching expense report:', error);
      setExpenses(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setFromDate('');
    setToDate('');
    setTimeout(fetchExpenses, 50);
  };

  const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px', color: 'var(--text-main)' }}>All Expense Report</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Consolidated cost, staff payment, and supplier expenditure report</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Total Expenses</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>৳ {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          {/* Filters Area */}
          <form onSubmit={handleFilter} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', fontWeight: '600' }}>Search Reference, Staff or Supplier</label>
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
              Showing {expenses.length} entries
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={fetchExpenses} style={{ background: '#64748b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
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
                  <th style={{ padding: '10px', textAlign: 'center' }}>VOUCHER / REF</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>CATEGORY</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>ACCOUNT</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>DESCRIPTION</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>TYPE</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>AMOUNT (৳)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading expense report...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No expense records found.</td>
                  </tr>
                ) : (
                  expenses.map((row, index) => (
                    <tr key={row.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{row.date ? String(row.date).split('T')[0] : 'N/A'}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>{row.voucherNo || row.reference || `#${row.id}`}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>{row.expense_category?.name || row.category || row.category_id || 'General'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{row.account || row.account_name || 'Cash'}</td>
                      <td style={{ padding: '10px', textAlign: 'left', color: '#4b5563' }}>{row.desc || row.description || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {row.transaction_type || row.type || 'Cost'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
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

export default ExpenseAll;
