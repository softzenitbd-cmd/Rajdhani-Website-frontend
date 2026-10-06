import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import CustomDatePicker from '../../components/CustomDatePicker';
import { crmService } from '../../services/crmService';

const SalesProductWise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    product_group_id: '',
    product_id: '',
    barcode: '',
    from_date: today,
    to_date: today
  });

  const fetchPrerequisites = async () => {
    try {
      const [prodRes, groupRes, clientsRes] = await Promise.all([
        productService.getProducts({ page_size: 500 }).catch(() => []),
        productService.groups.getAll().catch(() => []),
        crmService.getClients({ page_size: 5000 }).catch(() => [])
      ]);
      setProducts(Array.isArray(prodRes) ? prodRes : (prodRes?.results || []));
      setProductGroups(Array.isArray(groupRes) ? groupRes : (groupRes?.results || []));
      setClients(Array.isArray(clientsRes) ? clientsRes : (clientsRes?.results || []));
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
      from_date: today,
      to_date: today
    });
  };

  const getVoucherNo = (row) => {
    let v = row.invoice?.invoice_no || row.invoice_no || row.voucher_no || row.invoice?.voucher_no || row.invoice?.invoice_id || row.voucher || row.invoice_id || row.invoice?.id || row.id;
    if (typeof v === 'string' && v.length > 20 && v.includes('-')) {
       v = row.invoice?.voucher_no || row.voucher_no || v.split('-')[0];
    }
    return v || '-';
  };

  const groupedReports = [];
  const invoiceGroups = {};
  reports.forEach((row) => {
    const v = getVoucherNo(row);
    if (!invoiceGroups[v] || v === '-') {
      const newGroup = {
        voucher_no: v,
        raw: row,
        products: [row],
        total: Number(row.total || row.total_amount || 0),
        dis: Number(row.dis || row.discount || 0),
        grandTotal: Number(row.grandTotal || row.grand_total || row.total || 0),
        receive: Number(row.receive || row.receive_amount || 0),
        due: Number(row.due || row.due_amount || 0)
      };
      if (v !== '-') invoiceGroups[v] = newGroup;
      groupedReports.push(newGroup);
    } else {
      invoiceGroups[v].products.push(row);
      invoiceGroups[v].total += Number(row.total || row.total_amount || 0);
      invoiceGroups[v].dis += Number(row.dis || row.discount || 0);
      invoiceGroups[v].grandTotal += Number(row.grandTotal || row.grand_total || row.total || 0);
    }
  });

  const calculateTotals = () => {
    return groupedReports.reduce((acc, group) => {
      let groupQty = 0;
      group.products.forEach(p => {
        groupQty += Number(p.qty || p.quantity || 0);
      });
      return {
        qty: acc.qty + groupQty,
        total: acc.total + group.total,
        dis: acc.dis + group.dis,
        grandTotal: acc.grandTotal + group.grandTotal,
        receive: acc.receive + group.receive,
        due: acc.due + group.due
      };
    }, { qty: 0, total: 0, dis: 0, grandTotal: 0, receive: 0, due: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      
      <div className="premium-card">
        {/* Banner */}
        <div style={{ padding: '0', background: 'white', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', padding: '16px 0', margin: '0' }}>{t("Product Wise Sales Reports")}</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>{t("PRODUCT WISE SALES REPORTS")}</h3>
            <button 
              onClick={() => navigate('/invoice/list')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}
            >
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("Group")}</label>
              <select 
                name="product_group_id"
                value={filters.product_group_id}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }}
              >
                <option value="">{t("Select Product Group")}</option>
                {productGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("Search By Product")}</label>
              <select 
                name="product_id"
                value={filters.product_id}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }}
              >
                <option value="">{t("Select Product")}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t("Barcode")}</label>
              <input 
                type="text" 
                name="barcode"
                value={filters.barcode}
                onChange={handleFilterChange}
                placeholder={t("Barcode")} 
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '8px' }}>{t('common.search_by_date')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CustomDatePicker 
                  name="from_date"
                  value={filters.from_date}
                  onChange={handleFilterChange}
                  style={{ width: '50%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
                />
                <CustomDatePicker 
                  name="to_date"
                  value={filters.to_date}
                  onChange={handleFilterChange}
                  style={{ width: '50%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-13, 13px)' }} 
                />
              </div>
            </div>
            <div>
              <button onClick={handleClearFilters} style={{ background: '#ef4444', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', height: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <RefreshCcw size={14} /> {t("Clear")}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-muted)' }}>
              {t("Showing")} {groupedReports.length} {t("entries")}
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }}>
                <Printer size={14} /> {t("Print")}
              </button>
              <button onClick={handleClearFilters} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }}>
                <RefreshCcw size={14} /> {t("Reset")}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-11, 11px)', textAlign: 'center' }}>
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
                  <th style={{ padding: '12px' }}>{t("PROFIT ⇅")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>{t("Loading product sales report...")}</td>
                  </tr>
                ) : groupedReports.length === 0 ? (
                  <tr>
                    <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>{t("No product sales records found.")}</td>
                  </tr>
                ) : (
                  groupedReports.map((group, idx) => {
                    const row = group.raw;
                    return (
                    <tr key={row.id || idx}>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{(() => {
                        let d = row.date || row.issued_date || row.created_at;
                        if (!d) return '-';
                        try {
                          const dt = new Date(d);
                          if (isNaN(dt.getTime())) return d;
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
                        } catch(e) { return d; }
                      })()}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.voucher_no}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <div>{(() => {
                          let cName = clients.find(c => String(c.id || c.uuid) === String(row.client_id || row.client))?.name || clients.find(c => String(c.id || c.uuid) === String(row.client_id || row.client))?.company_name || row.client_name || row.client?.client_name || row.client || '-'; cName = (typeof cName === 'string' && cName.length === 36 && cName.includes('-')) ? 'Unknown Client' : cName;
                          const cPhone = row.client_phone || row.phone || row.client?.phone || row.client?.mobile || row.invoice?.client?.phone || (clients.find(c => String(c.id || c.uuid) === String(row.client_id))?.phone) || (clients.find(c => (c.name || c.company_name) === (row.client_name || row.client))?.phone) || '';
                          const cAddress = row.client_address || row.address || row.client?.address || row.invoice?.client?.address || (clients.find(c => String(c.id || c.uuid) === String(row.client_id))?.address) || (clients.find(c => (c.name || c.company_name) === (row.client_name || row.client))?.address) || '';
                          
                          let parts = [];
                          if (cName && cName !== '-') parts.push(cName);
                          if (cPhone) parts.push(cPhone);
                          if (cAddress) parts.push(cAddress);
                          
                          return parts.length > 0 ? parts.join(' | ') : '-';
                        })()}</div>
                      </td>

                      <td style={{ padding: '0', verticalAlign: 'middle' }}>
                        {group.products.map((p, i) => (
                          <div key={i} style={{ padding: '8px 4px', borderBottom: i < group.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                            {p.product_name || p.product || '-'}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '0', verticalAlign: 'middle' }}>
                        {group.products.map((p, i) => (
                          <div key={i} style={{ padding: '8px 4px', borderBottom: i < group.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                            {p.unit_name || p.unit || t("PEACE")}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '0', verticalAlign: 'middle' }}>
                        {group.products.map((p, i) => (
                          <div key={i} style={{ padding: '8px 4px', borderBottom: i < group.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                            {p.qty || p.quantity || 0}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '0', verticalAlign: 'middle' }}>
                        {group.products.map((p, i) => (
                          <div key={i} style={{ padding: '8px 4px', borderBottom: i < group.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                            {Number(p.price || p.unit_price || 0).toFixed(2)}
                          </div>
                        ))}
                      </td>

                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.total.toFixed(2)}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.dis.toFixed(2)}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.grandTotal.toFixed(2)}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.receive.toFixed(2)}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.due.toFixed(2)}</td>
                    </tr>
                    );
                  })
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


