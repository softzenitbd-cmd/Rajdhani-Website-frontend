import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Printer, RotateCcw, Plus, ArrowLeft, Play } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { accountingService } from '../../services/accountingService';
import { exportVisibleTable } from '../../utils/tableExport';
import QuickEditModal from '../../components/QuickEditModal';
import CustomDatePicker from '../../components/CustomDatePicker';


const cell = { padding: '10px', border: '1px solid #cbd5e1' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Mirrors the original CRM "ট্রান্সফার লিস্ট": every transfer is shown as a ledger pair —
// one debit line for the sender account and one credit line for the receiver account.
const TransferList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Filters
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchAccounts = async () => {
    try {
      const res = await accountingService.getAccounts();
      setAccounts(Array.isArray(res) ? res : (res?.results || []));
    } catch (err) {
      console.error(err);
    }
  };

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
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fromDate, toDate]);

  const handleClearFilter = () => {
    setAccountId('');
    setType('');
    setFromDate('');
    setToDate('');
  };

  // Flatten each transfer into sender (debit) + receiver (credit) ledger lines
  const rows = useMemo(() => {
    const lines = [];
    transfers.forEach((tr) => {
      const date = tr.date ? String(tr.date).split('T')[0] : '';
      const fromName = tr.from_account_name || tr.from_account?.name || tr.from_account || '';
      const toName = tr.to_account_name || tr.to_account?.name || tr.to_account || '';
      const fromId = tr.from_account?.id ?? tr.from_account;
      const toId = tr.to_account?.id ?? tr.to_account;
      const amount = Number(tr.amount || 0);

      lines.push({ key: `${tr.id}-out`, id: tr.id, date, party: toName, type: 'Sent', account: fromName, accountId: fromId, description: tr.description || '', credit: 0, debit: amount });
      lines.push({ key: `${tr.id}-in`, id: tr.id, date, party: fromName, type: 'Received', account: toName, accountId: toId, description: tr.description || '', credit: amount, debit: 0 });
    });

    const filtered = lines.filter((l) => {
      if (accountId && String(l.accountId) !== String(accountId)) return false;
      if (type && l.type !== type) return false;
      return true;
    });

    let balance = 0;
    return filtered.map((l) => {
      balance += l.credit - l.debit;
      return { ...l, balance };
    });
  }, [transfers, accountId, type]);

  const visible = rows.slice(0, limit);
  const totalCredit = visible.reduce((s, r) => s + r.credit, 0);
  const totalDebit = visible.reduce((s, r) => s + r.debit, 0);

  const toolBtn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)' });

  return (
    <div style={{ background: 'white', minHeight: '100vh', padding: '20px' }}>
      {/* Top toolbar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} style={toolBtn('#1e293b')}><Printer size={14} /> {t("Print")}</button>
          <button onClick={() => navigate('/account/transfer-create')} style={toolBtn('#059669')}><Plus size={14} /> {t("Add New")}</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate(-1)} style={toolBtn('#1e293b')}><ArrowLeft size={14} /> {t("Go Back")}</button>
          <button style={toolBtn('#dc2626')}><Play size={14} /> {t("YouTube")}</button>
        </div>
      </div>

      <PrintHeader />
      <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-20, 20px)', fontWeight: 'bold', margin: '12px 0 20px' }}>{t("Transfer List")}</h2>

      {/* Filters */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '20px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Account")}</label>
          <SearchableSelect
            options={accounts.map((a) => ({ value: a.id, label: a.name, searchValue: a.name }))}
            value={accountId}
            onChange={(val) => setAccountId(val)}
            placeholder={t("Select Account")}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Type")}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none', background: 'white' }}>
            <option value="">{t("Choose one")}</option>
            <option value="Sent">{t("Sent")}</option>
            <option value="Received">{t("Received")}</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Date")}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CustomDatePicker  value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
            <CustomDatePicker  value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
          </div>
        </div>
        <button onClick={handleClearFilter} style={{ background: '#64748b', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
          <button onClick={() => exportVisibleTable('xlsx', 'Transfer List')} style={toolBtn('#3b82f6')}>{t("Excel")}</button>
          <button onClick={() => exportVisibleTable('csv', 'Transfer List')} style={toolBtn('#3b82f6')}>{t("CSV")}</button>
          <button onClick={() => window.print()} style={toolBtn('#3b82f6')}>{t("PDF")}</button>
          <button onClick={fetchTransfers} style={toolBtn('#3b82f6')}><RotateCcw size={14} /> {t("Reset")}</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
          <thead>
            <tr style={{ background: '#94a3b8', color: 'white' }}>
              <th style={cell}>{t("SL")}</th>
              <th style={cell}>{t("DATE")}</th>
              <th style={cell}>{t("SENDER / RECEIVER")}</th>
              <th style={cell}>{t("TYPE")}</th>
              <th style={cell}>{t("ACCOUNT")}</th>
              <th style={cell}>{t("DESCRIPTION")}</th>
              <th style={cell}>{t("CREDIT")}</th>
              <th style={cell}>{t("DEBIT")}</th>
              <th style={cell}>{t("BALANCE")}</th>
              <th style={cell} className="no-print">{t("ACTION")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>{t("No data available in table")}</td></tr>
            ) : (
              visible.map((row, idx) => (
                <tr key={row.key} style={{ textAlign: 'center' }}>
                  <td style={cell}>{idx + 1}</td>
                  <td style={cell}>{row.date}</td>
                  <td style={cell}>{row.party}</td>
                  <td style={cell}>{t(row.type)}</td>
                  <td style={cell}>{row.account}</td>
                  <td style={cell}>{row.description}</td>
                  <td style={{ ...cell, color: '#059669', fontWeight: '600' }}>{row.credit ? fmt(row.credit) : '0'}</td>
                  <td style={{ ...cell, color: '#dc2626', fontWeight: '600' }}>{row.debit ? fmt(row.debit) : '0'}</td>
                  <td style={{ ...cell, fontWeight: 'bold' }}>{fmt(row.balance)}</td>
                  <td style={cell} className="no-print">
                    <button onClick={() => setEditing(transfers.find((tr) => tr.id === row.id))} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }}>
                      {t("Edit")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
              <td colSpan="6" style={{ ...cell, textAlign: 'center' }}>{t("Total")}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{fmt(totalCredit)}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{fmt(totalDebit)}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{fmt(totalCredit - totalDebit)}</td>
              <td style={cell} className="no-print"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {editing && (
        <QuickEditModal
          title={t("Edit Transfer")}
          record={editing}
          fields={[
            { name: 'date', label: t("Date"), type: 'date' },
            { name: 'amount', label: t("Amount"), type: 'number' },
            { name: 'description', label: t("Description") },
          ]}
          onSave={(changed) => accountingService.updateTransfer(editing.id, changed)}
          onClose={(saved) => { setEditing(null); if (saved) fetchTransfers(); }}
        />
      )}
      <div style={{ marginTop: '10px', fontSize: 'var(--fs-13, 13px)', color: '#475569' }}>
        {t("Showing {{from}} to {{to}} of {{total}} entries", { from: visible.length ? 1 : 0, to: visible.length, total: rows.length })}
      </div>
    </div>
  );
};

export default TransferList;
