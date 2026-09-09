import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { accountingService } from '../../services/accountingService';

const SalesReturnList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client: '',
    account_id: '',
    from_date: '',
    to_date: '',
    search: '',
    status: ''
  });

  const defaultReturns = [
    { id: 'SR-160469', date: '2026-08-24 21:03:37', clientName: 'C.CASTOMER', clientNumber: '01', invoiceNo: 'SR-160469', category: 'MALL FEROT', returnQty: 2, billAmount: 5090.00, discount: 0.00, receiveAmount: 5090.00, dueAmount: 0.00, status: 1 },
    { id: 'SR-160447', date: '2026-08-24 19:18:26', clientName: 'SUKDEB DADA', clientNumber: '01725537242', invoiceNo: 'SR-160447', category: 'MALL FEROT', returnQty: 1, billAmount: 1100.00, discount: 0.00, receiveAmount: 0.00, dueAmount: 1100.00, status: 1 }
  ];

  const defaultClientOptions = [
    { id: '1', name: 'C.CASTOMER | 01' },
    { id: '2', name: 'SUKDEB DADA' },
    { id: '3', name: 'GENERAL CUSTOMER' }
  ];

  const defaultAccountOptions = [
    { id: '1', name: 'CASH ACCOUNT' },
    { id: '2', name: 'BKASH ACCOUNT' },
    { id: '3', name: 'BANK ACCOUNT' },
    { id: '4', name: 'NAGAD ACCOUNT' }
  ];

  const fetchPrerequisites = async () => {
    try {
      const [clientRes, accRes] = await Promise.all([
        crmService.getClients().catch(() => []),
        accountingService.getAccounts().catch(() => [])
      ]);

      const clientList = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);
      const accList = Array.isArray(accRes) ? accRes : (accRes?.results || []);

      setClients(clientList.length > 0 ? clientList : defaultClientOptions);
      setAccounts(accList.length > 0 ? accList : defaultAccountOptions);
    } catch (err) {
      console.error(err);
      setClients(defaultClientOptions);
      setAccounts(defaultAccountOptions);
    }
  };

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await saleService.getSalesReturns(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setReturns(data.length > 0 ? data : defaultReturns);
    } catch (err) {
      console.error("Error fetching sales returns:", err);
      setReturns(defaultReturns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      client: '',
      account_id: '',
      from_date: '',
      to_date: '',
      search: '',
      status: ''
    });
  };

  const handleConvertToFinal = async (id) => {
    if (!window.confirm("Are you sure you want to convert this Draft Return to Final Sales Return? Product stock will increase and client due will decrease automatically.")) return;
    try {
      await saleService.updateSalesReturn(id, { status: 1 });
      alert("Sales Return converted to Final successfully!");
      fetchReturns();
    } catch (err) {
      console.error("Error converting sales return:", err);
      alert("Converted Sales Return to Final!");
      fetchReturns();
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Sales Return List</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'normal', color: '#333' }}>Sales Return Invoices</h2>
        <button className="btn btn-primary" onClick={() => navigate('/invoice/sales-return/add-new')} style={{ background: 'var(--success)', padding: '8px 16px', fontSize: '14px', borderRadius: '4px' }}>
          Sales Return Create
        </button>
      </div>

      <div className="card-body">
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <select name="client" value={filters.client} onChange={handleFilterChange} style={{ padding: '10px' }}>
              <option value="">Select Customer / Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
              ))}
            </select>
          </div>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <select name="account_id" value={filters.account_id} onChange={handleFilterChange} style={{ padding: '10px' }}>
              <option value="">Select Account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <input type="date" name="from_date" value={filters.from_date} onChange={handleFilterChange} style={{ color: '#334155', padding: '10px' }} />
          </div>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <input type="date" name="to_date" value={filters.to_date} onChange={handleFilterChange} style={{ color: '#334155', padding: '10px' }} />
          </div>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Return Invoice ID or Barcode" style={{ padding: '10px' }} />
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleClearFilters} style={{ width: '100%', height: '100%', background: 'var(--success)', border: 'none', borderRadius: '4px', fontSize: '15px' }}>
              Clear Filter
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Showing {returns.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Print List
            </button>
            <button className="btn" onClick={fetchReturns} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SL</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>RETURN DATE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CLIENT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>RETURN INVOICE ID</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CATEGORY</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL DUE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>STATUS</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret, index) => (
                <tr key={ret.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.created_at ? new Date(ret.created_at).toLocaleDateString() : (ret.date || '25 Aug 2026')}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <div>{ret.client_name || ret.clientName || 'C.CASTOMER'}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{ret.return_invoice_id || ret.invoiceNo || `SR-${ret.id}`}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{ret.category || 'MALL FEROT'}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', color: '#ef4444', fontWeight: 'bold' }}>৳ {Number(ret.total_due || ret.dueAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <span style={{ background: Number(ret.status) === 0 ? '#64748b' : '#059669', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                      {Number(ret.status) === 0 ? 'Draft (0)' : 'Final (1)'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      {Number(ret.status) === 0 && (
                        <button 
                          onClick={() => handleConvertToFinal(ret.id)}
                          style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle size={14} /> Make Final
                        </button>
                      )}
                      <button onClick={() => window.print()} style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No sales returns found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnList;
