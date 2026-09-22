import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Trash2, Eye, Plus, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import { fmtDate } from '../../utils/apiHelpers';

const PurchaseList = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();



  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [filters, setFilters] = useState({
    supplier: '',
    search: '',
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
        setPurchases(list.map((item, idx) => {
          let supName = item.supplier_name || item.supplier?.name;
          if (!supName && item.supplier) {
             const s = sList.find(x => String(x.id) === String(item.supplier));
             supName = s ? (s.name || s.company_name) : String(item.supplier);
          }

          let inv = item.invoice_number || item.invoice || String(item.id || idx + 100);
          if (inv && typeof inv === 'string' && inv.length > 20 && inv.includes('-')) {
             const shortId = inv.startsWith('INV-') ? inv.replace('INV-', '').split('-')[0] : inv.split('-')[0];
             inv = `INV-${shortId}`;
          } else if (!inv.startsWith('INV-')) {
             inv = `INV-${inv}`;
          }

          return {
            id: item.id || idx + 1,
            date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            invoice: inv,
            supplier: supName || '-',
            total: parseFloat(item.total_amount || item.grand_total || item.total || 0).toFixed(2)
          };
        }));
      } else {
        setPurchases([]);
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
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
      search: '',
      barcode: '',
      from_date: '',
      to_date: ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("Are you sure you want to delete this purchase invoice?"))) return;
    try {
      await purchaseService.deletePurchaseInvoice(id).catch(() => null);
      setPurchases(prev => prev.filter(p => p.id !== id));
      toast.success(t("Purchase invoice deleted successfully!"));
    } catch (err) {
      console.error("Error deleting purchase:", err);
      setPurchases(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!String(p.invoice).toLowerCase().includes(q) && !String(p.supplier).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const location = useLocation();

  useEffect(() => {
    if (location.state?.printPurchase && purchases.length > 0) {
      const targetId = location.state.printPurchase;
      // Also check invoice string just in case targetId is the invoice number
      let purchaseToPrint = purchases.find(p => String(p.id) === String(targetId) || p.invoice === targetId);
      
      // Fallback: If ID wasn't provided in state (targetId === true), just pick the first purchase (newest)
      if (!purchaseToPrint && targetId === true) {
        purchaseToPrint = purchases[0];
      }
      
      if (purchaseToPrint) {
        setSelectedPurchase(purchaseToPrint);
        setShowViewModal(true);
        // Automatically trigger print dialog after modal renders
        setTimeout(() => {
          window.print();
        }, 500);
        // Clean up the location state so it doesn't trigger on reload
        window.history.replaceState({}, document.title);
      }
    }
  }, [purchases, location.state]);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Purchase List")}</h2>
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
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
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
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Invoice No")}</div>
            <input 
              type="text" 
              placeholder={t("Search Invoice...")} 
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
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
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#94a3b8', color: 'black' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '60px' }}>{t("ID NO ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("INVOICE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("SUPPLIER")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("TOTAL")}</th>
                <th style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '120px' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>{t("No purchase invoices found")}</td>
                </tr>
              ) : (
                filteredPurchases.map((purchase, index) => (
                  <tr key={purchase.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{fmtDate(purchase.date)}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.invoice}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{purchase.total}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => { setSelectedPurchase(purchase); setShowViewModal(true); }} className="action-btn-sm" style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title={t("View Invoice")}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDelete(purchase.id)} className="action-btn-sm" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title={t("Delete Invoice")}>
                          <Trash2 size={14} />
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

      {/* Printable Purchase Invoice Modal */}
      {showViewModal && selectedPurchase && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: '700px', maxWidth: '95vw', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <PrintHeader />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #16a34a', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', color: '#0f172a' }}>{t("Purchase Invoice Memo")}</h3>
                <span style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b', fontWeight: '600' }}>{t("Invoice #")}{selectedPurchase.invoice || selectedPurchase.invoiceNo || `PUR-${selectedPurchase.id}`}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px 16px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: 'var(--fs-13, 13px)', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>{t("Supplier:")}</strong> {selectedPurchase.supplier || selectedPurchase.supplier_name || t("GENERAL SUPPLIER")}</div>
              <div><strong>{t("Date:")}</strong> {fmtDate(selectedPurchase.date || selectedPurchase.created_at)}</div>
              <div><strong>{t("Category / Memo:")}</strong> {t("PURCHASE INVOICE")}</div>
              <div><strong>{t("Status:")}</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{t("RECEIVED")}</span></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: 'var(--fs-13, 13px)' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>{t("SL")}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{t("Item Details")}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>{t("Qty")}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px' }}>{t("Buying Price")}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px' }}>{t("Total Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                  selectedPurchase.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{item.name || item.product_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.quantity || 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {Number(item.buying_price || item.price || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {(Number(item.quantity || 1) * Number(item.buying_price || item.price || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{t("PURCHASED GARMENTS / APPAREL ITEMS")}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {Number(selectedPurchase.total || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {Number(selectedPurchase.total || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t("Total Purchase Bill:")}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>৳ {Number(selectedPurchase.total || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Footer */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Supplier Signature")}
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
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

export default PurchaseList;

