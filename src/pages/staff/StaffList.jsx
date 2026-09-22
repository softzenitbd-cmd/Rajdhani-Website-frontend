import React, { useEffect, useState } from 'react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { getUserList } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { toList, fmtDate, nameOf, money } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';

// status is the string 'active' | 'inactive' (older rows may carry a boolean)
const isActive = (s) => (typeof s.status === 'string' ? s.status.toLowerCase() === 'active' : (s.is_active ?? s.status ?? true));

const StaffList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [openActionId, setOpenActionId] = useState(null);

  const load = async (params = { search, department }) => {
    try {
      setLoading(true);
      const filters = {};
      if (params.search) filters.search = params.search;
      if (params.department) filters.department = params.department;
      filters.page = currentPage;
      filters.page_size = limit;
      const res = await staffApi.getStaffList(filters);
      const dataList = toList(res);
      setRows(dataList);
      setTotalCount(res.count || dataList.length);
    } catch (e) {
      toast.error(e.message || t("Failed to load staff"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    staffApi.getDepartments().then((r) => setDepartments(toList(r))).catch(() => {});
  }, [currentPage, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStaffName = (s) => {
    if (!s) return 'Unknown';
    const u = s.user_details || s.user || {};
    const name = s.full_name || u.full_name || s.name || s.username || u.username || `${s.first_name || u.first_name || ''} ${s.last_name || u.last_name || ''}`.trim();
    return name || 'Staff';
  };
  
  const getStaffEmail = (s) => {
    const u = s.user_details || s.user || {};
    return s.email || u.email || '-';
  };
  
  const getStaffPhone = (s) => {
    const u = s.user_details || s.user || {};
    return s.phone_number || s.phone || u.phone_number || u.phone || '-';
  };

  const handleDelete = async (row) => {
    const rid = row.id || row.uuid;
    const isOk = await confirm({
      title: t("Delete Staff"),
      message: t("Delete staff \"{{v0}}\"?", { v0: row.name || row.full_name }),
      confirmText: t("Delete"),
      variant: 'danger',
    });
    if (!isOk) return;
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
    setCurrentPage(1);
    load({ search: '', department: '' });
  };

  const visible = rows;
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
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold' }}>{t("Staff List")}</h2>
          <button onClick={() => navigate('/staff/create')} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> {t("Add Staff")}
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <form
            className="no-print filter-grid"
            onSubmit={(e) => { e.preventDefault(); load(); }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'end' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' }}>{t("Search (name / phone)")}</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search...")} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, marginBottom: '6px', color: 'var(--label-color)' }}>{t("Department")}</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #38bdf8', borderRadius: '6px', outline: 'none' }}>
                <option value="">{t("All departments")}</option>
                {departments.map((d) => <option key={d.id || d.uuid} value={d.id || d.uuid}>{d.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <Search size={14} /> {t("Filter")}
            </button>
          </form>

          <TableToolbar total={totalCount} excelData={excelData} excelName="Staff_List" onReload={() => load()} onReset={reset} />

          {/* Table View */}
          <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)' }}>
              <thead>
                <tr style={{ background: '#718096', color: 'white' }}>
                  <th style={{ width: '40px', textAlign: 'center', padding: '8px 4px' }}>{t("SL")}</th>
                  <th style={{ padding: '8px 6px' }}>{t("NAME")}</th>
                  <th style={{ padding: '8px 6px' }}>{t("PHONE NUMBER")}</th>
                  <th style={{ padding: '8px 6px' }}>{t("EMAIL")}</th>
                  <th style={{ padding: '8px 6px' }}>{t("PASSWORD")}</th>
                  <th style={{ padding: '8px 6px' }}>{t("ROLE")}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>{t("PERMISSION")}</th>
                  <th style={{ padding: '8px 6px' }}>{t("CREATED AT")}</th>
                  <th className="action-column" style={{ textAlign: 'center', padding: '8px 4px' }}>{t("ACTION")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading staff...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No staff found")}</td></tr>
                ) : (
                  visible.map((s, i) => {
                    const sid = s.id || s.uuid;
                    const globalIndex = (currentPage - 1) * limit + i + 1;
                    return (
                      <tr key={sid || i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ textAlign: 'center', padding: '6px 4px' }}>{globalIndex}</td>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{getStaffName(s)}</td>
                        <td style={{ padding: '8px 6px' }}>{getStaffPhone(s)}</td>
                        <td style={{ padding: '8px 6px' }}>{getStaffEmail(s)}</td>
                        <td style={{ padding: '8px 6px' }}>{s.user_details?.username || '-'}</td>
                        <td style={{ padding: '8px 6px' }}>{nameOf(s.designation_name || s.designation_details || s.designation) || s.user_details?.role || '-'}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{t("Permissions")}</button>
                        </td>
                        <td style={{ padding: '8px 6px' }}>{fmtDate(s.created_at)}</td>
                        <td className="action-column" style={{ padding: '6px', textAlign: 'center', position: 'relative' }}>
                          <button 
                            onClick={() => setOpenActionId(openActionId === sid ? null : sid)} 
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto', fontSize: 'var(--fs-12, 12px)' }}
                          >
                            {t("Action")} <span style={{ fontSize: '8px' }}>▼</span>
                          </button>
                          {openActionId === sid && (
                            <div style={{ position: 'absolute', top: '100%', right: '50%', transform: 'translateX(50%)', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '130px', textAlign: 'left', padding: '4px 0' }}>
                              <div style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }} onMouseOver={e=>e.target.style.background='#f1f5f9'} onMouseOut={e=>e.target.style.background='white'}>{t("Assign Role")}</div>
                              <div style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }} onMouseOver={e=>e.target.style.background='#f1f5f9'} onMouseOut={e=>e.target.style.background='white'}>{t("Assign Permission")}</div>
                              <div onClick={() => { setOpenActionId(null); navigate(`/staff/edit/${sid}`, { state: { staffData: s } }); }} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }} onMouseOver={e=>e.target.style.background='#f1f5f9'} onMouseOut={e=>e.target.style.background='white'}>{t("Edit")}</div>
                              <div onClick={() => { setOpenActionId(null); handleDelete(s); }} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)' }} onMouseOver={e=>e.target.style.background='#f1f5f9'} onMouseOut={e=>e.target.style.background='white'}>{t("Delete")}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={totalCount}
            pageSize={limit}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default StaffList;
