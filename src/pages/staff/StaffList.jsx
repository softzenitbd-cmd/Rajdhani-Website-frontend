import React, { useEffect, useState } from 'react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, fmtDate, nameOf, money } from '../../utils/apiHelpers';

const StaffList = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [entries, setEntries] = useState(50);

  const load = async (params = { search, department }) => {
    try {
      setLoading(true);
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.department) filters.department = params.department;
      const res = await staffApi.getStaffList(filters);
      setRows(toList(res));
    } catch (e) {
      toast.error(e.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    staffApi.getDepartments().then((r) => setDepartments(toList(r))).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (row) => {
    const rid = row.id || row.uuid;
    if (!window.confirm(`Delete staff "${row.name || row.full_name}"?`)) return;
    try {
      await staffApi.deleteStaff(rid);
      toast.success('Staff deleted');
      setRows((p) => p.filter((r) => (r.id || r.uuid) !== rid));
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const reset = () => {
    setSearch('');
    setDepartment('');
    load({ search: '', department: '' });
  };

  const visible = rows.slice(0, entries);
  const excelData = visible.map((s, i) => ({
    SL: i + 1,
    Name: s.name || s.full_name,
    Phone: s.phone || '-',
    Email: s.email || '-',
    Department: nameOf(s.department_name || s.department),
    Designation: nameOf(s.designation_name || s.designation),
    Salary: s.salary ?? '',
    'Joining Date': fmtDate(s.joining_date),
    Status: (s.is_active ?? s.status) ? 'Active' : 'Inactive',
  }));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>Staff List</h2>
          <button onClick={() => navigate('/staff/create')} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> Add Staff
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <form
            className="no-print"
            onSubmit={(e) => { e.preventDefault(); load(); }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'end' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' }}>Search (name / phone)</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' }}>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' }}>
                <option value="">All departments</option>
                {departments.map((d) => <option key={d.id || d.uuid} value={d.id || d.uuid}>{d.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Search size={14} /> Filter
            </button>
          </form>

          <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName="Staff_List" onReload={() => load()} onReset={reset} />

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>SL</th>
                  <th style={{ textAlign: 'center' }}>IMAGE</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>E-MAIL</th>
                  <th>DEPARTMENT</th>
                  <th>DESIGNATION</th>
                  <th style={{ textAlign: 'right' }}>SALARY</th>
                  <th>JOINING</th>
                  <th style={{ textAlign: 'center' }}>STATUS</th>
                  <th className="action-column" style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading staff...</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No staff found</td></tr>
                ) : (
                  visible.map((s, i) => {
                    const active = s.is_active ?? s.status ?? true;
                    return (
                      <tr key={s.id || s.uuid || i}>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{i + 1}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          {s.image ? (
                            <img src={s.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {String(s.name || s.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{s.name || s.full_name}</td>
                        <td style={{ padding: '10px' }}>{s.phone || '-'}</td>
                        <td style={{ padding: '10px' }}>{s.email || '-'}</td>
                        <td style={{ padding: '10px' }}>{nameOf(s.department_name || s.department)}</td>
                        <td style={{ padding: '10px' }}>{nameOf(s.designation_name || s.designation)}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{s.salary !== undefined && s.salary !== null ? money(s.salary) : '-'}</td>
                        <td style={{ padding: '10px' }}>{fmtDate(s.joining_date || s.created_at)}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ background: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="action-column" style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button onClick={() => navigate(`/staff/edit/${s.id || s.uuid}`)} title="Edit" style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(s)} title="Delete" style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffList;
