import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PrintHeader from '../../../components/PrintHeader';
import TableToolbar from '../../../components/TableToolbar';
import { crmService } from '../../../services/crmService';
import { accountingService } from '../../../services/accountingService';
import { useToast } from '../../../context/ToastContext';
import { toList, fmtDate, money } from '../../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Client statement / ledger → /api/accounting/reports/client-ledger/?client_id=&from_date=&to_date=
 */
const ClientStatement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(100);
  const [filters, setFilters] = useState({
    client: location.state?.clientId || new URLSearchParams(location.search).get('client') || '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    crmService.getClients().then((r) => setClients(toList(r))).catch(() => {});
  }, []);

  const load = async (f = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (f.from_date) params.from_date = f.from_date;
      if (f.to_date) params.to_date = f.to_date;
      const res = f.client
        ? await accountingService.getClientLedger(f.client, params)
        : await accountingService.getDepositReport(params);
      const list = toList(res?.ledger || res?.transactions || res?.statement || res?.results || res);
      setRows(list);
      setSummary(f.client && !Array.isArray(res) ? res : null);
    } catch (e) {
      toast.error(e.message || t("Failed to load client statement"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.client]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const clear = () => {
    const f = { client: '', from_date: '', to_date: '' };
    setFilters(f);
    load(f);
  };

  const selectedClient = clients.find((c) => String(c.id || c.uuid) === String(filters.client));

  // running balance if the backend does not send one
  let running = Number(summary?.opening_balance || summary?.previous_due || selectedClient?.previous_due || 0);
  
  // API ledger rows: { date, type, reference, debit, credit, balance } – debit = bill, credit = payment.
  // "type" tells which column a debit/credit belongs to (Sale Invoice / Sales Return / Receive / Money Return).
  let computed = rows.slice(0, entries).map((r) => {
    const t = String(r.type || r.transaction_type || '').toLowerCase();
    const debit = Number(r.debit ?? 0);
    const credit = Number(r.credit ?? 0);
    const isReturn = /return/.test(t) && !/money/.test(t);
    const isMoneyReturn = /money|refund/.test(t);
    const bill = Number(r.bill ?? r.grand_total ?? r.total ?? (r.debit !== undefined && !isMoneyReturn ? debit : 0));
    const salesReturn = Number(r.sales_return ?? r.return_amount ?? (r.credit !== undefined && isReturn ? credit : 0));
    const receive = Number(r.receive ?? r.payment ?? r.amount_received ?? (r.credit !== undefined && !isReturn ? credit : 0));
    const moneyReturn = Number(r.money_return ?? (r.debit !== undefined && isMoneyReturn ? debit : 0));
    const labourCost = Number(r.labour_cost ?? 0);
    if (r.balance === undefined) running = running + bill - salesReturn - receive + moneyReturn;
    return { ...r, _bill: bill, _salesReturn: salesReturn, _receive: receive, _moneyReturn: moneyReturn, _labourCost: labourCost, _balance: r.balance !== undefined ? Number(r.balance) : running };
  });

  // Prepend Opening Balance row if we have client context
  if (selectedClient && computed.length >= 0) {
    const ob = Number(summary?.opening_balance || summary?.previous_due || selectedClient?.previous_due || 0);
    computed = [
      {
        isOpening: true,
        date: filters.from_date || '',
        type: 'Previous Due',
        description: 'Opening Balance',
        _bill: 0,
        _salesReturn: 0,
        _receive: 0,
        _moneyReturn: 0,
        _labourCost: 0,
        _balance: ob
      },
      ...computed
    ];
  }

  const totals = computed.reduce((a, r) => ({ bill: a.bill + r._bill, sr: a.sr + r._salesReturn, rec: a.rec + r._receive, mr: a.mr + r._moneyReturn, lc: a.lc + r._labourCost }), { bill: 0, sr: 0, rec: 0, mr: 0, lc: 0 });
  const closing = computed.length ? computed[computed.length - 1]._balance : Number(summary?.closing_balance || summary?.due || 0);

  const excelData = computed.map((r, i) => ({
    SL: i + 1, Date: fmtDate(r.date), Product: r.product || r.product_name || r.description || '', Qty: r.quantity ?? r.qty ?? '', Unit: r.unit || '', Price: r.price ?? '',
    Description: r.description || r.reference || r.note || '', Bill: r._bill, 'Sales Return': r._salesReturn, Receive: r._receive, 'Money Return': r._moneyReturn, Balance: r._balance,
  }));

  const th = { padding: '10px 8px', fontSize: '11px', textAlign: 'center', border: '1px solid #cbd5e1', background: '#e2e8f0', color: 'black', fontWeight: 'bold' };
  const td = { textAlign: 'center', border: '1px solid #e2e8f0', padding: '0', fontSize: '12px', color: 'black' };
  const cellPad = { padding: '8px' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      <div style={{ padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', margin: '20px 0 30px', color: 'black' }}>Client Statement</h2>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '12px', color: 'black', fontWeight: '600' }}>
          <div>
            {selectedClient ? (
              <>
                Name : {selectedClient.name} {selectedClient.phone ? `// ${selectedClient.phone}` : ''}<br/>
                {selectedClient.address ? <>Address : {selectedClient.address}<br/></> : ''}
                {selectedClient.phone ? <>Contact No : {selectedClient.phone}</> : ''}
              </>
            ) : (
              <>Name : -</>
            )}
          </div>
          <div>
            Date : {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <form className="no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '24px', marginBottom: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'black' }}>Search By Client</label>
            <select value={filters.client} onChange={(e) => set('client', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: '12px' }}>
              <option value="">{t("Select Client")}</option>
              {clients.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
            </select>
            {selectedClient && <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px', color: 'black' }}>Due : {money(selectedClient.due ?? selectedClient.current_balance ?? closing)}</div>}
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'black' }}>Search By Date</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="date" value={filters.from_date} onChange={(e) => set('from_date', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: '12px' }} />
              <input type="date" value={filters.to_date} onChange={(e) => set('to_date', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: '12px' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
            <button type="button" onClick={clear} style={{ padding: '8px 24px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Clear Filter</button>
          </div>
        </form>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: 'black' }}>
            Show <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ border: '1px solid #cbd5e1', padding: '2px 4px', borderRadius: '4px' }}>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select> entries
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => window.print()} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              Print
            </button>
            <button type="button" onClick={() => load()} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              Reset
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1000px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr>
                <th style={th}>SL ↕</th>
                <th style={th}>DATE</th>
                <th style={th}>PRODUCT</th>
                <th style={th}>QTY</th>
                <th style={th}>UNIT</th>
                <th style={th}>PRICE</th>
                <th style={th}>DESCRIPTION</th>
                <th style={th}>LABOUR COST</th>
                <th style={th}>BILL</th>
                <th style={th}>SALES RETURN</th>
                <th style={th}>RECEIVE</th>
                <th style={th}>MONEY RETURN</th>
                <th style={th}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="13" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading...</td></tr>
              ) : computed.length === 0 ? (
                <tr><td colSpan="13" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No data available</td></tr>
              ) : (
                computed.map((r, i) => {
                  // Fallbacks for different possible backend array names for products
                  const items = r.items || r.products || r.details || r.sale_items || r.invoice_items || r.items_details || [];
                  const hasItems = items.length > 0;
                  
                  // Debug log so we can see what the backend is actually sending
                  if (i === 0) console.log("API Ledger Row Data:", r);
                  
                  return (
                    <tr key={r.id || i}>
                      <td style={td}><div style={cellPad}>{i + 1}</div></td>
                      <td style={td}><div style={cellPad}>{r.isOpening ? '-' : fmtDate(r.date)}</div></td>
                      <td style={td}>
                        {hasItems ? items.map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>{item.product_name || item.name || item.product || '-'}</div>
                        )) : <div style={cellPad}>{r.product || r.product_name || r.invoice_id || r.type || r.transaction_type || '-'}</div>}
                      </td>
                      <td style={td}>
                        {hasItems ? items.map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>{Number(item.quantity || item.qty || 0).toFixed(4)}</div>
                        )) : <div style={cellPad}>{r.isOpening ? '-' : (r.quantity ?? r.qty ?? '-')}</div>}
                      </td>
                      <td style={td}>
                        {hasItems ? items.map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>{item.unit || 'PEACE'}</div>
                        )) : <div style={cellPad}>{r.isOpening ? '-' : (r.unit || '-')}</div>}
                      </td>
                      <td style={td}>
                        {hasItems ? items.map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>{item.price !== undefined ? money(item.price) : '0.00'}</div>
                        )) : <div style={cellPad}>{r.isOpening ? '-' : (r.price !== undefined ? money(r.price) : '-')}</div>}
                      </td>
                      <td style={td}><div style={cellPad}>{r.description || r.reference || r.note || '-'}</div></td>
                      <td style={td}><div style={cellPad}>{r._labourCost ? money(r._labourCost) : '0'}</div></td>
                      <td style={td}><div style={cellPad}>{r._bill ? money(r._bill) : '0.00'}</div></td>
                      <td style={td}><div style={cellPad}>{r._salesReturn ? money(r._salesReturn) : '0'}</div></td>
                      <td style={td}><div style={cellPad}>{r._receive ? money(r._receive) : '0.00'}</div></td>
                      <td style={td}><div style={cellPad}>{r._moneyReturn ? money(r._moneyReturn) : '0.00'}</div></td>
                      <td style={td}><div style={cellPad}>{money(r._balance)}</div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {computed.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="7" style={{ ...td, ...cellPad, textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{totals.lc ? money(totals.lc) : '0'}</td>
                  <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{totals.bill ? money(totals.bill) : '0.00'}</td>
                  <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{totals.sr ? money(totals.sr) : '0'}</td>
                  <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{totals.rec ? money(totals.rec) : '0.00'}</td>
                  <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{totals.mr ? money(totals.mr) : '0.00'}</td>
                  <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{money(closing)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: 'black' }}>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'black', cursor: 'pointer', fontSize: '13px' }}>Previous</button>
            <button style={{ padding: '6px 12px', background: '#3b82f6', border: '1px solid #3b82f6', color: 'white', cursor: 'pointer', fontSize: '13px' }}>1</button>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'black', cursor: 'pointer', fontSize: '13px' }}>Next</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientStatement;
