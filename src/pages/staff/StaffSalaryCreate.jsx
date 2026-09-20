import React, { useEffect, useState } from 'react';
import { List, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import staffApi from '../../api/staffApi';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { toList, today, money, MONTHS, YEARS } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../components/CustomDatePicker';


/**
 * Monthly salary sheet. Each row that is ticked is saved as an expense
 * (type=cost, transaction_type="Staff Salary") against the chosen account.
 */
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' };
const labelStyle = { display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' };

const StaffSalaryCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [date, setDate] = useState(today());
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sheet, setSheet] = useState({}); // id -> {checked, amount, note}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, c] = await Promise.all([staffApi.getStaffList(), accountingService.getAccounts(), accountingService.getExpenseCategories()]);
        const list = toList(s);
        setStaff(list);
        setAccounts(toList(a));
        const cats = toList(c);
        setCategories(cats);
        const salaryCat = cats.find((x) => /salary|staff/i.test(x.name || ''));
        if (salaryCat) setCategory(salaryCat.id || salaryCat.uuid);
        const init = {};
        list.forEach((st) => {
          init[st.id || st.uuid] = { checked: Number(st.basic_salary ?? st.salary ?? 0) > 0, amount: st.basic_salary ?? st.salary ?? '', note: '' };
        });
        setSheet(init);
      } catch (e) {
        toast.error(e.message || t("Failed to load data"));
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id, k, v) => setSheet((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));
  const toggleAll = (checked) => setSheet((p) => { const n = {}; Object.keys(p).forEach((k) => { n[k] = { ...p[k], checked }; }); return n; });

  const selectedRows = staff.filter((s) => sheet[s.id || s.uuid]?.checked && Number(sheet[s.id || s.uuid]?.amount) > 0);
  const total = selectedRows.reduce((sum, s) => sum + Number(sheet[s.id || s.uuid].amount || 0), 0);

  const save = async () => {
    if (!account) return toast.error(t("Select an account to pay from"));
    if (!category) return toast.error(t("Select an expense category"));
    if (selectedRows.length === 0) return toast.error(t("Select at least one staff with an amount"));
    if (!window.confirm(t("Pay salary to {{v0}} staff, total ৳ {{v1}}?", { v0: selectedRows.length, v1: money(total) }))) return;

    const label = `Salary ${MONTHS[month - 1]} ${year}`;
    try {
      setSaving(true);
      const results = await Promise.allSettled(
        selectedRows.map((s) => {
          const sid = s.id || s.uuid;
          const r = sheet[sid];
          return accountingService.createExpense({
            type: 'cost',
            transaction_type: 'Staff Payment',
            staff: sid,
            account,
            category,
            amount: String(r.amount),
            description: r.note ? `${label} - ${r.note}` : `${s.full_name || s.name} ${label}`,
            date,
            month,
            year,
            status: 1,
          });
        })
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length === 0) {
        toast.success(t("{{v0}} saved for {{v1}} staff", { v0: label, v1: selectedRows.length }));
        navigate('/staff/salary/report');
      } else {
        toast.error(t("{{v0}} of {{v1}} payments failed: {{v2}}", { v0: failed.length, v1: selectedRows.length, v2: failed[0].reason?.message || '' }));
      }
    } finally {
      setSaving(false);
    }
  };

  const cell = { padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase' }}>{t("Add Salary")}</h2>
          <button type="button" onClick={() => navigate('/staff/salary/report')} style={{ background: '#64748b', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <List size={14} /> {t("Salary Report")}
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>{t("Salary Month")}</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={inputStyle}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{t(m)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t("Year")}</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t("Payment Date")}</label>
              <CustomDatePicker  value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t("Pay From Account *")}</label>
              <select value={account} onChange={(e) => setAccount(e.target.value)} style={inputStyle}>
                <option value="">{t("Select account")}</option>
                {accounts.map((a) => <option key={a.id || a.uuid} value={a.id || a.uuid}>{a.name} (৳ {money(a.balance ?? a.current_balance)})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t("Expense Category *")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                <option value="">{t("Select category")}</option>
                {categories.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textAlign: 'left', textTransform: 'uppercase', fontSize: 'var(--fs-12, 12px)' }}>
                  <th style={{ ...cell, width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" checked={staff.length > 0 && selectedRows.length === staff.filter((s) => Number(sheet[s.id || s.uuid]?.amount) > 0).length} onChange={(e) => toggleAll(e.target.checked)} />
                  </th>
                  <th style={cell}>{t("STAFF")}</th>
                  <th style={cell}>{t("DESIGNATION")}</th>
                  <th style={{ ...cell, width: '160px' }}>{t("SALARY AMOUNT")}</th>
                  <th style={{ ...cell, borderRight: 'none' }}>{t("NOTE")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading staff...")}</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No staff found")}</td></tr>
                ) : (
                  staff.map((s, i) => {
                    const sid = s.id || s.uuid;
                    const r = sheet[sid] || {};
                    return (
                      <tr key={sid} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'var(--card-header-bg)' : 'white', opacity: r.checked ? 1 : 0.6 }}>
                        <td style={{ ...cell, textAlign: 'center' }}><input type="checkbox" checked={!!r.checked} onChange={(e) => update(sid, 'checked', e.target.checked)} /></td>
                        <td style={cell}><div style={{ fontWeight: 600 }}>{s.full_name || s.name}</div><div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b' }}>{s.phone_number || s.phone}</div></td>
                        <td style={cell}>{s.designation_name || s.designation?.name || '-'}</td>
                        <td style={cell}><input type="number" min="0" step="0.01" value={r.amount} onChange={(e) => update(sid, 'amount', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', borderColor: '#e2e8f0' }} /></td>
                        <td style={{ ...cell, borderRight: 'none' }}><input value={r.note} onChange={(e) => update(sid, 'note', e.target.value)} placeholder={t("optional")} style={{ ...inputStyle, padding: '6px 8px', borderColor: '#e2e8f0' }} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {staff.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="3" style={{ ...cell, textAlign: 'right' }}>{t("TOTAL (")}{selectedRows.length} {t("staff)")}</td>
                    <td style={cell}>৳ {money(total)}</td>
                    <td style={{ ...cell, borderRight: 'none' }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button onClick={save} disabled={saving || loading} style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', border: 'none', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
              <Save size={16} /> {saving ? t("Saving...") : t("Save Salary Sheet")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSalaryCreate;
