const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update emptyForm
code = code.replace(/const emptyForm = \{[\s\S]*?\};/, `const emptyForm = {
  full_name: '',
  phone_number: '',
  weekly_salary: '',
  monthly_salary: '',
  joining_date: today(),
  status: 'active',
};`);

// 2. Update populateForm (Edit Mode)
const populateRegex = /setForm\(\{[\s\S]*?\}\);/;
const newPopulate = `setForm({
        full_name: s.full_name || user.full_name || s.name || '',
        phone_number: s.phone_number || user.phone_number || s.phone || '',
        weekly_salary: s.weekly_salary ?? '',
        monthly_salary: s.monthly_salary ?? s.basic_salary ?? s.salary ?? '',
        joining_date: s.joining_date ? String(s.joining_date).split('T')[0] : '',
        status: s.status === 'inactive' || s.status === false || s.status === 0 ? 'inactive' : 'active',
      });`;
code = code.replace(populateRegex, newPopulate);

// 3. Remove username/password validation
code = code.replace(/if \(!id && !form\.username\.trim\(\)\) return toast\.error\(t\("Username is required \(used for staff login\)"\)\);/, '');
code = code.replace(/if \(!id && !form\.password\) return toast\.error\(t\("Password is required for a new staff"\)\);/, '');

// 4. Update payload creation
const payloadRegex = /const payloadData = \{[\s\S]*?\};\s*if \(form\.present_address\.trim\(\)\) \{[\s\S]*?if \(form\.password\) \{\s*payloadData\.password = form\.password;\s*\}/;
const newPayload = `const payloadData = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        weekly_salary: form.weekly_salary === '' ? '0.00' : Number(form.weekly_salary).toFixed(2),
        monthly_salary: form.monthly_salary === '' ? '0.00' : Number(form.monthly_salary).toFixed(2),
        joining_date: form.joining_date || today(),
        status: form.status || 'active',
      };`;
code = code.replace(payloadRegex, newPayload);

// 5. Update UI form
const formRegex = /<form onSubmit=\{handleSubmit\} className="premium-body" style=\{\{ background: 'white', padding: '24px' \}\}>[\s\S]*?<\/form>/;
const newFormUI = `<form onSubmit={handleSubmit} className="premium-body" style={{ background: 'white', padding: '24px' }}>
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
              <label style={labelStyle}><Banknote size={12} /> {t("Weekly Salary")}</label>
              <input type="number" min="0" step="0.01" value={form.weekly_salary} onChange={(e) => set('weekly_salary', e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Banknote size={12} /> {t("Monthly Salary")}</label>
              <input type="number" min="0" step="0.01" value={form.monthly_salary} onChange={(e) => set('monthly_salary', e.target.value)} placeholder="0.00" style={inputStyle} />
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
        </form>`;
code = code.replace(formRegex, newFormUI);

fs.writeFileSync(filePath, code);
console.log("Updated StaffCreate UI");
