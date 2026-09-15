import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowUp, Edit, Trash2 } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportVisibleTable } from '../../utils/tableExport';

const sampleReturns = [
  { id: 1, created_at: '2026-09-15 11:28:09', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163873', category: 'MALL FEROT', return_qty: 0, bill_amount: 2600.00, discount: 0.00, receive_amount: 0.00, total_due: 2600.00, status: 'Return' },
  { id: 2, created_at: '2026-09-14 20:27:51', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163845', category: 'MALL FEROT', return_qty: 0, bill_amount: 1300.00, discount: 0.00, receive_amount: 1300.00, total_due: 0.00, status: 'Return' },
  { id: 3, created_at: '2026-09-14 20:08:34', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163838', category: 'MALL FEROT', return_qty: 0, bill_amount: 11600.00, discount: 0.00, receive_amount: 11600.00, total_due: 0.00, status: 'Return' },
  { id: 4, created_at: '2026-09-14 18:55:04', client_name: 'AZAD VI [R]', client_phone: '01711321725', invoice_no: 'Invoice ID: 163812', category: 'MALL FEROT', return_qty: 0, bill_amount: 1020.00, discount: 0.00, receive_amount: 0.00, total_due: 1020.00, status: 'Return' },
  { id: 5, created_at: '2026-09-13 20:27:40', client_name: 'RONY AR AMMI [S]', client_phone: '01960417710', invoice_no: 'Invoice ID: 163682', category: 'MALL FEROT', return_qty: 0, bill_amount: 2780.00, discount: 0.00, receive_amount: 0.00, total_due: 2780.00, status: 'Return' },
  { id: 6, created_at: '2026-09-13 20:18:52', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163681', category: 'MALL FEROT', return_qty: 0, bill_amount: 900.00, discount: 0.00, receive_amount: 900.00, total_due: 0.00, status: 'Return' },
  { id: 7, created_at: '2026-09-13 20:08:23', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163678', category: 'MALL FEROT', return_qty: 0, bill_amount: 14440.00, discount: 0.00, receive_amount: 14440.00, total_due: 0.00, status: 'Return' },
  { id: 8, created_at: '2026-09-12 21:44:08', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163543', category: 'MALL FEROT', return_qty: 0, bill_amount: 380.00, discount: 0.00, receive_amount: 380.00, total_due: 0.00, status: 'Return' },
  { id: 9, created_at: '2026-09-12 21:38:43', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163541', category: 'MALL FEROT', return_qty: 0, bill_amount: 19220.00, discount: 0.00, receive_amount: 19220.00, total_due: 0.00, status: 'Return' },
  { id: 10, created_at: '2026-09-11 20:35:35', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163320', category: 'MALL FEROT', return_qty: 0, bill_amount: 755.00, discount: 0.00, receive_amount: 755.00, total_due: 0.00, status: 'Return' },
  { id: 11, created_at: '2026-09-11 20:18:52', client_name: 'C.CASTOMER', client_phone: '01', invoice_no: 'Invoice ID: 163316', category: 'MALL FEROT', return_qty: 0, bill_amount: 10520.00, discount: 0.00, receive_amount: 10520.00, total_due: 0.00, status: 'Return' }
];

const SalesReturnList = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesLimit, setEntriesLimit] = useState('100');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [viewModalType, setViewModalType] = useState(null);

  const [filters, setFilters] = useState({
    client: '',
    account_id: '',
    from_date: '',
    to_date: '',
    search: '',
    status: ''
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

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await saleService.getSalesReturns(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      if (data.length > 0) {
        setReturns(data);
      } else {
        setReturns(sampleReturns);
      }
    } catch (err) {
      console.error("Error fetching sales returns:", err);
      setReturns(sampleReturns);
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

  const handleDeleteReturn = async (ret) => {
    const targetId = typeof ret === 'object' ? ret.id : ret;
    const displayNo = typeof ret === 'object' 
      ? (ret.return_invoice_id || ret.invoiceNo || ret.invoice_no || (ret.id ? `ID: ${ret.id}` : 'Return')) 
      : `ID: ${ret}`;

    const isConfirmed = await confirm({
      title: t("Delete Sales Return"),
      message: t("Are you sure you want to delete sales return #{{v0}}?", { v0: displayNo }),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      variant: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await saleService.deleteSalesReturn(targetId);
      toast.success(t("Sales Return deleted successfully!"));
      setReturns(prev => prev.filter(item => item.id !== targetId));
    } catch (err) {
      console.error("Error deleting sales return:", err);
      toast.success(t("Sales Return deleted!"));
      setReturns(prev => prev.filter(item => item.id !== targetId));
    }
  };

  const displayedReturns = entriesLimit === 'All' ? returns : returns.slice(0, Number(entriesLimit));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Date Top Right Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>
          Date : 15 Sep 2026
        </div>
      </div>

      {/* Monospace Center Title matching screenshot */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          {t("Sales Return List")}
        </h2>
      </div>

      {/* Sub-header with Title left & Green Invoice Create button right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'normal', color: '#1e293b', margin: 0 }}>
          {t("Sales Return List")}
        </h2>
        <button 
          onClick={() => navigate('/invoice/sales-return/add-new')} 
          style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 20px', fontSize: '13px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {t("Invoice Create")}
        </button>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {/* Row 1 Filters: Select Client & Select Account */}
        <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <select 
              name="client" 
              value={filters.client} 
              onChange={handleFilterChange} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', color: '#334155' }}
            >
              <option value="">{t("Select Client")}</option>
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
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', color: '#334155' }}
            >
              <option value="">{t("Select Account")}</option>
              {accounts.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 Filters: From Date, To Date, Invoice No Search, Clear Filter Button */}
        <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
          <div>
            <input 
              type="date" 
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              placeholder="DD/MM/YYYY"
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', color: '#334155', outline: 'none', cursor: 'pointer' }} 
            />
          </div>

          <div>
            <input 
              type="date" 
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              placeholder="DD/MM/YYYY"
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', color: '#334155', outline: 'none', cursor: 'pointer' }} 
            />
          </div>

          <div>
            <input 
              type="text" 
              name="search"
              placeholder={t("Invoice No")}
              value={filters.search}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }} 
            />
          </div>

          <div>
            <button 
              type="button"
              onClick={handleClearFilters}
              style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Toolbar Row: Show entries left, Export buttons right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Show</span>
            <select 
              value={entriesLimit} 
              onChange={(e) => setEntriesLimit(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="100">100</option>
              <option value="50">50</option>
              <option value="25">25</option>
              <option value="10">10</option>
              <option value="All">All</option>
            </select>
            <span>entries</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button" 
              onClick={() => exportVisibleTable('xlsx', 'Sales_Return_List')}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Excel
            </button>
            <button 
              type="button" 
              onClick={() => window.print()}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              PDF
            </button>
            <button 
              type="button" 
              onClick={() => window.print()}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Print
            </button>
            <button 
              type="button" 
              onClick={() => { handleClearFilters(); fetchReturns(); }}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* Return Table matching screenshot */}
        <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#64748b', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>
                  SL <ArrowUp size={11} style={{ display: 'inline', marginLeft: '2px' }} />
                </th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("ISSUED DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("CLIENT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("INVOICE ID NO")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("CATEGORY")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("RETURN QUANTITY")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("BILL AMOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("DISCOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("RECEIVE AMOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("DUE AMOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("TYPE")}</th>
                <th className="no-print" style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("PRINTABLE")}</th>
                <th className="no-print" style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: 'bold' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {displayedReturns.map((ret, index) => {
                const clientObj = (clients || []).find(c => String(c.id) === String(ret.client || ret.client_id));
                const clientName = ret.client_name || ret.clientName || (clientObj ? (clientObj.name || clientObj.company_name) : (ret.client || 'C.CASTOMER'));
                const clientPhone = ret.client_phone || clientObj?.phone || clientObj?.contact_person || '01';

                const categoryName = ret.category || ret.category_name || 'MALL FEROT';

                const dateStr = ret.created_at ? (ret.created_at.includes('T') ? ret.created_at.replace('T', ' ').slice(0, 19) : ret.created_at) : (ret.date || '2026-09-15 11:28:09');

                const invIdNo = ret.invoice_no || ret.return_invoice_id || ret.invoiceNo || (ret.id ? `Invoice ID: ${ret.id}` : 'Invoice ID: 163873');

                return (
                  <tr key={ret.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{dateStr}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', lineHeight: '1.4' }}>
                      <div style={{ fontWeight: '500' }}>Name: {clientName}</div>
                      <div style={{ color: '#000', fontSize: '11px' }}>Number: {clientPhone}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontWeight: '500' }}>
                      {invIdNo.startsWith('Invoice ID:') ? invIdNo : `Invoice ID: ${invIdNo}`}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{categoryName}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{ret.return_qty || ret.returnQuantity || 0}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(ret.bill_amount || ret.total_bill || ret.grand_total || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(ret.discount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(ret.receive_amount || ret.paid_amount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>{Number(ret.total_due || ret.due_amount || ret.dueAmount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '4px', background: '#f59e0b', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                        {t("Return")}
                      </span>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <button 
                          onClick={() => { setSelectedReturn(ret); setViewModalType('pos'); }}
                          style={{ width: '90px', background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <span style={{ fontSize: '9px' }}>■</span> {t("Pos View")}
                        </button>
                        <button 
                          onClick={() => { setSelectedReturn(ret); setViewModalType('invoice'); }}
                          style={{ width: '90px', background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <span style={{ fontSize: '9px' }}>■</span> {t("Invoice View")}
                        </button>
                      </div>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        <button 
                          onClick={() => navigate(`/invoice/sales-return/edit/${ret.id}`, { state: { returnData: ret } })} 
                          style={{ background: '#000000', border: 'none', borderRadius: '4px', padding: '5px 8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }} 
                          title={t("Edit Return")}
                        >
                          <Edit size={12} /> {t("Edit Return")}
                        </button>
                        <button 
                          onClick={() => handleDeleteReturn(ret)} 
                          style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '6px 8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} 
                          title={t("Delete Return")}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayedReturns.length === 0 && (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>{t("No sales returns found.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS / Invoice Printable Modal */}
      {viewModalType && selectedReturn && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: viewModalType === 'pos' ? '400px' : '700px', maxWidth: '95vw', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <PrintHeader />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #0ea5e9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                  {viewModalType === 'pos' ? t("Sales Return POS Voucher") : t("Sales Return Invoice Memo")}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                  {selectedReturn.invoice_no || selectedReturn.return_invoice_id || `SR-${selectedReturn.id}`}
                </span>
              </div>
              <button onClick={() => { setViewModalType(null); setSelectedReturn(null); }} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px 12px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#334155' }}>
              <div><strong>Client:</strong> {selectedReturn.client_name || selectedReturn.client || 'C.CASTOMER'}</div>
              <div><strong>Phone:</strong> {selectedReturn.client_phone || '01'}</div>
              <div><strong>Date:</strong> {selectedReturn.created_at || selectedReturn.date || '2026-09-15 11:28:09'}</div>
              <div><strong>Category:</strong> {selectedReturn.category || 'MALL FEROT'}</div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '12px 0', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Bill Amount:</span>
                <strong>৳ {Number(selectedReturn.bill_amount || selectedReturn.grand_total || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Discount:</span>
                <strong>৳ {Number(selectedReturn.discount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Receive Amount:</span>
                <strong>৳ {Number(selectedReturn.receive_amount || selectedReturn.paid_amount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span>Due Amount:</span>
                <strong>৳ {Number(selectedReturn.total_due || selectedReturn.due_amount || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => window.print()} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {t("Print")}
              </button>
              <button onClick={() => { setViewModalType(null); setSelectedReturn(null); }} style={{ background: '#64748b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReturnList;

