import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2, Eye, Plus, RefreshCw, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';

const PurchaseReturnList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultReturns = [
    { id: 1, date: '25 Aug 2026', invoice: 'RET-1001', supplier: 'SHAJATPUR HAT', total: '1370.00' },
    { id: 2, date: '18 Aug 2026', invoice: 'RET-1002', supplier: 'MOKKA TOLY', total: '35490.00' },
    { id: 3, date: '09 Aug 2026', invoice: 'RET-1003', supplier: 'LEG FASHION', total: '1650.00' },
    { id: 4, date: '09 Aug 2026', invoice: 'RET-1004', supplier: 'POD SHATI SHOES', total: '550.00' },
    { id: 5, date: '09 Aug 2026', invoice: 'RET-1005', supplier: 'JUBILEE GALLERY SHOES', total: '950.00' },
    { id: 6, date: '27 Jul 2026', invoice: 'RET-1006', supplier: 'NEW DUBAI BORKA HOUSE 25', total: '4800.00' },
    { id: 7, date: '27 Jul 2026', invoice: 'RET-1007', supplier: 'POLLAMA FASHION 3PCES', total: '13700.00' },
    { id: 8, date: '27 Jul 2026', invoice: 'RET-1008', supplier: 'MASUD THREE PEACE', total: '27650.00' },
    { id: 9, date: '27 Jul 2026', invoice: 'RET-1009', supplier: 'DIPA ORANA', total: '780.00' },
    { id: 10, date: '25 Jul 2026', invoice: 'RET-1010', supplier: 'FASHION PLUS/FOYSAL', total: '1630.00' }
  ];

  const [returns, setReturns] = useState(defaultReturns);
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

      const localReturns = JSON.parse(localStorage.getItem('rajdhani_purchase_returns') || '[]');
      let apiList = [];
      if (returnsRes) {
        apiList = Array.isArray(returnsRes) ? returnsRes : (returnsRes?.results || []);
      }

      const combined = [...localReturns, ...apiList];
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
        setReturns(defaultReturns);
      }
    } catch (err) {
      console.error(err);
      setReturns(defaultReturns);
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
    if (!window.confirm(`Are you sure you want to delete return #${id}?`)) return;
    try {
      await purchaseService.deletePurchaseReturn(id).catch(() => null);
    } catch (err) {
      console.warn("API delete error:", err);
    }
    // Update local state and localStorage
    setReturns(prev => prev.filter(r => String(r.id) !== String(id)));
    const localReturns = JSON.parse(localStorage.getItem('rajdhani_purchase_returns') || '[]');
    const updatedLocal = localReturns.filter(r => String(r.id) !== String(id));
    localStorage.setItem('rajdhani_purchase_returns', JSON.stringify(updatedLocal));
    alert(`Return #${id} deleted successfully.`);
  };

  const handleExportExcel = () => {
    const headers = ['ID NO,DATE,INVOICE,SUPPLIER,TOTAL'];
    const rows = filteredReturns.map(r => `${r.id},"${r.date}","${r.invoice}","${r.supplier}",${r.total}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `purchase_returns_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Purchase Return List</h2>
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
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '60px' }}>ID NO ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>DATE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>INVOICE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SUPPLIER</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', width: '120px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No purchase return entries found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.invoice}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>৳ {ret.total}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button 
                          onClick={() => { setSelectedReturn(ret); setShowViewModal(true); }} 
                          className="action-btn-sm" 
                          title="View Return Detail"
                          style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(ret.id)} 
                          className="action-btn-sm" 
                          title="Delete Return"
                          style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button 
                          onClick={() => navigate('/product/purchase-return/add-new')} 
                          className="action-btn-sm" 
                          title="Edit / New Return"
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', width: '600px', borderRadius: '8px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Purchase Return Invoice #{selectedReturn.invoice}</h3>
              <button onClick={() => setShowViewModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
              <p><strong>Supplier:</strong> {selectedReturn.supplier}</p>
              <p><strong>Date:</strong> {selectedReturn.date}</p>
              <p><strong>Total Amount:</strong> ৳ {selectedReturn.total}</p>
            </div>
            {selectedReturn.items && selectedReturn.items.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {item.buyingPrice || item.buying_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '4px', marginRight: '8px' }}>
                Print
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturnList;
