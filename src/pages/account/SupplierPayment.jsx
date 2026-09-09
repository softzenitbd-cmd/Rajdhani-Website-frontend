import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Play, Printer, RotateCcw } from 'lucide-react';
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
      const res = await accountingService.getExpenses(filters).catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setPayments(data);
    } catch (err) {
      console.error("Error fetching supplier payments:", err);
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
            <button className="btn-youtube">
              <div style={{ display: 'flex', alignItems: 'center', background: '#ff0000', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                <Play size={16} fill="white" style={{ marginRight: '6px' }} /> YouTube
              </div>
            </button>
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
              <th>PRINTABLE</th>
              <th>{t('common.action')}</th>
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
                <td><button className="btn-sm btn-outline">Print</button></td>
                <td><button className="btn-sm btn-primary">View</button></td>
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
              <td colSpan="2"></td>
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
    </div>
  );
};

export default SupplierPayment;
