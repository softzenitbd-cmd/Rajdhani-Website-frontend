import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2, Eye, Plus, RefreshCw, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';
import { exportToExcel } from '../../utils/excelExporter';
import { useToast } from '../../context/ToastContext';

const PurchaseReturnList = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();


  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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
      const [returnsRes, supRes] = await Promise.all([
        purchaseService.getPurchaseReturns(filters).catch(() => null),
        crmService.getSuppliers().catch(() => null)
      ]);

      if (supRes) {
        const sList = Array.isArray(supRes) ? supRes : (supRes?.results || []);
        setSuppliers(sList);
      }

       let apiList = [];
      if (returnsRes) {
        apiList = Array.isArray(returnsRes) ? returnsRes : (returnsRes?.results || []);
      }

      const combined = apiList;
      if (combined.length > 0) {
        setReturns(combined.map(item => ({
          id: item.id,
          date: item.date || item.created_at || '2026-08-25',
          invoice: item.invoice || item.invoice_no || `RET-${item.id}`,
          supplier: item.supplier_name || item.supplier?.name || item.supplier || 'Supplier',
          total: parseFloat(item.total || item.total_amount || 0).toFixed(2),
          items: item.items || []
        })));
      } else {
        setReturns([]);
      }
    } catch (err) {
      console.error(err);
      setReturns([]);
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

  const handleDelete = async (id) => {
    if (!window.confirm(t("Are you sure you want to delete return #{{v0}}?", { v0: id }))) return;
    try {
      await purchaseService.deletePurchaseReturn(id);
      setReturns(prev => prev.filter(r => String(r.id) !== String(id)));
      toast.success(t("Return #{{v0}} deleted successfully.", { v0: id }));
    } catch (err) {
      console.error("API delete error:", err);
      toast.error(err?.message || t("Failed to delete return."));
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredReturns.map((r, index) => ({
      'SL': index + 1,
      'Date': r.date,
      'Invoice No': r.invoice,
      'Supplier Name': r.supplier,
      'Total Amount (BDT)': r.total
    }));
    exportToExcel(dataToExport, 'Purchase_Return_List');
  };

  const filteredReturns = returns.filter(r => {
    if (filters.supplier && !r.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) return false;
    if (filters.invoiceNo && !r.invoice.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
    if (filters.productName || filters.barcode) {
      const q = (filters.productName || filters.barcode).toLowerCase();
      if (!r.supplier.toLowerCase().includes(q) && !r.invoice.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>{t("Purchase Return List")}</h2>
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
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t("Supplier")}</div>
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
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t("Product Name")}</div>
            <input 
              type="text" 
              placeholder={t("Product Name")} 
              value={filters.productName}
              onChange={(e) => handleFilterChange('productName', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t("Invoice No")}</div>
            <input 
              type="text" 
              placeholder={t("Invoice No")} 
              value={filters.invoiceNo}
              onChange={(e) => handleFilterChange('invoiceNo', e.target.value)}
              style={{ padding: '10px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t("Barcode")}</div>
            <input 
              type="text" 
              placeholder={t("Barcode")} 
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
            {t("Clear Filter")}
          </button>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>100</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handleExportExcel} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Download size={14} /> {t("Excel")}
            </button>
            <button onClick={clearFilters} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RotateCcw size={14} /> {t("Reset")}
            </button>
            <button onClick={fetchData} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("Reload")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '60px' }}>{t("ID NO ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("INVOICE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("SUPPLIER")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("TOTAL")}</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', width: '120px' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {t("No purchase return entries found.")}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret, index) => (
                  <tr key={ret.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.invoice}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>৳ {ret.total}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button 
                          onClick={() => { setSelectedReturn(ret); setShowViewModal(true); }} 
                          className="action-btn-sm" 
                          title={t("View Return Detail")}
                          style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(ret.id)} 
                          className="action-btn-sm" 
                          title={t("Delete Return")}
                          style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button 
                          onClick={() => navigate('/product/purchase-return/add-new')} 
                          className="action-btn-sm" 
                          title={t("Edit / New Return")}
                          style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {showViewModal && selectedReturn && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: '700px', maxWidth: '95vw', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header / Brand Banner for Print & View */}
            <PrintHeader />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #0ea5e9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{t("Purchase Return Voucher")}</h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{t("Invoice #")}{selectedReturn.invoice}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>{t("Supplier Name:")}</strong> {selectedReturn.supplier}</div>
              <div><strong>{t("Return Date:")}</strong> {selectedReturn.date}</div>
              <div><strong>{t("Invoice Number:")}</strong> {selectedReturn.invoice}</div>
              <div><strong>{t("Grand Total:")}</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>৳ {selectedReturn.total}</span></div>
            </div>

            {selectedReturn.items && selectedReturn.items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>{t("SL")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{t("Product Name")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>{t("Qty")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px' }}>{t("Rate")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px' }}>{t("Total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{item.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {(Number(item.buyingPrice || item.buying_price) || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {((Number(item.quantity) || 1) * (Number(item.buyingPrice || item.buying_price) || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t("Total Amount")}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                      {selectedReturn.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1' }}></td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', color: '#059669', fontSize: '14px' }}>৳ {selectedReturn.total}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', color: '#64748b' }}>
                {t("Total Return Value:")} <strong>৳ {selectedReturn.total}</strong>
              </div>
            )}

            {/* Signature Footer for Print */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: '12px' }}>
                {t("Supplier / Receiver Signature")}
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: '12px' }}>
                {t("Authorized Signature")}
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right', marginTop: '16px' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>
                {t("🖨️ Print Memo")}
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '6px' }}>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturnList;
