import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, Eye, RotateCcw, Plus, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../../components/SearchableSelect';
import ExpenseEditModal from './ExpenseEditModal';
import { accountingService } from '../../services/accountingService';
import { fmtDate } from '../../utils/apiHelpers';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';


const SupplierPayment = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    account: '',
    amount: '',
    reference: ''
  });
  const [adding, setAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [idSearch, setIdSearch] = useState('');

  const fetchPrerequisites = async () => {
    try {
      const res = await crmService.getSuppliers().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setSuppliers(data);
      
      const accRes = await accountingService.getAccounts().catch(() => []);
      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);
      setAccounts(accData);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchPayments = async (filters = {}) => {
    try {
      setLoading(true);
      const res = await accountingService.getExpenses(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setPayments(data);
    } catch (err) {
      console.error("Error fetching supplier payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
    fetchPayments();
  }, []);

  const handleFilter = () => {
    const filters = {};
    if (selectedSupplier) filters.supplier = selectedSupplier;
      if (idSearch) filters.search = idSearch;
    if (fromDate) filters.from_date = fromDate;
    if (toDate) filters.to_date = toDate;
    fetchPayments(filters);
  };

  const handleClearFilter = () => {
    setSelectedSupplier('');
    setFromDate('');
    setToDate('');
    fetchPayments({});
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.supplier || !paymentForm.account || !paymentForm.amount) {
      toast.error(t("Please fill in required fields"));
      return;
    }
    try {
      setAdding(true);
      await accountingService.createExpense({
        type: 'cost',
        transaction_type: 'Supplier Payment',
        supplier: paymentForm.supplier,
        account: paymentForm.account,
        amount: paymentForm.amount,
        date: paymentForm.date,
        reference: paymentForm.reference,
        status: 1
      }, t("Payment added successfully"));
      
      setPaymentForm({ ...paymentForm, supplier: '', amount: '', reference: '' });
      fetchPayments();
    } catch (error) {
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  const totalAmount = payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="premium-card">
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait !important; margin: 8mm !important; }
            body, html, #root, .premium-card, .premium-body, .dashboard-content { 
              overflow: visible !important; 
              height: auto !important; 
              max-height: none !important; 
            }
            .custom-table { 
              width: 100% !important; 
              font-size: 9px !important; 
              table-layout: auto !important; 
            }
            .custom-table th, .custom-table td { 
              padding: 4px 2px !important; 
              word-wrap: break-word; 
              white-space: normal !important;
            }
            /* Hide the action column in print */
            .custom-table thead th:last-child, .custom-table tbody td:last-child { display: none !important; }
            /* Hide printable column if present */
            .custom-table thead th:nth-last-child(2), .custom-table tbody td:nth-last-child(2) { display: none !important; }
          `}
        </style>

      <div className="premium-body" style={{ padding: '0', background: '#f8fafc' }}>
        
        {/* Banner Area */}
        <div style={{ padding: '24px 24px 0 24px', textAlign: 'center', background: 'white', borderRadius: '12px 12px 0 0' }}>
          <PrintHeader showOnScreen={true} />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', margin: '16px 0', color: '#000' }}>Supplier Payment List</h2>
        </div>

        <div style={{ padding: '24px', background: 'white' }}>
          {/* Title and Top Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#374151', fontWeight: 'normal' }}>Supplier Payment List</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAddModal(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Plus size={16} /> Payment
              </button>
              <button style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <span style={{ background: '#ef4444', color: 'white', borderRadius: '4px', padding: '0 4px', fontSize: '12px' }}>▶</span> YouTube
              </button>
            </div>
          </div>

          {/* Filters Row exactly matching screenshot */}
          <div className="no-print" style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ width: '20%' }}>
              <label style={{ display: 'inline-block', background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginBottom: '4px' }}>ID Search By</label>
              <input type="text" className="input-outline" placeholder="ID Search By" value={idSearch} onChange={e => setIdSearch(e.target.value)} style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
            </div>
            
            <div style={{ width: '25%' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Search By Supplier</label>
              <SearchableSelect
                options={suppliers.map(s => ({
                  value: s.id,
                  label: s.name || s.company_name,
                  searchValue: s.name || s.company_name
                }))}
                value={selectedSupplier}
                onChange={(val) => setSelectedSupplier(val)}
                placeholder="Select Suppliers"
              />
            </div>

            <div style={{ width: '35%' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Search By Date</label>
              <div style={{ display: 'flex' }}>
                <CustomDatePicker 
                  className="input-outline" 
                  style={{ borderRadius: '6px 0 0 6px', borderRight: 'none', height: '38px' }} 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
                <CustomDatePicker 
                  className="input-outline" 
                  style={{ borderRadius: '0 6px 6px 0', height: '38px' }} 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>

            <div style={{ width: '20%' }}>
              <button onClick={handleClearFilter} style={{ width: '100%', height: '38px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Clear Filter
              </button>
            </div>
          </div>

          {/* Table Controls (Show entries, Print, Reset) */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px' }}>
              Show <select defaultValue="100" style={{ margin: '0 4px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select> entries
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={handleClearFilter} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>

        <table className="custom-table" style={{ border: '1px solid #d1d5db' }}>
          <thead>
            <tr>
              <th>{t('common.sl')}<span style={{ fontSize: 'var(--fs-10, 10px)', verticalAlign: 'super' }}>↑↓</span></th>
              <th>{t('common.date')}</th>
              <th>{t("RECEIPT FOR")}</th>
              <th>{t("ID NO")}</th>
              <th>{t('common.category')}</th>
              <th>{t('common.account')}</th>
              <th>{t("CHEQUE NO")}</th>
              <th>{t('common.description')}</th>
              <th>{t("TRANSACTION TYPE")}</th>
              <th>{t("BANK")}</th>
              <th>{t('common.amount')}</th>
              <th className="no-print">{t("PRINTABLE")}</th>
              <th className="no-print">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                <td>{fmtDate(item.date)}</td>
                <td>{item.supplier_name || item.supplier?.name || t("Supplier")}</td>
                <td>{item.id?.toString().slice(-6) || '-'}</td>
                <td>{item.category_name || item.category?.name || '-'}</td>
                <td>{item.account_name || item.account?.name || '-'}</td>
                <td>{item.cheque_no || '-'}</td>
                <td>{item.reference || item.description || '-'}</td>
                <td>{item.transaction_type || t("Payment")}</td>
                <td>{item.bank || '-'}</td>
                <td>৳ {Number(item.amount || 0).toLocaleString()}</td>
                <td className="no-print">
                  <button 
                    className="btn-sm btn-outline"
                    onClick={() => { setSelectedPayment(item); setShowViewModal(true); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {t("Print")}
                  </button>
                </td>
                <td className="no-print">
                  <button 
                    className="btn-sm btn-primary"
                    onClick={() => { setSelectedPayment(item); setShowViewModal(true); }}
                    style={{ cursor: 'pointer', padding: '4px 8px' }}
                  >
                    {t("View")}
                  </button>
                  <button 
                    className="btn-sm"
                    onClick={() => setEditingPayment(item)}
                    style={{ cursor: 'pointer', background: '#0ea5e9', color: 'white', border: 'none', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}
                  >
                    <Edit size={14} /> {t("Edit")}
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="13" style={{ padding: '24px', textAlign: 'center', background: 'white' }}>{t("Loading supplier payments...")}</td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan="13" style={{ padding: '24px', color: '#374151', background: 'white', textAlign: 'center' }}>{t("No data available in table")}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', background: '#f9fafb' }}>
              <td colSpan="10" style={{ textAlign: 'center' }}>{t('common.total')}</td>
              <td>৳ {totalAmount.toLocaleString()}</td>
              <td colSpan="2" className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        {/* Pagination Section */}
        <div className="table-footer-controls no-print">
          <div>{t("Showing {{from}} to {{to}} of {{total}} entries", { from: payments.length ? 1 : 0, to: payments.length, total: payments.length })}</div>
          <div className="pagination-controls">
            <button className="pagination-btn">{t("Previous")}</button>
            <button className="pagination-btn">{t("Next")}</button>
          </div>
        </div>

      </div>
      </div>

            {/* Printable Supplier Payment Voucher Modal */}
      {showViewModal && selectedPayment && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: '850px', maxWidth: '95vw', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{t("EXPENSE VOUCHER")}</h2>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {/* Modal Body / Print Area */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
              <div style={{ border: '1px solid #000', padding: '0', background: 'white', color: 'black' }} className="print-exact">
                {/* Logo & Info Area */}
                <div style={{ borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                   <PrintHeader showOnScreen={true} />
                </div>
                
                <div style={{ textAlign: 'center', borderBottom: '1px solid #000', padding: '6px 0', fontSize: '15px', fontWeight: 'bold', fontFamily: 'kalpurush, sans-serif' }}>
                  খরচ রশিদ
                </div>

                {/* Table Data */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: 'kalpurush, sans-serif' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', width: '30%' }}>Receipt No</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>#{selectedPayment.reference || selectedPayment.id_no || selectedPayment.id || 'PAY-001'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>তারিখ</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>{selectedPayment.date ? new Date(selectedPayment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>নাম</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textTransform: 'uppercase' }}>{selectedPayment.supplier_name || selectedPayment.supplier?.name || 'SUPPLIER'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>বিবরণ</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textTransform: 'uppercase' }}>{selectedPayment.reference || selectedPayment.description || selectedPayment.category_name || selectedPayment.category?.name || 'SUPPLIER PAYMENT'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>টাকার পরিমাণ</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>{Number(selectedPayment.amount || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>বাকি</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer / Action Buttons */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button 
                onClick={() => window.print()} 
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Printer size={16} /> Print
              </button>
              <button 
                onClick={() => setShowViewModal(false)} 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '18px', lineHeight: '1' }}>⊗</span> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: '700px', maxWidth: '95vw', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#22c55e', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 'bold' }}>{t("Add Supplier Payment")}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'white', lineHeight: '1' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={(e) => { handleAddPayment(e); setShowAddModal(false); }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>{t("Date")}</label>
                    <CustomDatePicker className="input-outline" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>{t("Select Account")}</label>
                    <SearchableSelect
                      options={accounts.map(a => ({ value: a.id, label: a.name, searchValue: a.name }))}
                      value={paymentForm.account}
                      onChange={(val) => setPaymentForm({...paymentForm, account: val})}
                      placeholder={t("Choose One")}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>{t("Supplier Name")}</label>
                    <SearchableSelect
                      options={suppliers.map(s => ({ value: s.id, label: s.name || s.company_name, searchValue: s.name || s.company_name }))}
                      value={paymentForm.supplier}
                      onChange={(val) => setPaymentForm({...paymentForm, supplier: val})}
                      placeholder={t("Choose One")}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>{t("Amount")}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" className="input-outline" style={{ flex: 1 }} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required placeholder="Amount" />
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>{t("Expense Description")} <span style={{ fontSize: 'var(--fs-10, 10px)' }}>(max short note)</span></label>
                    <input type="text" className="input-outline" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" disabled={adding} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>{adding ? t("Adding...") : t("Add Item")}</button>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
{/* Edit Payment Modal */}
      <ExpenseEditModal
        isOpen={Boolean(editingPayment)}
        expense={editingPayment}
        onClose={() => setEditingPayment(null)}
        onSuccess={() => fetchPayments()}
      />
    </div>
  );
};

export default SupplierPayment;

