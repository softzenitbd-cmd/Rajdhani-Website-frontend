import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PrintHeader from './PrintHeader';
import TableToolbar from './TableToolbar';
import { accountingService } from '../services/accountingService';
import { crmService } from '../services/crmService';
import { useToast } from '../context/ToastContext';
import { toList, money, fmtDate, nameOf } from '../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Shared deposit / expense report with an optional group-by.
 *
 * props:
 *  - kind:     'deposit' | 'expense'
 *  - groupBy:  'category' | 'client' | 'supplier' | null
 *  - title
 *  - fixedFilters: extra params always sent (e.g. { supplier_only: true })
 */
const TransactionReport = ({ kind, groupBy = null, title }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const isDeposit = kind === 'deposit';

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(100);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [party, setParty] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    (isDeposit ? accountingService.getIncomeCategories() : accountingService.getExpenseCategories())
      .then((r) => setCategories(toList(r))).catch(() => {});
    if (groupBy === 'client') crmService.getClients().then((r) => setParties(toList(r))).catch(() => {});
    if (groupBy === 'supplier') crmService.getSuppliers().then((r) => setParties(toList(r))).catch(() => {});
  }, [isDeposit, groupBy]);

  const load = async (f = { search, category, party, fromDate, toDate }) => {
    try {
      setLoading(true);
      const filters = {};
      if (f.search) filters.search = f.search;
      if (f.category) filters.category_id = f.category;
      if (f.fromDate) filters.from_date = f.fromDate;
      if (f.toDate) filters.to_date = f.toDate;
      if (f.party) {
        if (groupBy === 'client') filters.client_id = f.party;
        if (groupBy === 'supplier') filters.supplier_id = f.party;
      }
      const res = isDeposit ? await accountingService.getDepositReport(filters) : await accountingService.getExpenseReport(filters);
      let list = toList(res);
      if (groupBy === 'supplier') {
        // supplier payment report: keep rows that belong to a supplier
        const supplierRows = list.filter((r) => r.supplier || r.supplier_id || r.supplier_name || /supplier|purchase/i.test(r.transaction_type || ''));
        if (supplierRows.length) list = supplierRows;
      }
      setRows(list);
    } catch (e) {
      toast.error(e.message || t("Failed to load report"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setSearch(''); setCategory(''); setParty(''); setFromDate(''); setToDate('');
    load({ search: '', category: '', party: '', fromDate: '', toDate: '' });
  };

  const partyName = (r) =>
    isDeposit
      ? nameOf(r.client_name || r.client || r.client_id, 'Walk-in')
      : nameOf(r.supplier_name || r.supplier || r.supplier_id || r.staff_name || r.staff || '', '-');
  const categoryName = (r) => nameOf(r.receive_category || r.expense_category || r.category_name || r.category || r.category_id, 'General');
  const accountName = (r) => nameOf(r.account_name || r.account || r.account_id, 'Cash');

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = {};
    rows.forEach((r) => {
      const key = groupBy === 'category' ? categoryName(r) : partyName(r);
      if (!map[key]) map[key] = { key, rows: [], total: 0 };
      map[key].rows.push(r);
      map[key].total += Number(r.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [rows, groupBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const visible = rows.slice(0, entries);
  const excelData = visible.map((r, i) => ({
    SL: i + 1,
    Date: fmtDate(r.date),
    Reference: r.invoice_id || r.voucher_no || r.reference || r.id || '',
    [isDeposit ? 'Client' : 'Paid To']: partyName(r),
    Category: categoryName(r),
    Account: accountName(r),
    Description: r.description || '',
    Type: r.transaction_type || r.type || '',
    Amount: Number(r.amount || 0),
  }));

  const input = { width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' };
  const lbl = { display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', fontWeight: 600 };
  const color = isDeposit ? '#059669' : '#dc2626';

  const rowCells = (r, i) => (
    <>
      <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{i + 1}</td>
      <td style={{ padding: '8px', textAlign: 'center' }}>{fmtDate(r.date)}</td>
      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>{r.invoice_id || r.voucher_no || r.reference || (r.id ? `#${String(r.id).slice(0, 8)}` : '-')}</td>
      <td style={{ padding: '8px' }}>{partyName(r)}</td>
      <td style={{ padding: '8px', textAlign: 'center' }}>{categoryName(r)}</td>
      <td style={{ padding: '8px', textAlign: 'center' }}>{accountName(r)}</td>
      <td style={{ padding: '8px', color: '#475569' }}>{r.description || '-'}</td>
      <td style={{ padding: '8px', textAlign: 'center' }}>
        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{r.transaction_type || r.type || (isDeposit ? t("Deposit") : t("Cost"))}</span>
      </td>
      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color }}>৳ {money(r.amount)}</td>
    </>
  );

  const header = (
    <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
      <th style={{ width: '50px', padding: '10px', textAlign: 'center' }}>{t("SL")}</th>
      <th style={{ padding: '10px', textAlign: 'center' }}>{t("DATE")}</th>
      <th style={{ padding: '10px', textAlign: 'center' }}>{t("REF / INVOICE")}</th>
      <th style={{ padding: '10px' }}>{isDeposit ? t("CLIENT") : t("PAID TO")}</th>
      <th style={{ padding: '10px', textAlign: 'center' }}>{t("CATEGORY")}</th>
      <th style={{ padding: '10px', textAlign: 'center' }}>{t("ACCOUNT")}</th>
      <th style={{ padding: '10px' }}>{t("DESCRIPTION")}</th>
      <th style={{ padding: '10px', textAlign: 'center' }}>{t("TYPE")}</th>
      <th style={{ padding: '10px', textAlign: 'right' }}>{t("AMOUNT (৳)")}</th>
    </tr>
  );

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: 'var(--fs-22, 22px)', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{title}</h2>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b', display: 'block' }}>{t("Total")} {isDeposit ? t("Deposited") : t("Expense")}</span>
            <span style={{ fontSize: 'var(--fs-20, 20px)', fontWeight: 800, color }}>৳ {money(total)}</span>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <form className="no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'grid', gridTemplateColumns: groupBy && groupBy !== 'category' ? '1.2fr 1fr 1fr 1.4fr auto' : '1.5fr 1fr 1.5fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
            <div>
              <label style={lbl}>{t("Search")}</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Reference / description...")} style={input} />
            </div>
            {groupBy && groupBy !== 'category' && (
              <div>
                <label style={lbl}>{groupBy === 'client' ? t("Client") : t("Supplier")}</label>
                <select value={party} onChange={(e) => setParty(e.target.value)} style={input}>
                  <option value="">{t("All")}</option>
                  {parties.map((p) => <option key={p.id || p.uuid} value={p.id || p.uuid}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>{t("Category")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
                <option value="">{t("All Categories")}</option>
                {categories.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{t("Date Range")}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ ...input, width: '50%' }} />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ ...input, width: '50%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={14} /> {t("Filter")}</button>
              <button type="button" onClick={reset} style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}>{t("Reset")}</button>
            </div>
          </form>

          <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName={title.replace(/\s+/g, '_')} onReload={() => load()} onReset={reset} />

          {groups ? (
            loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading report...")}</div>
            ) : groups.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No records found for this period.")}</div>
            ) : (
              groups.map((g) => (
                <div key={g.key} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px 6px 0 0', fontWeight: 700, fontSize: 'var(--fs-13, 13px)' }}>
                    <span>{g.key} <span style={{ color: '#64748b', fontWeight: 400 }}>({g.rows.length})</span></span>
                    <span style={{ color }}>৳ {money(g.total)}</span>
                  </div>
                  <div className="table-responsive">
                    <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)' }}>
                      <thead>{header}</thead>
                      <tbody>{g.rows.slice(0, entries).map((r, i) => <tr key={r.id || i}>{rowCells(r, i)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="table-responsive">
              <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)' }}>
                <thead>{header}</thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading report...")}</td></tr>
                  ) : visible.length === 0 ? (
                    <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No records found for this period.")}</td></tr>
                  ) : visible.map((r, i) => <tr key={r.id || i}>{rowCells(r, i)}</tr>)}
                </tbody>
                {visible.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                      <td colSpan="8" style={{ padding: '8px', textAlign: 'right' }}>{t("TOTAL")}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color }}>৳ {money(total)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionReport;
