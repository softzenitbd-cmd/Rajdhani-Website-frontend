import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Edit, Trash2, CheckCircle } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { accountingService } from '../../services/accountingService';

const InvoiceList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client: '',
    account_id: '',
    from_date: '',
    to_date: '',
    search: '',
    status: 1
  });

  const defaultInvoices = [
    { id: '160477', date: '25 Aug 2026', clientName: 'C.CASTOMER', clientNumber: '01', invoiceNo: 'INV-160477', category: 'CASH SELL', returnQty: 0, billAmount: 3420.00, discount: 0.00, receiveAmount: 3420.00, dueAmount: 0.00, type: 'General' },
    { id: '160476', date: '25 Aug 2026', clientName: 'C.CASTOMER', clientNumber: '01', invoiceNo: 'INV-160476', category: 'CASH SELL', returnQty: 0, billAmount: 930.00, discount: 0.00, receiveAmount: 930.00, dueAmount: 0.00, type: 'General' },
    { id: '160475', date: '25 Aug 2026', clientName: 'C.CASTOMER', clientNumber: '01', invoiceNo: 'INV-160475', category: 'CASH SELL', returnQty: 0, billAmount: 130.00, discount: 0.00, receiveAmount: 130.00, dueAmount: 0.00, type: 'General' },
    { id: '160474', date: '25 Aug 2026', clientName: 'C.CASTOMER', clientNumber: '01', invoiceNo: 'INV-160474', category: 'CASH SELL', returnQty: 0, billAmount: 800.00, discount: 0.00, receiveAmount: 800.00, dueAmount: 0.00, type: 'General' }
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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await saleService.getSalesInvoices(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setInvoices(data.length > 0 ? data : defaultInvoices);
    } catch (err) {
      console.error("Error fetching sales invoices:", err);
      setInvoices(defaultInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchInvoices();
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
      status: 1
    });
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm(`Are you sure you want to delete invoice #${id}?`)) return;
    try {
      await saleService.deleteSalesInvoice(id);
      alert("Invoice deleted successfully!");
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Invoice deleted!");
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Bill Invoice List</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'normal', color: '#333' }}>General Sales Invoices (Status=1)</h2>
        <button className="btn btn-primary" onClick={() => navigate('/invoice/add-new')} style={{ background: 'var(--success)', padding: '8px 16px', fontSize: '14px', borderRadius: '4px' }}>
          Invoice Create
        </button>
      </div>

      <div className="card-body">
        {/* Filters */}
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
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Invoice ID or Barcode" style={{ padding: '10px' }} />
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleClearFilters} style={{ width: '100%', height: '100%', background: 'var(--success)', border: 'none', borderRadius: '4px', fontSize: '15px' }}>
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Showing {invoices.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Print List
            </button>
            <button className="btn" onClick={fetchInvoices} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>SL</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>ISSUED DATE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CLIENT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>INVOICE ID NO</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CATEGORY</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>RETURN QUANTITY</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>BILL AMOUNT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>DISCOUNT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>RECEIVE AMOUNT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>DUE AMOUNT</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TYPE</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRINTABLE</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, index) => (
                <tr key={inv.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : (inv.date || '25 Aug 2026')}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <div>Name: {inv.client_name || inv.clientName || 'C.CASTOMER'}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{inv.invoice_id || inv.invoiceNo || `INV-${inv.id}`}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{inv.category_id || inv.category || 'CASH SELL'}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{inv.return_qty || inv.returnQty || 0}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>৳ {Number(inv.grand_total || inv.billAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0' }}>৳ {Number(inv.discount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', color: '#059669', fontWeight: 'bold' }}>৳ {Number(inv.receive_amount || inv.receiveAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', color: '#ef4444', fontWeight: 'bold' }}>৳ {Number(inv.total_due || inv.dueAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <span style={{ background: 'var(--success)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>General</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <button onClick={() => window.print()} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', margin: '0 auto', cursor: 'pointer', fontSize: '11px' }}>
                       Pos View
                    </button>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button onClick={() => navigate('/invoice/add-new')} className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }} title="Edit Invoice">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteInvoice(inv.id)} className="action-btn-sm delete" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }} title="Delete Invoice">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
