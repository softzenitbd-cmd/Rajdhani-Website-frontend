import React, { useEffect, useState } from 'react';
import { List, User, Phone, Mail, MapPin, Banknote, Lock, Plus } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, today } from '../../utils/apiHelpers';
import AddOptionModal from '../../components/AddOptionModal';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../components/CustomDatePicker';


const inputStyle = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', boxSizing: 'border-box', display: 'block', height: '42px', fontSize: '13px' };
const labelStyle = { display: 'block', fontSize: 'var(--fs-12, 12px)', fontWeight: 600, color: 'var(--label-color)', marginBottom: '6px' };

const DEFAULT_DEPARTMENTS = [
  { id: 'Management', name: 'Management' },
  { id: 'Accounts', name: 'Accounts' },
  { id: 'Sales', name: 'Sales' },
  { id: 'Production', name: 'Production' },
  { id: 'HR', name: 'HR' },
  { id: 'Store', name: 'Store' },
  { id: 'IT', name: 'IT' },
  { id: 'General', name: 'General' },
];

const DEFAULT_DESIGNATIONS = [
  { id: 'Manager', name: 'Manager' },
  { id: 'Accountant', name: 'Accountant' },
  { id: 'Sales Executive', name: 'Sales Executive' },
  { id: 'Supervisor', name: 'Supervisor' },
  { id: 'Officer', name: 'Officer' },
  { id: 'Staff', name: 'Staff' },
  { id: 'Worker', name: 'Worker' },
];

const emptyForm = {
  full_name: '',
  phone_number: '',
  address: '',
  weekly_salary: '',
  monthly_salary: '',
  joining_date: today(),
  status: 'active',
};

const idOf = (v) => (v && typeof v === 'object' ? v.id ?? v.uuid ?? v.name ?? '' : v ?? '');

const StaffCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  
  const staffDataState = location.state?.staffData;

  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [saving, setSaving] = useState(false);

  // Modal states for Quick Add
  const [addDeptModal, setAddDeptModal] = useState(false);
  const [addDesigModal, setAddDesigModal] = useState(false);

  const fetchPrerequisites = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        staffApi.getDepartments().catch(() => []),
        staffApi.getDesignations().catch(() => [])
      ]);

      const deptList = toList(deptRes);
      const desigList = toList(desigRes);

      // Merge API response with fallback options (removing duplicates by name)
      const mergedDepts = [...deptList];
      DEFAULT_DEPARTMENTS.forEach(def => {
        if (!mergedDepts.some(d => (d.name || d.title || d.department_name || '').toLowerCase() === def.name.toLowerCase())) {
          mergedDepts.push(def);
        }
      });

      const mergedDesigs = [...desigList];
      DEFAULT_DESIGNATIONS.forEach(def => {
        if (!mergedDesigs.some(d => (d.name || d.title || d.designation_name || '').toLowerCase() === def.name.toLowerCase())) {
          mergedDesigs.push(def);
        }
      });

      setDepartments(mergedDepts);
      setDesignations(mergedDesigs);
    } catch (err) {
      console.error('Error fetching prerequisites:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
      setDesignations(DEFAULT_DESIGNATIONS);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  // Edit mode: preload the staff record
  useEffect(() => {
    if (!id) return;
    
    const populateForm = async (s) => {
      if (!s) return;
      const user = s.user_details || s.user || {};
      
      setForm({
        full_name: s.full_name || user.full_name || s.name || '',
        phone_number: s.phone_number || user.phone_number || s.phone || '',
        address: s.address || user.address || '',
        weekly_salary: s.weekly_salary ?? '',
        monthly_salary: s.monthly_salary ?? s.basic_salary ?? s.salary ?? '',
        joining_date: s.joining_date ? String(s.joining_date).split('T')[0] : '',
        status: s.status === 'inactive' || s.status === false || s.status === 0 ? 'inactive' : 'active',
      });
      const img = s.image || user.image;
      if (img) setPreview(img);
    };

    if (staffDataState) {
      populateForm(staffDataState);
    } else {
      staffApi
        .getStaff(id)
        .then(populateForm)
        .catch((e) => toast.error(e?.message || t("Failed to load staff")));
    }
  }, [id, staffDataState]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAddDepartment = async (deptName) => {
    try {
      const res = await staffApi.createDepartment({ name: deptName });
      const newId = res?.id || res?.uuid || deptName;
      await fetchPrerequisites();
      set('department', newId);
    } catch (err) {
      // Fallback: add locally if API call is not configured
      const newObj = { id: deptName, name: deptName };
      setDepartments(prev => [...prev, newObj]);
      set('department', deptName);
    }
  };

  const handleAddDesignation = async (desigName) => {
    try {
      const res = await staffApi.createDesignation({ name: desigName });
      const newId = res?.id || res?.uuid || desigName;
      await fetchPrerequisites();
      set('designation', newId);
    } catch (err) {
      // Fallback: add locally if API call is not configured
      const newObj = { id: desigName, name: desigName };
      setDesignations(prev => [...prev, newObj]);
      set('designation', desigName);
    }
  };

  const isValidUuid = (val) => {
    if (!val) return false;
    const s = String(val).trim();
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s) || /^\d+$/.test(s);
  };

  const getValidDeptId = (deptVal) => {
    if (!deptVal) return null;
    if (isValidUuid(deptVal)) return deptVal;
    const found = departments.find(d => isValidUuid(d.id || d.uuid) && (d.name || d.title || d.department_name || '').toLowerCase() === String(deptVal).toLowerCase());
    return found ? (found.id || found.uuid) : null;
  };

  const getValidDesigId = (desigVal) => {
    if (!desigVal) return null;
    if (isValidUuid(desigVal)) return desigVal;
    const found = designations.find(d => isValidUuid(d.id || d.uuid) && (d.name || d.title || d.designation_name || '').toLowerCase() === String(desigVal).toLowerCase());
    return found ? (found.id || found.uuid) : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error(t("Staff full name is required"));
    if (!form.phone_number.trim()) return toast.error(t("Phone number is required"));
    
    

    try {
      setSaving(true);

      const deptId = getValidDeptId(form.department);
      const desigId = getValidDesigId(form.designation);

      const payloadData = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        address: form.address?.trim() || '',
        weekly_salary: form.weekly_salary === '' ? '0.00' : Number(form.weekly_salary).toFixed(2),
        monthly_salary: form.monthly_salary === '' ? '0.00' : Number(form.monthly_salary).toFixed(2),
        joining_date: form.joining_date || today(),
        status: form.status || 'active',
      };

      let payload;
      if (image) {
        payload = new FormData();
        Object.entries(payloadData).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) {
            payload.append(k, v);
          }
        });
        payload.append('image', image);
      } else {
        payload = payloadData;
      }

      if (id) {
        await staffApi.updateStaff(id, payload);
        toast.success(t("Staff updated successfully"));
      } else {
        await staffApi.createStaff(payload);
        toast.success(t("Staff added successfully"));
      }
      navigate('/staff/list');
    } catch (err) {
      console.error('Save staff error:', err);
      let msg = err.message || 'Failed to save staff';
      if (msg.includes('user_user_user_id_key')) {
        msg = 'Backend Database Error (500): user_id "A001" already exists on server. Please contact backend admin to fix the user_id sequence.';
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>{id ? t("EDIT STAFF") : t("STAFF CREATE")}</h2>
          <button type="button" onClick={() => navigate('/staff/list')} style={{ background: '#64748b', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <List size={14} /> {t("Staff List")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}><User size={12} /> {t("Full Name *")}</label>
              <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder={t("Staff full name")} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Phone size={12} /> {t("Phone *")}</label>
              <input value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} placeholder={t("01XXXXXXXXX")} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}><MapPin size={12} /> {t("Address")}</label>
              <textarea value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder={t("Staff address")} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            </div>
            
            <div>
              <label style={labelStyle}><Banknote size={12} /> {t("Weekly Salary")}</label>
              <input type="text" value={form.weekly_salary} onChange={(e) => set('weekly_salary', e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Banknote size={12} /> {t("Monthly Salary")}</label>
              <input type="text" value={form.monthly_salary} onChange={(e) => set('monthly_salary', e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t("Joining Date")}</label>
              <CustomDatePicker  value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t("Status")}</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputStyle}>
                <option value="active">{t("Active")}</option>
                <option value="inactive">{t("Inactive")}</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', background: 'var(--success)', color: 'white', padding: '14px', border: 'none', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? t("Saving...") : id ? t("Update Staff") : t("Add Staff")}
          </button>
        </form>
      </div>

      {/* Quick Add Modals */}
      <AddOptionModal
        isOpen={addDeptModal}
        onClose={() => setAddDeptModal(false)}
        onSave={handleAddDepartment}
        title={t("Add New Department")}
        label={t("Department Name")}
        placeholder={t("e.g. Sales / Accounts")}
      />

      <AddOptionModal
        isOpen={addDesigModal}
        onClose={() => setAddDesigModal(false)}
        onSave={handleAddDesignation}
        title={t("Add New Designation")}
        label={t("Designation Name")}
        placeholder={t("e.g. Senior Officer / Manager")}
      />
    </div>
  );
};

export default StaffCreate;

