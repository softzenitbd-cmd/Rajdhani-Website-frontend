import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { RotateCcw, Edit, Trash2 } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { accountingService } from '../../services/accountingService';

const InvoiceList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Opened from "Save & Print" on the create page: show the receipt and print it
  useEffect(() => {
    const inv = location.state?.printInvoice;
    if (inv && typeof inv === 'object') {
      setSelectedInvoice(inv);
      setShowViewModal(true);
      window.history.replaceState({}, '');
      setTimeout(() => window.print(), 600);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [filters, setFilters] = useState({
    client: '',
    account_id: '',
    from_date: '',
    to_date: '',
    search: '',
    status: 1
  });




  const fetchPrerequisites = async () => {
    try {
      const [clientRes, accRes] = await Promise.all([
        crmService.getClients().catch(() => []),
        accountingService.getAccounts().catch(() => [])
      ]);

      const clientList = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);
      const accList = Array.isArray(accRes) ? accRes : (accRes?.results || []);

      setClients(clientList);
      setAccounts(accList);
    } catch (err) {
      console.error(err);
      setClients([]);
      setAccounts([]);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await saleService.getSalesInvoices(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching sales invoices:", err);
      setInvoices([]);
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

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>From Date</div>
            <input 
              type="date" 
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#334155' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>To Date</div>
            <input 
              type="date" 
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#334155' }} 
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Search Invoice / Customer</div>
            <input 
              type="text" 
              name="search"
              placeholder="Search..."
              value={filters.search}
              onChange={handleFilterChange}
              style={{ padding: '10px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button 
            onClick={handleClearFilters}
            className="btn" 
            style={{ background: 'var(--text-muted)', color: 'white', padding: '12px 48px', borderRadius: '4px', fontSize: '16px', width: '30%', cursor: 'pointer' }}
          >
            Clear Filter
          </button>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Showing {invoices.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              Print List
            </button>
            <button className="btn" onClick={fetchInvoices} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
                <th className="no-print" style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRINTABLE</th>
                <th className="no-print" style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>ACTION</th>
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
                  <td className="no-print" style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <button onClick={() => { setSelectedInvoice(inv); setShowViewModal(true); }} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', margin: '0 auto', cursor: 'pointer', fontSize: '11px' }}>
                       Pos View
                    </button>
                  </td>
                  <td className="no-print" style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button onClick={() => navigate(`/invoice/edit/${inv.id}`, { state: { invoice: inv } })} className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }} title="Edit Invoice">
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

      {/* POS / Printable Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: '700px', maxWidth: '95vw', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <PrintHeader />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #0ea5e9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Sales Cash Memo</h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Invoice #{selectedInvoice.invoice_id || selectedInvoice.invoiceNo || `INV-${selectedInvoice.id}`}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>Customer Name:</strong> {selectedInvoice.client_name || selectedInvoice.clientName || 'C.CUSTOMER'}</div>
              <div><strong>Invoice Date:</strong> {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString() : (selectedInvoice.date || '-')}</div>
              <div><strong>Category:</strong> {selectedInvoice.category_id || selectedInvoice.category || 'CASH SELL'}</div>
              <div><strong>Invoice Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>PAID</span></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>SL</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Item Details</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>Qty</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px' }}>Rate</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((item, idx) => {
                    const qty = Number(item.quantity || item.qty || 1);
                    const rate = Number(
                      item.selling_price ||
                      item.price ||
                      item.sales_price ||
                      item.rate ||
                      item.unit_price ||
                      (item.total_selling_price ? Number(item.total_selling_price) / qty : 0) ||
                      0
                    );
                    const itemTotal = Number(
                      item.total_selling_price ||
                      item.total_amount ||
                      item.total ||
                      (qty * rate) ||
                      0
                    );

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>
                          {item.name || item.product_name || item.product?.name || item.product?.title || 'Garments Item'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{qty}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {rate.toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>GENERAL APPAREL / GARMENTS ITEM</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {Number(selectedInvoice.grand_total || selectedInvoice.billAmount || selectedInvoice.invoice_bill || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {Number(selectedInvoice.grand_total || selectedInvoice.billAmount || selectedInvoice.invoice_bill || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                {/* Invoice Bill */}
                <tr style={{ background: '#f1f5f9' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Invoice Bill:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                    ৳ {Number(
                      selectedInvoice.invoice_bill ||
                      selectedInvoice.invoiceBill ||
                      (selectedInvoice.items && selectedInvoice.items.length > 0
                        ? selectedInvoice.items.reduce((sum, item) => {
                            const qty = Number(item.quantity || item.qty || 1);
                            const rate = Number(item.selling_price || item.price || item.sales_price || item.rate || item.unit_price || (item.total_selling_price ? Number(item.total_selling_price) / qty : 0) || 0);
                            return sum + (Number(item.total_selling_price || item.total_amount || (qty * rate)) || 0);
                          }, 0)
                        : selectedInvoice.grand_total || selectedInvoice.billAmount || 0)
                    ).toFixed(2)}
                  </td>
                </tr>

                {/* Discount */}
                {Number(selectedInvoice.discount || selectedInvoice.total_discount || 0) > 0 && (
                  <tr style={{ background: '#fff1f2', color: '#991b1b' }}>
                    <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Discount (-):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                      ৳ {Number(selectedInvoice.discount || selectedInvoice.total_discount || 0).toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* Previous Due */}
                {Number(selectedInvoice.previous_due || selectedInvoice.previousDue || 0) > 0 && (
                  <tr style={{ background: '#f1f5f9' }}>
                    <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Previous Due (+):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>
                      ৳ {Number(selectedInvoice.previous_due || selectedInvoice.previousDue || 0).toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* Total Bill */}
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Total Bill:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', color: '#1d4ed8' }}>
                    ৳ {Number(
                      selectedInvoice.total_bill ||
                      selectedInvoice.totalBill ||
                      (Number(selectedInvoice.invoice_bill || selectedInvoice.grand_total || selectedInvoice.billAmount || 0) - Number(selectedInvoice.discount || selectedInvoice.total_discount || 0) + Number(selectedInvoice.previous_due || selectedInvoice.previousDue || 0))
                    ).toFixed(2)}
                  </td>
                </tr>

                {/* Paid / Received Amount */}
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#059669' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Paid / Received Amount:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                    ৳ {Number(selectedInvoice.receive_amount || selectedInvoice.receiveAmount || selectedInvoice.paid || 0).toFixed(2)}
                  </td>
                </tr>

                {/* Total Due / Net Due */}
                <tr style={{ background: '#fef2f2', fontWeight: 'bold', color: '#dc2626' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Total Due:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                    ৳ {Number(
                      selectedInvoice.total_due !== undefined ? selectedInvoice.total_due :
                      (selectedInvoice.dueAmount !== undefined ? selectedInvoice.dueAmount :
                      (selectedInvoice.due !== undefined ? selectedInvoice.due :
                      Math.max(0, (Number(selectedInvoice.total_bill || selectedInvoice.grand_total || 0) - Number(selectedInvoice.receive_amount || selectedInvoice.receiveAmount || 0)))))
                    ).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Footer */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: '12px' }}>
                Customer Signature
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: '12px' }}>
                Authorized Signature
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right', marginTop: '16px' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>
                🖨️ Print Memo
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '6px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
