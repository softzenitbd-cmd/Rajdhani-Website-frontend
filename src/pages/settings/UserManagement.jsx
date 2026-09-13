import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, KeyRound, Shield, X } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import authApi from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { toList, fmtDate } from '../../utils/apiHelpers';

/**
 * Users, roles & permissions → /api/auth/users/, /api/auth/register/,
 * /api/auth/users/{id}/permissions/, /api/auth/admin-change-password/{id}/
 */
const ROLES = ['superadmin', 'admin', 'manager', 'staff'];

// Permission matrix offered in the UI (module → actions)
const MODULES = ['dashboard', 'crm', 'account', 'loan', 'invoice', 'product', 'purchase', 'sms', 'staff', 'reports', 'settings'];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

const input = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' };
const lbl = { display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--label-color)', fontWeight: 600 };

const Modal = ({ title, onClose, children, width = 520 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
    <div style={{ background: 'white', borderRadius: '8px', width, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  </div>
);

const emptyUser = { username: '', password: '', full_name: '', email: '', phone: '', role: 'staff', is_active: true };

const UserManagement = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const location = useLocation();
  const myRole = (localStorage.getItem('role') || '').toLowerCase();
  const isSuper = myRole === 'superadmin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(50);
  const [userModal, setUserModal] = useState(null);       // {id?, ...fields}
  const [pwdModal, setPwdModal] = useState(null);         // {id, username, password}
  const [permModal, setPermModal] = useState(null);       // {id, username, perms}
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(toList(await authApi.getUserList()));
    } catch (e) {
      toast.error(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (location.state?.openCreate) setUserModal({ ...emptyUser });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveUser = async () => {
    const u = userModal;
    if (!u.username?.trim()) return toast.error('Username is required');
    if (!u.id && !u.password) return toast.error('Password is required for a new user');
    try {
      setSaving(true);
      if (u.id) {
        const { id, password, ...rest } = u;
        await authApi.updateUser(id, rest);
        toast.success('User updated');
      } else {
        await authApi.registerUser(u);
        toast.success('User created');
      }
      setUserModal(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (u) => {
    const isOk = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user "${u.username}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isOk) return;
    try {
      await authApi.deleteUser(u.id || u.uuid);
      toast.success('User deleted');
      load();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const savePassword = async () => {
    if (!pwdModal.password || pwdModal.password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      setSaving(true);
      await authApi.adminChangeUserPassword(pwdModal.id, { new_password: pwdModal.password });
      toast.success('Password changed');
      setPwdModal(null);
    } catch (e) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const openPerms = (u) => {
    const raw = u.custom_permissions || u.permissions || {};
    const perms = {};
    MODULES.forEach((m) => {
      perms[m] = {};
      ACTIONS.forEach((a) => { perms[m][a] = !!(raw?.[m]?.[a] ?? raw?.[`${m}_${a}`] ?? false); });
    });
    setPermModal({ id: u.id || u.uuid, username: u.username, perms });
  };

  const savePerms = async () => {
    try {
      setSaving(true);
      await authApi.updateUserPermissions(permModal.id, { custom_permissions: permModal.perms });
      toast.success('Permissions updated');
      setPermModal(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (m, a) => setPermModal((p) => ({ ...p, perms: { ...p.perms, [m]: { ...p.perms[m], [a]: !p.perms[m][a] } } }));
  const toggleModule = (m, v) => setPermModal((p) => ({ ...p, perms: { ...p.perms, [m]: Object.fromEntries(ACTIONS.map((a) => [a, v])) } }));

  const visible = users.slice(0, entries);
  const excelData = visible.map((u, i) => ({ SL: i + 1, Username: u.username, Name: u.full_name || '', Email: u.email || '', Phone: u.phone || '', Role: u.role || '', Active: u.is_active === false ? 'No' : 'Yes', Created: fmtDate(u.created_at || u.date_joined) }));
  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex' });

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', padding: '24px' }}>
        <PrintHeader />
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>Users, Roles & Permissions</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Only admin / superadmin can manage users. Permissions require superadmin.</span>
          </div>
          <button onClick={() => setUserModal({ ...emptyUser })} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> Add User
          </button>
        </div>

        <TableToolbar entries={entries} setEntries={setEntries} total={users.length} excelData={excelData} excelName="Users" onReload={load} />

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
                <th style={{ width: '50px', textAlign: 'center', padding: '10px' }}>SL</th>
                <th style={{ padding: '10px' }}>USERNAME</th>
                <th style={{ padding: '10px' }}>FULL NAME</th>
                <th style={{ padding: '10px' }}>PHONE</th>
                <th style={{ padding: '10px' }}>E-MAIL</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>ROLE</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '10px' }}>CREATED</th>
                <th className="action-column" style={{ padding: '10px', textAlign: 'center', width: '170px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading users...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No users found</td></tr>
              ) : visible.map((u, i) => (
                <tr key={u.id || u.uuid || i}>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{i + 1}</td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '10px' }}>{u.full_name || '-'}</td>
                  <td style={{ padding: '10px' }}>{u.phone || '-'}</td>
                  <td style={{ padding: '10px' }}>{u.email || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{u.role || '-'}</span></td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ background: u.is_active === false ? '#fee2e2' : '#dcfce7', color: u.is_active === false ? '#991b1b' : '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{u.is_active === false ? 'Inactive' : 'Active'}</span>
                  </td>
                  <td style={{ padding: '10px' }}>{fmtDate(u.created_at || u.date_joined)}</td>
                  <td className="action-column" style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button title="Edit" onClick={() => setUserModal({ id: u.id || u.uuid, username: u.username, full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', role: u.role || 'staff', is_active: u.is_active !== false })} style={btn('var(--info)')}><Pencil size={14} /></button>
                      <button title="Change password" onClick={() => setPwdModal({ id: u.id || u.uuid, username: u.username, password: '' })} style={btn('#f59e0b')}><KeyRound size={14} /></button>
                      <button title="Permissions" onClick={() => openPerms(u)} style={btn('#8b5cf6')}><Shield size={14} /></button>
                      <button title="Delete" onClick={() => deleteUser(u)} style={btn('var(--danger)')}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userModal && (
        <Modal title={userModal.id ? 'Edit User' : 'Add User'} onClose={() => setUserModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={lbl}>Username *</label><input value={userModal.username} disabled={!!userModal.id} onChange={(e) => setUserModal({ ...userModal, username: e.target.value })} style={input} /></div>
            {!userModal.id && <div><label style={lbl}>Password *</label><input type="password" value={userModal.password} onChange={(e) => setUserModal({ ...userModal, password: e.target.value })} style={input} /></div>}
            <div><label style={lbl}>Full Name</label><input value={userModal.full_name} onChange={(e) => setUserModal({ ...userModal, full_name: e.target.value })} style={input} /></div>
            <div><label style={lbl}>Phone</label><input value={userModal.phone} onChange={(e) => setUserModal({ ...userModal, phone: e.target.value })} style={input} /></div>
            <div><label style={lbl}>E-mail</label><input type="email" value={userModal.email} onChange={(e) => setUserModal({ ...userModal, email: e.target.value })} style={input} /></div>
            <div>
              <label style={lbl}>Role</label>
              <select value={userModal.role} onChange={(e) => setUserModal({ ...userModal, role: e.target.value })} style={input}>
                {ROLES.filter((r) => isSuper || r !== 'superadmin').map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={userModal.is_active ? '1' : '0'} onChange={(e) => setUserModal({ ...userModal, is_active: e.target.value === '1' })} style={input}>
                <option value="1">Active</option><option value="0">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setUserModal(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveUser} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {pwdModal && (
        <Modal title={`Change password — ${pwdModal.username}`} onClose={() => setPwdModal(null)} width={400}>
          <label style={lbl}>New Password</label>
          <input type="password" value={pwdModal.password} onChange={(e) => setPwdModal({ ...pwdModal, password: e.target.value })} style={input} autoFocus />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setPwdModal(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={savePassword} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Change'}</button>
          </div>
        </Modal>
      )}

      {permModal && (
        <Modal title={`Permissions — ${permModal.username}`} onClose={() => setPermModal(null)} width={640}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Module</th>
                {ACTIONS.map((a) => <th key={a} style={{ padding: '8px', textTransform: 'capitalize' }}>{a}</th>)}
                <th style={{ padding: '8px' }}>All</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => {
                const all = ACTIONS.every((a) => permModal.perms[m][a]);
                return (
                  <tr key={m} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', textTransform: 'capitalize', fontWeight: 600 }}>{m}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} style={{ padding: '8px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!permModal.perms[m][a]} onChange={() => togglePerm(m, a)} />
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'center' }}><input type="checkbox" checked={all} onChange={(e) => toggleModule(m, e.target.checked)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setPermModal(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={savePerms} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Permissions'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
