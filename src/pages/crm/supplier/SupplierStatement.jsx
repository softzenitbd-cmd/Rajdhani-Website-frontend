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
  const [summary, setSummary] = useState(null); // { supplier: {...} } from the ledger API
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

  // GET /api/accounting/reports/supplier-ledger/?supplier_id=&from_date=&to_date=
  // → { supplier: {id, name, phone, current_due}, ledger: [{date, type, reference, debit, credit, balance}] }
  const fetchStatement = async () => {
    if (!filters.supplier) {
      setStatementData([]);
      setSummary(null);
      return;
    }
    try {
      const params = new URLSearchParams({ supplier_id: filters.supplier });
      if (filters.startDate) params.set('from_date', filters.startDate);
      if (filters.endDate) params.set('to_date', filters.endDate);
      const res = await get(`${ENDPOINTS.ACCOUNTING_REPORT_SUPPLIER_LEDGER}?${params.toString()}`);
      const rows = Array.isArray(res) ? res : (res?.ledger || res?.results || res?.data || []);
      setStatementData(rows);
      setSummary(Array.isArray(res) ? null : res);
    } catch (err) {
      // useApi already toasts the error
      setStatementData([]);
      setSummary(null);
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
          <h2 style={{ fontSize: 'var(--fs-20, 20px)', fontWeight: '500', color: 'var(--text-main)' }}>{t("Supplier Statement")}</h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/product/purchase/add-new')}
            style={{ background: 'var(--success)', padding: '8px 16px', borderRadius: '4px' }}
          >
            <Plus size={16} /> {t("Purchase")}
          </button>
        </div>

        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', marginBottom: '24px', alignItems: 'flex-end', gap: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px' }}>{t("Search By Supplier")}</label>
            <div className="form-input floating-label">
              <select name="supplier" value={filters.supplier} onChange={handleInputChange}>
                <option value="">{t("Select Suppliers")}</option>
                {suppliers.map(s => (
                  <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px' }}>{t("Search By Date")}</label>
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
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {summary?.supplier && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '16px', fontSize: 'var(--fs-13, 13px)' }}>
            <div><b>{t("Supplier:")}</b> {summary.supplier.name}</div>
            {summary.supplier.phone && <div><b>{t("Phone:")}</b> {summary.supplier.phone}</div>}
            <div style={{ marginLeft: 'auto' }}><b>{t("Current Due:")}</b> <span style={{ color: '#dc2626', fontWeight: 700 }}>৳ {Number(summary.supplier.current_due || 0).toFixed(2)}</span></div>
          </div>
        )}

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Show")}
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
            {t("entries")}
            {loading && <span style={{ marginLeft: '16px', color: '#3b82f6' }}>{t("Loading...")}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <Printer size={16} style={{ marginRight: '6px' }}/> {t("Print")}
            </button>
            <button className="btn" onClick={handleReset} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <RotateCcw size={16} style={{ marginRight: '6px' }}/> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '4px', marginBottom: '16px' }}>
          <table className="custom-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("SL")}</th>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("DATE")}</th>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("TYPE")}</th>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("REFERENCE")}</th>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("PURCHASE (DEBIT)")}</th>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("PAYMENT / RETURN (CREDIT)")}</th>
                <th style={{ padding: '12px 8px', fontSize: 'var(--fs-11, 11px)', textAlign: 'right' }}>{t("BALANCE")}</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.length > 0 ? displayedData.map((row, index) => (
                <tr key={row.id || index} style={{ background: 'white' }}>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{formatDate(row.date)}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px' }}>{row.type || row.transaction_type || '-'}</td>
                  <td style={{ borderRight: '1px solid #e2e8f0', padding: '8px', color: '#475569' }}>{row.reference || row.description || '-'}</td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid #e2e8f0', padding: '8px' }}>{Number(row.debit || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid #e2e8f0', padding: '8px', color: '#059669' }}>{Number(row.credit || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px', fontWeight: '600', color: Number(row.balance) > 0 ? '#dc2626' : '#059669' }}>{Number(row.balance || 0).toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {loading ? t("Loading statement...") : filters.supplier ? t("No transactions found") : t("Select a supplier to view the statement")}
                  </td>
                </tr>
              )}
              {displayedData.length > 0 && (
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="4" style={{ padding: '10px', textAlign: 'right' }}>{t("TOTAL")}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{displayedData.reduce((a, r) => a + Number(r.debit || 0), 0).toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#059669' }}>{displayedData.reduce((a, r) => a + Number(r.credit || 0), 0).toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#dc2626' }}>{Number(summary?.supplier?.current_due ?? displayedData[displayedData.length - 1]?.balance ?? 0).toFixed(2)}</td>
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
