import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { purchaseService } from '../../services/purchaseService';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';


const Profit = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [profitData, setProfitData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchProfit = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      // Fire all major API calls concurrently to speed up the page load
      const [res, purchaseRes, invoicesRes, saleItemsRes, productsRes] = await Promise.all([
        accountingService.getProfit(filters).catch(() => ({})),
        purchaseService.getPurchaseInvoices(filters).catch(() => []),
        saleService.getSalesInvoices(filters).catch(() => []),
        saleService.getSaleItems({ limit: 20000, from_date: filters.from_date, to_date: filters.to_date }).catch(() => []),
        productService.getProducts().catch(() => [])
      ]);
      
      let data = (res && typeof res === 'object') ? { ...res } : {};

      delete data['Total Client Due'];
      delete data['Total Supplier Due'];
      delete data['Total Buy Price'];

      try {
        const invoices = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.results || invoicesRes?.data || []);
        const rawSaleItems = Array.isArray(saleItemsRes) ? saleItemsRes : (saleItemsRes?.results || saleItemsRes?.data || []);
        
        let calcBuy = 0;
        let totalSales = 0;
        let totalDiscount = 0;

        // Create map of items by invoice ID
        const itemsByInvoice = new Map();
        rawSaleItems.forEach(it => {
           const key = String(it.sale ?? it.invoice ?? it.sale_invoice ?? it.sale_id ?? it.invoice_id);
           if (!itemsByInvoice.has(key)) itemsByInvoice.set(key, []);
           itemsByInvoice.get(key).push(it);
        });

        const products = Array.isArray(productsRes) ? productsRes : (productsRes?.results || productsRes?.data || []);
        const productMap = new Map();
        products.forEach(p => {
          if (p && p.id) {
             productMap.set(String(p.id), Number(p.buying_price || p.purchase_price || 0));
          }
        });

        invoices.forEach(inv => {
          if (inv.status === undefined || Number(inv.status) === 1) {
            totalSales += Number(inv.grand_total || inv.total_amount || 0);
            totalDiscount += Number(inv.discount || inv.total_discount || 0);

            const invId = String(inv.id || inv.uuid);
            const items = Array.isArray(inv.items) && inv.items.length ? inv.items : (itemsByInvoice.get(invId) || []);
            
            items.forEach(it => {
              // The backend API might only return product as a string ID, so fallback to productMap
              let productBuyPrice = 0;
              if (it.product && typeof it.product === 'object') {
                 productBuyPrice = Number(it.product.purchase_price || it.product.buying_price || it.product.buy_price || 0);
              } else if (it.product) {
                 productBuyPrice = productMap.get(String(it.product)) || 0;
              }

              const cost = Number(it.purchase_price || it.buy_price || productBuyPrice || 0);
              const qty = Number(it.quantity || it.qty || it.product_qty || 0);
              calcBuy += cost * qty;
            });
          }
        });
        
        data['Cost of Sold Goods'] = '৳ ' + calcBuy.toFixed(2);

        const currentBackendSales = parseFloat(String(data['Total Sales'] || '0').replace(/[^\d.-]/g, '')) || 0;
        if (currentBackendSales === 0) {
          data['Total Sales'] = '৳ ' + totalSales.toFixed(2);
        }
        const currentBackendDiscount = parseFloat(String(data['Discount'] || '0').replace(/[^\d.-]/g, '')) || 0;
        if (currentBackendDiscount === 0) {
          data['Discount'] = '৳ ' + totalDiscount.toFixed(2);
        }

        const purchases = Array.isArray(purchaseRes) ? purchaseRes : (purchaseRes?.results || []);
        let totalPurchases = 0;
        purchases.forEach(inv => {
          totalPurchases += Number(inv.grand_total || inv.total_amount || 0);
        });
        data['Total Purchases'] = '৳ ' + totalPurchases.toFixed(2);
        
        const ts = parseFloat(String(data['Total Sales'] || '0').replace(/[^\d.-]/g, '')) || 0;
        const pp = ts - calcBuy;
        data['Product Profit'] = '৳ ' + pp.toFixed(2);
        
        const te = parseFloat(String(data['Total Expense'] || '0').replace(/[^\d.-]/g, '')) || 0;
        data['Net Profit'] = '৳ ' + (pp - te).toFixed(2);
      } catch (e) { console.error(e); }

      setProfitData(data);
    } catch (error) {
      toast.error(error?.message || t("Failed to load profit report"));
      setProfitData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfit();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfit();
  };

  return (
    <div className="premium-card">
      <div className="premium-header">
        <div>
          <h2 className="premium-title" style={{ textTransform: 'uppercase', margin: 0 }}>{t("Profit & Loss Ledger")}</h2>
          <span style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>{t("Live calculation based on sales, purchases, receives & expenses")}</span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate(-1)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>{t("Go Back")}</button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '32px' }}>
        <PrintHeader showOnScreen={true} />
        
        {/* Centered Date Search */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '640px' }}>
            <label className="filter-label" style={{ display: 'block', marginBottom: '8px', textAlign: 'center', fontWeight: 'bold' }}>{t('common.search_by_date')}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flex: 1 }}>
                <CustomDatePicker 
                   
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-outline" 
                  style={{ borderRadius: '8px 0 0 8px', borderRight: 'none', width: '50%', padding: '10px' }} 
                />
                <CustomDatePicker 
                   
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-outline" 
                  style={{ borderRadius: '0 8px 8px 0', width: '50%', padding: '10px' }} 
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ padding: '0 28px', fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold' }}>{t("Search")}</button>
              <button type="button" onClick={() => { setFromDate(''); setToDate(''); setTimeout(fetchProfit, 50); }} className="btn-secondary" style={{ padding: '0 16px', background: '#94a3b8' }}>{t("Reset")}</button>
            </div>
          </form>
        </div>

        {/* Center the table and print button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '680px' }}>
            {/* Table Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b' }}>
                {loading ? t("Recalculating...") : t("Formulas: Product Profit = Sales - Cost | Net Profit = Product Profit - Expenses")}
              </span>
              <button className="btn-blue" style={{ background: '#06b6d4', padding: '6px 14px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', borderColor: '#06b6d4' }} onClick={() => window.print()}>
                <Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t("Print Profit Statement")}
              </button>
            </div>

            <table className="custom-table" style={{ border: '1px solid #000', width: '100%', boxShadow: 'none', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', padding: '6px', background: '#808080', color: '#000', borderRight: '1px solid #000', width: '60%', borderBottom: '1px solid #000', fontWeight: 'bold' }}>{t("টাইটেল", "Title")}</th>
                  <th style={{ textAlign: 'center', padding: '6px', background: '#808080', color: '#000', width: '40%', borderBottom: '1px solid #000', fontWeight: 'bold' }}>{t("টাকা", "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!profitData || Object.keys(profitData).length === 0) return null;
                  
                  const layout = [
                    { key: "Total Sales", label: t("মোট বিক্রয়") },
                    { key: "Cost of Sold Goods", label: t("মোট ক্রয় মূল্য") },
                    { key: "Previous Due", label: t("পূর্বের বাকি") },
                    { key: "Total Due", label: t("মোট বাকি") },
                    { key: "Total Receive", label: t("মোট জমা") },
                    { key: "Total Expense", label: t("মোট ব্যয়") },
                    { key: "Opening Balance", label: t("প্রারম্ভিক ব্যালেন্স") },
                    { key: "Total Balance", label: t("মোট ব্যালেন্স") },
                    { key: "Gross Profit", label: t("গ্রস প্রফিট") },
                    { key: "Discount", label: t("ডিসকাউন্ট") },
                    { key: "Product Profit", label: t("পণ্য প্রফিট") },
                    { key: "Net Profit", label: t("নিট প্রফিট") }
                  ];

                  return layout.map((item, idx) => {
                    let val = profitData[item.key];
                    if (val === undefined) val = "৳ 0.00";
                    if (typeof val === 'number') val = `৳ ${val.toFixed(2)}`;
                    
                    if (item.key === "Gross Profit" && (val === "৳ 0.00" || val === undefined)) {
                       val = profitData["Total Sales"] || "৳ 0.00";
                    }

                    return (
                      <tr key={item.key} style={{ background: '#ffffff' }}>
                        <td style={{ textAlign: 'left', padding: '4px 10px', borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: '500', color: '#000', fontSize: '13px' }}>
                          {item.label}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '4px 10px', 
                          borderBottom: '1px solid #000',
                          fontWeight: '500', 
                          fontSize: '13px',
                          color: '#000' 
                        }}>
                          {val}
                        </td>
                      </tr>
                    );
                  });
                })()}
                {loading && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t("Loading profit data...")}</td>
                  </tr>
                )}
                {!loading && Object.keys(profitData || {}).length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t("No profit records found for the selected period.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profit;

