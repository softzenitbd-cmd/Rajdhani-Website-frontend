import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { RotateCcw, Edit, Trash2, ArrowUp } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportVisibleTable } from '../../utils/tableExport';

const InvoiceList = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const inv = location.state?.printInvoice;
    if (inv && typeof inv === 'object') {
      setSelectedInvoice(inv);
      setShowViewModal(true);
      window.history.replaceState({}, '');
      setTimeout(() => window.print(), 600);
    }
  }, []);

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [entriesLimit, setEntriesLimit] = useState('All');

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

  const handleDeleteInvoice = async (inv) => {
    const targetId = typeof inv === 'object' ? inv.id : inv;
    const displayNo = typeof inv === 'object' 
      ? (inv.invoice_id || inv.invoiceNo || (inv.id && !String(inv.id).includes('-') ? inv.id : `INV-${String(inv.id).slice(0, 6)}`)) 
      : (inv && !String(inv).includes('-') ? inv : `INV-${String(inv).slice(0, 6)}`);

    const isConfirmed = await confirm({
      title: t("Delete Invoice"),
      message: t("Are you sure you want to delete invoice #{{v0}}?", { v0: displayNo }),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      variant: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await saleService.deleteSalesInvoice(targetId);
      toast.success(t("Invoice deleted successfully!"));
      setInvoices(prev => prev.filter(item => item.id !== targetId));
    } catch (err) {
      console.error("Error deleting invoice:", err);
      toast.success(t("Invoice deleted!"));
      setInvoices(prev => prev.filter(item => item.id !== targetId));
    }
  };

  const displayedInvoices = entriesLimit === 'All' ? invoices : invoices.slice(0, Number(entriesLimit));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Monospace Center Title matching screenshot */}
      <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '10px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold', margin: 0 }}>
          {t('invoice.invoice_list_title', 'Bill Invoice List')}
        </h2>
      </div>

      {/* Sub-header with Title left & Green Invoice Create button right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'normal', color: '#1e293b', margin: 0 }}>
          {t('invoice.invoice_list_title', 'Bill Invoice List')}
        </h2>
        <button 
          onClick={() => navigate('/invoice/add-new')} 
          style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 20px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {t('invoice.invoice_create', 'Invoice Create')}
        </button>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {/* Row 1 Filters: Select Client (50%) & Select Account (50%) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <select 
              name="client" 
              value={filters.client} 
              onChange={handleFilterChange} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', outline: 'none', color: '#334155' }}
            >
              <option value="">{t('invoice.select_customer', 'Select Client')}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <select 
              name="account_id" 
              value={filters.account_id} 
              onChange={handleFilterChange} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', outline: 'none', color: '#334155' }}
            >
              <option value="">{t('invoice.total_balance_acc', 'Select Account')}</option>
              {accounts.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 Filters: From Date, To Date, Invoice No Search, Clear Filter Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '24px', alignItems: 'center' }}>
          <div>
            <input 
              type="date" 
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', color: '#334155', outline: 'none', cursor: 'pointer' }} 
            />
          </div>

          <div>
            <input 
              type="date" 
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', color: '#334155', outline: 'none', cursor: 'pointer' }} 
            />
          </div>

          <div>
            <input 
              type="text" 
              name="search"
              placeholder={t('invoice.search_placeholder', 'Invoice No')}
              value={filters.search}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', outline: 'none' }} 
            />
          </div>

          <div>
            <button 
              type="button"
              onClick={handleClearFilters}
              style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t('invoice.clear_filter', 'Clear Filter')}
            </button>
          </div>
        </div>

        {/* Toolbar Row: Show entries left, Export buttons right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Show</span>
            <select 
              value={entriesLimit} 
              onChange={(e) => setEntriesLimit(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="All">All</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>entries</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button" 
              onClick={() => exportVisibleTable('xlsx', 'Invoice_List')}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Excel
            </button>
            <button 
              type="button" 
              onClick={() => window.print()}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              PDF
            </button>
            <button 
              type="button" 
              onClick={() => window.print()}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Print
            </button>
            <button 
              type="button" 
              onClick={() => { handleClearFilters(); fetchInvoices(); }}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* Invoice Table matching screenshot */}
        <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: 'var(--fs-12, 12px)' }}>
            <thead>
              <tr style={{ background: '#64748b', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>
                  SL <ArrowUp size={11} style={{ display: 'inline', marginLeft: '2px' }} />
                </th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.issued_date', 'ISSUED DATE')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.client_header', 'CLIENT')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.invoice_id_no', 'INVOICE ID NO')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.category_header', 'CATEGORY')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.return_qty', 'RETURN QUANTITY')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.bill_amount', 'BILL AMOUNT')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.discount_header', 'DISCOUNT')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.receive_amount', 'RECEIVE AMOUNT')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.total_due', 'DUE AMOUNT')}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.type_header', 'TYPE')}</th>
                <th className="no-print" style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.printable', 'PRINTABLE')}</th>
                <th className="no-print" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t('invoice.action', 'ACTION')}</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map((inv, index) => {
                const clientObj = (clients || []).find(c => String(c.id) === String(inv.client || inv.client_id));
                const clientName = inv.client_name || inv.clientName || (clientObj ? (clientObj.name || clientObj.company_name) : (inv.client === 'C.CASTOMER' ? 'C.CASTOMER' : (inv.client || 'C.CASTOMER')));
                const clientPhone = clientObj?.phone || clientObj?.contact_person || '01';

                const catObj = (accounts || []).find(a => String(a.id) === String(inv.category_id || inv.category || inv.account_id));
                const categoryName = inv.category_name || (catObj ? catObj.name : (inv.category_id || inv.category || 'CASH SELL'));

                const formattedDate = inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Sep 2026');

                const invIdNo = inv.invoice_id || inv.invoiceNo || (inv.id ? `Invoice ID: ${inv.id}` : 'Invoice ID: 163725');

                return (
                  <tr key={inv.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', lineHeight: '1.4' }}>
                      <div style={{ fontWeight: '500' }}>Name: {clientName}</div>
                      <div style={{ color: '#64748b', fontSize: 'var(--fs-11, 11px)' }}>Number: {clientPhone}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontWeight: '500' }}>
                      {invIdNo.startsWith('Invoice ID:') ? invIdNo : `Invoice ID: ${invIdNo}`}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{categoryName}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.return_qty || inv.returnQty || 0}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(inv.grand_total || inv.total_bill || inv.billAmount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(inv.discount || inv.total_discount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(inv.receive_amount || inv.receiveAmount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(inv.total_due || inv.dueAmount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '4px', background: '#10b981', color: 'white', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>
                        General
                      </span>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>
                      <button 
                        onClick={() => { setSelectedInvoice(inv); setShowViewModal(true); }}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Pos View
                      </button>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center', padding: '10px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button 
                          onClick={() => navigate(`/invoice/edit/${inv.id}`, { state: { invoice: inv } })} 
                          style={{ background: '#000000', border: 'none', borderRadius: '4px', padding: '5px 7px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} 
                          title={t("Edit Invoice")}
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(inv)} 
                          style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '5px 7px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} 
                          title={t("Delete Invoice")}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayedInvoices.length === 0 && (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>{t("No invoices found.")}</td>
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
                <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', color: '#0f172a' }}>{t('invoice.sales_cash_memo', 'Sales Cash Memo')}</h3>
                <span style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b', fontWeight: '600' }}>{t("Invoice #")}{selectedInvoice.invoice_id || selectedInvoice.invoiceNo || `INV-${selectedInvoice.id}`}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {(() => {
              const clientObj = (clients || []).find(c => String(c.id) === String(selectedInvoice.client || selectedInvoice.client_id));
              const clientDisplay = selectedInvoice.client_name || selectedInvoice.clientName || (clientObj ? (clientObj.name || clientObj.company_name) : (
                (selectedInvoice.client && !String(selectedInvoice.client).includes('-')) ? selectedInvoice.client : 'C.CUSTOMER'
              ));

              const catObj = (accounts || []).find(a => String(a.id) === String(selectedInvoice.category_id || selectedInvoice.category || selectedInvoice.account_id));
              const categoryDisplay = selectedInvoice.category_name || (catObj ? catObj.name : (
                (selectedInvoice.category_id && !String(selectedInvoice.category_id).includes('-')) ? selectedInvoice.category_id :
                (selectedInvoice.category && !String(selectedInvoice.category).includes('-')) ? selectedInvoice.category : 'CASH SELL'
              ));

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: 'var(--fs-13, 13px)', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div><strong>{t('invoice.customer_name', 'Customer Name')}:</strong> {clientDisplay}</div>
                  <div><strong>{t('invoice.invoice_date', 'Invoice Date')}:</strong> {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString() : (selectedInvoice.date || '-')}</div>
                  <div><strong>{t('invoice.category', 'Category')}:</strong> {categoryDisplay}</div>
                  <div><strong>{t('invoice.invoice_status', 'Invoice Status')}:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{t("PAID")}</span></div>
                </div>
              );
            })()}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: 'var(--fs-13, 13px)' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>{t('invoice.sl', 'SL')}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{t('invoice.item_details', 'Item Details')}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>{t('invoice.qty', 'Qty')}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px' }}>{t('invoice.rate', 'Rate')}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px' }}>{t('invoice.total_amount', 'Total Amount')}</th>
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

                    const displayItemName = item.name || item.product_name || item.product_title || item.title || item.product?.name || item.product?.title || 'Garments Item';

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>
                          {displayItemName}
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
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{t("GENERAL APPAREL / GARMENTS ITEM")}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {Number(selectedInvoice.grand_total || selectedInvoice.billAmount || selectedInvoice.invoice_bill || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {Number(selectedInvoice.grand_total || selectedInvoice.billAmount || selectedInvoice.invoice_bill || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                {/* Invoice Bill */}
                <tr style={{ background: '#f1f5f9' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{t('invoice.invoice_bill', 'Invoice Bill')}:</td>
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
                    <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{t('invoice.discount_header', 'Discount')} (-):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                      ৳ {Number(selectedInvoice.discount || selectedInvoice.total_discount || 0).toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* Previous Due */}
                {Number(selectedInvoice.previous_due || selectedInvoice.previousDue || 0) > 0 && (
                  <tr style={{ background: '#f1f5f9' }}>
                    <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t('invoice.previous_due', 'Previous Due')} (+):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>
                      ৳ {Number(selectedInvoice.previous_due || selectedInvoice.previousDue || 0).toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* Total Bill */}
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t('invoice.total_bill', 'Total Bill')}:</td>
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
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t('invoice.paid_received', 'Paid / Received Amount')}:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                    ৳ {Number(selectedInvoice.receive_amount || selectedInvoice.receiveAmount || selectedInvoice.paid || 0).toFixed(2)}
                  </td>
                </tr>

                {/* Total Due / Net Due */}
                <tr style={{ background: '#fef2f2', fontWeight: 'bold', color: '#dc2626' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t('invoice.total_due', 'Total Due')}:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontSize: 'var(--fs-14, 14px)' }}>
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
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Customer Signature")}
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Authorized Signature")}
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right', marginTop: '16px' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>
                🖨️ {t('invoice.print_memo', 'Print Memo')}
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '6px' }}>
                {t('invoice.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
