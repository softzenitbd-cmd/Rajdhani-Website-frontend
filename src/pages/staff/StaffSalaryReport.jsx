import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import staffApi from '../../api/staffApi';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { toList, fmtDate, nameOf, money, MONTHS, YEARS } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/** Salary report = staff payment report filtered by month/year (transaction_type "Staff Salary") */
const StaffSalaryReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [staffId, setStaffId] = useState('');
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(100);
  const [accounts, setAccounts] = useState([]);
  const [genAccount, setGenAccount] = useState('');
  const [generating, setGenerating] = useState(false);
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    staffApi.getStaffList().then((r) => setStaff(toList(r))).catch((e) => toast.error(e?.message || t("Failed to load staff")));
    accountingService.getAccounts().then((r) => setAccounts(toList(r))).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // POST /api/accounting/staff-payments/generate/ – one pending salary per active staff
  const generatePayroll = async () => {
    if (!genAccount) return toast.error(t("Select the account the salaries will be paid from"));
    
    const isConfirmed = await confirm({
      title: t("Generate Payroll"),
      message: t("Generate pending salaries for every active staff for {{v0}} {{v1}}?", { v0: t(MONTHS[month - 1]), v1: year }),
      confirmText: t("Yes, Generate")
    });
    
    if (!isConfirmed) return;
    
    try {
      setGenerating(true);
      const res = await accountingService.generateStaffPayroll({ month, year, account_id: genAccount });
      toast.success(res?.message || t("Payroll generated"));
      load();
    } catch (e) {
      toast.error(e?.message || t("Failed to generate payroll"));
    } finally {
      setGenerating(false);
    }
  };

  // PATCH /api/accounting/expenses/<id>/ { status: true }
  const isPaid = (r) => r.status === true || r.status === 1 || r.status === '1' || String(r.status).toLowerCase() === 'paid';
  const markPaid = async (r) => {
    const isConfirmed = await confirm({
      title: t("Mark as Paid"),
      message: t("Mark {{v0}}'s salary of ৳ {{v1}} as paid?", { v0: nameOf(r.staff_name || r.staff || r.staff_id), v1: money(r.amount) }),
      confirmText: t("Yes, Mark Paid")
    });
    
    if (!isConfirmed) return;
    
    try {
      setMarking(r.id);
      await accountingService.updateStaffPaymentStatus(r.id, true);
      toast.success(t("Marked as paid"));
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: true } : x)));
    } catch (e) {
      toast.error(e?.message || t("Failed to update"));
    } finally {
      setMarking(null);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const filters = { month, year };
      if (staffId) filters.staff_id = staffId;
      const res = await accountingService.getStaffPaymentReport(filters);
      const all = toList(res);
      // keep salary rows when the backend tags the transaction type; otherwise show all payments
      const salaryOnly = all.filter((r) => /salary/i.test(r.transaction_type || r.description || ''));
      setRows(salaryOnly.length ? salaryOnly : all);
    } catch (e) {
      toast.error(e.message || t("Failed to load salary report"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = rows.slice(0, entries);
  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const excelData = visible.map((r, i) => ({
    SL: i + 1,
    Date: fmtDate(r.date),
    Staff: nameOf(r.staff_name || r.staff || r.staff_id),
    Account: nameOf(r.account_name || r.account || r.account_id),
    Description: r.description || '',
    Amount: Number(r.amount || 0),
    Status: isPaid(r) ? 'Paid' : 'Pending',
  }));

  const inputStyle = { padding: '10px 12px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none', minWidth: '150px' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <div>
            <h2 className="premium-title" style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', margin: 0 }}>{t("Salary Report")}</h2>
            <span style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>{t(MONTHS[month - 1])} {year}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b' }}>{t("Total Paid")}</div>
              <div style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 800, color: '#dc2626' }}>৳ {money(total)}</div>
            </div>
            <button onClick={() => navigate('/staff/salary/create')} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Plus size={16} /> {t("Add Salary")}
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <form className="no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end', marginBottom: '16px' }}>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inputStyle}>
              <option value="">{t("All Staff")}</option>
              {staff.map((s) => <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.full_name || s.name}</option>)}
            </select>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={inputStyle}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{t(m)}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t("Search")}</button>
            <span style={{ flex: 1 }} />
            <select value={genAccount} onChange={(e) => setGenAccount(e.target.value)} style={inputStyle}>
              <option value="">{t("Pay from account…")}</option>
              {accounts.map((a) => <option key={a.id || a.uuid} value={a.id || a.uuid}>{a.name}</option>)}
            </select>
            <button type="button" onClick={generatePayroll} disabled={generating} style={{ background: '#7c3aed', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} /> {generating ? t("Generating…") : t("Generate Payroll")}
            </button>
          </form>

          <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName={`Salary_${MONTHS[month - 1]}_${year}`} onReload={load} onReset={() => { setStaffId(''); setMonth(now.getMonth() + 1); setYear(now.getFullYear()); setTimeout(load, 0); }} />

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)' }}>
              <thead>
                <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '50px', textAlign: 'center' }}>{t("SL")}</th>
                  <th>{t("DATE")}</th>
                  <th>{t("STAFF")}</th>
                  <th>{t("ACCOUNT")}</th>
                  <th>{t("DESCRIPTION")}</th>
                  <th style={{ textAlign: 'right' }}>{t("AMOUNT")}</th>
                  <th style={{ textAlign: 'center' }}>{t("STATUS")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No salary payments found for this period")}</td></tr>
                ) : (
                  visible.map((r, i) => (
                    <tr key={r.id || i}>
                      <td style={{ textAlign: 'center', padding: '10px' }}>{i + 1}</td>
                      <td style={{ padding: '10px' }}>{fmtDate(r.date)}</td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{nameOf(r.staff_name || r.staff || r.staff_id)}</td>
                      <td style={{ padding: '10px' }}>{nameOf(r.account_name || r.account || r.account_id)}</td>
                      <td style={{ padding: '10px', color: '#475569' }}>{r.description || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>৳ {money(r.amount)}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }} className="action-column">
                        {isPaid(r) ? (
                          <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> {t("Paid")}</span>
                        ) : (
                          <button type="button" onClick={() => markPaid(r)} disabled={marking === r.id} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-11, 11px)', fontWeight: 700 }}>
                            {marking === r.id ? '…' : t("Mark Paid")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="5" style={{ padding: '10px', textAlign: 'right' }}>{t("TOTAL")}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#dc2626' }}>৳ {money(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSalaryReport;
