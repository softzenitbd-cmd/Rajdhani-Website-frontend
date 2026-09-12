import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import PrintHeader from '../../../components/PrintHeader';
import { Printer, RotateCcw, Plus } from 'lucide-react';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';

const SupplierStatement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { get, loading } = useApi();

  const [statementData, setStatementData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [filters, setFilters] = useState({
    supplier: location.state?.supplierId || '',
    startDate: '',
    endDate: ''
  });

  const [entries, setEntries] = useState(100);

  // Fetch Suppliers for dropdown
  const fetchSuppliers = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIERS);
      setSuppliers(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Statement Data
  const fetchStatement = async () => {
    // We only fetch if a supplier is selected, or you can fetch all
    try {
      let url = `${ENDPOINTS.ACCOUNTING_REPORT_SUPPLIER_LEDGER}?`;
      if (filters.supplier) url += `supplier_id=${filters.supplier}&`;
      if (filters.startDate) url += `start_date=${filters.startDate}&`;
      if (filters.endDate) url += `end_date=${filters.endDate}&`;
      
      const res = await get(url);
      setStatementData(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
      // Fallback empty if API fails or doesn't exist
      setStatementData([]);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch statement whenever filters change
  useEffect(() => {
    fetchStatement();
  }, [filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilter = () => {
    setFilters({
      supplier: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleReset = () => {
    handleClearFilter();
    setEntries(100);
  };

  // Basic client-side slicing
  const displayedData = statementData.slice(0, entries);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <PrintHeader />
      <div className="chart-card">

        {/* Title and Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-main)' }}>Supplier Statement</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/product/purchase/add-new')}
            style={{ background: 'var(--success)', padding: '8px 16px', borderRadius: '4px' }}
          >
            <Plus size={16} /> Purchase
          </button>
        </div>

        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', marginBottom: '24px', alignItems: 'flex-end', gap: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Search By Supplier</label>
            <div className="form-input floating-label">
              <select name="supplier" value={filters.supplier} onChange={handleInputChange}>
                <option value="">Select Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Search By Date</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-input floating-label" style={{ flex: 1 }}>
                <input 
                  type="date" 
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleInputChange}
                  style={{ color: 'var(--primary)' }} 
                />
              </div>
              <div className="form-input floating-label" style={{ flex: 1 }}>
                <input 
                  type="date" 
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleInputChange}
                  style={{ color: 'var(--primary)' }} 
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <button 
              className="btn btn-outline" 
              onClick={handleClearFilter}
              style={{ height: '48px', padding: '0 32px', background: '#718096', color: 'white', border: 'none' }}
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Show 
            <select 
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              style={{ margin: '0 8px', padding: '4px', border: '1px solid var(--secondary)', borderRadius: '4px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            entries
            {loading && <span style={{ marginLeft: '16px', color: '#3b82f6' }}>Loading...</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}>
              <Printer size={16} style={{ marginRight: '6px' }}/> Print
            </button>
            <button className="btn" onClick={handleReset} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}>
              <RotateCcw size={16} style={{ marginRight: '6px' }}/> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '4px', marginBottom: '16px' }}>
          <table className="custom-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SL ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>DATE ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>PRODUCT ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>UNIT ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>QUANTITY ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>PRICE ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>BUY PRICE ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>DISCOUNT ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>GRAND TOTAL ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>PURCHASE RETURN ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>RECEIVE ↕</th>
                <th style={{ padding: '12px 8px', fontSize: '11px', textAlign: 'center' }}>DUE ↕</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.length > 0 ? displayedData.map((row, index) => (
                <tr key={row.id || index} style={{ background: 'white' }}>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{formatDate(row.date)}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.product || row.product_name || '-'}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.unit || '-'}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.quantity || row.qty || '0'}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.price || '0.00'}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.buy_price || row.buyPrice || '0.00'}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.discount || '0.00'}</td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px', fontWeight: '500' }}>{row.grand_total || row.grandTotal || '0.00'}</td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.purchase_return || row.return || '0.00'}</td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.receive || row.payment || '0.00'}</td>
                  <td style={{ textAlign: 'center', padding: '8px', fontWeight: '600' }}>{row.due || '0.00'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading statement...' : 'No data found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatement;
