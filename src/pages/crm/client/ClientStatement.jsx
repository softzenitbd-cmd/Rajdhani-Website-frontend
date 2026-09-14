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
  const computed = rows.slice(0, entries).map((r) => {
    const t = String(r.type || r.transaction_type || '').toLowerCase();
    const debit = Number(r.debit ?? 0);
    const credit = Number(r.credit ?? 0);
    const isReturn = /return/.test(t) && !/money/.test(t);
    const isMoneyReturn = /money|refund/.test(t);
    const bill = Number(r.bill ?? r.grand_total ?? r.total ?? (r.debit !== undefined && !isMoneyReturn ? debit : 0));
    const salesReturn = Number(r.sales_return ?? r.return_amount ?? (r.credit !== undefined && isReturn ? credit : 0));
    const receive = Number(r.receive ?? r.payment ?? r.amount_received ?? (r.credit !== undefined && !isReturn ? credit : 0));
    const moneyReturn = Number(r.money_return ?? (r.debit !== undefined && isMoneyReturn ? debit : 0));
    if (r.balance === undefined) running = running + bill - salesReturn - receive + moneyReturn;
    return { ...r, _bill: bill, _salesReturn: salesReturn, _receive: receive, _moneyReturn: moneyReturn, _balance: r.balance !== undefined ? Number(r.balance) : running };
  });

  const totals = computed.reduce((a, r) => ({ bill: a.bill + r._bill, sr: a.sr + r._salesReturn, rec: a.rec + r._receive, mr: a.mr + r._moneyReturn }), { bill: 0, sr: 0, rec: 0, mr: 0 });
  const closing = computed.length ? computed[computed.length - 1]._balance : Number(summary?.closing_balance || summary?.due || 0);

  const excelData = computed.map((r, i) => ({
    SL: i + 1, Date: fmtDate(r.date), Product: r.product || r.product_name || r.description || '', Qty: r.quantity ?? r.qty ?? '', Unit: r.unit || '', Price: r.price ?? '',
    Description: r.description || r.reference || r.note || '', Bill: r._bill, 'Sales Return': r._salesReturn, Receive: r._receive, 'Money Return': r._moneyReturn, Balance: r._balance,
  }));

  const th = { padding: '10px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' };
  const td = { textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <PrintHeader />
      <div className="chart-card">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-main)', margin: 0 }}>{t("Client Statement")}</h2>
          <button onClick={() => navigate('/account/receive-create', { state: { clientId: filters.client } })} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> {t("Receive")}
          </button>
        </div>

        <form className="form-grid no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ gridTemplateColumns: '1fr 1fr auto auto', marginBottom: '24px', alignItems: 'flex-end', gap: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>{t("Search By Client")}</label>
            <div className="form-input floating-label">
              <select value={filters.client} onChange={(e) => set('client', e.target.value)}>
                <option value="">{t("All Clients")}</option>
                {clients.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-input floating-label" style={{ flex: 1 }}><input type="date" value={filters.from_date} onChange={(e) => set('from_date', e.target.value)} /></div>
              <div className="form-input floating-label" style={{ flex: 1 }}><input type="date" value={filters.to_date} onChange={(e) => set('to_date', e.target.value)} /></div>
            </div>
          </div>
          <button type="submit" style={{ height: '48px', padding: '0 28px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>{t("Search")}</button>
          <button type="button" onClick={clear} style={{ height: '48px', padding: '0 28px', background: '#718096', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Clear Filter")}</button>
        </form>

        {selectedClient && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px' }}>
            <div><b>{t("Client:")}</b> {selectedClient.name}</div>
            {selectedClient.phone && <div><b>{t("Phone:")}</b> {selectedClient.phone}</div>}
            {selectedClient.address && <div><b>{t("Address:")}</b> {selectedClient.address}</div>}
            <div style={{ marginLeft: 'auto' }}><b>{t("Current Due:")}</b> <span style={{ color: '#dc2626', fontWeight: 700 }}>৳ {money(selectedClient.due ?? selectedClient.current_balance ?? closing)}</span></div>
          </div>
        )}

        <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName={`Client_Statement_${selectedClient?.name || 'All'}`} onReload={() => load()} onReset={clear} />

        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '4px', marginBottom: '16px' }}>
          <table className="custom-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th style={th}>{t("SL")}</th><th style={th}>{t("DATE")}</th><th style={th}>{t("PRODUCT / DETAILS")}</th><th style={th}>{t("QTY")}</th><th style={th}>{t("UNIT")}</th><th style={th}>{t("PRICE")}</th>
                <th style={th}>{t("DESCRIPTION")}</th><th style={th}>{t("BILL")}</th><th style={th}>{t("SALES RETURN")}</th><th style={th}>{t("RECEIVE")}</th><th style={th}>{t("MONEY RETURN")}</th><th style={{ ...th, borderRight: 'none' }}>{t("BALANCE")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t("Loading statement...")}</td></tr>
              ) : computed.length === 0 ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t("No transactions found")}</td></tr>
              ) : (
                computed.map((r, i) => (
                  <tr key={r.id || i}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{fmtDate(r.date)}</td>
                    <td style={{ ...td, textAlign: 'left' }}>{r.product || r.product_name || r.invoice_id || r.type || r.transaction_type || '-'}</td>
                    <td style={td}>{r.quantity ?? r.qty ?? '-'}</td>
                    <td style={td}>{r.unit || '-'}</td>
                    <td style={td}>{r.price !== undefined ? money(r.price) : '-'}</td>
                    <td style={{ ...td, textAlign: 'left', color: '#475569' }}>{r.description || r.reference || r.note || '-'}</td>
                    <td style={td}>{money(r._bill)}</td>
                    <td style={td}>{money(r._salesReturn)}</td>
                    <td style={{ ...td, color: '#059669' }}>{money(r._receive)}</td>
                    <td style={td}>{money(r._moneyReturn)}</td>
                    <td style={{ ...td, borderRight: 'none', fontWeight: 700, color: r._balance > 0 ? '#dc2626' : '#059669' }}>{money(r._balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {computed.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                  <td colSpan="7" style={{ ...td, textAlign: 'right' }}>{t("TOTAL")}</td>
                  <td style={td}>{money(totals.bill)}</td>
                  <td style={td}>{money(totals.sr)}</td>
                  <td style={td}>{money(totals.rec)}</td>
                  <td style={td}>{money(totals.mr)}</td>
                  <td style={{ ...td, borderRight: 'none', color: '#dc2626' }}>{money(closing)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientStatement;
