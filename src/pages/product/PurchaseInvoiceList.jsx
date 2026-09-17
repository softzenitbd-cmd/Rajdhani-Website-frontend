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



  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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

      let sList = [];
      if (supRes) {
        sList = Array.isArray(supRes) ? supRes : (supRes?.results || []);
        setSuppliers(sList);
      }

      if (purRes) {
        const list = Array.isArray(purRes) ? purRes : (purRes?.results || []);
        if (list.length > 0) {
          const flatItems = [];
          list.forEach((item, idx) => {
            let supName = item.supplier_name || item.supplier?.name;
            if (!supName && item.supplier) {
               const s = sList.find(x => String(x.id) === String(item.supplier));
               supName = s ? (s.name || s.company_name) : String(item.supplier);
            }

            if (Array.isArray(item.items) && item.items.length > 0) {
              item.items.forEach((subItem, sIdx) => {
                flatItems.push({
                  id: `${item.id || idx}-${sIdx}`,
                  date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
                  supplier: supName || '-',
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
                date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
                supplier: supName || '-',
                product: item.product_name || item.product || 'Product',
                buy: parseFloat(item.purchase_price || 0).toFixed(2),
                sell: parseFloat(item.sales_price || 0).toFixed(2),
                qty: item.quantity || 1,
                total: parseFloat(item.total_amount || 0).toFixed(2),
                desc: '-'
              });
            }
          });
          setPurchases(flatItems);
        } else {
          setPurchases([]);
        }
      }
    } catch (err) {
      console.error("Error fetching purchase items:", err);
      setPurchases([]);
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
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Product Wise Purchase List")}</h2>
        <button 
          onClick={() => navigate('/product/purchase/add-new')}
          className="btn" 
          style={{ position: 'absolute', right: '20px', top: '0', background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Plus size={16} /> {t("Purchase")}
        </button>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 2fr 1fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Supplier")}</div>
            <select 
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #38bdf8', borderRadius: '4px', outline: 'none', background: 'white' }}
            >
              <option value="">{t("Select Supplier")}</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name || s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Product Name")}</div>
            <input 
              type="text" 
              placeholder={t("Product Name...")} 
              value={filters.productName}
              onChange={(e) => handleFilterChange('productName', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #38bdf8', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Barcode")}</div>
            <input 
              type="text" 
              placeholder={t("Barcode...")} 
              value={filters.barcode}
              onChange={(e) => handleFilterChange('barcode', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #38bdf8', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="date" 
                value={filters.from_date}
                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #38bdf8', borderRadius: '4px', outline: 'none', color: '#64748b' }} 
              />
              <input 
                type="date" 
                value={filters.to_date}
                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #38bdf8', borderRadius: '4px', outline: 'none', color: '#64748b' }} 
              />
            </div>
          </div>

          <div>
            <button onClick={clearFilters} className="btn" style={{ background: '#64748b', color: 'white', padding: '12px', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', width: '100%', cursor: 'pointer', border: 'none' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{t("Show")}</span>
            <select style={{ border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
              <option>100</option>
              <option>50</option>
              <option>25</option>
            </select>
            <span>{t("entries")}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <button className="btn" style={{ background: '#3b82f6', color: 'white', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              Excel
            </button>
            <button className="btn" style={{ background: '#3b82f6', color: 'white', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              CSV
            </button>
            <button className="btn" style={{ background: '#3b82f6', color: 'white', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              PDF
            </button>
            <button onClick={() => window.print()} className="btn" style={{ background: '#3b82f6', color: 'white', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              Print
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: '#3b82f6', color: 'white', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#94a3b8', color: 'black' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '60px' }}>{t("ID NO ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("SUPPLIER")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("PRODUCT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("BUYING")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("SELLING")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("QUANTITY")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("TOTAL")}</th>
                <th style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DESCRIPTION")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>{t("No product purchase entries found")}</td>
                </tr>
              ) : (
                filteredPurchases.map((purchase, index) => (
                  <tr key={purchase.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
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

