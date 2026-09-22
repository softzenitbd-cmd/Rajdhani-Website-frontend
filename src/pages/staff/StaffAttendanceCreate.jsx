import React, { useEffect, useState } from 'react';
import { Calendar, Save } from 'lucide-react';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, today } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../components/CustomDatePicker';


// labels are translation keys, resolved with t() at render time
const STATUS = [
  { value: 'present', label: 'Present' },
  { value: 'absence', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'leave', label: 'Leave' },
];

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const StaffAttendanceCreate = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState({}); // staffId -> {status, in_time, out_time}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = toList(await staffApi.getStaffList());
        setStaff(list);
        const init = {};
        list.forEach((s) => {
          init[s.id || s.uuid] = { status: 'present', in_time: nowTime(), out_time: '' };
        });
        setRows(init);
      } catch (e) {
        toast.error(e.message || t("Failed to load staff"));
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload existing attendance for the chosen date so the sheet can be corrected
  useEffect(() => {
    if (!date || staff.length === 0) return;
    staffApi
      .getStaffAttendance({ date, from_date: date, to_date: date })
      .then((r) => {
        const existing = toList(r);
        if (!existing.length) return;
        setRows((prev) => {
          const next = { ...prev };
          existing.forEach((a) => {
            const sid = a.staff?.id || a.staff_id || a.staff;
            if (next[sid]) {
              next[sid] = {
                status: String(a.status || 'present').toLowerCase() === 'absent' ? 'absence' : String(a.status || 'present').toLowerCase(),
                in_time: a.in_time ? String(a.in_time).slice(0, 5) : '',
                out_time: a.out_time ? String(a.out_time).slice(0, 5) : '',
              };
            }
          });
          return next;
        });
      })
      .catch(() => {});
  }, [date, staff]);

  const update = (sid, k, v) => setRows((p) => ({ ...p, [sid]: { ...p[sid], [k]: v } }));

  const markAll = (status) => {
    setRows((p) => {
      const n = {};
      Object.keys(p).forEach((k) => { n[k] = { ...p[k], status }; });
      return n;
    });
  };

  const save = async () => {
    if (!date) return toast.error(t("Select a date"));
    const payload = staff.map((s) => {
      const sid = s.id || s.uuid;
      const r = rows[sid] || {};
      return {
        staff: sid,
        date,
        status: r.status || 'present',
        // API expects HH:MM:SS
        in_time: r.in_time ? `${r.in_time}:00`.slice(0, 8) : null,
        out_time: r.out_time ? `${r.out_time}:00`.slice(0, 8) : null,
      };
    });
    try {
      setSaving(true);
      // POST /api/staff/attendance/ accepts one record per request
      const results = await Promise.allSettled(payload.map((p) => staffApi.createStaffAttendance(p)));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        toast.error(t("{{v0}} of {{v1}} failed: {{v2}}", { v0: failed.length, v1: payload.length, v2: failed[0].reason?.message || '' }));
      } else {
        toast.success(t("Attendance saved for {{v0}} staff", { v0: payload.length }));
      }
    } catch (e) {
      toast.error(e.message || t("Failed to save attendance"));
    } finally {
      setSaving(false);
    }
  };

  const cell = { padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)' };
  const timeInput = { border: '1px solid #e2e8f0', borderRadius: '4px', padding: '6px', width: '100%' };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase' }}>{t("Add Attendance")}</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={() => markAll('present')} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }}>{t("All Present")}</button>
            <button type="button" onClick={() => markAll('absence')} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }}>{t("All Absent")}</button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--info)', color: 'white', fontSize: 'var(--fs-11, 11px)', padding: '2px 8px', borderRadius: '4px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {t("Date")}
              </div>
              <CustomDatePicker  value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', textAlign: 'center' }} />
            </div>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textAlign: 'left', textTransform: 'uppercase', fontSize: 'var(--fs-12, 12px)' }}>
                  <th style={cell}>{t("STAFF NAME")}</th>
                  <th style={cell}>{t("PHONE")}</th>
                  <th style={{ ...cell, width: '140px' }}>{t("IN TIME")}</th>
                  <th style={{ ...cell, width: '140px' }}>{t("OUT TIME")}</th>
                  <th style={{ ...cell, width: '150px', borderRight: 'none' }}>{t("ATTENDANCE")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading staff...")}</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No staff found. Add staff first.")}</td></tr>
                ) : (
                  staff.map((s, index) => {
                    const sid = s.id || s.uuid;
                    const r = rows[sid] || {};
                    return (
                      <tr key={sid} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? 'var(--card-header-bg)' : 'white' }}>
                        <td style={cell}>{s.full_name || s.user_details?.full_name || s.name || s.username || s.user_details?.username || 'Staff'}</td>
                        <td style={cell}>{s.phone_number || s.phone || s.user_details?.phone_number || '-'}</td>
                        <td style={cell}><input type="time" value={r.in_time || ''} onChange={(e) => update(sid, 'in_time', e.target.value)} style={timeInput} /></td>
                        <td style={cell}><input type="time" value={r.out_time || ''} onChange={(e) => update(sid, 'out_time', e.target.value)} style={timeInput} /></td>
                        <td style={{ ...cell, borderRight: 'none' }}>
                          <select value={r.status || 'present'} onChange={(e) => update(sid, 'status', e.target.value)} style={{ ...timeInput, fontWeight: 600, color: r.status === 'absence' ? '#b91c1c' : r.status === 'late' ? '#b45309' : '#166534' }}>
                            {STATUS.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button onClick={save} disabled={saving || staff.length === 0} style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', border: 'none', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
              <Save size={16} /> {saving ? t("Saving...") : t("Save Attendance")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAttendanceCreate;
