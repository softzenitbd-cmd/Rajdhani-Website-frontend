import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import CustomDatePicker from '../../components/CustomDatePicker';

const SalesDaily = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client_id: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    barcode: '',
    search: ''
  });

  const fetchPrerequisites = async () => {
    try {
      const res = await crmService.getClients().catch(() => []);
      setClients(Array.isArray(res) ? res : (res?.results || []));
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
      client_id: '',
      from_date: new Date().toISOString().split('T')[0],
      to_date: new Date().toISOString().split('T')[0],
      barcode: '',
      search: ''
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
        receive: Number(row.receive || row.receive_amount || 0),
        due: Number(row.due || row.due_amount || 0),
        profit: Number(row.profit || 0)
      };
      if (v !== '-') invoiceGroups[v] = newGroup;
      groupedReports.push(newGroup);
    } else {
      invoiceGroups[v].products.push(row);
      invoiceGroups[v].total += Number(row.total || row.total_amount || 0);
      invoiceGroups[v].profit += Number(row.profit || 0);
    }
  });

  const calculateTotals = () => {
    return groupedReports.reduce((acc, group) => {
      let groupQty = 0, groupBuy = 0;
      group.products.forEach(p => {
        groupQty += Number(p.qty || p.quantity || 0);
        groupBuy += Number(p.buy_price || 0) * Number(p.qty || p.quantity || 0);
      });
      return {
        qty: acc.qty + groupQty,
        buy: acc.buy + groupBuy,
        total: acc.total + group.total,
        receive: acc.receive + group.receive,
        due: acc.due + group.due,
        profit: acc.profit + group.profit
      };
    }, { qty: 0, buy: 0, total: 0, receive: 0, due: 0, profit: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      
      <div className="premium-card">
        <div style={{ padding: '0', background: 'white', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', padding: '16px 0', margin: '0' }}>{t("Daily Sales Report")}</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', margin: '0' }}>{t("DAILY SALES REPORT")}</h3>
            <button 
              onClick={() => navigate('/invoice/list')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}
            >
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t('common.search_by_client')}</label>
              <select 
                name="client_id"
                value={filters.client_id}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              >
                <option value="">{t('common.select_client')}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name} - {client.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Search By Barcode / Invoice")}</label>
              <input 
                type="text"
                name="barcode"
                value={filters.barcode}
                onChange={handleFilterChange}
                placeholder={t("Barcode or Invoice ID")}
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t("Date")}</label>
              <CustomDatePicker 
                
                name="from_date"
                value={filters.from_date}
                onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value, to_date: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>

          <button 
            onClick={handleClearFilters}
            style={{ width: '100%', background: '#7e8a9f', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', marginBottom: '24px' }}
          >
            {t("Clear Filter")}
          </button>

          <div style={{ background: '#94a3b8', color: 'white', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '24px' }}>
            <span>{t("TOTAL SALES")}</span>
            <span>৳ {totals.total.toFixed(2)}</span>
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

          <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-11, 11px)', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '40px', padding: '10px' }}>{t("SL ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("ISSUED DATE ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("VOUCHER NO ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("CLIENT ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("PRODUCT ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("BARCODE ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("UNIT ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("QTY ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("BUY PRICE ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("SELL PRICE ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("TOTAL ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("RECEIVE ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("DUE ⇅")}</th>
                  <th style={{ padding: '10px' }}>{t("PROFIT ⇅")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="14" style={{ padding: '24px', textAlign: 'center' }}>{t("Loading daily sales report...")}</td>
                  </tr>
                ) : groupedReports.length === 0 ? (
                  <tr>
                    <td colSpan="14" style={{ padding: '24px', textAlign: 'center' }}>{t("No daily sales records found.")}</td>
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
                          const pad = n => n < 10 ? '0' + n : n;
                          const datePart = pad(dt.getDate()) + '-' + pad(dt.getMonth() + 1) + '-' + dt.getFullYear();
                          let h = dt.getHours();
                          const m = pad(dt.getMinutes());
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          h = h % 12;
                          h = h ? h : 12;
                          return (
                            <div>
                              <div>{datePart}</div>
                              <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{pad(h)}:{m} {ampm}</div>
                            </div>
                          );
                        } catch(e) { return d; }
                      })()}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.voucher_no}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
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
                            {p.barcode || '-'}
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
                            {Number(p.buy_price || 0).toFixed(2)}
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
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.receive.toFixed(2)}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.due.toFixed(2)}</td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>{group.profit.toFixed(2)}</td>
                    </tr>
                    );
                  })
                )}
                <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                  <td colSpan="7" style={{ padding: '10px', textAlign: 'center' }}>{t('common.total')}</td>
                  <td style={{ padding: '10px' }}>{totals.qty}</td>
                  <td style={{ padding: '10px' }}>৳{totals.buy.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>-</td>
                  <td style={{ padding: '10px' }}>৳{totals.total.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>৳{totals.receive.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>৳{totals.due.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>৳{totals.profit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDaily;
