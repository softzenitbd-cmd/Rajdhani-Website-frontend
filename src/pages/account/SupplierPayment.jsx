import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Printer, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';

const SupplierPayment = () => {
  const { t } = useTranslation();

  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchPrerequisites = async () => {
    try {
      const res = await crmService.getSuppliers().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setSuppliers(data);
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

  const totalAmount = payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="premium-card">
      <div className="premium-body" style={{ padding: '40px' }}>
        <PrintHeader />
        
        {/* Title and Top Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#4b5563', margin: 0 }}>Supplier Payment List</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/account/expense-create" style={{ textDecoration: 'none' }}>
              <button className="btn-green">
                <Plus size={16} /> Payment
              </button>
            </Link>
          </div>
        </div>

        {/* Filter Section */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="filter-label">Search By Supplier</label>
            <select 
              className="input-outline" 
              value={selectedSupplier} 
              onChange={(e) => { setSelectedSupplier(e.target.value); }}
            >
              <option value="">Select Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.company_name}</option>
              ))}
            </select>
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
            <button className="btn-primary" style={{ flex: 1, height: '44px' }} onClick={handleFilter}>Search</button>
            <button className="btn-secondary" style={{ flex: 1, height: '44px' }} onClick={handleClearFilter}>{t('common.clear_filter')}</button>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-header-controls">
          <div className="show-entries">
            Show 
            <select defaultValue="100">
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select> 
            entries
          </div>
          <div className="table-controls-right">
            <button className="btn-blue" onClick={() => window.print()}><Printer size={16} /> {t('common.print')}</button>
            <button className="btn-blue" onClick={handleClearFilter}><RotateCcw size={16} /> {t('common.reset')}</button>
          </div>
        </div>

        <table className="custom-table" style={{ border: '1px solid #d1d5db' }}>
          <thead>
            <tr>
              <th>{t('common.sl')}<span style={{ fontSize: '10px', verticalAlign: 'super' }}>↑↓</span></th>
              <th>{t('common.date')}</th>
              <th>RECEIPT FOR</th>
              <th>ID NO</th>
              <th>{t('common.category')}</th>
              <th>{t('common.account')}</th>
              <th>CHEQUE NO</th>
              <th>{t('common.description')}</th>
              <th>TRANSACTION TYPE</th>
              <th>BANK</th>
              <th>{t('common.amount')}</th>
              <th className="no-print">PRINTABLE</th>
              <th className="no-print">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                <td>{item.date}</td>
                <td>{item.supplier_name || item.supplier?.name || 'Supplier'}</td>
                <td>{item.id?.toString().slice(-6) || '-'}</td>
                <td>{item.category_name || item.category?.name || '-'}</td>
                <td>{item.account_name || item.account?.name || '-'}</td>
                <td>{item.cheque_no || '-'}</td>
                <td>{item.reference || item.description || '-'}</td>
                <td>{item.transaction_type || 'Payment'}</td>
                <td>{item.bank || '-'}</td>
                <td>৳ {Number(item.amount || 0).toLocaleString()}</td>
                <td className="no-print">
                  <button 
                    className="btn-sm btn-outline"
                    onClick={() => { setSelectedPayment(item); setShowViewModal(true); }}
                    style={{ cursor: 'pointer' }}
                  >
                    Print
                  </button>
                </td>
                <td className="no-print">
                  <button 
                    className="btn-sm btn-primary"
                    onClick={() => { setSelectedPayment(item); setShowViewModal(true); }}
                    style={{ cursor: 'pointer' }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="13" style={{ padding: '24px', textAlign: 'center', background: 'white' }}>Loading supplier payments...</td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan="13" style={{ padding: '24px', color: '#374151', background: 'white', textAlign: 'center' }}>No data available in table</td>
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
          <div>Showing 1 to {payments.length} of {payments.length} entries</div>
          <div className="pagination-controls">
            <button className="pagination-btn">Previous</button>
            <button className="pagination-btn">Next</button>
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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Supplier Payment Voucher</h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Voucher #{selectedPayment.id || selectedPayment.voucherNo || 'PAY-001'}</span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px 12px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>Supplier Name:</strong> {selectedPayment.supplier_name || selectedPayment.supplier?.name || 'Supplier'}</div>
              <div><strong>Payment Date:</strong> {selectedPayment.date || '-'}</div>
              <div><strong>Category:</strong> {selectedPayment.category_name || selectedPayment.category?.name || 'Supplier Payment'}</div>
              <div><strong>Payment Account:</strong> {selectedPayment.account_name || selectedPayment.account?.name || 'Cash Account'}</div>
              <div><strong>Transaction Type:</strong> {selectedPayment.transaction_type || 'General Expense'}</div>
              <div><strong>Cheque / Ref No:</strong> {selectedPayment.cheque_no || '-'}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>SL</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Description / Particulars</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '140px' }}>Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: '500' }}>
                    {selectedPayment.reference || selectedPayment.description || 'Supplier Payment Clearance'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>
                    ৳ {Number(selectedPayment.amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan="2" style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Total Paid Amount:</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', color: '#059669', fontSize: '14px' }}>
                    ৳ {Number(selectedPayment.amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Footer */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: '12px' }}>
                Supplier Signature
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

export default SupplierPayment;
