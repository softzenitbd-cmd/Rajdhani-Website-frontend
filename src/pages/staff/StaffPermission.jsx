import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

// Exhaustive list of modules and their child screens
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

// Permission actions
const ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

const StaffPermission = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams(); // Staff ID
  const location = useLocation();
  const toast = useToast();

  const [staffData, setStaffData] = useState(location.state?.staffData || null);
  const [permissions, setPermissions] = useState({}); // { moduleId: { view: true, create: false, ... } }
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!staffData);

  // Initialize permissions
  useEffect(() => {
    const initPerms = {};
    MODULES.forEach(mod => {
      initPerms[mod.id] = { view: false, create: false, edit: false, delete: false };
    });
    // In real app, fetch existing permissions here and merge
    setPermissions(initPerms);

    if (!staffData && id) {
      staffApi.getStaff(id).then(res => {
        setStaffData(res);
        setLoading(false);
      }).catch(err => {
        toast.error(t("Failed to load staff details"));
        setLoading(false);
      });
    }
  }, [id, staffData, t, toast]);

  const handleToggle = (moduleId, action) => {
    setPermissions(prev => {
      const isParent = MODULES.find(m => m.id === moduleId)?.depth === 0;
      const nextState = !prev[moduleId][action];
      
      const nextPerms = { ...prev };
      
      // Update the clicked item
      nextPerms[moduleId] = {
        ...nextPerms[moduleId],
        [action]: nextState
      };

      // If a parent group (depth: 0) is toggled, also toggle all its children for that action
      if (isParent) {
        const parentIndex = MODULES.findIndex(m => m.id === moduleId);
        for (let i = parentIndex + 1; i < MODULES.length; i++) {
          if (MODULES[i].depth === 0) break; // Stop when hitting next parent
          nextPerms[MODULES[i].id] = {
            ...nextPerms[MODULES[i].id],
            [action]: nextState
          };
        }
      }

      return nextPerms;
    });
  };

  const handleToggleRow = (moduleId) => {
    setPermissions(prev => {
      const current = prev[moduleId];
      const allSelected = ACTIONS.every(a => current[a.key]);
      const nextState = !allSelected;
      const nextRow = {};
      ACTIONS.forEach(a => nextRow[a.key] = nextState);
      
      const nextPerms = { ...prev };
      nextPerms[moduleId] = nextRow;

      const isParent = MODULES.find(m => m.id === moduleId)?.depth === 0;
      if (isParent) {
        const parentIndex = MODULES.findIndex(m => m.id === moduleId);
        for (let i = parentIndex + 1; i < MODULES.length; i++) {
          if (MODULES[i].depth === 0) break;
          const childRow = {};
          ACTIONS.forEach(a => childRow[a.key] = nextState);
          nextPerms[MODULES[i].id] = childRow;
        }
      }

      return nextPerms;
    });
  };

  const handleToggleColumn = (action) => {
    setPermissions(prev => {
      const allSelected = MODULES.every(m => prev[m.id][action]);
      const nextState = !allSelected;
      const nextPerms = { ...prev };
      MODULES.forEach(m => {
        nextPerms[m.id] = { ...nextPerms[m.id], [action]: nextState };
      });
      return nextPerms;
    });
  };

  const handleSelectAll = () => {
    setPermissions(prev => {
      let allTrue = true;
      MODULES.forEach(m => {
        ACTIONS.forEach(a => {
          if (!prev[m.id][a.key]) allTrue = false;
        });
      });

      const nextState = !allTrue;
      const nextPerms = {};
      MODULES.forEach(m => {
        nextPerms[m.id] = { view: nextState, create: nextState, edit: nextState, delete: nextState };
      });
      return nextPerms;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        staff_id: id,
        permissions: permissions
      };
      
      console.log('Saving permissions payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 800));

      toast.success(t("Permissions updated successfully"));
      navigate('/staff/list');
    } catch (err) {
      toast.error(err.message || t("Failed to save permissions"));
    } finally {
      setSaving(false);
    }
  };

  const getStaffName = () => {
    if (!staffData) return '...';
    return staffData.full_name || staffData.name || staffData.user_details?.full_name || 'Staff';
  };

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
              <p style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b', margin: '2px 0 0 0' }}>{t("Managing access for")}: <span style={{ fontWeight: 600, color: '#0f172a' }}>{getStaffName()}</span></p>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/staff/list')} style={{ background: '#f1f5f9', color: '#475569', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 500 }}>
            <ArrowLeft size={16} /> {t("Back to Staff")}
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>{t("Loading...")}</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button 
                  onClick={handleSelectAll}
                  style={{ background: 'transparent', color: '#4f46e5', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', fontWeight: 600 }}
                >
                  <CheckSquare size={16} /> {t("Select / Deselect All")}
                </button>
              </div>

              <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: 'left', width: '30%' }}>{t("Module & Screens")}</th>
                      {ACTIONS.map(action => (
                        <th key={action.key} style={th}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span>{t(action.label)}</span>
                            <button 
                              onClick={() => handleToggleColumn(action.key)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}
                              title={t("Toggle all")}
                            >
                              {MODULES.every(m => permissions[m.id]?.[action.key]) ? 
                                <CheckSquare size={16} color="#4f46e5" /> : 
                                <Square size={16} />}
                            </button>
                          </div>
                        </th>
                      ))}
                      <th style={th}>{t("All")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((mod, index) => {
                      const allSelected = ACTIONS.every(a => permissions[mod.id]?.[a.key]);
                      
                      return (
                        <tr key={mod.id} style={{ background: mod.depth === 0 ? '#f1f5f9' : 'white' }} className="hover-row">
                          <td style={{ ...cell, fontWeight: mod.depth === 0 ? 700 : 500, color: mod.depth === 0 ? '#0f172a' : '#475569', paddingLeft: mod.depth === 0 ? '16px' : '36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {mod.depth === 1 && <span style={{ color: '#cbd5e1' }}>↳</span>}
                              {t(mod.name)}
                            </div>
                          </td>
                          
                          {ACTIONS.map(action => (
                            <td key={action.key} style={{ ...cell, textAlign: 'center' }}>
                              <button 
                                onClick={() => handleToggle(mod.id, action.key)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                              >
                                {permissions[mod.id]?.[action.key] ? 
                                  <div style={{ color: '#007bff' }}><CheckSquare size={18} fill="#007bff" color="white" /></div> : 
                                  <div style={{ color: '#cbd5e1' }}><Square size={18} /></div>
                                }
                              </button>
                            </td>
                          ))}
                          
                          <td style={{ ...cell, textAlign: 'center' }}>
                            <button 
                                onClick={() => handleToggleRow(mod.id)}
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
                <button 
                  onClick={() => navigate('/staff/list')}
                  style={{ background: 'white', color: '#475569', padding: '10px 24px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t("Cancel")}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  style={{ background: '#007bff', color: 'white', padding: '10px 32px', border: 'none', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? t("Saving...") : t("Save Permissions")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPermission;
