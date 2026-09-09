import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Printer, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';

const LoanPaymentList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    fetchLoans();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await loanService.getLoanAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients for filter:", error);
      setClients([]);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedClient) filters.loan_account = selectedClient;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await loanService.getLoanPayments(filters).catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching loan payments:", error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedClient('');
    setFromDate('');
    setToDate('');
    fetchLoans();
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title - stylized */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Loan Payment List</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'normal', color: '#333' }}>Loan Payment List</h2>
        <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/loan/payment-create')} style={{ background: 'var(--success)', padding: '6px 12px', fontSize: '14px', borderRadius: '4px' }}>
            <Plus size={14} /> Add Loan Payment
          </button>
          <button className="btn btn-outline" style={{ background: 'white', border: '1px solid #e2e8f0', color: 'red', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '4px' }}>
            <span style={{ backgroundColor: 'red', color: 'white', borderRadius: '4px', padding: '0 4px', fontSize: '10px' }}>▶</span> <span style={{ color: 'black', fontWeight: 'bold' }}>YouTube</span>
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.3fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px', maxWidth: '840px', margin: '0 auto 24px auto' }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#334155', display: 'block' }}>{t('common.search_by_client')}</label>
            <select style={{ width: '100%', height: '44px', padding: '0 12px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '14px', outline: 'none', background: 'white', color: '#1e293b' }} value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
              <option value="">{t('common.select_client')}</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone || '-'})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#334155', display: 'block' }}>{t('common.search_by_date')}</label>
            <div style={{ display: 'flex', border: '1px solid #93c5fd', borderRadius: '6px', overflow: 'hidden', background: 'white', height: '44px', alignItems: 'center' }}>
              <input type="date" style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', color: '#1e293b', outline: 'none', height: '100%' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: '13px', color: '#1e293b', outline: 'none', height: '100%' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <button className="btn btn-outline" onClick={handleClearFilter} style={{ height: '44px', width: '100%', background: '#64748b', color: 'white', justifyContent: 'center', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '14px' }}>
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Show 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <option>100</option>
            </select>
            entries
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: '#4F46E5', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}>
              <Printer size={16} style={{ marginRight: '6px' }} /> Print
            </button>
            <button className="btn" onClick={handleClearFilter} style={{ background: '#4F46E5', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}>
              <RotateCcw size={16} style={{ marginRight: '6px' }} /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#a0aebf', color: 'white' }}>
                <th width="50" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>SL ↕</th>
                <th width="120" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>DATE</th>
                <th width="140" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>RECEIPT NO</th>
                <th width="200" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>CLIENT</th>
                <th width="150" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>TYPE</th>
                <th width="250" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>DESCRIPTION</th>
                <th width="120" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px' }}>AMOUNT</th>
                <th width="100" style={{ textAlign: 'center', padding: '12px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(loans) && loans.map((loan, index) => {
                const amt = Number(loan?.amount || 0);
                const displayAmt = isNaN(amt) ? '0.00' : amt.toFixed(2);
                const clientObj = typeof loan?.loan_account === 'object' ? loan.loan_account : null;
                const clientName = loan?.clientName || clientObj?.name || loan?.loan_account_name || '-';
                const clientPhone = loan?.clientNumber || clientObj?.phone || loan?.loan_account_phone || '-';
                const rawReceipt = String(loan.receiptNo || loan.receipt_no || loan.id || '-');
                const receiptDisplay = rawReceipt.length > 12 ? rawReceipt.slice(0, 8) + '...' : rawReceipt;

                return (
                  <tr key={loan.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{loan.date || loan.created_at?.split('T')[0] || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '12px' }} title={rawReceipt}>{receiptDisplay}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <div>Name: {clientName}</div>
                      <div>Number: {clientPhone}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{loan.type || 'Loan Payment'}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0' }}>{loan.description || loan.note || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{displayAmt} ৳</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }}>
                          <Edit size={14} />
                        </button>
                        <button className="action-btn-sm delete" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                </tr>
              )}
              {!loading && (!Array.isArray(loans) || loans.length === 0) && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No loans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanPaymentList;

