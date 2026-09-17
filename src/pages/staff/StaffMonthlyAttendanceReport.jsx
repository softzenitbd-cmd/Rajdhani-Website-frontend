import React, { useEffect, useState } from 'react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import AutoTable from '../../components/AutoTable';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, nameOf, MONTHS, YEARS } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Monthly attendance summary: /api/staff/attendance-report/?month=&year=
 * The report is rendered as a matrix (staff × day) when the backend returns
 * per-day data, otherwise as a summary table (present / absent / late counts).
 */
const StaffMonthlyAttendanceReport = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const now = new Date();
  const [staffId, setStaffId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    staffApi.getStaffList().then((r) => setStaff(toList(r))).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setSearched(true);
      const params = { month, year };
      if (staffId) params.staff_id = staffId;
      const res = await staffApi.getStaffAttendanceReport(params);
      let data = toList(res);
      if (!data.length && res && typeof res === 'object' && !Array.isArray(res)) {
        // some backends return {report: [...]} or {staff: [...]}
        data = toList(res.report || res.staff || res.attendance || []);
      }
      if (staffId) data = data.filter((r) => !r.staff_id || String(r.staff_id) === String(staffId) || String(r.staff?.id) === String(staffId) || String(r.id) === String(staffId));
      setRows(data);
    } catch (e) {
      toast.error(e.message || t("Failed to load report"));
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayKeys = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Detect per-day structure: row.days = [{date,status}] | row.attendance = {...} | row["1"]..
  const perDay = (r) => {
    if (Array.isArray(r.days)) return r.days;
    if (Array.isArray(r.attendance)) return r.attendance;
    if (Array.isArray(r.records)) return r.records;
    if (r.days && typeof r.days === 'object') return Object.entries(r.days).map(([date, status]) => ({ date, status }));
    return null;
  };
  const isMatrix = rows.length > 0 && perDay(rows[0]) !== null;

  const dayStatus = (r, day) => {
    const list = perDay(r) || [];
    const hit = list.find((d) => {
      const dd = d.date || d.day;
      if (!dd) return false;
      const n = typeof dd === 'number' ? dd : Number(String(dd).split('-').pop());
      return n === day;
    });
    return (hit?.status || hit?.attendance || '').toString().toLowerCase();
  };

  const short = (s) => (s.startsWith('pres') ? 'P' : s.startsWith('abs') ? 'A' : s.startsWith('late') ? 'L' : s.startsWith('leave') ? 'LV' : s ? s[0].toUpperCase() : '');
  const color = (s) => (s.startsWith('pres') ? '#16a34a' : s.startsWith('abs') ? '#dc2626' : s.startsWith('late') ? '#d97706' : '#64748b');

  // GET /api/staff/attendance-report/?month=&year= → staff_id, staff_name, designation, department,
  // present_count, absence_count, late_count, leave_count
  const summaryColumns = [
    { key: 'name', label: t("Staff"), render: (r) => nameOf(r.staff_name || r.name || r.staff) },
    { key: 'department', label: t("Department"), render: (r) => nameOf(r.department, '-') },
    { key: 'designation', label: t("Designation"), render: (r) => nameOf(r.designation, '-') },
    { key: 'present', label: t("Present"), align: 'center', render: (r) => r.present_count ?? r.present ?? r.present_days ?? '-' },
    { key: 'absent', label: t("Absent"), align: 'center', render: (r) => r.absence_count ?? r.absent_count ?? r.absent ?? r.absent_days ?? '-' },
    { key: 'late', label: t("Late"), align: 'center', render: (r) => r.late_count ?? r.late ?? r.late_days ?? '-' },
    { key: 'leave', label: t("Leave"), align: 'center', render: (r) => r.leave_count ?? r.leave ?? r.leave_days ?? '-' },
  ];

  const excelData = rows.map((r, i) => {
    const o = { SL: i + 1, Staff: nameOf(r.staff_name || r.name || r.staff) };
    if (isMatrix) dayKeys.forEach((d) => { o[`D${d}`] = short(dayStatus(r, d)); });
    else summaryColumns.slice(1).forEach((c) => { o[c.label] = c.render(r); });
    return o;
  });

  const selectStyle = { flex: 1, minWidth: '160px', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', alignItems: 'center', width: '90%', maxWidth: '900px', flexWrap: 'wrap' }}>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={selectStyle}>
            <option value="">{t("All Staff")}</option>
            {staff.map((s) => <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.full_name || s.name}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{t(m)}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="submit" style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: 500 }}>
            {t("Search")}
          </button>
        </div>
      </form>

      <div className="premium-card" style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
        <PrintHeader />
        <h3 style={{ textAlign: 'center', margin: '0 0 16px', fontSize: 'var(--fs-16, 16px)', color: 'var(--text-main)' }}>
          {t("Monthly Attendance Report —")} {t(MONTHS[month - 1])} {year}
        </h3>

        <TableToolbar total={rows.length} excelData={excelData} excelName={`Attendance_${MONTHS[month - 1]}_${year}`} onReload={load} />

        {!searched ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>{t("Select month & year then press Search.")}</div>
        ) : isMatrix ? (
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-11, 11px)', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#718096', color: 'white' }}>
                  <th style={{ textAlign: 'left', padding: '8px', minWidth: '140px' }}>{t("STAFF")}</th>
                  {dayKeys.map((d) => <th key={d} style={{ padding: '6px 2px' }}>{d}</th>)}
                  <th>{t("P")}</th><th>{t("A")}</th><th>{t("L")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const statuses = dayKeys.map((d) => dayStatus(r, d));
                  const count = (p) => statuses.filter((s) => s.startsWith(p)).length;
                  return (
                    <tr key={r.id || r.staff_id || i}>
                      <td style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{nameOf(r.staff_name || r.name || r.staff)}</td>
                      {statuses.map((s, d) => <td key={d} style={{ padding: '6px 2px', color: color(s), fontWeight: 'bold' }}>{short(s)}</td>)}
                      <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{count('pres')}</td>
                      <td style={{ color: '#dc2626', fontWeight: 'bold' }}>{count('abs')}</td>
                      <td style={{ color: '#d97706', fontWeight: 'bold' }}>{count('late')}</td>
                    </tr>
                  );
                })}
                {loading && <tr><td colSpan={dayKeys.length + 4} style={{ padding: '20px' }}>{t("Loading...")}</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <AutoTable rows={rows} columns={summaryColumns} loading={loading} emptyText={t("No attendance data for this month")} />
        )}
      </div>
    </div>
  );
};

export default StaffMonthlyAttendanceReport;
