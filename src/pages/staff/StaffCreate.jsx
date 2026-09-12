import React, { useEffect, useState } from 'react';
import { List, User, Phone, Mail, MapPin, Banknote } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import staffApi from '../../api/staffApi';
import { useToast } from '../../context/ToastContext';
import { toList, today } from '../../utils/apiHelpers';

const inputStyle = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--label-color)', marginBottom: '6px' };

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  department: '',
  designation: '',
  salary: '',
  joining_date: today(),
  is_active: true,
};

const StaffCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    staffApi.getDepartments().then((r) => setDepartments(toList(r))).catch(() => {});
    staffApi.getDesignations().then((r) => setDesignations(toList(r))).catch(() => {});
  }, []);

  // Edit mode: preload the staff record
  useEffect(() => {
    if (!id) return;
    staffApi
      .getStaffList()
      .then((r) => {
        const s = toList(r).find((x) => String(x.id || x.uuid) === String(id));
        if (!s) return;
        setForm({
          name: s.name || s.full_name || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          department: s.department?.id || s.department || '',
          designation: s.designation?.id || s.designation || '',
          salary: s.salary ?? '',
          joining_date: s.joining_date ? String(s.joining_date).split('T')[0] : '',
          is_active: s.is_active ?? s.status ?? true,
        });
        if (s.image) setPreview(s.image);
      })
      .catch(() => {});
  }, [id]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Staff name is required');
    if (!form.phone.trim()) return toast.error('Phone number is required');

    let payload;
    if (image) {
      payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) payload.append(k, v);
      });
      payload.append('image', image);
    } else {
      payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v;
      });
    }

    try {
      setSaving(true);
      if (id) {
        await staffApi.updateStaff(id, payload);
        toast.success('Staff updated successfully');
      } else {
        await staffApi.createStaff(payload);
        toast.success('Staff added successfully');
      }
      navigate('/staff/list');
    } catch (err) {
      toast.error(err.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>{id ? 'EDIT STAFF' : 'STAFF CREATE'}</h2>
          <button type="button" onClick={() => navigate('/staff/list')} style={{ background: '#64748b', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <List size={14} /> Staff List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}><User size={12} /> Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Staff full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Phone size={12} /> Phone *</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Mail size={12} /> Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="optional" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)} style={inputStyle}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id || d.uuid} value={d.id || d.uuid}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Designation</label>
              <select value={form.designation} onChange={(e) => set('designation', e.target.value)} style={inputStyle}>
                <option value="">Select designation</option>
                {designations.map((d) => <option key={d.id || d.uuid} value={d.id || d.uuid}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}><Banknote size={12} /> Monthly Salary</label>
              <input type="number" min="0" step="0.01" value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Joining Date</label>
              <input type="date" value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.is_active ? '1' : '0'} onChange={(e) => set('is_active', e.target.value === '1')} style={inputStyle}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="file" accept="image/*" onChange={handleImage} style={{ ...inputStyle, padding: '9px' }} />
                {preview && <img src={preview} alt="preview" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}><MapPin size={12} /> Address</label>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Address" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', background: 'var(--success)', color: 'white', padding: '14px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : id ? 'Update Staff' : 'Add Staff'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffCreate;
