import React, { useEffect, useState } from 'react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, fmtDate, nameOf, money } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

// status is the string 'active' | 'inactive' (older rows may carry a boolean)
const isActive = (s) => (typeof s.status === 'string' ? s.status.toLowerCase() === 'active' : (s.is_active ?? s.status ?? true));

const StaffList = () => {
  const { t } = useTranslation();
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
      toast.error(e.message || t("Failed to load staff"));
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
    if (!window.confirm(t("Delete staff \"{{v0}}\"?", { v0: row.name || row.full_name }))) return;
    try {
      await staffApi.deleteStaff(rid);
      toast.success(t("Staff deleted"));
      setRows((p) => p.filter((r) => (r.id || r.uuid) !== rid));
    } catch (e) {
      toast.error(e.message || t("Delete failed"));
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
    Name: s.full_name || s.user?.full_name || s.name,
    Phone: s.phone_number || s.user?.phone_number || s.phone || '-',
    Email: s.email || '-',
    Department: nameOf(s.department_name || s.department_details || s.department),
    Designation: nameOf(s.designation_name || s.designation_details || s.designation),
    Salary: s.basic_salary ?? s.salary ?? '',
    'Joining Date': fmtDate(s.joining_date),
    Status: isActive(s) ? 'Active' : 'Inactive',
  }));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>{t("Staff List")}</h2>
          <button onClick={() => navigate('/staff/create')} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> {t("Add Staff")}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' }}>{t("Search (name / phone)")}</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search...")} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' }}>{t("Department")}</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' }}>
                <option value="">{t("All departments")}</option>
                {departments.map((d) => <option key={d.id || d.uuid} value={d.id || d.uuid}>{d.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Search size={14} /> {t("Filter")}
            </button>
          </form>

          <TableToolbar entries={entries} setEntries={setEntries} total={rows.length} excelData={excelData} excelName="Staff_List" onReload={() => load()} onReset={reset} />

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>{t("SL")}</th>
                  <th style={{ textAlign: 'center' }}>{t("IMAGE")}</th>
                  <th>{t("NAME")}</th>
                  <th>{t("PHONE")}</th>
                  <th>{t("E-MAIL")}</th>
                  <th>{t("DEPARTMENT")}</th>
                  <th>{t("DESIGNATION")}</th>
                  <th style={{ textAlign: 'right' }}>{t("SALARY")}</th>
                  <th>{t("JOINING")}</th>
                  <th style={{ textAlign: 'center' }}>{t("STATUS")}</th>
                  <th className="action-column" style={{ textAlign: 'center' }}>{t("ACTION")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading staff...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No staff found")}</td></tr>
                ) : (
                  visible.map((s, i) => {
                    const active = isActive(s);
                    return (
                      <tr key={s.id || s.uuid || i}>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{i + 1}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          {(s.image || s.user?.image) ? (
                            <img src={s.image || s.user?.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {String(s.full_name || s.user?.full_name || s.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{s.full_name || s.user?.full_name || s.name}</td>
                        <td style={{ padding: '10px' }}>{s.phone_number || s.user?.phone_number || s.phone || '-'}</td>
                        <td style={{ padding: '10px' }}>{s.email || '-'}</td>
                        <td style={{ padding: '10px' }}>{nameOf(s.department_name || s.department_details || s.department)}</td>
                        <td style={{ padding: '10px' }}>{nameOf(s.designation_name || s.designation_details || s.designation)}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{(s.basic_salary ?? s.salary) !== undefined && (s.basic_salary ?? s.salary) !== null ? money(s.basic_salary ?? s.salary) : '-'}</td>
                        <td style={{ padding: '10px' }}>{fmtDate(s.joining_date || s.created_at)}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ background: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {active ? t("Active") : t("Inactive")}
                          </span>
                        </td>
                        <td className="action-column" style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button onClick={() => navigate(`/staff/edit/${s.id || s.uuid}`)} title={t("Edit")} style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(s)} title={t("Delete")} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
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
