import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RefreshCcw, Printer, Download } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../api/endpoints';

const DueSupplierWise = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { get } = useApi();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.CRM_REPORT_SUPPLIER_DUE);
      setData(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotalDue = () => {
    return data.reduce((sum, item) => sum + (parseFloat(item.due) || 0), 0).toFixed(2);
  };

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
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', padding: '16px 0', margin: '0' }}>Supplier Due Report</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
        <PrintHeader />
          
          {/* Filters Area */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '300px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>Search By Supplier</label>
              <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }}>
                <option value="">Select Supplier</option>
                {data.map(item => (
                  <option key={item.supplier_id} value={item.supplier_id}>{item.supplier_name}</option>
                ))}
              </select>
            </div>
            
            <button style={{ background: '#7e8a9f', color: 'white', padding: '10px 32px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', height: '42px', minWidth: '150px' }}>
              Clear Filter
            </button>
          </div>

          {/* Total Due Bar */}
          <div style={{ textAlign: 'center', marginBottom: '24px', border: '1px solid #94a3b8' }}>
            <div style={{ background: '#94a3b8', color: 'white', padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>TOTAL DUE</div>
            <div style={{ padding: '12px', fontSize: '18px', fontWeight: 'bold' }}>{calculateTotalDue()}</div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Show 
              <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }}>
                <option>All</option>
              </select> 
              entries
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <Download size={14} /> Download
              </button>
              <button style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={fetchData} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>SUPPLIER INFO</th>
                  <th style={{ padding: '12px' }}>GROUP</th>
                  <th style={{ padding: '12px' }}>PURCHASE</th>
                  <th style={{ padding: '12px' }}>PAYMENT</th>
                  <th style={{ padding: '12px' }}>RETURN</th>
                  <th style={{ padding: '12px' }}>DUE</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center' }}>Loading...</td>
                  </tr>
                )}
                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center' }}>No records found</td>
                  </tr>
                )}
                {!loading && data.map((row, index) => (
                  <tr key={row.supplier_id || index}>
                    <td style={{ padding: '12px' }}>{index + 1}</td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold' }}>Name : <span style={{ fontWeight: 'normal' }}>{row.supplier_name}</span></div>
                      <div><b>Address :</b> {row.address || '-'}</div>
                      <div><b>Phone :</b> {row.phone || '-'}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{row.group_name || '-'}</td>
                    <td style={{ padding: '12px' }}>{parseFloat(row.purchase_amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>{parseFloat(row.payment || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>{parseFloat(row.return_amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{parseFloat(row.due || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default DueSupplierWise;
