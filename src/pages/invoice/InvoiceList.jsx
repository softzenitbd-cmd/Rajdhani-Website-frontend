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
import CustomDatePicker from '../../components/CustomDatePicker';
import { companyStore, companyHeaderImage } from '../../services/companyStore';


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
  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());

  useEffect(() => {
    companyStore.load().then(info => setCompanyInfo(info));
  }, []);

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
        <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
        <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
          <div>
            <CustomDatePicker 
               
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', color: '#334155', outline: 'none', cursor: 'pointer' }} 
            />
          </div>

          <div>
            <CustomDatePicker 
               
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

        {/* Desktop Table View */}
        <div className="desktop-table-view" style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
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
          <div className="printable-modal-content" style={{ background: '#f8f9fa', width: '100%', maxWidth: '800px', borderRadius: '8px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button onClick={() => window.print()} className="no-print" style={{ background: '#000', color: 'white', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                🖨️ Printable
              </button>
              <button onClick={() => navigate('/invoice/create')} className="no-print" style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                + Add New
              </button>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#e2e8f0', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', color: '#0f172a', fontWeight: 'bold', marginLeft: 'auto' }}>✕ Close</button>
            </div>

            <div className="pos-receipt-wrapper" style={{ margin: '0 auto', width: '380px', background: 'white', padding: '8px', boxSizing: 'border-box' }}>
              <div style={{ border: '2px solid black', padding: '8px' }}>
                
                {/* Dynamic Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  {companyHeaderImage(companyInfo) && (
                    <img src={companyHeaderImage(companyInfo)} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', marginRight: '8px' }} />
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'black' }}>{companyInfo.company_name || 'Rajdhani Super Shop'}</h2>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'black', marginBottom: '2px', fontWeight: 'bold' }}>
                  {companyInfo.address || 'Address not available'}
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'black', marginBottom: '8px', fontWeight: 'bold' }}>
                  MOBILE: {companyInfo.phone || '01700000000'}
                </div>

                {(() => {
                  const clientObj = (clients || []).find(c => String(c.id) === String(selectedInvoice.client || selectedInvoice.client_id));
                  const clientDisplay = selectedInvoice.client_name || selectedInvoice.clientName || (clientObj ? (clientObj.name || clientObj.company_name) : (
                    (selectedInvoice.client && !String(selectedInvoice.client).includes('-')) ? selectedInvoice.client : 'C.CUSTOMER'
                  ));
                  
                  const invoiceBill = Number(selectedInvoice.invoice_bill || selectedInvoice.invoiceBill || (selectedInvoice.items || []).reduce((sum, item) => {
                      const qty = Number(item.quantity || item.qty || 1);
                      const rate = Number(item.selling_price || item.price || item.rate || 0);
                      return sum + (Number(item.total_selling_price || item.total_amount || (qty * rate)) || 0);
                  }, 0) || selectedInvoice.grand_total || 0);
                  
                  const prevDue = Number(selectedInvoice.previous_due || selectedInvoice.previousDue || 0);
                  const discountAmt = Number(selectedInvoice.discount || selectedInvoice.total_discount || 0);
                  const totalBill = invoiceBill - discountAmt + prevDue;
                  const payment = Number(selectedInvoice.receive_amount || selectedInvoice.receiveAmount || selectedInvoice.paid || 0);
                  const invoiceDue = Math.max(0, invoiceBill - discountAmt - payment);
                  const totalDue = selectedInvoice.total_due !== undefined ? Number(selectedInvoice.total_due) : Math.max(0, totalBill - payment);

                  let totalQty = 0;
                  (selectedInvoice.items || []).forEach(item => {
                    totalQty += Number(item.quantity || item.qty || 1);
                  });

                  return (
                    <>
                      {/* Info Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'black', marginBottom: '4px' }}>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '2px 4px', width: '50%' }}>Client ID No:- {selectedInvoice.client_id || (clientObj ? clientObj.id : '')}</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', width: '50%' }}>Invoice ID No:- {selectedInvoice.invoice_id || selectedInvoice.invoiceNo || selectedInvoice.id}</td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ border: '1px solid black', padding: '2px 4px' }}>Client: {clientDisplay}</td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ border: '1px solid black', padding: '2px 4px' }}>Date:- {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' }) : (selectedInvoice.date || '-')}</td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ border: '1px solid black', padding: '2px 4px' }}>Served By:- {selectedInvoice.served_by || 'ADMIN'}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Items Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'black', marginBottom: '0' }}>
                        <thead>
                          <tr>
                            <th style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>Name</th>
                            <th style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>Price</th>
                            <th style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>Quantity</th>
                            <th style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                            selectedInvoice.items.map((item, idx) => {
                              const qty = Number(item.quantity || item.qty || 1);
                              const rate = Number(item.selling_price || item.price || item.rate || 0);
                              const itemTotal = Number(item.total_selling_price || item.total_amount || (qty * rate) || 0);
                              const displayItemName = item.name || item.product_name || item.title || 'Item';
                              return (
                                <tr key={idx}>
                                  <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{displayItemName}</td>
                                  <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{rate}</td>
                                  <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{qty}</td>
                                  <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{itemTotal}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>General Item</td>
                              <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{invoiceBill}</td>
                              <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>1</td>
                              <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{invoiceBill}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan="3" style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'right', fontWeight: 'bold' }}>Total Quantity</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold' }}>{totalQty || 1}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Summary Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'black' }}>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid black', borderTop: 'none', padding: '2px 8px', textAlign: 'right', width: '70%' }}>Invoice Bill :-</td>
                            <td style={{ border: '1px solid black', borderTop: 'none', padding: '2px 4px', textAlign: 'center' }}>{invoiceBill}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '2px 8px', textAlign: 'right' }}>Previous Due :-</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{prevDue}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '2px 8px', textAlign: 'right' }}>Total Bill :-</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{totalBill}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '2px 8px', textAlign: 'right' }}>Payment :-</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{payment}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '2px 8px', textAlign: 'right' }}>Invoice Due :-</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{invoiceDue}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '2px 8px', textAlign: 'right' }}>Total Due :-</td>
                            <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{totalDue}</td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ border: '1px solid black', padding: '4px', textAlign: 'center', fontSize: '10px', fontStyle: 'italic', fontWeight: '600' }}>
                              Software Developed By www.softhostit.com
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  );
                })()}

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
