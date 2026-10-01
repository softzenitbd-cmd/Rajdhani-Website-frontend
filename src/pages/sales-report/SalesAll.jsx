import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { fmtDate } from '../../utils/apiHelpers';
import CustomDatePicker from '../../components/CustomDatePicker';


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

  const totalQty = reports.reduce((sum, item) => sum + Number(item.product_qty ?? item.qty ?? 0), 0);
  const totalSalesAmount = reports.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0);
  const totalReceive = reports.reduce((sum, item) => sum + Number(item.invoice?.receive_amount || item.receive || 0), 0);
  const totalProfit = reports.reduce((sum, item) => sum + Number(item.profit || 0), 0);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          {/* Header row with Title and Go Back */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', margin: '0' }}>{t("SALES REPORT")}</h3>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}>
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
          </div>

          {/* Filters Area */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("Search By Client")}</label>
              <select name="client_id" value={filters.client_id} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }}>
                <option value="">{t("Select Client")}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("Search By Barcode")}</label>
              <input type="text" name="barcode" value={filters.barcode} onChange={handleFilterChange} placeholder={t("Enter Barcode")} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("From Date")}</label>
              <CustomDatePicker name="from_date" value={filters.from_date} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("To Date")}</label>
              <CustomDatePicker name="to_date" value={filters.to_date} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} />
            </div>
            <div>
              <button onClick={handleClearFilters} style={{ background: '#ef4444', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                {t("Clear")}
              </button>
            </div>
          </div>

          {/* Total Sales Bar */}
          <div style={{ background: '#059669', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '24px', borderRadius: '4px' }}>
            <span>{t("TOTAL SALES")}</span>
            <span>৳ {totalSalesAmount.toFixed(2)}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-muted)' }}>
              {t("Showing")} {reports.length} {t("entries")}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}>
                <Printer size={14} /> {t("Print Report")}
              </button>
              <button onClick={fetchReports} style={{ background: 'var(--info)', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}>
                <RefreshCcw size={14} /> {t("Refresh")}
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <table className="custom-table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: 'var(--fs-12, 12px)' }}>
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
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                        <div>{(() => {
                          const c = clients.find(c => String(c.id || c.uuid) === String(row.client_id || row.client));
                          let n = c?.name || c?.company_name || row.client_name || row.client?.client_name || '-';
                          return (typeof n === 'string' && n.length === 36 && n.includes('-')) ? 'Unknown Client' : n;
                        })()}</div>
                        <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{row.client_phone || row.phone || row.client?.phone || row.client?.mobile || row.invoice?.client?.phone || (clients.find(c => String(c.id || c.uuid) === String(row.client_id))?.phone) || (clients.find(c => (c.name || c.company_name) === (row.client_name || row.client))?.phone) || '-'}</div>
                      </td>
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
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="5" style={{ padding: '10px 4px', textAlign: 'right' }}>{t("Total:")}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>{totalQty}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#059669' }}>৳ {totalSalesAmount.toFixed(2)}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#059669' }}>৳ {totalReceive.toFixed(2)}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#2563eb' }}>৳ {totalProfit.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAll;

