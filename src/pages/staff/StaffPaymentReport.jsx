import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Printer, RefreshCcw, Search, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';


const StaffPaymentReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const fetchStaffPayments = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedMonth) {
        filters.month = selectedMonth;
        filters.year = String(new Date().getFullYear());
      }
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getStaffPaymentReport(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setPayments(data);
    } catch (error) {
      console.error('Error fetching staff payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffPayments();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchStaffPayments();
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedMonth('');
    setFromDate('');
    setToDate('');
    setTimeout(fetchStaffPayments, 50);
  };

  const handleMarkPaid = async (id) => {
    try {
      await accountingService.updateStaffPaymentStatus(id, true);
      toast.success(t("Payment marked as Paid"));
      fetchStaffPayments();
    } catch (e) {
      console.error(e);
      toast.error(e.message || t("Failed to update status"));
    }
  };

  const totalAmount = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        {/* Report Title & Buttons */}
        <div style={{ padding: '24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-20, 20px)', fontWeight: 'bold', margin: '0 0 4px' }}>{t("Staff Payment & Salary Report")}</h2>
            <span style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b' }}>{t("Comprehensive staff payroll and advances disbursement report")}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: '800', color: '#2563eb', marginRight: '12px' }}>
              {t("Total: ৳")} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/staff/payment/create')}
              style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Plus size={16} /> {t("New Payment")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          <form onSubmit={handleFilter} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr auto', gap: '16px', alignItems: 'end', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', marginBottom: '6px', fontWeight: '600' }}>{t("Search Staff / Reference")}</label>
              <input 
                type="text" 
                placeholder={t("Search staff name...")} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', marginBottom: '6px', fontWeight: '600' }}>{t("Month")}</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
              >
                <option value="">{t("All Months")}</option>
                {[...Array(12).keys()].map(i => (
                  <option key={i + 1} value={i + 1}>{t("Month")} {i + 1} (2026)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', marginBottom: '6px', fontWeight: '600' }}>{t("Date Range")}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CustomDatePicker  value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '50%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <CustomDatePicker  value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '50%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-blue" style={{ padding: '10px 16px', fontWeight: 'bold' }}>
                <Search size={14} style={{ marginRight: '4px', display: 'inline' }} /> {t("Filter")}
              </button>
              <button type="button" onClick={handleClear} className="btn-secondary" style={{ padding: '10px 14px' }}>
                {t("Reset")}
              </button>
            </div>
          </form>

          {/* Table Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b' }}>
              {t("Showing")} {payments.length} {t("payment records")}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>
                <Printer size={14} /> {t("Print")}
              </button>
              <button onClick={fetchStaffPayments} style={{ background: '#64748b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>
                <RefreshCcw size={14} /> {t("Reload")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-13, 13px)' }}>
              <thead>
                <tr style={{ background: '#718096', color: 'white' }}>
                  <th style={{ width: '60px' }}>{t("SL")}</th>
                  <th>{t("DATE")}</th>
                  <th>{t("STAFF NAME")}</th>
                  <th>{t("ACCOUNT")}</th>
                  <th>{t("DESCRIPTION")}</th>
                  <th style={{ textAlign: 'right' }}>{t("AMOUNT (৳)")}</th>
                  <th style={{ textAlign: 'center' }}>{t("STATUS")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading staff payments...")}</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No payments found for the specified period.")}</td>
                  </tr>
                ) : (
                  payments.map((row, index) => (
                    <tr key={row.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#64748b' }}>{index + 1}</td>
                      <td>{row.date ? String(row.date).split('T')[0] : t("N/A")}</td>
                      <td style={{ fontWeight: '600' }}>{row.staff_id || row.staff_name || row.receiptFor}</td>
                      <td>{row.account_id || row.account || t("Cash")}</td>
                      <td style={{ color: '#4b5563' }}>{row.description || row.desc || t("Staff Salary")}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>
                        ৳ {Number(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> {t("Paid")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPaymentReport;
