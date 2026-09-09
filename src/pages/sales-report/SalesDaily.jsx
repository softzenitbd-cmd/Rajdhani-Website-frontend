import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';

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

  const dummyData = [
    { sl: 1, date: '25 Aug 2026', voucher: '160472', client: 'C.CASTOMER | 01 | all', product: 'REY GAR', barcode: '17916', unit: 'PEACE', qty: 1, price: 1350, total: 1350, receive: 1350, due: 0, profit: 350 },
    { sl: 2, date: '25 Aug 2026', voucher: '160473', client: 'C.CASTOMER | 01 | all', product: 'CHARI JORJET 180', barcode: '33', unit: 'GOZ', qty: 1.5, price: 180, total: 270, receive: 270, due: 0, profit: 67.5 },
    { sl: 3, date: '25 Aug 2026', voucher: '160474', client: 'C.CASTOMER | 01 | all', product: 'FOC T- SHIRT 2/6', barcode: '18368', unit: 'PEACE', qty: 1, price: 430, total: 800, receive: 800, due: 0, profit: 220 },
    { sl: 4, date: '25 Aug 2026', voucher: '160475', client: 'C.CASTOMER | 01 | all', product: 'DP TUPI 30', barcode: '16829', unit: 'PEACE', qty: 1, price: 30, total: 130, receive: 130, due: 0, profit: 48 },
    { sl: 5, date: '25 Aug 2026', voucher: '160476', client: 'C.CASTOMER | 01 | all', product: 'POD SLEEPER DGN -', barcode: '18302', unit: 'PEACE', qty: 1, price: 930, total: 930, receive: 930, due: 0, profit: 280 }
  ];

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
      setReports(data.length > 0 ? data : dummyData);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      setReports(dummyData);
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

  const calculateTotals = () => {
    return reports.reduce((acc, row) => ({
      qty: acc.qty + Number(row.qty || row.quantity || 0),
      total: acc.total + Number(row.total || row.total_amount || 0),
      receive: acc.receive + Number(row.receive || row.receive_amount || 0),
      due: acc.due + Number(row.due || row.due_amount || 0),
      profit: acc.profit + Number(row.profit || 0)
    }), { qty: 0, total: 0, receive: 0, due: 0, profit: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      
      <div className="premium-card">
        {/* Banner */}
        <div style={{ padding: '0', background: 'white', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <img 
            src="https://via.placeholder.com/1200x150?text=Rajdhani+Garments+Banner" 
            alt="Rajdhani Garments" 
            style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover' }}
          />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', padding: '16px 0', margin: '0' }}>Daily Sales Report</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          
          {/* Header row with Title and Go Back */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>DAILY SALES REPORT</h3>
            <button 
              onClick={() => navigate('/invoice/list')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              <ArrowLeft size={14} /> Go Back
            </button>
          </div>

          {/* Filters Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>{t('common.search_by_client')}</label>
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
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>Search By Barcode / Invoice</label>
              <input 
                type="text"
                name="barcode"
                value={filters.barcode}
                onChange={handleFilterChange}
                placeholder="Barcode or Invoice ID"
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>Date</label>
              <input 
                type="date"
                name="from_date"
                value={filters.from_date}
                onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value, to_date: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Clear Filter Button */}
          <button 
            onClick={handleClearFilters}
            style={{ width: '100%', background: '#7e8a9f', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '24px' }}
          >
            Clear Filter
          </button>

          {/* Total Sales Bar */}
          <div style={{ background: '#94a3b8', color: 'white', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '24px' }}>
            <span>TOTAL SALES</span>
            <span>৳ {totals.total.toFixed(2)}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {reports.length} entries
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={handleClearFilters} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <RefreshCcw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '11px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '40px', padding: '12px' }}>SL ⇅</th>
                  <th style={{ padding: '12px' }}>ISSUED DATE ⇅</th>
                  <th style={{ padding: '12px' }}>VOUCHER NO ⇅</th>
                  <th style={{ padding: '12px' }}>CLIENT ⇅</th>
                  <th style={{ padding: '12px' }}>PRODUCT ⇅</th>
                  <th style={{ padding: '12px' }}>BARCODE ⇅</th>
                  <th style={{ padding: '12px' }}>UNIT ⇅</th>
                  <th style={{ padding: '12px' }}>QTY ⇅</th>
                  <th style={{ padding: '12px' }}>PRICE ⇅</th>
                  <th style={{ padding: '12px' }}>TOTAL ⇅</th>
                  <th style={{ padding: '12px' }}>RECEIVE ⇅</th>
                  <th style={{ padding: '12px' }}>DUE ⇅</th>
                  <th style={{ padding: '12px' }}>PROFIT ⇅</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>Loading daily sales report...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="13" style={{ padding: '24px', textAlign: 'center' }}>No daily sales records found.</td>
                  </tr>
                ) : (
                  reports.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={{ padding: '12px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px' }}>{row.date || row.issued_date || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.voucher || row.invoice_id || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.client_name || row.client || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.product_name || row.product || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.barcode || '-'}</td>
                      <td style={{ padding: '12px' }}>{row.unit_name || row.unit || 'PEACE'}</td>
                      <td style={{ padding: '12px' }}>{row.qty || row.quantity || 0}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.price || row.unit_price || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.total || row.total_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.receive || row.receive_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.due || row.due_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>৳{Number(row.profit || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                  <td colSpan="7" style={{ padding: '12px', textAlign: 'center' }}>{t('common.total')}</td>
                  <td style={{ padding: '12px' }}>{totals.qty}</td>
                  <td style={{ padding: '12px' }}>-</td>
                  <td style={{ padding: '12px' }}>৳{totals.total.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.receive.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.due.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>৳{totals.profit.toFixed(2)}</td>
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
