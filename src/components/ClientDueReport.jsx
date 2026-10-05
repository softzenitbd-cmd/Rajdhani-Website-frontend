import React, { useEffect, useMemo, useState } from 'react';
import PrintHeader from './PrintHeader';
import TableToolbar from './TableToolbar';
import Pagination from './Pagination';
import { crmService } from '../services/crmService';
import { useToast } from '../context/ToastContext';
import { toList, money, nameOf } from '../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Shared client due report → /api/crm/reports/client-due/
 * mode: 'all' | 'client' | 'group'
 */
const num = (r, ...keys) => {
  for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== '') return Number(r[k]) || 0;
  return 0;
};

const ClientDueReport = ({ mode = 'all', title = 'All Due Report' }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clientId, setClientId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [onlyDue, setOnlyDue] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === 'client') crmService.getClients({ page_size: 5000 }).then((r) => setClients(toList(r))).catch(() => {});
    if (mode === 'group') crmService.getClientGroups().then((r) => setGroups(toList(r))).catch(() => {});
  }, [mode]);

  const load = async (f = { clientId, groupId, onlyDue }) => {
    try {
      setLoading(true);
      const filters = {};
      if (f.clientId) filters.client_id = f.clientId;
      if (f.groupId) filters.group_id = f.groupId;
      if (f.onlyDue) filters.has_due = 'true';
      setRows(toList(await crmService.getClientDueReport(filters)));
    } catch (e) {
      toast.error(e.message || t("Failed to load due report"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId, groupId, onlyDue]); // eslint-disable-line react-hooks/exhaustive-deps

  const normalized = useMemo(() => rows.map((r) => {
    const prevDue = num(r, 'previous_due', 'opening_due', 'opening_balance');
    const sales = num(r, 'sales', 'sales_amount', 'total_sales', 'bill');
    const totalBill = num(r, 'total_bill') || (prevDue + sales);
    const salesReturn = num(r, 'sales_return', 'return_amount');
    const discount = num(r, 'discount', 'discount_amount', 'total_discount');
    const collection = num(r, 'collection', 'receive', 'payment', 'paid', 'total_receive', 'amount_received');
    const moneyReturn = num(r, 'money_return', 'return');
    
    // We MUST use the exact due returned by the API. 
    // Calculating it manually causes discrepancies because of hidden discounts or backend-specific logic.
    // If the API due is completely missing, we fallback to a safe calculation.
    const apiDue = num(r, 'due', 'current_due', 'balance', 'total_due', 'due_amount');
    
    // Check if the API explicitly provided a due field (even if it's 0)
    let finalDue = apiDue;
    if (r.due === undefined && r.current_due === undefined && r.balance === undefined) {
       finalDue = totalBill - salesReturn - collection + moneyReturn;
    }

    return {
      id: r.client_id || r.id || r.uuid,
      name: r.client_name || r.name || nameOf(r.client),
      address: r.address || r.client?.address || '',
      phone: r.phone || r.client?.phone || '',
      group: r.group_name || nameOf(r.group, ''),
      prevDue,
      sales,
      totalBill,
      salesReturn,
      discount,
      collection,
      moneyReturn,
      due: finalDue,
    };
  }), [rows]);

  useEffect(() => { setCurrentPage(1); }, [clientId, groupId, search, onlyDue, entries]);

  const filtered = normalized
    .filter((r) => !search || `${r.name} ${r.phone} ${r.address}`.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !onlyDue || r.due !== 0);

  // group-wise: aggregate per group
  const grouped = useMemo(() => {
    if (mode !== 'group' || groupId) return null;
    const map = {};
    filtered.forEach((r) => {
      const g = r.group || 'No Group';
      if (!map[g]) map[g] = { group: g, clients: 0, prevDue: 0, sales: 0, totalBill: 0, salesReturn: 0, collection: 0, moneyReturn: 0, due: 0 };
      const m = map[g];
      m.clients += 1;
      ['prevDue', 'sales', 'totalBill', 'salesReturn', 'collection', 'moneyReturn', 'due'].forEach((k) => { m[k] += r[k]; });
    });
    return Object.values(map);
  }, [mode, groupId, filtered]);

  const visible = (grouped || filtered).slice((currentPage - 1) * entries, currentPage * entries);
  const totalDue = filtered.reduce((s, r) => s + r.due, 0);

  const excelData = visible.map((r, i) => grouped
    ? { SL: (currentPage - 1) * entries + i + 1, Group: r.group, Clients: r.clients, 'Previous Due': r.prevDue, Sales: r.sales, 'Sales Return': r.salesReturn, 'Total Bill': r.totalBill, Discount: r.discount, Collection: r.collection, Due: r.due }
    : { SL: (currentPage - 1) * entries + i + 1, Name: r.name, Address: r.address, Phone: r.phone, Group: r.group, 'Previous Due': r.prevDue, Sales: r.sales, 'Sales Return': r.salesReturn, 'Total Bill': r.totalBill, Discount: r.discount, Collection: r.collection, Due: r.due });

  const selectStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' };
  const th = { padding: '12px' };
  const td = { padding: '10px' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div style={{ padding: '16px', background: 'white', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', margin: 0 }}>{title}</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
            {mode === 'client' && (
              <div style={{ width: '300px' }}>
                <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Search By Client")}</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={selectStyle}>
                  <option value="">{t("All Clients")}</option>
                  {clients.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                </select>
              </div>
            )}
            {mode === 'group' && (
              <div style={{ width: '300px' }}>
                <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Search By Group")}</label>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={selectStyle}>
                  <option value="">{t("All Groups (summary)")}</option>
                  {groups.map((g) => <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ width: '260px' }}>
              <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Quick Search")}</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("name / phone / address")} style={selectStyle} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', paddingBottom: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} /> {t("Only with due")}
            </label>
            <button onClick={() => { setClientId(''); setGroupId(''); setSearch(''); setOnlyDue(true); }} style={{ background: '#7e8a9f', color: 'white', padding: '10px 32px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', height: '42px' }}>
              {t("Clear Filter")}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', padding: '12px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t("Total Due Amount")}</div>
              <div style={{ fontSize: 'var(--fs-22, 22px)', fontWeight: 'bold', color: '#dc2626' }}>৳ {money(totalDue)}</div>
            </div>
          </div>
            

          <TableToolbar entries={entries} setEntries={setEntries} total={filtered.length} excelData={excelData} excelName={title.replace(/\s+/g, '_')} onReload={() => load()} onReset={() => { setClientId(''); setGroupId(''); setSearch(''); }} />

          {/* Table View */}
          <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-11, 11px)', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ ...th, width: '40px' }}>{t("SL")}</th>
                  {grouped ? <><th style={{ ...th, textAlign: 'left' }}>{t("GROUP")}</th><th style={th}>{t("CLIENTS")}</th></> : <><th style={{ ...th, textAlign: 'left' }}>{t("CLIENT INFO")}</th><th style={th}>{t("GROUP")}</th></>}
                  <th style={th}>{t("PREVIOUS DUE")}</th>
                  <th style={th}>{t("SALES")}</th>
                  <th style={th}>{t("SALES RETURN")}</th>
                  <th style={th}>{t("TOTAL BILL")}</th>
                  <th style={th}>{t("DISCOUNT")}</th>
                  <th style={th}>{t("COLLECTION")}</th>
                  <th style={th}>{t("DUE")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" style={{ padding: '24px', color: '#64748b' }}>{t("Loading...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="10" style={{ padding: '24px', color: '#64748b' }}>{t("No records found")}</td></tr>
                ) : (
                  visible.map((r, i) => (
                    <tr key={r.id || r.group || i}>
                      <td style={td}>{(currentPage - 1) * entries + i + 1}</td>
                      {grouped ? (
                        <><td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{r.group}</td><td style={td}>{r.clients}</td></>
                      ) : (
                        <>
                          <td style={{ ...td, textAlign: 'left' }}>
                            <div><b>{t("Name :")}</b> {r.name}</div>
                            {r.address && <div><b>{t("Address :")}</b> {r.address}</div>}
                            {r.phone && <div><b>{t("Phone :")}</b> {r.phone}</div>}
                          </td>
                          <td style={td}>{r.group || '-'}</td>
                        </>
                      )}
                      <td style={td}>{money(r.prevDue)}</td>
                      <td style={td}>{money(r.sales)}</td>
                      <td style={td}>{money(r.salesReturn)}</td>
                      <td style={td}>{money(r.totalBill)}</td>
                      <td style={td}>{money(r.discount)}</td>
                      <td style={{ ...td, color: '#059669' }}>{money(r.collection)}</td>
                      <td style={{ ...td, fontWeight: 'bold', color: r.due > 0 ? '#dc2626' : '#059669' }}>{money(r.due)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {visible.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                    <td colSpan="3" style={{ ...td, textAlign: 'right' }}>{t("TOTAL")}</td>
                    {['prevDue', 'sales', 'salesReturn', 'totalBill', 'discount', 'collection', 'due'].map((k) => (
                      <td key={k} style={{ ...td, color: k === 'due' ? '#dc2626' : undefined }}>{money(filtered.reduce((s, r) => s + r[k], 0))}</td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Pagination 
              currentPage={currentPage}
              totalItems={(grouped || filtered).length}
              pageSize={entries}
              onPageChange={setCurrentPage}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientDueReport;
