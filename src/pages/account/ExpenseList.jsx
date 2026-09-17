import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Printer, RotateCcw, Edit, X, Play, FileText } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';

const cell = { padding: '10px', border: '1px solid #cbd5e1' };

// Mirrors the original CRM "খরচ লিস্ট" page:
// filters → ID / client / date range → clear filter → show entries + print/reset → table
const ExpenseList = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchId, setSearchId] = useState('');
  const [clientId, setClientId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(100);

  // Inline edit drawer
  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await crmService.getClients({ page_size: 1000 });
      setClients(res?.results || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchId) filters.search = searchId;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getExpenses(filters);
      let data = Array.isArray(res) ? res : (res?.results || []);
      // Backend has no client filter on expenses → filter on the client side
      if (clientId) {
        data = data.filter((row) => String(row.client || row.client_id || row.client?.id) === String(clientId));
      }
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Re-query whenever a filter changes (debounced for the text box)
  useEffect(() => {
    const timer = setTimeout(() => fetchExpenses(), 300);
    return () => clearTimeout(timer);
  }, [searchId, clientId, fromDate, toDate]);

  const handleClearFilter = () => {
    setSearchId('');
    setClientId('');
    setFromDate('');
    setToDate('');
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
      toast.success(t("Expense updated successfully! Balances and ledgers have been auto-adjusted."));
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error(t("Update failed. Please try again."));
    } finally {
      setSavingEdit(false);
    }
  };

  const receiptFor = (row) =>
    row.supplier_name || row.staff_name || row.client_name || row.supplier?.name || row.staff?.name || row.client?.name || '';

  const floatingInput = { width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' };
  const floatingTag = { position: 'absolute', top: '-10px', left: '10px', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)' };

  return (
    <div style={{ background: 'white', minHeight: '100vh', padding: '20px' }}>
      <PrintHeader />

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold', margin: 0 }}>{t("Expense List")}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/account/expense-create')} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={16} /> {t("Add Expense")}
          </button>
          <button style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Play size={16} /> {t("YouTube")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', visibility: 'hidden' }}>{t("Search By ID")}</label>
          <div style={{ position: 'relative' }}>
            <div style={floatingTag}>{t("Search By ID")}</div>
            <input type="text" placeholder={t("Search By ID")} value={searchId} onChange={(e) => setSearchId(e.target.value)} style={floatingInput} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Client")}</label>
          <SearchableSelect
            options={clients.map(c => ({
              value: c.id,
              label: c.name || c.company_name,
              searchValue: `${c.name || ''} ${c.phone || ''}`
            }))}
            value={clientId}
            onChange={(val) => setClientId(val)}
            placeholder={t("Select Client")}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Date")}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button onClick={handleClearFilter} style={{ background: '#64748b', color: 'white', border: 'none', padding: '12px 0', width: '400px', maxWidth: '100%', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: 'var(--fs-15, 15px)' }}>
          {t("Clear Filter")}
        </button>
      </div>

      {/* Table Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: 'var(--fs-14, 14px)' }}>
          {t("Show")}
          <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} style={{ width: '60px', margin: '0 8px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
          {t("entries")}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Printer size={16} /> {t("Print")}
          </button>
          <button onClick={() => fetchExpenses()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <RotateCcw size={16} /> {t("Reset")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
          <thead>
            <tr style={{ background: '#94a3b8', color: 'white' }}>
              <th style={cell}>{t("SL. ↑")}</th>
              <th style={cell}>{t("DATE")}</th>
              <th style={cell}>{t("RECEIPT FOR")}</th>
              <th style={cell}>{t("ID")}</th>
              <th style={cell}>{t("CATEGORY")}</th>
              <th style={cell}>{t("ACCOUNT")}</th>
              <th style={cell}>{t("CHEQUE NO")}</th>
              <th style={cell}>{t("DESCRIPTION")}</th>
              <th style={cell}>{t("TRANSACTION TYPE")}</th>
              <th style={cell}>{t("BANK")}</th>
              <th style={cell}>{t("AMOUNT")}</th>
              <th style={cell}>{t("PRINT")}</th>
              <th style={cell}>{t("ACTION")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>{t("No records found.")}</td></tr>
            ) : (
              expenses.slice(0, limit).map((row, idx) => (
                <tr key={row.id || idx} style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <td style={cell}>{idx + 1}</td>
                  <td style={cell}>{row.date ? String(row.date).split('T')[0] : ''}</td>
                  <td style={cell}>{receiptFor(row)}</td>
                  <td style={cell}>{row.reference || row.idNo || (idx + 1).toString().padStart(4, '0')}</td>
                  <td style={cell}>{row.category_name || row.category || ''}</td>
                  <td style={cell}>{row.account_name || row.account || ''}</td>
                  <td style={cell}>{row.cheque_no || ''}</td>
                  <td style={cell}>{row.description || row.desc || ''}</td>
                  <td style={cell}>{row.transaction_type || row.type || ''}</td>
                  <td style={cell}>{row.bank_name || row.bank || ''}</td>
                  <td style={{ ...cell, fontWeight: 'bold' }}>{Number(row.amount || 0).toFixed(2)}</td>
                  <td style={cell}>
                    <button onClick={() => window.print()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }} title={t("Print")}>
                      <FileText size={16} />
                    </button>
                  </td>
                  <td style={cell}>
                    <button onClick={() => startEdit(row)} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }} title={t("Edit Expense & Re-adjust")}>
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Expense Drawer */}
      {editingExpense && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setEditingExpense(null)}
        >
          <div
            style={{ width: '440px', maxWidth: '92vw', height: '100vh', background: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#2563eb', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold' }}>
                {t("Edit Expense • Ref:")} {editingExpense.reference || editingExpense.id}
              </h3>
              <button onClick={() => setEditingExpense(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{t("Amount (৳) *")}</label>
                <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: 'var(--fs-15, 15px)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{t("Description / Note")}</label>
                <textarea rows="4" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: 'var(--fs-14, 14px)', outline: 'none' }} />
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setEditingExpense(null)} style={{ padding: '10px 18px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  {t("Cancel")}
                </button>
                <button type="submit" disabled={savingEdit} style={{ padding: '10px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {savingEdit ? t("Saving...") : t("Update & Re-adjust")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
