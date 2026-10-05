import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PrintHeader from '../../../components/PrintHeader';
import { crmService } from '../../../services/crmService';
import { purchaseService } from '../../../services/purchaseService';
import { accountingService } from '../../../services/accountingService';
import { productService } from '../../../services/productService';
import { useToast } from '../../../context/ToastContext';
import { toList, fmtDate, money } from '../../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../../components/CustomDatePicker';
import SearchableSelect from '../../../components/SearchableSelect';
import apiClient from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import html2canvas from 'html2canvas';

const SupplierStatement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(100);
  const [filters, setFilters] = useState({
    supplier: location.state?.supplierId || location.state?.supplier || new URLSearchParams(location.search).get('supplier') || '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    crmService.getSuppliers({ page_size: 1000 }).then((r) => setSuppliers(toList(r))).catch(() => {});
  }, []);

  const load = async (f = filters) => {
    if (!f.supplier) {
      setRows([]);
      setSummary(null);
      return;
    }
    try {
      setLoading(true);
      const params = {};
      if (f.from_date) params.from_date = f.from_date;
      if (f.to_date) params.to_date = f.to_date;

      const [invoicesRes, returnsRes, productsRes, expensesRes, ledgerRes] = await Promise.allSettled([
        purchaseService.getPurchaseInvoices({ supplier: f.supplier, from_date: f.from_date, to_date: f.to_date }).catch(() => []),
        purchaseService.getPurchaseReturns({ supplier: f.supplier, from_date: f.from_date, to_date: f.to_date }).catch(() => []),
        productService.getProducts({ page_size: 500 }).catch(() => []),
        apiClient.get(ENDPOINTS.ACCOUNTING_EXPENSES, { params: { supplier: f.supplier, from_date: f.from_date, to_date: f.to_date } }).catch(() => []),
        apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_SUPPLIER_LEDGER, { params: { supplier_id: f.supplier, ...params } }).catch(() => [])
      ]);

      const invoices = toList(invoicesRes.status === 'fulfilled' ? invoicesRes.value : []);
      const returns = toList(returnsRes.status === 'fulfilled' ? returnsRes.value : []);
      const products = toList(productsRes.status === 'fulfilled' ? productsRes.value : []);
      const expenses = toList(expensesRes.status === 'fulfilled' ? expensesRes.value : []);
      const ledgerData = ledgerRes.status === 'fulfilled' ? (ledgerRes.value?.data ?? ledgerRes.value) : null;
      
      const ledgerRows = toList(ledgerData?.ledger || ledgerData?.results || ledgerData?.data || ledgerData);

      const productsMap = new Map();
      products.forEach((p) => {
        if (p.id) productsMap.set(String(p.id), p);
        if (p.uuid) productsMap.set(String(p.uuid), p);
      });

      const invoicesMap = new Map();
      invoices.forEach((inv) => {
        if (inv.id) invoicesMap.set(String(inv.id), inv);
        if (inv.uuid) invoicesMap.set(String(inv.uuid), inv);
        if (inv.invoice_number) invoicesMap.set(String(inv.invoice_number), inv);
        if (inv.reference) invoicesMap.set(String(inv.reference), inv);
      });

      const returnsMap = new Map();
      returns.forEach((ret) => {
        if (ret.id) returnsMap.set(String(ret.id), ret);
        if (ret.uuid) returnsMap.set(String(ret.uuid), ret);
        if (ret.return_number) returnsMap.set(String(ret.return_number), ret);
        if (ret.reference) returnsMap.set(String(ret.reference), ret);
      });

      // Missing items fetch
      const missingInvoices = invoices.filter((inv) => !Array.isArray(inv.items) || inv.items.length === 0);
      if (missingInvoices.length > 0 && missingInvoices.length <= 15) {
        await Promise.allSettled(
          missingInvoices.map(async (inv) => {
            try {
              const detail = await purchaseService.getPurchaseInvoiceById(inv.id || inv.uuid);
              if (detail && Array.isArray(detail.items) && detail.items.length > 0) {
                inv.items = detail.items;
                if (inv.id) invoicesMap.set(String(inv.id), inv);
                if (inv.uuid) invoicesMap.set(String(inv.uuid), inv);
              }
            } catch {}
          })
        );
      }

      const missingReturns = returns.filter((ret) => !Array.isArray(ret.items) || ret.items.length === 0);
      if (missingReturns.length > 0 && missingReturns.length <= 15) {
        await Promise.allSettled(
          missingReturns.map(async (ret) => {
            try {
              const detail = await purchaseService.getPurchaseReturnById(ret.id || ret.uuid);
              if (detail && Array.isArray(detail.items) && detail.items.length > 0) {
                ret.items = detail.items;
                if (ret.id) returnsMap.set(String(ret.id), ret);
                if (ret.uuid) returnsMap.set(String(ret.uuid), ret);
              }
            } catch {}
          })
        );
      }

      let rawList = ledgerRows;

      // Fallback construction if ledger is empty
      if (rawList.length === 0) {
        invoices.forEach(inv => {
          rawList.push({
            date: inv.invoice_date || inv.date || inv.created_at,
            type: 'Purchase Invoice',
            reference: `Invoice: ${inv.invoice_number || inv.id}`,
            debit: Number(inv.grand_total || inv.total_amount || inv.net_total || inv.total || 0),
            credit: 0,
            discount: Number(inv.discount_amount || inv.discount || 0),
            shipping_cost: Number(inv.shipping_cost || inv.transport_fare || 0),
            invoice: inv.id,
            id: `inv-${inv.id}`,
            description: `Purchase Invoice ${inv.invoice_number || inv.id}`
          });
        });
        
        returns.forEach(ret => {
          rawList.push({
            date: ret.return_date || ret.date || ret.created_at,
            type: 'Purchase Return',
            reference: `Return: ${ret.return_number || ret.id}`,
            debit: 0,
            credit: Number(ret.total_amount || ret.amount || ret.total || 0),
            invoice: ret.invoice,
            id: `ret-${ret.id}`,
            description: `Purchase Return ${ret.return_number || ret.id}`
          });
        });
      }

      // Merge Payments
      expenses.forEach(exp => {
        if (!rawList.some(r => String(r.id) === String(exp.id) || String(r.id) === `exp-${exp.id}` || String(r.reference).includes(String(exp.id)))) {
          rawList.push({
            date: exp.date || exp.created_at,
            type: exp.transaction_type || 'Payment',
            reference: exp.reference || `Payment: ${exp.id}`,
            debit: 0,
            credit: Number(exp.amount || exp.total || 0),
            is_payment: true,
            id: `exp-${exp.id}`,
            description: exp.description || exp.reference || exp.transaction_type || 'Payment'
          });
        }
      });

      rawList.sort((a, b) => new Date(a.date) - new Date(b.date));

      const list = rawList.map((r) => {
        const refStr = String(r.reference || r.description || '');
        const invMatch = refStr.match(/(Invoice|Purchase|PI)[\s-:]*([a-zA-Z0-9-]+)/i) || refStr.match(/([a-zA-Z0-9-]+)/i);
        const retMatch = refStr.match(/Return[\s-:]*([a-zA-Z0-9-]+)/i);

        let matchedInvoice = null;
        let matchedReturn = null;

        if (retMatch && retMatch[1]) {
          const retKey = retMatch[1].trim();
          matchedReturn = returnsMap.get(retKey) || returns.find(ret => String(ret.id).includes(retKey) || String(ret.return_number).includes(retKey));
        } else if (r.invoice || r.invoice_id || (r.type && String(r.type).toLowerCase().includes('invoice'))) {
           const invKey = (invMatch && invMatch[2]) ? invMatch[2].trim() : String(r.invoice || r.invoice_id || refStr);
           matchedInvoice = invoicesMap.get(invKey) || invoices.find(inv => String(inv.id).includes(invKey) || String(inv.invoice_number).includes(invKey));
        }

        let enrichedItems = [];
        let cleanDescription = r.description || r.reference || '-';
        let discount = r.discount || 0;
        let transport = r.shipping_cost || r.transport_fare || 0;

        if (matchedInvoice) {
          if (matchedInvoice.invoice_number) cleanDescription = `Invoice: ${matchedInvoice.invoice_number}`;
          discount = Number(matchedInvoice.discount_amount || matchedInvoice.discount || 0);
          transport = Number(matchedInvoice.shipping_cost || matchedInvoice.transport_fare || 0);

          const rawItems = Array.isArray(matchedInvoice.items) ? matchedInvoice.items : [];
          if (rawItems.length > 0) {
            enrichedItems = rawItems.map((it) => {
              const prodId = String(it.product || it.product_id || it.id || '');
              const prod = productsMap.get(prodId) || (typeof it.product === 'object' ? it.product : null);
              const qty = Number(it.quantity || it.qty || it.product_qty || 1);
              const price = Number(it.purchase_price || it.price || it.rate || prod?.purchase_price || 0);
              const name = it.product_name || it.name || prod?.name || prod?.title || 'Product';
              const barcode = it.barcode || prod?.barcode || '';
              const unit = it.unit || it.unit_name || prod?.unit_name || prod?.unit || 'PEACE';
              return { product_name: name, barcode: barcode, quantity: qty, unit: unit, price: price, total: qty * price };
            });
          }
        } else if (matchedReturn) {
          if (matchedReturn.return_number) cleanDescription = `Return: ${matchedReturn.return_number}`;
          
          const rawItems = Array.isArray(matchedReturn.items) ? matchedReturn.items : [];
          if (rawItems.length > 0) {
            enrichedItems = rawItems.map((it) => {
              const prodId = String(it.product || it.product_id || it.id || '');
              const prod = productsMap.get(prodId) || (typeof it.product === 'object' ? it.product : null);
              const qty = Number(it.quantity || it.qty || 1);
              const price = Number(it.purchase_price || it.price || prod?.purchase_price || 0);
              const name = it.product_name || it.name || prod?.name || 'Returned Item';
              const barcode = it.barcode || prod?.barcode || '';
              const unit = it.unit || it.unit_name || prod?.unit_name || 'PEACE';
              return { product_name: name, barcode: barcode, quantity: qty, unit: unit, price: price, total: qty * price };
            });
          }
        }

        return { ...r, items: enrichedItems, clean_description: cleanDescription, _discount: discount, _transport: transport };
      });

      setRows(list);
      setSummary(f.supplier ? {
        supplier: suppliers.find(s => String(s.id || s.uuid) === String(f.supplier)),
        ledger: ledgerData
      } : null);
    } catch (e) {
      console.error(e);
      toast.error(t("Failed to load statement"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.supplier, filters.from_date, filters.to_date, suppliers.length]);

  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const clear = () => {
    const f = { supplier: '', from_date: '', to_date: '' };
    setFilters(f);
    load(f);
  };

  const selectedSupplier = summary?.supplier || suppliers.find((s) => String(s.id || s.uuid) === String(filters.supplier));

  const sumOfTransactions = rows.reduce((acc, r) => {
    const isReturn = String(r.type || '').toLowerCase().includes('return');
    const debit = Number(r.debit ?? 0);
    const credit = Number(r.credit ?? 0);
    const bill = debit;
    const ret = isReturn ? credit : 0;
    const rec = !isReturn ? credit : 0;
    return acc + bill - ret - rec;
  }, 0);

  const currentDue = Number(selectedSupplier?.due ?? selectedSupplier?.current_due ?? selectedSupplier?.previous_due ?? summary?.ledger?.due ?? summary?.ledger?.balance ?? 0);
  const trueOpeningBalance = rows.length > 0 ? (currentDue - sumOfTransactions) : currentDue;

  let running = trueOpeningBalance;
  
  let groupedRows = [];
  rows.slice(0, entries).forEach((r) => {
    const dStr = r.date ? new Date(r.date).toISOString().split('T')[0] : 'unknown';
    const isReturn = String(r.type || '').toLowerCase().includes('return');
    const debit = Number(r.debit ?? 0);
    const credit = Number(r.credit ?? 0);
    const bill = debit;
    const ret = isReturn ? credit : 0;
    const rec = (!isReturn && credit > 0) ? credit : 0; // Receive/Payment

    let existing = groupedRows.find(x => x.dStr === dStr);
    if (existing) {
       existing._bill += bill;
       existing._return += ret;
       existing._receive += rec;
       existing._discount += (r._discount || 0);
       existing._transport += (r._transport || 0);
       if (r.items && r.items.length > 0) {
          existing.items = [...(existing.items || []), ...r.items];
       }
    } else {
       groupedRows.push({
         ...r,
         dStr,
         _bill: bill,
         _return: ret,
         _receive: rec,
         items: r.items ? [...r.items] : []
       });
    }
  });

  let computed = groupedRows.map(r => {
    running = running + r._bill - r._return - r._receive;
    return { ...r, _balance: running };
  });

  if (selectedSupplier && computed.length >= 0) {
    computed = [
      {
        isOpening: true,
        date: filters.from_date || '',
        type: 'Previous Due',
        clean_description: 'Opening Balance',
        items: [],
        _bill: 0,
        _return: 0,
        _receive: 0,
        _balance: trueOpeningBalance
      },
      ...computed
    ];
  }

  const th = { padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'center', border: '1px solid #cbd5e1', background: '#e2e8f0', color: 'black', fontWeight: 'bold' };
  const td = { textAlign: 'center', border: '1px solid #e2e8f0', padding: '0', fontSize: 'var(--fs-12, 12px)', color: 'black' };
  const cellPad = { padding: '8px' };

  const handleShare = async () => {
    const element = document.getElementById('statement-content');
    if (!element) {
      toast.error(t("Could not generate image."));
      return;
    }
    
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    const printOnlyElements = element.querySelectorAll('.print-only');
    printOnlyElements.forEach(el => {
      el.dataset.printOnlyRemoved = 'true';
      el.classList.remove('print-only');
    });
    
    try {
      toast.info(t("Generating image for sharing..."));
      await new Promise(r => setTimeout(r, 500));
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      
      noPrintElements.forEach(el => el.style.display = '');

      printOnlyElements.forEach(el => {
        if (el.dataset.printOnlyRemoved) {
          el.classList.add('print-only');
          delete el.dataset.printOnlyRemoved;
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to generate image');
        const file = new File([blob], `Supplier_Statement_${selectedSupplier?.name || 'Unknown'}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Supplier Statement',
            text: `Supplier Statement for ${selectedSupplier ? selectedSupplier.name : 'Supplier'}`,
            files: [file]
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(t("Image downloaded. You can now share it manually."));
        }
      }, 'image/png');
    } catch (error) {
      console.log('Error sharing', error);
      noPrintElements.forEach(el => el.style.display = '');
      printOnlyElements.forEach(el => {
        if (el.dataset.printOnlyRemoved) {
          el.classList.add('print-only');
          delete el.dataset.printOnlyRemoved;
        }
      });
      toast.error(t("Failed to share image."));
    }
  };


  const totalQty = computed.reduce((sum, r) => {
    let q = 0;
    if (r.items) {
      r.items.forEach(it => q += Number(it.quantity || 0));
    }
    return sum + q;
  }, 0);
  const totalBuyPrice = computed.reduce((sum, r) => {
    let b = 0;
    if (r.items) {
      r.items.forEach(it => b += Number(it.total || (Number(it.quantity || 0) * Number(it.price || 0)) || 0));
    }
    return sum + b;
  }, 0);
  const totalDiscount = computed.reduce((sum, r) => sum + Number(r._discount || 0), 0);
  const totalTransport = computed.reduce((sum, r) => sum + Number(r._transport || 0), 0);
  const totalGrandTotal = computed.reduce((sum, r) => sum + Number(r._bill || 0), 0);
  const totalReturn = computed.reduce((sum, r) => sum + Number(r._return || 0), 0);
  const totalReceive = computed.reduce((sum, r) => sum + Number(r._receive || 0), 0);
  const finalDue = computed.length > 0 ? computed[computed.length - 1]._balance : 0;

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <div id="statement-content" style={{ background: 'white', paddingTop: '60px' }}>
        <PrintHeader />
        <div style={{ padding: '0 20px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', margin: '20px 0 10px', color: 'black' }}>Supplier Statement</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: 'var(--fs-12, 12px)', color: 'black', fontWeight: '600' }}>
            <div>
              {selectedSupplier ? (
                <>
                  Supplier Name: {selectedSupplier.name} {selectedSupplier.phone ? `// ${selectedSupplier.phone}` : ''}<br/>
                  {selectedSupplier.phone && <>Supplier Phone: {selectedSupplier.phone}<br/></>}
                  {selectedSupplier.address && <>Supplier Address: {selectedSupplier.address}<br/></>}
                  <div style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', marginTop: '4px', color: 'black' }}>Due: {money(currentDue)}</div>
                </>
              ) : (
                <>Supplier Name: -</>
              )}
            </div>
            <div>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>

          <form className="no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '24px', marginBottom: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--fs-11, 11px)', marginBottom: '4px', color: 'black' }}>Search By Supplier</label>
              <SearchableSelect
                options={suppliers.map((s) => ({ value: s.id || s.uuid, label: `${s.name}${s.phone ? ` (${s.phone})` : ''}`, searchValue: `${s.name} ${s.phone || ''}` }))}
                value={filters.supplier}
                onChange={(val) => set('supplier', val)}
                placeholder={t("Select Supplier")}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--fs-11, 11px)', marginBottom: '4px', color: 'black' }}>Search By Date</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CustomDatePicker value={filters.from_date} onChange={(e) => set('from_date', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: 'var(--fs-12, 12px)' }} />
                <CustomDatePicker value={filters.to_date} onChange={(e) => set('to_date', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: 'var(--fs-12, 12px)' }} />
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
              <button type="button" onClick={handleShare} style={{ padding: '6px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>Share</button>
              <button type="button" onClick={() => window.print()} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>Print</button>
              <button type="button" onClick={() => load()} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>Reset</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1000px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr>
                  <th style={th}>SL ↕</th>
                  <th style={th}>DATE</th>
                  <th style={th}>PRODUCT</th>
                  <th style={th}>UNIT</th>
                  <th style={th}>QUANTITY</th>
                  <th style={th}>PRICE</th>
                  <th style={th}>BUY PRICE</th>
                  <th style={th}>DISCOUNT</th>
                  <th style={th}>TRANSPORT FARE</th>
                  <th style={th}>GRAND TOTAL</th>
                  <th style={th}>PURCHASE RETURN</th>
                  <th style={th}>RECEIVE</th>
                  <th style={th}>DUE</th>
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
                        
                        <td style={td}>
                          {hasItems ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {r.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', fontWeight: '500' }}>
                                  {item.product_name || '-'} {item.barcode ? `(${item.barcode})` : ''}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={cellPad}>{r.isOpening ? 'Previous Due' : (r.clean_description || r.type || '-')}</div>
                          )}
                        </td>

                        <td style={td}>
                          {hasItems ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {r.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', color: '#64748b' }}>{item.unit || 'PEACE'}</div>
                              ))}
                            </div>
                          ) : <div style={cellPad}>-</div>}
                        </td>

                        <td style={td}>
                          {hasItems ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {r.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>{Number(item.quantity || 1)}</div>
                              ))}
                            </div>
                          ) : <div style={cellPad}>-</div>}
                        </td>

                        <td style={td}>
                          {hasItems ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {r.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', fontWeight: '600' }}>{money(item.price || 0)}</div>
                              ))}
                            </div>
                          ) : <div style={cellPad}>-</div>}
                        </td>

                        <td style={td}>
                          {hasItems ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {r.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px 8px', borderBottom: idx < r.items.length - 1 ? '1px solid #e2e8f0' : 'none', fontWeight: '600' }}>{money(item.total || 0)}</div>
                              ))}
                            </div>
                          ) : <div style={cellPad}>-</div>}
                        </td>

                        <td style={td}><div style={cellPad}>{r._discount ? money(r._discount) : (r.isOpening ? '' : '0.00')}</div></td>
                        <td style={td}><div style={cellPad}>{r._transport ? money(r._transport) : (r.isOpening ? '' : '0.00')}</div></td>
                        <td style={td}><div style={cellPad}>{r._bill ? money(r._bill) : (r.isOpening ? '' : '')}</div></td>
                        <td style={td}><div style={cellPad}>{r._return ? money(r._return) : (r.isOpening ? '' : '0')}</div></td>
                        <td style={td}><div style={cellPad}>{r._receive ? money(r._receive) : (r.isOpening ? '' : '0')}</div></td>
                        <td style={td}><div style={cellPad}>{money(r._balance)}</div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#e2e8f0', fontWeight: 'bold' }}>
                  <td colSpan="4" style={{ ...td, textAlign: 'right', padding: '10px' }}>Total:</td>
                  <td style={td}>{totalQty > 0 ? totalQty : '-'}</td>
                  <td style={td}>-</td>
                  <td style={td}>{totalBuyPrice > 0 ? money(totalBuyPrice) : '-'}</td>
                  <td style={td}>{totalDiscount > 0 ? money(totalDiscount) : '-'}</td>
                  <td style={td}>{totalTransport > 0 ? money(totalTransport) : '-'}</td>
                  <td style={td}>{totalGrandTotal > 0 ? money(totalGrandTotal) : '-'}</td>
                  <td style={td}>{totalReturn > 0 ? money(totalReturn) : '-'}</td>
                  <td style={td}>{totalReceive > 0 ? money(totalReceive) : '-'}</td>
                  <td style={td}>{money(finalDue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatement;
