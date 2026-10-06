import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, KeyRound, Shield, X, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import authApi from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { toList, fmtDate } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Users, roles & permissions → /api/auth/users/, /api/auth/register/,
 * /api/auth/users/{id}/permissions/, /api/auth/admin-change-password/{id}/
 */
const ROLES = ['superadmin', 'admin', 'manager', 'staff'];

// Permission matrix offered in the UI (module → actions)
const MODULES = [
  { id: 'dashboard', name: 'Dashboard', depth: 0 },
  
  { id: 'crm', name: 'Crm', depth: 0 },
  { id: 'crm_client_add', name: 'CLIENT CREATE', depth: 1 },
  { id: 'crm_client_list', name: 'CUSTOMER LIST', depth: 1 },
  { id: 'crm_client_group', name: 'Client Group', depth: 1 },
  { id: 'crm_client_statement', name: 'Client Statement', depth: 1 },
  { id: 'crm_due_collection', name: 'বাকি সংগ্রহের তারিখ', depth: 1 },
  { id: 'crm_supplier_add', name: 'SUPPLIER CREATE', depth: 1 },
  { id: 'crm_supplier_list', name: 'SUPPLIER LIST', depth: 1 },
  { id: 'crm_supplier_group', name: 'Supplier Group', depth: 1 },
  { id: 'crm_supplier_statement', name: 'Supplier Statement', depth: 1 },
  { id: 'crm_supplier_cheque', name: 'SUPPLIER CHEQUE SCHEDULE', depth: 1 },
  
  { id: 'account', name: 'Account', depth: 0 },
  { id: 'acc_receive_add', name: 'Receive Add New', depth: 1 },
  { id: 'acc_receive_list', name: 'Receive List', depth: 1 },
  { id: 'acc_expense_add', name: 'Expense Add New', depth: 1 },
  { id: 'acc_expense_list', name: 'Expense List', depth: 1 },
  { id: 'acc_supplier_pay', name: 'Supplier Payment', depth: 1 },
  { id: 'acc_money_return', name: 'Money Return', depth: 1 },
  { id: 'acc_money_return_list', name: 'Money Return List', depth: 1 },
  { id: 'acc_account_create', name: 'Account Create', depth: 1 },
  { id: 'acc_account_list', name: 'Account List', depth: 1 },
  { id: 'acc_account_balance', name: 'Account Balance', depth: 1 },
  { id: 'acc_statement', name: 'Statement', depth: 1 },
  { id: 'acc_transfer_create', name: 'Transfer Create', depth: 1 },
  { id: 'acc_transfer_list', name: 'Transfer List', depth: 1 },
  { id: 'acc_profit', name: 'Profit', depth: 1 },
  
  { id: 'loan', name: 'Loan', depth: 0 },
  { id: 'loan_client_add', name: 'Add New Client', depth: 1 },
  { id: 'loan_client_list', name: 'Client List', depth: 1 },
  { id: 'loan_receive', name: 'Loan Receive', depth: 1 },
  { id: 'loan_payment', name: 'Loan Payment', depth: 1 },
  { id: 'loan_statement', name: 'Loan Statement', depth: 1 },
  
  { id: 'invoice', name: 'Invoice', depth: 0 },
  { id: 'inv_add', name: 'Add New', depth: 1 },
  { id: 'inv_list', name: 'Invoice List', depth: 1 },
  { id: 'inv_draft', name: 'Draft Invoice', depth: 1 },
  { id: 'inv_return_add', name: 'Add Return', depth: 1 },
  { id: 'inv_return_list', name: 'Return List', depth: 1 },
  
  { id: 'product', name: 'Product', depth: 0 },
  { id: 'prod_create', name: 'Product Create', depth: 1 },
  { id: 'prod_list', name: 'Product List', depth: 1 },
  { id: 'prod_group', name: 'Product Group', depth: 1 },
  { id: 'prod_unit', name: 'Product Unit', depth: 1 },
  { id: 'prod_barcode', name: 'Product Barcode', depth: 1 },
  { id: 'prod_stock', name: 'Product Stock', depth: 1 },
  
  { id: 'purchase', name: 'Purchase', depth: 0 },
  { id: 'pur_add', name: 'Purchase Create', depth: 1 },
  { id: 'pur_list', name: 'Purchase List', depth: 1 },
  { id: 'pur_report', name: 'Purchase Report', depth: 1 },
  { id: 'pur_ret_add', name: 'Purchase Return Create', depth: 1 },
  { id: 'pur_ret_list', name: 'Purchase Return List', depth: 1 },
  { id: 'pur_ret_report', name: 'Purchase Return Report', depth: 1 },
  
  { id: 'sms', name: 'Sms', depth: 0 },
  { id: 'sms_customer', name: 'Customer', depth: 1 },
  { id: 'sms_customer_group', name: 'Customer Group', depth: 1 },
  { id: 'sms_schedule', name: 'SMS Schedule', depth: 1 },
  { id: 'sms_report', name: 'Schedule Report', depth: 1 },
  
  { id: 'staff', name: 'Staff', depth: 0 },
  { id: 'staff_create', name: 'Staff Create', depth: 1 },
  { id: 'staff_list', name: 'Staff List', depth: 1 },
  { id: 'staff_pay_create', name: 'Payment Create', depth: 1 },
  { id: 'staff_pay_report', name: 'Payment Report', depth: 1 },
  { id: 'staff_sal_create', name: 'Add Salary', depth: 1 },
  { id: 'staff_sal_report', name: 'Salary Report', depth: 1 },
  { id: 'staff_att_create', name: 'Attendance Create', depth: 1 },
  { id: 'staff_att_report', name: 'Attendance Report', depth: 1 },
  { id: 'staff_att_monthly', name: 'Monthly Attendance Report', depth: 1 },
  
  { id: 'reports', name: 'Reports', depth: 0 },
  { id: 'due_list', name: 'Due List', depth: 1 },
  { id: 'due_client', name: 'Due Client Wise', depth: 1 },
  { id: 'due_group', name: 'Due Group Wise', depth: 1 },
  { id: 'due_supplier', name: 'Supplier Due', depth: 1 },
  { id: 'sales_daily', name: 'Sales Daily', depth: 1 },
  { id: 'sales_all', name: 'Sales All', depth: 1 },
  { id: 'sales_group', name: 'Sales Group Wise', depth: 1 },
  { id: 'sales_product', name: 'Sales Product Wise', depth: 1 },
  { id: 'sales_prod_group', name: 'Sales Product Group Wise', depth: 1 },
  { id: 'dep_all', name: 'All Deposit', depth: 1 },
  { id: 'dep_cat', name: 'Deposit Category Wise', depth: 1 },
  { id: 'dep_client', name: 'Deposit Customer Wise', depth: 1 },
  { id: 'exp_all', name: 'All Expense', depth: 1 },
  { id: 'exp_cat', name: 'Expense Category Wise', depth: 1 },
  { id: 'exp_supplier', name: 'Expense Supplier Purchase Payment', depth: 1 },
  
  { id: 'settings', name: 'Settings', depth: 0 },
  { id: 'set_general', name: 'General Settings', depth: 1 },
  { id: 'set_income_cat', name: 'Income Category', depth: 1 },
  { id: 'set_income_subcat', name: 'Income Subcategory', depth: 1 },
  { id: 'set_expense_cat', name: 'Expense Category', depth: 1 },
  { id: 'set_expense_subcat', name: 'Expense Subcategory', depth: 1 },
  { id: 'set_shortcut', name: 'Shortcut Menu', depth: 1 },
  { id: 'set_payment_method', name: 'Payment Method', depth: 1 },
  { id: 'set_company_info', name: 'Company Information', depth: 1 },
  { id: 'set_bank_list', name: 'Bank List', depth: 1 },
  { id: 'set_users', name: 'Users & Permissions', depth: 1 },
];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

