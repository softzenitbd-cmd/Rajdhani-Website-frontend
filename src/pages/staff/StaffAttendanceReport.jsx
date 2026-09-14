import React, { useEffect, useState } from 'react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, fmtDate, nameOf, today, MONTHS, YEARS } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

const badge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.startsWith('pres')) return { background: 'var(--success)', color: 'white' };
  if (s.startsWith('abs')) return { background: 'var(--danger)', color: 'white' };
  if (s.startsWith('late')) return { background: 'var(--warning)', color: 'white' };
  return { background: '#64748b', color: 'white' };
};

const fmtTime = (t) => {
  if (!t) return '-';
  const [h, m] = String(t).split(':');
  if (h === undefined || m === undefined) return t;
  const hh = Number(h);
  return `${((hh + 11) % 12) + 1}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
};

const StaffAttendanceReport = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const now = new Date();
  const [mode, setMode] = useState('date'); // 'date' | 'month'
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(100);

  const load = async () => {
    try {
      setLoading(true);
      const params = mode === 'date' ? { date, from_date: date, to_date: date } : { month, year };
      const res = await staffApi.getStaffAttendance(params);
      setRows(toList(res));
    } catch (e) {
      toast.error(e.message || t("Failed to load attendance"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = rows.slice(0, entries);
  const excelData = visible.map((r, i) => ({
    SL: i + 1,
    Name: nameOf(r.staff_name || r.staff),
    Phone: r.phone || r.staff?.phone || '-',
    Date: fmtDate(r.date),
    'In Time': fmtTime(r.in_time),
    'Out Time': fmtTime(r.out_time),
    Attendance: r.status || r.attendance,
  }));

  const selectStyle = { width: '180px', padding: '10px 12px', borderRadius: '4px', border: '1px solid #0ea5e9', outline: 'none', background: 'white' };
  const searchBtn = { background: 'var(--success)', color: 'white', padding: '10px 32px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>{t("Staff Attendance")}</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <form onSubmit={(e) => { e.preventDefault(); setMode('month'); setTimeout(load, 0); }} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'white', padding: '16px', border: `1px solid ${mode === 'month' ? '#0ea5e9' : '#e2e8f0'}`, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{t(m)}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button type="submit" style={searchBtn}>{t("Search by Month")}</button>
            </form>

            <form onSubmit={(e) => { e.preventDefault(); setMode('date'); setTimeout(load, 0); }} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'white', padding: '16px', border: `1px solid ${mode === 'date' ? '#0ea5e9' : '#e2e8f0'}`, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...selectStyle, width: '376px', maxWidth: '80vw', textAlign: 'center' }} />
              <button type="submit" style={searchBtn}>{t("Search by Date")}</button>
            </form>
          </div>

          <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName="Staff_Attendance" onReload={load} onReset={() => { setMode('date'); setDate(today()); setTimeout(load, 0); }} />

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '12px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white' }}>
                  <th style={{ width: '50px' }}>{t("SL")}</th>
                  <th>{t("NAME")}</th>
                  <th>{t("PHONE")}</th>
                  <th>{t("DATE")}</th>
                  <th>{t("IN TIME")}</th>
                  <th>{t("OUT TIME")}</th>
                  <th>{t("ATTENDANCE")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '24px', color: '#64748b' }}>{t("Loading...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '24px', color: '#64748b' }}>{t("No attendance records found")}</td></tr>
                ) : (
                  visible.map((r, i) => (
                    <tr key={r.id || i}>
                      <td style={{ padding: '10px' }}>{i + 1}</td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{nameOf(r.staff_name || r.staff)}</td>
                      <td style={{ padding: '10px' }}>{r.phone || r.staff?.phone || '-'}</td>
                      <td style={{ padding: '10px' }}>{fmtDate(r.date)}</td>
                      <td style={{ padding: '10px' }}>{fmtTime(r.in_time)}</td>
                      <td style={{ padding: '10px' }}>{fmtTime(r.out_time)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'capitalize', ...badge(r.status || r.attendance) }}>
                          {r.status || r.attendance || '-'}
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

export default StaffAttendanceReport;
