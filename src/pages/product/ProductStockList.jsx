import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, RefreshCw, FileSpreadsheet, Printer } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';
import { exportVisibleTable } from '../../utils/tableExport';

const normalizeDate = (d) => {
  if (!d) return '';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
    const [day, month, year] = s.split('-');
    return `${year}-${month}-${day}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [day, month, year] = s.split('/');
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return s;
};

const formatDisplayDate = (d) => {
  if (!d) return '-';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, day] = s.slice(0, 10).split('-');
    return `${day}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.replace(/\//g, '-');
  const dateObj = new Date(s);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${day}-${m}-${y}`;
  }
  return s;
};

const ProductStockList = () => {
  const toast = useToast();
  const { t } = useTranslation();

  const [stocks, setStocks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(50);

  const [filters, setFilters] = useState({
    searchAll: '',
    group: '',
    productId: '',
    barcode: '',
    fromDate: '',
    toDate: ''
  });

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const [stockRes, groupsRes, prodsRes] = await Promise.all([
        productService.getStockReport({ group_id: filters.group, barcode: filters.barcode }),
        productService.groups.getAll().catch(() => null),
        productService.getProducts().catch(() => null)
      ]);

      const list = Array.isArray(stockRes) ? stockRes : (stockRes?.results || stockRes?.data || []);
      const gList = Array.isArray(groupsRes) ? groupsRes : (groupsRes?.results || groupsRes?.data || []);
      const pList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.results || prodsRes?.data || []);

      setGroups(gList);
      setProductsList(pList);

      // Map products for fast metadata lookup
      const prodsMap = new Map();
      pList.forEach(p => {
        if (p.id) prodsMap.set(String(p.id), p);
        if (p.uuid) prodsMap.set(String(p.uuid), p);
        if (p.barcode) prodsMap.set(String(p.barcode), p);
        if (p.custom_barcode_no) prodsMap.set(String(p.custom_barcode_no), p);
        if (p.name) prodsMap.set(String(p.name).toLowerCase(), p);
      });

      const mappedStocks = list.map((item, idx) => {
        const pKey = String(item.product_id || item.id || '');
        const bKey = String(item.barcode || '');
        const nKey = String(item.name || item.product_name || '').toLowerCase();
        const matchedProd = prodsMap.get(pKey) || prodsMap.get(bKey) || prodsMap.get(nKey) || null;

        const rawDate = item.date || item.created_at || item.updated_at || matchedProd?.created_at || matchedProd?.date || matchedProd?.updated_at || '';
        const displayDate = rawDate ? formatDisplayDate(rawDate) : formatDisplayDate(new Date());

        const stock = parseFloat(item.current_stock ?? item.stock ?? matchedProd?.stock ?? 0);
        const buy = parseFloat(item.buying_price ?? item.purchase_price ?? matchedProd?.buying_price ?? 0);
        const sell = parseFloat(item.selling_price ?? item.sales_price ?? matchedProd?.selling_price ?? 0);

        return {
          id: item.product_id || item.id || idx + 1,
          productId: String(item.product_id || item.id || matchedProd?.id || ''),
          date: displayDate,
          rawDate: rawDate || new Date().toISOString(),
          product: `${item.name || item.product_name || matchedProd?.name || ''} ${item.barcode || matchedProd?.barcode ? '| ' + (item.barcode || matchedProd?.barcode) : ''}`.trim(),
          barcode: item.barcode || matchedProd?.barcode || '',
          unit: item.unit_name || matchedProd?.unit_name || '',
          brand: item.brand_name || matchedProd?.brand_name || '',
          buyPrice: buy.toFixed(2),
          sellPrice: sell.toFixed(2),
          group: item.group_name || matchedProd?.group_name || '',
          opening: parseFloat(item.opening_stock ?? matchedProd?.opening_stock ?? 0).toFixed(2),
          buyQty: parseFloat(item.buy_qty || item.purchased_qty || 0).toFixed(2),
          saleQty: parseFloat(item.sale_qty || item.sold_qty || 0).toFixed(2),
          stock: stock.toFixed(2),
          totalBuy: parseFloat(item.total_buying_value ?? buy * stock).toFixed(2),
          totalSell: parseFloat(item.total_selling_value ?? sell * stock).toFixed(2)
        };
      });

      setStocks(mappedStocks);
    } catch (err) {
      console.error("Failed to load stock report:", err);
      toast.error(err?.message || t("Failed to load stock report"));
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const clearFilters = () => {
    setFilters({
      searchAll: '',
      group: '',
      productId: '',
      barcode: '',
      fromDate: '',
      toDate: ''
    });
  };

  const filteredStocks = useMemo(() => {
    const normFrom = normalizeDate(filters.fromDate);
    const normTo = normalizeDate(filters.toDate);

    return stocks.filter(item => {
      if (filters.searchAll) {
        const q = filters.searchAll.toLowerCase();
        if (!item.product.toLowerCase().includes(q) && !item.group.toLowerCase().includes(q) && !item.barcode.toLowerCase().includes(q)) return false;
      }
      if (filters.group && !item.group.toLowerCase().includes(filters.group.toLowerCase())) return false;
      if (filters.productId && String(item.productId) !== String(filters.productId)) return false;
      if (filters.barcode && !item.product.toLowerCase().includes(filters.barcode.toLowerCase()) && !item.barcode.toLowerCase().includes(filters.barcode.toLowerCase())) return false;

      if (normFrom || normTo) {
        const itemDateStr = normalizeDate(item.rawDate || item.date);
        if (normFrom && itemDateStr && itemDateStr < normFrom) return false;
        if (normTo && itemDateStr && itemDateStr > normTo) return false;
      }

      return true;
    });
  }, [stocks, filters]);

  const displayedStocks = useMemo(() => {
    return filteredStocks.slice(0, entries);
  }, [filteredStocks, entries]);

  const { totalBuySum, totalSellSum, totalStockSum } = useMemo(() => {
    return filteredStocks.reduce(
      (acc, curr) => ({
        totalBuySum: acc.totalBuySum + parseFloat(curr.totalBuy || 0),
        totalSellSum: acc.totalSellSum + parseFloat(curr.totalSell || 0),
        totalStockSum: acc.totalStockSum + parseFloat(curr.stock || 0)
      }),
      { totalBuySum: 0, totalSellSum: 0, totalStockSum: 0 }
    );
  }, [filteredStocks]);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Stock List")}</h2>
      </div>

      <div className="card-body" style={{ padding: '0 24px' }}>
        {/* Filters */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <input 
              type="text" 
              placeholder={t("Search All...")} 
              value={filters.searchAll}
              onChange={(e) => handleFilterChange('searchAll', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
            />
          </div>
          <div>
            <select 
              value={filters.group} 
              onChange={(e) => handleFilterChange('group', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', background: 'white', fontSize: 'var(--fs-13, 13px)' }}
            >
              <option value="">{t("Select Product Group")}</option>
              {groups.map(g => (
                <option key={g.id} value={g.name || g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select 
              value={filters.productId} 
              onChange={(e) => handleFilterChange('productId', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', background: 'white', fontSize: 'var(--fs-13, 13px)' }}
            >
              <option value="">{t("Select Product")}</option>
              {productsList.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <input 
              type="text" 
              placeholder={t("Barcode...")} 
              value={filters.barcode}
              onChange={(e) => handleFilterChange('barcode', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
            />
          </div>
        </div>

        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: 'white', height: '42px', alignItems: 'center' }}>
              <CustomDatePicker 
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', outline: 'none', height: '100%' }} 
              />
              <CustomDatePicker 
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', outline: 'none', height: '100%' }} 
              />
            </div>
          </div>
          <div>
            <button onClick={clearFilters} className="btn" style={{ width: '100%', height: '42px', background: '#64748b', color: 'white', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RotateCcw size={15} /> {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t("Show")} 
            <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => exportVisibleTable('xlsx', 'Stock_List')} className="btn" style={{ background: '#059669', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              <FileSpreadsheet size={15} /> {t("Excel")}
            </button>
            <button onClick={() => window.print()} className="btn" style={{ background: '#4F46E5', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              <Printer size={15} /> {t("Print")}
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: '#64748b', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              <RotateCcw size={15} /> {t("Reset")}
            </button>
            <button onClick={fetchStockData} className="btn" style={{ background: '#0284c7', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> {t("Reload")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', width: '60px', fontWeight: 'bold' }}>{t("ID NO")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', width: '110px', fontWeight: 'bold' }}>{t("DATE")}</th>
                <th style={{ textAlign: 'left', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("PRODUCT")}</th>
                <th style={{ textAlign: 'left', borderRight: '1px solid #a0aec0', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("GROUP")}</th>
                <th style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("OPENING STOCK")}</th>
                <th style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("BUY QUANTITY")}</th>
                <th style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("SALE QUANTITY")}</th>
                <th style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("STOCK")}</th>
                <th style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("TOTAL BUYING PRICE")}</th>
                <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("TOTAL SELLING PRICE")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t("Loading stock data...")}</td>
                </tr>
              ) : displayedStocks.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t("No stock data found")}</td>
                </tr>
              ) : (
                displayedStocks.map((stock, index) => (
                  <tr key={stock.id || index} style={{ background: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>{stock.date}</td>
                    <td style={{ textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{stock.product}</div>
                      <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b', marginTop: '2px' }}>{t("Buy Price:")} {stock.buyPrice} {t("| Sell Price:")} {stock.sellPrice}</div>
                    </td>
                    <td style={{ textAlign: 'left', padding: '10px 10px', borderRight: '1px solid #e2e8f0', color: '#334155' }}>{stock.group || '-'}</td>
                    <td style={{ textAlign: 'right', padding: '10px 10px', borderRight: '1px solid #e2e8f0' }}>{stock.opening}</td>
                    <td style={{ textAlign: 'right', padding: '10px 10px', borderRight: '1px solid #e2e8f0' }}>{stock.buyQty}</td>
                    <td style={{ textAlign: 'right', padding: '10px 10px', borderRight: '1px solid #e2e8f0' }}>{stock.saleQty}</td>
                    <td style={{ textAlign: 'right', padding: '10px 10px', borderRight: '1px solid #e2e8f0', fontWeight: '700', color: parseFloat(stock.stock) < 0 ? '#dc2626' : '#1e293b' }}>{stock.stock}</td>
                    <td style={{ textAlign: 'right', padding: '10px 10px', borderRight: '1px solid #e2e8f0', fontWeight: '600' }}>৳{stock.totalBuy}</td>
                    <td style={{ textAlign: 'right', padding: '10px 10px', fontWeight: '600' }}>৳{stock.totalSell}</td>
                  </tr>
                ))
              )}
            </tbody>
            {displayedStocks.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan="7" style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', fontSize: 'var(--fs-12, 12px)', textTransform: 'uppercase' }}>
                    {t("Total")} :
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 10px', borderRight: '1px solid #cbd5e1', fontSize: 'var(--fs-12, 12px)' }}>
                    {totalStockSum.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 10px', borderRight: '1px solid #cbd5e1', fontSize: 'var(--fs-12, 12px)' }}>
                    ৳{totalBuySum.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 10px', fontSize: 'var(--fs-12, 12px)' }}>
                    ৳{totalSellSum.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductStockList;
