import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RefreshCcw } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';

const SalesCustomerWise = () => {
  const { t } = useTranslation();
  const [showReport, setShowReport] = useState(true);

  const [clients, setClients] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    client_id: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
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
      dueAmount: '250.00'
    }
  ];

  const fetchClients = async () => {
    try {
      const res = await crmService.getClients().catch(() => []);
      setClients(Array.isArray(res) ? res : (res?.results || []));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const res = await saleService.getSalesReport(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setReports(data.length > 0 ? data : dummyData);
      setShowReport(true);
    } catch (err) {
      console.error("Error fetching customer sales report:", err);
      setReports(dummyData);
      setShowReport(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    handleSearch();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      
      {/* Top Filter Pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', position: 'relative', zIndex: 1, marginTop: '24px' }}>
        <form onSubmit={handleSearch} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', alignItems: 'center', width: '80%', maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', flex: 1, gap: '0', position: 'relative' }}>
            <input 
              type="date" 
              name="from_date"
              value={filters.from_date}
              onChange={handleChange}
              style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none' }} 
            />
            <input 
              type="date" 
              name="to_date"
              value={filters.to_date}
              onChange={handleChange}
              style={{ width: '50%', padding: '12px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRadius: '0 4px 4px 0', outline: 'none' }} 
            />
          </div>
          
          <select name="client_id" value={filters.client_id} onChange={handleChange} style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
            <option value="">Select Customer</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
            ))}
          </select>
          
          <button type="submit" style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {showReport && (
        <div className="premium-card" style={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="premium-body" style={{ padding: '32px' }}>
            <PrintHeader />
            
            <div style={{ textAlign: 'center', margin: '20px 0', fontFamily: 'monospace' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Customer Wise Sales Report | (MOSHER CACA)</h2>
            </div>
            
            {/* Header row with Title and Go Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
                CUSTOMER WISE SALES REPORT | (MOSHER CACA) | FROM (01/7/2026) TO (31/08/2026)
              </h3>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#7e8a9f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                 Go Back
              </button>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Show 
                <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }}>
                  <option>100</option>
                </select> 
                entries
              </div>
              
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                  <Printer size={14} /> Print
                </button>
                <button style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Excel</button>
                <button style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>CSV</button>
                <button style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>PDF</button>
                <button style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
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
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>TRANSPORT FARE ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>RETURN QUANTITY ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>GRAND TOTAL ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>RECEIVE AMOUNT ⇅</th>
                    <th style={{ padding: '10px', border: '1px solid #94a3b8', fontWeight: '600' }}>DUE AMOUNT ⇅</th>
                  </tr>
                </thead>
                <tbody style={{ background: '#f8fafc' }}>
                  {dummyData.map((row) => (
                    <tr key={row.sl}>
                      <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{row.sl}</td>
                      <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{row.date}</td>
                      <td style={{ padding: '8px', border: '1px solid #94a3b8', verticalAlign: 'middle', background: 'white' }}>{row.voucher}</td>
                      
                      {/* Nested columns for items */}
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {row.items.map((item, idx) => (
                            <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.product}</div>
                          ))}
                          <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>Total</div>
                        </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {row.items.map((item, idx) => (
                            <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.unit}</div>
                          ))}
                          <div style={{ padding: '6px', minHeight: '26px' }}>&nbsp;</div>
                        </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {row.items.map((item, idx) => (
                            <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.qty}</div>
                          ))}
                          <div style={{ padding: '6px', minHeight: '26px' }}>&nbsp;</div>
                        </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {row.items.map((item, idx) => (
                            <div key={idx} style={{ padding: '6px', borderBottom: '1px solid #94a3b8', flex: 1, minHeight: '26px' }}>{item.price}</div>
                          ))}
                          <div style={{ padding: '6px', minHeight: '26px' }}>&nbsp;</div>
                        </div>
                      </td>

                      {/* Totals side */}
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.total}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{row.total}</div>
                         </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.discount}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{row.discount}</div>
                         </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.transport}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{row.transport}</div>
                         </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.returnQty}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>&nbsp;</div>
                         </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.grandTotal}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{row.grandTotal.replace('.00', '')}</div>
                         </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.receiveAmount}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{row.receiveAmount.replace('.00', '')}</div>
                         </div>
                      </td>
                      <td style={{ padding: 0, border: '1px solid #94a3b8', verticalAlign: 'top', background: 'white' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                           <div style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>{row.dueAmount}</div>
                           {Array(row.items.length - 1).fill().map((_, i) => <div key={i} style={{ padding: '6px', borderBottom: '1px solid transparent', flex: 1, minHeight: '26px' }}>&nbsp;</div>)}
                           <div style={{ padding: '6px', fontWeight: 'bold', minHeight: '26px' }}>{row.dueAmount}</div>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing 1 to 1 of 1 entries
              </div>
              <div style={{ display: 'flex' }}>
                <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', borderRadius: '4px 0 0 4px', cursor: 'pointer', fontSize: '12px' }}>Previous</button>
                <button style={{ padding: '6px 12px', border: '1px solid #3b82f6', borderLeft: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '12px' }}>1</button>
                <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderLeft: 'none', background: '#f1f5f9', color: '#000', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontSize: '12px' }}>Next</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SalesCustomerWise;
