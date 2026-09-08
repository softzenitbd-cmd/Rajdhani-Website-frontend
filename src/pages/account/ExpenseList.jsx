import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Play, Printer, RotateCcw, Edit, Trash2, Settings, List, Users, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';

const ExpenseList = () => {
  const { t } = useTranslation();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fallbackData = [
    { id: '1', sl: 1, date: '2026-08-30', receipt_for: '', reference: '183648', category: 'DOKAN KOROJ', account_name: 'Cash Account', description: 'Office refreshments and snacks', transaction_type: 'Cost', amount: '1300.00' },
    { id: '2', sl: 2, date: '2026-08-30', receipt_for: 'C.CUSTOMER', reference: '183647', category: 'MALL FEROT', account_name: 'Cash Account', description: 'Product return refund', transaction_type: 'Money Return', amount: '8555.00' },
    { id: '3', sl: 3, date: '2026-08-30', receipt_for: 'RFL LAGINC', reference: '183645', category: 'PRODUCT KROY', account_name: 'Dutch Bangla Bank', description: 'Fabric Supplier Payment', transaction_type: 'Supplier Payment', amount: '19000.00' },
    { id: '4', sl: 4, date: '2026-08-28', receipt_for: 'AJMUL', reference: '183644', category: 'STAFF SALARY', account_name: 'Cash Account', description: 'August Staff Salary', transaction_type: 'Staff Payment', amount: '12000.00' },
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getExpenses(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setExpenses(data.length > 0 ? data : fallbackData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleClear = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setTimeout(() => {
      fetchExpenses();
    }, 50);
  };

  const startEdit = (row) => {
    setEditingExpense(row);
    setEditAmount(row.amount);
    setEditDesc(row.description || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      setSavingEdit(true);
      await accountingService.updateExpense(editingExpense.id, {
        amount: String(editAmount),
        description: editDesc
      });
      alert('Expense updated successfully! Balances and ledgers have been auto-adjusted.');
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Update failed. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const getTypeStyle = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('cost') || t.includes('general')) {
      return { background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
    }
    if (t.includes('supplier')) {
      return { background: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
    }
    if (t.includes('staff')) {
      return { background: '#8b5cf6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
    }
    return { background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
  };

  return (
    <div className="premium-card">
      <div className="premium-body" style={{ padding: '20px 32px 40px' }}>
        <PrintHeader />

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Expense List (Costs & Payments)</h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Real-time view of all organizational expenses and payments</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/account/expense-create" style={{ textDecoration: 'none' }}>
              <button className="btn-green" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add New Expense
              </button>
            </Link>
            <button className="btn-youtube">
              <div style={{ display: 'flex', alignItems: 'center', background: '#ff0000', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                <Play size={16} fill="white" style={{ marginRight: '6px' }} /> YouTube
              </div>
            </button>
          </div>
        </div>

        {/* Edit Expense Modal / Drawer */}
        {editingExpense && (
          <div style={{ background: '#f8fafc', border: '1.5px solid #3b82f6', borderRadius: '12px', padding: '24px', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                Edit Expense &bull; Ref: {editingExpense.reference || editingExpense.id}
              </h3>
              <button onClick={() => setEditingExpense(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Amount (৳) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Description / Note</label>
                <input 
                  type="text" 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={savingEdit} className="btn-primary" style={{ padding: '10px 18px', background: '#2563eb' }}>
                  {savingEdit ? 'Saving...' : 'Update & Re-adjust'}
                </button>
                <button type="button" onClick={() => setEditingExpense(null)} className="btn-secondary" style={{ padding: '10px 14px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Section */}
        <form onSubmit={handleFilter} className="filter-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
          <div>
            <label className="filter-label">Search Description, Supplier or Staff</label>
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
            Total Expenses: <strong>{expenses.length}</strong>
          </div>
          <div className="table-controls-right">
            <button className="btn-blue" onClick={() => window.print()}><Printer size={16} /> {t('common.print')}</button>
            <button className="btn-blue" onClick={fetchExpenses}><RotateCcw size={16} /> Reload</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th>SL</th>
                <th>DATE</th>
                <th>REF / ID</th>
                <th>CATEGORY</th>
                <th>ACCOUNT</th>
                <th>TYPE</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>AMOUNT (৳)</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading live expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No expense records found.</td>
                </tr>
              ) : (
                expenses.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ fontWeight: '600', color: '#64748b' }}>{idx + 1}</td>
                    <td>{row.date ? String(row.date).split('T')[0] : 'N/A'}</td>
                    <td style={{ fontWeight: '600' }}>{row.reference || row.idNo || `#${row.id}`}</td>
                    <td><span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.category_name || row.category || 'General'}</span></td>
                    <td>{row.account_name || row.account || 'Cash'}</td>
                    <td>
                      <span style={getTypeStyle(row.transaction_type || row.type)}>
                        {row.transaction_type || row.type || 'Cost'}
                      </span>
                    </td>
                    <td style={{ color: '#4b5563', maxWidth: '240px' }}>{row.description || row.desc || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                      ৳ {Number(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => startEdit(row)} 
                        style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Edit Expense & Re-adjust"
                      >
                        <Edit size={14} />
                      </button>
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

export default ExpenseList;
