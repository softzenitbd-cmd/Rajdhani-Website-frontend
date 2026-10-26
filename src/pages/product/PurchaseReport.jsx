import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Printer, RotateCcw, Share2 } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { crmService } from '../../services/crmService';
import { purchaseService } from '../../services/purchaseService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { toList, fmtDate, money } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../components/CustomDatePicker';
import SearchableSelect from '../../components/SearchableSelect';
import apiClient from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import html2canvas from 'html2canvas';

/**
 * Purchase Report (mirrors Supplier Statement ledger format)
 */
const PurchaseReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(100);
  const [filters, setFilters] = useState({
    supplier: location.state?.supplierId || location.state?.supplier || new URLSearchParams(location.search).get('supplier') || '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    crmService.getSuppliers({ page_size: 1000 }).then((r) => setSuppliers(toList(r))).catch(() => {});
    productService.getProducts({ page_size: 500 }).then((r) => setProducts(toList(r))).catch(() => {});
  }, []);

  const load = async (f = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (f.from_date) params.from_date = f.from_date;
      if (f.to_date) params.to_date = f.to_date;

      const [invoicesRes, returnsRes, expensesRes, ledgerRes] = await Promise.allSettled([
        purchaseService.getPurchaseInvoices({ supplier: f.supplier || undefined, from_date: f.from_date, to_date: f.to_date }).catch(() => []),
        purchaseService.getPurchaseReturns({ supplier: f.supplier || undefined, from_date: f.from_date, to_date: f.to_date }).catch(() => []),
        apiClient.get(ENDPOINTS.ACCOUNTING_EXPENSES, { params: { supplier: f.supplier || undefined, from_date: f.from_date, to_date: f.to_date } }).catch(() => []),
        f.supplier 
          ? apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_SUPPLIER_LEDGER, { params: { supplier_id: f.supplier, ...params } }).catch(() => [])
          : Promise.resolve([])
      ]);

      const invoices = toList(invoicesRes.status === 'fulfilled' ? invoicesRes.value : []);
      const returns = toList(returnsRes.status === 'fulfilled' ? returnsRes.value : []);
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

      let rawList = ledgerRows;

      // Fallback: If no backend ledger rows, construct from invoices, returns, expenses
      if (rawList.length === 0) {
        invoices.forEach((inv) => {
          rawList.push({
            date: inv.date || inv.purchase_date || inv.created_at,
            type: 'Purchase Invoice',
            reference: `Invoice: ${inv.invoice_number || inv.id}`,
            debit: 0,
            credit: Number(inv.grand_total || inv.total_amount || inv.total || 0),
            bill: Number(inv.grand_total || inv.total_amount || inv.total || 0),
            discount: Number(inv.discount || 0),
            transport_fare: Number(inv.transport_fare || 0),
            invoice: inv.id,
            id: `inv-${inv.id}`,
            description: `Purchase Invoice #${inv.invoice_number || inv.id}`,
            supplier: inv.supplier
          });
        });

        returns.forEach((ret) => {
          rawList.push({
            date: ret.date || ret.created_at,
            type: 'Purchase Return',
            reference: `Return: ${ret.return_number || ret.id}`,
            debit: Number(ret.total_amount || ret.return_amount || ret.total || 0),
            credit: 0,
            return_amount: Number(ret.total_amount || ret.return_amount || ret.total || 0),
            id: `ret-${ret.id}`,
            description: `Purchase Return #${ret.return_number || ret.id}`,
            supplier: ret.supplier
          });
        });

        expenses.forEach((exp) => {
          rawList.push({
            date: exp.date || exp.expense_date || exp.created_at,
            type: 'Payment',
            reference: `Expense: ${exp.voucher_no || exp.id}`,
            debit: Number(exp.amount || 0),
            credit: 0,
            payment: Number(exp.amount || 0),
            id: `exp-${exp.id}`,
            description: exp.title || exp.name || 'Supplier Payment',
            supplier: exp.supplier
          });
        });

        rawList.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      }

      // Enrich with items and clean description
      const list = rawList.map((r) => {
        let cleanDescription = r.description || '';
        let matchedInvoice = null;
        let matchedReturn = null;

        const invIdMatch = cleanDescription.match(/Invoice\s*(?:#|:)?\s*([a-zA-Z0-9-]+)/i);
        if (invIdMatch) {
          const key = invIdMatch[1].trim();
          matchedInvoice = invoicesMap.get(key);
        }
        if (!matchedInvoice && r.invoice) {
          matchedInvoice = invoicesMap.get(String(r.invoice));
        }

        const retIdMatch = cleanDescription.match(/Return\s*(?:#|:)?\s*([a-zA-Z0-9-]+)/i);
        if (retIdMatch) {
          const key = retIdMatch[1].trim();
          matchedReturn = returnsMap.get(key);
        }
        if (!matchedReturn && r.return_id) {
          matchedReturn = returnsMap.get(String(r.return_id));
        }

        let rawItems = [];
        if (matchedInvoice && Array.isArray(matchedInvoice.items) && matchedInvoice.items.length > 0) {
          rawItems = matchedInvoice.items;
        } else if (matchedReturn && Array.isArray(matchedReturn.items) && matchedReturn.items.length > 0) {
          rawItems = matchedReturn.items;
        } else if (Array.isArray(r.items) && r.items.length > 0) {
          rawItems = r.items;
        }

        const enrichedItems = rawItems.map((it) => {
          const prodId = it.product || it.product_id;
          const p = prodId ? productsMap.get(String(prodId)) : null;
          const name = it.product_name || p?.name || 'Product';
          const qty = Number(it.quantity || it.qty || 1);
          const price = Number(it.unit_price || it.purchase_price || it.price || p?.purchase_price || 0);
          return {
            name: name,
            quantity: qty,
            price: price,
            total: qty * price
          };
        });

        return {
          ...r,
          items: enrichedItems,
          clean_description: cleanDescription
        };
      });

      setRows(list);
      setSummary(f.supplier && !Array.isArray(ledgerData) ? ledgerData : null);
    } catch (e) {
      console.error("Error loading purchase report:", e);
      toast.error(e.message || t("Failed to load purchase report"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.supplier, filters.from_date, filters.to_date]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const clear = () => {
    const f = { supplier: '', from_date: '', to_date: '' };
    setFilters(f);
    load(f);
  };

  const selectedSupplier = suppliers.find((s) => String(s.id || s.uuid) === String(filters.supplier));

  const clientOpeningDue = Number(
    (filters.from_date && summary?.opening_balance !== undefined)
      ? summary.opening_balance
      : (selectedSupplier?.opening_balance ?? selectedSupplier?.opening_due ?? selectedSupplier?.previous_due ?? summary?.opening_balance ?? 0)
  );
  const trueOpeningBalance = clientOpeningDue;

  let running = trueOpeningBalance;
  
  let computed = rows.slice(0, entries).map((r) => {
    const t = String(r.type || r.transaction_type || '').toLowerCase();
    const debit = Number(r.debit ?? 0);
    const credit = Number(r.credit ?? 0);
    const isReturn = /return/.test(t);
    const isPayment = /payment|expense/.test(t);

    const bill = Number(r.bill ?? (credit > 0 && !isReturn ? credit : 0));
    const ret = Number(r.return_amount ?? (debit > 0 && isReturn ? debit : 0));
    const payment = Number(r.payment ?? (debit > 0 && isPayment ? debit : 0));
    const discount = Number(r.discount ?? 0);
    const transport = Number(r.transport_fare ?? 0);

    running = running + bill - ret - payment;
    return { ...r, _bill: bill, _return: ret, _receive: payment, _discount: discount, _transport: transport, _balance: running };
  });

  if (selectedSupplier && computed.length >= 0) {
    computed = [
      {
        isOpening: true,
        date: filters.from_date || '',
        type: 'Previous Due',
        description: 'Opening Balance',
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
    const element = document.getElementById('purchase-report-content');
    if (!element) return;
    try {
      toast.info(t("Generating image..."));
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `Purchase_Report_${selectedSupplier?.name || 'All'}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ title: 'Purchase Report', files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(t("Report image downloaded"));
        }
      });
    } catch {
      toast.error(t("Failed to generate report image"));
    }
  };

  const totalGrandTotal = computed.reduce((sum, r) => sum + Number(r._bill || 0), 0);
  const totalReturn = computed.reduce((sum, r) => sum + Number(r._return || 0), 0);
  const totalReceive = computed.reduce((sum, r) => sum + Number(r._receive || 0), 0);
  const finalDue = computed.length > 0 ? computed[computed.length - 1]._balance : 0;

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <div id="purchase-report-content" style={{ background: 'white', paddingTop: '20px' }}>
        <PrintHeader />
        <div style={{ padding: '0 20px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-20, 20px)', fontWeight: 'bold', margin: '20px 0 10px', color: 'black' }}>
            {t("Purchase Report / Supplier Statement")}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: 'var(--fs-12, 12px)', color: 'black', fontWeight: '600' }}>
            <div>
              {selectedSupplier ? (
                <>
                  {t("Supplier Name:")} {selectedSupplier.company_name ? `${selectedSupplier.company_name} - ${selectedSupplier.name}` : selectedSupplier.name} {selectedSupplier.phone ? `// ${selectedSupplier.phone}` : ''}<br/>
                  {selectedSupplier.phone && <>{t("Phone:")} {selectedSupplier.phone}<br/></>}
                  {selectedSupplier.address && <>{t("Address:")} {selectedSupplier.address}<br/></>}
                  <div style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', marginTop: '4px', color: 'black' }}>
                    {t("Due:")} {money(finalDue)}
                  </div>
                </>
              ) : (
                <>{t("All Suppliers Purchase Report")}</>
              )}
            </div>
            <div>{t("Date:")} {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>

          <form className="no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '24px', marginBottom: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--fs-11, 11px)', marginBottom: '4px', color: 'black' }}>{t("Search By Supplier")}</label>
              <SearchableSelect
                options={suppliers.map((s) => ({ value: s.id || s.uuid, label: `${s.company_name ? `${s.company_name} - ` : ''}${s.name}${s.phone ? ` (${s.phone})` : ''}`, searchValue: `${s.name} ${s.company_name || ''} ${s.phone || ''}` }))}
                value={filters.supplier}
                onChange={(val) => set('supplier', val)}
                placeholder={t("Select Supplier")}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--fs-11, 11px)', marginBottom: '4px', color: 'black' }}>{t("Date")}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CustomDatePicker value={filters.from_date} onChange={(e) => set('from_date', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', color: 'black' }} />
                <CustomDatePicker value={filters.to_date} onChange={(e) => set('to_date', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', color: 'black' }} />
              </div>
            </div>
          </form>

          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 'var(--fs-12, 12px)', color: 'black' }}>{t("Show")}</span>
              <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', color: 'black' }}>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span style={{ fontSize: 'var(--fs-12, 12px)', color: 'black' }}>{t("entries")}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Printer size={14} /> {t("Print")}
              </button>
              <button type="button" onClick={handleShare} style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Share2 size={14} /> {t("Share")}
              </button>
              <button type="button" onClick={clear} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCcw size={14} /> {t("Reset")}
              </button>
              <button type="button" onClick={() => navigate('/product/purchase/add-new')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-12, 12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> {t("Add Purchase")}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit', background: 'white' }}>
              <thead>
                <tr>
                  <th style={th}>{t("SL")}</th>
                  <th style={th}>{t("Date")}</th>
                  <th style={th}>{t("Type")}</th>
                  <th style={{ ...th, width: '38%', textAlign: 'left' }}>{t("Particulars / Items")}</th>
                  <th style={th}>{t("Bill (৳)")}</th>
                  <th style={th}>{t("Return (৳)")}</th>
                  <th style={th}>{t("Payment (৳)")}</th>
                  <th style={th}>{t("Balance (৳)")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ ...td, padding: '24px', color: '#64748b' }}>{t("Loading purchase statement...")}</td>
                  </tr>
                ) : computed.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ ...td, padding: '24px', color: '#64748b' }}>{t("No records found")}</td>
                  </tr>
                ) : (
                  computed.map((r, i) => (
                    <tr key={r.id || i} style={{ background: r.isOpening ? '#f1f5f9' : 'white', fontWeight: r.isOpening ? 'bold' : 'normal' }}>
                      <td style={{ ...td, ...cellPad }}>{i + 1}</td>
                      <td style={{ ...td, ...cellPad }}>{fmtDate(r.date) || '-'}</td>
                      <td style={{ ...td, ...cellPad }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: 'var(--fs-10, 10px)', 
                          fontWeight: 'bold', 
                          background: r.isOpening ? '#e2e8f0' : r._bill > 0 ? '#fee2e2' : r._receive > 0 ? '#dcfce7' : '#fef9c3',
                          color: r.isOpening ? '#334155' : r._bill > 0 ? '#991b1b' : r._receive > 0 ? '#166534' : '#854d0e'
                        }}>
                          {t(r.type || 'Transaction')}
                        </span>
                      </td>
                      <td style={{ ...td, padding: '8px 12px', textAlign: 'left' }}>
                        <div>{r.clean_description || '-'}</div>
                        {r.items && r.items.length > 0 && (
                          <div style={{ marginTop: '4px', fontSize: 'var(--fs-11, 11px)', color: '#475569' }}>
                            {r.items.map((it, idx) => (
                              <div key={idx} style={{ display: 'inline-block', marginRight: '8px', background: '#f8fafc', padding: '1px 6px', borderRadius: '3px', border: '1px solid #e2e8f0', marginTop: '2px' }}>
                                • {it.name} ({it.quantity} × ৳{it.price}) = ৳{money(it.total)}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ ...td, ...cellPad }}>{r._bill > 0 ? money(r._bill) : '-'}</td>
                      <td style={{ ...td, ...cellPad }}>{r._return > 0 ? money(r._return) : '-'}</td>
                      <td style={{ ...td, ...cellPad }}>{r._receive > 0 ? money(r._receive) : '-'}</td>
                      <td style={{ ...td, ...cellPad, fontWeight: 'bold' }}>{money(r._balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {computed.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan="4" style={{ ...td, padding: '10px 12px', textAlign: 'right' }}>{t("Total:")}</td>
                    <td style={{ ...td, padding: '10px 8px' }}>{money(totalGrandTotal)}</td>
                    <td style={{ ...td, padding: '10px 8px' }}>{money(totalReturn)}</td>
                    <td style={{ ...td, padding: '10px 8px' }}>{money(totalReceive)}</td>
                    <td style={{ ...td, padding: '10px 8px', color: '#1e293b' }}>{money(finalDue)}</td>
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

export default PurchaseReport;
