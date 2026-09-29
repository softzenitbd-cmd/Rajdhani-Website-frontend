import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { today } from '../../utils/apiHelpers';
import { productService } from '../../services/productService';
import CustomDatePicker from '../../components/CustomDatePicker';
import { crmService } from '../../services/crmService';


const firstOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };

const SalesProductGroupWise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showReport, setShowReport] = useState(true);
  const [reports, setReports] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    product_group_id: '',
    from_date: firstOfMonth(),
    to_date: today()
  });


  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await productService.groups.getAll().catch(() => []);
        setProductGroups(Array.isArray(res) ? res : (res?.results || []));
        const clientsRes = await crmService.getClients().catch(() => []);
        setClients(Array.isArray(clientsRes) ? clientsRes : (clientsRes?.results || []));
      } catch (err) {
        console.error("Error fetching product groups:", err);
      }
    };
    fetchGroups();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setShowReport(true);
      const res = await saleService.getSalesReport(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setReports(data);
    } catch (err) {
      console.error("Error fetching product group sales report:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

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
        products: row.items ? row.items : [row],
        total: Number(row.total || row.total_amount || 0),
        dis: Number(row.discount || row.dis || 0),
        grandTotal: Number(row.grandTotal || row.grand_total || row.total || 0),
        receive: Number(row.receiveAmount || row.receive_amount || row.receive || 0),
        due: Number(row.dueAmount || row.due_amount || row.due || 0)
      };
      if (v !== '-') invoiceGroups[v] = newGroup;
      groupedReports.push(newGroup);
    } else {
      if (row.items) {
        invoiceGroups[v].products.push(...row.items);
      } else {
        invoiceGroups[v].products.push(row);
      }
      invoiceGroups[v].total += Number(row.total || row.total_amount || 0);
      invoiceGroups[v].dis += Number(row.discount || row.dis || 0);
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
      
      {/* Top Filter Pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', position: 'relative', zIndex: 1, marginTop: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', alignItems: 'center', width: '80%', maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', flex: 1, gap: '0', position: 'relative' }}>
            <CustomDatePicker 
               
              value={filters.from_date}
              onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
              style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none' }} 
            />
            <CustomDatePicker 
               
              value={filters.to_date}
              onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
              style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRadius: '0 4px 4px 0', outline: 'none' }} 
            />
          </div>
          
          <select 
            value={filters.product_group_id}
            onChange={(e) => setFilters(prev => ({ ...prev, product_group_id: e.target.value }))}
            style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}
          >
            <option value="">{t("Select Product Group")}</option>
            {productGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          
          <button 
            onClick={handleSearch}
            style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: '500' }}
          >
            {t("Search")}
          </button>
        </div>
      </div>

      {showReport && (
        <div className="premium-card" style={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="premium-body" style={{ padding: '32px' }}>
            <PrintHeader />
            
            <div style={{ textAlign: 'center', margin: '20px 0', fontFamily: 'monospace' }}>
              <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', margin: 0 }}>{t("Product Group Wise Sales Report")}</h2>
            </div>
            
            {/* Header row with Title and Go Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
                {t("PRODUCT GROUP WISE SALES REPORT | FROM (")}{filters.from_date}{t(") TO (")}{filters.to_date})
              </h3>
              <button 
                onClick={() => navigate('/invoice/list')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#7e8a9f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }}
              >
                 <ArrowLeft size={14} /> {t("Go Back")}
              </button>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: 'var(--fs-12, 12px)', color: 'var(--text-muted)' }}>
                {t("Showing")} {groupedReports.length} {t("entries")}
              </div>
              
              <div style={{ display: 'flex', gap: '2px' }}>
                <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)', fontWeight: '500' }}>
                  <Printer size={14} /> {t("Print")}
                </button>
                <button onClick={handleSearch} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)', fontWeight: '500' }}>
                  <RefreshCcw size={14} /> {t("Reset")}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table style={{ width: '100%', fontSize: 'var(--fs-11, 11px)', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #94a3b8' }}>
                <thead>
                  <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                    <th style={{ width: '40px', padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("SL ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("ISSUED DATE ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("VOUCHER NO ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("CLIENT ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', minWidth: '150px', fontWeight: '600' }}>{t("PRODUCT ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("UNIT ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("QUANTITY ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("PRICE ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("TOTAL ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("DISCOUNT ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("GRAND TOTAL ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("RECEIVE AMOUNT ⇅")}</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>{t("DUE AMOUNT ⇅")}</th>
                  </tr>
                </thead>
                <tbody style={{ background: '#f8fafc' }}>
                  {loading ? (
                    <tr>
                      <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>{t("Loading product group report...")}</td>
                    </tr>
                  ) : groupedReports.length === 0 ? (
                    <tr>
                      <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>{t("No records found.")}</td>
                    </tr>
                  ) : (
                    groupedReports.map((group, index) => {
                      const row = group.raw;
                      const items = group.products;
                      return (
                        <tr key={row.id || index}>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{index + 1}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{(() => {
        let d = row.date || row.issued_date || row.created_at;
        if (!d) return '-';
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return d;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
        } catch(e) { return d; }
      })()}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{group.voucher_no}</td>
                          
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>
                            <div>{(() => {
                              const cName = row.client_name || row.client?.client_name || row.client || '-';
                              const cPhone = row.client_phone || row.phone || row.client?.phone || row.client?.mobile || row.invoice?.client?.phone || (clients.find(c => String(c.id || c.uuid) === String(row.client_id))?.phone) || (clients.find(c => (c.name || c.company_name) === (row.client_name || row.client))?.phone) || '';
                              const cAddress = row.client_address || row.address || row.client?.address || row.invoice?.client?.address || (clients.find(c => String(c.id || c.uuid) === String(row.client_id))?.address) || (clients.find(c => (c.name || c.company_name) === (row.client_name || row.client))?.address) || '';
                              
                              let parts = [];
                              if (cName && cName !== '-') parts.push(cName);
                              if (cPhone) parts.push(cPhone);
                              if (cAddress) parts.push(cAddress);
                              
                              return parts.length > 0 ? parts.join(' | ') : '-';
                            })()}</div>
                          </td>

                          {/* Nested columns for items */}
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: idx < items.length - 1 ? '1px solid #94a3b8' : 'none', flex: 1, minHeight: '26px' }}>{item.product_name || item.product || '-'}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: idx < items.length - 1 ? '1px solid #94a3b8' : 'none', flex: 1, minHeight: '26px' }}>{item.unit_name || item.unit || 'PEACE'}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: idx < items.length - 1 ? '1px solid #94a3b8' : 'none', flex: 1, minHeight: '26px' }}>{item.qty || item.quantity || 1}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: idx < items.length - 1 ? '1px solid #94a3b8' : 'none', flex: 1, minHeight: '26px' }}>{Number(item.price || item.unit_price || 0).toFixed(2)}</div>
                              ))}
                            </div>
                          </td>

                          {/* Totals side */}
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{group.total.toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{group.dis.toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{group.grandTotal.toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{group.receive.toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{group.due.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                  {/* Total Row */}
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td colSpan="6" style={{ padding: '12px', textAlign: 'center', border: '1px solid #94a3b8' }}>{t('common.total')}</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>{totals.qty}</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>-</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>৳{totals.total.toFixed(2)}</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>৳{totals.dis.toFixed(2)}</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>৳{totals.grandTotal.toFixed(2)}</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>৳{totals.receive.toFixed(2)}</td>
                    <td style={{ padding: '12px', border: '1px solid #94a3b8' }}>৳{totals.due.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SalesProductGroupWise;
