import React, { useEffect, useState } from 'react';
import { List, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import staffApi from '../../api/staffApi';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { toList, today, money } from '../../utils/apiHelpers';

const inputStyle = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--label-color)', marginBottom: '6px' };

const StaffPaymentCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [staff, setStaff] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: today(),
    staff: '',
    account: '',
    category: '',
    amount: '',
    payment_type: 'Salary',
    description: '',
  });

  const loadLists = async () => {
    try {
      const [s, a, c] = await Promise.all([
        staffApi.getStaffList(),
        accountingService.getAccounts(),
        accountingService.getExpenseCategories(),
      ]);
      setStaff(toList(s));
      setAccounts(toList(a));
      setCategories(toList(c));
    } catch (e) {
      toast.error(e.message || 'Failed to load form data');
    }
  };

  useEffect(() => { loadLists(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selectedAccount = accounts.find((a) => String(a.id || a.uuid) === String(form.account));
  const selectedStaff = staff.find((s) => String(s.id || s.uuid) === String(form.staff));

  const handleAddCategory = async (name) => {
    try {
      const created = await accountingService.createExpenseCategory({ name });
      await loadLists();
      if (created?.id) set('category', created.id);
    } catch (e) {
      toast.error(e.message || 'Failed to add category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff) return toast.error('Select a staff');
    if (!form.account) return toast.error('Select an account');
    if (!form.category) return toast.error('Select an expense category');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');

    const payload = {
      type: 'cost',
      transaction_type: `Staff ${form.payment_type}`,
      staff: form.staff,
      account: form.account,
      category: form.category,
      amount: String(form.amount),
      description: form.description || `${selectedStaff?.name || 'Staff'} ${form.payment_type}`,
      date: form.date,
      status: 1,
    };

    try {
      setSaving(true);
      await accountingService.createExpense(payload);
      toast.success('Staff payment saved');
      navigate('/staff/payment/report');
    } catch (err) {
      toast.error(err.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <PrintHeader />
        <div className="premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>STAFF PAYMENT</h2>
          <button type="button" onClick={() => navigate('/staff/payment/report')} style={{ background: '#64748b', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <List size={14} /> Payment Report
          </button>
        </div>

        <form onSubmit={handleSubmit} className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Staff *</label>
              <select value={form.staff} onChange={(e) => set('staff', e.target.value)} style={inputStyle} required>
                <option value="">Select staff</option>
                {staff.map((s) => <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.name || s.full_name}{s.phone ? ` (${s.phone})` : ''}</option>)}
              </select>
              {selectedStaff?.salary !== undefined && selectedStaff?.salary !== null && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Monthly salary: ৳ {money(selectedStaff.salary)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Payment Type</label>
              <select value={form.payment_type} onChange={(e) => set('payment_type', e.target.value)} style={inputStyle}>
                {['Salary', 'Advance', 'Bonus', 'Overtime', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pay From Account *</label>
              <select value={form.account} onChange={(e) => set('account', e.target.value)} style={inputStyle} required>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id || a.uuid} value={a.id || a.uuid}>{a.name}</option>)}
              </select>
              {selectedAccount && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Balance: ৳ {money(selectedAccount.balance ?? selectedAccount.current_balance)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Expense Category *</label>
              <div style={{ display: 'flex' }}>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} style={{ ...inputStyle, borderRadius: '4px 0 0 4px', borderRight: 'none' }} required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setCategoryModal(true)} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 14px', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}><Plus size={18} /></button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Amount *</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" style={inputStyle} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Payment description in a short note" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', background: 'var(--success)', color: 'white', padding: '14px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Payment'}
          </button>
        </form>
      </div>

      <AddOptionModal isOpen={categoryModal} onClose={() => setCategoryModal(false)} onSave={handleAddCategory} title="Add Expense Category" label="Category Name" placeholder="e.g. Staff Salary" />
    </div>
  );
};

export default StaffPaymentCreate;
