import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { purchaseService } from '../../services/purchaseService';
import { saleService } from '../../services/saleService';
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

      // GET /api/accounting/profit/ → { "Total Sales": "৳ 123.00", ... }
      const res = await accountingService.getProfit(filters);
      let data = (res && typeof res === 'object') ? { ...res } : {};

      delete data['Total Client Due'];
      delete data['Total Supplier Due'];

      try {
        const salesRep = await saleService.getSalesReport(filters);
        const soldItems = Array.isArray(salesRep) ? salesRep : (salesRep?.results || salesRep?.data || []);
        let calcBuy = 0;
        soldItems.forEach((item) => {
          calcBuy += Number(item.buy_price || 0) * Number(item.qty || item.quantity || 0);
        });
        
        data['Total Buy Price'] = '৳ ' + calcBuy.toFixed(2);
        
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
        <PrintHeader />
        
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

            <table className="custom-table" style={{ border: '1px solid #cbd5e1', width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: '18px', background: '#334155', color: 'white', borderRight: '1px solid #cbd5e1', width: '55%' }}>{t("FINANCIAL METRIC")}</th>
                  <th style={{ textAlign: 'right', paddingRight: '18px', background: '#334155', color: 'white', width: '45%' }}>{t("CALCULATED AMOUNT")}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!profitData || Object.keys(profitData).length === 0) return null;
                  const order = [
                    "Total Sales",
                    "Total Receive",
                    "Discount",
                    "Total Expense",
                    "Total Buy Price",
                    "Total Balance",
                    "Product Profit",
                    "Gross Profit",
                    "Net Profit"
                  ];
                  const keys = order.filter(k => profitData[k] !== undefined);
                  Object.keys(profitData).forEach(k => {
                    if (!keys.includes(k) && k !== "Total Client Due" && k !== "Total Supplier Due") {
                      keys.push(k);
                    }
                  });
                  return keys.map((key, idx) => {
                    const val = profitData[key];
                    const isHighlight = key.includes('Profit') || key === 'Total Balance';
                    const isNegative = String(val).includes('-');
                    return (
                      <tr key={key} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ textAlign: 'left', padding: '12px 18px', borderRight: '1px solid #e2e8f0', fontWeight: isHighlight ? 'bold' : '500', color: isHighlight ? 'var(--text-main)' : '#334155' }}>
                          {key}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '12px 18px', 
                          fontWeight: 'bold', 
                          fontSize: isHighlight ? '15px' : '14px',
                          color: isNegative ? '#dc2626' : (isHighlight ? '#059669' : '#0f172a') 
                        }}>
                          {typeof val === 'number' ? `৳ ${val.toLocaleString()}` : val}
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

