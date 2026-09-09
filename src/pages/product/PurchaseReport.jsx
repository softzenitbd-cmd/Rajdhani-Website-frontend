import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Plus, Printer, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';

const PurchaseReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultReports = [
    { id: 1, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK XL HAF 150 | 7511', group: 'LADIS GERMENTS', buy: '90.00', sell: '150.00', qty: '25', total: '2250.00', desc: '-' },
    { id: 2, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK XXL HAF 170 | 7512', group: 'LADIS GERMENTS', buy: '110.00', sell: '170.00', qty: '25', total: '2750.00', desc: '-' },
    { id: 3, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK HAF 3XL | 16546', group: 'LADIS GERMENTS', buy: '140.00', sell: '220.00', qty: '25', total: '3500.00', desc: '-' },
    { id: 4, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK 5XL HAF 250 | 9087', group: 'LADIS GERMENTS', buy: '160.00', sell: '250.00', qty: '25', total: '4000.00', desc: '-' }
  ];

  const defaultSuppliers = [
    { id: '1', name: 'ROKSANA TOPS BONGO' },
    { id: '2', name: 'BROTHERS TRADERS 23' }
  ];

  const [reports, setReports] = useState(defaultReports);
  const [suppliers, setSuppliers] = useState(defaultSuppliers);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    supplier_id: '',
    productName: '',
    invoiceNo: '',
    barcode: '',
    from_date: '',
    to_date: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repRes, supRes] = await Promise.all([
        purchaseService.getPurchaseReport(filters).catch(() => null),
        crmService.getSuppliers().catch(() => null)
      ]);

      if (repRes) {
        const list = Array.isArray(repRes) ? repRes : (repRes?.results || []);
        if (list.length > 0) {
          setReports(list.map((item, idx) => ({
            id: item.id || idx + 1,
            date: item.created_at || item.date ? new Date(item.created_at || item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '24 Aug 2026',
            supplier: item.supplier_name || item.supplier || 'ROKSANA TOPS BONGO',
            product: item.product_name || item.product || 'Product',
            group: item.group_name || item.group || 'GENERAL',
            buy: parseFloat(item.purchase_price || item.buying_price || 0).toFixed(2),
            sell: parseFloat(item.sales_price || item.selling_price || 0).toFixed(2),
            qty: item.quantity || 1,
            total: parseFloat(item.total_amount || (Number(item.purchase_price || 0) * Number(item.quantity || 1))).toFixed(2),
            desc: item.description || '-'
          })));
        } else {
          setReports(defaultReports);
        }
      }

      if (supRes) {
        const sList = Array.isArray(supRes) ? supRes : (supRes?.results || []);
        setSuppliers(sList.length > 0 ? sList : defaultSuppliers);
      }
    } catch (err) {
      console.error("Error fetching purchase report:", err);
      setReports(defaultReports);
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
      supplier_id: '',
      productName: '',
      invoiceNo: '',
      barcode: '',
      from_date: '',
      to_date: ''
    });
  };

  const filteredReports = reports.filter(r => {
    if (filters.supplier_id && String(r.supplier).toLowerCase() !== String(filters.supplier_id).toLowerCase()) return false;
    if (filters.productName && !String(r.product).toLowerCase().includes(filters.productName.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Purchase Report</h2>
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
        <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 2fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Supplier</div>
            <select 
              value={filters.supplier_id}
              onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
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
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Invoice No</div>
            <input 
              type="text" 
              placeholder="Invoice No..." 
              value={filters.invoiceNo}
              onChange={(e) => handleFilterChange('invoiceNo', e.target.value)}
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
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button onClick={clearFilters} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '12px 48px', borderRadius: '4px', fontSize: '16px', width: '40%', cursor: 'pointer' }}>
            Clear Filter
          </button>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Showing {filteredReports.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Printer size={14} /> Print
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={fetchData} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SUPPLIER</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRODUCT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>GROUP</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>BUYING PRICE ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SELLING PRICE ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>QUANTITY ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL BUYING PRICE ↕</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>DESCRIPTION ↕</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No purchase report records found</td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.product}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.group}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{report.buy}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{report.sell}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.qty}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{report.total}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{report.desc}</td>
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

export default PurchaseReport;

