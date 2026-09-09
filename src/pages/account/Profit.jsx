import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Play, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';

const Profit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [profitData, setProfitData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchProfit = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getProfit(filters).catch(() => ({}));
      const data = (res && typeof res === 'object') ? res : {};
      setProfitData(data);
    } catch (error) {
      console.error('Error fetching profit report:', error);
      setProfitData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfit();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfit();
  };

  return (
    <div className="premium-card">
      <div className="premium-header">
        <div>
          <h2 className="premium-title" style={{ textTransform: 'uppercase', margin: 0 }}>Profit & Loss Ledger</h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Live calculation based on sales, purchases, receives & expenses</span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate(-1)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Go Back</button>
          <button className="btn-youtube">
            <div style={{ display: 'flex', alignItems: 'center', background: '#ff0000', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              <Play size={16} fill="white" style={{ marginRight: '6px' }} /> YouTube
            </div>
          </button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '32px' }}>
        <PrintHeader />
        
        {/* Centered Date Search */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '640px' }}>
            <label className="filter-label" style={{ display: 'block', marginBottom: '8px', textAlign: 'center', fontWeight: 'bold' }}>{t('common.search_by_date')}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flex: 1 }}>
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-outline" 
                  style={{ borderRadius: '8px 0 0 8px', borderRight: 'none', width: '50%', padding: '10px' }} 
                />
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-outline" 
                  style={{ borderRadius: '0 8px 8px 0', width: '50%', padding: '10px' }} 
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ padding: '0 28px', fontSize: '15px', fontWeight: 'bold' }}>Search</button>
              <button type="button" onClick={() => { setFromDate(''); setToDate(''); setTimeout(fetchProfit, 50); }} className="btn-secondary" style={{ padding: '0 16px', background: '#94a3b8' }}>Reset</button>
            </div>
          </form>
        </div>

        {/* Center the table and print button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '680px' }}>
            {/* Table Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {loading ? 'Recalculating...' : 'Formulas: Product Profit = Sales - Cost | Net Profit = Product Profit - Expenses'}
              </span>
              <button className="btn-blue" style={{ background: '#06b6d4', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderColor: '#06b6d4' }} onClick={() => window.print()}>
                <Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Print Profit Statement
              </button>
            </div>

            <table className="custom-table" style={{ border: '1px solid #cbd5e1', width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: '18px', background: '#334155', color: 'white', borderRight: '1px solid #cbd5e1', width: '55%' }}>FINANCIAL METRIC</th>
                  <th style={{ textAlign: 'right', paddingRight: '18px', background: '#334155', color: 'white', width: '45%' }}>CALCULATED AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(profitData || {}).map(([key, val], idx) => {
                  const isHighlight = key.includes('Profit') || key === 'Total Balance';
                  const isNegative = String(val).includes('-');
                  return (
                    <tr key={key} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ textAlign: 'left', padding: '12px 18px', borderRight: '1px solid #e2e8f0', fontWeight: isHighlight ? 'bold' : '500', color: isHighlight ? 'var(--text-main)' : '#334155' }}>
                        {key}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '12px 18px', 
                        fontWeight: 'bold', 
                        fontSize: isHighlight ? '15px' : '14px',
                        color: isNegative ? '#dc2626' : (isHighlight ? '#059669' : '#0f172a') 
                      }}>
                        {typeof val === 'number' ? `৳ ${val.toLocaleString()}` : val}
                      </td>
                    </tr>
                  );
                })}
                {loading && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading profit data...</td>
                  </tr>
                )}
                {!loading && Object.keys(profitData || {}).length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No profit records found for the selected period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profit;
