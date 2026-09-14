import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import { toList, money, fmtDate, today, nameOf } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Customer wise sales report. The sales report API returns item-wise rows; they are
 * grouped here per invoice so each voucher shows its products on nested lines.
 */
const SalesCustomerWise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(100);
  const [filters, setFilters] = useState({ client_id: '', from_date: today(), to_date: today() });

  useEffect(() => {
    crmService.getClients().then((r) => setClients(toList(r))).catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setReports(toList(await saleService.getSalesReport(filters)));
    } catch (err) {
      toast.error(err.message || t("Failed to load sales report"));
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSearch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const reset = () => {
    const f = { client_id: '', from_date: today(), to_date: today() };
    setFilters(f);
    setTimeout(handleSearch, 0);
  };

  // group item rows by invoice
  const invoices = useMemo(() => {
    const map = new Map();
    reports.forEach((row) => {
      const inv = row.invoice || {};
      const key = inv.id || row.invoice_id || row.invoice_no || row.voucher || row.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          date: row.date || row.issued_date || inv.date,
          voucher: inv.invoice_id || inv.invoice_no || row.invoice_no || row.voucher || String(key).slice(0, 8),
          client: nameOf(row.client_name || row.client?.client_name || row.client, ''),
          items: [],
          total: 0,
          discount: Number(inv.discount ?? row.discount ?? 0),
          transport: Number(inv.transport_fare ?? inv.transport ?? row.transport ?? 0),
          returnQty: Number(inv.return_qty ?? row.return_qty ?? 0),
          grandTotal: Number(inv.grand_total ?? inv.total ?? 0),
          receive: Number(inv.receive_amount ?? inv.paid ?? row.receive ?? 0),
          due: Number(inv.due ?? row.due ?? 0),
        });
      }
      const g = map.get(key);
      const qty = Number(row.product_qty ?? row.qty ?? row.quantity ?? 0);
      const price = Number(row.product_sale_price ?? row.price ?? 0);
      const amount = Number(row.amount ?? row.total ?? qty * price);
      g.items.push({ product: nameOf(row.products || row.product || row.product_name, '-'), unit: nameOf(row.unit || row.product_unit, '-'), qty, price, amount });
      g.total += amount;
    });
    return Array.from(map.values()).map((g) => ({
      ...g,
      grandTotal: g.grandTotal || g.total - g.discount + g.transport,
      due: g.due || Math.max(0, (g.grandTotal || g.total - g.discount + g.transport) - g.receive),
    }));
  }, [reports]);

  const visible = invoices.slice(0, entries);
  const selectedClient = clients.find((c) => String(c.id || c.uuid) === String(filters.client_id));
  const sum = (k) => invoices.reduce((s, g) => s + Number(g[k] || 0), 0);
  const excelData = reports.map((r, i) => ({
    SL: i + 1, Date: fmtDate(r.date || r.issued_date), Voucher: r.invoice?.invoice_id || r.invoice_no || '', Client: nameOf(r.client_name || r.client, ''),
    Product: nameOf(r.products || r.product, ''), Qty: r.product_qty ?? r.qty ?? '', Price: r.product_sale_price ?? r.price ?? '', Amount: r.amount ?? r.total ?? '',
  }));

  const cellStyle = { padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' };
  const nestedCell = { padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' };
  const line = { padding: '6px', borderBottom: '1px solid #e2e8f0', minHeight: '26px' };
  const NestedCol = ({ items, render, footer }) => (
    <td style={nestedCell}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((it, idx) => <div key={idx} style={line}>{render(it)}</div>)}
        <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{footer ?? ' '}</div>
      </div>
    </td>
  );
  const SpanCol = ({ value, count, bold }) => (
    <td style={nestedCell}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: count }).map((_, i) => <div key={i} style={{ ...line, borderBottom: '1px solid transparent' }}>{i === 0 ? value : ' '}</div>)}
        <div style={{ padding: '6px', fontWeight: bold ? 'bold' : 'normal', minHeight: '26px' }}>{value}</div>
      </div>
    </td>
  );

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', marginTop: '24px' }}>
        <form onSubmit={handleSearch} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', alignItems: 'center', width: '90%', maxWidth: '900px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flex: 1, minWidth: '260px' }}>
            <input type="date" name="from_date" value={filters.from_date} onChange={handleChange} style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none' }} />
            <input type="date" name="to_date" value={filters.to_date} onChange={handleChange} style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRadius: '0 4px 4px 0', outline: 'none' }} />
          </div>
          <select name="client_id" value={filters.client_id} onChange={handleChange} style={{ flex: 1, minWidth: '200px', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
            <option value="">{t("All Customers")}</option>
            {clients.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name || c.company_name}</option>)}
          </select>
          <button type="submit" disabled={loading} style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            {loading ? t("Searching...") : t("Search")}
          </button>
        </form>
      </div>

      <div className="premium-card" style={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="premium-body" style={{ padding: '32px' }}>
          <PrintHeader />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
              {t("Customer Wise Sales Report | (")}{selectedClient?.name || t("All Customers")}{t(") | From (")}{filters.from_date}{t(") To (")}{filters.to_date})
            </h3>
            <button className="no-print" onClick={() => navigate(-1)} style={{ background: '#7e8a9f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{t("Go Back")}</button>
          </div>

          <TableToolbar entries={entries} setEntries={setEntries} total={invoices.length} excelData={excelData} excelName="Customer_Wise_Sales" onReload={handleSearch} onReset={reset} />

          <div className="table-responsive">
            <table style={{ width: '100%', fontSize: '11px', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #94a3b8' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                  {['SL', 'ISSUED DATE', 'VOUCHER NO', 'CLIENT', 'PRODUCT', 'UNIT', 'QUANTITY', 'PRICE', 'TOTAL', 'DISCOUNT', 'TRANSPORT FARE', 'RETURN QTY', 'GRAND TOTAL', 'RECEIVE', 'DUE'].map((h) => (
                    <th key={h} style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: 600, minWidth: h === 'PRODUCT' ? '150px' : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: '#f8fafc' }}>
                {loading ? (
                  <tr><td colSpan="15" style={{ padding: '24px', color: '#64748b' }}>{t("Loading...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="15" style={{ padding: '24px', color: '#64748b' }}>{t("No sales found for this period.")}</td></tr>
                ) : visible.map((g, idx) => (
                  <tr key={g.key}>
                    <td style={cellStyle}>{idx + 1}</td>
                    <td style={cellStyle}>{fmtDate(g.date)}</td>
                    <td style={cellStyle}>{g.voucher}</td>
                    <td style={cellStyle}>{g.client || '-'}</td>
                    <NestedCol items={g.items} render={(it) => it.product} footer="Total" />
                    <NestedCol items={g.items} render={(it) => it.unit} />
                    <NestedCol items={g.items} render={(it) => it.qty} footer={g.items.reduce((s, it) => s + it.qty, 0)} />
                    <NestedCol items={g.items} render={(it) => money(it.price)} />
                    <NestedCol items={g.items} render={(it) => money(it.amount)} footer={money(g.total)} />
                    <SpanCol value={money(g.discount)} count={g.items.length} />
                    <SpanCol value={money(g.transport)} count={g.items.length} />
                    <SpanCol value={g.returnQty} count={g.items.length} />
                    <SpanCol value={money(g.grandTotal)} count={g.items.length} bold />
                    <SpanCol value={money(g.receive)} count={g.items.length} />
                    <SpanCol value={money(g.due)} count={g.items.length} bold />
                  </tr>
                ))}
              </tbody>
              {invoices.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#e2e8f0', fontWeight: 'bold' }}>
                    <td colSpan="8" style={{ padding: '8px', border: '1px solid #94a3b8', textAlign: 'right' }}>{t("GRAND TOTAL (")}{invoices.length} {t("invoices)")}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{money(sum('total'))}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{money(sum('discount'))}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{money(sum('transport'))}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{sum('returnQty')}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{money(sum('grandTotal'))}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8', color: '#059669' }}>{money(sum('receive'))}</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8', color: '#dc2626' }}>{money(sum('due'))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesCustomerWise;
