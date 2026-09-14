import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';

const SalesProductWise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    product_group_id: '',
    product_id: '',
    barcode: '',
    from_date: '',
    to_date: ''
  });


  const fetchPrerequisites = async () => {
    try {
      const [prodRes, groupRes] = await Promise.all([
        productService.getProducts().catch(() => []),
        productService.groups.getAll().catch(() => [])
      ]);
      setProducts(Array.isArray(prodRes) ? prodRes : (prodRes?.results || []));
      setProductGroups(Array.isArray(groupRes) ? groupRes : (groupRes?.results || []));
    } catch (err) {
      console.error(err);
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
      product_group_id: '',
      product_id: '',
      barcode: '',
      from_date: '',
      to_date: ''
    });
  };

  const calculateTotals = () => {
    return reports.reduce((acc, row) => ({
      qty: acc.qty + Number(row.qty || row.quantity || 0),
      total: acc.total + Number(row.total || row.total_amount || 0),
      dis: acc.dis + Number(row.dis || row.discount || 0),
      grandTotal: acc.grandTotal + Number(row.grandTotal || row.grand_total || row.total || 0),
      receive: acc.receive + Number(row.receive || row.receive_amount || 0),
      due: acc.due + Number(row.due || row.due_amount || 0)
    }), { qty: 0, total: 0, dis: 0, grandTotal: 0, receive: 0, due: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      
      <div className="premium-card">
        {/* Banner */}
        <div style={{ padding: '0', background: 'white', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', padding: '16px 0', margin: '0' }}>{t("Product Wise Sales Reports")}</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          {/* Header row with Title and Go Back */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>{t("PRODUCT WISE SALES REPORTS")}</h3>
            <button 
              onClick={() => navigate('/invoice/list')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
          </div>

          {/* Filters Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Group")}</label>
              <select 
                name="product_group_id"
                value={filters.product_group_id}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              >
                <option value="">{t("Select Product Group")}</option>
                {productGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Search By Product")}</label>
              <select 
                name="product_id"
                value={filters.product_id}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              >
                <option value="">{t("Select Product")}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Barcode")}</label>
              <input 
                type="text" 
                name="barcode"
                value={filters.barcode}
                onChange={handleFilterChange}
                placeholder={t("Barcode")} 
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t('common.search_by_date')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="date" 
                  name="from_date"
                  value={filters.from_date}
                  onChange={handleFilterChange}
                  style={{ width: '50%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} 
                />
                <input 
                  type="date" 
                  name="to_date"
                  value={filters.to_date}
                  onChange={handleFilterChange}
                  style={{ width: '50%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }} 
                />
              </div>
            </div>
          </div>

          {/* Clear Filter Button */}
          <button 
            onClick={handleClearFilters}
            style={{ width: '100%', background: '#7e8a9f', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '24px' }}
          >
            {t("Clear Filter")}
          </button>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {t("Showing")} {reports.length} {t("entries")}
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <Printer size={14} /> {t("Print")}
              </button>
              <button onClick={handleClearFilters} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <RefreshCcw size={14} /> {t("Reset")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '11px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '40px', padding: '12px' }}>{t("SL ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("ISSUED DATE ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("VOUCHER NO ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("CLIENT ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("PRODUCT ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("UNIT ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("QTY ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("PRICE ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("TOTAL ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("DIS ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("GRAND TOTAL ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("RECEIVE ⇅")}</th>
                  <th style={{ padding: '12px' }}>{t("DUE ⇅")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>{t("Loading product sales report...")}</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>{t("No product sales records found.")}</td>
                  </tr>
                ) : (
                  reports.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={{ padding: '12px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px' }}>{row.date || row.issued_date || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.voucher || row.invoice_id || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.client_name || row.client || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.product_name || row.product || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.unit_name || row.unit || t("PEACE")}</td>
                      <td style={{ padding: '12px' }}>{row.qty || row.quantity || 0}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.price || row.unit_price || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.total || row.total_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.dis || row.discount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.grandTotal || row.grand_total || row.total || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.receive || row.receive_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.due || row.due_amount || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                  <td colSpan="6" style={{ padding: '12px', textAlign: 'center' }}>{t('common.total')}</td>
                  <td style={{ padding: '12px' }}>{totals.qty}</td>
                  <td style={{ padding: '12px' }}>-</td>
                  <td style={{ padding: '12px' }}>৳{totals.total.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.dis.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.grandTotal.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.receive.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.due.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SalesProductWise;
