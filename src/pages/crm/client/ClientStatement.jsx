import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PrintHeader from '../../../components/PrintHeader';
import TableToolbar from '../../../components/TableToolbar';
import { crmService } from '../../../services/crmService';
import { accountingService } from '../../../services/accountingService';
import { saleService } from '../../../services/saleService';
import { productService } from '../../../services/productService';
import { useToast } from '../../../context/ToastContext';
import { toList, fmtDate, money } from '../../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../../components/CustomDatePicker';


/**
 * Client statement / ledger → /api/accounting/reports/client-ledger/?client_id=&from_date=&to_date=
 * Enriched with item-level product names, quantities, units, and prices from Sales Invoices and Sales Returns.
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
    crmService.getClients({ page_size: 1000 }).then((r) => setClients(toList(r))).catch(() => {});
  }, []);

  const load = async (f = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (f.from_date) params.from_date = f.from_date;
      if (f.to_date) params.to_date = f.to_date;

      const [ledgerRes, invoicesRes, returnsRes, productsRes, saleItemsRes, receivesRes] = await Promise.allSettled([
        f.client
          ? accountingService.getClientLedger(f.client, params).catch(() => [])
          : accountingService.getDepositReport(params).catch(() => []),
        f.client
          ? saleService.getSalesInvoices({ client: f.client, from_date: f.from_date, to_date: f.to_date }).catch(() => [])
          : Promise.resolve([]),
        f.client
          ? saleService.getSalesReturns({ client: f.client, from_date: f.from_date, to_date: f.to_date }).catch(() => [])
          : Promise.resolve([]),
        productService.getProducts().catch(() => []),
        f.client
          ? saleService.getSaleItems().catch(() => [])
          : Promise.resolve([]),
        f.client
          ? accountingService.getReceives({ client: f.client, from_date: f.from_date, to_date: f.to_date }).catch(() => [])
          : Promise.resolve([])
      ]);

      const res = ledgerRes.status === 'fulfilled' ? ledgerRes.value : [];
      const invoices = toList(invoicesRes.status === 'fulfilled' ? invoicesRes.value : []);
      const returns = toList(returnsRes.status === 'fulfilled' ? returnsRes.value : []);
      const products = toList(productsRes.status === 'fulfilled' ? productsRes.value : []);
      const allSaleItems = toList(saleItemsRes.status === 'fulfilled' ? saleItemsRes.value : []);

      const productsMap = new Map();
      products.forEach((p) => {
        if (p.id) productsMap.set(String(p.id), p);
        if (p.uuid) productsMap.set(String(p.uuid), p);
      });

      // Group sale items by invoice ID
      const itemsByInvoice = new Map();
      allSaleItems.forEach((it) => {
        const invKey = String(it.sale || it.invoice || it.sale_invoice || it.sale_id || it.invoice_id || '');
        if (invKey) {
          if (!itemsByInvoice.has(invKey)) itemsByInvoice.set(invKey, []);
          itemsByInvoice.get(invKey).push(it);
        }
      });

      // Index invoices by multiple identifier formats
      const invoicesMap = new Map();
      invoices.forEach((inv) => {
        if (inv.id) invoicesMap.set(String(inv.id), inv);
        if (inv.uuid) invoicesMap.set(String(inv.uuid), inv);
        if (inv.invoice_id) invoicesMap.set(String(inv.invoice_id), inv);
        if (inv.invoice_no) invoicesMap.set(String(inv.invoice_no), inv);
        if (inv.voucher) invoicesMap.set(String(inv.voucher), inv);
      });

      // Index returns by id, uuid, return_no, reference
      const returnsMap = new Map();
      returns.forEach((ret) => {
        if (ret.id) returnsMap.set(String(ret.id), ret);
        if (ret.uuid) returnsMap.set(String(ret.uuid), ret);
        if (ret.return_no) returnsMap.set(String(ret.return_no), ret);
        if (ret.reference) returnsMap.set(String(ret.reference), ret);
      });

      // Attach standalone items to invoices if items array was missing
      invoices.forEach((inv) => {
        const invId = String(inv.id || inv.uuid);
        if ((!Array.isArray(inv.items) || inv.items.length === 0) && itemsByInvoice.has(invId)) {
          inv.items = itemsByInvoice.get(invId);
        }
      });

      // Fetch individual invoice details for any invoice that still has missing items
      const missingInvoices = invoices.filter((inv) => !Array.isArray(inv.items) || inv.items.length === 0);
      if (missingInvoices.length > 0 && missingInvoices.length <= 15) {
        await Promise.allSettled(
          missingInvoices.map(async (inv) => {
            try {
              const detail = await saleService.getSalesInvoiceById(inv.id || inv.uuid);
              if (detail && Array.isArray(detail.items) && detail.items.length > 0) {
                inv.items = detail.items;
                if (inv.id) invoicesMap.set(String(inv.id), inv);
                if (inv.uuid) invoicesMap.set(String(inv.uuid), inv);
              }
            } catch {}
          })
        );
      }

      // Process ledger transactions and enrich them with item details
      let rawList = toList(res?.ledger || res?.transactions || res?.statement || res?.results || res);

      // FALLBACK for missing ledger API: Construct from invoices, returns, receives
      if (rawList.length === 0 && f.client) {
        const receives = toList(receivesRes?.status === 'fulfilled' ? receivesRes.value : []);
        
        invoices.forEach(inv => {
          rawList.push({
            date: inv.date || inv.created_at,
            type: 'Sale Invoice',
            reference: `Invoice: ${inv.invoice_no || inv.invoice_id || inv.id}`,
            debit: Number(inv.grand_total || inv.total_amount || inv.total || inv.bill || 0),
            credit: 0,
            invoice: inv.id,
            id: `inv-${inv.id}`,
            description: `Sale Invoice ${inv.invoice_no || inv.id}`
          });
        });
        
        returns.forEach(ret => {
          rawList.push({
            date: ret.date || ret.created_at,
            type: 'Sales Return',
            reference: `Return: ${ret.return_no || ret.id}`,
            debit: 0,
            credit: Number(ret.total_amount || ret.return_amount || ret.total || 0),
            invoice: ret.invoice,
            id: `ret-${ret.id}`,
            description: `Sales Return ${ret.return_no || ret.id}`
          });
        });
        
        receives.forEach(rec => {
          rawList.push({
            date: rec.date || rec.created_at,
            type: 'Receive',
            reference: `Receipt: ${rec.receipt_no || rec.id}`,
            debit: 0,
            credit: Number(rec.amount || rec.total || 0),
            receive: Number(rec.amount || rec.total || 0),
            id: `rec-${rec.id}`,
            description: `Receive Payment ${rec.receipt_no || rec.id}`
          });
        });
        
        rawList.sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      const list = rawList.map((r) => {
        const refStr = String(r.reference || r.description || '');
        const invMatch = refStr.match(/Invoice:\s*([a-zA-Z0-9-]+)/i);
        const retMatch = refStr.match(/Return:\s*([a-zA-Z0-9-]+)/i);

        let matchedInvoice = null;
        let matchedReturn = null;

        if (invMatch && invMatch[1]) {
          const invKey = invMatch[1].trim();
          matchedInvoice = invoicesMap.get(invKey);
          if (!matchedInvoice) {
            matchedInvoice = invoices.find((inv) =>
              String(inv.id || '').includes(invKey) ||
              invKey.includes(String(inv.id || '')) ||
              String(inv.invoice_no || '').includes(invKey) ||
              String(inv.invoice_id || '').includes(invKey)
            );
          }
        } else if (r.invoice || r.invoice_id) {
          matchedInvoice = invoicesMap.get(String(r.invoice || r.invoice_id));
        }

        if (retMatch && retMatch[1]) {
          const retKey = retMatch[1].trim();
          matchedReturn = returnsMap.get(retKey);
          if (!matchedReturn) {
            matchedReturn = returns.find((ret) =>
              String(ret.id || '').includes(retKey) ||
              retKey.includes(String(ret.id || '')) ||
              String(ret.return_no || '').includes(retKey)
            );
          }
        }

        let enrichedItems = [];
        let cleanDescription = r.description || r.reference || '-';

        if (matchedInvoice) {
          const invNo = matchedInvoice.invoice_no || matchedInvoice.invoice_id || matchedInvoice.voucher || (matchedInvoice.id ? `INV-${String(matchedInvoice.id).slice(0, 8)}` : '');
          if (invNo) cleanDescription = `Invoice: ${invNo}`;

          const rawItems = Array.isArray(matchedInvoice.items) && matchedInvoice.items.length > 0
            ? matchedInvoice.items
            : (itemsByInvoice.get(String(matchedInvoice.id || matchedInvoice.uuid)) || []);

          if (rawItems.length > 0) {
            enrichedItems = rawItems.map((it) => {
              const prodId = String(it.product || it.product_id || it.id || '');
              const prod = productsMap.get(prodId) || (typeof it.product === 'object' ? it.product : null);
              const qty = Number(it.quantity || it.qty || it.product_qty || 1);
              const price = Number(
                it.selling_price ||
                it.price ||
                it.sales_price ||
                it.rate ||
                prod?.selling_price ||
                prod?.sales_price ||
                (it.total_selling_price ? Number(it.total_selling_price) / qty : 0) ||
                0
              );
              const name = it.product_name || it.name || prod?.name || prod?.title || (it.product ? `Product #${it.product}` : 'Product');
              const unit = it.unit || it.unit_name || prod?.unit_name || prod?.unit || 'PEACE';
              return {
                product_name: name,
                quantity: qty,
                unit: unit,
                price: price,
                total: Number(it.total_selling_price || it.total || (qty * price))
              };
            });
          }
        } else if (matchedReturn) {
          const retNo = matchedReturn.return_no || matchedReturn.reference || (matchedReturn.id ? `SR-${String(matchedReturn.id).slice(0, 8)}` : '');
          if (retNo) cleanDescription = `Return: ${retNo}`;

          const rawItems = Array.isArray(matchedReturn.items) ? matchedReturn.items : [];
          if (rawItems.length > 0) {
            enrichedItems = rawItems.map((it) => {
              const prodId = String(it.product || it.product_id || it.id || '');
              const prod = productsMap.get(prodId) || (typeof it.product === 'object' ? it.product : null);
              const qty = Number(it.quantity || it.qty || 1);
              const price = Number(it.selling_price || it.price || it.sales_price || prod?.selling_price || 0);
              const name = it.product_name || it.name || prod?.name || 'Returned Item';
              const unit = it.unit || it.unit_name || prod?.unit_name || 'PEACE';
              return {
                product_name: name,
                quantity: qty,
                unit: unit,
                price: price,
                total: qty * price
              };
            });
          }
        }

        return {
          ...r,
          items: enrichedItems,
          clean_description: cleanDescription
        };
      });

      setRows(list);
      setSummary(f.client && !Array.isArray(res) ? res : null);
    } catch (e) {
      console.error("Error loading client statement:", e);
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

  // Running balance calculation
  let running = Number(summary?.opening_balance || summary?.previous_due || selectedClient?.previous_due || 0);
  
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
    
    running = running + bill - salesReturn - receive + moneyReturn;
    return { ...r, _bill: bill, _salesReturn: salesReturn, _receive: receive, _moneyReturn: moneyReturn, _labourCost: labourCost, _balance: running };
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
        clean_description: 'Opening Balance',
        items: [],
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

  const th = { padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'center', border: '1px solid #cbd5e1', background: '#e2e8f0', color: 'black', fontWeight: 'bold' };
  const td = { textAlign: 'center', border: '1px solid #e2e8f0', padding: '0', fontSize: 'var(--fs-12, 12px)', color: 'black' };
  const cellPad = { padding: '8px' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      <div style={{ padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', margin: '20px 0 30px', color: 'black' }}>Client Statement</h2>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: 'var(--fs-12, 12px)', color: 'black', fontWeight: '600' }}>
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
            <label style={{ display: 'block', fontSize: 'var(--fs-11, 11px)', marginBottom: '4px', color: 'black' }}>Search By Client</label>
            <select value={filters.client} onChange={(e) => set('client', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: 'var(--fs-12, 12px)' }}>
              <option value="">{t("Select Client")}</option>
              {clients.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
            </select>
            {selectedClient && <div style={{ fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', marginTop: '4px', color: 'black' }}>Due : {money(selectedClient.due ?? selectedClient.current_balance ?? closing)}</div>}
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 'var(--fs-11, 11px)', marginBottom: '4px', color: 'black' }}>Search By Date</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CustomDatePicker  value={filters.from_date} onChange={(e) => set('from_date', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: 'var(--fs-12, 12px)' }} />
              <CustomDatePicker  value={filters.to_date} onChange={(e) => set('to_date', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: 'var(--fs-12, 12px)' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
            <button type="button" onClick={clear} style={{ padding: '8px 24px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>Clear Filter</button>
          </div>
        </form>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: 'var(--fs-12, 12px)', color: 'black' }}>
            Show <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ border: '1px solid #cbd5e1', padding: '2px 4px', borderRadius: '4px' }}>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select> entries
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => window.print()} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>
              Print
            </button>
            <button type="button" onClick={() => load()} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>
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
                  const hasItems = Array.isArray(r.items) && r.items.length > 0;
                  
                  return (
                    <tr key={r.id || i}>
                      <td style={td}><div style={cellPad}>{i + 1}</div></td>
                      <td style={td}><div style={cellPad}>{r.isOpening ? '-' : fmtDate(r.date)}</div></td>
                      
                      {/* PRODUCT */}
                      <td style={td}>
                        {hasItems ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {r.items.map((item, idx) => (
                              <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', fontWeight: '500' }}>
                                {item.product_name || '-'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={cellPad}>
                            {r.isOpening
                              ? 'Previous Due'
                              : (r._receive > 0
                                  ? 'Receive'
                                  : (r._moneyReturn > 0
                                      ? 'Money Return'
                                      : (r.product || r.product_name || (r._bill > 0 ? 'Sale Invoice' : '-'))))}
                          </div>
                        )}
                      </td>

                      {/* QTY */}
                      <td style={td}>
                        {hasItems ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {r.items.map((item, idx) => (
                              <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                {Number(item.quantity || 1)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={cellPad}>
                            {r.isOpening ? '-' : (r.quantity ?? r.qty ?? (r._bill > 0 ? 1 : '-'))}
                          </div>
                        )}
                      </td>

                      {/* UNIT */}
                      <td style={td}>
                        {hasItems ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {r.items.map((item, idx) => (
                              <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', color: '#64748b' }}>
                                {item.unit || 'PEACE'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={cellPad}>
                            {r.isOpening ? '-' : (r.unit || (r._bill > 0 ? 'PEACE' : '-'))}
                          </div>
                        )}
                      </td>

                      {/* PRICE */}
                      <td style={td}>
                        {hasItems ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {r.items.map((item, idx) => (
                              <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', fontWeight: '600' }}>
                                {money(item.price || 0)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={cellPad}>
                            {r.isOpening ? '-' : (r._bill > 0 ? money(r._bill) : (r._salesReturn > 0 ? money(r._salesReturn) : '-'))}
                          </div>
                        )}
                      </td>

                      {/* DESCRIPTION */}
                      <td style={td}>
                        <div style={cellPad}>
                          {r.clean_description || r.description || r.reference || '-'}
                        </div>
                      </td>

                      {/* LABOUR COST */}
                      <td style={td}><div style={cellPad}>{r._labourCost ? money(r._labourCost) : '0'}</div></td>
                      {/* BILL */}
                      <td style={td}><div style={cellPad}>{r._bill ? money(r._bill) : '0.00'}</div></td>
                      {/* SALES RETURN */}
                      <td style={td}><div style={cellPad}>{r._salesReturn ? money(r._salesReturn) : '0'}</div></td>
                      {/* RECEIVE */}
                      <td style={td}><div style={cellPad}>{r._receive ? money(r._receive) : '0.00'}</div></td>
                      {/* MONEY RETURN */}
                      <td style={td}><div style={cellPad}>{r._moneyReturn ? money(r._moneyReturn) : '0.00'}</div></td>
                      {/* BALANCE */}
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
          <div style={{ fontSize: 'var(--fs-13, 13px)', color: 'black' }}>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'black', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}>Previous</button>
            <button style={{ padding: '6px 12px', background: '#3b82f6', border: '1px solid #3b82f6', color: 'white', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}>1</button>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'black', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}>Next</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientStatement;
