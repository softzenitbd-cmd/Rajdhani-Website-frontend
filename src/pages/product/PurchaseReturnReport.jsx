import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Plus, Printer, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';

const PurchaseReturnReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultReports = [
    { id: 1, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK XL HAF 150 | 7511', group: 'LADIS GERMENTS', buy: '90.00', sell: '150.00', qty: '25', total: '2250.00', desc: 'Return due to size' },
    { id: 2, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK XXL HAF 170 | 7512', group: 'LADIS GERMENTS', buy: '110.00', sell: '170.00', qty: '25', total: '2750.00', desc: 'Fabric defect' },
    { id: 3, date: '24 Aug 2026', supplier: 'ROKSANA TOPS BONGO', product: 'ROK HAF 3XL | 16546', group: 'LADIS GERMENTS', buy: '140.00', sell: '220.00', qty: '25', total: '3500.00', desc: 'Excess quantity' },
    { id: 4, date: '22 Apr 2026', supplier: 'BROTHERS TRADERS 23', product: 'PRINT 130 | 14', group: 'SIT KAPOR', buy: '103.00', sell: '130.00', qty: '1343', total: '138329.00', desc: 'Damaged shipment' },
    { id: 5, date: '22 Apr 2026', supplier: 'BROTHERS TRADERS 23', product: 'PRINT 130 | 14', group: 'SIT KAPOR', buy: '101.00', sell: '130.00', qty: '287', total: '28987.00', desc: 'Color fade' }
  ];

  const [reports, setReports] = useState(defaultReports);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    supplier: '',
    productName: '',
    invoiceNo: '',
    barcode: '',
    fromDate: '',
    toDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supRes, returnsRes] = await Promise.all([
        crmService.getSuppliers().catch(() => null),
        purchaseService.getPurchaseReturns(filters).catch(() => null)
      ]);

      if (supRes) {
        const sList = Array.isArray(supRes) ? supRes : (supRes?.results || []);
        setSuppliers(sList);
      }

      const localReturns = JSON.parse(localStorage.getItem('rajdhani_purchase_returns') || '[]');
      let apiReturns = [];
      if (returnsRes) {
        apiReturns = Array.isArray(returnsRes) ? returnsRes : (returnsRes?.results || []);
      }

      const combinedReturns = [...localReturns, ...apiReturns];
      
      if (combinedReturns.length > 0) {
        let flattened = [];
        combinedReturns.forEach((ret, idx) => {
          if (ret.items && ret.items.length > 0) {
            ret.items.forEach((item, itemIdx) => {
              flattened.push({
                id: `${ret.id}-${itemIdx + 1}`,
                date: ret.date || '2026-08-24',
                supplier: ret.supplier || 'Supplier',
                product: item.name || 'Product',
                group: item.group || 'GENERAL',
                buy: parseFloat(item.buyingPrice || item.buying_price || 0).toFixed(2),
                sell: parseFloat(item.salePrice || item.sale_price || 0).toFixed(2),
                qty: item.quantity || 1,
                total: (parseFloat(item.buyingPrice || 0) * Number(item.quantity || 1)).toFixed(2),
                desc: 'Returned item'
              });
            });
          } else {
            flattened.push({
              id: ret.id || idx + 1,
              date: ret.date || '2026-08-24',
              supplier: ret.supplier || 'Supplier',
              product: 'General Return Package',
              group: 'GENERAL',
              buy: parseFloat(ret.total || 0).toFixed(2),
              sell: parseFloat(ret.total_sale || ret.total || 0).toFixed(2),
              qty: 1,
              total: parseFloat(ret.total || 0).toFixed(2),
              desc: ret.invoice ? `Invoice #${ret.invoice}` : 'Return'
            });
          }
        });
        setReports([...flattened, ...defaultReports]);
      } else {
        setReports(defaultReports);
      }
    } catch (err) {
      console.error(err);
      setReports(defaultReports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const clearFilters = () => {
    setFilters({
      supplier: '',
      productName: '',
      invoiceNo: '',
      barcode: '',
      fromDate: '',
      toDate: ''
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID NO,DATE,SUPPLIER,PRODUCT,GROUP,BUYING PRICE,SELLING PRICE,QUANTITY,TOTAL BUYING PRICE,DESCRIPTION'];
    const rows = filteredReports.map(r => `${r.id},"${r.date}","${r.supplier}","${r.product}","${r.group}",${r.buy},${r.sell},${r.qty},${r.total},"${r.desc}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `purchase_return_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(r => {
    if (filters.supplier && !r.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) return false;
    if (filters.productName && !r.product.toLowerCase().includes(filters.productName.toLowerCase())) return false;
    if (filters.barcode && !r.product.toLowerCase().includes(filters.barcode.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Purchase Return Report</h2>
        <button 
          onClick={() => navigate('/product/purchase-return/add-new')}
          className="btn" 
          style={{ position: 'absolute', right: '20px', top: '0', background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Purchase Return
        </button>
      </div>

      <div className="card-body" style={{ padding: '0 24px' }}>
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 2fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Supplier</div>
            <select 
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', background: 'white' }}
            >
              <option value="">Select Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Product Name</div>
            <input 
              type="text" 
              placeholder="Product Name" 
              value={filters.productName}
              onChange={(e) => handleFilterChange('productName', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Invoice No</div>
            <input 
              type="text" 
              placeholder="Invoice No" 
              value={filters.invoiceNo}
              onChange={(e) => handleFilterChange('invoiceNo', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Barcode</div>
            <input 
              type="text" 
              placeholder="Barcode" 
              value={filters.barcode}
              onChange={(e) => handleFilterChange('barcode', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="date" 
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
              />
              <input 
                type="date" 
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
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
            Show 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>100</option>
            </select>
            entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handleExportExcel} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Download size={14} /> Excel
            </button>
            <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No purchase return report records found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.product}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.group}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳ {report.buy}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳ {report.sell}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{report.qty}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>৳ {report.total}</td>
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

export default PurchaseReturnReport;
