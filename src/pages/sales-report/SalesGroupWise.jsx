import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { today } from '../../utils/apiHelpers';
import { crmService } from '../../services/crmService';
import CustomDatePicker from '../../components/CustomDatePicker';


const firstOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };

const SalesGroupWise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showReport, setShowReport] = useState(true);
  const [reports, setReports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    client_group_id: '',
    from_date: firstOfMonth(),
    to_date: today()
  });


  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await crmService.getClientGroups().catch(() => []);
        setGroups(Array.isArray(res) ? res : (res?.results || []));
      } catch (err) {
        console.error("Error fetching client groups:", err);
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
      console.error("Error fetching group sales report:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

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
            value={filters.client_group_id}
            onChange={(e) => setFilters(prev => ({ ...prev, client_group_id: e.target.value }))}
            style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}
          >
            <option value="">{t("Select Customer Group")}</option>
            {groups.map(g => (
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
              <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', margin: 0 }}>{t("Group Wise Sales Report")}</h2>
            </div>
            
            {/* Header row with Title and Go Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
                {t("GROUP WISE SALES REPORT | FROM (")}{filters.from_date}{t(") TO (")}{filters.to_date})
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
                {t("Showing")} {reports.length} {t("entries")}
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
                      <td colSpan="12" style={{ padding: '24px', textAlign: 'center' }}>{t("Loading report...")}</td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ padding: '24px', textAlign: 'center' }}>{t("No records found.")}</td>
                    </tr>
                  ) : (
                    reports.map((row, index) => {
                      const items = row.items || [{ product: row.product_name || row.product || '-', unit: row.unit_name || row.unit || 'PEACE', qty: row.qty || 1, price: row.price || 0 }];
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
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{(() => {
        let v = row.invoice?.invoice_id || row.invoice?.id || row.invoice_no || row.voucher || row.invoice_id;
        if (typeof v === 'string' && v.length > 20 && v.includes('-')) {
           v = row.invoice?.voucher_no || row.voucher_no || '-';
        }
        return v || '-';
      })()}</td>
                          
                          {/* Nested columns for items */}
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.product}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.unit}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.qty}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{Number(item.price).toFixed(2)}</div>
                              ))}
                            </div>
                          </td>

                          {/* Totals side */}
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{Number(row.total || row.total_amount || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{Number(row.discount || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{Number(row.grandTotal || row.grand_total || row.total || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{Number(row.receiveAmount || row.receive_amount || row.receive || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{Number(row.dueAmount || row.due_amount || row.due || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SalesGroupWise;
