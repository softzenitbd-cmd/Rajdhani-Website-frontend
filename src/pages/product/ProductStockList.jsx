import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';

const ProductStockList = () => {
  const { t } = useTranslation();

  const defaultGroups = [
    { id: '1', name: 'SIT KAPOR' },
    { id: '2', name: 'SAREE' },
    { id: '3', name: 'ORNA' },
    { id: '4', name: 'SHIRT' },
    { id: '5', name: 'PANT' }
  ];

  const defaultProductsList = [
    { id: '1', name: 'BATIK PRINT ORNA 380' },
    { id: '2', name: 'BR ORNA 380' },
    { id: '3', name: 'SAB INDIA KANI SOFT' },
    { id: '4', name: 'DP HEZAB RIMON' }
  ];

  const defaultStocks = [
    { id: 1, date: '24 Aug 2026', product: 'BATIK PRINT ORNA 380 | 18647', buyPrice: '287.00', sellPrice: '380.00', group: 'SIT KAPOR', opening: '0.00', buyQty: '2.00', saleQty: '0.00', stock: '2.00', totalBuy: '575', totalSell: '760' },
    { id: 2, date: '24 Aug 2026', product: 'BR ORNA 380 | 18646', buyPrice: '240.00', sellPrice: '380.00', group: 'SIT KAPOR', opening: '0.00', buyQty: '4.00', saleQty: '0.00', stock: '4.00', totalBuy: '960', totalSell: '1520' },
    { id: 3, date: '24 Aug 2026', product: 'BR ORNA 500 | 18645', buyPrice: '362.00', sellPrice: '500.00', group: 'SIT KAPOR', opening: '0.00', buyQty: '9.00', saleQty: '0.00', stock: '9.00', totalBuy: '3262.5', totalSell: '4500' },
    { id: 4, date: '23 Aug 2026', product: 'SAB INDIA KANI SOFT | 18644', buyPrice: '1900.00', sellPrice: '2580.00', group: 'SAREE', opening: '0.00', buyQty: '5.00', saleQty: '0.00', stock: '5.00', totalBuy: '9500', totalSell: '12900' },
    { id: 5, date: '23 Aug 2026', product: 'SAB INDIA KANI SHAREE | 18643', buyPrice: '1750.00', sellPrice: '2380.00', group: 'SAREE', opening: '0.00', buyQty: '5.00', saleQty: '0.00', stock: '5.00', totalBuy: '8750', totalSell: '11900' },
    { id: 6, date: '23 Aug 2026', product: 'NS INDIA KANI SHAREE | 18642', buyPrice: '1800.00', sellPrice: '2450.00', group: 'SAREE', opening: '0.00', buyQty: '6.00', saleQty: '0.00', stock: '6.00', totalBuy: '10800', totalSell: '14700' },
    { id: 7, date: '22 Aug 2026', product: 'DP HEZAB RIMON || 18641', buyPrice: '410.00', sellPrice: '550.00', group: 'ORNA', opening: '0.00', buyQty: '35.00', saleQty: '0.00', stock: '35.00', totalBuy: '14350', totalSell: '19250' }
  ];

  const [stocks, setStocks] = useState(defaultStocks);
  const [groups, setGroups] = useState(defaultGroups);
  const [productsList, setProductsList] = useState(defaultProductsList);
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
      const [stockRes, groupsRes, prodsRes] = await Promise.all([
        productService.getStockReport(filters).catch(() => null),
        productService.groups.getAll().catch(() => null),
        productService.getProducts().catch(() => null)
      ]);

      if (stockRes) {
        const list = Array.isArray(stockRes) ? stockRes : (stockRes?.results || []);
        if (list.length > 0) {
          setStocks(list.map((item, idx) => ({
            id: item.id || idx + 1,
            date: item.date || '24 Aug 2026',
            product: `${item.product_name || item.name || 'Product'} ${item.barcode ? '| ' + item.barcode : ''}`,
            buyPrice: parseFloat(item.purchase_price || item.buy_price || 0).toFixed(2),
            sellPrice: parseFloat(item.sales_price || item.sell_price || 0).toFixed(2),
            group: item.group_name || item.group || 'GENERAL',
            opening: parseFloat(item.opening_stock || 0).toFixed(2),
            buyQty: parseFloat(item.buy_qty || item.purchased_qty || 0).toFixed(2),
            saleQty: parseFloat(item.sale_qty || item.sold_qty || 0).toFixed(2),
            stock: parseFloat(item.current_stock || item.stock || 0).toFixed(2),
            totalBuy: (parseFloat(item.purchase_price || 0) * parseFloat(item.current_stock || item.stock || 0)).toFixed(2),
            totalSell: (parseFloat(item.sales_price || 0) * parseFloat(item.current_stock || item.stock || 0)).toFixed(2)
          })));
        } else {
          setStocks(defaultStocks);
        }
      }

      if (groupsRes) {
        const gList = Array.isArray(groupsRes) ? groupsRes : (groupsRes?.results || []);
        setGroups(gList.length > 0 ? gList : defaultGroups);
      }

      if (prodsRes) {
        const pList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.results || []);
        setProductsList(pList.length > 0 ? pList : defaultProductsList);
      }
    } catch (err) {
      console.error("Error fetching stock data:", err);
      setStocks(defaultStocks);
      setGroups(defaultGroups);
      setProductsList(defaultProductsList);
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
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Stock List</h2>
      </div>

      <div className="card-body" style={{ padding: '0 24px' }}>
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search All..." 
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
              <option value="">Select Product Group</option>
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
              <option value="">Select Product</option>
              {productsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Barcode..." 
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
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Show 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>50</option>
            </select>
            entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Print
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={fetchStockData} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> Reload
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '60px' }}>ID NO ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>DATE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRODUCT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>GROUP</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>OPENING STOCK</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>BUY QUANTITY</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SALE QUANTITY</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>STOCK</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL BUYING PRICE</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>TOTAL SELLING PRICE</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No stock data found</td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{stock.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '500' }}>{stock.product}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Buy Price: {stock.buyPrice} | Sell Price: {stock.sellPrice}</div>
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

