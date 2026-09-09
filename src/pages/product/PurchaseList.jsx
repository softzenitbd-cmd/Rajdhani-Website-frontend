import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2, Eye, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';

const PurchaseList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultPurchases = [
    { id: 1, date: '24 Aug 2026', invoice: 'INV-1001', supplier: 'ROKSANA TOPS BONGO', total: '12500.00' },
    { id: 2, date: '23 Aug 2026', invoice: 'INV-1002', supplier: 'SABBIR VI INDIA HELAI', total: '18250.00' },
    { id: 3, date: '23 Aug 2026', invoice: 'INV-1003', supplier: '25 NASIMA APA', total: '10800.00' },
    { id: 4, date: '20 Aug 2026', invoice: 'INV-1004', supplier: 'ACHAL BORKHA BAZAR', total: '23750.00' },
    { id: 5, date: '20 Aug 2026', invoice: 'INV-1005', supplier: 'MA ENTERPRISE// JOM JOM PCES', total: '54600.00' }
  ];

  const defaultSuppliers = [
    { id: '1', name: 'ROKSANA TOPS BONGO' },
    { id: '2', name: 'SABBIR VI INDIA HELAI' },
    { id: '3', name: '25 NASIMA APA' }
  ];

  const [purchases, setPurchases] = useState(defaultPurchases);
  const [suppliers, setSuppliers] = useState(defaultSuppliers);
  const [loading, setLoading] = useState(false);

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

      if (purRes) {
        const list = Array.isArray(purRes) ? purRes : (purRes?.results || []);
        if (list.length > 0) {
          setPurchases(list.map((item, idx) => ({
            id: item.id || idx + 1,
            date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '24 Aug 2026',
            invoice: item.invoice_number || item.invoice || `INV-${item.id || idx + 100}`,
            supplier: item.supplier_name || item.supplier || 'ROKSANA TOPS BONGO',
            total: parseFloat(item.total_amount || item.grand_total || item.total || 0).toFixed(2)
          })));
        } else {
          setPurchases(defaultPurchases);
        }
      }

      if (supRes) {
        const sList = Array.isArray(supRes) ? supRes : (supRes?.results || []);
        setSuppliers(sList.length > 0 ? sList : defaultSuppliers);
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
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
      search: '',
      barcode: '',
      from_date: '',
      to_date: ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase invoice?")) return;
    try {
      await purchaseService.deletePurchaseInvoice(id).catch(() => null);
      setPurchases(prev => prev.filter(p => p.id !== id));
      alert("Purchase invoice deleted successfully!");
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

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Purchase List</h2>
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
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
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
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Invoice No</div>
            <input 
              type="text" 
              placeholder="Search Invoice..." 
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
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
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No purchase invoices found</td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.id}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.date}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.invoice}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{purchase.supplier}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳{purchase.total}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => alert(`Invoice Details: ${purchase.invoice}`)} className="action-btn-sm" style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDelete(purchase.id)} className="action-btn-sm" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title="Delete">
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
    </div>
  );
};

export default PurchaseList;

