import React, { useEffect, useState } from 'react';
import { List, User, Phone, Mail, MapPin, Banknote, Lock, Plus } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, today } from '../../utils/apiHelpers';
import AddOptionModal from '../../components/AddOptionModal';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from '../../components/CustomDatePicker';


const inputStyle = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' };
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
  username: '',
  password: '',
  full_name: '',
  phone_number: '',
  email: '',
  present_address: '',
  department: '',
  designation: '',
  basic_salary: '',
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
        username: s.username || user.username || '',
        password: '',
        full_name: s.full_name || user.full_name || s.name || '',
        phone_number: s.phone_number || user.phone_number || s.phone || '',
        email: s.email || user.email || '',
        present_address: s.present_address || user.present_address || s.address || '',
        department: idOf(s.department),
        designation: idOf(s.designation),
        basic_salary: s.basic_salary ?? s.salary ?? '',
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
    if (!id && !form.username.trim()) return toast.error(t("Username is required (used for staff login)"));
    if (!id && !form.password) return toast.error(t("Password is required for a new staff"));

    try {
      setSaving(true);

      const deptId = getValidDeptId(form.department);
      const desigId = getValidDesigId(form.designation);

      const payloadData = {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        email: form.email.trim(),
        basic_salary: form.basic_salary === '' ? '0.00' : Number(form.basic_salary).toFixed(2),
        joining_date: form.joining_date || today(),
        status: form.status || 'active',
      };

      if (form.present_address.trim()) {
        payloadData.present_address = form.present_address.trim();
      }
      if (deptId) {
        payloadData.department = deptId;
      }
      if (desigId) {
        payloadData.designation = desigId;
      }
      if (form.password) {
        payloadData.password = form.password;
      }

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
            <div>
              <label style={labelStyle}><Mail size={12} /> {t("Email")}</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t("optional")} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><User size={12} /> {t("Username")} {id ? '' : '*'}</label>
              <input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder={t("login username")} autoComplete="off" style={inputStyle} disabled={!!id} />
            </div>
            <div>
              <label style={labelStyle}><Lock size={12} /> {t("Password")} {id ? t("(leave blank to keep)") : '*'}</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={id ? '••••••••' : t("login password")} autoComplete="new-password" style={inputStyle} />
            </div>

            {/* Department with Quick Add */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{t("Department")}</label>
                <button
                  type="button"
                  onClick={() => setAddDeptModal(true)}
                  style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: 0 }}
                >
                  <Plus size={12} /> {t("Add New")}
                </button>
              </div>
              <select value={form.department} onChange={(e) => set('department', e.target.value)} style={inputStyle}>
                <option value="">{t("Select department")}</option>
                {departments.map((d, i) => {
                  const val = d.id || d.uuid || d.name;
                  const label = d.name || d.title || d.department_name || String(d);
                  return <option key={val || i} value={val}>{label}</option>;
                })}
              </select>
            </div>

            {/* Designation with Quick Add */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{t("Designation")}</label>
                <button
                  type="button"
                  onClick={() => setAddDesigModal(true)}
                  style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: 0 }}
                >
                  <Plus size={12} /> {t("Add New")}
                </button>
              </div>
              <select value={form.designation} onChange={(e) => set('designation', e.target.value)} style={inputStyle}>
                <option value="">{t("Select designation")}</option>
                {designations.map((d, i) => {
                  const val = d.id || d.uuid || d.name;
                  const label = d.name || d.title || d.designation_name || String(d);
                  return <option key={val || i} value={val}>{label}</option>;
                })}
              </select>
            </div>

            <div>
              <label style={labelStyle}><Banknote size={12} /> {t("Basic Salary")}</label>
              <input type="number" min="0" step="0.01" value={form.basic_salary} onChange={(e) => set('basic_salary', e.target.value)} placeholder="0.00" style={inputStyle} />
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
            <div>
              <label style={labelStyle}>{t("Photo")}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="file" accept="image/*" onChange={handleImage} style={{ ...inputStyle, padding: '9px' }} />
                {preview && <img src={preview} alt={t("preview")} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}><MapPin size={12} /> {t("Address")}</label>
              <input value={form.present_address} onChange={(e) => set('present_address', e.target.value)} placeholder={t("Address")} style={inputStyle} />
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

