import React, { useEffect, useState } from 'react';
import { Plus, XCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import { communicationService } from '../../services/communicationService';
import { useToast } from '../../context/ToastContext';
import { toList } from '../../utils/apiHelpers';

const statusStyle = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('sent') || v.includes('success') || v.includes('deliver')) return { background: '#dcfce7', color: '#166534' };
  if (v.includes('cancel') || v.includes('fail')) return { background: '#fee2e2', color: '#991b1b' };
  return { background: '#fef3c7', color: '#92400e' }; // pending
};

const fmtDateTime = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// API row: { body, scheduled_date, status, client_name | supplier_name | client_group_name | supplier_group_name }
const sentTo = (r) =>
  r.client_name || r.supplier_name || r.client_group_name || r.supplier_group_name ||
  (r.client ? `Client: ${typeof r.client === 'object' ? r.client.name : r.client}` : '') ||
  (r.supplier ? `Supplier: ${typeof r.supplier === 'object' ? r.supplier.name : r.supplier}` : '') ||
  r.phone || '-';

const bodyOf = (r) => r.body ?? r.message ?? '';
const scheduledAt = (r) => r.scheduled_date || r.schedule_at || r.scheduled_at;

const SmsScheduleReport = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entries, setEntries] = useState(50);

  const load = async (f = { status, search, fromDate, toDate }) => {
    try {
      setLoading(true);
      const filters = {};
      if (f.status) filters.status = f.status;
      if (f.search) filters.search = f.search;
      if (f.fromDate) filters.from_date = f.fromDate;
      if (f.toDate) filters.to_date = f.toDate;
      setRows(toList(await communicationService.getSmsSchedules(filters)));
    } catch (e) {
      toast.error(e.message || 'Failed to load SMS schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async (r) => {
    if (!window.confirm('Cancel this scheduled SMS?')) return;
    try {
      await communicationService.cancelSmsSchedule(r.id || r.uuid);
      toast.success('SMS schedule cancelled');
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to cancel');
    }
  };

  const reset = () => {
    setStatus(''); setSearch(''); setFromDate(''); setToDate('');
    load({ status: '', search: '', fromDate: '', toDate: '' });
  };

  const visible = rows.slice(0, entries);
  const excelData = visible.map((r, i) => ({ SL: i + 1, 'Sent To': sentTo(r), Message: bodyOf(r), 'Schedule At': fmtDateTime(scheduledAt(r)), Status: r.status }));
  const input = { padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' };
  const isPending = (r) => /pend|sched|queue/i.test(String(r.status || 'pending'));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>SMS Schedule Report</h2>
          <button onClick={() => navigate('/sms/schedule')} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> Schedule SMS
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <form className="no-print" onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '16px', alignItems: 'end' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search message / number" style={input} />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={input} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={input} />
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={14} /> Filter</button>
          </form>

          <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName="SMS_Schedule_Report" onReload={() => load()} onReset={reset} />

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>SL</th>
                  <th>SENT TO</th>
                  <th style={{ width: '35%' }}>MESSAGE</th>
                  <th>SCHEDULE AT</th>
                  <th style={{ textAlign: 'center' }}>STATUS</th>
                  <th className="action-column" style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No scheduled SMS found</td></tr>
                ) : (
                  visible.map((r, i) => (
                    <tr key={r.id || i}>
                      <td style={{ textAlign: 'center', padding: '10px' }}>{i + 1}</td>
                      <td style={{ padding: '10px' }}>{sentTo(r)}</td>
                      <td style={{ padding: '10px', whiteSpace: 'pre-wrap' }}>{bodyOf(r)}</td>
                      <td style={{ padding: '10px' }}>{fmtDateTime(scheduledAt(r))}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'capitalize', ...statusStyle(r.status) }}>{r.status || 'pending'}</span>
                      </td>
                      <td className="action-column" style={{ padding: '10px', textAlign: 'center' }}>
                        {isPending(r) ? (
                          <button onClick={() => cancel(r)} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <XCircle size={12} /> Cancel
                          </button>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
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

export default SmsScheduleReport;
