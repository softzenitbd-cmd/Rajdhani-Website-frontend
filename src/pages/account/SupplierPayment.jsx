import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, Eye, RotateCcw, Plus, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../../components/SearchableSelect';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';

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
  
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    account: '',
    amount: '',
    reference: ''
  });
  const [adding, setAdding] = useState(false);

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
      <div className="premium-body" style={{ padding: '0' }}>
        
        {/* Payment Form Section matching screenshot */}
        <div style={{ background: '#22c55e', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--fs-16, 16px)', margin: 0, fontWeight: '600' }}>{t("Add Supplier Payment")}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/crm/supplier-list">
              <button className="btn-outline" style={{ padding: '6px 12px', background: '#718096', color: 'white', border: 'none', borderRadius: '4px' }}>
                {t("Client List")}
              </button>
            </Link>
          </div>
        </div>

        <div style={{ padding: '24px', background: 'white', borderBottom: '2px solid #e2e8f0' }}>
          <form onSubmit={handleAddPayment}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Date")}
                </label>
                <input type="date" className="input-outline" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} required />
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Select Account")}
                </label>
                <SearchableSelect
                  options={accounts.map(a => ({
                    value: a.id,
                    label: a.name,
                    searchValue: a.name
                  }))}
                  value={paymentForm.account}
                  onChange={(val) => setPaymentForm({...paymentForm, account: val})}
                  placeholder={t("Choose One")}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Supplier Name")}
                </label>
                <SearchableSelect
                  options={suppliers.map(s => ({
                    value: s.id,
                    label: s.name || s.company_name,
                    searchValue: s.name || s.company_name
                  }))}
                  value={paymentForm.supplier}
                  onChange={(val) => setPaymentForm({...paymentForm, supplier: val})}
                  placeholder={t("Choose One")}
                />
                {paymentForm.supplier && (
                  <div style={{ fontSize: 'var(--fs-12, 12px)', marginTop: '4px', color: '#eab308' }}>
                    {t("Supplier Due :")} ৳ {Number(suppliers.find(s => s.id === paymentForm.supplier || s.uuid === paymentForm.supplier)?.due || 0).toFixed(2)}
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Amount")}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" className="input-outline" style={{ flex: 1 }} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required placeholder="Amount" />
                  <button type="button" className="btn" style={{ background: '#22c55e', color: 'white', padding: '0 12px', borderRadius: '4px' }}><Plus size={16} /></button>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Expense Description")} <span style={{ fontSize: 'var(--fs-10, 10px)' }}>(max short note)</span>
                </label>
                <input type="text" className="input-outline" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button type="submit" disabled={adding} className="btn" style={{ background: '#3b82f6', color: 'white', padding: '8px 24px', borderRadius: '4px' }}>{adding ? t("Adding...") : t("Add Item")}</button>
              <button type="button" onClick={() => setPaymentForm({...paymentForm, amount: '', reference: ''})} className="btn" style={{ background: '#ef4444', color: 'white', padding: '8px 24px', borderRadius: '4px' }}>{t("Clear")}</button>
            </div>
          </form>
        </div>

        <div style={{ padding: '40px' }}>
          <PrintHeader />
          <h3 style={{ textAlign: 'center', fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', margin: '20px 0' }}>{t("Expense List")}</h3>

        {/* Filter Section */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="filter-label">{t("Search By Supplier")}</label>
            <SearchableSelect
              options={suppliers.map(s => ({
                value: s.id,
                label: s.name || s.company_name,
                searchValue: s.name || s.company_name
              }))}
              value={selectedSupplier}
              onChange={(val) => setSelectedSupplier(val)}
              placeholder={t("Select Suppliers")}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="filter-label">{t('common.search_by_date')}</label>
            <div style={{ display: 'flex' }}>
              <input 
                type="date" 
                className="input-outline" 
                style={{ borderRadius: '8px 0 0 8px', borderRight: 'none' }} 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input 
                type="date" 
                className="input-outline" 
                style={{ borderRadius: '0 8px 8px 0' }} 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ flex: 1, height: '44px' }} onClick={handleFilter}>{t("Search")}</button>
            <button className="btn-secondary" style={{ flex: 1, height: '44px' }} onClick={handleClearFilter}>{t('common.clear_filter')}</button>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-header-controls">
          <div className="show-entries">
            {t("Show")} 
            <select defaultValue="100">
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select> 
            {t("entries")}
          </div>
          <div className="table-controls-right">
            <button className="btn-blue" onClick={() => window.print()}><Printer size={16} /> {t('common.print')}</button>
            <button className="btn-blue" onClick={handleClearFilter}><RotateCcw size={16} /> {t('common.reset')}</button>
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
                <td>{item.date}</td>
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
                    style={{ cursor: 'pointer' }}
                  >
                    {t("View")}
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
        <div className="table-footer-controls">
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
          <div className="printable-modal-content" style={{ background: 'white', width: '700px', maxWidth: '95vw', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <PrintHeader />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #0ea5e9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', color: '#0f172a' }}>{t("Supplier Payment Voucher")}</h3>
                <span style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b', fontWeight: '600' }}>{t("Voucher #")}{selectedPayment.id || selectedPayment.voucherNo || t("PAY-001")}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px 12px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: 'var(--fs-13, 13px)', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>{t("Supplier Name:")}</strong> {selectedPayment.supplier_name || selectedPayment.supplier?.name || t("Supplier")}</div>
              <div><strong>{t("Payment Date:")}</strong> {selectedPayment.date || '-'}</div>
              <div><strong>{t("Category:")}</strong> {selectedPayment.category_name || selectedPayment.category?.name || t("Supplier Payment")}</div>
              <div><strong>{t("Payment Account:")}</strong> {selectedPayment.account_name || selectedPayment.account?.name || t("Cash Account")}</div>
              <div><strong>{t("Transaction Type:")}</strong> {selectedPayment.transaction_type || t("General Expense")}</div>
              <div><strong>{t("Cheque / Ref No:")}</strong> {selectedPayment.cheque_no || '-'}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: 'var(--fs-13, 13px)' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>{t("SL")}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{t("Description / Particulars")}</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '140px' }}>{t("Amount (৳)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: '500' }}>
                    {selectedPayment.reference || selectedPayment.description || t("Supplier Payment Clearance")}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>
                    ৳ {Number(selectedPayment.amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan="2" style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t("Total Paid Amount:")}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', color: '#059669', fontSize: 'var(--fs-14, 14px)' }}>
                    ৳ {Number(selectedPayment.amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Footer */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Supplier Signature")}
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Authorized Signature")}
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right', marginTop: '16px' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>
                {t("🖨️ Print Memo")}
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '6px' }}>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPayment;
