import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Plus, Printer, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';
import { exportToExcel } from '../../utils/excelExporter';
import CustomDatePicker from '../../components/CustomDatePicker';


const PurchaseReturnReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();


  const [reports, setReports] = useState([]);
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

       let apiReturns = [];
      if (returnsRes) {
        apiReturns = Array.isArray(returnsRes) ? returnsRes : (returnsRes?.results || []);
      }

      const combinedReturns = apiReturns;
      
      if (combinedReturns.length > 0) {
        let flattened = [];
        combinedReturns.forEach((ret, idx) => {
          let displayDate = ret.date || '2026-08-24';
          if (displayDate.includes('-')) {
             const parts = displayDate.split('T')[0].split('-');
             if (parts.length === 3) {
                 displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
             }
          }
          
          let supName = ret.supplier || 'Supplier';
          if (supName && sList.length > 0) {
              const matchedSup = sList.find(s => String(s.id) === String(supName) || String(s.uuid) === String(supName));
              if (matchedSup) {
                  supName = matchedSup.name || matchedSup.supplier_name || supName;
              }
          }

          if (ret.items && ret.items.length > 0) {
            ret.items.forEach((item, itemIdx) => {
              const bPrice = parseFloat(item.buyingPrice || item.buying_price || item.price || 0);
              const sPrice = parseFloat(item.salePrice || item.sale_price || item.selling_price || 0);
              const q = Number(item.quantity || 1);
              
              flattened.push({
                id: `${ret.id}-${itemIdx + 1}`,
                date: displayDate,
                supplier: supName,
                product: item.name || item.product_name || 'Product',
                group: item.group || 'GENERAL',
                buy: bPrice.toFixed(2),
                sell: sPrice.toFixed(2),
                qty: q,
                total: (bPrice * q).toFixed(2),
                desc: 'Returned item'
              });
            });
          } else {
            const fallbackTotal = parseFloat(ret.grand_total || ret.total_amount || ret.total_due || ret.total || 0);
            flattened.push({
              id: ret.id || idx + 1,
              date: displayDate,
              supplier: supName,
              product: 'General Return Package',
              group: 'GENERAL',
              buy: fallbackTotal.toFixed(2),
              sell: parseFloat(ret.total_sale || fallbackTotal).toFixed(2),
              qty: 1,
              total: fallbackTotal.toFixed(2),
              desc: ret.invoice ? `Invoice #${ret.invoice}` : 'Return'
            });
          }
        });
        setReports([...flattened]);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error(err);
      setReports([]);
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
    const dataToExport = filteredReports.map((r, i) => ({
      'SL': i + 1,
      'Date': r.date,
      'Supplier': r.supplier,
      'Product': r.product,
      'Group': r.group,
      'Buying Price': parseFloat(r.buy || 0),
      'Selling Price': parseFloat(r.sell || 0),
      'Quantity': parseInt(r.qty || 0),
      'Total Buying Price': parseFloat(r.total || 0),
      'Description': r.desc || '-'
    }));
    exportToExcel(dataToExport, 'Purchase_Return_Report');
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
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Purchase Return Report")}</h2>
        <button 
          onClick={() => navigate('/product/purchase-return/add-new')}
          className="btn" 
          style={{ position: 'absolute', right: '20px', top: '0', background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> {t("Purchase Return")}
        </button>
      </div>

      <div className="card-body" style={{ padding: '0 24px' }}>
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 2fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Supplier")}</div>
            <select 
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', background: 'white' }}
            >
              <option value="">{t("Select Suppliers")}</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Product Name")}</div>
            <input 
              type="text" 
              placeholder={t("Product Name")} 
              value={filters.productName}
              onChange={(e) => handleFilterChange('productName', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Invoice No")}</div>
            <input 
              type="text" 
              placeholder={t("Invoice No")} 
              value={filters.invoiceNo}
              onChange={(e) => handleFilterChange('invoiceNo', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Barcode")}</div>
            <input 
              type="text" 
              placeholder={t("Barcode")} 
              value={filters.barcode}
              onChange={(e) => handleFilterChange('barcode', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CustomDatePicker 
                 
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
              />
              <CustomDatePicker 
                 
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
              />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button onClick={clearFilters} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '12px 48px', borderRadius: '4px', fontSize: 'var(--fs-16, 16px)', width: '40%', cursor: 'pointer' }}>
            {t("Clear Filter")}
          </button>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>100</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handleExportExcel} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Download size={14} /> {t("Excel")}
            </button>
            <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Printer size={14} /> {t("Print")}
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RotateCcw size={14} /> {t("Reset")}
            </button>
            <button onClick={fetchData} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("Reload")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '60px' }}>{t("ID NO ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("SUPPLIER")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("PRODUCT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("GROUP")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("BUYING PRICE ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("SELLING PRICE ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("QUANTITY ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("TOTAL BUYING PRICE ↕")}</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DESCRIPTION ↕")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {t("No purchase return report records found.")}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, index) => (
                  <tr key={report.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
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
