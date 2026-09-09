import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';

const PurchaseInvoiceList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultPurchases = [
    { id: 1, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK XL HAF 150 | 7511', buy: '90.00', sell: '150.00', qty: '25', total: '2250.00', desc: '-' },
    { id: 2, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK XXL HAF 170 | 7512', buy: '110.00', sell: '170.00', qty: '25', total: '2750.00', desc: '-' },
    { id: 3, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK HAF 3XL | 16546', buy: '140.00', sell: '220.00', qty: '25', total: '3500.00', desc: '-' },
    { id: 4, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK 5XL HAF 250 | 9087', buy: '160.00', sell: '250.00', qty: '25', total: '4000.00', desc: '-' }
  ];

  const defaultSuppliers = [
    { id: '1', name: 'ROKSANA TOPS BONGO' },
    { id: '2', name: 'BROTHERS TRADERS 23' }
  ];

  const [purchases, setPurchases] = useState(defaultPurchases);
  const [suppliers, setSuppliers] = useState(defaultSuppliers);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    supplier: '',
    productName: '',
    barcode: '',
    from_date: '',
    to_date: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes] = await Promise.all([
        purchaseService.getPurchaseInvoices(filters).catch(() => null),
        crmService.getSuppliers().catch(() => null)
      ]);

      if (purRes) {
        const list = Array.isArray(purRes) ? purRes : (purRes?.results || []);
        if (list.length > 0) {
          const flatItems = [];
          list.forEach((item, idx) => {
            if (Array.isArray(item.items) && item.items.length > 0) {
              item.items.forEach((subItem, sIdx) => {
                flatItems.push({
                  id: `${item.id || idx}-${sIdx}`,
                  date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '24 Aug 2026',
                  supplier: item.supplier_name || item.supplier || 'ROKSANA TOPS BONGO',
                  product: subItem.product_name || subItem.name || 'Product',
                  buy: parseFloat(subItem.purchase_price || subItem.buying_price || 0).toFixed(2),
                  sell: parseFloat(subItem.sales_price || subItem.selling_price || 0).toFixed(2),
                  qty: subItem.quantity || 1,
                  total: (parseFloat(subItem.purchase_price || 0) * (subItem.quantity || 1)).toFixed(2),
                  desc: subItem.description || '-'
                });
              });
            } else {
              flatItems.push({
                id: item.id || idx + 1,
                date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '24 Aug 2026',
                supplier: item.supplier_name || item.supplier || 'ROKSANA TOPS BONGO',
                product: item.product_name || item.product || 'Product',
                buy: parseFloat(item.purchase_price || 0).toFixed(2),
                sell: parseFloat(item.sales_price || 0).toFixed(2),
                qty: item.quantity || 1,
                total: parseFloat(item.total_amount || 0).toFixed(2),
                desc: '-'
              });
            }
          });
          setPurchases(flatItems.length > 0 ? flatItems : defaultPurchases);
        } else {
          setPurchases(defaultPurchases);
        }
      }

      if (supRes) {
        const sList = Array.isArray(supRes) ? supRes : (supRes?.results || []);
        setSuppliers(sList.length > 0 ? sList : defaultSuppliers);
      }
    } catch (err) {
      console.error("Error fetching purchase items:", err);
      setPurchases(defaultPurchases);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const clearFilters = () => {
    setFilters({
      supplier: '',
      productName: '',
      barcode: '',
      from_date: '',
      to_date: ''
    });
  };

  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.productName && !String(p.product).toLowerCase().includes(filters.productName.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Product Wise Purchase List</h2>
        <button 
          onClick={() => navigate('/product/purchase/add-new')}
          className="btn" 
          style={{ position: 'absolute', right: '20px', top: '0', background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Plus size={16} /> Purchase
        </button>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 2fr 1fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Supplier</div>
            <select 
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name || s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Product Name</div>
            <input 
              type="text" 
              placeholder="Product Name..." 
              value={filters.productName}
              onChange={(e) => handleFilterChange('productName', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Barcode</div>
            <input 
              type="text" 
              placeholder="Barcode..." 
              value={filters.barcode}
              onChange={(e) => handleFilterChange('barcode', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="date" 
                value={filters.from_date}
                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} 
              />
              <input 
                type="date" 
                value={filters.to_date}
                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} 
              />
            </div>
          </div>

          <div>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '12px', borderRadius: '4px', fontSize: '14px', width: '100%', cursor: 'pointer' }}>
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Showing {filteredPurchases.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Print
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={fetchData} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> Reload
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '60px' }}>ID NO ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>DATE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SUPPLIER</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRODUCT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>BUYING</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SELLING</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>QUANTITY</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No product purchase entries found</td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.product}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{purchase.buy}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{purchase.sell}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.qty}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{purchase.total}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{purchase.desc}</td>
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

export default PurchaseInvoiceList;

