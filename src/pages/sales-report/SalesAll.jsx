import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { fmtDate } from '../../utils/apiHelpers';

const SalesAll = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client_id: '',
    from_date: '',
    to_date: '',
    barcode: '',
    product_id: ''
  });


  const fetchPrerequisites = async () => {
    try {
      const res = await crmService.getClients();
      setClients(Array.isArray(res) ? res : (res?.results || []));
    } catch (err) {
      console.error('Failed to load clients:', err?.message);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await saleService.getSalesReport(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setReports(data);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      client_id: '',
      from_date: '',
      to_date: '',
      barcode: '',
      product_id: ''
    });
  };

  const totalSalesAmount = reports.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          {/* Header row with Title and Go Back */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>{t("SALES REPORT")}</h3>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
          </div>

          {/* Filters Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Search By Client")}</label>
              <select name="client_id" value={filters.client_id} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}>
                <option value="">{t("Select Client")}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Search By Barcode")}</label>
              <input type="text" name="barcode" value={filters.barcode} onChange={handleFilterChange} placeholder={t("Enter Barcode")} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("From Date")}</label>
              <input type="date" name="from_date" value={filters.from_date} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("To Date")}</label>
              <input type="date" name="to_date" value={filters.to_date} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} />
            </div>
          </div>

          {/* Clear Filter Button */}
          <button onClick={handleClearFilters} style={{ width: '100%', background: '#7e8a9f', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '24px' }}>
            {t("Clear Filter")}
          </button>

          {/* Total Sales Bar */}
          <div style={{ background: '#059669', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '24px', borderRadius: '4px' }}>
            <span>{t("TOTAL SALES")}</span>
            <span>৳ {totalSalesAmount.toFixed(2)}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {t("Showing")} {reports.length} {t("entries")}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <Printer size={14} /> {t("Print Report")}
              </button>
              <button onClick={fetchReports} style={{ background: 'var(--info)', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <RefreshCcw size={14} /> {t("Refresh")}
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>{t("SL")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>{t("DATE")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>{t("CLIENT")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>{t("PRODUCT")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>{t("BARCODE")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>{t("QTY")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>{t("PRICE")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>{t("TOTAL")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>{t("RECEIVE")}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>{t("PROFIT")}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{fmtDate(row.date || row.issued_date)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{row.client_name || row.client?.client_name || '-'}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: '500' }}>{row.products || row.product || '-'}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', color: '#64748b' }}>{row.barcode || '-'}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{row.product_qty ?? row.qty ?? 0}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>৳ {Number(row.product_sale_price || row.price || 0).toFixed(2)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>৳ {Number(row.amount || row.total || 0).toFixed(2)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#059669' }}>৳ {Number(row.invoice?.receive_amount || row.receive || 0).toFixed(2)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#2563eb', fontWeight: 'bold' }}>৳ {Number(row.profit || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>{t("No sales report records found.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAll;