const input = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' };
const lbl = { display: 'block', marginBottom: '6px', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', fontWeight: 600 };

const Modal = ({ title, onClose, children, width = 520 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
    <div style={{ background: 'white', borderRadius: '8px', width, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', color: 'var(--text-main)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  </div>
);

const emptyUser = { username: '', password: '', full_name: '', email: '', phone: '', role: 'staff', is_active: true };

const UserManagement = () => {
  const { t } = useTranslation();
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
      toast.error(e.message || t("Failed to load users"));
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
    if (!u.username?.trim()) return toast.error(t("Username is required"));
    if (!u.id && !u.password) return toast.error(t("Password is required for a new user"));
    try {
      setSaving(true);
      if (u.id) {
        const { id, password, ...rest } = u;
        await authApi.updateUser(id, rest);
        toast.success(t("User updated"));
      } else {
        await authApi.registerUser(u);
        toast.success(t("User created"));
      }
      setUserModal(null);
      load();
    } catch (e) {
      toast.error(e.message || t("Failed to save user"));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (u) => {
    const isOk = await confirm({
      title: t("Delete User"),
      message: t("Are you sure you want to delete user \"{{v0}}\"?", { v0: u.username }),
      confirmText: t("Delete"),
      variant: 'danger',
    });
    if (!isOk) return;
    try {
      await authApi.deleteUser(u.id || u.uuid);
      toast.success(t("User deleted"));
      load();
    } catch (e) {
      toast.error(e.message || t("Delete failed"));
    }
  };

  const savePassword = async () => {
    if (!pwdModal.password || pwdModal.password.length < 6) return toast.error(t("Password must be at least 6 characters"));
    try {
      setSaving(true);
      await authApi.adminChangeUserPassword(pwdModal.id, { new_password: pwdModal.password });
      toast.success(t("Password changed"));
      setPwdModal(null);
    } catch (e) {
      toast.error(e.message || t("Failed to change password"));
    } finally {
      setSaving(false);
    }
  };

  const openPerms = (u) => {
    const raw = u.custom_permissions || u.permissions || {};
    const perms = {};
    MODULES.forEach((mod) => {
      perms[mod.id] = {};
      ACTIONS.forEach((a) => { perms[mod.id][a] = !!(raw?.[mod.id]?.[a] ?? raw?.[`${mod.id}_${a}`] ?? false); });
    });
    setPermModal({ id: u.id || u.uuid, username: u.username, perms });
  };

  const savePerms = async () => {
    try {
      setSaving(true);
      await authApi.updateUserPermissions(permModal.id, { custom_permissions: permModal.perms });
      toast.success(t("Permissions updated"));
      setPermModal(null);
      load();
    } catch (e) {
      toast.error(e.message || t("Failed to update permissions"));
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (mId, a) => {
    setPermModal((p) => {
      const nextState = !p.perms[mId][a];
      const nextPerms = { ...p.perms, [mId]: { ...p.perms[mId], [a]: nextState } };
      
      const isParent = MODULES.find(mod => mod.id === mId)?.depth === 0;
      if (isParent) {
        const parentIndex = MODULES.findIndex(mod => mod.id === mId);
        for (let i = parentIndex + 1; i < MODULES.length; i++) {
          if (MODULES[i].depth === 0) break;
          nextPerms[MODULES[i].id] = { ...nextPerms[MODULES[i].id], [a]: nextState };
        }
      }
      return { ...p, perms: nextPerms };
    });
  };

  const toggleModule = (mId, v) => {
    setPermModal((p) => {
      const nextPerms = { ...p.perms };
      nextPerms[mId] = Object.fromEntries(ACTIONS.map((a) => [a, v]));
      
      const isParent = MODULES.find(mod => mod.id === mId)?.depth === 0;
      if (isParent) {
        const parentIndex = MODULES.findIndex(mod => mod.id === mId);
        for (let i = parentIndex + 1; i < MODULES.length; i++) {
          if (MODULES[i].depth === 0) break;
          nextPerms[MODULES[i].id] = Object.fromEntries(ACTIONS.map((a) => [a, v]));
        }
      }
      return { ...p, perms: nextPerms };
    });
  };

  const filteredUsers = users.filter((u) => (u.role || '').toLowerCase() !== 'staff');
  const visible = filteredUsers.slice(0, entries);
  const excelData = visible.map((u, i) => ({ SL: i + 1, Username: u.username, Name: u.full_name || '', Email: u.email || '', Phone: u.phone || '', Role: u.role || '', Active: u.is_active === false ? 'No' : 'Yes', Created: fmtDate(u.created_at || u.date_joined) }));
  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex' });

  if (permModal) {
    const cell = { padding: '10px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' };
    const th = { ...cell, background: '#f8fafc', fontWeight: 600, color: '#334155', textAlign: 'center' };

    return (
      <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
        <div className="premium-card">
          <div className="premium-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} />
              </div>
              <div>
                <h2 className="premium-title" style={{ fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', margin: 0 }}>{t("Access Permissions")}</h2>
                <p style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b', margin: '2px 0 0 0' }}>{t("Managing access for")}: <span style={{ fontWeight: 600, color: '#0f172a' }}>{permModal.username}</span></p>
              </div>
            </div>
            <button type="button" onClick={() => setPermModal(null)} style={{ background: '#f1f5f9', color: '#475569', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 500 }}>
              <ArrowLeft size={16} /> {t("Back")}
            </button>
          </div>

          <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
            <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: 'left', width: '30%' }}>{t("Module & Screens")}</th>
                    {ACTIONS.map(action => (
                      <th key={action} style={th}>
                        <span style={{textTransform: 'capitalize'}}>{t(action)}</span>
                      </th>
                    ))}
                    <th style={th}>{t("All")}</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod, index) => {
                    const allSelected = ACTIONS.every(a => permModal.perms[mod.id]?.[a]);
                    
                    return (
                      <tr key={mod.id} style={{ background: mod.depth === 0 ? '#f1f5f9' : 'white' }} className="hover-row">
                        <td style={{ ...cell, fontWeight: mod.depth === 0 ? 700 : 500, color: mod.depth === 0 ? '#0f172a' : '#475569', paddingLeft: mod.depth === 0 ? '16px' : '36px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {mod.depth === 1 && <span style={{ color: '#cbd5e1' }}>↳</span>}
                            {mod.name}
                          </div>
                        </td>
                        
                        {ACTIONS.map(action => (
                          <td key={action} style={{ ...cell, textAlign: 'center' }}>
                            <button 
                              onClick={() => togglePerm(mod.id, action)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            >
                              {permModal.perms[mod.id]?.[action] ? 
                                <div style={{ color: '#007bff' }}><CheckSquare size={18} fill="#007bff" color="white" /></div> : 
                                <div style={{ color: '#cbd5e1' }}><Square size={18} /></div>
                              }
                            </button>
                          </td>
                        ))}
                        
                        <td style={{ ...cell, textAlign: 'center' }}>
                          <button 
                              onClick={(e) => toggleModule(mod.id, !allSelected)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {allSelected ? <CheckSquare size={18} fill="#007bff" color="white" /> : <Square size={18} color="#cbd5e1" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setPermModal(null)} style={{ background: 'white', color: '#475569', padding: '10px 24px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 600, cursor: 'pointer' }}>{t("Cancel")}</button>
              <button onClick={savePerms} disabled={saving} style={{ background: '#007bff', color: 'white', padding: '10px 32px', border: 'none', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>{saving ? t("Saving...") : t("Save Permissions")}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', padding: '24px' }}>
        <PrintHeader />
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-18, 18px)', color: 'var(--text-main)', margin: 0 }}>{t("Users, Roles & Permissions")}</h2>
            <span style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>{t("Only admin / superadmin can manage users. Permissions require superadmin.")}</span>
          </div>
          <button onClick={() => setUserModal({ ...emptyUser })} style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> {t("Add User")}
          </button>
        </div>

        <TableToolbar entries={entries} setEntries={setEntries} total={filteredUsers.length} excelData={excelData} excelName="Users" onReload={load} />

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', fontSize: 'var(--fs-12, 12px)' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
                <th style={{ width: '50px', textAlign: 'center', padding: '10px' }}>{t("SL")}</th>
                <th style={{ padding: '10px' }}>{t("USERNAME")}</th>
                <th style={{ padding: '10px' }}>{t("FULL NAME")}</th>
                <th style={{ padding: '10px' }}>{t("PHONE")}</th>
                <th style={{ padding: '10px' }}>{t("E-MAIL")}</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>{t("ROLE")}</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>{t("STATUS")}</th>
                <th style={{ padding: '10px' }}>{t("CREATED")}</th>
                <th className="action-column" style={{ padding: '10px', textAlign: 'center', width: '170px' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("Loading users...")}</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{t("No users found")}</td></tr>
              ) : visible.map((u, i) => (
                <tr key={u.id || u.uuid || i}>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{i + 1}</td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '10px' }}>{u.full_name || '-'}</td>
                  <td style={{ padding: '10px' }}>{u.phone || '-'}</td>
                  <td style={{ padding: '10px' }}>{u.email || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', textTransform: 'uppercase' }}>{u.role || '-'}</span></td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ background: u.is_active === false ? '#fee2e2' : '#dcfce7', color: u.is_active === false ? '#991b1b' : '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold' }}>{u.is_active === false ? t("Inactive") : t("Active")}</span>
                  </td>
                  <td style={{ padding: '10px' }}>{fmtDate(u.created_at || u.date_joined)}</td>
                  <td className="action-column" style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button title={t("Edit")} onClick={() => setUserModal({ id: u.id || u.uuid, username: u.username, full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', role: u.role || 'staff', is_active: u.is_active !== false })} style={btn('var(--info)')}><Pencil size={14} /></button>
                      <button title={t("Change password")} onClick={() => setPwdModal({ id: u.id || u.uuid, username: u.username, password: '' })} style={btn('#f59e0b')}><KeyRound size={14} /></button>
                      <button title={t("Permissions")} onClick={() => openPerms(u)} style={btn('#8b5cf6')}><Shield size={14} /></button>
                      <button title={t("Delete")} onClick={() => deleteUser(u)} style={btn('var(--danger)')}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userModal && (
        <Modal title={userModal.id ? t("Edit User") : t("Add User")} onClose={() => setUserModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={lbl}>{t("Username *")}</label><input value={userModal.username} disabled={!!userModal.id} onChange={(e) => setUserModal({ ...userModal, username: e.target.value })} style={input} /></div>
            {!userModal.id && <div><label style={lbl}>{t("Password *")}</label><input type="password" value={userModal.password} onChange={(e) => setUserModal({ ...userModal, password: e.target.value })} style={input} /></div>}
            <div><label style={lbl}>{t("Full Name")}</label><input value={userModal.full_name} onChange={(e) => setUserModal({ ...userModal, full_name: e.target.value })} style={input} /></div>
            <div><label style={lbl}>{t("Phone")}</label><input value={userModal.phone} onChange={(e) => setUserModal({ ...userModal, phone: e.target.value })} style={input} /></div>
            <div><label style={lbl}>{t("E-mail")}</label><input type="email" value={userModal.email} onChange={(e) => setUserModal({ ...userModal, email: e.target.value })} style={input} /></div>
            <div>
              <label style={lbl}>{t("Role")}</label>
              <select value={userModal.role} onChange={(e) => setUserModal({ ...userModal, role: e.target.value })} style={input}>
                {ROLES.filter((r) => isSuper || r !== 'superadmin').map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{t("Status")}</label>
              <select value={userModal.is_active ? '1' : '0'} onChange={(e) => setUserModal({ ...userModal, is_active: e.target.value === '1' })} style={input}>
                <option value="1">{t("Active")}</option><option value="0">{t("Inactive")}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setUserModal(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Cancel")}</button>
            <button onClick={saveUser} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{saving ? t("Saving...") : t("Save")}</button>
          </div>
        </Modal>
      )}

      {pwdModal && (
        <Modal title={t("Change password — {{v0}}", { v0: pwdModal.username })} onClose={() => setPwdModal(null)} width={400}>
          <label style={lbl}>{t("New Password")}</label>
          <input type="password" value={pwdModal.password} onChange={(e) => setPwdModal({ ...pwdModal, password: e.target.value })} style={input} autoFocus />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setPwdModal(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Cancel")}</button>
            <button onClick={savePassword} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{saving ? t("Saving...") : t("Change")}</button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default UserManagement;
