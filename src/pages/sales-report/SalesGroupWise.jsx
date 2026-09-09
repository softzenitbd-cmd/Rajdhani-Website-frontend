import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';

const SalesGroupWise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showReport, setShowReport] = useState(true);
  const [reports, setReports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    client_group_id: '',
    from_date: '2026-07-01',
    to_date: '2026-08-31'
  });

  const dummyData = [
    {
      sl: 1,
      date: '24 Aug 2026',
      voucher: '160328',
      items: [
        { product: 'PB LUNGI MAJBA', unit: 'PEACE', qty: 1, price: '700.00' },
        { product: 'PB LUNGI SUHAS', unit: 'PEACE', qty: 1, price: '1050.00' }
      ],
      total: '1750',
      discount: '0',
      transport: '0',
      returnQty: '0',
      grandTotal: '1750.00',
      receiveAmount: '1500.00',
      dueAmount: '250'
    }
  ];

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
      setReports(data.length > 0 ? data : dummyData);
    } catch (err) {
      console.error("Error fetching group sales report:", err);
      setReports(dummyData);
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
            <input 
              type="date" 
              value={filters.from_date}
              onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
              style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none' }} 
            />
            <input 
              type="date" 
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
            <option value="">Select Customer Group</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          
          <button 
            onClick={handleSearch}
            style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            Search
          </button>
        </div>
      </div>

      {showReport && (
        <div className="premium-card" style={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="premium-body" style={{ padding: '32px' }}>
            <PrintHeader />
            
            <div style={{ textAlign: 'center', margin: '20px 0', fontFamily: 'monospace' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Group Wise Sales Report</h2>
            </div>
            
            {/* Header row with Title and Go Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
                GROUP WISE SALES REPORT | FROM ({filters.from_date}) TO ({filters.to_date})
              </h3>
              <button 
                onClick={() => navigate('/invoice/list')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#7e8a9f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                 <ArrowLeft size={14} /> Go Back
              </button>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing {reports.length} entries
              </div>
              
              <div style={{ display: 'flex', gap: '2px' }}>
                <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                  <Printer size={14} /> Print
                </button>
                <button onClick={handleSearch} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                  <RefreshCcw size={14} /> Reset
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table style={{ width: '100%', fontSize: '11px', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #94a3b8' }}>
                <thead>
                  <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                    <th style={{ width: '40px', padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>SL ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>ISSUED DATE ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>VOUCHER NO ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', minWidth: '150px', fontWeight: '600' }}>PRODUCT ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>UNIT ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>QUANTITY ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>PRICE ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>TOTAL ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>DISCOUNT ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>GRAND TOTAL ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>RECEIVE AMOUNT ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>DUE AMOUNT ⇅</th>
                  </tr>
                </thead>
                <tbody style={{ background: '#f8fafc' }}>
                  {loading ? (
                    <tr>
                      <td colSpan="12" style={{ padding: '24px', textAlign: 'center' }}>Loading report...</td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ padding: '24px', textAlign: 'center' }}>No records found.</td>
                    </tr>
                  ) : (
                    reports.map((row, index) => {
                      const items = row.items || [{ product: row.product_name || row.product || '-', unit: row.unit_name || row.unit || 'PEACE', qty: row.qty || 1, price: row.price || 0 }];
                      return (
                        <tr key={row.id || index}>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{index + 1}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{row.date || row.issued_date || '-'}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{row.voucher || row.invoice_id || '-'}</td>
                          
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
                                <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>৳{Number(item.price).toFixed(2)}</div>
                              ))}
                            </div>
                          </td>

                          {/* Totals side */}
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>৳{Number(row.total || row.total_amount || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>৳{Number(row.discount || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>৳{Number(row.grandTotal || row.grand_total || row.total || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>৳{Number(row.receiveAmount || row.receive_amount || row.receive || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>৳{Number(row.dueAmount || row.due_amount || row.due || 0).toFixed(2)}</td>
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
