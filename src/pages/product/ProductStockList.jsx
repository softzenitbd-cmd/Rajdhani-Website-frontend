import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';

const ProductStockList = () => {
  const toast = useToast();
  const { t } = useTranslation();




  const [stocks, setStocks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

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
      // GET /api/product/reports/stock/?group_id=&brand_id=&barcode=
      const [stockRes, groupsRes, prodsRes] = await Promise.all([
        productService.getStockReport({ group_id: filters.group, barcode: filters.barcode }),
        productService.groups.getAll().catch(() => null),
        productService.getProducts().catch(() => null)
      ]);

      const list = Array.isArray(stockRes) ? stockRes : (stockRes?.results || []);
      // stock rows: product_id, name, barcode, group_name, brand_name, unit_name, buying_price,
      //             selling_price, current_stock, total_buying_value, total_selling_value
      setStocks(list.map((item, idx) => {
        const stock = parseFloat(item.current_stock ?? item.stock ?? 0);
        const buy = parseFloat(item.buying_price ?? item.purchase_price ?? 0);
        const sell = parseFloat(item.selling_price ?? item.sales_price ?? 0);
        return {
          id: item.product_id || item.id || idx + 1,
          productId: item.product_id || item.id,
          date: item.updated_at || item.created_at || item.date || '',
          product: `${item.name || item.product_name || ''} ${item.barcode ? '| ' + item.barcode : ''}`.trim(),
          barcode: item.barcode || '',
          unit: item.unit_name || '',
          brand: item.brand_name || '',
          buyPrice: buy.toFixed(2),
          sellPrice: sell.toFixed(2),
          group: item.group_name || '',
          opening: parseFloat(item.opening_stock || 0).toFixed(2),
          buyQty: parseFloat(item.buy_qty || item.purchased_qty || 0).toFixed(2),
          saleQty: parseFloat(item.sale_qty || item.sold_qty || 0).toFixed(2),
          stock: stock.toFixed(2),
          totalBuy: parseFloat(item.total_buying_value ?? buy * stock).toFixed(2),
          totalSell: parseFloat(item.total_selling_value ?? sell * stock).toFixed(2)
        };
      }));

      if (groupsRes) {
        const gList = Array.isArray(groupsRes) ? groupsRes : (groupsRes?.results || []);
        setGroups(gList);
      }

      if (prodsRes) {
        const pList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.results || []);
        setProductsList(pList);
      }
    } catch (err) {
      toast.error(err?.message || t("Failed to load stock report"));
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [filters]);

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

  const filteredStocks = stocks.filter(item => {
    if (filters.searchAll) {
      const q = filters.searchAll.toLowerCase();
      if (!item.product.toLowerCase().includes(q) && !item.group.toLowerCase().includes(q)) return false;
    }
    if (filters.group && !item.group.toLowerCase().includes(filters.group.toLowerCase())) return false;
    if (filters.barcode && !item.product.toLowerCase().includes(filters.barcode.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '40px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>{t("Stock List")}</h2>
      </div>

      <div className="card-body" style={{ padding: '0 24px' }}>
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder={t("Search All...")} 
              value={filters.searchAll}
              onChange={(e) => handleFilterChange('searchAll', e.target.value)}
              style={{ width: '100%', padding: '14px', border: '1px solid #0ea5e9', borderRadius: '8px', outline: 'none' }} 
            />
          </div>
          <div>
            <select 
              value={filters.group} 
              onChange={(e) => handleFilterChange('group', e.target.value)}
              style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: 'white' }}
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
              style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: 'white' }}
            >
              <option value="">{t("Select Product")}</option>
              {productsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder={t("Barcode...")} 
              value={filters.barcode}
              onChange={(e) => handleFilterChange('barcode', e.target.value)}
              style={{ width: '100%', padding: '14px', border: '1px solid #0ea5e9', borderRadius: '8px', outline: 'none' }} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '32px', alignItems: 'end' }}>
          <div style={{ gridColumn: '1 / 3' }}>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="date" 
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} 
              />
              <input 
                type="date" 
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} 
              />
            </div>
          </div>
          <div>
            <button onClick={clearFilters} className="btn" style={{ width: '100%', padding: '14px', background: 'var(--text-muted)', color: 'white', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>50</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t("Print")}
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> {t("Reset")}
            </button>
            <button onClick={fetchStockData} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("Reload")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '60px' }}>{t("ID NO ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("PRODUCT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("GROUP")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("OPENING STOCK")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("BUY QUANTITY")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("SALE QUANTITY")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("STOCK")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("TOTAL BUYING PRICE")}</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>{t("TOTAL SELLING PRICE")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>{t("No stock data found")}</td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '500' }}>{stock.product}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t("Buy Price:")} {stock.buyPrice} {t("| Sell Price:")} {stock.sellPrice}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.group}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.opening}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.buyQty}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.saleQty}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.stock}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{stock.totalBuy}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>৳{stock.totalSell}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductStockList;

