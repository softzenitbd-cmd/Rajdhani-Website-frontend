const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffPaymentCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /\{selectedStaff && \([\s\S]*?<div style=\{\{ marginBottom: '4px' \}\}>\{t\("Monthly Salary"\)\}: ৳ \{money\(selectedStaff\.basic_salary \|\| selectedStaff\.salary \|\| 0\)\}<\/div>[\s\S]*?<div style=\{\{ color: Number\(selectedStaff\.basic_salary \|\| selectedStaff\.salary \|\| 0\) - Number\(form\.amount \|\| 0\) < 0 \? '#ef4444' : '#10b981' \}\}>[\s\S]*?\{t\("Monthly Due"\)\}: ৳ \{money\(Number\(selectedStaff\.basic_salary \|\| selectedStaff\.salary \|\| 0\) - Number\(form\.amount \|\| 0\)\)\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}/;

const newStr = `{selectedStaff && (
                <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#0f172a', marginTop: '8px', fontWeight: '600', padding: '8px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: '4px' }}>{t("Monthly Salary")}: ৳ {money(selectedStaff.monthly_salary || selectedStaff.basic_salary || selectedStaff.salary || 0)}</div>
                  <div style={{ marginBottom: '4px' }}>{t("Weekly Salary")}: ৳ {money(selectedStaff.weekly_salary || 0)}</div>
                  <div style={{ color: Number(selectedStaff.monthly_salary || selectedStaff.basic_salary || selectedStaff.salary || 0) - Number(form.amount || 0) < 0 ? '#ef4444' : '#10b981' }}>
                    {t("Monthly Due")}: ৳ {money(Number(selectedStaff.monthly_salary || selectedStaff.basic_salary || selectedStaff.salary || 0) - Number(form.amount || 0))}
                  </div>
                </div>
              )}`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync(filePath, code);
    console.log("Updated StaffPaymentCreate to show weekly salary");
} else {
    console.log("Could not find regex in StaffPaymentCreate");
}
